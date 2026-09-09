import os
import time
from typing import Optional

from google import genai
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

MODEL_NAME = "gemini-3.6-flash"
MAX_RETRIES = 3


class GeneratedQuestion(BaseModel):
    question: str


class AnswerEvaluation(BaseModel):
    score: int
    feedback: str


def generate_with_retry(prompt: str, response_schema):
    """
    Call Gemini with automatic retry handling for temporary
    high-demand / service-unavailable errors.
    """

    last_error = None

    for attempt in range(MAX_RETRIES):
        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": response_schema,
                },
            )

            return response

        except Exception as e:
            last_error = e

            # Retry with exponential backoff
            if attempt < MAX_RETRIES - 1:
                wait_time = 2 ** attempt
                print(
                    f"Gemini request failed. "
                    f"Retrying in {wait_time} seconds..."
                )
                time.sleep(wait_time)

    raise last_error


def generate_interview_question(
    mode: str,
    resume_text: str,
    job_description: Optional[str] = None,
) -> str:

    job_context = job_description or "No specific job description provided."

    prompt = f"""
You are an AI mock interviewer for a job candidate.

Generate ONE interview question for the candidate.

Interview mode:
{mode}

Candidate resume:
{resume_text}

Job description:
{job_context}

Instructions:
- Make the question relevant to the interview mode.
- Personalize it using the candidate's resume when appropriate.
- If a job description is provided, align the question with the role.
- For HR questions, focus on behavioral and career-related topics.
- For Technical questions, focus on relevant technical concepts.
- For DSA questions, ask a coding/algorithmic problem.
- For AI/ML questions, focus on machine learning, AI, or data-related concepts.
- Ask only ONE question.
- Do not provide the answer.
- Do not make up experience that is not present in the resume.
"""

    response = generate_with_retry(
        prompt,
        GeneratedQuestion,
    )

    result = GeneratedQuestion.model_validate_json(response.text)

    return result.question


def generate_next_interview_question(
    mode: str,
    resume_text: str,
    previous_questions: str,
    job_description: Optional[str] = None,
) -> str:

    job_context = job_description or "No specific job description provided."

    prompt = f"""
You are conducting a realistic AI mock interview.

Interview mode:
{mode}

Candidate resume:
{resume_text}

Job description:
{job_context}

Previous interview questions and answers:
{previous_questions}

Generate ONE new interview question.

Instructions:
- Do not repeat any previous question.
- Build naturally on the candidate's previous answers when appropriate.
- Make the question relevant to the interview mode.
- Personalize it using the candidate's resume.
- If a job description is provided, align the question with the role.
- For HR interviews, ask behavioral or career-related questions.
- For Technical interviews, ask relevant technical questions.
- For DSA interviews, ask an algorithm/data-structure problem.
- For AI/ML interviews, ask an AI/ML or data-related question.
- Gradually increase the difficulty when appropriate.
- Ask exactly ONE question.
- Do not provide the answer.
- Do not invent experience that is not present in the resume.
"""

    response = generate_with_retry(
        prompt,
        GeneratedQuestion,
    )

    result = GeneratedQuestion.model_validate_json(response.text)

    return result.question


def evaluate_interview_answer(
    mode: str,
    question: str,
    answer: str,
    resume_text: str,
    job_description: Optional[str] = None,
) -> AnswerEvaluation:

    job_context = job_description or "No specific job description provided."

    prompt = f"""
You are an expert technical and HR interviewer evaluating a candidate's answer.

Interview mode:
{mode}

Candidate resume:
{resume_text}

Job description:
{job_context}

Interview question:
{question}

Candidate answer:
{answer}

Evaluate the answer based on:
1. Correctness
2. Completeness
3. Relevance
4. Communication and clarity

Give an overall score from 0 to 100.

Provide concise and constructive feedback.

Important:
- Evaluate only what the candidate actually said.
- Do not assume knowledge that was not demonstrated.
- Do not penalize the candidate for not mentioning information that is irrelevant.
- For DSA questions, consider the correctness and efficiency of the proposed approach.
- For technical questions, consider technical accuracy.
- For HR questions, consider clarity, relevance, and quality of the response.
- For AI/ML questions, consider conceptual and technical accuracy.
"""

    response = generate_with_retry(
        prompt,
        AnswerEvaluation,
    )

    return AnswerEvaluation.model_validate_json(response.text)