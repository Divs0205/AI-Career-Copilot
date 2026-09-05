from app.services.job_match_service import match_resume_to_job


resume_text = """
Python
FastAPI
PostgreSQL
REST APIs
SQLAlchemy
Git
"""

job_description = """
We are looking for a Backend Developer with experience in
Python, FastAPI, PostgreSQL, REST APIs, Docker, AWS and Git.
"""


result = match_resume_to_job(
    resume_text,
    job_description
)

print("\nMATCH RESULT")
print("====================")
print("Match Percentage:", result.match_percentage)

print("\nMatched Skills:")
for skill in result.matched_skills:
    print("-", skill)

print("\nMissing Skills:")
for skill in result.missing_skills:
    print("-", skill)

print("\nRecommendations:")
for recommendation in result.recommendations:
    print("-", recommendation)