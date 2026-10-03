from typing import List, Dict, Any
from pydantic import BaseModel, Field


class StorageZonesDto(BaseModel):
    bronzeCount: int = Field(..., examples=[9022])
    bronzeSizeBytes: int = Field(..., examples=[3028942848])
    silverTables: List[str] = Field(..., examples=[["papers.parquet"]])
    silverSizeBytes: int = Field(..., examples=[242986612])
    goldTables: List[str] = Field(..., examples=[["scientific_papers_gold.lance"]])
    goldChunkCount: int = Field(..., examples=[143523])
    goldSizeBytes: int = Field(..., examples=[2638210000])


class StorageStatsResponse(BaseModel):
    bucket: str = Field(..., examples=["uth-scientific-lakehouse"])
    status: str = Field(..., examples=["ready"])
    total_objects: int = Field(..., examples=[9090])
    total_size_bytes: int = Field(..., examples=[6108000000])
    total_size_gb: float = Field(..., examples=[5.688])
    free_tier_quota_gb: float = Field(10.0)
    used_percentage: float = Field(..., examples=[56.88])
    zones: StorageZonesDto
    remoteIndicesReady: bool = Field(True)
