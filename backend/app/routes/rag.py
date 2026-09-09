from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user

from app.models.resume import Resume
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message

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
    conversation = db.query(Conversation).filter(
        Conversation.id == question_data.conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found"
        )

    resume = db.query(Resume).filter(
        Resume.id == question_data.resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    # Save the user's question
    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=question_data.question
    )

    db.add(user_message)
    db.commit()
    if not conversation.title:
        conversation.title = question_data.question[:60]
        db.commit()

    conversation_history = db.query(Message).filter(
        Message.conversation_id == conversation.id
        ).order_by(
        Message.created_at.asc()
        ).all()

    history_text = "\n".join(
        f"{message.role}: {message.content}"
        for message in conversation_history
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
        context=f"""
        RESUME INFORMATION:
        {context}

        CONVERSATION HISTORY:
        {history_text}
        """       
    )

    # Save the AI answer
    assistant_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=answer
    )

    db.add(assistant_message)
    db.commit()

    return RAGAnswer(
        question=question_data.question,
        answer=answer
    )