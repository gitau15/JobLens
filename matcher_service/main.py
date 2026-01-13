from typing import List, Dict, Any, Optional
import os
import logging
from fastapi import FastAPI, HTTPException, BackgroundTasks
import chromadb
from chromadb.config import Settings
import numpy as np
from dotenv import load_dotenv

from models import MatchRequest, JobMatch, MatchResponse

load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="JobLens Matcher Service",
    description="Semantic CV-Job matching service using vector embeddings",
    version="1.0.0"
)

# Initialize ChromaDB client
chroma_client = chromadb.PersistentClient(
    path=os.getenv("CHROMADB_PATH", "./chroma_data"),
    settings=Settings(anonymized_telemetry=False)
)



@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "matcher"}


@app.post("/match", response_model=MatchResponse)
async def match_cv_to_jobs(request: MatchRequest, background_tasks: BackgroundTasks):
    """
    Match a CV embedding to the most relevant jobs using semantic similarity
    
    Args:
        request: Contains the CV embedding and optional filters
    Returns:
        List of top matching jobs with similarity scores
    """
    try:
        logger.info(f"Received match request for {len(request.cv_embedding)}-dimensional embedding")
        
        # Validate embedding dimension
        collection = chroma_client.get_collection(name="jobs")
        if not collection:
            raise HTTPException(status_code=500, detail="Jobs collection not found in ChromaDB")
        
        # Perform semantic search in ChromaDB
        # Convert the CV embedding to the right format
        cv_embedding_array = [request.cv_embedding]
        
        # Build query filters if provided
        where_filter = None
        if request.filters:
            where_filter = {}
            for key, value in request.filters.items():
                where_filter[key] = value
        
        # Query the collection
        results = collection.query(
            query_embeddings=cv_embedding_array,
            n_results=request.limit,
            where=where_filter
        )
        
        # Format results into JobMatch objects
        jobs = []
        for i in range(len(results['ids'][0])):
            job_match = JobMatch(
                id=results['ids'][0][i],
                title=results['metadatas'][0][i]['title'],
                company=results['metadatas'][0][i]['company'],
                location=results['metadatas'][0][i]['location'],
                job_url=results['metadatas'][0][i]['job_url'],
                description=results['metadatas'][0][i]['description'],
                requirements=results['metadatas'][0][i]['requirements'],
                score=results['distances'][0][i],  # Distance is inverse of similarity
                metadata=results['metadatas'][0][i]
            )
            
            # Convert distance to similarity score (0-100 scale)
            # ChromaDB returns distances, lower distance = higher similarity
            max_distance = 2.0  # Assuming this based on embedding space, adjust as needed
            similarity_score = max(0, 100 * (1 - (job_match.score / max_distance)))
            job_match.score = similarity_score
            
            jobs.append(job_match)
        
        logger.info(f"Found {len(jobs)} matching jobs")
        
        return MatchResponse(
            jobs=jobs,
            total_matches=len(jobs)
        )
    
    except Exception as e:
        logger.error(f"Error during matching: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Matching failed: {str(e)}")


@app.post("/match-with-rerank", response_model=MatchResponse)
async def match_and_rerank(request: MatchRequest):
    """
    Match jobs using semantic similarity and apply business logic re-ranking
    
    Args:
        request: Contains the CV embedding and optional filters
    Returns:
        List of top matching jobs with combined scores after re-ranking
    """
    try:
        logger.info(f"Received match-and-rerank request for {len(request.cv_embedding)}-dimensional embedding")
        
        # First, get the initial semantic matches
        collection = chroma_client.get_collection(name="jobs")
        cv_embedding_array = [request.cv_embedding]
        
        # Get more results than needed for re-ranking
        n_initial_results = min(request.limit * 3, 100)  # Get 3x more results for re-ranking
        
        # Build query filters if provided
        where_filter = None
        if request.filters:
            where_filter = {}
            for key, value in request.filters.items():
                where_filter[key] = value
        
        # Query the collection
        results = collection.query(
            query_embeddings=cv_embedding_array,
            n_results=n_initial_results,
            where=where_filter
        )
        
        # Prepare jobs for re-ranking
        jobs = []
        for i in range(len(results['ids'][0])):
            job_match = JobMatch(
                id=results['ids'][0][i],
                title=results['metadatas'][0][i]['title'],
                company=results['metadatas'][0][i]['company'],
                location=results['metadatas'][0][i]['location'],
                job_url=results['metadatas'][0][i]['job_url'],
                description=results['metadatas'][0][i]['description'],
                requirements=results['metadatas'][0][i]['requirements'],
                score=results['distances'][0][i],  # Raw distance score
                metadata=results['metadatas'][0][i]
            )
            jobs.append(job_match)
        
        # Apply re-ranking based on business logic
        reranked_jobs = apply_business_logic_reranking(jobs, request.cv_embedding, request.filters)
        
        # Take only the top 'limit' results
        top_jobs = reranked_jobs[:request.limit]
        
        # Convert distances to similarity scores (0-100 scale)
        for job in top_jobs:
            max_distance = 2.0
            similarity_score = max(0, 100 * (1 - (job.score / max_distance)))
            job.score = similarity_score
        
        logger.info(f"Re-ranked and returning {len(top_jobs)} jobs")
        
        return MatchResponse(
            jobs=top_jobs,
            total_matches=len(top_jobs)
        )
    
    except Exception as e:
        logger.error(f"Error during matching and re-ranking: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Matching and re-ranking failed: {str(e)}")


def apply_business_logic_reranking(jobs: List[JobMatch], cv_embedding: List[float], filters: Optional[Dict[str, Any]]) -> List[JobMatch]:
    """
    Apply business logic re-ranking to the initially matched jobs
    
    Args:
        jobs: List of initially matched jobs
        cv_embedding: The CV embedding for comparison
        filters: Business filters to apply
    
    Returns:
        Re-ranked list of jobs
    """
    # Apply filters first
    filtered_jobs = []
    
    for job in jobs:
        # Apply location filter if specified
        if filters and 'location' in filters:
            location_filter = filters['location'].lower()
            if location_filter not in job.location.lower():
                continue
        
        # Apply remote filter if specified
        if filters and 'remote_only' in filters and filters['remote_only']:
            if 'remote' not in job.location.lower() and 'remote' not in job.metadata.get('description', '').lower():
                continue
        
        # Apply other filters as needed
        filtered_jobs.append(job)
    
    # Calculate additional scores based on business logic
    for job in filtered_jobs:
        # Placeholder for additional scoring logic
        # This could include skill matching, company rating, etc.
        additional_score = 0.0
        
        # Example: boost remote jobs if user prefers remote
        if filters and 'remote_preferred' in filters and filters['remote_preferred']:
            if 'remote' in job.location.lower() or 'remote' in job.metadata.get('description', '').lower():
                additional_score += 5.0
        
        # Example: boost jobs in specific locations
        if filters and 'preferred_location' in filters:
            if filters['preferred_location'].lower() in job.location.lower():
                additional_score += 10.0
        
        # Adjust the score based on business logic
        # Note: The original score is a distance (lower is better), so we need to invert it
        # For re-ranking, we'll use the adjusted score
        job.score -= additional_score  # Lower distance is better, so subtracting improves rank
    
    # Sort by the adjusted score (distance - lower is better)
    reranked_jobs = sorted(filtered_jobs, key=lambda x: x.score)
    
    return reranked_jobs


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)