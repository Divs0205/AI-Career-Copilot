from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class LearningPlan(Base):
    __tablename__ = "learning_plans"

    id = Column(Integer, primary_key=True, index=True)

    job_id = Column(
        Integer,
        ForeignKey("jobs.id"),
        nullable=False
    )

    resume_id = Column(
        Integer,
        ForeignKey("resumes.id"),
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    skill = Column(String, nullable=False)

    priority = Column(String, nullable=False)

    goal = Column(Text, nullable=False)

    topic = Column(String, nullable=False)

    description = Column(Text, nullable=False)

    estimated_hours = Column(Float, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )