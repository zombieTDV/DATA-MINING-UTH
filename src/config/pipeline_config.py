"""src/config/pipeline_config.py — Centralized Configuration Loader and Dataclasses."""
from __future__ import annotations

from dataclasses import dataclass, field
import logging
from pathlib import Path
from typing import Any, Optional
import yaml

logger = logging.getLogger("ConfigLoader")

DEFAULT_CONFIG_PATH = Path("configs/config.yaml")


@dataclass
class CollectionConfig:
    active_mode: str = "scale"
    pilot_size: int = 200
    target_papers: int = 10000
    start_year: int = 2017
    end_year: int = 2026
    stratify_by_year: bool = True
    min_papers_per_year: int = 100
    per_year_limit: int = 1000
    pilot_per_year_limit: int = 22
    language: str = "en"
    sort_by: str = "cited_by_count:desc"


@dataclass
class OpenAlexConfig:
    name: str = "OpenAlex Works API"
    base_url: str = "https://api.openalex.org/works"
    user_agent: str = "UTH-DataMining-Student/1.0 (mailto:student@uth.edu.vn)"
    mailto: str = "student@uth.edu.vn"
    rate_limit_delay_seconds: float = 0.5
    max_retries: int = 3
    timeout_seconds: int = 20
    page_size: int = 200


@dataclass
class PDFVaultingConfig:
    enabled: bool = True
    skip_pdf: bool = False
    overwrite_existing: bool = False
    timeout_seconds: int = 30
    max_file_size_mb: int = 35
    max_pages_per_pdf: int = 25


@dataclass
class TopicsConfig:
    openalex_topic_ids: list[dict[str, str]] = field(default_factory=lambda: [
        {"id": "T10181", "name": "Natural Language Processing Techniques"},
        {"id": "T10028", "name": "Topic Modeling, Transformers, BERT, GPT, LLaMA"},
        {"id": "T11550", "name": "Text and Document Classification Technologies"},
        {"id": "T12031", "name": "Speech and Dialogue Systems"},
    ])
    target_tags: list[str] = field(default_factory=lambda: [
        "large language model",
        "llm",
        "transformer",
        "attention mechanism",
        "reinforcement learning from human feedback (rlhf)",
        "direct preference optimization (dpo)",
        "parameter-efficient fine-tuning (peft)",
        "low-rank adaptation (lora)",
        "retrieval-augmented generation (rag)",
        "chain-of-thought",
        "prompt engineering",
    ])
    taxonomy_file: str = "configs/taxonomy.yaml"


@dataclass
class StorageConfig:
    bronze_root: str = "data/bronze"
    raw_json_dir: str = "data/bronze/papers"
    pdf_dir: str = "data/bronze/pdf_raw"
    manifest_file: str = "data/bronze/manifest.parquet"
    
    silver_root: str = "data/silver"
    papers_parquet: str = "data/silver/papers.parquet"
    citations_parquet: str = "data/silver/citations.parquet"
    keywords_parquet: str = "data/silver/keywords.parquet"
    sections_parquet: str = "data/silver/sections.parquet"
    chunks_parquet: str = "data/silver/chunks.parquet"

    gold_root: str = "data/gold"
    graphs_dir: str = "data/gold/graphs"
    trends_dir: str = "data/gold/trends"
    lancedb_dir: str = "data/gold/lancedb"


@dataclass
class GraphAnalyticsConfig:
    pagerank_alpha: float = 0.85
    pagerank_max_iter: int = 100
    pagerank_weight: str = "weight"
    fpgrowth_min_support: float = 0.02
    association_metric: str = "lift"
    association_min_threshold: float = 0.3
    pyvis_max_nodes: int = 1000


@dataclass
class RAGPipelineConfig:
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_dim: int = 384
    device: str = "cpu"
    max_chunk_size: int = 512
    chunk_overlap: int = 64
    table_name: str = "academic_chunks"
    default_top_k: int = 5
    default_graph_boost: float = 0.25
    use_bm25_tantivy: bool = True
    use_dense_vector: bool = True
    default_backend: str = "mock"
    gemini_model: str = "gemini-2.5-flash"
    temperature: float = 0.2
    strict_citation_verification: bool = True


@dataclass
class LoggingConfig:
    root_dir: str = "logs"
    level: str = "INFO"
    rotation_max_bytes: int = 10 * 1024 * 1024
    backup_count: int = 5
    audit_file: str = "logs/audit.jsonl"


@dataclass
class PipelineConfig:
    """Master aggregated configuration container."""
    collection: CollectionConfig = field(default_factory=CollectionConfig)
    openalex: OpenAlexConfig = field(default_factory=OpenAlexConfig)
    pdf_vaulting: PDFVaultingConfig = field(default_factory=PDFVaultingConfig)
    topics: TopicsConfig = field(default_factory=TopicsConfig)
    storage: StorageConfig = field(default_factory=StorageConfig)
    graph: GraphAnalyticsConfig = field(default_factory=GraphAnalyticsConfig)
    rag: RAGPipelineConfig = field(default_factory=RAGPipelineConfig)
    logging: LoggingConfig = field(default_factory=LoggingConfig)
    raw_dict: dict[str, Any] = field(default_factory=dict)


def load_yaml(path: str | Path = DEFAULT_CONFIG_PATH) -> dict[str, Any]:
    """Safely load raw YAML configuration file into a dictionary."""
    file_path = Path(path)
    if not file_path.exists():
        logger.warning("Config file '%s' not found. Using defaults.", file_path)
        return {}
    with open(file_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data or {}


def load_config(path: str | Path = DEFAULT_CONFIG_PATH) -> PipelineConfig:
    """Load configuration YAML and construct typed PipelineConfig."""
    data = load_yaml(path)
    
    cfg = PipelineConfig(raw_dict=data)

    # 1. Collection
    coll = data.get("collection", {})
    if coll:
        cfg.collection = CollectionConfig(
            active_mode=coll.get("active_mode", cfg.collection.active_mode),
            pilot_size=coll.get("pilot_size", cfg.collection.pilot_size),
            target_papers=coll.get("target_papers", cfg.collection.target_papers),
            start_year=coll.get("start_year", cfg.collection.start_year),
            end_year=coll.get("end_year", cfg.collection.end_year),
            stratify_by_year=coll.get("stratify_by_year", cfg.collection.stratify_by_year),
            min_papers_per_year=coll.get("min_papers_per_year", cfg.collection.min_papers_per_year),
            per_year_limit=coll.get("per_year_limit", cfg.collection.per_year_limit),
            pilot_per_year_limit=coll.get("pilot_per_year_limit", cfg.collection.pilot_per_year_limit),
            language=coll.get("language", cfg.collection.language),
            sort_by=coll.get("sort_by", cfg.collection.sort_by),
        )

    # 2. Data Sources
    sources = data.get("data_sources", {})
    oa = sources.get("primary", {})
    if oa:
        cfg.openalex = OpenAlexConfig(
            name=oa.get("name", cfg.openalex.name),
            base_url=oa.get("base_url", cfg.openalex.base_url),
            user_agent=oa.get("user_agent", cfg.openalex.user_agent),
            mailto=oa.get("mailto", cfg.openalex.mailto),
            rate_limit_delay_seconds=float(oa.get("rate_limit_delay_seconds", cfg.openalex.rate_limit_delay_seconds)),
            max_retries=int(oa.get("max_retries", cfg.openalex.max_retries)),
            timeout_seconds=int(oa.get("timeout_seconds", cfg.openalex.timeout_seconds)),
            page_size=int(oa.get("page_size", cfg.openalex.page_size)),
        )

    pdf = sources.get("pdf_vaulting", {})
    if pdf:
        cfg.pdf_vaulting = PDFVaultingConfig(
            enabled=pdf.get("enabled", cfg.pdf_vaulting.enabled),
            skip_pdf=pdf.get("skip_pdf", cfg.pdf_vaulting.skip_pdf),
            overwrite_existing=pdf.get("overwrite_existing", cfg.pdf_vaulting.overwrite_existing),
            timeout_seconds=int(pdf.get("timeout_seconds", cfg.pdf_vaulting.timeout_seconds)),
            max_file_size_mb=int(pdf.get("max_file_size_mb", cfg.pdf_vaulting.max_file_size_mb)),
            max_pages_per_pdf=int(pdf.get("max_pages_per_pdf", cfg.pdf_vaulting.max_pages_per_pdf)),
        )

    # 3. Topics
    top = data.get("topics_and_tags", {})
    if top:
        cfg.topics = TopicsConfig(
            openalex_topic_ids=top.get("openalex_topic_ids", cfg.topics.openalex_topic_ids),
            target_tags=top.get("target_tags", cfg.topics.target_tags),
            taxonomy_file=top.get("taxonomy_file", cfg.topics.taxonomy_file),
        )

    # 4. Storage
    st = data.get("storage", {})
    bronze = st.get("bronze", {})
    silver = st.get("silver", {})
    gold = st.get("gold", {})
    if st:
        cfg.storage = StorageConfig(
            bronze_root=bronze.get("root", cfg.storage.bronze_root),
            raw_json_dir=bronze.get("raw_json_dir", cfg.storage.raw_json_dir),
            pdf_dir=bronze.get("pdf_dir", cfg.storage.pdf_dir),
            manifest_file=bronze.get("manifest", cfg.storage.manifest_file),
            silver_root=silver.get("root", cfg.storage.silver_root),
            papers_parquet=silver.get("papers", cfg.storage.papers_parquet),
            citations_parquet=silver.get("citations", cfg.storage.citations_parquet),
            keywords_parquet=silver.get("keywords", cfg.storage.keywords_parquet),
            sections_parquet=silver.get("sections", cfg.storage.sections_parquet),
            chunks_parquet=silver.get("chunks", cfg.storage.chunks_parquet),
            gold_root=gold.get("root", cfg.storage.gold_root),
            graphs_dir=gold.get("graphs_dir", cfg.storage.graphs_dir),
            trends_dir=gold.get("trends_dir", cfg.storage.trends_dir),
            lancedb_dir=gold.get("lancedb_dir", cfg.storage.lancedb_dir),
        )

    # 5. Graph
    gr = data.get("graph_analytics", {})
    if gr:
        pr = gr.get("pagerank", {})
        ar = gr.get("association_rules", {})
        pv = gr.get("pyvis_visualization", {})
        cfg.graph = GraphAnalyticsConfig(
            pagerank_alpha=float(pr.get("alpha", cfg.graph.pagerank_alpha)),
            pagerank_max_iter=int(pr.get("max_iter", cfg.graph.pagerank_max_iter)),
            pagerank_weight=pr.get("weight", cfg.graph.pagerank_weight),
            fpgrowth_min_support=float(ar.get("min_support", cfg.graph.fpgrowth_min_support)),
            association_metric=ar.get("metric", cfg.graph.association_metric),
            association_min_threshold=float(ar.get("min_threshold", cfg.graph.association_min_threshold)),
            pyvis_max_nodes=int(pv.get("max_rendered_nodes", cfg.graph.pyvis_max_nodes)),
        )

    # 6. RAG
    rag = data.get("rag_pipeline", {})
    if rag:
        emb = rag.get("embedding", {})
        chk = rag.get("chunking", {})
        ret = rag.get("retrieval", {})
        srv = rag.get("serving", {})
        cfg.rag = RAGPipelineConfig(
            embedding_model=emb.get("model_name", cfg.rag.embedding_model),
            embedding_dim=int(emb.get("dimension", cfg.rag.embedding_dim)),
            device=emb.get("device", cfg.rag.device),
            max_chunk_size=int(chk.get("max_chunk_size", cfg.rag.max_chunk_size)),
            chunk_overlap=int(chk.get("chunk_overlap", cfg.rag.chunk_overlap)),
            table_name=ret.get("table_name", cfg.rag.table_name),
            default_top_k=int(ret.get("default_top_k", cfg.rag.default_top_k)),
            default_graph_boost=float(ret.get("default_graph_boost", cfg.rag.default_graph_boost)),
            use_bm25_tantivy=ret.get("use_bm25_tantivy", cfg.rag.use_bm25_tantivy),
            use_dense_vector=ret.get("use_dense_vector", cfg.rag.use_dense_vector),
            default_backend=srv.get("default_backend", cfg.rag.default_backend),
            gemini_model=srv.get("gemini_model", cfg.rag.gemini_model),
            temperature=float(srv.get("temperature", cfg.rag.temperature)),
            strict_citation_verification=srv.get("strict_citation_verification", cfg.rag.strict_citation_verification),
        )

    # 7. Logging
    log_sec = data.get("logging", {})
    if log_sec:
        cfg.logging = LoggingConfig(
            root_dir=log_sec.get("root_dir", cfg.logging.root_dir),
            level=log_sec.get("level", cfg.logging.level),
            rotation_max_bytes=int(log_sec.get("rotation_max_bytes", cfg.logging.rotation_max_bytes)),
            backup_count=int(log_sec.get("backup_count", cfg.logging.backup_count)),
            audit_file=log_sec.get("audit_file", cfg.logging.audit_file),
        )

    return cfg
