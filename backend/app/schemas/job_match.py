from pydantic import BaseModel
from typing import List


class JobMatchResponse(BaseModel):
    match_percentage: float
    matched_skills: List[str]
    missing_skills: List[str]
    recommendations: List[str]