from pydantic import BaseModel
from typing import Optional, List


class InterviewCreate(BaseModel):
    resume_id: int
    job_id: Optional[int] = None
    mode: str


class InterviewQuestionResponse(BaseModel):
    id: int
    question_number: int
    question: str
    answer: Optional[str] = None
    score: Optional[int] = None
    feedback: Optional[str] = None

    class Config:
        from_attributes = True


class InterviewResponse(BaseModel):
    id: int
    resume_id: int
    job_id: Optional[int] = None
    mode: str
    status: str
    score: Optional[int] = None
    questions: List[InterviewQuestionResponse] = []

    class Config:
        from_attributes = True


class InterviewAnswer(BaseModel):
    answer: str


class InterviewEvaluation(BaseModel):
    score: int
    feedback: str
    next_question: Optional[str] = None
    next_question_id: Optional[int] = None
    next_question_number: Optional[int] = None