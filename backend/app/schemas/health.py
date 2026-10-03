from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., examples=["ok"])
    timestamp: str = Field(..., examples=["2026-10-03T17:50:00Z"])
    version: str = Field(..., examples=["1.0.0"])
    lancedb_ready: bool = Field(..., examples=[True])
    parquet_ready: bool = Field(..., examples=[True])
