import { useState } from 'react';

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

export function LiveTelemetryFeed() {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>('log-01');

  const filteredLogs = TELEMETRY_ENTRIES.filter(log => {
    if (filterLevel !== 'ALL' && log.level !== filterLevel) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return log.message.toLowerCase().includes(q) ||
             log.source.toLowerCase().includes(q) ||
             log.phase.toLowerCase().includes(q);
    }
    return true;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'SUCCESS': return 'var(--accent-emerald)';
      case 'QUERY': return 'var(--accent-silver)';
      case 'STORAGE': return 'var(--accent-bronze)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div style={{
      width: '100%',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--card-shadow)',
      padding: '24px',
      position: 'relative'
    }}>
      {/* Expanded Terminal Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'var(--accent-emerald)',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.6)'
            }} />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              Pipeline Telemetry & Execution Log Stream
            </h3>
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              padding: '2px 8px',
              borderRadius: '4px',
              color: 'var(--text-secondary)'
            }}>
              LIVE REPLAY
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            SOURCE AUDIT: logs/master_pipeline_20261003.log & logs/rag_query_20261003.log
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Level Filter Chips */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            padding: '2px'
          }}>
            {['ALL', 'SUCCESS', 'QUERY', 'STORAGE', 'INFO'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                style={{
                  background: filterLevel === lvl ? 'var(--bg-surface-elevated)' : 'transparent',
                  border: filterLevel === lvl ? '1px solid var(--border-muted)' : 'none',
                  color: filterLevel === lvl ? 'var(--text-primary)' : 'var(--text-muted)',
                  padding: '4px 10px',
                  borderRadius: '3px',
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Quick Search Input */}
          <input
            type="text"
            placeholder="Search telemetry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)',
              outline: 'none',
              width: '180px'
            }}
          />
        </div>
      </div>

      {/* Expanded Terminal Log Table (Full-Width, Spacious Layout) */}
      <div style={{
        background: 'var(--bg-canvas)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden'
      }}>
        {/* Table Subheader */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '190px 100px 180px 1fr 40px',
          gap: '12px',
          padding: '10px 16px',
          background: 'var(--bg-surface-elevated)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em'
        }}>
          <div>Timestamp (UTC+7)</div>
          <div>Level / Phase</div>
          <div>Source File</div>
          <div>Pipeline Event Message</div>
          <div style={{ textAlign: 'right' }}>Info</div>
        </div>

        {/* Rows */}
        <div style={{
          maxHeight: '480px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {filteredLogs.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              No telemetry entries match the filter criteria.
            </div>
          ) : (
            filteredLogs.map((entry) => {
              const isExpanded = expandedLogId === entry.id;
              return (
                <div
                  key={entry.id}
                  onClick={() => setExpandedLogId(isExpanded ? null : entry.id)}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: isExpanded ? 'var(--bg-surface-hover)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '190px 100px 180px 1fr 40px',
                    gap: '12px',
                    padding: '12px 16px',
                    alignItems: 'center',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {/* Timestamp */}
                    <div style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>
                      {entry.timestamp}
                    </div>

                    {/* Level / Phase Badge */}
                    <div>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '10px',
                        fontWeight: 700,
                        background: 'var(--bg-surface)',
                        color: getLevelColor(entry.level),
                        border: '1px solid var(--border-subtle)'
                      }}>
                        [{entry.phase}]
                      </span>
                    </div>

                    {/* Source File */}
                    <div style={{
                      color: 'var(--text-secondary)',
                      fontSize: '11px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {entry.source}
                    </div>

                    {/* Event Message */}
                    <div style={{
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      wordBreak: 'break-word',
                      lineHeight: 1.4
                    }}>
                      {entry.message}
                    </div>

                    {/* Expand Indicator */}
                    <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '11px' }}>
                      {isExpanded ? '▼' : '▶'}
                    </div>
                  </div>

                  {/* Expanded Detail Box */}
                  {isExpanded && entry.detail && (
                    <div style={{
                      padding: '10px 16px 14px 16px',
                      background: 'var(--bg-surface-elevated)',
                      borderTop: '1px dashed var(--border-subtle)',
                      fontSize: '11.5px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--accent-silver)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ color: 'var(--text-muted)' }}>METADATA:</span>
                      {entry.detail}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Status Bar */}
      <div style={{
        marginTop: '14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-muted)'
      }}>
        <span>SHOWING {filteredLogs.length} OF {TELEMETRY_ENTRIES.length} EVENTS</span>
        <span>DOUBLE-BUFFERED TERMINAL STREAM // 0 ERRORS REPORTED</span>
      </div>
    </div>
  );
}
