from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user

from app.models.job import Job
from app.models.resume import Resume
from app.models.job_match import JobMatch
from app.models.skill_gap import SkillGap
from app.models.user import User

from app.schemas.job import JobCreate, JobResponse
from app.schemas.job_match import JobMatchResponse
from app.schemas.skill_gap import SkillGapResponse

from app.services.job_match_service import match_resume_to_job
from app.services.skill_gap_service import analyze_skill_gaps


router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"]
)


@router.post("/", response_model=JobResponse)
def create_job(
    job_data: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_job = Job(
        user_id=current_user.id,
        title=job_data.title,
        company=job_data.company,
        description=job_data.description
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return new_job


@router.get("/", response_model=list[JobResponse])
def get_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    jobs = db.query(Job).filter(
        Job.user_id == current_user.id
    ).all()

    return jobs

@router.post(
    "/{job_id}/match/{resume_id}",
    response_model=JobMatchResponse
)
def match_job_with_resume(
    job_id: int,
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    if not resume.extracted_text:
        raise HTTPException(
            status_code=400,
            detail="Resume has no extracted text"
        )

    analysis = match_resume_to_job(
        resume_text=resume.extracted_text,
        job_description=job.description
    )

    job_match = JobMatch(
        job_id=job.id,
        resume_id=resume.id,
        user_id=current_user.id,
        match_percentage=analysis.match_percentage,
        matched_skills=analysis.matched_skills,
        missing_skills=analysis.missing_skills,
        recommendations=analysis.recommendations
    )

    db.add(job_match)
    db.commit()
    db.refresh(job_match)

    return analysis

@router.post(
    "/{job_id}/skill-gaps/{resume_id}",
    response_model=SkillGapResponse
)
def generate_skill_gaps(
    job_id: int,
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    if not resume.extracted_text:
        raise HTTPException(
            status_code=400,
            detail="Resume has no extracted text"
        )

    analysis = analyze_skill_gaps(
        resume_text=resume.extracted_text,
        job_description=job.description
    )

    for gap in analysis.skill_gaps:
        skill_gap = SkillGap(
            job_id=job.id,
            resume_id=resume.id,
            user_id=current_user.id,
            skill=gap.skill,
            importance=gap.importance,
            current_level=gap.current_level,
            required_level=gap.required_level,
            reason=gap.reason,
            learning_focus=gap.learning_focus
        )

        db.add(skill_gap)

    db.commit()

    return analysis