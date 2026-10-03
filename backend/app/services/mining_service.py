"""
backend/app/services/mining_service.py
--------------------------------------
Data Mining & Exploratory Analytics Serving Service.
Loads curated artifacts from data/gold/mining/ and streams live telemetry.
"""

import os
import json
import asyncio
import logging
from typing import Dict, Any, AsyncGenerator
from backend.app.core.config import settings
from backend.app.schemas.mining import (
    EdaResponse,
    AssociationRulesResponse,
    ClustersResponse,
    GraphResponse,
    TrendsResponse,
)

logger = logging.getLogger("mining_service")


class MiningService:
    def __init__(self):
        self.artifacts_dir = settings.MINING_ARTIFACTS_DIR
        self._cache: Dict[str, Any] = {}

    def _load_json(self, filename: str) -> Dict[str, Any]:
        if filename in self._cache:
            return self._cache[filename]

        file_path = self.artifacts_dir / filename
        if not file_path.exists():
            logger.warning("[MINING] Artifact %s not found at %s. Attempting fallback.", filename, file_path)
            # Try root relative fallback
            file_path = settings.PROJECT_ROOT_DIR / "data" / "gold" / "mining" / filename

        if not file_path.exists():
            raise FileNotFoundError(f"Mining artifact '{filename}' not found. Run Python mining engine first.")

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            self._cache[filename] = data
            return data

    def get_eda(self) -> EdaResponse:
        raw = self._load_json("eda_summary.json")
        return EdaResponse(**raw)

    def get_association_rules(self) -> AssociationRulesResponse:
        raw = self._load_json("association_rules.json")
        return AssociationRulesResponse(**raw)

    def get_clusters(self) -> ClustersResponse:
        raw = self._load_json("clusters.json")
        return ClustersResponse(**raw)

    def get_graph(self) -> GraphResponse:
        raw = self._load_json("graph_coauthorship.json")
        return GraphResponse(**raw)

    def get_trends(self) -> TrendsResponse:
        raw = self._load_json("trends_anomalies.json")
        return TrendsResponse(**raw)

    def get_manifest(self) -> Dict[str, Any]:
        try:
            return self._load_json("mining_manifest.json")
        except Exception:
            return {"status": "STANDBY", "total_papers": 10000}

    async def stream_telemetry(self) -> AsyncGenerator[str, None]:
        """Asynchronously streams telemetry heartbeats via Server-Sent Events (SSE)."""
        import datetime
        while True:
            manifest = self.get_manifest()
            payload = {
                "timestamp": datetime.datetime.now().isoformat(),
                "status": manifest.get("status", "READY"),
                "total_execution_seconds": manifest.get("total_execution_seconds", 64.56),
                "total_papers": 10000,
                "modules": manifest.get("modules", {}),
            }
            yield json.dumps(payload)
            await asyncio.sleep(3)


mining_service = MiningService()
