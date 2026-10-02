"""Main entry point for UTH Scientific Data Mining & Advanced RAG System.

Runs the complete end-to-end Medallion Lakehouse pipeline:
Bronze (Ingestion) -> Silver (Parquet & Full-text HTML) -> Gold (LanceDB Vector Table).

Usage:
    ./.venv/bin/python main.py
    ./.venv/bin/python main.py --enrich-html-limit 100 --gold-limit 500
"""

import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.pipelines.run_master_pipeline import main

if __name__ == "__main__":
    main()
