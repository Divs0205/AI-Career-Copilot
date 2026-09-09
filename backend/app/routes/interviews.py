from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user

from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job
from app.models.interview import Interview
from app.models.interview_question import InterviewQuestion

from app.schemas.interview import (
    InterviewCreate,
    InterviewResponse,
    InterviewAnswer,
    InterviewEvaluation,
)

from app.services.interview_service import (
    generate_interview_question,
    generate_next_interview_question,
    evaluate_interview_answer,
)


router = APIRouter(
    prefix="/interviews",
    tags=["Interviews"],
)


# Start a new interview
@router.post("/", response_model=InterviewResponse)
def start_interview(
    interview_data: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = (
        db.query(Resume)
        .filter(
            Resume.id == interview_data.resume_id,
            Resume.user_id == current_user.id,
        )
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found",
        )

    if not resume.extracted_text:
        raise HTTPException(
            status_code=400,
            detail="Resume does not contain extracted text",
        )

    job = None

    if interview_data.job_id:
        job = (
            db.query(Job)
            .filter(
                Job.id == interview_data.job_id,
                Job.user_id == current_user.id,
            )
            .first()
        )

        if not job:
            raise HTTPException(
                status_code=404,
                detail="Job not found",
            )

    allowed_modes = {
        "HR",
        "Technical",
        "DSA",
        "AI/ML",
    }

    if interview_data.mode not in allowed_modes:
        raise HTTPException(
            status_code=400,
            detail="Invalid interview mode. Choose HR, Technical, DSA, or AI/ML.",
        )

    interview = Interview(
        user_id=current_user.id,
        resume_id=resume.id,
        job_id=job.id if job else None,
        mode=interview_data.mode,
        status="active",
    )

    db.add(interview)
    db.commit()
    db.refresh(interview)

    job_description = job.description if job else None

    question_text = generate_interview_question(
        mode=interview.mode,
        resume_text=resume.extracted_text,
        job_description=job_description,
    )

    question = InterviewQuestion(
        interview_id=interview.id,
        question_number=1,
        question=question_text,
    )

    db.add(question)
    db.commit()
    db.refresh(question)

    interview.questions = [question]

    return interview


# Get interview history
@router.get("/", response_model=list[InterviewResponse])
def get_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interviews = (
        db.query(Interview)
        .filter(Interview.user_id == current_user.id)
        .order_by(Interview.created_at.desc())
        .all()
    )

    for interview in interviews:
        interview.questions = (
            db.query(InterviewQuestion)
            .filter(
                InterviewQuestion.interview_id == interview.id
            )
            .order_by(InterviewQuestion.question_number)
            .all()
        )

    return interviews


# Submit an answer
@router.post(
    "/{interview_id}/questions/{question_id}/answer",
    response_model=InterviewEvaluation,
)
def submit_answer(
    interview_id: int,
    question_id: int,
    answer_data: InterviewAnswer,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id,
            Interview.user_id == current_user.id,
        )
        .first()
    )

    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found",
        )

    if interview.status != "active":
        raise HTTPException(
            status_code=400,
            detail="Interview is no longer active",
        )

    question = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.id == question_id,
            InterviewQuestion.interview_id == interview.id,
        )
        .first()
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Interview question not found",
        )

    if not answer_data.answer.strip():
        raise HTTPException(
            status_code=400,
            detail="Answer cannot be empty",
        )

    resume = (
        db.query(Resume)
        .filter(
            Resume.id == interview.resume_id,
            Resume.user_id == current_user.id,
        )
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found",
        )

    job_description = None

    if interview.job_id:
        job = (
            db.query(Job)
            .filter(
                Job.id == interview.job_id,
                Job.user_id == current_user.id,
            )
            .first()
        )

        if job:
            job_description = job.description

    # Evaluate the candidate's answer
    evaluation = evaluate_interview_answer(
        mode=interview.mode,
        question=question.question,
        answer=answer_data.answer,
        resume_text=resume.extracted_text or "",
        job_description=job_description,
    )

    # Store the answer and evaluation
    question.answer = answer_data.answer
    question.score = evaluation.score
    question.feedback = evaluation.feedback

    db.commit()

    # Get all previous questions and answers
    previous_questions = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.interview_id == interview.id
        )
        .order_by(InterviewQuestion.question_number)
        .all()
    )

    history = ""

    for previous in previous_questions:
        history += f"""
Question {previous.question_number}:
{previous.question}

Candidate Answer:
{previous.answer or "Not answered"}

Score:
{previous.score if previous.score is not None else "Not evaluated"}

Feedback:
{previous.feedback or "No feedback"}
"""

   # Maximum number of questions in one interview
    MAX_QUESTIONS = 5

    current_question_number = question.question_number

    # If Question 5 has just been answered, do not generate another question.
    if current_question_number >= MAX_QUESTIONS:
        return InterviewEvaluation(
            score=evaluation.score,
            feedback=evaluation.feedback,
            next_question=None,
            next_question_id=None,
            next_question_number=None,
        )

    # Generate the next question
    next_question_text = generate_next_interview_question(
        mode=interview.mode,
        resume_text=resume.extracted_text or "",
        previous_questions=history,
        job_description=job_description,
    )

    next_question = InterviewQuestion(
        interview_id=interview.id,
        question_number=current_question_number + 1,
        question=next_question_text,
    )

    db.add(next_question)
    db.commit()
    db.refresh(next_question)

    return InterviewEvaluation(
        score=evaluation.score,
        feedback=evaluation.feedback,
        next_question=next_question.question,
        next_question_id=next_question.id,
        next_question_number=next_question.question_number,
    )


# Complete interview
@router.post("/{interview_id}/complete", response_model=InterviewResponse)
def complete_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id,
            Interview.user_id == current_user.id,
        )
        .first()
    )

    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found",
        )

    questions = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.interview_id == interview.id
        )
        .all()
    )

    scored_questions = [
        question
        for question in questions
        if question.score is not None
    ]

    if scored_questions:
        interview.score = round(
            sum(question.score for question in scored_questions)
            / len(scored_questions)
        )
    else:
        interview.score = 0

    interview.status = "completed"

    db.commit()
    db.refresh(interview)

    interview.questions = questions

    return interview

@router.post("/{interview_id}/cancel")
def cancel_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id,
            Interview.user_id == current_user.id,
        )
        .first()
    )

    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found.",
        )

    if interview.status == "completed":
        raise HTTPException(
            status_code=400,
            detail="Completed interviews cannot be cancelled.",
        )

    interview.status = "cancelled"

    db.commit()
    db.refresh(interview)

    questions = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.interview_id == interview.id
        )
        .order_by(InterviewQuestion.question_number.asc())
        .all()
    )

    interview.questions = questions

    return interview