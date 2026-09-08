# AI Career & Placement Copilot

An AI-powered career and placement assistant that helps students analyze their resumes, evaluate job fit, identify skill gaps, generate personalized learning plans, and interact with their career information using Retrieval-Augmented Generation (RAG).

---

## 🚀 Overview

The **AI Career & Placement Copilot** is a full-stack AI application designed to act as a personalized career assistant for students and early-career professionals.

Instead of providing generic career advice, the system analyzes a user's resume and target job descriptions to provide personalized insights such as:

- Resume skill analysis
- Career-role recommendations
- Resume-to-job matching
- Skill-gap identification
- Personalized learning plans
- Semantic resume search
- Context-aware RAG-based career assistance

The project combines **Generative AI, Retrieval-Augmented Generation, vector databases, backend APIs, authentication, and full-stack development** into a single career-focused platform.

---

## 🎯 Problem Statement

Students often struggle to understand:

- Which jobs match their current skills
- Why they are not matching certain job descriptions
- Which skills they are missing
- What they should learn first
- How their existing experience can be applied to different career paths

Most existing career tools provide generic recommendations.

This project aims to build a **personalized AI career assistant** that understands an individual's resume and career goals and provides actionable recommendations based on their actual background.

---

## ✨ Key Features

### 📄 Resume Intelligence
- Upload PDF resumes
- Automatically extract resume text
- Analyze resumes using Google Gemini
- Identify technical and professional skills
- Identify candidate strengths
- Identify skill gaps
- Recommend suitable career roles
- Generate practical career recommendations

### 💼 Job Management
- Create and store job descriptions
- Retrieve jobs associated with the authenticated user
- Maintain job information for career analysis

### 🎯 Resume-to-Job Matching
The system compares a candidate's resume against a target job description and generates:
- Match percentage
- Matched skills
- Missing skills
- Practical recommendations

### 🧩 Skill-Gap Analysis
For important job requirements that are missing or not clearly demonstrated:
- Skill
- Importance
- Current level
- Required level
- Reason for the gap
- Learning focus

### 📚 Personalized Learning Plans
The system converts identified skill gaps into structured learning plans containing:
- Skill priority
- Learning goal
- Learning topics
- Topic descriptions
- Estimated learning hours
- Practical, job-oriented progression

### 🔎 Semantic Search
The project uses vector embeddings and PostgreSQL with pgvector to perform semantic search over resume content.

### 🤖 Retrieval-Augmented Generation (RAG)
The RAG pipeline:
1. Splits resume text into chunks
2. Generates embeddings
3. Stores embeddings in PostgreSQL using pgvector
4. Converts user questions into embeddings
5. Performs vector similarity search
6. Retrieves relevant resume chunks
7. Sends retrieved context to Gemini
8. Generates a personalized answer

### 🔐 Authentication & Security
- User registration
- Secure password hashing
- JWT authentication
- Protected API endpoints
- User-specific resume and job access
- Environment variables for sensitive configuration

---

# 🏗️ System Architecture

```text
                         AI CAREER & PLACEMENT COPILOT
                                      |
                    +-----------------+-----------------+
                    |                                   |
                    v                                   v
               Frontend                              Backend
          Next.js / React                           FastAPI
                    |                                   |
                    |                     +-------------+-------------+
                    |                     |             |             |
                    |                     v             v             v
                    |                  Auth          AI/RAG       Database
                    |                     |             |             |
                    |                     |          Gemini      PostgreSQL
                    |                     |       Embeddings    pgvector
                    |                     |
                    +---------------------+
```

---

# 🔄 RAG Architecture

```text
Resume PDF
    |
    v
PDF Text Extraction
    |
    v
Text Chunking
    |
    v
Gemini Embedding Model
    |
    v
768-Dimensional Embeddings
    |
    v
PostgreSQL + pgvector
    |
    v
Semantic Similarity Search
    |
    v
Relevant Resume Context
    |
    v
Google Gemini
    |
    v
Personalized Career Answer
```

---

# 🧠 AI Pipeline

```text
Resume
   |
   +--> Resume Analysis
   |       |
   |       +--> Skills
   |       +--> Strengths
   |       +--> Skill Gaps
   |       +--> Suitable Roles
   |       +--> Recommendations
   |
   +--> Job Description
           |
           +--> Resume-Job Match
           |       |
           |       +--> Match Percentage
           |       +--> Matched Skills
           |       +--> Missing Skills
           |       +--> Recommendations
           |
           +--> Skill Gap Analysis
                   |
                   +--> Personalized Learning Plan
```

---

# 🗃️ Database Architecture

The project uses **PostgreSQL** as its primary database.

```text
users
  |
  +--- resumes
  |       |
  |       +--- resume_analyses
  |       |
  |       +--- document_embeddings
  |
  +--- jobs
          |
          +--- job_matches
          |
          +--- skill_gaps
          |
          +--- learning_plans
```

### Main Tables

| Table | Purpose |
|---|---|
| `users` | User accounts and authentication |
| `resumes` | Uploaded resume metadata and extracted text |
| `resume_analyses` | AI-generated resume analysis |
| `jobs` | Target job descriptions |
| `job_matches` | Resume-to-job compatibility results |
| `skill_gaps` | Identified missing skills |
| `learning_plans` | Personalized learning recommendations |
| `document_embeddings` | Resume chunks and vector embeddings |

---

# 🛠️ Technology Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- Python
- FastAPI
- SQLAlchemy
- Alembic

### Database
- PostgreSQL 18
- pgvector

### Artificial Intelligence
- Google Gemini
- Gemini Embeddings
- Retrieval-Augmented Generation (RAG)
- Vector similarity search

### Authentication
- JWT
- Password hashing
- OAuth2-compatible authentication flow

### Development Tools
- Git
- GitHub
- VS Code
- Swagger / OpenAPI

---

# 📂 Project Structure

```text
AI-Career-Copilot/
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── database.py
│   │   │   ├── dependencies.py
│   │   │   └── security.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── resume.py
│   │   │   ├── resume_analysis.py
│   │   │   ├── job.py
│   │   │   ├── job_match.py
│   │   │   ├── skill_gap.py
│   │   │   ├── learning_plan.py
│   │   │   └── document_embedding.py
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── health.py
│   │   │   ├── users.py
│   │   │   ├── resumes.py
│   │   │   ├── jobs.py
│   │   │   └── rag.py
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── analysis.py
│   │   │   ├── job.py
│   │   │   ├── job_match.py
│   │   │   ├── skill_gap.py
│   │   │   ├── learning_plan.py
│   │   │   └── rag.py
│   │   └── services/
│   │       ├── ai_service.py
│   │       ├── pdf_service.py
│   │       ├── job_match_service.py
│   │       ├── skill_gap_service.py
│   │       ├── learning_plan_service.py
│   │       ├── chunking_service.py
│   │       ├── embedding_service.py
│   │       ├── rag_service.py
│   │       ├── search_service.py
│   │       └── rag_qa_service.py
│   └── alembic/
│       └── versions/
│
├── frontend/
│   ├── src/
│   │   └── app/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

---

# 🔌 Backend API

### Authentication
```text
POST /auth/register
POST /auth/login
GET  /users/me
```

### Resume
```text
POST /resumes/upload
POST /resumes/{resume_id}/analyze
GET  /resumes/{resume_id}/analysis
POST /resumes/{resume_id}/embed
```

### Jobs
```text
POST /jobs/
GET  /jobs/
POST /jobs/{job_id}/match/{resume_id}
POST /jobs/{job_id}/skill-gaps/{resume_id}
POST /jobs/{job_id}/learning-plan/{resume_id}
```

### RAG
```text
POST /rag/ask
```

Interactive API documentation is available through Swagger:

```text
http://127.0.0.1:8000/docs
```

---

# ⚙️ Local Setup

## Prerequisites
- Python 3.10+
- PostgreSQL 18
- pgvector
- Node.js / npm
- Git

## 1. Clone the Repository

```bash
git clone <YOUR_PUBLIC_GITHUB_REPOSITORY_URL>
cd AI-Career-Copilot
```

## 2. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 3. Environment Variables

Create `backend/.env`:

```env
DATABASE_URL=your_postgresql_database_url
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET_KEY=your_secret_key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Never commit `.env` to GitHub.**

## 4. Database Setup

Create the PostgreSQL database:

```text
career_copilot
```

Enable pgvector:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Run migrations:

```bash
alembic upgrade head
```

## 5. Run the Backend

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

## 6. Run the Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

# 🧪 RAG Pipeline Example

### Upload a resume

```text
POST /resumes/upload
```

### Automatic ingestion

```text
PDF
 ↓
Text Extraction
 ↓
Chunking
 ↓
Gemini Embeddings
 ↓
PostgreSQL + pgvector
```

### Ask a career question

```text
POST /rag/ask
```

Example:

```json
{
  "question": "What backend technologies and programming skills does my resume demonstrate?",
  "resume_id": 4
}
```

The system performs semantic similarity search, retrieves relevant resume context, and passes that context to Gemini to generate a personalized answer.

---

# 📊 Current Implementation Status

## Completed

- [x] FastAPI backend
- [x] PostgreSQL database
- [x] Alembic migrations
- [x] JWT authentication
- [x] Password hashing
- [x] Protected API endpoints
- [x] Resume PDF upload
- [x] PDF text extraction
- [x] AI resume analysis
- [x] Job creation and retrieval
- [x] Resume-to-job matching
- [x] Skill-gap analysis
- [x] Personalized learning plans
- [x] PostgreSQL + pgvector integration
- [x] Resume text chunking
- [x] Gemini embeddings
- [x] Vector storage
- [x] Semantic search
- [x] RAG question answering
- [x] Automatic resume embedding ingestion

## 🚧 In Development / Planned

- [ ] Full conversational career chatbot UI
- [ ] Conversation history
- [ ] Job-aware RAG
- [ ] Multi-document career knowledge base
- [ ] Mock interview simulator
- [ ] Interview answer evaluation
- [ ] Interview feedback and scoring
- [ ] ML-based career recommendations
- [ ] Progress tracking
- [ ] Career analytics dashboard
- [ ] Agentic career workflows
- [ ] Voice-based interview mode
- [ ] Multimodal career assistance
- [ ] Production deployment
- [ ] Automated testing
- [ ] CI/CD pipeline

---

# 🔮 Future Vision

The long-term goal is to evolve the project into an **AI-powered career operating system**.

```text
Understand Current Skills
        ↓
Discover Suitable Jobs
        ↓
Analyze Job Requirements
        ↓
Identify Skill Gaps
        ↓
Create Learning Plans
        ↓
Practice Interviews
        ↓
Evaluate Performance
        ↓
Track Progress
        ↓
Improve Career Readiness
```

---

# 🔐 Security

The project follows basic application security practices including:

- JWT-based authentication
- Password hashing
- User-specific resource authorization
- Environment variables for API keys and secrets
- Git-ignored uploaded documents
- Protected resume and job endpoints

Never commit:

```text
.env
*.pdf
*.dump
API keys
Database passwords
JWT secrets
Personal documents
```

---

# 📌 Project Highlights

This project demonstrates practical experience with:

- Full-stack web development
- REST API development
- Authentication and authorization
- Relational database design
- Database migrations
- Generative AI integration
- Prompt engineering
- Structured AI outputs
- Vector embeddings
- Semantic search
- PostgreSQL + pgvector
- Retrieval-Augmented Generation
- AI-powered recommendation systems
- Modular backend architecture

---

# 👨‍💻 Development Approach

The project is being developed incrementally, with each major feature implemented, tested, migrated, and version-controlled independently.

Major milestones:

```text
Authentication
      ↓
Resume Intelligence
      ↓
Job Management
      ↓
Job Matching
      ↓
Skill Gap Analysis
      ↓
Personalized Learning Plans
      ↓
Vector Database
      ↓
Embeddings
      ↓
Semantic Search
      ↓
RAG
      ↓
Career Copilot
```

---

# 📜 License

This project is currently developed as a personal/academic project.

A formal open-source license may be added in a future release.

---

# ⭐ Project Status

**Active Development**

The core backend, AI resume analysis, job matching, skill-gap analysis, personalized learning plans, vector search, and RAG foundations are implemented and tested.

The next development phase focuses on turning these capabilities into a unified career-coaching experience with a conversational interface, interview preparation, analytics, and intelligent career recommendations.
