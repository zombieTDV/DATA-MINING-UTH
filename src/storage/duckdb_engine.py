"""DuckDB queries with explicit, lazy initialization of remote R2 access."""

from pathlib import Path
from urllib.parse import urlsplit

import duckdb
import pandas as pd

from src.config.settings import settings


class DuckDBEngine:
    def __init__(self, in_memory: bool = True, db_path=None, silver_dir=None):
        self.con = duckdb.connect(":memory:" if in_memory else str(db_path or "lakehouse.duckdb"))
        self.silver_dir = Path(silver_dir or settings.SILVER_DIR)
        self._remote_ready = False

    def _configure_r2_httpfs(self):
        if self._remote_ready:
            return
        endpoint = urlsplit(settings.get_r2_endpoint())
        if (
            not endpoint.hostname
            or not settings.R2_ACCESS_KEY_ID
            or not settings.R2_SECRET_ACCESS_KEY
        ):
            raise ValueError("R2 credentials are required for remote queries")
        self.con.execute("INSTALL httpfs")
        self.con.execute("LOAD httpfs")
        for name, value in {
            "s3_endpoint": endpoint.netloc,
            "s3_access_key_id": settings.R2_ACCESS_KEY_ID,
            "s3_secret_access_key": settings.R2_SECRET_ACCESS_KEY,
            "s3_region": "auto",
            "s3_url_style": "path",
            "s3_use_ssl": endpoint.scheme == "https",
        }.items():
            self.con.execute(f"SET {name} = ?", [value])
        self._remote_ready = True

    def query_df(self, sql: str, parameters=None) -> pd.DataFrame:
        return self.con.execute(sql, parameters).fetchdf()

    def _query_silver(self, path, limit):
        if not isinstance(limit, int) or limit < 1:
            raise ValueError("limit must be a positive integer")
        return self.query_df(
            "SELECT paper_id, title, primary_category, total_sections, total_math_count, total_words "
            "FROM read_parquet(?, union_by_name=true) LIMIT ?",
            [path, limit],
        )

    def query_silver_local(self, limit: int = 10) -> pd.DataFrame:
        if not any(self.silver_dir.rglob("*.parquet")):
            raise FileNotFoundError(f"No Silver Parquet files in {self.silver_dir}")
        return self._query_silver(str(self.silver_dir / "**" / "*.parquet"), limit)

    def query_silver_r2(self, limit: int = 10) -> pd.DataFrame:
        self._configure_r2_httpfs()
        return self._query_silver(
            f"s3://{settings.R2_BUCKET_NAME}/silver/papers/**/*.parquet", limit
        )

    def close(self):
        self.con.close()

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()
