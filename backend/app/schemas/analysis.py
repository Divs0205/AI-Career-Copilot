from pydantic import BaseModel
from typing import List


class CareerAnalysis(BaseModel):
    skills: List[str]
    strengths: List[str]
    skill_gaps: List[str]
    suitable_roles: List[str]
    recommendations: List[str]