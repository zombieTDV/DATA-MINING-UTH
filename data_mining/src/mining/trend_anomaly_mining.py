"""
data_mining/src/mining/trend_anomaly_mining.py
----------------------------------------------
Pillar 4: Trend Velocity & Anomaly Mining Pipeline.
Applies Isolation Forest to detect anomalous/novel scientific papers across
multi-dimensional structural features (math density, word count, section count,
author count, category diversity), and computes temporal trend velocities
across AI/DS subfields over time.

Adheres strictly to docs/agents/rules/LOGGING_CHECKPOINT_RULES.md:
- Strictly NO emojis/icons.
- Timestamped plain-text logs: [INFO], [SUCCESS], [WARNING], [ERROR].
"""

import os
import json
import logging
from typing import Dict, Any, List
import numpy as np
import duckdb
from sklearn.ensemble import IsolationForest

logger = logging.getLogger("trend_anomaly_mining")


class TrendAnomalyMiner:
    """Detects novel outlier papers via Isolation Forest and tracks research trend velocity."""

    def __init__(self, parquet_path: str):
        self.parquet_path = parquet_path

    def run_mining(self, contamination: float = 0.02) -> Dict[str, Any]:
        """Runs anomaly detection and category trend velocity modeling."""
        logger.info("[PILLAR 4] Loading paper features for anomaly detection & trend analysis...")
        con = duckdb.connect()

        # Extract features for anomaly detection
        query = f"""
        SELECT
            paper_id,
            title,
            primary_category,
            total_math_count,
            total_words,
            total_sections,
            len(authors) AS author_count,
            len(categories) AS category_count,
            published_date
        FROM read_parquet('{self.parquet_path}')
        """
        df = con.execute(query).fetchdf()

        # 1. Anomaly Mining via Isolation Forest
        logger.info("[PILLAR 4] Executing Isolation Forest (contamination=%.3f)...", contamination)
        feature_cols = [
            "total_math_count",
            "total_words",
            "total_sections",
            "author_count",
            "category_count",
        ]
        X = df[feature_cols].fillna(0).values

        iso_forest = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100,
        )
        preds = iso_forest.fit_predict(X)
        anomaly_scores = iso_forest.score_samples(X)

        df["is_anomaly"] = preds == -1
        df["anomaly_score"] = np.round(anomaly_scores, 4)

        anomalies_df = df[df["is_anomaly"]].sort_values(by="anomaly_score").head(30)

        anomaly_records = []
        for _, row in anomalies_df.iterrows():
            # Determine reason for anomaly
            reasons = []
            if row["total_math_count"] > 1000:
                reasons.append(f"Extreme theoretical math density ({row['total_math_count']} formulas)")
            if row["total_words"] > 25000:
                reasons.append(f"Monograph-level length ({row['total_words']} words)")
            if row["author_count"] > 15:
                reasons.append(f"Massive collaboration team ({row['author_count']} authors)")
            if row["category_count"] >= 4:
                reasons.append(f"Highly interdisciplinary scope ({row['category_count']} categories)")
            if not reasons:
                reasons.append("Structural outlier in feature space")

            anomaly_records.append({
                "paper_id": str(row["paper_id"]),
                "title": str(row["title"]),
                "primary_category": str(row["primary_category"]),
                "anomaly_score": float(row["anomaly_score"]),
                "math_count": int(row["total_math_count"]),
                "word_count": int(row["total_words"]),
                "author_count": int(row["author_count"]),
                "category_count": int(row["category_count"]),
                "outlier_reasons": reasons,
            })

        # 2. Trend Velocity Modeling
        logger.info("[PILLAR 4] Computing category temporal trend velocities...")
        trend_query = f"""
        WITH monthly_counts AS (
            SELECT
                primary_category,
                substr(published_date, 1, 7) AS ym,
                count(*) AS monthly_papers
            FROM read_parquet('{self.parquet_path}')
            WHERE primary_category IS NOT NULL AND published_date IS NOT NULL
            GROUP BY primary_category, ym
        ),
        ranked_months AS (
            SELECT
                primary_category,
                ym,
                monthly_papers,
                dense_rank() OVER (ORDER BY ym DESC) AS month_recency
            FROM monthly_counts
        )
        SELECT
            primary_category,
            sum(CASE WHEN month_recency <= 3 THEN monthly_papers ELSE 0 END) AS recent_quarter,
            sum(CASE WHEN month_recency > 3 AND month_recency <= 6 THEN monthly_papers ELSE 0 END) AS previous_quarter,
            sum(monthly_papers) AS all_time_total
        FROM ranked_months
        GROUP BY primary_category
        HAVING all_time_total >= 50
        ORDER BY recent_quarter DESC
        """
        trend_rows = con.execute(trend_query).fetchall()

        trend_velocities = []
        for r in trend_rows:
            cat = str(r[0])
            recent = int(r[1] or 0)
            prev = int(r[2] or 0)
            total = int(r[3] or 0)

            if prev > 0:
                growth_rate = round(((recent - prev) / float(prev)) * 100.0, 1)
            else:
                growth_rate = 100.0 if recent > 0 else 0.0

            if growth_rate > 20.0:
                momentum = "ACCELERATING"
            elif growth_rate < -10.0:
                momentum = "COOLING"
            else:
                momentum = "STEADY"

            trend_velocities.append({
                "category": cat,
                "recent_quarter_papers": recent,
                "previous_quarter_papers": prev,
                "growth_rate_pct": growth_rate,
                "momentum": momentum,
                "all_time_papers": total,
            })

        results = {
            "summary": {
                "total_papers_analyzed": len(df),
                "total_anomalies_detected": int(np.sum(df["is_anomaly"])),
                "anomaly_rate": round(float(np.mean(df["is_anomaly"])) * 100.0, 2),
                "tracked_categories_velocity": len(trend_velocities),
            },
            "anomalies": anomaly_records,
            "trend_velocity": trend_velocities,
        }

        logger.info(
            "[PILLAR 4] [SUCCESS] Identified %d structural anomalies and computed velocity across %d categories.",
            len(anomaly_records),
            len(trend_velocities),
        )
        return results

    def save_trends_and_anomalies(self, output_path: str) -> None:
        """Executes trend & anomaly mining and writes JSON to disk."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        results = self.run_mining()
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        logger.info("[PILLAR 4] [SUCCESS] Saved trends & anomalies analysis to: %s", output_path)
