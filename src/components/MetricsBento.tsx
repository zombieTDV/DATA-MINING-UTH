// MetricsBento component for Lakehouse

export function MetricsBento() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(12, 1fr)',
      gap: '14px',
      marginBottom: '28px',
    }}>
      {/* Card 1: Total Papers (Span 4) */}
      <div style={{
        gridColumn: 'span 4',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '80px',
          height: '80px',
          background: 'radial-gradient(circle at top right, rgba(96, 165, 250, 0.08), transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Corpus Scale
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
              100% Ingested
            </span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
            10,000
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            AI/DS Scientific Papers Indexed
          </div>
        </div>

        <div style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)'
        }}>
          <span>ar5iv HTML5: 9,022</span>
          <span>OAI Batches: 12</span>
        </div>
      </div>

      {/* Card 2: Vector Chunks (Span 4) */}
      <div style={{
        gridColumn: 'span 4',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '80px',
          height: '80px',
          background: 'radial-gradient(circle at top right, rgba(234, 179, 8, 0.08), transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Gold Zone Vector Lakehouse
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}>
              768 Dim
            </span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
            143,523
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            LanceDB Contextual Chunks
          </div>
        </div>

        <div style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)'
        }}>
          <span>Nomic-embed-v1.5</span>
          <span>Cosine ANN Metric</span>
        </div>
      </div>

      {/* Card 3: Cloudflare R2 Storage (Span 4) */}
      <div style={{
        gridColumn: 'span 4',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Cloudflare R2 Bucket
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>
              55.24% of Free Tier
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              5.524
            </span>
            <span style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: 500 }}>
              / 10.0 GB
            </span>
          </div>
          {/* Progress bar */}
          <div style={{
            height: '4px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '2px',
            marginTop: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '55.24%',
              height: '100%',
              background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
              borderRadius: '2px'
            }} />
          </div>
        </div>

        <div style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)'
        }}>
          <span>Remaining: 4.476 GB</span>
          <span>Zero Egress Fees</span>
        </div>
      </div>

      {/* Card 4: LaTeX Mining Engine (Span 6) */}
      <div style={{
        gridColumn: 'span 6',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Mathematical Extraction Engine
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            2,224,198 Formulas
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Cleaned and normalized into pure LaTeX syntax across Silver & Gold
          </div>
        </div>
        <div style={{
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(168, 85, 247, 0.08)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: '#c084fc',
        }}>
          {'$L_{distill} = \\|z_t - \\hat{z}_s\\|^2$'}
        </div>
      </div>

      {/* Card 5: Acceleration Engine (Span 6) */}
      <div style={{
        gridColumn: 'span 6',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Inference Infrastructure
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Apple Silicon Metal (MPS)
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Unified memory GPU offload · Qwen2.5-7B GGUF Q4_K_M (4.4 GB)
          </div>
        </div>
        <div style={{
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: '#34d399',
          textAlign: 'right'
        }}>
          <div>~6.0 tok/s</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sub-50ms ANN</div>
        </div>
      </div>
    </div>
  );
}
