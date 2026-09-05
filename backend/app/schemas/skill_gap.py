from pydantic import BaseModel
from typing import List


class SkillGap(BaseModel):
    skill: str
    importance: str
    current_level: str
    required_level: str
    reason: str
    learning_focus: List[str]


class SkillGapResponse(BaseModel):
    skill_gaps: List[SkillGap]