from pydantic import BaseModel


class RAGQuestion(BaseModel):
    question: str
    resume_id: int
    conversation_id: int


class RAGAnswer(BaseModel):
    question: str
    answer: str