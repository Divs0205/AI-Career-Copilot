import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

from app.schemas.job_match import JobMatchResponse


load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def match_resume_to_job(
    resume_text: str,
    job_description: str
) -> JobMatchResponse:

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=f"""
You are an expert technical recruiter and AI career advisor.

Your task is to compare a candidate's resume against a job description
and determine how well the candidate matches the job.

====================
CANDIDATE RESUME
====================
{resume_text}

====================
JOB DESCRIPTION
====================
{job_description}

====================
MATCHING RULES
====================

1. Identify the important technical and professional skills explicitly
   mentioned or clearly demonstrated in the candidate's resume.

2. Identify the important skills and technologies required by the job.

3. matched_skills:
   Include only skills that are clearly present in the resume AND
   relevant to the job requirements.

4. missing_skills:
   Include important job requirements that are not present or clearly
   demonstrated in the resume.

5. Do NOT assume that the candidate has a skill simply because the job
   description mentions it.

6. Do NOT invent skills, technologies, tools, certifications, or
   experience that are not supported by the resume.

7. If two technologies are genuinely equivalent or closely related,
   you may consider them a match, but only when the relationship is
   reasonable. Do not treat unrelated technologies as equivalent.

8. Calculate match_percentage based primarily on how many important
   job requirements are supported by the resume.

9. The match percentage should normally be between 0 and 100 and should
   reflect the evidence in the resume.

10. recommendations:
    Give practical recommendations based specifically on the missing
    skills. Do not recommend learning a skill that is already clearly
    demonstrated in the resume.

11. If the resume contains little or no relevant technical experience,
    a low match percentage is acceptable.

12. Keep matched_skills and missing_skills concise. Avoid duplicates.

Return ONLY the structured JSON response requested by the schema.
""",
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=JobMatchResponse,
        ),
    )

    return JobMatchResponse.model_validate_json(response.text)