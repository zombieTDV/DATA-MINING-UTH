"""Opt-in, read-only live service probes; no credentials required by the unit suite."""

import os

import pytest

from src.pipelines.doctor import diagnose

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        os.getenv("RUN_INTEGRATION_TESTS") != "1",
        reason="Set RUN_INTEGRATION_TESTS=1 to probe live services",
    ),
]


def test_live_connections():
    checks = diagnose(online=True)
    assert checks["r2_reachable"], checks.get("r2_error_type")
    assert checks["arxiv_reachable"], checks.get("arxiv_error_type")
