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
        padding: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        <div>
          <div style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '4px'
          }}>
            [METRIC 01] // STORAGE CAPACITY
          </div>
          <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Cloudflare R2 Lake
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Free Tier Quota Utilization
          </div>
          <div style={{ marginTop: '14px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            REMAINING: <strong style={{ color: 'var(--accent-emerald)', fontSize: '13px' }}>4.476 GB</strong>
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
              stroke="rgba(255, 255, 255, 0.12)"
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
            <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              55.2%
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontWeight: 600 }}>
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
        boxShadow: 'var(--card-shadow)',
        padding: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        <div>
          <div style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '4px'
          }}>
            [METRIC 02] // VECTOR GEOMETRY
          </div>
          <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Nomic Embed v1.5
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            768-Dim Normalized Hyper-Sphere
          </div>
          <div style={{ marginTop: '14px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            INDEX METRIC: <strong style={{ color: 'var(--accent-gold)', fontSize: '13px' }}>COSINE ANN</strong>
          </div>
        </div>

        {/* 12x12 Geometric Latent Cell Matrix */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 7px)',
          gap: '3.5px',
          background: 'var(--bg-canvas)',
          padding: '10px',
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
                    ? '#10b981'
                    : isMedium
                    ? 'rgba(16, 185, 129, 0.45)'
                    : 'rgba(255, 255, 255, 0.1)',
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
        boxShadow: 'var(--card-shadow)',
        padding: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        <div>
          <div style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '4px'
          }}>
            [METRIC 03] // HARDWARE LATENCY
          </div>
          <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Apple Silicon Metal GPU
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Inference Waveform Frequency
          </div>
          <div style={{ marginTop: '14px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            THROUGHPUT: <strong style={{ color: 'var(--accent-silver)', fontSize: '13px' }}>~6.0 TOKENS/S</strong>
          </div>
        </div>

        {/* Frequency Equalizer Waveform Bars */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '4px',
          height: '65px',
          background: 'var(--bg-canvas)',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid var(--border-subtle)'
        }}>
          {[28, 45, 60, 35, 52, 70, 85, 65, 48, 76, 92, 58, 42, 68].map((height, i) => (
            <div
              key={i}
              style={{
                width: '5px',
                height: `${height}%`,
                background: i % 2 === 0 ? '#a855f7' : '#c084fc',
                borderRadius: '1.5px',
                opacity: 0.9
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
