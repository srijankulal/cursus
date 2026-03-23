from typing import Any, Literal

from pydantic import BaseModel, Field, HttpUrl


class IngestRequest(BaseModel):
    source_url: HttpUrl
    doc_type: Literal["notes", "qpaper"]
    document_name: str | None = None
    document_id: str | None = None
    subject: str | None = None
    course: str | None = None
    tags: list[str] = Field(default_factory=list)
    extra_metadata: dict[str, Any] = Field(default_factory=dict)


class IngestResponse(BaseModel):
    document_id: str
    status: str
    doc_type: Literal["notes", "qpaper"]
    namespace: str
    vector_count: int
    chunk_count: int
    question_count: int = 0
    duplicate_skipped: bool = False
    message: str


class QueryRequest(BaseModel):
    query: str = Field(min_length=3)
    top_k: int = Field(default=8, ge=1, le=30)
    doc_type: Literal["notes", "qpaper"] | None = None
    namespace: str | None = None
    document_id: str | None = None
    subject: str | None = None
    tags: list[str] = Field(default_factory=list)


class QueryHit(BaseModel):
    id: str
    score: float
    text_preview: str
    metadata: dict[str, Any]


class QueryResponse(BaseModel):
    matches: list[QueryHit]
    used_namespaces: list[str]
