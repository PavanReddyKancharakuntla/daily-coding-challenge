from datetime import datetime

from pydantic import BaseModel, Field


class SubmissionCreate(BaseModel):
    challenge_id: int
    language: str = "python"
    code: str = Field(min_length=1)


class SubmissionResult(BaseModel):
    id: int
    challenge_id: int
    status: str
    passed_count: int
    total_count: int
    runtime_ms: float | None
    score_awarded: int
    stderr: str | None
    submitted_at: datetime

    model_config = {"from_attributes": True}


class LeaderboardEntry(BaseModel):
    user_id: int
    username: str
    total_score: int
    current_streak: int
    longest_streak: int

    model_config = {"from_attributes": True}
