# JobLens Deployment Guide

This guide provides instructions for deploying the JobLens application to various hosting platforms.

## Architecture Overview

JobLens is a full-stack application with:

- **Frontend**: React application (hosted on Vercel)
- **Scraper Service**: FastAPI service for job scraping (hosted on Render)
- **Embedder Service**: FastAPI service for creating embeddings (hosted on Render)
- **Matcher Service**: FastAPI service for semantic matching (hosted on Render)
- **Database**: Supabase (PostgreSQL)
- **Vector Database**: ChromaDB (self-hosted with the embedder/matcher services)

## Frontend Deployment (Vercel)

### Prerequisites
- A GitHub account
- A Vercel account

### Steps
1. Push your code to a GitHub repository
2. Go to [Vercel](https://vercel.com) and sign in
3. Click "New Project" and import your repository
4. Set the following configuration:
   - Framework Preset: `Other`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Add environment variables in the Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SCRAPER_SERVICE_URL`
   - `VITE_EMBEDDER_SERVICE_URL`
   - `VITE_MATCHER_SERVICE_URL`
6. Click "Deploy"

## Backend Services Deployment (Render)

### Prerequisites
- A GitHub account
- A Render account

### Steps for Each Service

For each of the backend services (scraper, embedder, matcher):

1. Create a new Web Service on Render
2. Connect to your GitHub repository
3. Set the root directory to the specific service directory (e.g., `scraper_service`)
4. Set the runtime to Python
5. Render will automatically detect the Dockerfile and use it
6. Add environment variables if needed
7. Set the port to match the service (8000 for scraper, 8001 for matcher, 8002 for embedder)

### Alternative Deployment (Manual)

If not using Render, you can deploy each service manually:

1. Clone your repository to the hosting environment
2. Create a Python virtual environment
3. Install dependencies: `pip install -r requirements.txt`
4. Run the service: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## Supabase Setup

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Import the schema from `supabase/schema.sql`
4. Get your project URL and anon key from the project settings
5. Use these values in your environment variables

## Environment Variables

### Frontend (Vercel)
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
- `VITE_SCRAPER_SERVICE_URL`: URL of your deployed scraper service
- `VITE_EMBEDDER_SERVICE_URL`: URL of your deployed embedder service
- `VITE_MATCHER_SERVICE_URL`: URL of your deployed matcher service

### Backend Services
- `CHROMADB_PATH`: Path for ChromaDB persistence (for embedder and matcher services)

## CORS Configuration

Make sure to configure CORS appropriately:

1. In Supabase, allow your Vercel frontend URL
2. In your backend services, allow requests from your frontend URL
3. Update the services to accept the appropriate origins

## Docker Deployment

All services include Dockerfiles for containerized deployment:

### Frontend
```bash
# Build the image
docker build -t joblens-frontend .

# Run the container
docker run -p 80:80 joblens-frontend
```

### Backend Services
```bash
# From each service directory (scraper_service, embedder_service, matcher_service)
docker build -t joblens-[service-name] .

# Run the container
docker run -p [port]:[port] joblens-[service-name]
```

## Health Checks

Each service has a health check endpoint:
- Scraper: `GET /health` (port 8000)
- Matcher: `GET /health` (port 8001)
- Embedder: `GET /health` (port 8002)

## Troubleshooting

### Frontend Issues
- Ensure environment variables are properly set in Vercel
- Check that backend service URLs are accessible from the frontend
- Verify CORS settings are properly configured

### Backend Issues
- Check that all required dependencies are installed
- Ensure the services can access any required databases or external APIs
- Verify that ports are properly exposed

### Database Issues
- Confirm that the Supabase schema is properly applied
- Ensure the connection strings are correct
- Check that RLS policies are properly configured

## Scaling Considerations

- For increased load, consider scaling the backend services
- Monitor the ChromaDB performance as the dataset grows
- Consider using a managed ChromaDB service for production
- Implement caching for frequently accessed data