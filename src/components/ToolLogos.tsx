import { useState, type ReactNode } from 'react';

interface ToolItem {
  id: string;
  name: string;
  category: 'Storage' | 'Compute' | 'Vector DB' | 'Model & Engine' | 'Data Source';
  role: string;
  spec: string;
  status: 'Operational' | 'Active' | 'Synced';
  icon: ReactNode;
  license: string;
  protocol: string;
  architectureTier: string;
  description: string;
}

const TOOLS_DATA: ToolItem[] = [
  {
    id: 'cloudflare-r2',
    name: 'Cloudflare R2',
    category: 'Storage',
    role: 'Bronze Lakehouse & Gold Backup',
    spec: 'S3 API · Zero Egress Fees · 5.52 GB',
    status: 'Operational',
    license: 'Cloudflare Enterprise SLA',
    protocol: 'Amazon S3 REST API v4 Compatible',
    architectureTier: 'Raw Bronze Object Store',
    description: 'Geo-distributed object storage with automatic replication across global edge networks. Stores full HTML5 arXiv crawl batches and Snappy Parquet partitions with zero bandwidth egress billing.',
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
    license: 'MIT License (Open Source)',
    protocol: 'Direct C++ / Arrow Zero-Copy IPC',
    architectureTier: 'OLAP Transformation Engine',
    description: 'Columnar analytical database engine operating directly in-memory. Executes ultra-fast SQL aggregation, metadata normalization, and LaTeX mathematical expression extraction across 10,000 papers.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="#EAB308" strokeWidth="1.8"/>
        <circle cx="9" cy="9" r="2.5" fill="#EAB308"/>
        <path d="M14 9c0 2-2 3.5-5 3.5M9 16c4 0 7-1.5 7-4.5" stroke="#EAB308" strokeWidth="1.8" strokeLinecap="round"/>
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
    license: 'Apache 2.0 (Open Source)',
    protocol: 'Lance Columnar Disk-Backed IPC',
    architectureTier: 'Semantic Gold Knowledge Store',
    description: 'Serverless vector database designed for AI workflows. Manages 143,523 high-dimensional contextual embeddings with sub-50ms Approximate Nearest Neighbor (ANN) index traversal on NVMe storage.',
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
    license: 'Apache 2.0 (Open Standard)',
    protocol: 'Columnar Binary Serialization',
    architectureTier: 'Curated Silver Canonical Layer',
    description: 'Industry-standard columnar storage format with Snappy block compression. Organizes cleansed papers, author graphs, categories, and parsed full-text sections with partition keys by publication year.',
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
    license: 'Qwen Research & Commercial License',
    protocol: 'llama.cpp GGUF C++ Runtime',
    architectureTier: 'Academic Synthesis & Grounding',
    description: '7-billion parameter scientific instruction-tuned LLM quantized to 4-bit precision (4.4 GB). Excels in mathematical reasoning, LaTeX synthesis, and academic literature summarization without external cloud API dependencies.',
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
    license: 'Apple Developer Runtime',
    protocol: 'Metal Performance Shaders (MPS)',
    architectureTier: 'Silicon Compute Acceleration',
    description: 'Hardware acceleration layer utilizing Apple unified memory architecture. Allows zero-copy tensor sharing between CPU and GPU cores with 200 GB/s internal memory bandwidth.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.88c.66-.82 1.11-1.96.99-3.1-.96.04-2.11.64-2.79 1.44-.6.69-1.12 1.83-.98 2.95 1.07.08 2.14-.56 2.78-1.29z" />
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
    license: 'Apache 2.0 (Open Weights)',
    protocol: 'PyTorch / HuggingFace Transformers',
    architectureTier: 'Vector Embedding Pipeline',
    description: 'Long-context embedding model supporting up to 8,192 tokens. Produces 768-dimensional normalized vectors trained with Matryoshka representation learning for scientific retrieval.',
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
    license: 'arXiv Open Access API',
    protocol: 'OAI-PMH v2.0 XML & W3C HTML5',
    architectureTier: 'Primary Data Ingestion Influx',
    description: 'Protocol for Metadata Harvesting combined with HTML5 full-text conversion via ar5iv. Scrapes structured scientific literature with math equations, figures, tables, and bibliographies.',
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
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [selectedToolId, setSelectedToolId] = useState<string>('lancedb');

  const categories = ['ALL', 'Storage', 'Compute', 'Vector DB', 'Model & Engine', 'Data Source'];

  const filteredTools = TOOLS_DATA.filter(t => {
    if (activeCategory === 'ALL') return true;
    return t.category === activeCategory;
  });

  const selectedTool = TOOLS_DATA.find(t => t.id === selectedToolId) || TOOLS_DATA[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Category Filter Chips Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{
          display: 'flex',
          background: 'var(--bg-card-shell)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '3px',
          gap: '4px',
          flexWrap: 'wrap'
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                background: activeCategory === cat ? 'var(--text-primary)' : 'transparent',
                border: 'none',
                color: activeCategory === cat ? 'var(--bg-surface)' : 'var(--text-secondary)',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{
          fontSize: '11.5px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>SHOWING {filteredTools.length} OF {TOOLS_DATA.length} ENGINES</span>
          <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>100% OPERATIONAL</span>
        </div>
      </div>

      {/* Grid of Interactive Tool Cards: Double-Bezel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '12px',
      }}>
        {filteredTools.map((tool) => {
          const isSelected = selectedToolId === tool.id;

          return (
            <div
              key={tool.id}
              onClick={() => setSelectedToolId(tool.id)}
              style={{
                background: 'var(--bg-card-shell)',
                border: `1px solid ${isSelected ? 'var(--border-highlight)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '3px',
                boxShadow: 'var(--card-shadow)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: isSelected ? 'translateY(-1px)' : 'none'
              }}
            >
              <div style={{
                background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-card-core)',
                borderRadius: 'calc(var(--radius-md) - 2px)',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                height: '100%',
                transition: 'background-color 0.15s ease'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '6px',
                  background: 'var(--bg-card-shell)',
                  border: '1px solid var(--border-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: 'var(--text-primary)'
                }}>
                  {tool.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {tool.name}
                    </span>
                    <span style={{
                      fontSize: '9.5px',
                      fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      background: tool.status === 'Active' ? 'rgba(168, 85, 247, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                      color: tool.status === 'Active' ? 'var(--accent-violet)' : 'var(--accent-emerald)',
                      border: tool.status === 'Active' ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                      fontWeight: 700
                    }}>
                      {tool.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 500 }}>
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
            </div>
          );
        })}
      </div>

      {/* Selected Engine Deep Inspection Console: Double-Bezel Architecture */}
      {selectedTool && (
        <div style={{
          background: 'var(--bg-card-shell)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '4px',
          boxShadow: 'var(--card-shadow)',
          marginTop: '6px'
        }}>
          <div style={{
            background: 'var(--bg-card-core)',
            borderRadius: 'calc(var(--radius-lg) - 2px)',
            padding: '22px 24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '6px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-primary)'
                }}>
                  {selectedTool.icon}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {selectedTool.name}
                    </h3>
                    <span style={{
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      background: 'rgba(96, 165, 250, 0.12)',
                      color: 'var(--accent-silver)',
                      border: '1px solid rgba(96, 165, 250, 0.3)',
                      padding: '2px 7px',
                      borderRadius: '3px',
                      fontWeight: 700
                    }}>
                      {selectedTool.category}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {selectedTool.role}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                TIER: <strong style={{ color: 'var(--text-primary)' }}>{selectedTool.architectureTier}</strong>
              </div>
            </div>

            <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: '16px' }}>
              {selectedTool.description}
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              paddingTop: '14px',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '11.5px',
              fontFamily: 'var(--font-mono)'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>INTERACTION PROTOCOL:</span>
                <div style={{ color: 'var(--accent-silver)', fontWeight: 600, marginTop: '2px' }}>
                  {selectedTool.protocol}
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)' }}>LICENSING MODEL:</span>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>
                  {selectedTool.license}
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)' }}>BENCHMARK PROFILE:</span>
                <div style={{ color: 'var(--accent-emerald)', fontWeight: 600, marginTop: '2px' }}>
                  {selectedTool.spec}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
