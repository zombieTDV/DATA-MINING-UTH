"""DuckDB Analytical Query Engine for the Scientific Lakehouse.

Supports running high-performance SQL queries over Silver Parquet datasets
both locally and directly on Cloudflare R2 via the httpfs extension.
"""

from pathlib import Path
from typing import Any, Optional
import duckdb
import pandas as pd

from src.config.settings import settings


class DuckDBEngine:
    """SQL Query Engine powered by embedded DuckDB."""

    def __init__(self, in_memory: bool = True, db_path: Optional[str] = None):
        self.con = duckdb.connect(database=":memory:" if in_memory else (db_path or "lakehouse.duckdb"))
        self._configure_r2_httpfs()

    def _configure_r2_httpfs(self):
        """Cấu hình extension httpfs của DuckDB để query trực tiếp dữ liệu trên Cloudflare R2."""
        endpoint = settings.get_r2_endpoint()
        # Loại bỏ tiền tố https:// cho thiết lập DuckDB s3_endpoint
        endpoint_clean = endpoint.replace("https://", "").replace("http://", "")

        try:
            self.con.execute("INSTALL httpfs; LOAD httpfs;")
            if endpoint_clean and settings.R2_ACCESS_KEY_ID:
                self.con.execute(f"SET s3_endpoint = '{endpoint_clean}';")
                self.con.execute(f"SET s3_access_key_id = '{settings.R2_ACCESS_KEY_ID}';")
                self.con.execute(f"SET s3_secret_access_key = '{settings.R2_SECRET_ACCESS_KEY}';")
                self.con.execute("SET s3_url_style = 'path';")
                self.con.execute("SET s3_use_ssl = true;")
        except Exception as e:
            # Fallback nếu môi trường mạng chặn cài extension lúc khởi động
            pass

    def query_df(self, sql: str) -> pd.DataFrame:
        """Thực thi câu lệnh SQL và trả về kết quả dạng Pandas DataFrame."""
        return self.con.execute(sql).fetchdf()

    def query_silver_local(self, limit: int = 10) -> pd.DataFrame:
        """Truy vấn các bài báo từ tầng Silver trên ổ đĩa local."""
        silver_path = str(settings.ROOT_DIR / "data" / "silver" / "**" / "*.parquet")
        sql = f"SELECT paper_id, title, primary_category, total_sections, total_math_count, total_words FROM '{silver_path}' LIMIT {limit}"
        return self.query_df(sql)

    def query_silver_r2(self, limit: int = 10) -> pd.DataFrame:
        """Truy vấn các bài báo trực tiếp từ tầng Silver trên Cloudflare R2."""
        r2_path = f"s3://{settings.R2_BUCKET_NAME}/silver/papers/**/*.parquet"
        sql = f"SELECT paper_id, title, primary_category, total_sections, total_math_count, total_words FROM '{r2_path}' LIMIT {limit}"
        return self.query_df(sql)
