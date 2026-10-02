"""src/trends/plot_trends.py — Publication-Ready Static Visualizations (Matplotlib & Seaborn)."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

logger = logging.getLogger("TrendPlotter")


class TrendPlotter:
    """
    Generates high-resolution PNG charts for longitudinal topic trends,
    keyword adoption heatmaps, and association rule scatter distributions.
    """

    def __init__(
        self,
        gold_trends_dir: Path | str = "data/gold/trends",
        output_dir: Path | str = "data/gold/plots",
    ):
        self.gold_trends_dir = Path(gold_trends_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        sns.set_theme(style="whitegrid", font="sans-serif")

    def plot_topic_trends(self, top_n: int = 6, filename: str = "topic_trends.png") -> Optional[Path]:
        """Plot longitudinal line chart of topic share evolution (2017-2026)."""
        topic_path = self.gold_trends_dir / "year_x_topic.parquet"
        if not topic_path.exists():
            return None

        df = pd.read_parquet(topic_path)
        if df.empty:
            return None

        # Determine top_n topics by total volume
        top_topics = df.groupby("topic")["paper_count"].sum().nlargest(top_n).index.tolist()
        filtered = df[df["topic"].isin(top_topics)]

        plt.figure(figsize=(10, 6), dpi=150)
        ax = sns.lineplot(
            data=filtered,
            x="year",
            y="yearly_share_pct",
            hue="topic",
            marker="o",
            linewidth=2.2,
        )

        plt.title("Longitudinal Topic Share Evolution (2017–2026)", fontsize=14, weight="bold", pad=12)
        plt.xlabel("Publication Year", fontsize=11, weight="bold")
        plt.ylabel("Share of Corpus Papers (%)", fontsize=11, weight="bold")
        plt.xticks(sorted(df["year"].unique()))
        plt.legend(title="Research Topic", bbox_to_anchor=(1.02, 1), loc="upper left")
        plt.tight_layout()

        out_file = self.output_dir / filename
        plt.savefig(out_file, bbox_inches="tight")
        plt.close()
        logger.info("Saved topic trends chart to %s", out_file)
        return out_file

    def plot_keyword_heatmap(self, top_n: int = 15, filename: str = "keyword_heatmap.png") -> Optional[Path]:
        """Plot heatmap of top keyword occurrences across publication years."""
        kw_path = self.gold_trends_dir / "year_x_keyword.parquet"
        if not kw_path.exists():
            return None

        df = pd.read_parquet(kw_path)
        if df.empty:
            return None

        top_kws = df.groupby("keyword")["paper_count"].sum().nlargest(top_n).index.tolist()
        filtered = df[df["keyword"].isin(top_kws)]

        pivot = filtered.pivot(index="keyword", columns="year", values="paper_count").fillna(0)

        plt.figure(figsize=(11, 7), dpi=150)
        sns.heatmap(
            pivot,
            cmap="YlGnBu",
            annot=True,
            fmt=".0f",
            linewidths=0.5,
            cbar_kws={"label": "Paper Count"},
        )

        plt.title("Keyword Frequency Evolution Across Years (2017–2026)", fontsize=14, weight="bold", pad=12)
        plt.xlabel("Publication Year", fontsize=11, weight="bold")
        plt.ylabel("Keyword Concept", fontsize=11, weight="bold")
        plt.tight_layout()

        out_file = self.output_dir / filename
        plt.savefig(out_file, bbox_inches="tight")
        plt.close()
        logger.info("Saved keyword heatmap to %s", out_file)
        return out_file

    def plot_association_rules(self, filename: str = "association_rules_scatter.png") -> Optional[Path]:
        """Plot scatter plot of mined association rules (Support vs Confidence sized by Lift)."""
        rules_path = self.gold_trends_dir / "association_rules.parquet"
        if not rules_path.exists():
            return None

        df = pd.read_parquet(rules_path)
        if df.empty:
            return None

        plt.figure(figsize=(9, 6), dpi=150)
        scatter = plt.scatter(
            df["support"],
            df["confidence"],
            c=df["lift"],
            s=df["lift"] * 40,
            cmap="viridis",
            alpha=0.8,
            edgecolors="black",
            linewidth=0.5,
        )

        cbar = plt.colorbar(scatter)
        cbar.set_label("Rule Lift", weight="bold")

        plt.title("Mined Keyword Association Rules (FP-Growth)", fontsize=14, weight="bold", pad=12)
        plt.xlabel("Support (P(A ∩ B))", fontsize=11, weight="bold")
        plt.ylabel("Confidence (P(B | A))", fontsize=11, weight="bold")
        plt.tight_layout()

        out_file = self.output_dir / filename
        plt.savefig(out_file, bbox_inches="tight")
        plt.close()
        logger.info("Saved association rules scatter to %s", out_file)
        return out_file

    def plot_all(self) -> dict[str, Path]:
        """Generate all static visual artifacts."""
        results = {}
        t_plot = self.plot_topic_trends()
        if t_plot:
            results["topic_trends"] = t_plot

        k_plot = self.plot_keyword_heatmap()
        if k_plot:
            results["keyword_heatmap"] = k_plot

        r_plot = self.plot_association_rules()
        if r_plot:
            results["association_rules"] = r_plot

        return results
