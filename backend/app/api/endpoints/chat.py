from fastapi import APIRouter
from backend.app.schemas.chat import ChatRequest, ChatResponse
from backend.app.services.rag_service import rag_service

router = APIRouter()


@router.post("/chat", response_model=ChatResponse, tags=["RAG & Chat"])
async def rag_chat(req: ChatRequest):
    return rag_service.answer_query(req)
