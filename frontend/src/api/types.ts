/**
 * TypeScript Data Models for UTH Scientific Data Mining & Real-Time RAG Dashboard.
 */

export interface EdaOverview {
  total_papers: number;
  enriched_html_papers: number;
  enrichment_ratio: number;
  total_math_formulas: number;
  total_words: number;
  avg_sections_per_paper: number;
  avg_math_per_paper: number;
  avg_words_per_paper: number;
  earliest_publication: string;
  latest_publication: string;
}

export interface CategoryDistItem {
  category: string;
  count: number;
  percentage: number;
  total_math_formulas: number;
  avg_words: number;
}

export interface TemporalDistItem {
  period: string;
  count: number;
}

export interface TopAuthorItem {
  author: string;
  paper_count: number;
}

export interface CategoryCooccurItem {
  category_a: string;
  category_b: string;
  cooccurrence_count: number;
}

export interface EdaResponse {
  dataset_overview: EdaOverview;
  category_distribution: CategoryDistItem[];
  temporal_distribution: TemporalDistItem[];
  math_and_content_stats: {
    math_quantiles: {
      p25: number;
      median: number;
      p75: number;
      p95: number;
      max: number;
    };
    word_quantiles: {
      p25: number;
      median: number;
      p75: number;
      p95: number;
      max: number;
    };
  };
  top_authors: TopAuthorItem[];
  category_cooccurrence: CategoryCooccurItem[];
}

export interface AssociationRuleItem {
  antecedents: string[];
  consequents: string[];
  support: number;
  confidence: number;
  lift: number;
  leverage: number;
  conviction: number;
}

export interface AssociationRulesResponse {
  summary: {
    total_transactions: number;
    total_unique_items: number;
    frequent_itemsets_count: number;
    mined_rules_count: number;
    min_support_used: number;
    min_lift_threshold: number;
  };
  frequent_itemsets: Array<{ itemset: string[]; support: number }>;
  rules: AssociationRuleItem[];
}

export interface ClusterProfileItem {
  cluster_id: number;
  size: number;
  percentage: number;
  dominant_categories: Array<{ category: string; count: number }>;
  sample_titles: string[];
}

export interface ScatterPointItem {
  x: number;
  y: number;
  cluster: number;
  category: string;
  title: string;
  paper_id: string;
}

export interface ClustersResponse {
  summary: {
    sample_analyzed: number;
    vector_dimensions: number;
    optimal_k: number;
    dbscan_clusters_found: number;
    dbscan_noise_ratio: number;
  };
  validity_metrics: {
    silhouette_score: number;
    davies_bouldin_index: number;
    calinski_harabasz_index: number;
  };
  cluster_profiles: ClusterProfileItem[];
  scatter_2d: ScatterPointItem[];
}

export interface GraphNodeItem {
  id: string;
  label: string;
  pagerank: number;
  degree: number;
  community: number;
  paper_count: number;
}

export interface GraphLinkItem {
  source: string;
  target: string;
  weight: number;
}

export interface GraphResponse {
  network_summary: {
    total_authors: number;
    total_collaborations: number;
    network_density: number;
    connected_components: number;
    total_communities_detected: number;
  };
  top_influencers: Array<{
    author: string;
    pagerank: number;
    degree: number;
    paper_count: number;
    community_id: number;
  }>;
  communities: Array<{
    community_id: number;
    total_members: number;
    representative_authors: string[];
  }>;
  graph_export: {
    nodes: GraphNodeItem[];
    links: GraphLinkItem[];
  };
}

export interface AnomalyItem {
  paper_id: string;
  title: string;
  primary_category: string;
  anomaly_score: number;
  math_count: number;
  word_count: number;
  author_count: number;
  category_count: number;
  outlier_reasons: string[];
}

export interface TrendVelocityItem {
  category: string;
  recent_quarter_papers: number;
  previous_quarter_papers: number;
  growth_rate_pct: number;
  momentum: 'ACCELERATING' | 'STEADY' | 'COOLING';
  all_time_papers: number;
}

export interface TrendsResponse {
  summary: {
    total_papers_analyzed: number;
    total_anomalies_detected: number;
    anomaly_rate: number;
    tracked_categories_velocity: number;
  };
  anomalies: AnomalyItem[];
  trend_velocity: TrendVelocityItem[];
}

export interface StorageStatsResponse {
  bucket: string;
  status: string;
  total_objects: number;
  total_size_bytes: number;
  total_size_gb: number;
  free_tier_quota_gb: number;
  used_percentage: number;
  zones: {
    bronzeCount: number;
    bronzeSizeBytes: number;
    silverTables: string[];
    silverSizeBytes: number;
    goldTables: string[];
    goldChunkCount: number;
    goldSizeBytes: number;
  };
  remoteIndicesReady: boolean;
}

export interface ChatResponse {
  query: string;
  answer: string;
  citations: string[];
  similarity_score: string;
  generation_time: string;
  context_chunks_used: number;
}
