from datetime import datetime
from decimal import Decimal
from typing import List, Optional
import hashlib

from pydantic import BaseModel, Field, validator


class JobModel(BaseModel):
    """Canonical representation of a scraped job posting.

    This model maps closely to the `raw_jobs` table in Supabase.
    """

    # Required core fields
    source_name: str = Field(..., min_length=1)
    job_url: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)

    # Optional metadata
    company: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None  # e.g. "Full-time"
    remote_option: Optional[str] = None  # "remote" | "onsite" | "hybrid"

    salary_min: Optional[Decimal] = None
    salary_max: Optional[Decimal] = None
    salary_currency: Optional[str] = None

    requirements: Optional[str] = None
    skills: List[str] = Field(default_factory=list)

    external_id: Optional[str] = None
    posted_at: Optional[datetime] = None

    # Computed / support field
    job_url_hash: Optional[str] = None

    @validator("job_url_hash", always=True)
    def set_job_url_hash(cls, v, values) -> Optional[str]:
        """Automatically compute job_url_hash from job_url if not provided."""

        if v:
            return v
        url = values.get("job_url")
        if not url:
            return v
        return hashlib.sha256(url.encode("utf-8")).hexdigest()

    @validator("salary_max")
    def check_salary_range(cls, v, values):
        """Ensure salary_max >= salary_min when both are set."""

        salary_min = values.get("salary_min")
        if v is not None and salary_min is not None and v < salary_min:
            raise ValueError("salary_max must be >= salary_min")
        return v

    def to_db_record(self) -> dict:
        """Return a dict formatted for insertion into the `raw_jobs` table.

        Columns like `scraped_at` and `embedding_status` are handled by
        database defaults in Supabase.
        """

        data = self.dict()
        return {
            "source_name": data["source_name"],
            "external_id": data["external_id"],
            "job_url": data["job_url"],
            "title": data["title"],
            "company": data["company"],
            "location": data["location"],
            "employment_type": data["employment_type"],
            "remote_option": data["remote_option"],
            "salary_min": data["salary_min"],
            "salary_max": data["salary_max"],
            "salary_currency": data["salary_currency"],
            "description": data["description"],
            "requirements": data["requirements"],
            "skills": data["skills"],
            "posted_at": data["posted_at"],
            "job_url_hash": data["job_url_hash"],
        }


class ScrapeRequest(BaseModel):
    """Request payload for the /scrape endpoint.

    n8n will typically send this.
    """

    source_name: str = Field(..., min_length=1)
    max_jobs: int = Field(50, ge=1, le=500)
    since: Optional[datetime] = None


class ScrapeResponse(BaseModel):
    """Response payload for the /scrape endpoint."""

    source_name: str
    job_count: int
    jobs: List[JobModel] = Field(default_factory=list)
    error: Optional[str] = None
