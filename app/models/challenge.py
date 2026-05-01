from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[str] = mapped_column(String(16), nullable=False)  # easy/medium/hard
    starter_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    solution: Mapped[str | None] = mapped_column(Text, nullable=True)
    language: Mapped[str] = mapped_column(String(32), default="python", nullable=False)
    tags: Mapped[str | None] = mapped_column(String(255), nullable=True)  # csv tags
    source: Mapped[str] = mapped_column(String(16), default="seed", nullable=False)  # seed | llm
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    test_cases = relationship("TestCase", back_populates="challenge", cascade="all, delete-orphan")
    daily_assignments = relationship("DailyChallenge", back_populates="challenge")


class TestCase(Base):
    __tablename__ = "test_cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    challenge_id: Mapped[int] = mapped_column(ForeignKey("challenges.id", ondelete="CASCADE"))
    stdin: Mapped[str] = mapped_column(Text, default="")
    expected_stdout: Mapped[str] = mapped_column(Text, default="")
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    challenge = relationship("Challenge", back_populates="test_cases")


class DailyChallenge(Base):
    """Pins one challenge per (date, difficulty)."""

    __tablename__ = "daily_challenges"
    __table_args__ = (
        UniqueConstraint("challenge_date", "difficulty", name="uq_daily_date_difficulty"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    challenge_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    difficulty: Mapped[str] = mapped_column(String(16), nullable=False)
    challenge_id: Mapped[int] = mapped_column(ForeignKey("challenges.id", ondelete="CASCADE"))

    challenge = relationship("Challenge", back_populates="daily_assignments")
