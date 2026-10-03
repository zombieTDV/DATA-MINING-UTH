from fastapi import APIRouter
from backend.app.schemas.storage import StorageStatsResponse
from backend.app.services.storage_service import storage_service

router = APIRouter()


@router.get("/storage/stats", response_model=StorageStatsResponse, tags=["Storage & Lakehouse"])
async def get_storage_stats():
    return storage_service.get_stats()
