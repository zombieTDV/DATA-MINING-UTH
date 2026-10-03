import type { ReactNode } from 'react';

export interface ToolItem {
  id: string;
  name: string;
  category: 'Storage' | 'Compute' | 'Vector DB' | 'Model & Engine' | 'Data Source';
  role: string;
  spec: string;
  status: 'Operational' | 'Active' | 'Synced';
  icon: ReactNode;
}

export const TOOLS_DATA: ToolItem[] = [
  {
    id: 'cloudflare-r2',
    name: 'Cloudflare R2',
    category: 'Storage',
    role: 'Bronze Lakehouse & Gold Backup',
    spec: 'S3 API · Zero Egress Fees · 5.52 GB',
    status: 'Operational',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M18.8 11.2C18.4 8.3 15.9 6 13 6c-2.4 0-4.5 1.5-5.4 3.7C5.3 10 3.5 12 3.5 14.5c0 2.8 2.2 5 5 5h10c2.5 0 4.5-2 4.5-4.5 0-2.1-1.5-3.8-3.5-4.3z" stroke="#F38020" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13 10l3 3.5-3 3.5M10 17l-3-3.5 3-3.5" stroke="#FAAD3F" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'duckdb',
    name: 'DuckDB',
    category: 'Compute',
    role: 'In-Process Vectorized SQL Engine',
    spec: 'Zero-Copy Parquet Query · v1.1.3',
    status: 'Operational',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="#FFF000" strokeWidth="1.8"/>
        <circle cx="9" cy="9" r="2.5" fill="#FFF000"/>
        <path d="M14 9c0 2-2 3.5-5 3.5M9 16c4 0 7-1.5 7-4.5" stroke="#FFF000" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'lancedb',
    name: 'LanceDB',
    category: 'Vector DB',
    role: 'Multi-Modal Vector Lakehouse (Gold)',
    spec: '143,523 Embeddings · Cosine ANN',
    status: 'Operational',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <polygon points="12 2 21 7 21 17 12 22 3 17 3 7" stroke="#22D3EE" strokeWidth="1.8" strokeLinejoin="round"/>
        <polyline points="12 2 12 22" stroke="#22D3EE" strokeWidth="1.5" strokeDasharray="2 2"/>
        <polyline points="3 7 12 12 21 7" stroke="#22D3EE" strokeWidth="1.5"/>
        <polyline points="3 17 12 12 21 17" stroke="#22D3EE" strokeWidth="1.5"/>
      </svg>
    )
  },
  {
    id: 'parquet',
    name: 'Apache Parquet',
    category: 'Storage',
    role: 'Silver Canonical Storage Format',
    spec: 'Snappy Compressed · Year=2026 Partition',
    status: 'Synced',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="8" height="7" rx="1.5" stroke="#60A5FA" strokeWidth="1.6"/>
        <rect x="13" y="4" width="8" height="7" rx="1.5" stroke="#60A5FA" strokeWidth="1.6"/>
        <rect x="3" y="13" width="8" height="7" rx="1.5" stroke="#60A5FA" strokeWidth="1.6"/>
        <rect x="13" y="13" width="8" height="7" rx="1.5" stroke="#60A5FA" strokeWidth="1.6"/>
      </svg>
    )
  },
  {
    id: 'qwen',
    name: 'Qwen 2.5 7B',
    category: 'Model & Engine',
    role: 'Scientific RAG Generation',
    spec: 'Instruct Q4_K_M GGUF · 4k Context',
    status: 'Active',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#A855F7" strokeWidth="1.8"/>
        <path d="M8 12c1.5-3 6.5-3 8 0-1.5 3-6.5 3-8 0z" stroke="#C084FC" strokeWidth="1.6"/>
        <circle cx="12" cy="12" r="2" fill="#E879F9"/>
      </svg>
    )
  },
  {
    id: 'apple-metal',
    name: 'Apple Silicon Metal',
    category: 'Compute',
    role: 'Hardware Acceleration (MPS)',
    spec: 'Unified Memory · Metal GPU Offload',
    status: 'Operational',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.88c.66-.82 1.11-1.96.99-3.1-.96.04-2.11.64-2.79 1.44-.6.69-1.12 1.83-.98 2.95 1.07.08 2.14-.56 2.78-1.29z" fill="#E2E8F0"/>
      </svg>
    )
  },
  {
    id: 'nomic',
    name: 'Nomic Embed v1.5',
    category: 'Model & Engine',
    role: 'Academic Literature Embeddings',
    spec: '768 Dimensions · Matryoshka · 8k Context',
    status: 'Operational',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" rx="4" stroke="#10B981" strokeWidth="1.8"/>
        <path d="M8 12h8M12 8v8" stroke="#34D399" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'arxiv',
    name: 'arXiv OAI-PMH & ar5iv',
    category: 'Data Source',
    role: 'Real-time Scientific Harvesting',
    spec: 'cs.AI, cs.LG, cs.CV, cs.CL · HTML5 Full-Text',
    status: 'Synced',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="#B91C1C" strokeWidth="1.8"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="#EF4444" strokeWidth="1.8"/>
        <path d="M9 7h6M9 11h4" stroke="#FCA5A5" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  }
];

export function ToolLogosGrid() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '12px',
    }}>
      {TOOLS_DATA.map((tool) => (
        <div
          key={tool.id}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            position: 'relative',
          }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {tool.icon}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {tool.name}
              </span>
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '2px 7px',
                borderRadius: '999px',
                background: tool.status === 'Active' ? 'rgba(168, 85, 247, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                color: tool.status === 'Active' ? '#c084fc' : '#34d399',
                border: tool.status === 'Active' ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
              }}>
                {tool.status}
              </span>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              {tool.role}
            </div>

            <div style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {tool.spec}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
