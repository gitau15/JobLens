from datetime import datetime
from typing import List, Optional

import httpx
from bs4 import BeautifulSoup

from models import JobModel


ARBEITNOW_API_URL = "https://www.arbeitnow.com/api/job-board-api"


async def fetch_arbeitnow_jobs(
    max_jobs: int = 50,
    since: Optional[datetime] = None,
) -> List[JobModel]:
    """Fetch jobs from the Arbeitnow public job board API.

    This is a second, independent job source to complement Remotive.
    """

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(ARBEITNOW_API_URL)
        response.raise_for_status()
        data = response.json()

    jobs: List[JobModel] = []
    for raw in data.get("data", [])[:max_jobs]:
        created_at = _parse_created_at(raw.get("created_at"))

        if since and created_at and created_at < since:
            continue

        description_html = raw.get("description") or ""
        description_text = _html_to_text(description_html)

        tags = raw.get("tags") or []
        if not isinstance(tags, list):
            tags = []

        job = JobModel(
            source_name="arbeitnow",
            external_id=str(raw.get("slug") or ""),
            job_url=raw.get("url") or "",
            title=raw.get("title") or "",
            description=description_text,
            company=raw.get("company_name"),
            location=raw.get("location"),
            employment_type=None,
            remote_option="remote" if raw.get("remote") else None,
            posted_at=created_at,
            skills=[str(t) for t in tags],
        )
        jobs.append(job)

    return jobs


def _parse_created_at(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _html_to_text(html: str) -> str:
    if not html:
        return ""

    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text(separator="\n").strip()
