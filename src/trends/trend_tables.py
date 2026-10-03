"""src/trends/trend_tables.py — DuckDB Columnar Trend Aggregation & Longitudinal Analytics."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import duckdb
import pandas as pd

logger = logging.getLogger("TrendTables")


class TrendTableEngine:
    """
    Executes analytical SQL transformations via embedded DuckDB directly over Parquet files.
    Generates Year x Topic and Year x Keyword longitudinal share and growth tables.
    """

    def __init__(
        self,
        silver_dir: Path | str = "data/silver",
        gold_dir: Path | str = "data/gold/trends",
    ):
        self.silver_dir = Path(silver_dir)
        self.gold_dir = Path(gold_dir)
        self.gold_dir.mkdir(parents=True, exist_ok=True)

        self.papers_path = (self.silver_dir / "papers.parquet").as_posix()
        self.keywords_path = (self.silver_dir / "keywords.parquet").as_posix()
        self.conn = duckdb.connect(database=":memory:")

    def build_year_x_topic(self, output_path: Path | str | None = None) -> pd.DataFrame:
        """
        Aggregate topics over publication years, computing frequency and market share.
        """
        target = Path(output_path) if output_path else (self.gold_dir / "year_x_topic.parquet")
        target.parent.mkdir(parents=True, exist_ok=True)

        query = f"""
        WITH exploded_topics AS (
            SELECT
                paper_id,
                year,
                unnest(topics) as topic
            FROM '{self.papers_path}'
            WHERE year >= 2017
        ),
        year_totals AS (
            SELECT
                year,
                count(distinct paper_id) as total_papers_in_year
            FROM '{self.papers_path}'
            WHERE year >= 2017
            GROUP BY year
        ),
        topic_counts AS (
            SELECT
                e.year,
                e.topic,
                count(distinct e.paper_id) as paper_count
            FROM exploded_topics e
            GROUP BY e.year, e.topic
        )
        SELECT
            t.year,
            t.topic,
            t.paper_count,
            y.total_papers_in_year,
            round((t.paper_count * 100.0) / y.total_papers_in_year, 2) as yearly_share_pct
        FROM topic_counts t
        JOIN year_totals y ON t.year = y.year
        ORDER BY t.year ASC, t.paper_count DESC
        """

        df = self.conn.execute(query).df()
        df.to_parquet(target, index=False)
        logger.info("Saved Year x Topic longitudinal trends to %s (%d rows)", target, len(df))
        return df

    def build_year_x_keyword(self, output_path: Path | str | None = None) -> pd.DataFrame:
        """
        Aggregate keywords over publication years, tracking adoption velocity and emerging terms.
        """
        target = Path(output_path) if output_path else (self.gold_dir / "year_x_keyword.parquet")
        target.parent.mkdir(parents=True, exist_ok=True)

        query = f"""
        WITH year_totals AS (
            SELECT
                year,
                count(distinct paper_id) as total_papers_in_year
            FROM '{self.papers_path}'
            WHERE year >= 2017
            GROUP BY year
        ),
        kw_counts AS (
            SELECT
                year,
                keyword,
                count(distinct paper_id) as paper_count,
                round(avg(score), 3) as avg_relevance
            FROM '{self.keywords_path}'
            WHERE year >= 2017
            GROUP BY year, keyword
        )
        SELECT
            k.year,
            k.keyword,
            k.paper_count,
            k.avg_relevance,
            y.total_papers_in_year,
            round((k.paper_count * 100.0) / y.total_papers_in_year, 2) as yearly_share_pct
        FROM kw_counts k
        JOIN year_totals y ON k.year = y.year
        ORDER BY k.year ASC, k.paper_count DESC
        """

        df = self.conn.execute(query).df()
        df.to_parquet(target, index=False)
        logger.info("Saved Year x Keyword longitudinal trends to %s (%d rows)", target, len(df))
        return df

    def build_all_trends(self) -> dict[str, Path]:
        """Generate all Gold trend tables."""
        t_path = self.gold_dir / "year_x_topic.parquet"
        k_path = self.gold_dir / "year_x_keyword.parquet"

        self.build_year_x_topic(t_path)
        self.build_year_x_keyword(k_path)

        return {
            "year_x_topic": t_path,
            "year_x_keyword": k_path,
        }
