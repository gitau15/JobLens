# JobLens Matcher Service

The Matcher Service is responsible for semantic CV-job matching using vector embeddings. It connects to ChromaDB to perform similarity searches between CV embeddings and job embeddings.

## Features

- Semantic matching between CV and job embeddings
- Business logic filtering and re-ranking
- Support for various job filters (location, remote work, etc.)
- FastAPI-based REST API with automatic documentation

## Endpoints

- `GET /health` - Health check
- `POST /match` - Basic semantic matching
- `POST /match-with-rerank` - Semantic matching with business logic re-ranking

## Models

The service uses Pydantic models defined in `models.py`:
- `MatchRequest` - Request for matching CV to jobs
- `JobMatch` - Represents a matched job with similarity score
- `MatchResponse` - Response containing matched jobs

## Architecture

The service connects to the ChromaDB vector store where job embeddings are stored. When a CV embedding is received, it performs a similarity search to find the most relevant jobs.

## Usage

1. Ensure ChromaDB is running and populated with job embeddings
2. Send a POST request to `/match` with the CV embedding
3. Receive a list of relevant jobs ranked by semantic similarity

## Configuration

- `CHROMADB_PATH` - Path to ChromaDB persistent storage (defaults to `./chroma_data`)