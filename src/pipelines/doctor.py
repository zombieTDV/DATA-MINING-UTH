"""Report local readiness and optionally probe services without writing remote data."""

import argparse
import importlib.util
import json
import sys

import httpx

from src.config.settings import settings


def diagnose(online=False):
    checks = {"python_supported": (3, 10) <= sys.version_info[:2] < (3, 13)}
    for module in (
        "duckdb",
        "pyarrow",
        "pandas",
        "boto3",
        "httpx",
        "feedparser",
        "lancedb",
        "torch",
        "transformers",
    ):
        checks[f"dependency_{module}"] = importlib.util.find_spec(module) is not None
    credentials = [
        settings.R2_ACCESS_KEY_ID,
        settings.R2_SECRET_ACCESS_KEY,
        settings.get_r2_endpoint(),
    ]
    checks["r2_configured"] = all(credentials) and not any(
        "your_" in value or "<" in value for value in credentials
    )
    checks["embedding_model_present"] = settings.EMBEDDING_MODEL_PATH.is_dir()
    checks["silver_present"] = any(settings.SILVER_DIR.rglob("*.parquet"))
    if online:
        from src.storage.r2_client import R2Client

        try:
            r2 = R2Client()
            r2.s3.head_bucket(Bucket=r2.bucket_name)
            checks["r2_reachable"] = True
            r2.s3.close()
        except Exception as exc:
            checks["r2_reachable"] = False
            checks["r2_error_type"] = type(exc).__name__
        try:
            with httpx.Client(timeout=20, follow_redirects=True) as client:
                response = client.get("https://rss.arxiv.org/rss/cs.AI")
                response.raise_for_status()
                import feedparser

                feed = feedparser.parse(response.content)
                checks["arxiv_reachable"] = not feed.bozo and bool(feed.feed)
        except Exception as exc:
            checks["arxiv_reachable"] = False
            checks["arxiv_error_type"] = type(exc).__name__
    return checks


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--online", action="store_true", help="Read-only R2 and arXiv probes")
    args = parser.parse_args()
    checks = diagnose(args.online)
    print(json.dumps(checks, indent=2))
    required = ["python_supported", "dependency_duckdb", "dependency_pyarrow", "dependency_pandas"]
    if args.online:
        required.extend(["r2_reachable", "arxiv_reachable"])
    return 0 if all(checks[key] for key in required) else 1


if __name__ == "__main__":
    sys.exit(main())
