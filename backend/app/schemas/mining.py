from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class EdaOverview(BaseModel):
    total_papers: int
    enriched_html_papers: int
    enrichment_ratio: float
    total_math_formulas: int
    total_words: int
    avg_sections_per_paper: float
    avg_math_per_paper: float
    avg_words_per_paper: float
    earliest_publication: str
    latest_publication: str


class CategoryDistItem(BaseModel):
    category: str
    count: int
    percentage: float
    total_math_formulas: int
    avg_words: float


class TemporalDistItem(BaseModel):
    period: str
    count: int


class TopAuthorItem(BaseModel):
    author: str
    paper_count: int


class CategoryCooccurItem(BaseModel):
    category_a: str
    category_b: str
    cooccurrence_count: int


class EdaResponse(BaseModel):
    dataset_overview: EdaOverview
    category_distribution: List[CategoryDistItem]
    temporal_distribution: List[TemporalDistItem]
    math_and_content_stats: Dict[str, Any]
    top_authors: List[TopAuthorItem]
    category_cooccurrence: List[CategoryCooccurItem]


class AssociationRuleItem(BaseModel):
    antecedents: List[str]
    consequents: List[str]
    support: float
    confidence: float
    lift: float
    leverage: float
    conviction: float


class AssociationRulesResponse(BaseModel):
    summary: Dict[str, Any]
    frequent_itemsets: List[Dict[str, Any]]
    rules: List[AssociationRuleItem]


class ClusterProfileItem(BaseModel):
    cluster_id: int
    size: int
    percentage: float
    dominant_categories: List[Dict[str, Any]]
    sample_titles: List[str]


class ScatterPointItem(BaseModel):
    x: float
    y: float
    cluster: int
    category: str
    title: str
    paper_id: str


class ClustersResponse(BaseModel):
    summary: Dict[str, Any]
    validity_metrics: Dict[str, float]
    cluster_profiles: List[ClusterProfileItem]
    scatter_2d: List[ScatterPointItem]


class GraphNodeItem(BaseModel):
    id: str
    label: str
    pagerank: float
    degree: int
    community: int
    paper_count: int


class GraphLinkItem(BaseModel):
    source: str
    target: str
    weight: int


class GraphResponse(BaseModel):
    network_summary: Dict[str, Any]
    top_influencers: List[Dict[str, Any]]
    communities: List[Dict[str, Any]]
    graph_export: Dict[str, Any]


class AnomalyItem(BaseModel):
    paper_id: str
    title: str
    primary_category: str
    anomaly_score: float
    math_count: int
    word_count: int
    author_count: int
    category_count: int
    outlier_reasons: List[str]


class TrendVelocityItem(BaseModel):
    category: str
    recent_quarter_papers: int
    previous_quarter_papers: int
    growth_rate_pct: float
    momentum: str
    all_time_papers: int


class TrendsResponse(BaseModel):
    summary: Dict[str, Any]
    anomalies: List[AnomalyItem]
    trend_velocity: List[TrendVelocityItem]
