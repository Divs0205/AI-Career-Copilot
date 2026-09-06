from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from app.models.user import User

from app.core.database import Base


class DocumentEmbedding(Base):
    __tablename__ = "document_embeddings"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    source_type = Column(
        Text,
        nullable=False
    )

    source_id = Column(
        Integer,
        nullable=True
    )

    content = Column(
        Text,
        nullable=False
    )

    embedding = Column(
        Vector(768),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )