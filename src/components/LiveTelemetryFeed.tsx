// LiveTelemetryFeed component

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'STORAGE' | 'QUERY';
  phase: 'INGEST' | 'ENRICH' | 'GOLD' | 'RAG' | 'R2';
  message: string;
}

export const MOCK_TELEMETRY: LogEntry[] = [
  {
    timestamp: '13:41:55',
    level: 'SUCCESS',
    phase: 'RAG',
    message: '[ANSWER] Grounded synthesis completed in 18.51s (5.9 words/s) citing [Paper: 2310.01407, Section: 5 Experiments]'
  },
  {
    timestamp: '13:41:37',
    level: 'QUERY',
    phase: 'RAG',
    message: '[RETRIEVE] LanceDB Cosine ANN returned 3 chunks (Top Sim: 0.8510) for query: "sampling z_t in CoDi"'
  },
  {
    timestamp: '13:38:42',
    level: 'INFO',
    phase: 'RAG',
    message: '[LLM] Qwen2.5-7B-Instruct (GGUF Q4_K_M) loaded into Apple Silicon Metal GPU memory (n_ctx=4096)'
  },
  {
    timestamp: '06:30:14',
    level: 'SUCCESS',
    phase: 'R2',
    message: '[STORAGE] Cloudflare R2 lakehouse synchronized: 5.524 GB across Bronze, Silver, and Gold zones'
  },
  {
    timestamp: '06:29:48',
    level: 'SUCCESS',
    phase: 'GOLD',
    message: '[GOLD] 143,523 chunks indexed into LanceDB table scientific_papers_gold (768-dim embeddings)'
  },
  {
    timestamp: '05:14:20',
    level: 'INFO',
    phase: 'ENRICH',
    message: '[SILVER] 8,989 HTML5 papers enriched with full sections and 2.22M LaTeX formulas saved to Parquet'
  },
  {
    timestamp: '03:10:00',
    level: 'INFO',
    phase: 'INGEST',
    message: '[BRONZE] 10,000 papers harvested from arXiv OAI-PMH across categories: cs.AI, cs.LG, cs.CV, cs.CL, stat.ML'
  }
];

export function LiveTelemetryFeed() {
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
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)' }} />
          <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Pipeline Telemetry & Execution Log
          </h4>
        </div>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          STREAM: logs/master_pipeline.log
        </span>
      </div>

      <div style={{
        background: 'var(--bg-canvas)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        fontFamily: 'var(--font-mono)',
        fontSize: '11.5px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxHeight: '260px',
        overflowY: 'auto'
      }}>
        {MOCK_TELEMETRY.map((entry, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', lineHeight: 1.5 }}>
            <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
              {entry.timestamp}
            </span>
            <span style={{
              color: getLevelColor(entry.level),
              fontWeight: 600,
              flexShrink: 0,
              width: '65px'
            }}>
              [{entry.phase}]
            </span>
            <span style={{ color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
              {entry.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
