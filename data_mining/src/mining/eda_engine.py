"""
data_mining/src/mining/eda_engine.py
------------------------------------
Exploratory Data Analysis (EDA) Engine for Academic Paper Lakehouse.
Executes high-performance columnar analytical queries via DuckDB over
Silver Parquet (and Cloudflare R2), producing structured distribution metrics.

Adheres strictly to docs/agents/rules/LOGGING_CHECKPOINT_RULES.md:
- Strictly NO emojis/icons.
- Timestamped plain-text logs: [INFO], [SUCCESS], [WARNING], [ERROR].
"""

import os
import json
import logging
from typing import Dict, Any, Optional
import duckdb

logger = logging.getLogger("eda_engine")


class EdaEngine:
    """High-performance exploratory data analysis engine powered by DuckDB."""

    def __init__(self, parquet_path: str):
        self.parquet_path = parquet_path
        self.con = duckdb.connect(database=":memory:")

    def run_full_eda(self) -> Dict[str, Any]:
        """Runs the complete exploratory profiling suite across 10,000 papers."""
        logger.info("[EDA] Starting full exploratory analysis on: %s", self.parquet_path)

        if not os.path.exists(self.parquet_path):
            raise FileNotFoundError(f"[ERROR] Parquet file not found at: {self.parquet_path}")

        # Register view for clean SQL querying
        self.con.execute(
            f"CREATE OR REPLACE VIEW papers_view AS SELECT * FROM read_parquet('{self.parquet_path}')"
        )

        overview = self._get_overview_metrics()
        category_dist = self._get_category_distribution()
        temporal_trend = self._get_temporal_distribution()
        math_content_stats = self._get_math_and_length_stats()
        top_authors = self._get_top_authors(limit=20)
        co_occurrence = self._get_category_cooccurrence(limit=15)

        eda_results = {
            "dataset_overview": overview,
            "category_distribution": category_dist,
            "temporal_distribution": temporal_trend,
            "math_and_content_stats": math_content_stats,
            "top_authors": top_authors,
            "category_cooccurrence": co_occurrence,
        }

        logger.info(
            "[EDA] [SUCCESS] Completed full EDA. Processed %d papers across %d categories.",
            overview.get("total_papers", 0),
            len(category_dist),
        )
        return eda_results

    def _get_overview_metrics(self) -> Dict[str, Any]:
        """Calculates global dataset volume, completeness, and formula counts."""
        query = """
        SELECT
            count(*) AS total_papers,
            count(CASE WHEN total_sections > 0 THEN 1 END) AS enriched_html_papers,
            sum(total_math_count) AS total_math_formulas,
            sum(total_words) AS total_words,
            round(avg(total_sections), 2) AS avg_sections_per_paper,
            round(avg(total_math_count), 2) AS avg_math_per_paper,
            round(avg(total_words), 2) AS avg_words_per_paper,
            min(published_date) AS earliest_publication,
            max(published_date) AS latest_publication
        FROM papers_view
        """
        row = self.con.execute(query).fetchone()
        return {
            "total_papers": int(row[0] or 0),
            "enriched_html_papers": int(row[1] or 0),
            "enrichment_ratio": round(float(row[1] or 0) / max(1, float(row[0] or 1)), 4),
            "total_math_formulas": int(row[2] or 0),
            "total_words": int(row[3] or 0),
            "avg_sections_per_paper": float(row[4] or 0.0),
            "avg_math_per_paper": float(row[5] or 0.0),
            "avg_words_per_paper": float(row[6] or 0.0),
            "earliest_publication": str(row[7] or ""),
            "latest_publication": str(row[8] or ""),
        }

    def _get_category_distribution(self) -> list[Dict[str, Any]]:
        """Calculates primary category frequency and percentages."""
        query = """
        SELECT
            primary_category,
            count(*) AS paper_count,
            round(count(*) * 100.0 / sum(count(*)) OVER (), 2) AS percentage,
            sum(total_math_count) AS category_math_count,
            round(avg(total_words), 1) AS category_avg_words
        FROM papers_view
        WHERE primary_category IS NOT NULL
        GROUP BY primary_category
        ORDER BY paper_count DESC
        LIMIT 25
        """
        rows = self.con.execute(query).fetchall()
        return [
            {
                "category": str(r[0]),
                "count": int(r[1]),
                "percentage": float(r[2]),
                "total_math_formulas": int(r[3] or 0),
                "avg_words": float(r[4] or 0.0),
            }
            for r in rows
        ]

    def _get_temporal_distribution(self) -> list[Dict[str, Any]]:
        """Aggregates publication volume by year-month."""
        query = """
        SELECT
            substr(published_date, 1, 7) AS year_month,
            count(*) AS paper_count
        FROM papers_view
        WHERE published_date IS NOT NULL AND length(published_date) >= 7
        GROUP BY year_month
        ORDER BY year_month ASC
        """
        rows = self.con.execute(query).fetchall()
        return [{"period": str(r[0]), "count": int(r[1])} for r in rows if r[0]]

    def _get_math_and_length_stats(self) -> Dict[str, Any]:
        """Calculates distribution percentiles for math formula density and word counts."""
        query = """
        SELECT
            approx_quantile(total_math_count, 0.25) AS math_p25,
            approx_quantile(total_math_count, 0.50) AS math_median,
            approx_quantile(total_math_count, 0.75) AS math_p75,
            approx_quantile(total_math_count, 0.95) AS math_p95,
            max(total_math_count) AS math_max,
            approx_quantile(total_words, 0.25) AS words_p25,
            approx_quantile(total_words, 0.50) AS words_median,
            approx_quantile(total_words, 0.75) AS words_p75,
            approx_quantile(total_words, 0.95) AS words_p95,
            max(total_words) AS words_max
        FROM papers_view
        """
        r = self.con.execute(query).fetchone()
        return {
            "math_quantiles": {
                "p25": float(r[0] or 0),
                "median": float(r[1] or 0),
                "p75": float(r[2] or 0),
                "p95": float(r[3] or 0),
                "max": int(r[4] or 0),
            },
            "word_quantiles": {
                "p25": float(r[5] or 0),
                "median": float(r[6] or 0),
                "p75": float(r[7] or 0),
                "p95": float(r[8] or 0),
                "max": int(r[9] or 0),
            },
        }

    def _get_top_authors(self, limit: int = 20) -> list[Dict[str, Any]]:
        """Identifies most prolific researchers across the 10,000 papers."""
        query = f"""
        SELECT author_name, count(*) AS paper_count
        FROM (
            SELECT unnest(authors) AS author_name
            FROM papers_view
            WHERE authors IS NOT NULL
        )
        WHERE author_name IS NOT NULL AND length(trim(author_name)) > 0
        GROUP BY author_name
        ORDER BY paper_count DESC
        LIMIT {limit}
        """
        rows = self.con.execute(query).fetchall()
        return [{"author": str(r[0]), "paper_count": int(r[1])} for r in rows if r[0]]

    def _get_category_cooccurrence(self, limit: int = 15) -> list[Dict[str, Any]]:
        """Mines pairwise co-occurrence frequencies between arXiv subject tags."""
        query = f"""
        WITH unnested AS (
            SELECT
                paper_id,
                unnest(categories) AS cat1
            FROM papers_view
        ),
        pairs AS (
            SELECT
                u1.cat1 AS cat_a,
                u2.cat1 AS cat_b,
                count(DISTINCT u1.paper_id) AS cooccur_count
            FROM unnested u1
            JOIN unnested u2 ON u1.paper_id = u2.paper_id AND u1.cat1 < u2.cat1
            GROUP BY u1.cat1, u2.cat1
        )
        SELECT cat_a, cat_b, cooccur_count
        FROM pairs
        ORDER BY cooccur_count DESC
        LIMIT {limit}
        """
        rows = self.con.execute(query).fetchall()
        return [
            {"category_a": str(r[0]), "category_b": str(r[1]), "cooccurrence_count": int(r[2])}
            for r in rows
        ]

    def save_summary(self, output_path: str) -> None:
        """Runs full EDA and serializes result to a JSON file."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        results = self.run_full_eda()
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        logger.info("[EDA] [SUCCESS] Saved EDA summary to: %s", output_path)
