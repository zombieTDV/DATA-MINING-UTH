import { useState } from 'react';
import { PIPELINE_PHASES } from '../data/lakehouseData';

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
                border: isSelected ? `2px solid ${phase.zoneColor}` : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: isSelected ? `0 0 16px ${phase.zoneColor}22` : 'var(--card-shadow)',
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
                  color: isSelected ? phase.zoneColor : 'var(--text-muted)',
                  fontWeight: 700
                }}>
                  PHASE {phase.phaseNumber}
                </span>

                <span style={{
                  fontSize: '9.5px',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 7px',
                  borderRadius: '3px',
                  background: 'var(--bg-canvas)',
                  color: phase.zoneColor,
                  border: '1px solid var(--border-subtle)',
                  fontWeight: 700,
                  letterSpacing: '0.04em'
                }}>
                  {phase.zone}
                </span>
              </div>

              <div style={{
                fontSize: '13.5px',
                fontWeight: isSelected ? 700 : 600,
                color: 'var(--text-primary)',
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
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '4px',
        boxShadow: 'var(--card-shadow)'
      }}>
        <div style={{
          background: 'var(--bg-canvas)',
          border: '1px solid var(--border-muted)',
          borderRadius: 'calc(var(--radius-lg) - 2px)',
          padding: '24px'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px',
                  color: activePhase.zoneColor,
                  fontWeight: 700,
                  letterSpacing: '0.05em'
                }}>
                  [{activePhase.zone} ZONE]
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Phase {activePhase.phaseNumber}: {activePhase.name}
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '850px' }}>
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
              color: 'var(--accent-emerald)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)' }} />
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
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Active Technologies
              </div>
              {activePhase.tools.map((t, idx) => (
                <div key={idx} style={{
                  fontSize: '12.5px',
                  color: 'var(--text-primary)',
                  marginBottom: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ color: activePhase.zoneColor, fontSize: '10px' }}>▪</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>

            {/* Column 2: Outputs */}
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Produced Artifacts
              </div>
              {activePhase.outputs.map((o, idx) => (
                <div key={idx} style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  marginBottom: '5px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {o}
                </div>
              ))}
            </div>

            {/* Column 3: Live Benchmark */}
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Pipeline Benchmark
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                {activePhase.metrics.processed}
              </div>
              <div style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {activePhase.metrics.rate}
              </div>
              <div style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: activePhase.zoneColor, fontWeight: 700 }}>
                {activePhase.metrics.latency}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
