from datetime import datetime
from typing import List, Optional

import httpx
from bs4 import BeautifulSoup

from models import JobModel


REMOTIVE_API_URL = "https://remotive.com/api/remote-jobs"


async def fetch_remotive_jobs(
    max_jobs: int = 50,
    since: Optional[datetime] = None,
    search: Optional[str] = None,
    category: Optional[str] = None,
) -> List[JobModel]:
    """Fetch remote jobs from the Remotive public API and map them to JobModel.

    This function is designed for light usage suitable for a final-year project
    and respects the free, public nature of the API.
    """

    params = {}
    if search:
        params["search"] = search
    if category:
        params["category"] = category

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(REMOTIVE_API_URL, params=params)
        response.raise_for_status()
        data = response.json()

    jobs: List[JobModel] = []
    for raw in data.get("jobs", [])[:max_jobs]:
        publication_date = _parse_publication_date(raw.get("publication_date"))

        if since and publication_date and publication_date < since:
            continue

        description_html = raw.get("description") or ""
        description_text = _html_to_text(description_html)

        job = JobModel(
            source_name="remotive",
            external_id=str(raw.get("id")),
            job_url=raw.get("url") or "",
            title=raw.get("title") or "",
            description=description_text,
            company=raw.get("company_name"),
            location=raw.get("candidate_required_location"),
            employment_type=_map_job_type(raw.get("job_type")),
            remote_option="remote",
            posted_at=publication_date,
        )
        jobs.append(job)

    return jobs


def _parse_publication_date(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        # Remotive returns ISO-8601 strings, sometimes with a trailing Z.
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _map_job_type(job_type: Optional[str]) -> Optional[str]:
    if not job_type:
        return None

    mapping = {
        "full_time": "Full-time",
        "part_time": "Part-time",
        "contract": "Contract",
        "freelance": "Freelance",
        "internship": "Internship",
    }
    return mapping.get(job_type, job_type)


def _html_to_text(html: str) -> str:
    if not html:
        return ""

    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text(separator="\n").strip()
