import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel

BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")


class Settings(BaseModel):
    mongodb_uri: str
    mongodb_db_name: str = "cursus"
    mongodb_documents_collection: str = "rag_documents"

    pinecone_api_key: str
    pinecone_index_name: str
    pinecone_embedding_model: str = "llama-text-embed-v2"
    pinecone_batch_size: int = 50
    pinecone_notes_namespace: str = "notes"
    pinecone_qpaper_namespace: str = "qpaper"

    gemini_api_key: str
    gemini_model: str = "gemini-2.0-flash"

    chunk_size: int = 1200
    chunk_overlap: int = 200
    request_timeout_seconds: int = 45


def get_required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def load_settings() -> Settings:
    return Settings(
        mongodb_uri=get_required_env("MONGODB_URI"),
        mongodb_db_name=os.getenv("MONGODB_DB_NAME", "cursus"),
        mongodb_documents_collection=os.getenv(
            "MONGODB_DOCUMENTS_COLLECTION", "rag_documents"
        ),
        pinecone_api_key=get_required_env("PINECONE_API_KEY"),
        pinecone_index_name=get_required_env("PINECONE_INDEX_NAME"),
        pinecone_embedding_model=os.getenv(
            "PINECONE_EMBEDDING_MODEL", "llama-text-embed-v2"
        ),
        pinecone_batch_size=int(os.getenv("PINECONE_BATCH_SIZE", "50")),
        pinecone_notes_namespace=os.getenv("PINECONE_NOTES_NAMESPACE", "notes"),
        pinecone_qpaper_namespace=os.getenv("PINECONE_QPAPER_NAMESPACE", "qpaper"),
        gemini_api_key=get_required_env("GEMINI_API_KEY"),
        gemini_model=os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
        chunk_size=int(os.getenv("CHUNK_SIZE", "1200")),
        chunk_overlap=int(os.getenv("CHUNK_OVERLAP", "200")),
        request_timeout_seconds=int(os.getenv("REQUEST_TIMEOUT_SECONDS", "45")),
    )
