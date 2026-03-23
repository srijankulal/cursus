from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from pinecone import Pinecone
from pymongo import MongoClient

from backend.config import Settings, load_settings


class AppState:
    settings: Settings
    mongo_client: MongoClient
    mongo_collection: Any
    pinecone_client: Pinecone
    pinecone_index: Any


@asynccontextmanager
async def lifespan(app: FastAPI):
    state = AppState()
    state.settings = load_settings()
    state.mongo_client = MongoClient(state.settings.mongodb_uri)
    state.mongo_collection = state.mongo_client[state.settings.mongodb_db_name][
        state.settings.mongodb_documents_collection
    ]

    state.pinecone_client = Pinecone(api_key=state.settings.pinecone_api_key)
    state.pinecone_index = state.pinecone_client.Index(state.settings.pinecone_index_name)

    app.state.state = state
    yield
    state.mongo_client.close()
