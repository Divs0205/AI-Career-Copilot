from pydantic import BaseModel


class JobCreate(BaseModel):
    title: str
    company: str | None = None
    description: str


class JobResponse(BaseModel):
    id: int
    user_id: int
    title: str
    company: str | None
    description: str

    class Config:
        from_attributes = True