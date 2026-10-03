import { useState } from 'react';
import { MathRenderer } from './MathRenderer';

export function MetricsBento() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <div className="responsive-bento">
      {/* Card 1: Total Papers (Span 4) */}
      <div 
        onMouseEnter={() => setHoveredCard(1)}
        onMouseLeave={() => setHoveredCard(null)}
        style={{
          gridColumn: 'span 4',
          background: 'var(--bg-card-shell)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          transition: 'border-color 0.2s ease, transform 0.2s ease',
          borderColor: hoveredCard === 1 ? 'var(--border-highlight)' : 'var(--border-subtle)',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div style={{
          background: 'var(--bg-card-core)',
          borderRadius: 'calc(var(--radius-md) - 2px)',
          padding: '16px 18px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '90px',
            height: '90px',
            background: 'radial-gradient(circle at top right, rgba(96, 165, 250, 0.12), transparent 70%)',
            pointerEvents: 'none'
          }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                CORPUS SCALE
              </span>
              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: 'var(--accent-emerald)',
                background: 'rgba(16, 185, 129, 0.12)',
                padding: '2px 6px',
                borderRadius: '3px',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}>
                100% INGESTED
              </span>
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums'
            }}>
              10,000
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: 500 }}>
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
            <span>ar5iv HTML5: <strong style={{ color: 'var(--text-primary)' }}>9,022</strong></span>
            <span>OAI Batches: <strong style={{ color: 'var(--text-primary)' }}>12</strong></span>
          </div>
        </div>
      </div>

      {/* Card 2: Vector Chunks (Span 4) */}
      <div 
        onMouseEnter={() => setHoveredCard(2)}
        onMouseLeave={() => setHoveredCard(null)}
        style={{
          gridColumn: 'span 4',
          background: 'var(--bg-card-shell)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          transition: 'border-color 0.2s ease, transform 0.2s ease',
          borderColor: hoveredCard === 2 ? 'var(--border-highlight)' : 'var(--border-subtle)',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div style={{
          background: 'var(--bg-card-core)',
          borderRadius: 'calc(var(--radius-md) - 2px)',
          padding: '16px 18px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '90px',
            height: '90px',
            background: 'radial-gradient(circle at top right, rgba(251, 191, 36, 0.12), transparent 70%)',
            pointerEvents: 'none'
          }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                GOLD VECTOR LAKEHOUSE
              </span>
              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: 'var(--accent-gold)',
                background: 'rgba(251, 191, 36, 0.12)',
                padding: '2px 6px',
                borderRadius: '3px',
                border: '1px solid rgba(251, 191, 36, 0.25)'
              }}>
                768 DIM
              </span>
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums'
            }}>
              143,523
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: 500 }}>
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
            <span>Model: <strong style={{ color: 'var(--text-primary)' }}>Nomic Embed v1.5</strong></span>
            <span>Metric: <strong style={{ color: 'var(--text-primary)' }}>Cosine ANN</strong></span>
          </div>
        </div>
      </div>

      {/* Card 3: Cloudflare R2 Storage (Span 4) */}
      <div 
        onMouseEnter={() => setHoveredCard(3)}
        onMouseLeave={() => setHoveredCard(null)}
        style={{
          gridColumn: 'span 4',
          background: 'var(--bg-card-shell)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          transition: 'border-color 0.2s ease, transform 0.2s ease',
          borderColor: hoveredCard === 3 ? 'var(--border-highlight)' : 'var(--border-subtle)',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div style={{
          background: 'var(--bg-card-core)',
          borderRadius: 'calc(var(--radius-md) - 2px)',
          padding: '16px 18px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                CLOUDFLARE R2 BUCKET
              </span>
              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: 'var(--accent-bronze)',
                background: 'rgba(245, 158, 11, 0.12)',
                padding: '2px 6px',
                borderRadius: '3px',
                border: '1px solid rgba(245, 158, 11, 0.25)'
              }}>
                55.24% QUOTA
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{
                fontSize: '32px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums'
              }}>
                5.524
              </span>
              <span style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 600 }}>
                / 10.00 GB
              </span>
            </div>
            {/* Theme-safe progress bar */}
            <div style={{
              height: '5px',
              background: 'var(--border-subtle)',
              borderRadius: '3px',
              marginTop: '12px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '55.24%',
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent-bronze), var(--accent-gold))',
                borderRadius: '3px'
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
            <span>Free Tier Left: <strong style={{ color: 'var(--text-primary)' }}>4.476 GB</strong></span>
            <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>Zero Egress</span>
          </div>
        </div>
      </div>

      {/* Card 4: LaTeX Mining Engine (Span 6) */}
      <div 
        onMouseEnter={() => setHoveredCard(4)}
        onMouseLeave={() => setHoveredCard(null)}
        style={{
          gridColumn: 'span 6',
          background: 'var(--bg-card-shell)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          transition: 'border-color 0.2s ease, transform 0.2s ease',
          borderColor: hoveredCard === 4 ? 'var(--border-highlight)' : 'var(--border-subtle)',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div style={{
          background: 'var(--bg-card-core)',
          borderRadius: 'calc(var(--radius-md) - 2px)',
          padding: '16px 18px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              MATHEMATICAL EXTRACTION ENGINE
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums'
            }}>
              2,224,198 Formulas
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 500 }}>
              Parsed into normalized LaTeX syntax across Silver & Gold Lakehouse
            </div>
          </div>
          <div style={{
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(192, 132, 252, 0.10)',
            border: '1px solid rgba(192, 132, 252, 0.25)',
            fontSize: '13px',
            color: 'var(--accent-violet)',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center'
          }}>
            <MathRenderer math="L_{\text{distill}} = \|z_t - \hat{z}_s\|^2" displayMode={false} />
          </div>
        </div>
      </div>

      {/* Card 5: Acceleration Engine (Span 6) */}
      <div 
        onMouseEnter={() => setHoveredCard(5)}
        onMouseLeave={() => setHoveredCard(null)}
        style={{
          gridColumn: 'span 6',
          background: 'var(--bg-card-shell)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          transition: 'border-color 0.2s ease, transform 0.2s ease',
          borderColor: hoveredCard === 5 ? 'var(--border-highlight)' : 'var(--border-subtle)',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div style={{
          background: 'var(--bg-card-core)',
          borderRadius: 'calc(var(--radius-md) - 2px)',
          padding: '16px 18px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              INFERENCE INFRASTRUCTURE
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Apple Silicon Metal (MPS)
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 500 }}>
              Unified Memory GPU Offload: Qwen2.5-7B GGUF Q4_K_M (4.4 GB)
            </div>
          </div>
          <div style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(16, 185, 129, 0.10)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--accent-emerald)',
            textAlign: 'right'
          }}>
            <div style={{ fontWeight: 700 }}>~6.0 tok/s</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sub-50ms ANN</div>
          </div>
        </div>
      </div>
    </div>
  );
}
