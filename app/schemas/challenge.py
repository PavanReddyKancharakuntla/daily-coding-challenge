from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


Difficulty = Literal["easy", "medium", "hard"]


class TestCasePublic(BaseModel):
    id: int
    stdin: str
    expected_stdout: str

    model_config = {"from_attributes": True}


class ChallengePublic(BaseModel):
    id: int
    slug: str
    title: str
    prompt: str
    difficulty: Difficulty
    starter_code: str | None
    language: str
    tags: str | None
    source: str
    sample_test_cases: list[TestCasePublic] = []

    model_config = {"from_attributes": True}


class DailyChallengeOut(BaseModel):
    challenge_date: date
    difficulty: Difficulty
    challenge: ChallengePublic


class GenerateChallengeRequest(BaseModel):
    difficulty: Difficulty = "medium"
    topic: str | None = Field(default=None, description="Optional topic hint, e.g. 'arrays', 'dp'")
    language: str = "python"
