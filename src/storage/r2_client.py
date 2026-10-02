"""Cloudflare R2 Object Storage client wrapper (S3-compatible)."""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from src.config.settings import settings
from src.utils.hasher import compute_sha256


class R2Client:
    """Cloudflare R2 Storage Manager."""

    def __init__(
        self,
        endpoint_url: Optional[str] = None,
        access_key_id: Optional[str] = None,
        secret_access_key: Optional[str] = None,
        bucket_name: Optional[str] = None,
    ):
        self.endpoint_url = endpoint_url or settings.get_r2_endpoint()
        self.access_key_id = access_key_id or settings.R2_ACCESS_KEY_ID
        self.secret_access_key = secret_access_key or settings.R2_SECRET_ACCESS_KEY
        self.bucket_name = bucket_name or settings.R2_BUCKET_NAME

        if not self.endpoint_url or not self.access_key_id or not self.secret_access_key:
            raise ValueError(
                "Thiếu thông tin xác thực Cloudflare R2. Vui lòng kiểm tra file .env"
            )

        self.s3 = boto3.client(
            service_name="s3",
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key_id,
            aws_secret_access_key=self.secret_access_key,
            region_name="auto",
            config=Config(
                signature_version="s3v4",
                retries={"max_attempts": 3, "mode": "standard"},
                connect_timeout=15,
                read_timeout=30,
            ),
        )

    def object_exists(self, key: str) -> bool:
        """Kiểm tra xem object key đã tồn tại trong bucket hay chưa."""
        try:
            self.s3.head_object(Bucket=self.bucket_name, Key=key)
            return True
        except ClientError as e:
            if e.response.get("Error", {}).get("Code") in ("404", "NoSuchKey"):
                return False
            raise

    def upload_bytes(
        self,
        data: bytes,
        key: str,
        content_type: str = "application/octet-stream",
        metadata: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """Tải dữ liệu bytes trực tiếp lên R2."""
        sha256 = compute_sha256(data)
        meta = metadata or {}
        meta["sha256"] = sha256

        self.s3.put_object(
            Bucket=self.bucket_name,
            Key=key,
            Body=data,
            ContentType=content_type,
            Metadata=meta,
        )
        return {
            "bucket": self.bucket_name,
            "key": key,
            "size_bytes": len(data),
            "sha256": sha256,
            "uri": f"s3://{self.bucket_name}/{key}",
        }

    def upload_text(
        self,
        text: str,
        key: str,
        content_type: str = "text/plain; charset=utf-8",
        metadata: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """Tải chuỗi văn bản (JSON, HTML, Markdown) lên R2."""
        return self.upload_bytes(
            data=text.encode("utf-8"),
            key=key,
            content_type=content_type,
            metadata=metadata,
        )

    def upload_json(
        self,
        payload: Any,
        key: str,
        metadata: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """Tải cấu trúc Python Dict/List dạng JSON lên R2."""
        text = json.dumps(payload, ensure_ascii=False, indent=2)
        return self.upload_text(
            text=text,
            key=key,
            content_type="application/json; charset=utf-8",
            metadata=metadata,
        )

    def upload_file(
        self,
        file_path: Union[str, Path],
        key: str,
        content_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Upload file từ ổ đĩa local lên R2."""
        path = Path(file_path)
        if not path.is_file():
            raise FileNotFoundError(f"File không tồn tại: {path}")

        extra_args = {}
        if content_type:
            extra_args["ContentType"] = content_type

        self.s3.upload_file(
            Filename=str(path),
            Bucket=self.bucket_name,
            Key=key,
            ExtraArgs=extra_args if extra_args else None,
        )
        sha256 = compute_sha256(path)
        return {
            "bucket": self.bucket_name,
            "key": key,
            "size_bytes": path.stat().st_size,
            "sha256": sha256,
            "uri": f"s3://{self.bucket_name}/{key}",
        }

    def get_text(self, key: str) -> str:
        """Đọc nội dung văn bản từ R2 object."""
        response = self.s3.get_object(Bucket=self.bucket_name, Key=key)
        return response["Body"].read().decode("utf-8")

    def get_json(self, key: str) -> Any:
        """Đọc và parse JSON từ R2 object."""
        return json.loads(self.get_text(key))

    def list_objects(self, prefix: str = "", max_keys: int = 1000) -> List[Dict[str, Any]]:
        """Liệt kê danh sách objects theo prefix."""
        paginator = self.s3.get_paginator("list_objects_v2")
        results = []
        for page in paginator.paginate(
            Bucket=self.bucket_name,
            Prefix=prefix,
            PaginationConfig={"MaxItems": max_keys},
        ):
            for item in page.get("Contents", []):
                results.append(
                    {
                        "key": item["Key"],
                        "size": item["Size"],
                        "last_modified": item["LastModified"].isoformat(),
                    }
                )
        return results
