"""
data_mining/src/mining/mining_engine.py
---------------------------------------
Master Data Mining & Modeling Engine.
Executes the comprehensive analytical suite over the 10,000 papers in Lakehouse:
- Real-time Exploratory Data Analysis (EDA) via DuckDB.
- Pillar 1: Frequent Pattern & Association Rule Mining (FP-Growth).
- Pillar 2: Semantic Topic Clustering & Density Analysis (K-Means/DBSCAN).
- Pillar 3: Graph Mining & Co-authorship Network Analysis (PageRank/Communities).
- Pillar 4: Trend Velocity & Anomaly Outlier Detection (Isolation Forest).

Persists all artifacts locally to data/gold/mining/ and syncs to Cloudflare R2 gold/mining/.
Adheres strictly to docs/agents/rules/LOGGING_CHECKPOINT_RULES.md (Strictly NO emojis/icons).
"""

import os
import sys
import time
import json
import logging
import argparse
from datetime import datetime
from typing import Dict, Any

# Ensure project imports resolve
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from src.config.settings import settings
from src.utils.logger import setup_pipeline_logging
from src.storage.r2_client import R2Client
from src.mining.eda_engine import EdaEngine
from src.mining.association_rules import AssociationRuleMiner
from src.mining.cluster_analysis import SemanticClusterAnalyzer
from src.mining.graph_mining import CoauthorshipGraphMiner
from src.mining.trend_anomaly_mining import TrendAnomalyMiner

logger, log_file = setup_pipeline_logging("mining_engine")


class MiningEngine:
    """Master orchestrator for scientific data mining and exploratory analytics."""

    def __init__(
        self,
        parquet_path: str = "data/silver/year=2026/papers.parquet",
        lancedb_uri: str = "data/gold/lancedb",
        output_dir: str = "data/gold/mining",
    ):
        self.parquet_path = parquet_path
        self.lancedb_uri = lancedb_uri
        self.output_dir = output_dir
        self.r2_client = R2Client()

    def run_all(self, upload_to_r2: bool = True) -> Dict[str, Any]:
        """Runs EDA and all 4 Data Mining pillars in sequential checkpoints."""
        start_time = time.time()
        os.makedirs(self.output_dir, exist_ok=True)

        logger.info("================================================================================")
        logger.info("[MINING ENGINE] STARTING MASTER DATA MINING & MODELING EXECUTION")
        logger.info("[MINING ENGINE] Parquet source: %s", self.parquet_path)
        logger.info("[MINING ENGINE] LanceDB source: %s", self.lancedb_uri)
        logger.info("[MINING ENGINE] Target artifact directory: %s", self.output_dir)
        logger.info("================================================================================")

        manifest: Dict[str, Any] = {
            "execution_timestamp": datetime.now().isoformat(),
            "parquet_source": self.parquet_path,
            "lancedb_source": self.lancedb_uri,
            "modules": {},
            "status": "RUNNING",
        }

        # ----------------------------------------------------------------------
        # Checkpoint 1: Exploratory Data Analysis (EDA)
        # ----------------------------------------------------------------------
        t0 = time.time()
        logger.info("[CHECKPOINT 1/5] Executing Real-Time Exploratory Data Analysis (EDA)...")
        eda_engine = EdaEngine(self.parquet_path)
        eda_results = eda_engine.run_full_eda()
        eda_file = os.path.join(self.output_dir, "eda_summary.json")
        with open(eda_file, "w", encoding="utf-8") as f:
            json.dump(eda_results, f, indent=2, ensure_ascii=False)
        manifest["modules"]["eda"] = {
            "elapsed_seconds": round(time.time() - t0, 2),
            "file": eda_file,
            "total_papers": eda_results["dataset_overview"]["total_papers"],
        }
        logger.info("[CHECKPOINT 1/5] [SUCCESS] EDA completed in %.2fs.", manifest["modules"]["eda"]["elapsed_seconds"])

        # ----------------------------------------------------------------------
        # Checkpoint 2: Pillar 1 - Association Rule Mining (FP-Growth)
        # ----------------------------------------------------------------------
        t0 = time.time()
        logger.info("[CHECKPOINT 2/5] Executing Pillar 1: Association Rule Mining (FP-Growth)...")
        rule_miner = AssociationRuleMiner(self.parquet_path)
        rule_results = rule_miner.mine_rules(min_support=0.015, min_lift=1.2)
        rules_file = os.path.join(self.output_dir, "association_rules.json")
        with open(rules_file, "w", encoding="utf-8") as f:
            json.dump(rule_results, f, indent=2, ensure_ascii=False)
        manifest["modules"]["association_rules"] = {
            "elapsed_seconds": round(time.time() - t0, 2),
            "file": rules_file,
            "rules_mined": len(rule_results.get("rules", [])),
        }
        logger.info("[CHECKPOINT 2/5] [SUCCESS] Pillar 1 completed in %.2fs.", manifest["modules"]["association_rules"]["elapsed_seconds"])

        # ----------------------------------------------------------------------
        # Checkpoint 3: Pillar 2 - Semantic Topic Clustering
        # ----------------------------------------------------------------------
        t0 = time.time()
        logger.info("[CHECKPOINT 3/5] Executing Pillar 2: Semantic Topic Clustering...")
        cluster_analyzer = SemanticClusterAnalyzer(self.lancedb_uri)
        cluster_results = cluster_analyzer.run_clustering_benchmarks(sample_size=5000, n_clusters=6)
        clusters_file = os.path.join(self.output_dir, "clusters.json")
        with open(clusters_file, "w", encoding="utf-8") as f:
            json.dump(cluster_results, f, indent=2, ensure_ascii=False)
        manifest["modules"]["clusters"] = {
            "elapsed_seconds": round(time.time() - t0, 2),
            "file": clusters_file,
            "silhouette_score": cluster_results["validity_metrics"]["silhouette_score"],
        }
        logger.info("[CHECKPOINT 3/5] [SUCCESS] Pillar 2 completed in %.2fs.", manifest["modules"]["clusters"]["elapsed_seconds"])

        # ----------------------------------------------------------------------
        # Checkpoint 4: Pillar 3 - Co-authorship Graph Mining
        # ----------------------------------------------------------------------
        t0 = time.time()
        logger.info("[CHECKPOINT 4/5] Executing Pillar 3: Co-authorship Graph Mining...")
        graph_miner = CoauthorshipGraphMiner(self.parquet_path)
        graph_results = graph_miner.analyze_network(top_hubs_limit=40)
        graph_file = os.path.join(self.output_dir, "graph_coauthorship.json")
        with open(graph_file, "w", encoding="utf-8") as f:
            json.dump(graph_results, f, indent=2, ensure_ascii=False)
        manifest["modules"]["graph"] = {
            "elapsed_seconds": round(time.time() - t0, 2),
            "file": graph_file,
            "total_authors": graph_results["network_summary"]["total_authors"],
            "total_collaborations": graph_results["network_summary"]["total_collaborations"],
        }
        logger.info("[CHECKPOINT 4/5] [SUCCESS] Pillar 3 completed in %.2fs.", manifest["modules"]["graph"]["elapsed_seconds"])

        # ----------------------------------------------------------------------
        # Checkpoint 5: Pillar 4 - Trend Velocity & Anomaly Mining
        # ----------------------------------------------------------------------
        t0 = time.time()
        logger.info("[CHECKPOINT 5/5] Executing Pillar 4: Trend Velocity & Anomaly Mining...")
        trend_miner = TrendAnomalyMiner(self.parquet_path)
        trend_results = trend_miner.run_mining(contamination=0.02)
        trend_file = os.path.join(self.output_dir, "trends_anomalies.json")
        with open(trend_file, "w", encoding="utf-8") as f:
            json.dump(trend_results, f, indent=2, ensure_ascii=False)
        manifest["modules"]["trends_anomalies"] = {
            "elapsed_seconds": round(time.time() - t0, 2),
            "file": trend_file,
            "anomalies_detected": len(trend_results.get("anomalies", [])),
        }
        logger.info("[CHECKPOINT 5/5] [SUCCESS] Pillar 4 completed in %.2fs.", manifest["modules"]["trends_anomalies"]["elapsed_seconds"])

        # ----------------------------------------------------------------------
        # Finalize Manifest
        # ----------------------------------------------------------------------
        total_time = round(time.time() - start_time, 2)
        manifest["total_execution_seconds"] = total_time
        manifest["status"] = "COMPLETED"

        manifest_file = os.path.join(self.output_dir, "mining_manifest.json")
        with open(manifest_file, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)

        # ----------------------------------------------------------------------
        # Sync to Cloudflare R2 if requested
        # ----------------------------------------------------------------------
        if upload_to_r2:
            logger.info("[MINING ENGINE] Syncing mining artifacts to Cloudflare R2 bucket: %s...", settings.R2_BUCKET_NAME)
            artifact_files = [eda_file, rules_file, clusters_file, graph_file, trend_file, manifest_file]
            for local_path in artifact_files:
                if os.path.exists(local_path):
                    filename = os.path.basename(local_path)
                    r2_key = f"gold/mining/{filename}"
                    self.r2_client.upload_file(local_path, r2_key)
                    logger.info("[MINING ENGINE] [R2 SYNC] Uploaded %s -> s3://%s/%s", filename, settings.R2_BUCKET_NAME, r2_key)

        logger.info("================================================================================")
        logger.info("[MINING ENGINE] [SUMMARY] All 4 Pillars and EDA executed successfully in %.2fs.", total_time)
        logger.info("================================================================================")
        return manifest


def main():
    parser = argparse.ArgumentParser(description="Execute full Data Mining & EDA Engine.")
    parser.add_argument("--parquet", type=str, default="data/silver/year=2026/papers.parquet", help="Path to Silver Parquet")
    parser.add_argument("--lancedb", type=str, default="data/gold/lancedb", help="Path to Gold LanceDB")
    parser.add_argument("--output", type=str, default="data/gold/mining", help="Output directory for mining artifacts")
    parser.add_argument("--no-r2", action="store_true", help="Skip Cloudflare R2 upload")
    args = parser.parse_args()

    engine = MiningEngine(
        parquet_path=args.parquet,
        lancedb_uri=args.lancedb,
        output_dir=args.output,
    )
    engine.run_all(upload_to_r2=not args.no_r2)


if __name__ == "__main__":
    main()
