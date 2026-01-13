# JobLens Application Integration Guide

This document provides a comprehensive guide to integrating the frontend and backend components of the JobLens application - an autonomous AI agent for semantic CV-job matching.

## Architecture Overview

The JobLens application consists of:
- **Frontend**: React TypeScript application providing user interface
- **Scraper Service**: Python FastAPI service for collecting job listings
- **Embedder Service**: Python FastAPI service for creating vector embeddings
- **Matcher Service**: Python FastAPI service for semantic matching of CVs to jobs
- **Database**: Supabase for data persistence
- **Vector Database**: ChromaDB for semantic search
- **Workflow Automation**: n8n for data pipeline orchestration

## Backend Services Setup

### 1. Scraper Service (Port 8000)

**Purpose**: Scrapes job listings from various sources (remotive, arbeitnow)

**Endpoints**:
- `GET /health` - Health check
- `POST /scrape` - Scrape jobs from specified sources

**Setup**:
```bash
cd scraper_service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. Embedder Service (Port 8002)

**Purpose**: Creates vector embeddings for job listings and CVs using sentence transformers

**Endpoints**:
- `GET /health` - Health check
- `POST /embed/jobs` - Create embeddings for job listings and store in ChromaDB
- `POST /embed/query` - Create embeddings for text queries (CVs)

**Setup**:
```bash
cd embedder_service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8002
```

### 3. Matcher Service (Port 8001)

**Purpose**: Performs semantic matching between CV embeddings and job embeddings

**Endpoints**:
- `GET /health` - Health check
- `POST /match` - Match CV embeddings to job embeddings
- `POST /match-with-rerank` - Match and re-rank based on business logic

**Setup**:
```bash
cd matcher_service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001
```

## Frontend Setup

### Environment Configuration

Create a `.env` file in the `frontend` directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend Service URLs
VITE_SCRAPER_SERVICE_URL=http://localhost:8000
VITE_EMBEDDER_SERVICE_URL=http://localhost:8002
VITE_MATCHER_SERVICE_URL=http://localhost:8001
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Integration Steps

### 1. Database Setup (Supabase)

1. Create a Supabase project
2. Apply the schema from `supabase/schema.sql`
3. Update the `.env` file with your Supabase credentials

### 2. Backend Services Integration

1. **Start all backend services**:
   ```bash
   # Terminal 1 - Scraper Service
   cd scraper_service
   uvicorn main:app --host 0.0.0.0 --port 8000
   
   # Terminal 2 - Matcher Service
   cd matcher_service
   uvicorn main:app --host 0.0.0.0 --port 8001
   
   # Terminal 3 - Embedder Service
   cd embedder_service
   uvicorn main:app --host 0.0.0.0 --port 8002
   ```

2. **Verify services are running**:
   - Scraper: `GET http://localhost:8000/health`
   - Matcher: `GET http://localhost:8001/health`
   - Embedder: `GET http://localhost:8002/health`

### 3. Data Pipeline Setup (n8n)

1. Start n8n with Docker Compose:
   ```bash
   cd n8n
   docker-compose up -d
   ```

2. Import workflows from `n8n_workflows/`:
   - `daily_recommendation_pipeline.json` - Daily job recommendations
   - `job_ingestion_pipeline.json` - Job ingestion pipeline

### 4. Frontend API Integration

The frontend currently uses mock data. To integrate with backend services:

**Create API utility file** (`frontend/src/utils/api.ts`):
```typescript
import axios from 'axios';

const scraperService = axios.create({
  baseURL: import.meta.env.VITE_SCRAPER_SERVICE_URL,
});

const embedderService = axios.create({
  baseURL: import.meta.env.VITE_EMBEDDER_SERVICE_URL,
});

const matcherService = axios.create({
  baseURL: import.meta.env.VITE_MATCHER_SERVICE_URL,
});

export const api = {
  // Scraper Service
  scrapeJobs: (sourceName: string, maxJobs: number = 50) => 
    scraperService.post('/scrape', { source_name: sourceName, max_jobs: maxJobs }),
  
  // Embedder Service
  embedJobs: (jobs: any[]) => 
    embedderService.post('/embed/jobs', { jobs }),
  
  embedQuery: (text: string) => 
    embedderService.post('/embed/query', { text }),
  
  // Matcher Service
  matchCV: (cvEmbedding: number[], limit: number = 10, filters?: any) => 
    matcherService.post('/match', { cv_embedding: cvEmbedding, limit, filters }),
  
  matchCVWithRerank: (cvEmbedding: number[], limit: number = 10, filters?: any) => 
    matcherService.post('/match-with-rerank', { cv_embedding: cvEmbedding, limit, filters }),
  
  // Health checks
  healthCheck: {
    scraper: () => scraperService.get('/health'),
    matcher: () => matcherService.get('/health'),
    embedder: () => embedderService.get('/health'),
  }
};
```

**Update JobListings component** to use real API:
```typescript
// Replace mock useEffect with real API call
useEffect(() => {
  const fetchJobRecommendations = async () => {
    try {
      setLoading(true);
      // Get user's CV embedding (from user profile or uploaded CV)
      const cvText = "user's CV text here";
      const embedResponse = await api.embedQuery(cvText);
      const cvEmbedding = embedResponse.data.embedding;
      
      // Get matched jobs
      const matchResponse = await api.matchCV(cvEmbedding, 20);
      setJobs(matchResponse.data.jobs);
    } catch (error) {
      console.error('Error fetching job recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchJobRecommendations();
}, []);
```

### 5. Workflow Automation (n8n)

The n8n workflows handle automated job ingestion and recommendation processes:

1. **Job Ingestion Pipeline**:
   - Periodically scrapes job listings from various sources
   - Stores raw job data in Supabase
   - Creates vector embeddings using the embedder service
   - Stores embeddings in ChromaDB for semantic search

2. **Daily Recommendation Pipeline**:
   - Runs daily to generate personalized job recommendations
   - Matches user profiles with latest job listings
   - Sends notifications to users

## Data Flow Process

### Job Ingestion Flow
1. n8n triggers scraper service to collect job listings
2. Scraper service fetches job data from various sources
3. Job data is stored in Supabase raw_jobs table
4. Embedder service creates vector embeddings for new jobs
5. Embeddings are stored in ChromaDB collection

### Job Matching Flow
1. User uploads CV or updates profile
2. Embedder service creates CV embedding
3. Matcher service performs semantic search in ChromaDB
4. Top matching jobs are returned with similarity scores
5. Frontend displays ranked job recommendations

### API Communication Pattern
```
Frontend → Supabase (Authentication/Profile) → Backend Services → ChromaDB
```

## Environment Variables

Required environment variables for both frontend and backend:

**Frontend (.env)**:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_SCRAPER_SERVICE_URL` - Scraper service URL
- `VITE_EMBEDDER_SERVICE_URL` - Embedder service URL
- `VITE_MATCHER_SERVICE_URL` - Matcher service URL

**Backend services (.env in respective directories)**:
- `CHROMADB_PATH` - Path for ChromaDB persistence (for matcher service)

## Running the Complete Application

1. **Start backend services**:
   ```bash
   # Terminal 1
   cd scraper_service && uvicorn main:app --host 0.0.0.0 --port 8000
   
   # Terminal 2
   cd matcher_service && uvicorn main:app --host 0.0.0.0 --port 8001
   
   # Terminal 3
   cd embedder_service && uvicorn main:app --host 0.0.0.0 --port 8002
   ```

2. **Start n8n**:
   ```bash
   cd n8n && docker-compose up -d
   ```

3. **Start frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

4. **Import n8n workflows**:
   - Access n8n UI at `http://localhost:5678`
   - Import workflows from `n8n_workflows/` directory

## Troubleshooting

### Common Issues

1. **Service Unavailable**: Verify all backend services are running on correct ports
2. **Database Connection**: Check Supabase credentials and network connectivity
3. **ChromaDB Issues**: Ensure ChromaDB persistence directory has correct permissions
4. **CORS Issues**: Configure appropriate CORS settings for backend services

### Health Checks

Verify all services are operational:
- Scraper: `GET http://localhost:8000/health`
- Matcher: `GET http://localhost:8001/health`
- Embedder: `GET http://localhost:8002/health`

## Security Considerations

1. **API Keys**: Store API keys securely and never commit to version control
2. **CORS**: Configure appropriate CORS policies for production
3. **Authentication**: Implement proper authentication using Supabase Auth
4. **Rate Limiting**: Implement rate limiting on API endpoints