import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

from app.schemas.analysis import CareerAnalysis

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def analyze_resume(resume_text: str) -> CareerAnalysis:
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=f"""
You are an AI career advisor.

Analyze the following resume and provide a professional career analysis.

Resume:
{resume_text}

Identify:
1. The candidate's technical and professional skills.
2. Their main strengths.
3. Important skill gaps.
4. Suitable job roles.
5. Practical career recommendations.
""",
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=CareerAnalysis,
        ),
    )

    return CareerAnalysis.model_validate_json(response.text)