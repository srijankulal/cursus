import hashlib
import json
import os
import tempfile
import uuid
from datetime import UTC, datetime
from typing import Any, Literal

import requests
from fastapi import HTTPException
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

from backend.config import Settings
from backend.schemas import (
    IngestRequest,
    IngestResponse,
    QueryCleanResponse,
    QueryHit,
    QueryRequest,
    QueryResponse,
)
from backend.state import AppState


def now_iso() -> str:
    return datetime.now(UTC).isoformat()


def normalize_text(value: str) -> str:
    return "\n".join(line.strip() for line in value.splitlines() if line.strip())


def compute_text_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def default_document_id(doc_type: str, source_url: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"{doc_type}:{source_url}"))


def sanitize_metadata(metadata: dict[str, Any]) -> dict[str, Any]:
    sanitized: dict[str, Any] = {}
    for key, value in metadata.items():
        if value is None:
            continue
        if isinstance(value, (str, int, float, bool)):
            sanitized[key] = value
            continue
        if isinstance(value, list):
            sanitized[key] = [str(item) for item in value if item is not None]
            continue
        sanitized[key] = json.dumps(value, ensure_ascii=False)
    return sanitized


def parse_json_from_gemini_text(text: str) -> list[dict[str, Any]]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()
    try:
        payload = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("[")
        end = cleaned.rfind("]")
        if start == -1 or end == -1 or end <= start:
            return []
        payload = json.loads(cleaned[start : end + 1])
    if not isinstance(payload, list):
        return []
    return [item for item in payload if isinstance(item, dict)]


def build_filter(payload: QueryRequest) -> dict[str, Any] | None:
    conditions: list[dict[str, Any]] = []
    if payload.document_id:
        conditions.append({"document_id": {"$eq": payload.document_id}})
    if payload.subject:
        conditions.append({"subject": {"$eq": payload.subject}})
    if payload.tags:
        conditions.append({"tags": {"$in": payload.tags}})

    if not conditions:
        return None
    if len(conditions) == 1:
        return conditions[0]
    return {"$and": conditions}


def serialize_match(match: Any) -> QueryHit:
    metadata = dict(getattr(match, "metadata", {}) or {})
    text_preview = str(
        metadata.get("question_text_preview")
        or metadata.get("text_preview")
        or metadata.get("chunk_text_preview")
        or ""
    )
    return QueryHit(
        id=str(getattr(match, "id", "")),
        score=float(getattr(match, "score", 0.0)),
        text_preview=text_preview[:300],
        metadata=metadata,
    )


def get_namespace_from_doc_type(settings: Settings, doc_type: str) -> str:
    return (
        settings.pinecone_notes_namespace
        if doc_type == "notes"
        else settings.pinecone_qpaper_namespace
    )


def download_pdf(url: str, timeout_seconds: int) -> str:
    response = requests.get(url, timeout=timeout_seconds)
    response.raise_for_status()
    content_type = response.headers.get("Content-Type", "")
    if "pdf" not in content_type.lower() and not url.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Source URL is not a PDF document")

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    temp_file.write(response.content)
    temp_file.flush()
    temp_file.close()
    return temp_file.name


def extract_and_chunk_pdf(settings: Settings, source_url: str) -> tuple[str, list[Any]]:
    pdf_path = download_pdf(source_url, settings.request_timeout_seconds)
    try:
        loader = PyPDFLoader(pdf_path)
        documents = loader.load()
        if not documents:
            raise HTTPException(status_code=400, detail="No selectable text found in PDF")
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            separators=["\n\n", "\n", " ", ""],
        )
        chunks = splitter.split_documents(documents)
        merged_text = normalize_text("\n".join(doc.page_content for doc in documents))
        if not merged_text:
            raise HTTPException(status_code=400, detail="Extracted text is empty")
        return merged_text, chunks
    finally:
        try:
            os.unlink(pdf_path)
        except OSError:
            pass


def embed_texts(
    state: AppState, texts: list[str], input_type: Literal["passage", "query"]
) -> list[list[float]]:
    if not texts:
        return []
    result = state.pinecone_client.inference.embed(
        model=state.settings.pinecone_embedding_model,
        inputs=texts,
        parameters={"input_type": input_type, "truncate": "END"},
    )
    data = getattr(result, "data", result)
    vectors: list[list[float]] = []
    for item in data:
        values = getattr(item, "values", None)
        if values is None and isinstance(item, dict):
            values = item.get("values")
        if values is None:
            raise HTTPException(status_code=500, detail="Embedding response malformed")
        vectors.append(list(values))
    return vectors


def upsert_vectors(state: AppState, namespace: str, vectors: list[dict[str, Any]]) -> None:
    batch_size = state.settings.pinecone_batch_size
    for start in range(0, len(vectors), batch_size):
        state.pinecone_index.upsert(
            vectors=vectors[start : start + batch_size], namespace=namespace
        )


def parse_questions_with_gemini(state: AppState, text: str) -> list[dict[str, Any]]:
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{state.settings.gemini_model}:generateContent"
    )
    system_prompt = (
        "You are an exam parser. Extract each question from the provided text and return only a JSON array. "
        "Each object fields: question_number (string), question_text (string), question_type (string), "
        "marks (number or null), section (string or null), difficulty_hint (easy|medium|hard|null)."
    )
    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {"temperature": 0.0, "maxOutputTokens": 2048},
    }
    response = requests.post(
        f"{url}?key={state.settings.gemini_api_key}",
        json=payload,
        timeout=state.settings.request_timeout_seconds,
    )
    response.raise_for_status()
    data = response.json()
    candidates = data.get("candidates", [])
    if not candidates:
        return []
    parts = candidates[0].get("content", {}).get("parts", [])
    if not parts:
        return []
    text_output = parts[0].get("text", "")
    return parse_json_from_gemini_text(text_output)


def generate_clean_notes_answer(
    state: AppState,
    question: str,
    contexts: list[str],
    style: Literal["brief", "detailed", "bullets"] = "brief",
) -> str:
    context_block = "\n\n".join(
        f"Context {index + 1}:\n{context}" for index, context in enumerate(contexts)
    )
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{state.settings.gemini_model}:generateContent"
    )
    style_instructions = {
        "brief": "Respond in 3-5 concise sentences.",
        "detailed": "Respond with a well-structured detailed explanation.",
        "bullets": "Respond as concise bullet points.",
    }
    system_prompt = (
        "You are a study assistant. Answer the user's question only from the provided contexts. "
        "Write clear English and do not hallucinate details. "
        f"Formatting requirement: {style_instructions.get(style, style_instructions['brief'])} "
        "If context is insufficient, say so clearly."
    )
    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [
            {
                "parts": [
                    {
                        "text": (
                            f"Question:\n{question}\n\n"
                            f"Retrieved Contexts:\n{context_block}"
                        )
                    }
                ]
            }
        ],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 1024},
    }
    response = requests.post(
        f"{url}?key={state.settings.gemini_api_key}",
        json=payload,
        timeout=state.settings.request_timeout_seconds,
    )
    response.raise_for_status()
    data = response.json()
    candidates = data.get("candidates", [])
    if not candidates:
        return "No answer could be generated from retrieved notes."
    parts = candidates[0].get("content", {}).get("parts", [])
    if not parts:
        return "No answer could be generated from retrieved notes."
    answer = str(parts[0].get("text", "")).strip()
    return answer or "No answer could be generated from retrieved notes."


def generate_fallback_notes_answer(
    state: AppState,
    question: str,
    style: Literal["brief", "detailed", "bullets"] = "brief",
) -> str:
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{state.settings.gemini_model}:generateContent"
    )
    style_instructions = {
        "brief": "Respond in 3-5 concise sentences.",
        "detailed": "Respond with a well-structured detailed explanation.",
        "bullets": "Respond as concise bullet points.",
    }
    system_prompt = (
        "You are a study assistant. The retrieval system found no relevant chunks, so answer from general knowledge. "
        "Be clear and practical for a student. Mention briefly that this is a fallback answer based on general knowledge. "
        f"Formatting requirement: {style_instructions.get(style, style_instructions['brief'])}"
    )
    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"parts": [{"text": f"Question:\n{question}"}]}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 1024},
    }
    response = requests.post(
        f"{url}?key={state.settings.gemini_api_key}",
        json=payload,
        timeout=state.settings.request_timeout_seconds,
    )
    response.raise_for_status()
    data = response.json()
    candidates = data.get("candidates", [])
    if not candidates:
        return "No answer could be generated."
    parts = candidates[0].get("content", {}).get("parts", [])
    if not parts:
        return "No answer could be generated."
    answer = str(parts[0].get("text", "")).strip()
    return answer or "No answer could be generated."


def build_base_metadata(
    payload: IngestRequest, document_id: str, document_name: str, text_hash: str
) -> dict[str, Any]:
    metadata: dict[str, Any] = {
        "document_id": document_id,
        "document_name": document_name,
        "doc_type": payload.doc_type,
        "source_url": str(payload.source_url),
        "subject": payload.subject,
        "course": payload.course,
        "tags": payload.tags,
        "text_hash": text_hash,
        "created_at": now_iso(),
    }
    metadata.update(payload.extra_metadata)
    return sanitize_metadata(metadata)


def get_ingestion_status(state: AppState, document_id: str) -> dict[str, Any]:
    doc = state.mongo_collection.find_one({"_id": document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


def ingest_document(state: AppState, payload: IngestRequest) -> IngestResponse:
    settings = state.settings

    document_id = payload.document_id or default_document_id(
        payload.doc_type, str(payload.source_url)
    )
    document_name = payload.document_name or str(payload.source_url).split("/")[-1] or document_id
    namespace = get_namespace_from_doc_type(settings, payload.doc_type)

    state.mongo_collection.update_one(
        {"_id": document_id},
        {
            "$set": {
                "document_id": document_id,
                "document_name": document_name,
                "doc_type": payload.doc_type,
                "source_url": str(payload.source_url),
                "status": "processing",
                "updated_at": now_iso(),
            },
            "$setOnInsert": {"created_at": now_iso()},
        },
        upsert=True,
    )

    try:
        full_text, chunks = extract_and_chunk_pdf(settings, str(payload.source_url))
        text_hash = compute_text_hash(full_text)

        existing = state.mongo_collection.find_one({"_id": document_id})
        if (
            existing
            and existing.get("status") == "completed"
            and existing.get("text_hash") == text_hash
        ):
            return IngestResponse(
                document_id=document_id,
                status="completed",
                doc_type=payload.doc_type,
                namespace=namespace,
                vector_count=int(existing.get("vector_count", 0)),
                chunk_count=int(existing.get("chunk_count", 0)),
                question_count=int(existing.get("question_count", 0)),
                duplicate_skipped=True,
                message="Duplicate content detected; skipped re-indexing",
            )

        base_metadata = build_base_metadata(payload, document_id, document_name, text_hash)

        vectors: list[dict[str, Any]] = []
        question_count = 0
        question_documents: list[dict[str, Any]] = []

        if payload.doc_type == "notes":
            texts = [normalize_text(chunk.page_content) for chunk in chunks]
            embeddings = embed_texts(state, texts, "passage")
            for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings, strict=True)):
                chunk_text = normalize_text(chunk.page_content)
                metadata = {
                    **base_metadata,
                    "chunk_index": idx,
                    "chunk_id": f"{document_id}:chunk:{idx}",
                    "page_number": int(chunk.metadata.get("page", 0)) + 1,
                    "chunk_text_preview": chunk_text[:280],
                }
                vectors.append(
                    {
                        "id": f"{document_id}:chunk:{idx}",
                        "values": embedding,
                        "metadata": sanitize_metadata(metadata),
                    }
                )
        else:
            qid = 0
            for idx, chunk in enumerate(chunks):
                chunk_text = normalize_text(chunk.page_content)
                if not chunk_text:
                    continue
                questions = parse_questions_with_gemini(state, chunk_text)
                for question in questions:
                    question_text = normalize_text(str(question.get("question_text", "")))
                    if not question_text:
                        continue
                    qid += 1
                    question_count += 1
                    metadata = {
                        **base_metadata,
                        "chunk_index": idx,
                        "chunk_id": f"{document_id}:chunk:{idx}",
                        "question_id": f"{document_id}:q:{qid}",
                        "question_number": str(question.get("question_number") or qid),
                        "question_type": question.get("question_type", "unknown"),
                        "marks": question.get("marks"),
                        "section": question.get("section"),
                        "difficulty_hint": question.get("difficulty_hint"),
                        "parse_status": "parsed",
                        "question_text_preview": question_text[:280],
                    }
                    vectors.append(
                        {
                            "id": f"{document_id}:q:{qid}",
                            "text": question_text,
                            "metadata": sanitize_metadata(metadata),
                        }
                    )
                    question_documents.append(
                        {
                            "document_id": document_id,
                            "document_name": document_name,
                            "doc_type": payload.doc_type,
                            "source_url": str(payload.source_url),
                            "chunk_index": idx,
                            "chunk_id": f"{document_id}:chunk:{idx}",
                            "question_id": f"{document_id}:q:{qid}",
                            "question_number": str(question.get("question_number") or qid),
                            "question_text": question_text,
                            "question_type": question.get("question_type", "unknown"),
                            "marks": question.get("marks"),
                            "section": question.get("section"),
                            "difficulty_hint": question.get("difficulty_hint"),
                            "subject": payload.subject,
                            "course": payload.course,
                            "tags": payload.tags,
                            "text_hash": text_hash,
                            "parse_status": "parsed",
                            "created_at": now_iso(),
                        }
                    )

            if not vectors:
                texts = [normalize_text(chunk.page_content) for chunk in chunks]
                fallback_embeddings = embed_texts(state, texts, "passage")
                for idx, (chunk, embedding) in enumerate(
                    zip(chunks, fallback_embeddings, strict=True)
                ):
                    chunk_text = normalize_text(chunk.page_content)
                    metadata = {
                        **base_metadata,
                        "chunk_index": idx,
                        "chunk_id": f"{document_id}:chunk:{idx}",
                        "parse_status": "fallback_chunk",
                        "chunk_text_preview": chunk_text[:280],
                    }
                    vectors.append(
                        {
                            "id": f"{document_id}:chunk:{idx}",
                            "values": embedding,
                            "metadata": sanitize_metadata(metadata),
                        }
                    )

            if vectors and "values" not in vectors[0]:
                question_texts = [item["text"] for item in vectors]
                question_embeddings = embed_texts(state, question_texts, "passage")
                for item, embedding in zip(vectors, question_embeddings, strict=True):
                    item["values"] = embedding
                    item.pop("text", None)

        try:
            state.pinecone_index.delete(
                namespace=namespace,
                filter={"document_id": {"$eq": document_id}},
            )
        except Exception:
            pass

        if payload.doc_type == "qpaper":
            state.mongo_questions_collection.delete_many({"document_id": document_id})
            if question_documents:
                state.mongo_questions_collection.insert_many(question_documents)

        upsert_vectors(state, namespace, vectors)

        state.mongo_collection.update_one(
            {"_id": document_id},
            {
                "$set": {
                    "document_id": document_id,
                    "document_name": document_name,
                    "doc_type": payload.doc_type,
                    "source_url": str(payload.source_url),
                    "subject": payload.subject,
                    "course": payload.course,
                    "tags": payload.tags,
                    "text_hash": text_hash,
                    "namespace": namespace,
                    "status": "completed",
                    "chunk_count": len(chunks),
                    "question_count": question_count,
                    "vector_count": len(vectors),
                    "updated_at": now_iso(),
                    "last_error": None,
                },
                "$setOnInsert": {"created_at": now_iso()},
            },
            upsert=True,
        )

        return IngestResponse(
            document_id=document_id,
            status="completed",
            doc_type=payload.doc_type,
            namespace=namespace,
            vector_count=len(vectors),
            chunk_count=len(chunks),
            question_count=question_count,
            duplicate_skipped=False,
            message="Document ingested and indexed successfully",
        )
    except HTTPException:
        state.mongo_collection.update_one(
            {"_id": document_id},
            {"$set": {"status": "failed", "updated_at": now_iso()}},
            upsert=True,
        )
        raise
    except Exception as exc:  # noqa: BLE001
        state.mongo_collection.update_one(
            {"_id": document_id},
            {
                "$set": {
                    "status": "failed",
                    "updated_at": now_iso(),
                    "last_error": str(exc),
                }
            },
            upsert=True,
        )
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {exc}") from exc


def query_vectors(state: AppState, payload: QueryRequest) -> QueryResponse:
    settings = state.settings

    query_embedding = embed_texts(state, [payload.query], "query")[0]
    metadata_filter = build_filter(payload)

    if payload.namespace:
        namespaces = [payload.namespace]
    elif payload.doc_type:
        namespaces = [get_namespace_from_doc_type(settings, payload.doc_type)]
    else:
        namespaces = [settings.pinecone_notes_namespace, settings.pinecone_qpaper_namespace]

    all_hits: list[QueryHit] = []
    for namespace in namespaces:
        result = state.pinecone_index.query(
            namespace=namespace,
            vector=query_embedding,
            top_k=payload.top_k,
            include_metadata=True,
            filter=metadata_filter,
        )
        matches = getattr(result, "matches", [])
        all_hits.extend(serialize_match(match) for match in matches)

    all_hits.sort(key=lambda hit: hit.score, reverse=True)
    return QueryResponse(matches=all_hits[: payload.top_k], used_namespaces=namespaces)


def query_clean(state: AppState, payload: QueryRequest) -> QueryCleanResponse:
    query_result = query_vectors(state, payload)
    mode = payload.doc_type or "notes"

    if mode == "qpaper":
        if not query_result.matches:
            return QueryCleanResponse(answer="No matching question found.")

        top_match = query_result.matches[0]
        question_id = top_match.metadata.get("question_id")
        if not question_id:
            return QueryCleanResponse(answer="No matching question found.")

        question_doc = state.mongo_questions_collection.find_one(
            {"question_id": question_id},
            {"_id": 0, "question_text": 1},
        )
        if not question_doc or not question_doc.get("question_text"):
            return QueryCleanResponse(answer="No full question text found for this match.")

        return QueryCleanResponse(answer=str(question_doc["question_text"]))

    if not query_result.matches:
        return QueryCleanResponse(
            answer=generate_fallback_notes_answer(state, payload.query, payload.style),
            used_gemini_fallback=True,
        )

    contexts: list[str] = []
    seen_chunk_ids: set[str] = set()
    notes_namespace = state.settings.pinecone_notes_namespace

    for match in query_result.matches[: payload.top_k]:
        if float(match.score) < state.settings.clean_query_min_score:
            continue

        match_document_id = str(match.metadata.get("document_id") or "").strip()
        chunk_index_raw = match.metadata.get("chunk_index")
        try:
            chunk_index = int(chunk_index_raw)
        except (TypeError, ValueError):
            chunk_index = None

        candidate_chunks: list[tuple[str, str]] = []
        direct_chunk_id = str(match.metadata.get("chunk_id") or "").strip()
        if direct_chunk_id:
            candidate_chunks.append((direct_chunk_id, notes_namespace))

        if match_document_id and chunk_index is not None:
            prev_idx = chunk_index - 1
            next_idx = chunk_index + 1
            if prev_idx >= 0:
                candidate_chunks.append((f"{match_document_id}:chunk:{prev_idx}", notes_namespace))
            candidate_chunks.append((f"{match_document_id}:chunk:{next_idx}", notes_namespace))

        for chunk_id, namespace in candidate_chunks:
            if chunk_id in seen_chunk_ids:
                continue

            chunk_text = ""
            try:
                fetch_result = state.pinecone_index.fetch(ids=[chunk_id], namespace=namespace)
                vectors = getattr(fetch_result, "vectors", {}) or {}
                vector_item = vectors.get(chunk_id) if isinstance(vectors, dict) else None
                if vector_item:
                    vector_metadata = getattr(vector_item, "metadata", None)
                    if vector_metadata is None and isinstance(vector_item, dict):
                        vector_metadata = vector_item.get("metadata", {})
                    vector_metadata = dict(vector_metadata or {})
                    chunk_text = str(
                        vector_metadata.get("chunk_text_preview")
                        or vector_metadata.get("question_text_preview")
                        or ""
                    ).strip()
            except Exception:
                chunk_text = ""

            if not chunk_text and chunk_id == direct_chunk_id:
                chunk_text = str(
                    match.metadata.get("chunk_text_preview")
                    or match.metadata.get("question_text_preview")
                    or match.text_preview
                    or ""
                ).strip()

            if chunk_text:
                contexts.append(chunk_text)
                seen_chunk_ids.add(chunk_id)

    if not contexts:
        answer = generate_fallback_notes_answer(state, payload.query, payload.style)
        used_fallback = True
    else:
        answer = generate_clean_notes_answer(state, payload.query, contexts, payload.style)
        used_fallback = False

    return QueryCleanResponse(
        answer=answer,
        used_gemini_fallback=used_fallback,
    )
