"""tests/test_logger.py — Unit tests for centralized logging framework and audit trail."""
from concurrent.futures import ThreadPoolExecutor
import json
import logging
from pathlib import Path
import pytest

from src.utils.logger import ensure_log_dirs, get_logger, log_audit_event


def test_ensure_log_dirs(tmp_path):
    """Verify that ensure_log_dirs creates all sub-namespaces."""
    test_root = tmp_path / "test_logs"
    ensure_log_dirs(test_root)
    assert (test_root / "ingest").exists()
    assert (test_root / "rag").exists()
    assert (test_root / "graph").exists()


def test_get_logger_file_output(tmp_path):
    """Verify get_logger writes formatted logs to rotating file and handles messages."""
    log_file = tmp_path / "test_run.log"
    logger = get_logger("TestLogger", log_file=log_file, level="DEBUG")

    logger.info("Informational message 123")
    logger.warning("Warning alert 456")

    # Flush handlers
    for h in logger.handlers:
        h.flush()

    assert log_file.exists()
    content = log_file.read_text(encoding="utf-8")
    assert "Informational message 123" in content
    assert "Warning alert 456" in content
    assert "[TestLogger]" in content


def test_get_logger_no_duplicate_handlers(tmp_path):
    """Verify re-requesting the same logger does not accumulate duplicate handlers."""
    log_file = tmp_path / "dedup.log"
    logger1 = get_logger("DedupLogger", log_file=log_file)
    initial_handler_count = len(logger1.handlers)

    logger2 = get_logger("DedupLogger", log_file=log_file)
    assert len(logger2.handlers) == initial_handler_count


def test_log_audit_event(tmp_path):
    """Verify structured audit events are appended as valid JSON Lines."""
    audit_file = tmp_path / "audit.jsonl"
    
    log_audit_event("TEST_EVENT_1", "TestComponent", {"count": 42}, audit_file=audit_file)
    log_audit_event("TEST_EVENT_2", "TestComponent", {"status": "SUCCESS"}, audit_file=audit_file)

    assert audit_file.exists()
    lines = audit_file.read_text(encoding="utf-8").strip().split("\n")
    assert len(lines) == 2

    record1 = json.loads(lines[0])
    assert record1["event"] == "TEST_EVENT_1"
    assert record1["component"] == "TestComponent"
    assert record1["details"]["count"] == 42
    assert "timestamp" in record1

    record2 = json.loads(lines[1])
    assert record2["event"] == "TEST_EVENT_2"
    assert record2["details"]["status"] == "SUCCESS"


def test_concurrent_audit_logging(tmp_path):
    """Verify thread-safe audit logging under concurrent multi-threaded execution."""
    audit_file = tmp_path / "concurrent_audit.jsonl"
    total_events = 50

    def write_worker(idx: int):
        log_audit_event("CONCURRENT_EVENT", f"Worker-{idx}", {"index": idx}, audit_file=audit_file)

    with ThreadPoolExecutor(max_workers=5) as executor:
        list(executor.map(write_worker, range(total_events)))

    lines = [line for line in audit_file.read_text(encoding="utf-8").split("\n") if line.strip()]
    assert len(lines) == total_events
    # Ensure every single line parses as valid JSON
    for line in lines:
        parsed = json.loads(line)
        assert parsed["event"] == "CONCURRENT_EVENT"
