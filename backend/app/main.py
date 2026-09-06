from fastapi import FastAPI

from app.routes import health
from app.routes import users
from app.routes import auth
from app.routes import resumes
from app.routes import jobs
from app.routes import rag

from app.models.resume import Resume

app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "AI Career Copilot Backend is running!"
    }

app.include_router(health.router)
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(resumes.router)
app.include_router(jobs.router)
app.include_router(rag.router)