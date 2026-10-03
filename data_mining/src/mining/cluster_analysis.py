"""
data_mining/src/mining/cluster_analysis.py
------------------------------------------
Pillar 2: Semantic Topic Clustering & Density Analysis Pipeline.
Analyzes 143k LanceDB vector embeddings (768-dim) using K-Means and DBSCAN,
evaluates cluster validity metrics (Silhouette, Davies-Bouldin, Calinski-Harabasz),
and generates 2D projections (TruncatedSVD/PCA) for interactive frontend visualization.

Adheres strictly to docs/agents/rules/LOGGING_CHECKPOINT_RULES.md:
- Strictly NO emojis/icons.
- Timestamped plain-text logs: [INFO], [SUCCESS], [WARNING], [ERROR].
"""

import os
import json
import logging
from typing import Dict, Any, List
import numpy as np
import lancedb
from sklearn.cluster import MiniBatchKMeans, DBSCAN
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score
from collections import Counter

logger = logging.getLogger("cluster_analysis")


class SemanticClusterAnalyzer:
    """Performs semantic partitioning and density clustering over Gold vector embeddings."""

    def __init__(self, lancedb_uri: str, table_name: str = "scientific_papers_gold"):
        self.lancedb_uri = lancedb_uri
        self.table_name = table_name

    def load_vector_sample(self, sample_size: int = 5000) -> Dict[str, Any]:
        """Loads a representative sample of vectors with paper metadata from LanceDB."""
        logger.info(
            "[PILLAR 2] Connecting to LanceDB at: %s (table: %s)...",
            self.lancedb_uri,
            self.table_name,
        )
        db = lancedb.connect(self.lancedb_uri)
        tbl = db.open_table(self.table_name)

        total_rows = len(tbl)
        logger.info("[PILLAR 2] Table has %d total chunks. Sampling %d vectors...", total_rows, sample_size)

        # LanceDB query with limit
        df = tbl.search().limit(sample_size).to_pandas()

        vectors = np.vstack(df["vector"].values)
        metadata = df[["chunk_id", "paper_id", "title", "primary_category"]].to_dict(orient="records")

        return {"vectors": vectors, "metadata": metadata}

    def run_clustering_benchmarks(
        self,
        sample_size: int = 5000,
        n_clusters: int = 6,
    ) -> Dict[str, Any]:
        """Executes K-Means and DBSCAN benchmarks with validation metrics and 2D projection."""
        sample_data = self.load_vector_sample(sample_size=sample_size)
        vectors: np.ndarray = sample_data["vectors"]
        metadata: List[Dict[str, Any]] = sample_data["metadata"]

        logger.info("[PILLAR 2] Running 2D Dimensionality Reduction (TruncatedSVD)...")
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            svd = TruncatedSVD(n_components=2, random_state=42)
            coords_2d = svd.fit_transform(vectors.astype(np.float64))

        # 1. Partitioning: K-Means
        logger.info("[PILLAR 2] Executing K-Means clustering (K=%d)...", n_clusters)
        kmeans = MiniBatchKMeans(n_clusters=n_clusters, random_state=42, batch_size=512, n_init=3)
        kmeans_labels = kmeans.fit_predict(vectors)

        # Evaluate validity metrics (using a subsample for Silhouette to optimize speed)
        val_sample_idx = np.random.choice(len(vectors), size=min(2000, len(vectors)), replace=False)
        sil_score = float(silhouette_score(vectors[val_sample_idx], kmeans_labels[val_sample_idx]))
        db_score = float(davies_bouldin_score(vectors, kmeans_labels))
        ch_score = float(calinski_harabasz_score(vectors, kmeans_labels))

        logger.info(
            "[PILLAR 2] K-Means Validation -> Silhouette: %.4f, Davies-Bouldin: %.4f, Calinski-Harabasz: %.1f",
            sil_score,
            db_score,
            ch_score,
        )

        # 2. Density Clustering: DBSCAN
        logger.info("[PILLAR 2] Executing DBSCAN density clustering...")
        dbscan = DBSCAN(eps=0.65, min_samples=10, metric="cosine")
        dbscan_labels = dbscan.fit_predict(vectors)
        noise_count = int(np.sum(dbscan_labels == -1))
        num_dbscan_clusters = len(set(dbscan_labels) - {-1})

        # 3. Cluster Profiling: Summarize dominant categories per K-Means cluster
        cluster_profiles = []
        for c_id in range(n_clusters):
            mask = kmeans_labels == c_id
            cluster_meta = [metadata[i] for i in range(len(metadata)) if mask[i]]
            categories = [m.get("primary_category", "unknown") for m in cluster_meta if m.get("primary_category")]
            top_cats = Counter(categories).most_common(3)
            sample_titles = [m.get("title", "") for m in cluster_meta[:3]]

            cluster_profiles.append({
                "cluster_id": c_id,
                "size": int(np.sum(mask)),
                "percentage": round(float(np.sum(mask)) * 100.0 / len(vectors), 2),
                "dominant_categories": [{"category": cat, "count": cnt} for cat, cnt in top_cats],
                "sample_titles": sample_titles,
            })

        # 4. Prepare scatter points for 2D visual representation (downsampled for FE payload)
        display_sample = min(800, len(vectors))
        scatter_points = []
        for i in range(display_sample):
            scatter_points.append({
                "x": round(float(coords_2d[i, 0]), 4),
                "y": round(float(coords_2d[i, 1]), 4),
                "cluster": int(kmeans_labels[i]),
                "category": str(metadata[i].get("primary_category", "unknown")),
                "title": str(metadata[i].get("title", "")),
                "paper_id": str(metadata[i].get("paper_id", "")),
            })

        results = {
            "summary": {
                "sample_analyzed": len(vectors),
                "vector_dimensions": vectors.shape[1],
                "optimal_k": n_clusters,
                "dbscan_clusters_found": num_dbscan_clusters,
                "dbscan_noise_ratio": round(float(noise_count) / len(vectors), 4),
            },
            "validity_metrics": {
                "silhouette_score": round(sil_score, 4),
                "davies_bouldin_index": round(db_score, 4),
                "calinski_harabasz_index": round(ch_score, 1),
            },
            "cluster_profiles": cluster_profiles,
            "scatter_2d": scatter_points,
        }

        logger.info("[PILLAR 2] [SUCCESS] Completed Semantic Topic Clustering.")
        return results

    def save_clusters(self, output_path: str, sample_size: int = 5000, n_clusters: int = 6) -> None:
        """Executes clustering pipeline and writes output JSON to disk."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        results = self.run_clustering_benchmarks(sample_size=sample_size, n_clusters=n_clusters)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        logger.info("[PILLAR 2] [SUCCESS] Saved clustering analysis to: %s", output_path)
