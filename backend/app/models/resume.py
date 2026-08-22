from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)

    uploaded_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )