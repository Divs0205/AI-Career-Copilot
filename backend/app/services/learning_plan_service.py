import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

from app.schemas.learning_plan import LearningPlanResponse


load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def generate_learning_plan(
    resume_text: str,
    job_description: str,
    skill_gaps: list
) -> LearningPlanResponse:

    gaps_text = "\n".join(
        [
            f"- {gap.skill} | Importance: {gap.importance} | "
            f"Current Level: {gap.current_level} | "
            f"Required Level: {gap.required_level}"
            for gap in skill_gaps
        ]
    )

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=f"""
You are an expert career coach and technical learning advisor.

Create a personalized learning plan for a candidate who wants to
become more suitable for a specific job.

====================
CANDIDATE RESUME
====================
{resume_text}

====================
JOB DESCRIPTION
====================
{job_description}

====================
IDENTIFIED SKILL GAPS
====================
{gaps_text}

====================
INSTRUCTIONS
====================

For each important skill gap, create a practical learning plan.

For every plan provide:

1. skill:
   The skill that needs improvement.

2. priority:
   Use "High", "Medium", or "Low".
   Base this primarily on the importance of the skill to the job.

3. goal:
   Give a clear outcome the candidate should achieve after
   completing the learning plan.

4. items:
   Provide a logical sequence of learning topics.

For every learning item provide:

- topic:
  The specific concept or technology to learn.

- description:
  Briefly explain what the candidate should learn or practice.

- estimated_hours:
  Give a realistic estimate of the number of hours needed.

IMPORTANT RULES:

- Base the plan on the identified skill gaps.
- Do not create plans for skills that are already clearly demonstrated.
- Do not invent candidate experience.
- Prioritize skills that are important for the target job.
- Start with fundamentals when the current level is "Not demonstrated"
  or "Beginner".
- Progress toward practical, job-ready skills.
- Include hands-on learning where appropriate.
- Keep the plan realistic for a student or early-career candidate.
- Avoid unnecessary topics.
- Do not recommend learning everything at once.
- Keep each learning plan concise and actionable.
- If there are no meaningful skill gaps, return an empty plans list.

Return only the structured JSON response requested by the schema.
""",
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=LearningPlanResponse,
        ),
    )

    return LearningPlanResponse.model_validate_json(response.text)