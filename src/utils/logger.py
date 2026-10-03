"""src/utils/logger.py — Centralized Logging and Traceability Framework.

Combines timestamped dual-output logging for batch pipelines with structured rotating
loggers, namespaces, and JSON Lines audit ledgers for RAG and Graph analytics.
"""
from __future__ import annotations

import datetime
from datetime import datetime as dt, timezone
import json
import logging
from logging.handlers import RotatingFileHandler
import os
from pathlib import Path
import sys
import threading
from typing import Any, Optional, Tuple

from src.config.settings import settings

DEFAULT_LOG_DIR = Path("logs")
DEFAULT_AUDIT_FILE = DEFAULT_LOG_DIR / "audit.jsonl"
_audit_lock = threading.Lock()

DEFAULT_FORMAT = "%(asctime)s [%(levelname)s] [%(name)s] [%(process)d:%(threadName)s]: %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


class DualOutputTee:
    """Redirects stdout writes to both standard console and an open log file."""

    def __init__(self, file_path: Path, original_stream):
        self.file = open(file_path, "a", encoding="utf-8")
        self.original_stream = original_stream

    def write(self, message):
        self.original_stream.write(message)
        self.original_stream.flush()
        self.file.write(message)
        self.file.flush()

    def flush(self):
        self.original_stream.flush()
        self.file.flush()

    def close(self):
        if not self.file.closed:
            self.file.close()


def setup_pipeline_logging(
    pipeline_name: str = "batch_ingest",
    log_dir: Optional[Path] = None,
    capture_stdout: bool = True,
) -> Tuple[logging.Logger, Path]:
    """Khởi tạo hệ thống ghi log theo timestamp đặt tại thư mục logs/."""
    target_dir = log_dir or (settings.ROOT_DIR / "logs")
    target_dir.mkdir(parents=True, exist_ok=True)

    # Đặt tên file theo định dạng: <pipeline_name>_YYYYMMDD_HHMMSS.log
    timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    log_filename = f"{pipeline_name}_{timestamp_str}.log"
    log_filepath = target_dir / log_filename

    # Cấu hình logging tiêu chuẩn
    logger = logging.getLogger(pipeline_name)
    logger.setLevel(logging.INFO)
    logger.handlers.clear()  # Xóa handler cũ để tránh duplicate

    file_handler = logging.FileHandler(log_filepath, encoding="utf-8")
    file_handler.setLevel(logging.INFO)
    file_formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
    )
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)

    # Chuyển hướng stdout để mọi lệnh print() cũng tự động ghi vào file log
    if capture_stdout:
        sys.stdout = DualOutputTee(log_filepath, sys.__stdout__)
        sys.stderr = DualOutputTee(log_filepath, sys.__stderr__)

    return logger, log_filepath


def ensure_log_dirs(root: Path | str = DEFAULT_LOG_DIR) -> None:
    """Ensure all dedicated log subdirectories exist."""
    root_path = Path(root)
    for sub in ["ingest", "rag", "graph"]:
        (root_path / sub).mkdir(parents=True, exist_ok=True)


def get_logger(
    name: str,
    log_file: Optional[str | Path] = None,
    level: str | int = logging.INFO,
    max_bytes: int = 10 * 1024 * 1024,
    backup_count: int = 5,
    console: bool = True,
) -> logging.Logger:
    """
    Configure and return a named logger with dual console and rotating file handlers.
    Avoids duplicate handler accumulation on re-calls.
    """
    logger = logging.getLogger(name)
    if isinstance(level, str):
        level = getattr(logging, level.upper(), logging.INFO)
    logger.setLevel(level)

    # If handlers already configured, return existing instance to prevent duplicates
    if logger.handlers:
        return logger

    formatter = logging.Formatter(fmt=DEFAULT_FORMAT, datefmt=DATE_FORMAT)

    # 1. Console Stream Handler
    if console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(level)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

    # 2. Rotating File Handler
    if log_file:
        file_path = Path(log_file)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_handler = RotatingFileHandler(
            filename=file_path,
            maxBytes=max_bytes,
            backupCount=backup_count,
            encoding="utf-8",
        )
        file_handler.setLevel(level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    # Avoid propagation duplicates if root logger is also configured
    logger.propagate = False
    return logger


def log_audit_event(
    event_type: str,
    component: str,
    details: dict[str, Any],
    audit_file: str | Path = DEFAULT_AUDIT_FILE,
) -> None:
    """
    Thread-safe append of a structured audit event to JSON Lines ledger.
    """
    audit_path = Path(audit_file)
    audit_path.parent.mkdir(parents=True, exist_ok=True)

    record = {
        "timestamp": dt.now(timezone.utc).isoformat(),
        "event": event_type,
        "component": component,
        "details": details,
    }

    line = json.dumps(record, ensure_ascii=False) + "\n"
    with _audit_lock:
        with open(audit_path, "a", encoding="utf-8") as f:
            f.write(line)
