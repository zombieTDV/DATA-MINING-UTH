from datetime import datetime, timezone
from fastapi import APIRouter
from backend.app.schemas.health import HealthResponse
from backend.app.core.config import settings
from backend.app.services.retrieval_service import retrieval_service

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    return HealthResponse(
        status="ok",
        timestamp=datetime.now(timezone.utc).isoformat(),
        version=settings.VERSION,
        lancedb_ready=retrieval_service.is_ready(),
        parquet_ready=settings.SILVER_PARQUET.exists(),
    )
