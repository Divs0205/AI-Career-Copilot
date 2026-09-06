from sqlalchemy.orm import Session

from app.models.document_embedding import DocumentEmbedding
from app.services.embedding_service import generate_embedding


def search_resume(
    db: Session,
    user_id: int,
    resume_id: int,
    query: str,
    limit: int = 5
):
    query_embedding = generate_embedding(query)

    results = (
        db.query(DocumentEmbedding)
        .filter(
            DocumentEmbedding.user_id == user_id,
            DocumentEmbedding.source_type == "resume",
            DocumentEmbedding.source_id == resume_id
        )
        .order_by(
            DocumentEmbedding.embedding.cosine_distance(query_embedding)
        )
        .limit(limit)
        .all()
    )

    return results