from fastapi import APIRouter
from backend.app.api.endpoints import health, search, chat, papers, storage, mining

api_router = APIRouter()

# Core Endpoints
api_router.include_router(search.router)
api_router.include_router(chat.router)
api_router.include_router(papers.router)
api_router.include_router(storage.router)
api_router.include_router(mining.router)
