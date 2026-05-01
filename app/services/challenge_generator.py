"""Hybrid challenge generator.

Strategy:
1. Try to read from the seeded `challenges` table.
2. For a given (date, difficulty) combo, pin a `DailyChallenge` row so the same
   challenge is returned for the rest of the day.
3. If no seed challenge is available for that difficulty, fall back to the LLM
   (Anthropic) which produces a fresh challenge with test cases on demand.
"""

from __future__ import annotations

import json
import logging
import random
import re
from datetime import date
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.challenge import Challenge, DailyChallenge, TestCase

logger = logging.getLogger(__name__)
settings = get_settings()


SLUG_RE = re.compile(r"[^a-z0-9]+")


def slugify(text: str) -> str:
    return SLUG_RE.sub("-", text.lower()).strip("-")[:100] or "challenge"


def get_or_create_daily_challenge(
    db: Session,
    *,
    challenge_date: date,
    difficulty: str,
) -> Challenge:
    """Return today's pinned challenge for a difficulty, creating the pin if missing."""
    pinned = db.scalar(
        select(DailyChallenge).where(
            DailyChallenge.challenge_date == challenge_date,
            DailyChallenge.difficulty == difficulty,
        )
    )
    if pinned:
        return pinned.challenge

    # Pick a random unused-recently challenge from the seed bank.
    used_ids_subq = select(DailyChallenge.challenge_id).scalar_subquery()
    candidate = db.scalar(
        select(Challenge)
        .where(
            Challenge.difficulty == difficulty,
            Challenge.is_active.is_(True),
            ~Challenge.id.in_(used_ids_subq),
        )
        .order_by(func.random())
        .limit(1)
    )

    # If we ran out of unused, just pick any active one for this difficulty.
    if not candidate:
        candidate = db.scalar(
            select(Challenge)
            .where(
                Challenge.difficulty == difficulty,
                Challenge.is_active.is_(True),
            )
            .order_by(func.random())
            .limit(1)
        )

    # Last resort: ask the LLM to make one.
    if not candidate:
        logger.info("No seeded challenge for %s — generating via LLM", difficulty)
        candidate = generate_with_llm(db, difficulty=difficulty)

    pin = DailyChallenge(
        challenge_date=challenge_date,
        difficulty=difficulty,
        challenge_id=candidate.id,
    )
    db.add(pin)
    db.commit()
    return candidate


def generate_with_llm(
    db: Session,
    *,
    difficulty: str,
    topic: str | None = None,
    language: str = "python",
) -> Challenge:
    """Generate a fresh challenge via the Anthropic API and persist it."""
    payload = _call_anthropic(difficulty=difficulty, topic=topic, language=language)

    challenge = Challenge(
        slug=_unique_slug(db, slugify(payload["title"])),
        title=payload["title"],
        prompt=payload["prompt"],
        difficulty=difficulty,
        starter_code=payload.get("starter_code"),
        solution=payload.get("solution"),
        language=language,
        tags=",".join(payload.get("tags", [])) or None,
        source="llm",
        is_active=True,
    )
    db.add(challenge)
    db.flush()

    for tc in payload.get("test_cases", []):
        db.add(
            TestCase(
                challenge_id=challenge.id,
                stdin=tc.get("stdin", ""),
                expected_stdout=tc.get("expected_stdout", ""),
                is_hidden=bool(tc.get("is_hidden", False)),
            )
        )
    db.commit()
    db.refresh(challenge)
    return challenge


def _unique_slug(db: Session, base: str) -> str:
    slug = base
    n = 1
    while db.scalar(select(Challenge).where(Challenge.slug == slug)):
        n += 1
        slug = f"{base}-{n}"
    return slug


def _call_anthropic(
    *, difficulty: str, topic: str | None, language: str
) -> dict[str, Any]:
    """Call Anthropic Messages API and parse a structured challenge payload."""
    if not settings.anthropic_api_key:
        # Offline fallback so the service is still useful in dev/tests.
        return _offline_stub(difficulty, topic, language)

    try:
        from anthropic import Anthropic
    except ImportError:  # pragma: no cover
        return _offline_stub(difficulty, topic, language)

    client = Anthropic(api_key=settings.anthropic_api_key)

    topic_clause = f" The challenge should focus on the topic: {topic}." if topic else ""
    system = (
        "You are an experienced competitive-programming author. "
        "Produce a clear, self-contained coding challenge with test cases. "
        "Return ONLY valid JSON, no prose, no markdown fences."
    )
    user = f"""Generate a {difficulty} coding challenge in {language}.{topic_clause}

Return JSON exactly matching this schema:
{{
  "title": "string",
  "prompt": "string with full problem statement, input/output spec, constraints, and examples",
  "starter_code": "string with function signature and a TODO body",
  "solution": "string with a correct reference solution",
  "tags": ["array", "of", "topic", "tags"],
  "test_cases": [
    {{ "stdin": "string", "expected_stdout": "string", "is_hidden": false }}
  ]
}}

Include 4-6 test cases, at least one hidden. Test cases use stdin/stdout only.
"""

    msg = client.messages.create(
        model=settings.anthropic_model,
        max_tokens=2000,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    text = "".join(block.text for block in msg.content if getattr(block, "type", None) == "text")
    return _parse_json_payload(text)


def _parse_json_payload(text: str) -> dict[str, Any]:
    text = text.strip()
    # Strip fences if the model added them anyway.
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n", "", text)
        text = re.sub(r"\n```$", "", text)
    return json.loads(text)


def _offline_stub(difficulty: str, topic: str | None, language: str) -> dict[str, Any]:
    """Minimal deterministic challenge used when no LLM key is set."""
    suffix = topic or random.choice(["array", "string", "number"])
    title = f"Sum of {suffix.capitalize()} Inputs ({difficulty})"
    return {
        "title": title,
        "prompt": (
            "Read integers from stdin (one per line) until EOF and print their sum.\n\n"
            "Input:\nA series of integers, one per line.\n\n"
            "Output:\nA single integer: the sum."
        ),
        "starter_code": "import sys\n\ndef main():\n    # TODO: implement\n    pass\n\nif __name__ == '__main__':\n    main()\n",
        "solution": "import sys\nprint(sum(int(x) for x in sys.stdin.read().split()))\n",
        "tags": ["math", "io", suffix],
        "test_cases": [
            {"stdin": "1\n2\n3\n", "expected_stdout": "6", "is_hidden": False},
            {"stdin": "10\n-4\n", "expected_stdout": "6", "is_hidden": False},
            {"stdin": "0\n", "expected_stdout": "0", "is_hidden": True},
            {"stdin": "5\n5\n5\n5\n", "expected_stdout": "20", "is_hidden": True},
        ],
    }
