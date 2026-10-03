"""LanceDB Vector Lakehouse Manager for Gold Layer.

Stores contextual chunks and 768-dimensional dense vectors
supporting fast Approximate Nearest Neighbor (ANN) and metadata filtering.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
import lancedb
import pandas as pd
import pyarrow as pa

from src.config.settings import settings
from src.storage.r2_client import R2Client


class LanceDBManager:
    """Manages the LanceDB vector database for the Gold layer."""

    DEFAULT_TABLE_NAME = "scientific_papers_gold"

    def __init__(self, db_path: Optional[Path] = None, r2_client: Optional[R2Client] = None):
        self.db_path = db_path or (settings.ROOT_DIR / "data" / "gold" / "lancedb")
        self.db_path.mkdir(parents=True, exist_ok=True)
        self.db = lancedb.connect(str(self.db_path))
        self.r2 = r2_client

    def get_or_create_table(self, table_name: str = DEFAULT_TABLE_NAME, data_sample: Optional[List[Dict[str, Any]]] = None):
        """Mở table đã có hoặc khởi tạo table mới nếu chưa tồn tại."""
        existing_tables = self.db.table_names()
        if table_name in existing_tables:
            return self.db.open_table(table_name)

        if not data_sample:
            raise ValueError(
                f"Table '{table_name}' chưa tồn tại. Cần truyền data_sample để khởi tạo bảng."
            )

        df = pd.DataFrame(data_sample)
        return self.db.create_table(table_name, data=df, mode="overwrite")

    def insert_chunks(self, chunks: List[Dict[str, Any]], table_name: str = DEFAULT_TABLE_NAME) -> int:
        """Ghi hoặc cập nhật danh sách chunks kèm vector vào LanceDB."""
        if not chunks:
            return 0

        df = pd.DataFrame(chunks)
        table = self.get_or_create_table(table_name, data_sample=chunks)

        # Merge / Upsert theo chunk_id
        if "chunk_id" in df.columns:
            (
                table.merge_insert("chunk_id")
                .when_matched_update_all()
                .when_not_matched_insert_all()
                .execute(df)
            )
        else:
            table.add(df)

        return len(chunks)

    def vector_search(
        self,
        query_vector: List[float],
        limit: int = 5,
        filter_expr: Optional[str] = None,
        table_name: str = DEFAULT_TABLE_NAME,
    ) -> pd.DataFrame:
        """Tìm kiếm lân cận gần đúng (ANN) trên vector embeddings."""
        table = self.db.open_table(table_name)
        search_query = table.search(query_vector).metric("cosine").limit(limit)

        if filter_expr:
            search_query = search_query.where(filter_expr, prefilter=True)

        return search_query.to_pandas()

    def sync_to_r2(self, r2_prefix: str = "gold/lancedb/"):
        """Đồng bộ toàn bộ thư mục dữ liệu LanceDB lên Cloudflare R2 Gold zone."""
        r2 = self.r2 or R2Client()
        synced_count = 0

        for file_path in self.db_path.rglob("*"):
            if file_path.is_file():
                rel_path = file_path.relative_to(self.db_path)
                r2_key = f"{r2_prefix.rstrip('/')}/{rel_path}"
                r2.upload_file(file_path=file_path, key=r2_key)
                synced_count += 1

        return {"synced_files": synced_count, "r2_destination": f"s3://{r2.bucket_name}/{r2_prefix}"}
