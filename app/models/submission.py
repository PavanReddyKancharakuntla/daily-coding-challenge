from datetime import datetime

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    challenge_id: Mapped[int] = mapped_column(ForeignKey("challenges.id", ondelete="CASCADE"), index=True)

    language: Mapped[str] = mapped_column(String(32), default="python", nullable=False)
    code: Mapped[str] = mapped_column(Text, nullable=False)

    # Outcome
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)
    # pending | accepted | wrong_answer | runtime_error | compile_error | tle | error
    passed_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    runtime_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    score_awarded: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    stderr: Mapped[str | None] = mapped_column(Text, nullable=True)

    submitted_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="submissions")
    challenge = relationship("Challenge")
