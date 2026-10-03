"""Pytest fixtures: skip data-dependent tests when data/bronze is absent.

Allows CI (and fresh checkouts) to run the synthetic unit suite without the
dataset present.
"""
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_BRONZE = PROJECT_ROOT / "data" / "bronze"

needs_data = pytest.mark.skipif(
    not DATA_BRONZE.exists() or not any(DATA_BRONZE.iterdir()),
    reason="data/bronze is absent — data-dependent test skipped",
)
