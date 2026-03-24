# Cursus

Full-stack academic workflow platform with:
- **Frontend**: Next.js app for HOD, staff, and student experiences
- **Backend**: FastAPI RAG service for PDF ingestion, question extraction, and context-aware answers

## Project Structure

- [frontend](frontend)
  - Next.js UI + API routes
  - Auth/session handling
  - Dashboards (HOD, staff, student)
  - RAG and question-paper workflows
- [backend](backend)
  - FastAPI app
  - PDF ingest/query pipelines
  - MongoDB + Pinecone + Gemini integrations
- [render.yaml](render.yaml)
  - Render deployment config for backend service

## Prerequisites

- Node.js 18+
- npm
- Python 3.13+
- MongoDB
- Pinecone account/index
- Gemini API key

## Environment Variables

### Frontend (`frontend/.env.local`)

At minimum:

```env
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=cursus
```

> Add any additional frontend variables your local setup needs.

### Backend (`backend/.env`)

Required:

```env
MONGODB_URI=
PINECONE_API_KEY=
PINECONE_INDEX_NAME=
GEMINI_API_KEY=
```

Common optional values:

```env
MONGODB_DB_NAME=cursus
MONGODB_DOCUMENTS_COLLECTION=rag_documents
MONGODB_QUESTIONS_COLLECTION=rag_qpaper_questions
PINECONE_EMBEDDING_MODEL=llama-text-embed-v2
PINECONE_NOTES_NAMESPACE=notes
PINECONE_QPAPER_NAMESPACE=qpaper
GEMINI_MODEL=gemini-3-flash-preview
CLEAN_QUERY_MIN_SCORE=0.2
```

## Run Locally

### 1) Start Backend (FastAPI)

From repository root:

```bash
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

Backend docs: http://127.0.0.1:8000/docs

### 2) Start Frontend (Next.js)

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend app: http://localhost:3000

## Backend API (high-level)

- `GET /health` – backend health check
- `POST /ingest` – ingest PDF (`notes` or `qpaper`)
- `GET /ingest/{document_id}` – ingest status/details
- `POST /query` – retrieval results
- `POST /query-clean` – cleaned answer generation

## Deployment

Render backend deployment is configured in [render.yaml](render.yaml).

## Related Docs

- Frontend details: [frontend/README.md](frontend/README.md)
- Backend details: [backend/README.md](backend/README.md)
