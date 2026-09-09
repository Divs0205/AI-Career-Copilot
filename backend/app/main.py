from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import health
from app.routes import users
from app.routes import auth
from app.routes import resumes
from app.routes import jobs
from app.routes import rag
from app.routes import conversations
from app.routes import interviews

from app.models.resume import Resume

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
app.include_router(conversations.router)
app.include_router(interviews.router)