import os

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.resume import Resume
from app.models.user import User


router = APIRouter(
    prefix="/resumes",
    tags=["Resumes"]
)


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

    resume = Resume(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path
    )

    db.add(resume)
    db.commit()
    db.refresh(resume)

    return {
        "message": "Resume uploaded successfully",
        "resume_id": resume.id,
        "filename": resume.filename,
        "user_id": current_user.id
    }