# Cursus Backend (FastAPI)

RAG backend for ingesting PDF links, indexing in Pinecone, storing ingest metadata in MongoDB, and querying via retrieval + optional answer synthesis.

## Run

From workspace root:

```bash
c:/Jonathan/dev/cursus/cursus/backend/.venv/Scripts/python.exe -m uvicorn backend.main:app --reload --port 8000
```

Swagger: `http://127.0.0.1:8000/docs`

## Environment

Copy values into `backend/.env` (template: `backend/.env.example`).

Required keys:
- `MONGODB_URI`
- `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME`
- `GEMINI_API_KEY`

Important optional keys:
- `MONGODB_DB_NAME` (default: `cursus`)
- `MONGODB_DOCUMENTS_COLLECTION` (default: `rag_documents`)
- `MONGODB_QUESTIONS_COLLECTION` (default: `rag_qpaper_questions`)
- `PINECONE_EMBEDDING_MODEL` (default: `llama-text-embed-v2`)
- `PINECONE_NOTES_NAMESPACE` / `PINECONE_QPAPER_NAMESPACE`
- `CLEAN_QUERY_MIN_SCORE` (default: `0.2`)

## API Endpoints

### `GET /health`
Checks MongoDB connectivity.

Response:
```json
{ "status": "ok" }
```

### `POST /ingest`
Ingests a selectable-text PDF URL.

Request body:
```json
{
	"source_url": "https://example.com/file.pdf",
	"doc_type": "notes",
	"document_name": "AI Unit 3 Notes",
	"document_id": "doc-notes-001",
	"subject": "Artificial Intelligence",
	"course": "BCA",
	"tags": ["semester-5", "unit-3"],
	"extra_metadata": {
		"department": "CSE",
		"academic_year": "2025-26"
	}
}
```

Behavior:
- `notes`: chunk + embed + store vectors in Pinecone notes namespace.
- `qpaper`: Gemini extracts questions, stores question vectors in qpaper namespace.
- `qpaper`: parsed question JSON is also saved in Mongo collection `MONGODB_QUESTIONS_COLLECTION`.

Response shape:
```json
{
	"document_id": "doc-notes-001",
	"status": "completed",
	"doc_type": "notes",
	"namespace": "notes",
	"vector_count": 24,
	"chunk_count": 24,
	"question_count": 0,
	"duplicate_skipped": false,
	"message": "Document ingested and indexed successfully"
}
```

### `GET /ingest/{document_id}`
Returns ingest status/details from MongoDB `MONGODB_DOCUMENTS_COLLECTION`.

### `POST /query`
Raw retrieval endpoint (returns matches + scores + metadata).

Request body:
```json
{
	"query": "important ai midterm questions",
	"doc_type": "qpaper",
	"top_k": 8,
	"style": "brief"
}
```

Response shape:
```json
{
	"matches": [
		{
			"id": "doc-qpaper-001:q:9",
			"score": 0.33,
			"text_preview": "...",
			"metadata": {}
		}
	],
	"used_namespaces": ["qpaper"]
}
```

### `POST /query-clean`
Clean answer endpoint.

Request fields are same as `/query`:
- `query` (required)
- `doc_type`, `top_k`, `document_id`, `subject`, `tags`, `namespace`
- `style`: `brief | detailed | bullets` (used for notes only)

Behavior:
- `doc_type=qpaper`: returns full question text from Mongo question collection.
- `doc_type=notes`: uses top retrieved chunks (+ adjacent chunks) and asks Gemini for a cleaner answer.
- If no strong note match (`score < CLEAN_QUERY_MIN_SCORE`), uses Gemini fallback answer and flags it.

Response shape:
```json
{
	"answer": "...",
	"used_gemini_fallback": false
}
```

For qpaper:
```json
{
	"answer": "Full question text ..."
}
```

## Code Structure

- `backend/main.py`: entrypoint (`from backend.api import app`)
- `backend/api.py`: route definitions
- `backend/state.py`: startup/lifespan and shared clients
- `backend/config.py`: environment config loading/validation
- `backend/schemas.py`: request/response models
- `backend/services.py`: ingestion/query business logic
