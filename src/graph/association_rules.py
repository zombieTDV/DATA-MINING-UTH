"""src/graph/association_rules.py — Frequent Itemset Mining & Association Rules via FP-Growth."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import pandas as pd

logger = logging.getLogger("AssociationRules")


class AssociationRuleMiner:
    """
    Extracts frequent keyword co-occurrence itemsets and association rules
    using the FP-Growth (Frequent Pattern Growth) algorithm.
    """

    def __init__(
        self,
        keywords_path: Path | str = "data/silver/keywords.parquet",
        papers_path: Path | str = "data/silver/papers.parquet",
    ):
        self.keywords_path = Path(keywords_path)
        self.papers_path = Path(papers_path)

    def extract_transactions(self, include_topics: bool = True) -> list[list[str]]:
        """Group keywords and topics by paper_id to form market-basket transactions."""
        kw_df = pd.read_parquet(self.keywords_path)
        if kw_df.empty:
            return []

        paper_items: dict[str, set[str]] = {}
        for pid, kw in zip(kw_df["paper_id"], kw_df["keyword"]):
            if pid not in paper_items:
                paper_items[pid] = set()
            if kw:
                paper_items[pid].add(str(kw))

        if include_topics and self.papers_path.exists():
            papers_df = pd.read_parquet(self.papers_path)
            for _, row in papers_df.iterrows():
                pid = row["paper_id"]
                topics = row.get("topics", [])
                if isinstance(topics, (list, tuple)):
                    if pid not in paper_items:
                        paper_items[pid] = set()
                    for t in topics:
                        if t:
                            paper_items[pid].add(str(t))

        transactions = [sorted(list(items)) for items in paper_items.values() if len(items) >= 2]
        logger.info("Extracted %d valid concept transactions across papers", len(transactions))
        return transactions

    def mine_rules(
        self,
        min_support: float = 0.015,
        min_confidence: float = 0.25,
        min_lift: float = 1.15,
        include_topics: bool = True,
    ) -> pd.DataFrame:
        """
        Run FP-Growth on transactions and derive non-spurious association rules.

        Args:
            min_support: Minimum frequency threshold (fraction of papers).
            min_confidence: Conditional probability P(B|A).
            min_lift: Correlation strength (Lift > 1 implies positive correlation).
        """
        try:
            from mlxtend.frequent_patterns import association_rules, fpgrowth
            from mlxtend.preprocessing import TransactionEncoder
        except ImportError:
            logger.error("mlxtend is required for FP-Growth. Please install via: pip install mlxtend")
            return pd.DataFrame()

        transactions = self.extract_transactions(include_topics=include_topics)
        if not transactions:
            logger.warning("No transactions available for association mining.")
            return pd.DataFrame()

        te = TransactionEncoder()
        te_ary = te.fit(transactions).transform(transactions)
        encoded_df = pd.DataFrame(te_ary, columns=te.columns_)

        # 1. Mine Frequent Itemsets
        logger.info("Mining frequent itemsets with min_support=%.3f...", min_support)
        frequent_itemsets = fpgrowth(encoded_df, min_support=min_support, use_colnames=True)

        if frequent_itemsets.empty:
            logger.warning("No frequent itemsets found at min_support=%.3f", min_support)
            return pd.DataFrame()

        frequent_itemsets["length"] = frequent_itemsets["itemsets"].apply(len)
        logger.info("Discovered %d frequent itemsets (max size: %d)", len(frequent_itemsets), frequent_itemsets["length"].max())

        # 2. Derive Association Rules
        logger.info("Generating association rules with min_lift=%.2f...", min_lift)
        try:
            rules_df = association_rules(frequent_itemsets, metric="lift", min_threshold=min_lift)
        except Exception as err:
            logger.warning("Association rules extraction error: %s", err)
            return pd.DataFrame()

        if rules_df.empty:
            logger.warning("No rules exceeded min_lift=%.2f", min_lift)
            return pd.DataFrame()

        # Filter by confidence
        rules_df = rules_df[rules_df["confidence"] >= min_confidence]

        # Format frozenset to clean string representation
        rules_df["antecedents_str"] = rules_df["antecedents"].apply(lambda s: ", ".join(sorted(list(s))))
        rules_df["consequents_str"] = rules_df["consequents"].apply(lambda s: ", ".join(sorted(list(s))))

        # Sort by Lift descending
        rules_df = rules_df.sort_values("lift", ascending=False).reset_index(drop=True)
        logger.info("Discovered %d actionable association rules meeting thresholds", len(rules_df))
        return rules_df

    def save_rules(
        self,
        output_path: Path | str = "data/gold/trends/association_rules.parquet",
        min_support: float = 0.015,
        min_confidence: float = 0.25,
        min_lift: float = 1.15,
        include_topics: bool = True,
    ) -> Path:
        """Mine rules and persist to Gold layer Parquet."""
        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)
        rules_df = self.mine_rules(
            min_support=min_support,
            min_confidence=min_confidence,
            min_lift=min_lift,
            include_topics=include_topics,
        )

        # Drop frozenset object columns before saving to Parquet for broad compatibility
        clean_df = rules_df.drop(columns=["antecedents", "consequents"], errors="ignore")
        clean_df.to_parquet(out, index=False)
        logger.info("Saved association rules to %s (%d rules)", out, len(clean_df))
        return out
