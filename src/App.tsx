import { useState, useEffect } from 'react';
import { GeometricPipelineDiagram } from './components/GeometricPipelineDiagram';
import { GeometricTelemetryGauges } from './components/GeometricTelemetryGauges';
import { PipelineFlow } from './components/PipelineFlow';
import { ToolLogosGrid } from './components/ToolLogos';
import { LiveTelemetryFeed } from './components/LiveTelemetryFeed';
import { MetricsBento } from './components/MetricsBento';
import { StorageInspector } from './components/StorageInspector';
import { ScientificRagConsole } from './components/ScientificRagConsole';

export default function App() {
  const [activeTab, setActiveTab] = useState<'schematic' | 'gauges' | 'tools' | 'rag'>('schematic');
  const [pipelineViewMode, setPipelineViewMode] = useState<'schematic' | 'stepper'>('schematic');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('uth-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('uth-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === '1') setActiveTab('schematic');
      if (e.key === '2') setActiveTab('gauges');
      if (e.key === '3') setActiveTab('tools');
      if (e.key === '4') setActiveTab('rag');
      if (e.key === 't' || e.key === 'T') toggleTheme();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
      {/* Top Architectural Banner */}
      <header style={{
        background: 'var(--bg-surface)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'var(--text-primary)',
            color: 'var(--bg-canvas)',
            fontWeight: 800,
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            padding: '5px 9px',
            borderRadius: '3px',
            letterSpacing: '0.08em'
          }}>
            UTH-AI
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Scientific Lakehouse Schematic & RAG Pipeline
              </h1>
              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: 'var(--accent-emerald)',
                background: 'rgba(16, 185, 129, 0.12)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                [MPS/METAL ONLINE]
              </span>
            </div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>
              10,000 PAPERS · 143,523 GOLD CHUNKS · 5.524 GB R2 · QWEN2.5-7B
            </div>
          </div>
        </div>

        {/* Tactical Status Blocks & Theme Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
          <div style={{
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            padding: '6px 12px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
            <span style={{ color: 'var(--text-secondary)' }}>R2 BUCKET:</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>5.52 GB</span>
          </div>

          <div style={{
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            padding: '6px 12px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            <span style={{ color: 'var(--text-secondary)' }}>LANCEDB:</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>143,523 VEC</span>
          </div>

          {/* Geometric Theme Switcher */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--bg-canvas)',
              border: '1.5px solid var(--border-muted)',
              color: 'var(--text-primary)',
              padding: '6px 13px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.04em'
            }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
                <span>LIGHT</span>
                <span style={{ fontSize: '10px', opacity: 0.65, fontFamily: 'var(--font-mono)' }}>[T]</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                <span>DARK</span>
                <span style={{ fontSize: '10px', opacity: 0.65, fontFamily: 'var(--font-mono)' }}>[T]</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <div style={{
        background: 'var(--bg-canvas)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 28px',
        display: 'flex',
        gap: '24px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'schematic', shortcut: '1', label: 'Pipeline Circuit Schematic' },
          { id: 'gauges', shortcut: '2', label: 'Telemetry Gauges & Execution Logs', isLive: true },
          { id: 'tools', shortcut: '3', label: 'Integrated Tools & Logos' },
          { id: 'rag', shortcut: '4', label: 'Scientific RAG Playground' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--text-primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              padding: '14px 2px',
              fontSize: '12.5px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{
              fontSize: '10.5px',
              padding: '1.5px 5.5px',
              borderRadius: '3px',
              background: activeTab === tab.id ? 'var(--text-primary)' : 'var(--bg-surface-elevated)',
              color: activeTab === tab.id ? 'var(--bg-canvas)' : 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800
            }}>
              [{tab.shortcut}]
            </span>
            <span>{tab.label}</span>
            {tab.isLive && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                color: 'var(--accent-emerald)',
                background: 'rgba(16, 185, 129, 0.12)',
                padding: '1px 6px',
                borderRadius: '3px',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                marginLeft: '2px'
              }}>
                <span style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: 'var(--accent-emerald)',
                  display: 'inline-block'
                }} />
                LIVE
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main View Area */}
      <main style={{ flex: 1, padding: '24px 28px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        {/* TAB 1: Schematic Diagram & Sequential Stepper (Medallion Overview) */}
        {activeTab === 'schematic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Medallion Corpus Scale & Storage Bento */}
            <MetricsBento />

            {/* Pipeline View Mode Segmented Switcher */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 14px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                  ARCHITECTURAL TOPOLOGY VIEW:
                </span>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  Select visualization model
                </span>
              </div>

              <div style={{
                display: 'flex',
                background: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '2px',
                gap: '2px'
              }}>
                <button
                  type="button"
                  onClick={() => setPipelineViewMode('schematic')}
                  style={{
                    background: pipelineViewMode === 'schematic' ? 'var(--text-primary)' : 'transparent',
                    border: 'none',
                    color: pipelineViewMode === 'schematic' ? 'var(--bg-canvas)' : 'var(--text-secondary)',
                    padding: '6px 14px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>⬡</span>
                  <span>PARALLEL BUS SCHEMATIC (8 TRACES)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPipelineViewMode('stepper')}
                  style={{
                    background: pipelineViewMode === 'stepper' ? 'var(--text-primary)' : 'transparent',
                    border: 'none',
                    color: pipelineViewMode === 'stepper' ? 'var(--bg-canvas)' : 'var(--text-secondary)',
                    padding: '6px 14px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>▶</span>
                  <span>4-PHASE SEQUENTIAL STEPPER</span>
                </button>
              </div>
            </div>

            {/* Active Topology Visualizer */}
            {pipelineViewMode === 'schematic' ? (
              <GeometricPipelineDiagram />
            ) : (
              <PipelineFlow />
            )}

            {/* Medallion Storage Partition Deep-Dive */}
            <StorageInspector />
          </div>
        )}

        {/* TAB 2: Telemetry Gauges & Expanded Full-Width Execution Logs */}
        {activeTab === 'gauges' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Hardware & Storage Geometric Telemetry
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                DIAL-01 (CAPACITY) · DIAL-02 (VECTOR PROJECTION) · DIAL-03 (METAL FREQUENCY)
              </p>
            </div>
            
            <GeometricTelemetryGauges />

            {/* Expanded Full-Width Telemetry & Execution Log Feed */}
            <LiveTelemetryFeed />
          </div>
        )}

        {/* TAB 3: Tool Stack & Logos */}
        {activeTab === 'tools' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Configured Tools & Platform Engines
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                CLOUDFLARE R2 · DUCKDB · LANCEDB · APACHE PARQUET · QWEN 2.5 · NOMIC AI · APPLE METAL
              </p>
            </div>
            <ToolLogosGrid />
          </div>
        )}

        {/* TAB 4: Grounded Scientific RAG Verification Workstation */}
        {activeTab === 'rag' && (
          <ScientificRagConsole />
        )}
      </main>
    </div>
  );
}
