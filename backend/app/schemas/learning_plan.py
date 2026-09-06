from pydantic import BaseModel
from typing import List


class LearningItem(BaseModel):
    topic: str
    description: str
    estimated_hours: float


class LearningPlan(BaseModel):
    skill: str
    priority: str
    goal: str
    items: List[LearningItem]


class LearningPlanResponse(BaseModel):
    plans: List[LearningPlan]