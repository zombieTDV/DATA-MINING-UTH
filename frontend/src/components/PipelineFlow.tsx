import { useState } from 'react';

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

export function PipelineFlow() {
  const [selectedPhase, setSelectedPhase] = useState<string>('phase-3');

  const activePhase = PIPELINE_PHASES.find(p => p.id === selectedPhase) || PIPELINE_PHASES[0];

  return (
    <div>
      {/* Horizontal Stepper / Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {PIPELINE_PHASES.map((phase) => {
          const isSelected = selectedPhase === phase.id;
          return (
            <div
              key={phase.id}
              onClick={() => setSelectedPhase(phase.id)}
              style={{
                cursor: 'pointer',
                background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                border: isSelected ? '1px solid var(--border-highlight)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* Top Accent Strip */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: phase.zoneColor,
                opacity: isSelected ? 1 : 0.4
              }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontWeight: 600
                }}>
                  PHASE {phase.phaseNumber}
                </span>

                <span style={{
                  fontSize: '9px',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: phase.zoneColor,
                  border: `1px solid rgba(255, 255, 255, 0.08)`,
                  letterSpacing: '0.04em'
                }}>
                  {phase.zone}
                </span>
              </div>

              <div style={{
                fontSize: '13px',
                fontWeight: 600,
                color: isSelected ? '#ffffff' : 'var(--text-primary)',
                marginBottom: '8px',
                lineHeight: 1.4
              }}>
                {phase.name}
              </div>

              <div style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)'
              }}>
                {phase.metrics.processed}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Phase Deep Inspection (Double-Bezel Hardware Architecture) */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '6px'
      }}>
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-muted)',
          borderRadius: 'calc(var(--radius-lg) - 6px)',
          padding: '24px'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: activePhase.zoneColor,
                  fontWeight: 600,
                  letterSpacing: '0.05em'
                }}>
                  [{activePhase.zone} ZONE]
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Phase {activePhase.phaseNumber}: {activePhase.name}
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '800px' }}>
                {activePhase.details}
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#34d399',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              {activePhase.status}
            </div>
          </div>

          {/* 3-Column Specifications Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            {/* Column 1: Tools */}
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Technologies
              </div>
              {activePhase.tools.map((t, idx) => (
                <div key={idx} style={{
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ color: activePhase.zoneColor, fontSize: '10px' }}>▪</span>
                  {t}
                </div>
              ))}
            </div>

            {/* Column 2: Outputs */}
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Produced Artifacts
              </div>
              {activePhase.outputs.map((o, idx) => (
                <div key={idx} style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  marginBottom: '4px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {o}
                </div>
              ))}
            </div>

            {/* Column 3: Live Benchmark */}
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pipeline Benchmark
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                {activePhase.metrics.processed}
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {activePhase.metrics.rate}
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: activePhase.zoneColor }}>
                {activePhase.metrics.latency}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
