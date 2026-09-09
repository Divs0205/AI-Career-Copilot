import os

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.resume import Resume
from app.models.resume_analysis import ResumeAnalysis
from app.models.user import User
from app.schemas.analysis import CareerAnalysis
from app.services.pdf_service import extract_text_from_pdf
from app.services.ai_service import analyze_resume
from app.services.rag_service import embed_resume

router = APIRouter(
    prefix="/resumes",
    tags=["Resumes"]
)

@router.get("/")
def get_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resumes = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Resume.id.desc()).all()

    return [
        {
            "id": resume.id,
            "filename": resume.filename,
            "uploaded_at": resume.uploaded_at
        }
        for resume in resumes
    ]

UPLOAD_DIR = "uploads/resumes"

os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )

    file_path = os.path.join(
        UPLOAD_DIR,
        file.filename
    )

    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    extracted_text = extract_text_from_pdf(file_path)

    resume = Resume(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        extracted_text=extracted_text
    )

    db.add(resume)
    db.commit()
    db.refresh(resume)
    embed_result = embed_resume(
        db=db,
        user_id=current_user.id,
        resume_id=resume.id,
        resume_text=resume.extracted_text
    )

    return {
        "message": "Resume uploaded successfully",
        "resume_id": resume.id,
        "filename": resume.filename,
        "user_id": current_user.id,
        "text_extracted": bool(extracted_text),
        "text_preview": extracted_text[:200],
        "embeddings_created": True,
        "chunks_created": embed_result["chunks_created"]
    }


@router.post("/{resume_id}/analyze", response_model=CareerAnalysis)
def analyze_resume_endpoint(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
            detail="No extracted text found for this resume"
        )

    # Send resume text to Gemini
    analysis = analyze_resume(resume.extracted_text)

    # Save the AI analysis to the database
    resume_analysis = ResumeAnalysis(
        resume_id=resume.id,
        user_id=current_user.id,
        skills=analysis.skills,
        strengths=analysis.strengths,
        skill_gaps=analysis.skill_gaps,
        suitable_roles=analysis.suitable_roles,
        recommendations=analysis.recommendations
    )

    db.add(resume_analysis)
    db.commit()
    db.refresh(resume_analysis)

    return analysis

@router.get("/{resume_id}/analysis", response_model=CareerAnalysis)
def get_resume_analysis(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    analysis = db.query(ResumeAnalysis).filter(
        ResumeAnalysis.resume_id == resume_id,
        ResumeAnalysis.user_id == current_user.id
    ).order_by(ResumeAnalysis.id.desc()).first()

    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="No analysis found for this resume"
        )

    return CareerAnalysis(
        skills=analysis.skills,
        strengths=analysis.strengths,
        skill_gaps=analysis.skill_gaps,
        suitable_roles=analysis.suitable_roles,
        recommendations=analysis.recommendations
    )

@router.post("/{resume_id}/embed")
def embed_resume_endpoint(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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

    result = embed_resume(
        db=db,
        user_id=current_user.id,
        resume_id=resume.id,
        resume_text=resume.extracted_text
    )

    return result