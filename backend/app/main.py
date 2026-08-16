from fastapi import FastAPI

from app.routes import health
from app.routes import users
from app.models.user import User

app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "AI Career Copilot Backend is running!"
    }

app.include_router(health.router)
app.include_router(users.router)