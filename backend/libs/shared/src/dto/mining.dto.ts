import { ApiProperty } from '@nestjs/swagger';

export class EdaOverviewDto {
  @ApiProperty({ example: 10000 })
  total_papers: number;

  @ApiProperty({ example: 8989 })
  enriched_html_papers: number;

  @ApiProperty({ example: 0.8989 })
  enrichment_ratio: number;

  @ApiProperty({ example: 2224198 })
  total_math_formulas: number;

  @ApiProperty({ example: 18450123 })
  total_words: number;

  @ApiProperty({ example: 8.45 })
  avg_sections_per_paper: number;

  @ApiProperty({ example: 222.42 })
  avg_math_per_paper: number;

  @ApiProperty({ example: 1845.01 })
  avg_words_per_paper: number;

  @ApiProperty({ example: '2026-01-01' })
  earliest_publication: string;

  @ApiProperty({ example: '2026-10-02' })
  latest_publication: string;
}

export class CategoryDistributionDto {
  @ApiProperty({ example: 'cs.AI' })
  category: string;

  @ApiProperty({ example: 3420 })
  count: number;

  @ApiProperty({ example: 34.2 })
  percentage: number;

  @ApiProperty({ example: 450123 })
  total_math_formulas: number;

  @ApiProperty({ example: 2100.5 })
  avg_words: number;
}

export class TemporalPointDto {
  @ApiProperty({ example: '2026-03' })
  period: string;

  @ApiProperty({ example: 1250 })
  count: number;
}

export class TopAuthorDto {
  @ApiProperty({ example: 'Yang Liu' })
  author: string;

  @ApiProperty({ example: 38 })
  paper_count: number;
}

export class CategoryCooccurrenceDto {
  @ApiProperty({ example: 'cs.AI' })
  category_a: string;

  @ApiProperty({ example: 'cs.LG' })
  category_b: string;

  @ApiProperty({ example: 1521 })
  cooccurrence_count: number;
}

export class EdaResponseDto {
  @ApiProperty({ type: EdaOverviewDto })
  dataset_overview: EdaOverviewDto;

  @ApiProperty({ type: [CategoryDistributionDto] })
  category_distribution: CategoryDistributionDto[];

  @ApiProperty({ type: [TemporalPointDto] })
  temporal_distribution: TemporalPointDto[];

  @ApiProperty({ type: Object })
  math_and_content_stats: Record<string, any>;

  @ApiProperty({ type: [TopAuthorDto] })
  top_authors: TopAuthorDto[];

  @ApiProperty({ type: [CategoryCooccurrenceDto] })
  category_cooccurrence: CategoryCooccurrenceDto[];
}

export class AssociationRuleDto {
  @ApiProperty({ example: ['cat:cs.AI', 'cat:cs.CL'] })
  antecedents: string[];

  @ApiProperty({ example: ['cat:cs.LG'] })
  consequents: string[];

  @ApiProperty({ example: 0.0786 })
  support: number;

  @ApiProperty({ example: 0.654 })
  confidence: number;

  @ApiProperty({ example: 1.842 })
  lift: number;

  @ApiProperty({ example: 0.0359 })
  leverage: number;

  @ApiProperty({ example: 1.87 })
  conviction: number;
}

export class AssociationRulesResponseDto {
  @ApiProperty({ type: Object })
  summary: Record<string, any>;

  @ApiProperty({ type: [Object] })
  frequent_itemsets: Array<{ itemset: string[]; support: number }>;

  @ApiProperty({ type: [AssociationRuleDto] })
  rules: AssociationRuleDto[];
}

export class ClusterProfileDto {
  @ApiProperty({ example: 0 })
  cluster_id: number;

  @ApiProperty({ example: 850 })
  size: number;

  @ApiProperty({ example: 17.0 })
  percentage: number;

  @ApiProperty({ type: [Object] })
  dominant_categories: Array<{ category: string; count: number }>;

  @ApiProperty({ type: [String] })
  sample_titles: string[];
}

export class ClusterScatterPointDto {
  @ApiProperty({ example: 0.1245 })
  x: number;

  @ApiProperty({ example: -0.4512 })
  y: number;

  @ApiProperty({ example: 1 })
  cluster: number;

  @ApiProperty({ example: 'cs.CV' })
  category: string;

  @ApiProperty({ example: 'High-Resolution Diffusion Models...' })
  title: string;

  @ApiProperty({ example: '2401.12345' })
  paper_id: string;
}

export class ClustersResponseDto {
  @ApiProperty({ type: Object })
  summary: Record<string, any>;

  @ApiProperty({ type: Object })
  validity_metrics: {
    silhouette_score: number;
    davies_bouldin_index: number;
    calinski_harabasz_index: number;
  };

  @ApiProperty({ type: [ClusterProfileDto] })
  cluster_profiles: ClusterProfileDto[];

  @ApiProperty({ type: [ClusterScatterPointDto] })
  scatter_2d: ClusterScatterPointDto[];
}

export class GraphNodeDto {
  @ApiProperty({ example: 'Yang Liu' })
  id: string;

  @ApiProperty({ example: 'Yang Liu' })
  label: string;

  @ApiProperty({ example: 0.00412 })
  pagerank: number;

  @ApiProperty({ example: 15 })
  degree: number;

  @ApiProperty({ example: 2 })
  community: number;

  @ApiProperty({ example: 38 })
  paper_count: number;
}

export class GraphLinkDto {
  @ApiProperty({ example: 'Yang Liu' })
  source: string;

  @ApiProperty({ example: 'Hao Chen' })
  target: string;

  @ApiProperty({ example: 4 })
  weight: number;
}

export class GraphResponseDto {
  @ApiProperty({ type: Object })
  network_summary: {
    total_authors: number;
    total_collaborations: number;
    network_density: number;
    connected_components: number;
    total_communities_detected: number;
  };

  @ApiProperty({ type: [Object] })
  top_influencers: Array<{
    author: string;
    pagerank: number;
    degree: number;
    paper_count: number;
    community_id: number;
  }>;

  @ApiProperty({ type: [Object] })
  communities: Array<{
    community_id: number;
    total_members: number;
    representative_authors: string[];
  }>;

  @ApiProperty({ type: Object })
  graph_export: {
    nodes: GraphNodeDto[];
    links: GraphLinkDto[];
  };
}

export class AnomalyPaperDto {
  @ApiProperty({ example: '2310.01234' })
  paper_id: string;

  @ApiProperty({ example: 'Quantum Neural Network Complexity Bounds' })
  title: string;

  @ApiProperty({ example: 'quant-ph' })
  primary_category: string;

  @ApiProperty({ example: -0.6512 })
  anomaly_score: number;

  @ApiProperty({ example: 1250 })
  math_count: number;

  @ApiProperty({ example: 31000 })
  word_count: number;

  @ApiProperty({ example: 18 })
  author_count: number;

  @ApiProperty({ example: 5 })
  category_count: number;

  @ApiProperty({ example: ['Extreme theoretical math density (1250 formulas)'] })
  outlier_reasons: string[];
}

export class TrendVelocityDto {
  @ApiProperty({ example: 'cs.AI' })
  category: string;

  @ApiProperty({ example: 1120 })
  recent_quarter_papers: number;

  @ApiProperty({ example: 920 })
  previous_quarter_papers: number;

  @ApiProperty({ example: 21.7 })
  growth_rate_pct: number;

  @ApiProperty({ example: 'ACCELERATING' })
  momentum: string;

  @ApiProperty({ example: 3420 })
  all_time_papers: number;
}

export class TrendsResponseDto {
  @ApiProperty({ type: Object })
  summary: {
    total_papers_analyzed: number;
    total_anomalies_detected: number;
    anomaly_rate: number;
    tracked_categories_velocity: number;
  };

  @ApiProperty({ type: [AnomalyPaperDto] })
  anomalies: AnomalyPaperDto[];

  @ApiProperty({ type: [TrendVelocityDto] })
  trend_velocity: TrendVelocityDto[];
}
