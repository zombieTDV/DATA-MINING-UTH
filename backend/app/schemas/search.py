from typing import List, Optional
from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(..., examples=["conditional diffusion distillation"])
    top_k: int = Field(5, ge=1, le=50, examples=[5])
    category: Optional[str] = Field(None, examples=["cs.AI"])
    mode: Optional[str] = Field("fts", examples=["fts"])  # "fts", "vector", "hybrid"
    no_cache: Optional[bool] = Field(False)


class ChunkDto(BaseModel):
    chunk_id: str
    paper_id: str
    title: str
    text: str
    abstract: Optional[str] = None
    authors: List[str] = []
    year: Optional[int] = None
    primary_category: Optional[str] = None
    section_title: Optional[str] = None
    doi: Optional[str] = None
    score: Optional[float] = None
    source: Optional[str] = None


class SearchResponse(BaseModel):
    query: str
    mode: str
    total_results: int
    results: List[ChunkDto]
