from datetime import date as date_cls

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.challenge import Challenge, TestCase
from app.models.submission import Submission
from app.models.user import User
from app.schemas.submission import SubmissionCreate, SubmissionResult
from app.services import code_executor, streak_service

router = APIRouter()


@router.post("", response_model=SubmissionResult, status_code=201)
def submit(
    payload: SubmissionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    challenge = db.get(Challenge, payload.challenge_id)
    if not challenge or not challenge.is_active:
        raise HTTPException(status_code=404, detail="Challenge not found")

    test_cases = db.scalars(
        select(TestCase).where(TestCase.challenge_id == challenge.id)
    ).all()
    tcs = [
        {"stdin": t.stdin, "expected_stdout": t.expected_stdout, "is_hidden": t.is_hidden}
        for t in test_cases
    ]

    report = code_executor.execute(
        language=payload.language,
        code=payload.code,
        test_cases=tcs,
    )

    score = 0
    if report.status == "accepted":
        score = streak_service.apply_accepted_submission(
            db, user=user, difficulty=challenge.difficulty, today=date_cls.today()
        )

    submission = Submission(
        user_id=user.id,
        challenge_id=challenge.id,
        language=payload.language,
        code=payload.code,
        status=report.status,
        passed_count=report.passed_count,
        total_count=report.total_count,
        runtime_ms=report.runtime_ms,
        score_awarded=score,
        stderr=report.stderr,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission
