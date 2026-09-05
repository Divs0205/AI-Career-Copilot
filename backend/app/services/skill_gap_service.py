import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

from app.schemas.skill_gap import SkillGapResponse


load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def analyze_skill_gaps(
    resume_text: str,
    job_description: str
) -> SkillGapResponse:

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=f"""
You are an expert technical recruiter and career advisor.

Analyze the candidate's resume against the job description and identify
the most important skill gaps.

====================
CANDIDATE RESUME
====================
{resume_text}

====================
JOB DESCRIPTION
====================
{job_description}

====================
INSTRUCTIONS
====================

For every important skill required by the job that is missing or not
clearly demonstrated in the resume, provide:

1. skill:
   The missing skill or technology.

2. importance:
   Classify it as "High", "Medium", or "Low" based on how important
   it is to the job.

3. current_level:
   Describe the candidate's demonstrated level.
   Examples:
   - "Not demonstrated"
   - "Beginner"
   - "Intermediate"
   - "Advanced"

4. required_level:
   Estimate the level required by the job.
   Examples:
   - "Beginner"
   - "Intermediate"
   - "Advanced"

5. reason:
   Briefly explain why this is considered a skill gap.

6. learning_focus:
   Give a practical list of topics the candidate should learn to
   close this gap.

IMPORTANT RULES:

- Do not invent skills or experience for the candidate.
- Only identify genuine gaps based on the resume and job description.
- Do not list a skill as a gap if the resume clearly demonstrates it.
- Prioritize important job requirements.
- Keep the output concise and practical.
- Avoid duplicate skills.
- If there are no meaningful skill gaps, return an empty skill_gaps list.

Return only the structured JSON response requested by the schema.
""",
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=SkillGapResponse,
        ),
    )

    return SkillGapResponse.model_validate_json(response.text)