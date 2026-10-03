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
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        <div>
          <div style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '4px'
          }}>
            [METRIC 01] // STORAGE CAPACITY
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Cloudflare R2 Lake
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Free Tier Quota Utilization
          </div>
          <div style={{ marginTop: '12px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            REMAINING: <strong style={{ color: 'var(--accent-emerald)' }}>4.476 GB</strong>
          </div>
        </div>

        {/* Circular SVG Gauge */}
        <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="130" height="130" viewBox="0 0 130 130">
            {/* Background Track */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="9"
            />
            {/* Value Arc */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              fill="none"
              stroke="var(--accent-bronze)"
              strokeWidth="9"
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
            <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              55.2%
            </span>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              5.52 / 10 GB
            </span>
          </div>
        </div>
      </div>

      {/* GAUGE 2: 768-Dim Latent Tensor Matrix Visualizer */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        <div>
          <div style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '4px'
          }}>
            [METRIC 02] // VECTOR GEOMETRY
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Nomic Embed v1.5
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            768-Dim Normalized Hyper-Sphere
          </div>
          <div style={{ marginTop: '12px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            INDEX METRIC: <strong style={{ color: 'var(--accent-gold)' }}>COSINE ANN</strong>
          </div>
        </div>

        {/* 12x12 Geometric Latent Cell Matrix */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 6px)',
          gap: '3px',
          background: 'var(--bg-canvas)',
          padding: '8px',
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
                  width: '6px',
                  height: '6px',
                  borderRadius: '1px',
                  background: isLit
                    ? '#34d399'
                    : isMedium
                    ? 'rgba(52, 211, 153, 0.35)'
                    : 'rgba(255, 255, 255, 0.06)',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* GAUGE 3: Hardware Inference Frequency & Throughput */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        <div>
          <div style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '4px'
          }}>
            [METRIC 03] // HARDWARE LATENCY
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Apple Silicon Metal GPU
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Inference Waveform Frequency
          </div>
          <div style={{ marginTop: '12px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            THROUGHPUT: <strong style={{ color: 'var(--accent-silver)' }}>~6.0 TOKENS/S</strong>
          </div>
        </div>

        {/* Frequency Equalizer Waveform Bars */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '4px',
          height: '60px',
          background: 'var(--bg-canvas)',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid var(--border-subtle)'
        }}>
          {[28, 45, 60, 35, 52, 70, 85, 65, 48, 76, 92, 58, 42, 68].map((height, i) => (
            <div
              key={i}
              style={{
                width: '4px',
                height: `${height}%`,
                background: i % 2 === 0 ? '#a855f7' : '#c084fc',
                borderRadius: '1px',
                opacity: 0.85
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
