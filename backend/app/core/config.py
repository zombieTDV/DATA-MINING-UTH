"""
backend/app/core/config.py
--------------------------
Application configuration using Pydantic Settings.
Reads environment variables from root .env.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


# Find project root (where .env lives)
CURRENT_FILE = Path(__file__).resolve()
PROJECT_ROOT = CURRENT_FILE.parents[3]
ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    # Server & Ports
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    PROJECT_NAME: str = "UTH Scientific Data Mining & Real-Time RAG API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    # Cloudflare R2 Credentials
    R2_ENDPOINT_URL: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "uth-scientific-lakehouse"

    # Lakehouse Local Paths
    PROJECT_ROOT_DIR: Path = PROJECT_ROOT
    DATA_DIR: Path = PROJECT_ROOT / "data"
    SILVER_PARQUET: Path = PROJECT_ROOT / "data" / "silver" / "year=2026" / "papers.parquet"
    LANCEDB_URI: str = str(PROJECT_ROOT / "data" / "gold" / "lancedb")
    LANCEDB_TABLE: str = "scientific_papers_gold"
    MINING_ARTIFACTS_DIR: Path = PROJECT_ROOT / "data" / "gold" / "mining"

    # LLM Settings
    LLM_MODE: str = "mock"  # "mock", "groq", "local"
    LLM_MODEL_PATH: str = "./models/qwen2.5-7b-instruct-q4_k_m/qwen2.5-7b-instruct-q4_k_m.gguf"
    GROQ_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
