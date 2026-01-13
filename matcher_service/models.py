from pydantic import BaseModel
from typing import List, Dict, Optional, Any


class MatchRequest(BaseModel):
    """
    Request model for matching CV to jobs
    """
    cv_embedding: List[float]
    limit: int = 10
    filters: Optional[Dict[str, Any]] = None  # For business filters like location, salary, remote preference


class JobMatch(BaseModel):
    """
    Model representing a matched job with similarity score
    """
    id: str
    title: str
    company: str
    location: str
    job_url: str
    description: str
    requirements: str
    score: float  # Similarity score (0-100)
    metadata: Dict[str, Any]


class MatchResponse(BaseModel):
    """
    Response model for match endpoint
    """
    jobs: List[JobMatch]
    total_matches: int


class ReRankRequest(BaseModel):
    """
    Request model for re-ranking already matched jobs
    """
    jobs: List[JobMatch]
    cv_embedding: List[float]
    filters: Optional[Dict[str, Any]] = None


class HealthCheck(BaseModel):
    """
    Health check response model
    """
    status: str
    service: str
    version: str = "1.0.0"