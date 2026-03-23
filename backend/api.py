from typing import Any

from fastapi import FastAPI, HTTPException

from backend.schemas import IngestRequest, IngestResponse, QueryRequest, QueryResponse
from backend.services import get_ingestion_status, ingest_document, query_vectors
from backend.state import AppState, lifespan

app = FastAPI(title="Cursus", version="0.1.0", lifespan=lifespan)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    state: AppState = app.state.state
    try:
        state.mongo_client.admin.command("ping")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"MongoDB ping failed: {exc}") from exc
    return {"status": "ok"}


@app.get("/ingest/{document_id}")
def ingestion_status(document_id: str) -> dict[str, Any]:
    state: AppState = app.state.state
    return get_ingestion_status(state, document_id)


@app.post("/ingest", response_model=IngestResponse)
def ingest(payload: IngestRequest) -> IngestResponse:
    state: AppState = app.state.state
    return ingest_document(state, payload)


@app.post("/query", response_model=QueryResponse)
def query(payload: QueryRequest) -> QueryResponse:
    state: AppState = app.state.state
    return query_vectors(state, payload)
