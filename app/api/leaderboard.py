from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.submission import LeaderboardEntry

router = APIRouter()


@router.get("", response_model=list[LeaderboardEntry])
def leaderboard(
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    by: str = Query("score", pattern="^(score|streak)$"),
):
    if by == "streak":
        order = User.current_streak.desc()
    else:
        order = User.total_score.desc()

    rows = db.scalars(select(User).order_by(order, User.id.asc()).limit(limit)).all()
    return [
        LeaderboardEntry(
            user_id=u.id,
            username=u.username,
            total_score=u.total_score,
            current_streak=u.current_streak,
            longest_streak=u.longest_streak,
        )
        for u in rows
    ]
