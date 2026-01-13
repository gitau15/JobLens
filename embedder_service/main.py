from typing import List

import chromadb
from fastapi import FastAPI, UploadFile
from sentence_transformers import SentenceTransformer

# Import at the function level to avoid startup issues if libraries are missing
from io import BytesIO
import traceback

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


@app.post("/embed/cv", response_model=EmbedQueryResponse)
async def embed_cv(file: UploadFile):
    """
    Endpoint to upload and process a CV file, extract text, and return embedding
    Supports PDF, DOC, DOCX files
    """
    try:
        # Read the file content
        content = await file.read()
        
        # Extract text based on file type
        try:
            if file.content_type == "application/pdf":
                # For PDF files, we need to extract text
                import PyPDF2
                pdf_stream = BytesIO(content)
                pdf_reader = PyPDF2.PdfReader(pdf_stream)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text()
                
            elif file.content_type in ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
                # For DOC/DOCX files, extract text
                from docx import Document
                doc_stream = BytesIO(content)
                doc = Document(doc_stream)
                text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
                
            elif file.content_type in ["text/plain", "text/csv", "application/octet-stream"]:
                # For plain text files
                text = content.decode("utf-8")
            else:
                # For other file types, try to decode as text
                try:
                    text = content.decode("utf-8")
                except UnicodeDecodeError:
                    raise HTTPException(status_code=400, detail="File format not supported. Please upload a text, PDF, DOC, or DOCX file.")
        except ImportError as e:
            raise HTTPException(status_code=500, detail=f"Required library not available: {str(e)}")
        except Exception as e:
            print(f"Error processing file: {str(e)}")
            print(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
        
        # Generate embedding for the extracted text
        embedding = _model.encode([text], convert_to_numpy=True)[0].tolist()
        
        return EmbedQueryResponse(embedding=embedding)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")
