from typing import List, Optional

from pydantic import BaseModel, Field


class JobToEmbed(BaseModel):
    """Representation of a job that needs an embedding.

    The `id` field should match the primary key of the corresponding row in
    the `raw_jobs` table in Supabase.
    """

    id: str = Field(..., description="ID of the job (e.g. raw_jobs.id)")
    title: str = Field(..., description="Job title")
    description: str = Field(..., description="Full job description text")

    company: Optional[str] = Field(None, description="Company name")
    location: Optional[str] = Field(None, description="Job location text")
    source_name: Optional[str] = Field(
        None, description="Name of the job source (e.g. remotive, arbeitnow)"
    )

    def as_text(self) -> str:
        """Combine fields into a single text for embedding."""

        header_parts = [self.title]
        if self.company:
            header_parts.append(self.company)
        if self.location:
            header_parts.append(self.location)

        header = " | ".join(header_parts)
        return f"{header}\n\n{self.description}".strip()


class EmbedJobsRequest(BaseModel):
    """Request body for /embed/jobs.

    `collection_name` defaults to "jobs" and maps to a ChromaDB collection.
    """

    jobs: List[JobToEmbed]
    collection_name: str = Field("jobs", description="ChromaDB collection name")


class EmbedJobsResponse(BaseModel):
    collection_name: str
    count: int


class EmbedQueryRequest(BaseModel):
    """Request body for /embed/query.

    Used for embedding CV text or a job search query.
    """

    text: str = Field(..., min_length=1, description="Text to embed")


class EmbedQueryResponse(BaseModel):
    embedding: List[float]
