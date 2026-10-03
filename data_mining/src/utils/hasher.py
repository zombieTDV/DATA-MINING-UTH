"""Cryptographic hashing utilities to enforce the Immutable Raw Invariant."""

import hashlib
from pathlib import Path
from typing import Union


def compute_sha256(data: Union[bytes, str, Path]) -> str:
    """Tính mã băm SHA-256 cho dữ liệu dạng bytes, chuỗi str hoặc đường dẫn Path."""
    hasher = hashlib.sha256()

    if isinstance(data, Path):
        with open(data, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                hasher.update(chunk)
    elif isinstance(data, str):
        hasher.update(data.encode("utf-8"))
    elif isinstance(data, (bytes, bytearray)):
        hasher.update(data)
    else:
        raise TypeError(f"Dữ liệu không hỗ trợ để tính hash: {type(data)}")

    return hasher.hexdigest()
