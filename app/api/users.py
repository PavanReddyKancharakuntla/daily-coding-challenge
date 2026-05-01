from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.submission import Submission
from app.models.user import User
from app.schemas.submission import SubmissionResult
from app.schemas.user import UserPublic

router = APIRouter()


@router.get("", response_model=UserPublic)
def me(user: User = Depends(get_current_user)):
    return user


@router.get("/submissions", response_model=list[SubmissionResult])
def my_submissions(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
):
    rows = db.scalars(
        select(Submission)
        .where(Submission.user_id == user.id)
        .order_by(Submission.submitted_at.desc())
        .limit(limit)
    ).all()
    return rows
