"""Idempotently load the seed bank into the database.

Run with:  python -m app.seed.seed_db
"""

from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models.challenge import Challenge, TestCase  # noqa: F401  (registers model)
from app.models.submission import Submission  # noqa: F401
from app.models.user import User  # noqa: F401

SEED_PATH = Path(__file__).parent / "challenges.json"


def run() -> None:
    Base.metadata.create_all(bind=engine)

    with SEED_PATH.open() as f:
        items = json.load(f)

    with SessionLocal() as db:
        added = 0
        for item in items:
            existing = db.scalar(select(Challenge).where(Challenge.slug == item["slug"]))
            if existing:
                continue

            challenge = Challenge(
                slug=item["slug"],
                title=item["title"],
                prompt=item["prompt"],
                difficulty=item["difficulty"],
                starter_code=item.get("starter_code"),
                solution=item.get("solution"),
                language=item.get("language", "python"),
                tags=",".join(item.get("tags", [])) or None,
                source="seed",
                is_active=True,
            )
            db.add(challenge)
            db.flush()

            for tc in item.get("test_cases", []):
                db.add(
                    TestCase(
                        challenge_id=challenge.id,
                        stdin=tc.get("stdin", ""),
                        expected_stdout=tc.get("expected_stdout", ""),
                        is_hidden=bool(tc.get("is_hidden", False)),
                    )
                )
            added += 1

        db.commit()
        print(f"Seed complete. Added {added} new challenges. (Total in file: {len(items)})")


if __name__ == "__main__":
    run()
