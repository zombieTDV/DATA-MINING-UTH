"""
data_mining/src/mining/association_rules.py
-------------------------------------------
Pillar 1: Frequent Pattern & Association Rule Mining Pipeline (FP-Growth).
Discovers non-trivial co-occurrence patterns across scientific categories
and domain concepts extracted from 10,000 arXiv papers.

Adheres strictly to docs/agents/rules/LOGGING_CHECKPOINT_RULES.md:
- Strictly NO emojis/icons.
- Timestamped plain-text logs: [INFO], [SUCCESS], [WARNING], [ERROR].
"""

import os
import re
import json
import logging
from typing import Dict, Any, List
import pandas as pd
import duckdb
from mlxtend.preprocessing import TransactionEncoder
from mlxtend.frequent_patterns import fpgrowth, association_rules

logger = logging.getLogger("association_rules")

# Canonical AI/DS vocabulary keywords for transaction extraction from paper titles
KEYWORD_VOCAB = [
    ("diffusion", "diffusion-models"),
    ("transformer", "transformer"),
    ("attention", "attention-mech"),
    ("llm", "large-language-models"),
    ("language model", "large-language-models"),
    ("reinforcement learning", "reinforcement-learning"),
    ("rl", "reinforcement-learning"),
    ("graph neural", "graph-neural-networks"),
    ("gnn", "graph-neural-networks"),
    ("vision-language", "vision-language"),
    ("multimodal", "multimodal-ai"),
    ("distillation", "knowledge-distillation"),
    ("quantization", "model-quantization"),
    ("self-supervised", "self-supervised-learning"),
    ("federated", "federated-learning"),
    ("rag", "retrieval-augmented-gen"),
    ("retrieval", "retrieval-systems"),
    ("alignment", "ai-alignment"),
    ("safety", "ai-safety"),
    ("continual learning", "continual-learning"),
    ("zero-shot", "zero-shot-learning"),
    ("few-shot", "few-shot-learning"),
    ("agent", "autonomous-agents"),
    ("benchmark", "evaluation-benchmarks"),
    ("optimization", "convex-optimization"),
]


class AssociationRuleMiner:
    """Mines frequent itemsets and high-lift association rules using FP-Growth."""

    def __init__(self, parquet_path: str):
        self.parquet_path = parquet_path

    def _extract_transactions(self) -> List[List[str]]:
        """Constructs market-basket transactions per paper (categories + concepts)."""
        logger.info("[PILLAR 1] Loading papers for basket encoding...")
        con = duckdb.connect()
        df = con.execute(
            f"SELECT paper_id, title, categories FROM read_parquet('{self.parquet_path}')"
        ).fetchdf()

        transactions: List[List[str]] = []
        for _, row in df.iterrows():
            basket = set()

            # Add arXiv categories
            raw_cats = row.get("categories")
            if isinstance(raw_cats, (list, tuple)):
                for c in raw_cats:
                    if c:
                        basket.add(f"cat:{c.strip()}")

            # Extract recognized scientific concepts from title
            title = str(row.get("title", "")).lower()
            for pattern, tag in KEYWORD_VOCAB:
                if re.search(r"\b" + re.escape(pattern) + r"\b", title):
                    basket.add(f"tag:{tag}")

            if len(basket) >= 2:
                transactions.append(list(basket))

        logger.info(
            "[PILLAR 1] Extracted %d multi-item transactions from %d papers.",
            len(transactions),
            len(df),
        )
        return transactions

    def mine_rules(
        self,
        min_support: float = 0.015,
        min_lift: float = 1.2,
        top_k: int = 50,
    ) -> Dict[str, Any]:
        """Executes FP-Growth algorithm and generates association rules."""
        transactions = self._extract_transactions()
        if not transactions:
            logger.warning("[PILLAR 1] [WARNING] No transactions found. Returning empty rules.")
            return {"frequent_itemsets": [], "rules": [], "summary": {}}

        # 1. One-hot encode variable-length transactions
        logger.info("[PILLAR 1] Encoding transaction matrix via TransactionEncoder...")
        te = TransactionEncoder()
        te_ary = te.fit_transform(transactions)
        df_encoded = pd.DataFrame(te_ary, columns=te.columns_)

        # 2. Discover frequent itemsets via FP-Growth (avoiding Apriori candidate explosion)
        logger.info(
            "[PILLAR 1] Running FP-Growth with min_support=%.4f...",
            min_support,
        )
        frequent_itemsets = fpgrowth(df_encoded, min_support=min_support, use_colnames=True)
        logger.info("[PILLAR 1] Found %d frequent itemsets.", len(frequent_itemsets))

        if frequent_itemsets.empty:
            return {"frequent_itemsets": [], "rules": [], "summary": {}}

        # 3. Generate and filter rules by Lift
        logger.info("[PILLAR 1] Generating association rules with min_lift=%.2f...", min_lift)
        rules = association_rules(frequent_itemsets, metric="lift", min_threshold=min_lift)

        if rules.empty:
            logger.warning("[PILLAR 1] No rules met min_lift threshold. Falling back to lift=1.0.")
            rules = association_rules(frequent_itemsets, metric="lift", min_threshold=1.0)

        # 4. Sort by Lift and Confidence
        sorted_rules = rules.sort_values(by=["lift", "confidence"], ascending=[False, False])
        top_rules = sorted_rules.head(top_k)

        # Format output for JSON serialization and Frontend consumption
        formatted_itemsets = []
        for _, row in frequent_itemsets.sort_values(by="support", ascending=False).head(40).iterrows():
            formatted_itemsets.append({
                "itemset": list(row["itemsets"]),
                "support": round(float(row["support"]), 4),
            })

        formatted_rules = []
        for _, row in top_rules.iterrows():
            formatted_rules.append({
                "antecedents": list(row["antecedents"]),
                "consequents": list(row["consequents"]),
                "support": round(float(row["support"]), 4),
                "confidence": round(float(row["confidence"]), 4),
                "lift": round(float(row["lift"]), 4),
                "leverage": round(float(row["leverage"]), 4),
                "conviction": (
                    round(float(row["conviction"]), 4)
                    if row["conviction"] != float("inf")
                    else 999.0
                ),
            })

        result = {
            "summary": {
                "total_transactions": len(transactions),
                "total_unique_items": len(te.columns_),
                "frequent_itemsets_count": len(frequent_itemsets),
                "mined_rules_count": len(rules),
                "min_support_used": min_support,
                "min_lift_threshold": min_lift,
            },
            "frequent_itemsets": formatted_itemsets,
            "rules": formatted_rules,
        }

        logger.info(
            "[PILLAR 1] [SUCCESS] Mined %d actionable association rules (top lift: %.3f).",
            len(formatted_rules),
            formatted_rules[0]["lift"] if formatted_rules else 0.0,
        )
        return result

    def save_rules(self, output_path: str, min_support: float = 0.015, min_lift: float = 1.2) -> None:
        """Runs association rule mining and writes formatted JSON to disk."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        results = self.mine_rules(min_support=min_support, min_lift=min_lift)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        logger.info("[PILLAR 1] [SUCCESS] Saved rules to: %s", output_path)
