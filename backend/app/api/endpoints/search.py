from fastapi import APIRouter
from backend.app.schemas.search import SearchRequest, SearchResponse
from backend.app.services.retrieval_service import retrieval_service

router = APIRouter()


@router.post("/search", response_model=SearchResponse, tags=["Retrieval & Search"])
async def search_lakehouse(req: SearchRequest):
    chunks = retrieval_service.search(req)
    return SearchResponse(
        query=req.query,
        mode=req.mode or "fts",
        total_results=len(chunks),
        results=chunks,
    )
