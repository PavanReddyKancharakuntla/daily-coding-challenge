"""Streak + scoring rules for the daily challenge.

- Score per accepted submission depends on difficulty.
- A user advances their streak only on the FIRST accepted submission of a
  given calendar day. Repeats on the same day don't double-count.
- Streak resets if the user skips a day.
"""

from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models.user import User

DIFFICULTY_POINTS = {
    "easy": 10,
    "medium": 25,
    "hard": 50,
}


def points_for(difficulty: str) -> int:
    return DIFFICULTY_POINTS.get(difficulty, 10)


def apply_accepted_submission(
    db: Session,
    *,
    user: User,
    difficulty: str,
    today: date,
) -> int:
    """Update streak/score on the user when a submission is accepted.

    Returns the score awarded for this submission (0 if the user already
    received daily credit for `today`).
    """
    base_points = points_for(difficulty)

    if user.last_solved_date == today:
        # Already counted today — no streak change, no points.
        return 0

    # Streak update
    if user.last_solved_date == today - timedelta(days=1):
        user.current_streak += 1
    else:
        user.current_streak = 1

    if user.current_streak > user.longest_streak:
        user.longest_streak = user.current_streak

    # Streak bonus: +1 point per day in the current streak, capped at 25.
    bonus = min(user.current_streak, 25)
    awarded = base_points + bonus

    user.total_score += awarded
    user.last_solved_date = today

    db.add(user)
    db.commit()
    db.refresh(user)
    return awarded
