export function GeometricTelemetryGauges() {
  // 55.24% of 10GB
  const percentage = 55.24;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '14px',
      marginBottom: '24px'
    }}>
      {/* GAUGE 1: Circular Radial Storage Arc */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--card-shadow)',
        padding: '4px'
      }}>
        <div style={{
          background: 'var(--bg-canvas)',
          borderRadius: 'calc(var(--radius-md) - 2px)',
          padding: '18px 20px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          <div>
            <div style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-bronze)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '4px'
            }}>
              [METRIC 01] : STORAGE CAPACITY
            </div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Cloudflare R2 Lake
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Free Tier Quota Utilization
            </div>
            <div style={{ marginTop: '14px', fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              REMAINING: <strong style={{ color: 'var(--accent-emerald)', fontSize: '12.5px' }}>4.476 GB</strong>
            </div>
          </div>

          {/* Circular SVG Gauge */}
          <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="120" height="120" viewBox="0 0 130 130">
              {/* Background Track */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                fill="none"
                stroke="var(--border-muted)"
                strokeWidth="10"
              />
              {/* Value Arc */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                fill="none"
                stroke="var(--accent-bronze)"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 65 65)"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '19px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                55.2%
              </span>
              <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                5.52 / 10 GB
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* GAUGE 2: 768-Dim Latent Tensor Matrix Visualizer */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--card-shadow)',
        padding: '4px'
      }}>
        <div style={{
          background: 'var(--bg-canvas)',
          borderRadius: 'calc(var(--radius-md) - 2px)',
          padding: '18px 20px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          <div>
            <div style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-gold)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '4px'
            }}>
              [METRIC 02] : VECTOR GEOMETRY
            </div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Nomic Embed v1.5
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              768-Dim Normalized Hyper-Sphere
            </div>
            <div style={{ marginTop: '14px', fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              INDEX METRIC: <strong style={{ color: 'var(--accent-gold)', fontSize: '12.5px' }}>COSINE ANN</strong>
            </div>
          </div>

          {/* 12x12 Geometric Latent Cell Matrix */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 7px)',
            gap: '3px',
            background: 'var(--bg-surface-elevated)',
            padding: '9px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)'
          }}>
            {Array.from({ length: 144 }).map((_, idx) => {
              const isLit = (idx * 7 + 13) % 5 === 0;
              const isMedium = (idx * 3 + 7) % 3 === 0;
              return (
                <div
                  key={idx}
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '1.5px',
                    background: isLit
                      ? 'var(--accent-emerald)'
                      : isMedium
                      ? 'rgba(16, 185, 129, 0.45)'
                      : 'var(--border-subtle)',
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* GAUGE 3: Hardware Inference Frequency & Throughput */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--card-shadow)',
        padding: '4px'
      }}>
        <div style={{
          background: 'var(--bg-canvas)',
          borderRadius: 'calc(var(--radius-md) - 2px)',
          padding: '18px 20px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          <div>
            <div style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-silver)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '4px'
            }}>
              [METRIC 03] : HARDWARE LATENCY
            </div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Apple Silicon Metal GPU
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Inference Waveform Frequency
            </div>
            <div style={{ marginTop: '14px', fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              THROUGHPUT: <strong style={{ color: 'var(--accent-silver)', fontSize: '12.5px' }}>~6.0 TOKENS/S</strong>
            </div>
          </div>

          {/* Frequency Equalizer Waveform Bars */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '3.5px',
            height: '60px',
            background: 'var(--bg-surface-elevated)',
            padding: '8px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)'
          }}>
            {[28, 45, 60, 35, 52, 70, 85, 65, 48, 76, 92, 58, 42, 68].map((height, i) => (
              <div
                key={i}
                style={{
                  width: '4.5px',
                  height: `${height}%`,
                  background: i % 2 === 0 ? 'var(--accent-violet)' : 'var(--accent-silver)',
                  borderRadius: '1px',
                  opacity: 0.95
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
