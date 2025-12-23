# 🚀 JobLens - Development Progress

**Project**: JobLens - Autonomous AI Agent for Semantic CV-Job Matching and Personalized Daily Job Recommendation  
**Last Updated**: December 23, 2025

---

## 📋 Project Objectives

1. **Data Acquisition Module**: Automatically scrape/retrieve job postings from multiple sources with deduplication
2. **NLP-Based CV Parsing & Semantic Matching**: Extract skills/experience from CVs and compute similarity with jobs
3. **Automated Job-Recommendation Workflow**: Rank jobs, generate daily reports, deliver via email/Telegram
4. **Scalable User Interface**: CV upload, job viewing, preference management
5. **System Evaluation**: Measure accuracy, ranking quality, user satisfaction, processing efficiency

---

## ✅ Completed Components

### 1. **Scraper Service** (`scraper_service/`)
**Status**: ✅ **Production Ready**

- **Tech Stack**: FastAPI, Pydantic, httpx, BeautifulSoup4
- **Features**:
  - `/health` endpoint for monitoring
  - `/scrape` endpoint with request/response validation
  - Two live job sources integrated:
    - **Remotive API** (remote jobs worldwide)
    - **Arbeitnow API** (general job board)
  - Automatic URL-based deduplication (`job_url_hash`)
  - Type-safe models (`JobModel`, `ScrapeRequest`, `ScrapeResponse`)
  - HTML-to-text conversion for job descriptions
  
- **Files**:
  - `main.py` - FastAPI app & scraping dispatcher
  - `models.py` - Pydantic data models
  - `scrapers/remotive.py` - Remotive API scraper
  - `scrapers/arbeitnow.py` - Arbeitnow API scraper
  - `requirements.txt` - Dependencies

- **Testing**: ✅ Tested via Swagger UI at `http://localhost:8000/docs`

---

### 2. **Embedder Service** (`embedder_service/`)
**Status**: ✅ **Built & Debugged**

- **Tech Stack**: FastAPI, sentence-transformers, ChromaDB, Pydantic
- **Features**:
  - `/health` endpoint
  - `/embed/jobs` - Batch embed jobs into ChromaDB with metadata
  - `/embed/query` - Embed CV text or search queries
  - Uses `sentence-transformers/all-MiniLM-L6-v2` (CPU-friendly, open source)
  - ChromaDB persistent storage at `chroma_data/`
  
- **Files**:
  - `main.py` - FastAPI app with embedding endpoints
  - `models.py` - Pydantic models (`JobToEmbed`, `EmbedJobsRequest`, etc.)
  - `requirements.txt` - Dependencies including sentence-transformers & chromadb

- **Environment**: 
  - ✅ Python 3.11 venv configured (resolved Python 3.13 compatibility issues)
  - ✅ All dependencies installed successfully

- **Port**: Runs on port 8002 (8001 had conflicts)

---

### 3. **Database Schema Design**
**Status**: 📝 **Designed (Not Implemented)**

Proposed Supabase tables:

- `raw_jobs`: All scraped jobs with embedding status tracking
- `users`: User profiles (linked to Supabase auth)
- `cvs`: Uploaded/parsed CV data per user
- `user_preferences`: Job preferences (role, location, remote, salary)
- `recommendations`: Daily job matches with scores and feedback

Key fields for `raw_jobs`:
```sql
id, source_name, external_id, job_url, job_url_hash,
title, company, location, employment_type, remote_option,
salary_min, salary_max, salary_currency,
description, requirements, skills,
posted_at, scraped_at, is_active,
embedding_status (pending|embedded|error), embedding_updated_at
```

---

## 🔄 In Progress / Blocked

### Environment Setup
- ✅ Python 3.11 virtual environment at `d:\FinalYear\.venv`
- ✅ Separate venv for `embedder_service/.venv` (fallback)
- ⚠️ **Known Issue**: Port 8001 conflict (use 8002 for embedder)

---

## 🔴 Not Started (Next Steps)

### 1. **Supabase Database Setup**
- [ ] Create Supabase project (free tier)
- [ ] Define and create all tables (`raw_jobs`, `users`, `cvs`, `user_preferences`, `recommendations`)
- [ ] Set up RLS (Row Level Security) policies
- [ ] Test insert/query from local environment

### 2. **n8n Workflow Orchestration**
- [ ] Install and configure n8n (self-hosted or cloud free tier)
- [ ] **Workflow 1 - Job Ingestion Pipeline**:
  - Cron trigger (e.g., every 6 hours)
  - HTTP Request → Scraper `/scrape` for each source
  - Loop through jobs → Insert into Supabase `raw_jobs`
  - HTTP Request → Embedder `/embed/jobs` for pending jobs
  - Update `embedding_status = 'embedded'` in Supabase
  
- [ ] **Workflow 2 - Daily Recommendation Pipeline**:
  - Cron trigger (daily at 8:00 AM)
  - Fetch active users from Supabase
  - For each user:
    - Get CV + preferences
    - HTTP Request → Embedder `/embed/query` (CV text)
    - HTTP Request → Matcher service → get ranked jobs
    - Insert into `recommendations` table
    - Send email/Telegram notification

### 3. **Matcher Service** (`matcher_service/`)
- [ ] Create FastAPI service with `/match` endpoint
- [ ] Query ChromaDB with CV embedding vector
- [ ] Apply business filters (location, salary, remote preference)
- [ ] Re-rank jobs by combined score
- [ ] Return top N jobs with metadata

### 4. **CV Parser Module**
- [ ] PDF/DOCX upload support (`PyPDF2`, `python-docx`)
- [ ] Extract text from uploaded files
- [ ] Optional: Use spaCy or regex to extract skills, experience, education
- [ ] Store parsed data in Supabase `cvs` table

### 5. **Frontend (React + Supabase Auth)**
- [ ] Initialize Next.js or Vite React project
- [ ] Integrate Supabase Auth (email/password)
- [ ] Pages:
  - Signup/Login
  - CV upload (text or file)
  - User preferences form
  - Job recommendations list with feedback buttons (like/dislike)
- [ ] Deploy on Vercel (free tier)

### 6. **Notification System**
- [ ] Email notifications:
  - Configure SMTP (Gmail or Brevo/Resend free tier)
  - Design email template with top jobs
- [ ] Telegram notifications:
  - Create Telegram bot
  - Store user `telegram_chat_id` in Supabase
  - Send concise job list or link to UI

### 7. **Evaluation & Metrics**
- [ ] Log all recommendations (job IDs, scores, timestamps)
- [ ] Collect user feedback (like/dislike buttons in UI)
- [ ] Implement metrics calculation:
  - Precision@k, NDCG for ranking quality
  - Click-through rate, application rate
  - Processing time per batch
- [ ] Generate evaluation report for project defense

---

## 🛠️ Technical Stack Summary

| Component | Technology |
|-----------|------------|
| **Job Scraping** | FastAPI, httpx, BeautifulSoup4 |
| **Embeddings** | sentence-transformers (all-MiniLM-L6-v2) |
| **Vector DB** | ChromaDB (persistent local) |
| **Database** | Supabase (PostgreSQL, free tier) |
| **Orchestration** | n8n (self-hosted or cloud free tier) |
| **CV Parsing** | PyPDF2, python-docx, spaCy (optional) |
| **Notifications** | Email (SMTP), Telegram Bot API |
| **Frontend** | React (Next.js/Vite), Supabase Auth, Vercel |
| **Language** | Python 3.11 |

---

## 📁 Project Structure

```
d:\FinalYear\
├── scraper_service/
│   ├── scrapers/
│   │   ├── remotive.py      ✅ Remotive API scraper
│   │   └── arbeitnow.py     ✅ Arbeitnow API scraper
│   ├── main.py              ✅ FastAPI app
│   ├── models.py            ✅ Pydantic models
│   └── requirements.txt     ✅
│
├── embedder_service/
│   ├── main.py              ✅ FastAPI app with ChromaDB
│   ├── models.py            ✅ Pydantic models
│   ├── requirements.txt     ✅
│   └── chroma_data/         (created at runtime)
│
├── matcher_service/         🔴 TODO
├── frontend/                🔴 TODO
├── n8n_workflows/           🔴 TODO (export JSON files)
└── .venv/                   ✅ Python 3.11 environment
```

---

## 🐛 Known Issues & Solutions

### Issue 1: Python 3.13 Dependency Compilation Errors
**Problem**: `numpy`, `chromadb` tried to build from source, requiring C++ build tools  
**Solution**: ✅ Switched to Python 3.11; all dependencies installed as precompiled wheels

### Issue 2: Port 8001 Already in Use
**Problem**: First uvicorn instance still running in background  
**Solution**: ✅ Use port 8002 for embedder service or kill process with `taskkill /PID <PID> /F`

### Issue 3: ChromaDB Not Found in Embedder Service
**Problem**: Local `.venv` inside `embedder_service/` missing dependencies  
**Solution**: Use main project venv at `d:\FinalYear\.venv` or reinstall in local venv

---

## 📊 Progress Estimate

| Phase | Completion |
|-------|------------|
| **Phase 1: Data Pipeline** (Scraping + Embedding) | ✅ **100%** |
| **Phase 2: Database & Orchestration** (Supabase + n8n) | 🔴 **0%** |
| **Phase 3: Matching & Ranking** (Matcher service) | 🔴 **0%** |
| **Phase 4: Notifications** (Email + Telegram) | 🔴 **0%** |
| **Phase 5: Frontend** (React + Auth) | 🔴 **0%** |
| **Phase 6: Evaluation** (Metrics + Report) | 🔴 **0%** |

**Overall Project Completion**: ~30-35%

---

## 🎯 Recommended Next Session Plan

1. **Set up Supabase** (30 min)
   - Create project
   - Define `raw_jobs` table schema
   - Test insert from Python

2. **Install n8n** (20 min)
   - Docker or npm install
   - Access UI, configure credentials

3. **Build Workflow 1** (45 min)
   - Scraper → Supabase → Embedder integration
   - Test end-to-end job ingestion

4. **Build Matcher Service** (60 min)
   - FastAPI endpoint
   - ChromaDB query + ranking logic
   - Test with sample CV

---

## 📝 Notes

- All services use **free/open-source tools** to meet budget constraint
- **Sentence-transformers model** downloads ~80MB on first run (one-time)
- For production deployment, consider:
  - Dockerizing all services
  - Using cloud-hosted ChromaDB (Chroma Cloud free tier) or vector DB alternative
  - Rate limiting on scraper to respect API terms

---

## 🔗 Useful Commands

### Run Scraper Service
```powershell
cd d:\FinalYear\scraper_service
. ..\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```
Access: `http://localhost:8000/docs`

### Run Embedder Service
```powershell
cd d:\FinalYear\embedder_service
. ..\.venv\Scripts\Activate.ps1
uvicorn main:app --port 8002
```
Access: `http://localhost:8002/docs`

### Test Scraper
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/scrape" -Method Post -ContentType "application/json" -Body '{"source_name":"remotive","max_jobs":5}'
```

---

**End of Progress Report**
