"""Configuration settings module loaded from environment variables and .env file."""

import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(dotenv_path=PROJECT_ROOT / ".env")


class Settings:
    """Application settings class."""

    # Project Paths
    ROOT_DIR: Path = PROJECT_ROOT
    DATA_RAW_DIR: Path = PROJECT_ROOT / os.getenv("DATA_RAW_DIR", "data/raw")
    MANIFEST_DIR: Path = PROJECT_ROOT / os.getenv("MANIFEST_DIR", "data/manifests")

    # Cloudflare R2 Credentials
    CLOUDFLARE_ACCOUNT_ID: str = os.getenv("CLOUDFLARE_ACCOUNT_ID", "").strip()
    R2_ACCESS_KEY_ID: str = os.getenv("R2_ACCESS_KEY_ID", "").strip()
    R2_SECRET_ACCESS_KEY: str = os.getenv("R2_SECRET_ACCESS_KEY", "").strip()
    R2_BUCKET_NAME: str = os.getenv("R2_BUCKET_NAME", "uth-scientific-lakehouse").strip()
    R2_ENDPOINT_URL: str = os.getenv("R2_ENDPOINT_URL", "").strip()

    # arXiv Harvesting Configuration
    ARXIV_CATEGORIES: List[str] = [
        c.strip()
        for c in os.getenv("ARXIV_CATEGORIES", "cs.AI,cs.LG,cs.CV,cs.CL,stat.ML").split(",")
        if c.strip()
    ]
    ARXIV_REQUEST_DELAY_SECONDS: float = float(os.getenv("ARXIV_REQUEST_DELAY_SECONDS", "3.0"))

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()

    @classmethod
    def get_r2_endpoint(cls) -> str:
        """Trả về endpoint R2 chuẩn hóa có tiền tố https://."""
        url = cls.R2_ENDPOINT_URL
        if not url:
            if cls.CLOUDFLARE_ACCOUNT_ID:
                url = f"https://{cls.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com"
        if url and not url.startswith("http://") and not url.startswith("https://"):
            url = f"https://{url}"
        return url


settings = Settings()
