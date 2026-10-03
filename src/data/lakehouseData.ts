import type { ReactNode } from 'react';

// ==========================================
// 1. SCHEMATIC DIAGRAM NODES
// ==========================================
export interface DiagramNode {
  id: string;
  code: string;
  name: string;
  zone: 'HARVEST' | 'BRONZE' | 'COMPUTE' | 'SILVER' | 'EMBED' | 'GOLD' | 'INFERENCE' | 'CLIENT';
  zoneColor: string;
  toolName: string;
  toolCategory: string;
  metricLabel: string;
  metricValue: string;
  secondaryMetric: string;
  status: 'ONLINE' | 'SYNCED' | 'ACTIVE';
  iconType: 'arxiv' | 'r2' | 'duckdb' | 'parquet' | 'nomic' | 'lancedb' | 'qwen' | 'terminal';
  specList: string[];
}

export const SCHEMATIC_NODES: DiagramNode[] = [
  {
    id: 'node-harvest',
    code: '01/INGEST',
    name: 'arXiv OAI-PMH & ar5iv',
    zone: 'HARVEST',
    zoneColor: '#ef4444',
    toolName: 'arXiv Harvester',
    toolCategory: 'Source Stream',
    metricLabel: 'TOTAL HARVESTED',
    metricValue: '10,000 Papers',
    secondaryMetric: 'cs.AI, cs.LG, cs.CV, cs.CL, stat.ML',
    status: 'SYNCED',
    iconType: 'arxiv',
    specList: ['OAI-PMH XML v2.0', 'HTML5 Full-Text Crawler', '6.0s Rate Limiter']
  },
  {
    id: 'node-bronze',
    code: '02/LAKE',
    name: 'Cloudflare R2 Bronze Lake',
    zone: 'BRONZE',
    zoneColor: '#f59e0b',
    toolName: 'Cloudflare R2',
    toolCategory: 'Immutable Raw Store',
    metricLabel: 'RAW STORED',
    metricValue: '2.841 GB',
    secondaryMetric: '9,022 HTML5 + 12 Batches',
    status: 'ONLINE',
    iconType: 'r2',
    specList: ['S3 Compatible API', 'Zero Egress Fees', 'SHA-256 Checksummed']
  },
  {
    id: 'node-duckdb',
    code: '03/TRANSFORM',
    name: 'DuckDB & LaTeX Parser',
    zone: 'COMPUTE',
    zoneColor: '#fde047',
    toolName: 'DuckDB Engine',
    toolCategory: 'In-Process OLAP',
    metricLabel: 'LATEX EXTRACTED',
    metricValue: '2,224,198',
    secondaryMetric: '8,989 Full-Section Enriched',
    status: 'ACTIVE',
    iconType: 'duckdb',
    specList: ['Vectorized SIMD Execution', 'Zero-Copy Apache Arrow', 'Math Tag Normalizer']
  },
  {
    id: 'node-silver',
    code: '04/CURATED',
    name: 'Apache Parquet Partition',
    zone: 'SILVER',
    zoneColor: '#60a5fa',
    toolName: 'Apache Parquet',
    toolCategory: 'Columnar Store',
    metricLabel: 'CURATED TABLE',
    metricValue: '231.73 MB',
    secondaryMetric: 'Partition: year=2026',
    status: 'SYNCED',
    iconType: 'parquet',
    specList: ['Snappy Compression', 'Nested Schema Dict', 'Canonical Section Taxonomy']
  },
  {
    id: 'node-nomic',
    code: '05/EMBED',
    name: 'Nomic Embed v1.5 (MPS)',
    zone: 'EMBED',
    zoneColor: '#34d399',
    toolName: 'Nomic AI',
    toolCategory: 'Embedding Core',
    metricLabel: 'DENSE DIMENSION',
    metricValue: '768 Dimensions',
    secondaryMetric: '8,192 Token Context Window',
    status: 'ACTIVE',
    iconType: 'nomic',
    specList: ['Apple Silicon MPS (Metal)', 'Matryoshka 2D Normalizer', 'search_document: prefix']
  },
  {
    id: 'node-gold',
    code: '06/VECTOR',
    name: 'LanceDB Gold Vector Lake',
    zone: 'GOLD',
    zoneColor: '#fbbf24',
    toolName: 'LanceDB',
    toolCategory: 'Vector Lakehouse',
    metricLabel: 'INDEXED CHUNKS',
    metricValue: '143,523 Rows',
    secondaryMetric: '2.456 GB Table Size',
    status: 'ONLINE',
    iconType: 'lancedb',
    specList: ['Lance Columnar Format', 'Cosine Metric ANN Index', 'Sub-50ms Approximate Lookup']
  },
  {
    id: 'node-qwen',
    code: '07/REASON',
    name: 'Qwen 2.5 7B Instruct (GGUF)',
    zone: 'INFERENCE',
    zoneColor: '#a855f7',
    toolName: 'Qwen 2.5 / llama.cpp',
    toolCategory: 'Local Neural Core',
    metricLabel: 'OFFLOAD ENGINE',
    metricValue: 'Apple Metal GPU',
    secondaryMetric: '4.4 GB (Q4_K_M Quant)',
    status: 'ACTIVE',
    iconType: 'qwen',
    specList: ['llama-cpp-python Binding', 'Zero Hallucination Gate', '~6.0 tokens/s Generation']
  },
  {
    id: 'node-client',
    code: '08/OUTPUT',
    name: 'Grounded Academic Response',
    zone: 'CLIENT',
    zoneColor: '#38bdf8',
    toolName: 'Verified Citations',
    toolCategory: 'Scientific Output',
    metricLabel: 'CITATION ACCURACY',
    metricValue: '100% Grounded',
    secondaryMetric: '[Paper: ID, Section: Title]',
    status: 'ONLINE',
    iconType: 'terminal',
    specList: ['Exact LaTeX Retention', 'Refusal Gate on Missing Context', 'Dual-Stream Logging']
  }
];

// ==========================================
// 2. SEQUENTIAL PIPELINE PHASES
// ==========================================
export interface PipelinePhase {
  id: string;
  phaseNumber: string;
  name: string;
  zone: 'BRONZE' | 'SILVER' | 'GOLD' | 'INFERENCE';
  zoneColor: string;
  status: 'COMPLETED' | 'STANDBY' | 'SYNCED' | 'OPERATIONAL';
  inputs: string[];
  outputs: string[];
  tools: string[];
  metrics: {
    processed: string;
    rate: string;
    latency: string;
  };
  details: string;
}

export const PIPELINE_PHASES: PipelinePhase[] = [
  {
    id: 'phase-1',
    phaseNumber: '01',
    name: 'arXiv Harvest & Bronze Ingestion',
    zone: 'BRONZE',
    zoneColor: 'var(--accent-bronze)',
    status: 'COMPLETED',
    inputs: ['arXiv OAI-PMH Endpoints', 'ar5iv HTML5 Repository'],
    outputs: ['9,022 Raw HTML5 Files', '12 OAI Batch JSONs (20.8MB)'],
    tools: ['HTTPX Async', 'Cloudflare R2 S3 API', 'SHA-256 Hasher'],
    metrics: {
      processed: '10,000 Papers Harvested',
      rate: '6.0s Rate-Limit Delay',
      latency: '2.84 GB Transferred'
    },
    details: 'Harvests metadata via OAI-PMH XML protocol across cs.AI, cs.LG, cs.CV, cs.CL, stat.ML. Immutably streams raw paper HTML5 and batch records directly into Cloudflare R2 Bronze Lakehouse.'
  },
  {
    id: 'phase-2',
    phaseNumber: '02',
    name: 'Silver Transformation & LaTeX Mining',
    zone: 'SILVER',
    zoneColor: 'var(--accent-silver)',
    status: 'COMPLETED',
    inputs: ['Raw Bronze HTML5 & OAI Batches'],
    outputs: ['Apache Parquet (year=2026)', 'DuckDB Canonical View'],
    tools: ['BeautifulSoup4 & lxml', 'Apache Arrow', 'DuckDB Engine'],
    metrics: {
      processed: '8,989 Papers Full-Section Enriched',
      rate: '2,224,198 LaTeX Formulas Extracted',
      latency: '231.7 MB Columnar Storage'
    },
    details: 'Parses academic structures into canonical sections (Abstract, Intro, Methods, Results, Discussion). Cleans and preserves 2.22M mathematical equations in pristine LaTeX syntax.'
  },
  {
    id: 'phase-3',
    phaseNumber: '03',
    name: 'Gold Contextual Indexing & LanceDB',
    zone: 'GOLD',
    zoneColor: 'var(--accent-gold)',
    status: 'SYNCED',
    inputs: ['Silver Canonical Parquet Records'],
    outputs: ['LanceDB Table (scientific_papers_gold)', 'R2 Gold Sync Archive'],
    tools: ['Nomic-embed-text-v1.5', 'Apple Silicon MPS GPU', 'LanceDB Vector Store'],
    metrics: {
      processed: '143,523 Contextual Chunks',
      rate: '768-dim Dense Vectors',
      latency: '2.456 GB Indexed Table'
    },
    details: 'Segments long-form papers with context preservation (Paper Title | Section Title | Content). Generates 768-dimensional normalized embeddings on Apple Silicon GPU and syncs index to R2.'
  },
  {
    id: 'phase-4',
    phaseNumber: '04',
    name: 'Hardware-Accelerated RAG Serving',
    zone: 'INFERENCE',
    zoneColor: 'var(--accent-emerald)',
    status: 'OPERATIONAL',
    inputs: ['User Natural Language Query', 'Top-K LanceDB ANN Context'],
    outputs: ['Strictly Grounded Academic Synthesis', 'Formal Paper & Section Citations'],
    tools: ['Qwen2.5-7B-Instruct (GGUF)', 'llama.cpp Metal Offload', 'Academic Prompt Gate'],
    metrics: {
      processed: 'Sub-50ms LanceDB ANN Lookup',
      rate: '6.0 tokens/s Metal GPU Generation',
      latency: 'Zero Hallucination Refusal Gate'
    },
    details: 'Runs high-precision cosine semantic search over 143k vectors, formats academic system prompts with anti-hallucination guardrails, and produces streaming answers with verified section citations.'
  }
];

// ==========================================
// 3. STORAGE INSPECTOR PARTITIONS
// ==========================================
export interface LakehouseLayer {
  zone: 'BRONZE' | 'SILVER' | 'GOLD';
  name: string;
  storageType: string;
  format: string;
  itemsCount: string;
  sizeBytes: string;
  r2Location: string;
  color: string;
  description: string;
}

export const LAYERS: LakehouseLayer[] = [
  {
    zone: 'BRONZE',
    name: 'Raw arXiv HTML5 Papers',
    storageType: 'Cloudflare R2 Object Store',
    format: 'W3C HTML5 (.html)',
    itemsCount: '9,022 files',
    sizeBytes: '2.821 GB',
    r2Location: 's3://uth-scientific-lakehouse/bronze/html/year=2026/',
    color: 'var(--accent-bronze)',
    description: 'Raw web-crawled HTML5 documents from ar5iv containing full sections, tables, math tags, and bibliography.'
  },
  {
    zone: 'BRONZE',
    name: 'OAI-PMH Harvest Batches',
    storageType: 'Cloudflare R2 Object Store',
    format: 'Compressed JSON Bundles',
    itemsCount: '12 batch bundles',
    sizeBytes: '20.83 MB',
    r2Location: 's3://uth-scientific-lakehouse/bronze/oai_batches/',
    color: 'var(--accent-bronze)',
    description: 'Raw metadata harvesting batches retrieved through arXiv OAI-PMH protocol across 5 core AI/DS categories.'
  },
  {
    zone: 'SILVER',
    name: 'Curated Canonical Papers',
    storageType: 'Local Disk & Cloudflare R2',
    format: 'Apache Parquet (Snappy)',
    itemsCount: '10,000 papers (8,989 enriched)',
    sizeBytes: '231.73 MB',
    r2Location: 's3://uth-scientific-lakehouse/silver/year=2026/papers.parquet',
    color: 'var(--accent-silver)',
    description: 'Cleaned and structured schema containing parsed sections, abstracts, authors, and 2.22M extracted LaTeX formulas.'
  },
  {
    zone: 'GOLD',
    name: 'Contextual Vector Lakehouse',
    storageType: 'LanceDB Multi-Modal Table',
    format: 'Lance Columnar (.lance)',
    itemsCount: '143,523 chunks',
    sizeBytes: '2.456 GB',
    r2Location: 's3://uth-scientific-lakehouse/gold/lancedb/',
    color: 'var(--accent-gold)',
    description: 'Semantically contextualized chunks paired with 768-dimensional Nomic embeddings for sub-50ms cosine ANN search.'
  }
];

// ==========================================
// 4. PLATFORM TOOLS & ENGINES
// ==========================================
export interface ToolItem {
  id: string;
  name: string;
  category: 'Storage' | 'Compute' | 'Vector DB' | 'Model & Engine' | 'Data Source';
  role: string;
  spec: string;
  status: 'Operational' | 'Active' | 'Synced';
  icon?: ReactNode;
  license: string;
  protocol: string;
  architectureTier: string;
  description: string;
}

// ==========================================
// 5. LIVE TELEMETRY LOG ENTRIES
// ==========================================
export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'STORAGE' | 'QUERY';
  phase: 'INGEST' | 'ENRICH' | 'GOLD' | 'RAG' | 'R2';
  source: string;
  message: string;
  detail?: string;
}

export const TELEMETRY_ENTRIES: LogEntry[] = [
  {
    id: 'log-01',
    timestamp: '2026-10-03 13:41:55.104',
    level: 'SUCCESS',
    phase: 'RAG',
    source: 'src/rag/rag_engine.py:78',
    message: '[ANSWER] Grounded synthesis completed in 18.51s (5.9 words/s) citing [Paper: 2310.01407, Section: 5 Experiments]',
    detail: 'Latency: 18.51s · Context Token Count: 1,840 · Generation Tokens: 124 · Refusal Gate: PASSED'
  },
  {
    id: 'log-02',
    timestamp: '2026-10-03 13:41:37.420',
    level: 'QUERY',
    phase: 'RAG',
    source: 'src/indexing/lancedb_manager.py:72',
    message: '[RETRIEVE] LanceDB Cosine ANN returned 3 chunks (Top Sim: 0.8510) for query: "sampling z_t in CoDi"',
    detail: 'Query Vector: 768d · Table: scientific_papers_gold.lance · Distance Metric: Cosine · Duration: 38ms'
  },
  {
    id: 'log-03',
    timestamp: '2026-10-03 13:38:42.012',
    level: 'INFO',
    phase: 'RAG',
    source: 'src/rag/llm_client.py:45',
    message: '[LLM] Qwen2.5-7B-Instruct (GGUF Q4_K_M) loaded into Apple Silicon Metal GPU memory (n_ctx=4096)',
    detail: 'Model Path: models/qwen2.5-7b-instruct-q4_k_m/qwen2.5-7b-instruct-q4_k_m.gguf · GPU Layers: -1 (All 28 Layers)'
  },
  {
    id: 'log-04',
    timestamp: '2026-10-03 06:30:14.882',
    level: 'SUCCESS',
    phase: 'R2',
    source: 'src/storage/r2_client.py:118',
    message: '[STORAGE] Cloudflare R2 lakehouse synchronized: 5.524 GB across Bronze, Silver, and Gold zones',
    detail: 'Remote Destination: s3://uth-scientific-lakehouse/ · Egress: 0.00 USD · Integrity: SHA-256 Validated'
  },
  {
    id: 'log-05',
    timestamp: '2026-10-03 06:29:48.330',
    level: 'SUCCESS',
    phase: 'GOLD',
    source: 'src/indexing/lancedb_manager.py:48',
    message: '[GOLD] 143,523 chunks indexed into LanceDB table scientific_papers_gold (768-dim embeddings)',
    detail: 'Source: Silver Parquet · Embedder: Nomic-embed-text-v1.5 · Hardware: Apple Silicon MPS · Batches: 17,940'
  },
  {
    id: 'log-06',
    timestamp: '2026-10-03 05:14:20.155',
    level: 'INFO',
    phase: 'ENRICH',
    source: 'src/transformation/html_parser.py:92',
    message: '[SILVER] 8,989 HTML5 papers enriched with full sections and 2,224,198 LaTeX formulas saved to Parquet',
    detail: 'Output: data/silver/year=2026/papers.parquet · DuckDB Row Count: 10,000 · Schema: Canonical v2'
  },
  {
    id: 'log-07',
    timestamp: '2026-10-03 03:10:00.004',
    level: 'INFO',
    phase: 'INGEST',
    source: 'src/ingestion/arxiv_batch_harvester.py:144',
    message: '[BRONZE] 10,000 papers harvested from arXiv OAI-PMH across categories: cs.AI, cs.LG, cs.CV, cs.CL, stat.ML',
    detail: 'Resumption Tokens Handled: 12 · Batches Dumped: bronze/oai_batches/ · Delay: 6.0s polite window'
  }
];
