from datetime import date as date_cls

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.challenge import Challenge, TestCase
from app.models.user import User
from app.schemas.challenge import (
    ChallengePublic,
    DailyChallengeOut,
    Difficulty,
    GenerateChallengeRequest,
    TestCasePublic,
)
from app.services.challenge_generator import generate_with_llm, get_or_create_daily_challenge

router = APIRouter()


def _to_public(challenge: Challenge, db: Session) -> ChallengePublic:
    sample = db.scalars(
        select(TestCase)
        .where(TestCase.challenge_id == challenge.id, TestCase.is_hidden.is_(False))
        .order_by(TestCase.id)
        .limit(3)
    ).all()
    return ChallengePublic(
        id=challenge.id,
        slug=challenge.slug,
        title=challenge.title,
        prompt=challenge.prompt,
        difficulty=challenge.difficulty,  # type: ignore[arg-type]
        starter_code=challenge.starter_code,
        language=challenge.language,
        tags=challenge.tags,
        source=challenge.source,
        sample_test_cases=[TestCasePublic.model_validate(t) for t in sample],
    )


@router.get("/today", response_model=DailyChallengeOut)
def todays_challenge(
    difficulty: Difficulty = Query("medium"),
    db: Session = Depends(get_db),
):
    today = date_cls.today()
    challenge = get_or_create_daily_challenge(db, challenge_date=today, difficulty=difficulty)
    return DailyChallengeOut(
        challenge_date=today,
        difficulty=difficulty,
        challenge=_to_public(challenge, db),
    )


@router.get("/{slug}", response_model=ChallengePublic)
def get_challenge(slug: str, db: Session = Depends(get_db)):
    challenge = db.scalar(select(Challenge).where(Challenge.slug == slug))
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return _to_public(challenge, db)


@router.post("/generate", response_model=ChallengePublic, status_code=201)
def generate_challenge(
    payload: GenerateChallengeRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """On-demand LLM generation. Useful for practice / custom topics."""
    challenge = generate_with_llm(
        db,
        difficulty=payload.difficulty,
        topic=payload.topic,
        language=payload.language,
    )
    return _to_public(challenge, db)
