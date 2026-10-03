import { useState } from 'react';

export interface LogLine {
  id: string;
  time: string;
  level: 'SUCCESS' | 'INFO' | 'QUERY' | 'STORAGE' | 'START';
  tag: string;
  message: string;
}

export const PIPELINE_LOGS: LogLine[] = [
  {
    id: 'l-01',
    time: '2026-10-03 13:41:55',
    level: 'SUCCESS',
    tag: 'RAG/ANSWER',
    message: 'Grounded synthesis completed in 18.51s (5.9 words/s) citing [Paper: 2310.01407, Section: 5 Experiments]'
  },
  {
    id: 'l-02',
    time: '2026-10-03 13:41:37',
    level: 'QUERY',
    tag: 'RAG/RETRIEVE',
    message: 'LanceDB Cosine ANN returned 3 chunks (Top Sim: 0.8510) for query: "sampling z_t in CoDi"'
  },
  {
    id: 'l-03',
    time: '2026-10-03 13:41:35',
    level: 'INFO',
    tag: 'RAG/EMBED',
    message: 'Query vectorized via nomic-embed-text-v1.5: 768 dimensions in 18.2ms'
  },
  {
    id: 'l-04',
    time: '2026-10-03 13:38:42',
    level: 'INFO',
    tag: 'LLM/INIT',
    message: 'Qwen2.5-7B-Instruct (GGUF Q4_K_M) loaded into Apple Silicon Metal GPU memory (n_ctx=4096, n_gpu_layers=28)'
  },
  {
    id: 'l-05',
    time: '2026-10-03 06:30:14',
    level: 'STORAGE',
    tag: 'R2/SYNC',
    message: 'Cloudflare R2 lakehouse synchronized: 5.524 GB total across Bronze (2.84 GB), Silver (231.7 MB), Gold (2.45 GB)'
  },
  {
    id: 'l-06',
    time: '2026-10-03 06:29:48',
    level: 'SUCCESS',
    tag: 'GOLD/INDEX',
    message: '143,523 chunks indexed into LanceDB table scientific_papers_gold (768-dim embeddings, Cosine ANN)'
  },
  {
    id: 'l-07',
    time: '2026-10-03 06:25:10',
    level: 'INFO',
    tag: 'GOLD/EMBED',
    message: 'Batch 17,940/17,940 embedded on MPS Metal GPU: 100% complete (Total duration: 1h 12m)'
  },
  {
    id: 'l-08',
    time: '2026-10-03 06:18:22',
    level: 'INFO',
    tag: 'GOLD/EMBED',
    message: 'Batch 17,000/17,940 embedded on MPS Metal GPU (batch_size=8, torch.mps.empty_cache applied)'
  },
  {
    id: 'l-09',
    time: '2026-10-03 05:55:40',
    level: 'INFO',
    tag: 'GOLD/EMBED',
    message: 'Batch 12,000/17,940 embedded on MPS Metal GPU (batch_size=8, torch.mps.empty_cache applied)'
  },
  {
    id: 'l-10',
    time: '2026-10-03 05:30:15',
    level: 'INFO',
    tag: 'GOLD/EMBED',
    message: 'Batch 06,000/17,940 embedded on MPS Metal GPU (batch_size=8, torch.mps.empty_cache applied)'
  },
  {
    id: 'l-11',
    time: '2026-10-03 05:14:20',
    level: 'SUCCESS',
    tag: 'SILVER/WRITE',
    message: '8,989 HTML5 papers enriched with full sections and 2,224,198 LaTeX formulas written to data/silver/year=2026/papers.parquet'
  },
  {
    id: 'l-12',
    time: '2026-10-03 04:52:10',
    level: 'INFO',
    tag: 'SILVER/DUCKDB',
    message: 'DuckDB engine registered view over Silver Parquet partition (Row count: 10,000, 231.73 MB)'
  },
  {
    id: 'l-13',
    time: '2026-10-03 04:30:11',
    level: 'INFO',
    tag: 'SILVER/PARQUET',
    message: 'PyArrow serialized columnar table: 10,000 rows with SNAPPY compression (Compression Ratio: 3.82:1)'
  },
  {
    id: 'l-14',
    time: '2026-10-03 04:15:30',
    level: 'INFO',
    tag: 'ENRICH/HTML',
    message: 'Parsed ar5iv document 2312.17591: 5 sections extracted, 142 LaTeX math equations preserved'
  },
  {
    id: 'l-15',
    time: '2026-10-03 03:45:18',
    level: 'INFO',
    tag: 'ENRICH/HTML',
    message: 'Parsed ar5iv document 2310.01407: 6 sections extracted, 88 LaTeX math equations preserved'
  },
  {
    id: 'l-16',
    time: '2026-10-03 03:10:00',
    level: 'SUCCESS',
    tag: 'BRONZE/HARVEST',
    message: '10,000 metadata records harvested from arXiv OAI-PMH across categories: cs.AI, cs.LG, cs.CV, cs.CL, stat.ML'
  },
  {
    id: 'l-17',
    time: '2026-10-03 02:40:12',
    level: 'INFO',
    tag: 'BRONZE/OAI',
    message: 'Batch 10/12 harvested: 1,000 XML records dumped to bronze/oai_batches/batch_10.json (resumptionToken verified)'
  },
  {
    id: 'l-18',
    time: '2026-10-03 02:05:44',
    level: 'INFO',
    tag: 'BRONZE/OAI',
    message: 'Batch 05/12 harvested: 1,000 XML records dumped to bronze/oai_batches/batch_05.json (resumptionToken verified)'
  },
  {
    id: 'l-19',
    time: '2026-10-03 01:30:19',
    level: 'INFO',
    tag: 'BRONZE/OAI',
    message: 'Batch 01/12 harvested: Initial 1,000 records stream established from http://export.arxiv.org/oai2'
  },
  {
    id: 'l-20',
    time: '2026-10-03 01:29:55',
    level: 'INFO',
    tag: 'ENV/HARDWARE',
    message: 'Hardware inspection: Apple M-Series chip with Metal MPS backend verified (16 GB Unified Memory)'
  },
  {
    id: 'l-21',
    time: '2026-10-03 01:29:50',
    level: 'START',
    tag: 'MASTER/INIT',
    message: 'Master Pipeline execution initiated on macOS Darwin arm64 (Dual logging stream to logs/master_pipeline_20261003.log)'
  }
];

export function LiveTelemetryFeed() {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredLogs = PIPELINE_LOGS.filter((l) => {
    if (filterLevel !== 'ALL' && l.level !== filterLevel) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return l.message.toLowerCase().includes(q) || l.tag.toLowerCase().includes(q) || l.time.includes(q);
    }
    return true;
  });

  const getTagColor = (level: LogLine['level']) => {
    switch (level) {
      case 'SUCCESS': return 'var(--accent-emerald)';
      case 'QUERY': return 'var(--accent-silver)';
      case 'STORAGE': return 'var(--accent-bronze)';
      case 'START': return 'var(--accent-gold)';
      default: return 'var(--text-secondary)';
    }
  };

  const handleCopyLine = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div style={{
      width: '100%',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--card-shadow)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {/* Top Simple Control Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        paddingBottom: '14px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--accent-emerald)',
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.7)'
          }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            PIPELINE EXECUTION LOG
          </span>
          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            padding: '2px 8px',
            borderRadius: '3px'
          }}>
            logs/master_pipeline_20261003.log
          </span>
        </div>

        {/* Filter Chips & Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                  color: filterLevel === lvl ? 'var(--text-primary)' : 'var(--text-secondary)',
                  padding: '4px 10px',
                  borderRadius: '3px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {lvl}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search log lines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)',
              outline: 'none',
              width: '180px'
            }}
          />
        </div>
      </div>

      {/* Main Log Window with Dedicated Visible Scrollbar */}
      <div 
        className="log-scrollbar"
        style={{
        background: 'var(--bg-canvas)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '6px',
        padding: '12px 14px',
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        lineHeight: 1.6,
        height: '620px',
        overflowY: 'scroll',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {filteredLogs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No log entries found for current filter.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              onClick={() => handleCopyLine(`[${log.time}] [${log.tag}] ${log.message}`, log.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '6px 8px',
                borderRadius: '4px',
                background: copiedId === log.id ? 'var(--bg-surface-elevated)' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.1s ease',
                borderBottom: '1px solid rgba(255, 255, 255, 0.03)'
              }}
              title="Click to copy log line"
            >
              {/* Timestamp */}
              <span style={{
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '12px',
                flexShrink: 0
              }}>
                [{log.time}]
              </span>

              {/* Tag / Category Badge */}
              <span style={{
                color: getTagColor(log.level),
                fontWeight: 700,
                fontSize: '12px',
                flexShrink: 0,
                minWidth: '110px'
              }}>
                [{log.tag}]
              </span>

              {/* Message */}
              <span style={{
                color: 'var(--text-primary)',
                wordBreak: 'break-word',
                flex: 1
              }}>
                {log.message}
              </span>

              {/* Copy Feedback */}
              {copiedId === log.id && (
                <span style={{
                  fontSize: '10px',
                  color: 'var(--accent-emerald)',
                  background: 'rgba(16, 185, 129, 0.15)',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  flexShrink: 0
                }}>
                  COPIED
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11.5px',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-secondary)',
        paddingTop: '4px'
      }}>
        <span>SHOWING {filteredLogs.length} OF {PIPELINE_LOGS.length} RECORDED PIPELINE EVENTS</span>
        <span>CLICK ANY LINE TO COPY TO CLIPBOARD · DUAL LOGGING STREAM ACTIVE</span>
      </div>
    </div>
  );
}
