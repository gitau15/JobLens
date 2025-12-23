from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

from models import JobModel, ScrapeRequest, ScrapeResponse
from scrapers.remotive import fetch_remotive_jobs
from scrapers.arbeitnow import fetch_arbeitnow_jobs


app = FastAPI(title="Job Scraper Service", version="0.1.0")


@app.get("/health")
async def health_check() -> dict:
    """Simple health check endpoint for monitoring and n8n readiness checks."""

    return {"status": "ok"}


@app.post("/scrape", response_model=ScrapeResponse)
async def scrape_endpoint(payload: ScrapeRequest) -> ScrapeResponse:
    """Scrape jobs for a given source and return them as structured JSON.

    n8n will typically call this endpoint on a schedule and then insert the
    returned jobs into Supabase.
    """

    try:
        jobs: List[JobModel] = await scrape_source(
            source_name=payload.source_name,
            max_jobs=payload.max_jobs,
            since=payload.since,
        )
    except ValueError as exc:
        # For expected errors like unsupported source names.
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive catch-all
        # Unexpected errors are returned with an error message while keeping
        # the HTTP contract with n8n.
        return JSONResponse(
            status_code=500,
            content=ScrapeResponse(
                source_name=payload.source_name,
                job_count=0,
                jobs=[],
                error=f"Scraping failed: {exc}",
            ).dict(),
        )

    return ScrapeResponse(
        source_name=payload.source_name,
        job_count=len(jobs),
        jobs=jobs,
        error=None,
    )


async def scrape_source(source_name: str, max_jobs: int, since=None) -> List[JobModel]:
    """Core scraping dispatcher.

    Dispatches to concrete scraper implementations based on `source_name`.
    """

    if source_name == "remotive":
        return await fetch_remotive_jobs(max_jobs=max_jobs, since=since)

    if source_name == "arbeitnow":
        return await fetch_arbeitnow_jobs(max_jobs=max_jobs, since=since)

    raise ValueError(f"Unsupported source_name: {source_name}")
