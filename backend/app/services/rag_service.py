from sqlalchemy.orm import Session

from app.models.document_embedding import DocumentEmbedding
from app.services.chunking_service import chunk_text
from app.services.embedding_service import generate_embedding


def embed_resume(
    db: Session,
    user_id: int,
    resume_id: int,
    resume_text: str
):
    # Remove existing embeddings for this resume
    db.query(DocumentEmbedding).filter(
        DocumentEmbedding.user_id == user_id,
        DocumentEmbedding.source_type == "resume",
        DocumentEmbedding.source_id == resume_id
    ).delete(synchronize_session=False)

    chunks = chunk_text(resume_text)

    for chunk in chunks:
        embedding = generate_embedding(chunk)

        document = DocumentEmbedding(
            user_id=user_id,
            source_type="resume",
            source_id=resume_id,
            content=chunk,
            embedding=embedding
        )

        db.add(document)

    db.commit()

    return {
        "message": "Resume embeddings created successfully",
        "resume_id": resume_id,
        "chunks_created": len(chunks)
    }