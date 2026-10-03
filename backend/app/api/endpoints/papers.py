from typing import List
from fastapi import APIRouter, HTTPException
from backend.app.schemas.search import ChunkDto
from backend.app.services.retrieval_service import retrieval_service

router = APIRouter()


@router.get("/papers/{paper_id}", response_model=List[ChunkDto], tags=["Papers"])
async def get_paper(paper_id: str):
    chunks = retrieval_service.get_paper(paper_id)
    if not chunks:
        raise HTTPException(status_code=404, detail=f"Paper with id '{paper_id}' not found.")
    return chunks
