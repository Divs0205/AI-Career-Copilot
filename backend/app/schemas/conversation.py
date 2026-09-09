from pydantic import BaseModel


class ConversationCreate(BaseModel):
    resume_id: int | None = None
    title: str | None = None


class ConversationResponse(BaseModel):
    id: int
    user_id: int
    resume_id: int | None
    title: str | None

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str

    class Config:
        from_attributes = True