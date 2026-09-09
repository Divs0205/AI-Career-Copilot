from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user

from app.models.conversation import Conversation
from app.models.message import Message
from app.models.resume import Resume
from app.models.user import User

from app.schemas.conversation import (
    ConversationCreate,
    ConversationResponse,
    MessageResponse,
)


router = APIRouter(
    prefix="/conversations",
    tags=["Conversations"]
)


@router.post(
    "/",
    response_model=ConversationResponse
)
def create_conversation(
    conversation_data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if conversation_data.resume_id is not None:
        resume = db.query(Resume).filter(
            Resume.id == conversation_data.resume_id,
            Resume.user_id == current_user.id
        ).first()

        if not resume:
            raise HTTPException(
                status_code=404,
                detail="Resume not found"
            )

    conversation = Conversation(
        user_id=current_user.id,
        resume_id=conversation_data.resume_id,
        title=conversation_data.title
    )

    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return conversation


@router.get(
    "/",
    response_model=list[ConversationResponse]
)
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversations = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(
        Conversation.created_at.desc()
    ).all()

    return conversations


@router.get(
    "/{conversation_id}/messages",
    response_model=list[MessageResponse]
)
def get_conversation_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found"
        )

    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(
        Message.created_at.asc()
    ).all()

    return messages