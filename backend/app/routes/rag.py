from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.resume import Resume
from app.models.user import User
from app.schemas.rag import RAGQuestion, RAGAnswer
from app.services.search_service import search_resume
from app.services.rag_qa_service import generate_rag_answer


router = APIRouter(
    prefix="/rag",
    tags=["RAG"]
)


@router.post(
    "/ask",
    response_model=RAGAnswer
)
def ask_rag_question(
    question_data: RAGQuestion,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.id == question_data.resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    results = search_resume(
        db=db,
        user_id=current_user.id,
        resume_id=question_data.resume_id,
        query=question_data.question,
        limit=5
    )

    if not results:
        raise HTTPException(
            status_code=404,
            detail="No resume embeddings found"
        )

    context = "\n\n".join(
        result.content
        for result in results
    )

    answer = generate_rag_answer(
        question=question_data.question,
        context=context
    )

    return RAGAnswer(
        question=question_data.question,
        answer=answer
    )