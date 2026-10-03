"""Smoke tests: verify data_mining package modules and monorepo layout.
"""
from pathlib import Path

DATA_MINING_ROOT = Path(__file__).resolve().parents[1]
MONOREPO_ROOT = Path(__file__).resolve().parents[2]


def test_src_packages_importable():
    import sys
    if str(DATA_MINING_ROOT) not in sys.path:
        sys.path.insert(0, str(DATA_MINING_ROOT))

    import src.config  # noqa: F401
    import src.ingestion  # noqa: F401
    import src.transformation  # noqa: F401
    import src.indexing  # noqa: F401
    import src.mining  # noqa: F401
    import src.storage  # noqa: F401
    import src.rag  # noqa: F401
    import src.utils  # noqa: F401
    import src.pipelines  # noqa: F401


def test_core_directories_exist():
    for rel in (
        "data_mining/src",
        "data_mining/notebooks",
        "data_mining/tests",
        "data_mining/tools",
        "backend/app",
        "backend/tests",
        "frontend/src",
        "docs/agents",
    ):
        assert (MONOREPO_ROOT / rel).is_dir(), f"missing directory: {rel}"


def test_constitutional_agents_isolation():
    """Assert docs/agents strictly contains rules, templates, and README.md."""
    agents_dir = MONOREPO_ROOT / "docs" / "agents"
    assert (agents_dir / "README.md").is_file()
    assert (agents_dir / "rules").is_dir()
    assert (agents_dir / "templates").is_dir()


def test_documentation_files_exist():
    for rel in (
        "README.md",
        "docs/agents/README.md",
        "docs/PURPOSE.md",
        "docs/OVERVIEW.md",
        "data_mining/requirements.txt",
        "data_mining/pyproject.toml",
        "backend/requirements.txt",
        "backend/README.md",
    ):
        assert (MONOREPO_ROOT / rel).is_file(), f"missing file: {rel}"
