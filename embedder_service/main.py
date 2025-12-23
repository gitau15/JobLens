from typing import List

import chromadb
from fastapi import FastAPI
from sentence_transformers import SentenceTransformer

from models import (
    EmbedJobsRequest,
    EmbedJobsResponse,
    EmbedQueryRequest,
    EmbedQueryResponse,
)


app = FastAPI(title="Embedding Service", version="0.1.0")


# Initialise ChromaDB persistent client and collection
_client = chromadb.PersistentClient(path="chroma_data")


def _get_collection(name: str):
    return _client.get_or_create_collection(name)


# Load a small, CPU-friendly sentence transformer model once at startup
_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


@app.get("/health")
async def health_check() -> dict:
    return {"status": "ok"}


@app.post("/embed/jobs", response_model=EmbedJobsResponse)
async def embed_jobs(payload: EmbedJobsRequest) -> EmbedJobsResponse:
    collection = _get_collection(payload.collection_name)

    texts: List[str] = [job.as_text() for job in payload.jobs]
    ids: List[str] = [job.id for job in payload.jobs]
    metadatas = [
        {
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "source_name": job.source_name,
        }
        for job in payload.jobs
    ]

    embeddings = _model.encode(
        texts,
        batch_size=32,
        show_progress_bar=False,
        convert_to_numpy=True,
    ).tolist()

    collection.upsert(ids=ids, embeddings=embeddings, metadatas=metadatas)

    return EmbedJobsResponse(collection_name=payload.collection_name, count=len(ids))


@app.post("/embed/query", response_model=EmbedQueryResponse)
async def embed_query(payload: EmbedQueryRequest) -> EmbedQueryResponse:
    embedding = _model.encode([payload.text], convert_to_numpy=True)[0].tolist()
    return EmbedQueryResponse(embedding=embedding)
