"""Validated runtime configuration; environment overrides the project .env file."""

import math
import os
from pathlib import Path
from urllib.parse import urlsplit

from dotenv import dotenv_values

PROJECT_ROOT = Path(__file__).resolve().parents[2]


class Settings:
    """Read settings per instance without mutating the process environment."""

    def __init__(self, env_file=PROJECT_ROOT / ".env", environ=None):
        values = dict(dotenv_values(env_file)) if env_file is not None else {}
        values.update(os.environ if environ is None else environ)

        def value(name, default=""):
            return str(values.get(name) or default).strip()

        self.ROOT_DIR = PROJECT_ROOT
        for name, default in {
            "DATA_RAW_DIR": "data/raw",
            "LOCAL_STORE_DIR": "data/local",
            "MANIFEST_DIR": "data/manifests",
            "SILVER_DIR": "data/silver",
            "GOLD_DIR": "data/gold/lancedb",
            "EMBEDDING_MODEL_PATH": "models/nomic-embed-text-v1.5",
        }.items():
            setattr(self, name, PROJECT_ROOT / Path(value(name, default)).expanduser())
        for name, default in {
            "CLOUDFLARE_ACCOUNT_ID": "",
            "R2_ACCESS_KEY_ID": "",
            "R2_SECRET_ACCESS_KEY": "",
            "R2_BUCKET_NAME": "uth-scientific-lakehouse",
            "R2_ENDPOINT_URL": "",
        }.items():
            setattr(self, name, value(name, default))
        self.ARXIV_CATEGORIES = list(
            dict.fromkeys(
                c.strip()
                for c in value("ARXIV_CATEGORIES", "cs.AI,cs.LG,cs.CV,cs.CL,stat.ML").split(",")
                if c.strip()
            )
        )
        if not self.ARXIV_CATEGORIES:
            raise ValueError("ARXIV_CATEGORIES must contain at least one category")
        self.ARXIV_REQUEST_DELAY_SECONDS = float(value("ARXIV_REQUEST_DELAY_SECONDS", "6.0"))
        if (
            not math.isfinite(self.ARXIV_REQUEST_DELAY_SECONDS)
            or self.ARXIV_REQUEST_DELAY_SECONDS < 3
        ):
            raise ValueError("ARXIV_REQUEST_DELAY_SECONDS must be finite and >= 3")
        self.LOG_LEVEL = value("LOG_LEVEL", "INFO").upper()
        if self.LOG_LEVEL not in {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}:
            raise ValueError("Invalid LOG_LEVEL")

    def get_r2_endpoint(self) -> str:
        url = self.R2_ENDPOINT_URL
        if not url and self.CLOUDFLARE_ACCOUNT_ID:
            url = f"https://{self.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com"
        if url and "://" not in url:
            url = f"https://{url}"
        if url:
            parts = urlsplit(url)
            if parts.scheme not in {"http", "https"} or not parts.hostname or parts.username:
                raise ValueError("R2_ENDPOINT_URL must be an HTTP(S) endpoint")
        return url.rstrip("/")


settings = Settings()
