import os

from dotenv import load_dotenv
from google import genai

from app.services.embedding_service import generate_embedding

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

RAG_MODEL = "gemini-3.6-flash"


def generate_rag_answer(
    question: str,
    context: str
) -> str:

    response = client.models.generate_content(
        model=RAG_MODEL,
        contents=f"""
You are an AI career assistant.

Answer the user's question using the provided career information.

CAREER INFORMATION:
{context}

USER QUESTION:
{question}

Rules:
- Use the provided career information as the primary source.
- Do not invent skills, experience, projects, or achievements.
- If the information does not contain the answer, clearly say that the information is not available.
- Give a useful and concise answer.
- Do not mention that you are using a vector database.
""",
    )

    return response.text.strip()