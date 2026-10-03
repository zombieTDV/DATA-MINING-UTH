"""Timestamped Logging Utility for Data Mining Pipelines.

Automatically creates timestamped log files in logs/ directory
and streams messages simultaneously to both Console (stdout) and File.
"""

import datetime
import logging
import sys
from pathlib import Path
from typing import Optional, Tuple

from src.config.settings import settings


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
