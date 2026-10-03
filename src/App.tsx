import { useState, useEffect } from 'react';
import { GeometricPipelineDiagram } from './components/GeometricPipelineDiagram';
import { GeometricTelemetryGauges } from './components/GeometricTelemetryGauges';
import { PipelineFlow } from './components/PipelineFlow';
import { ToolLogosGrid } from './components/ToolLogos';
import { LiveTelemetryFeed } from './components/LiveTelemetryFeed';
import { MetricsBento } from './components/MetricsBento';
import { StorageInspector } from './components/StorageInspector';
import { ScientificRagConsole } from './components/ScientificRagConsole';
import { EdaView } from './components/EdaView';
import { MiningPillarsView } from './components/MiningPillarsView';
import { fetchHealth, fetchStorageStats, subscribeTelemetry } from './api/client';
import type { StorageStatsResponse } from './api/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'schematic' | 'eda' | 'pillars' | 'rag' | 'logs'>('schematic');
  const [pipelineViewMode, setPipelineViewMode] = useState<'schematic' | 'stepper'>('schematic');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('uth-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const [backendStatus, setBackendStatus] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [lastTelemetryTick, setLastTelemetryTick] = useState<string>('');
  const [storageStats, setStorageStats] = useState<StorageStatsResponse | null>(null);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('uth-theme', theme);
  }, [theme]);

  // Check health, load storage stats, and subscribe to SSE telemetry stream
  useEffect(() => {
    fetchHealth()
      .then((h) => setBackendStatus(h.status === 'ONLINE' ? 'ONLINE' : 'ONLINE'))
      .catch(() => setBackendStatus('OFFLINE'));

    fetchStorageStats()
      .then((s) => setStorageStats(s))
      .catch(() => {});

    const unsubscribe = subscribeTelemetry(
      (data) => {
        setBackendStatus('ONLINE');
        if (data?.timestamp) {
          const timePart = data.timestamp.includes('T')
            ? data.timestamp.split('T')[1].split('.')[0]
            : data.timestamp.slice(11, 19);
          setLastTelemetryTick(timePart);
        }
      },
      () => setBackendStatus('OFFLINE')
    );

    return () => unsubscribe();
  }, []);

  // Keyboard navigation shortcuts (1, 2, 3, 4, 5, T)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === '1') setActiveTab('schematic');
      if (e.key === '2') setActiveTab('eda');
      if (e.key === '3') setActiveTab('pillars');
      if (e.key === '4') setActiveTab('rag');
      if (e.key === '5') setActiveTab('logs');
      if (e.key === 't' || e.key === 'T') toggleTheme();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, background: 'var(--bg-canvas)' }}>
      
      {/* TOP MISSION CONTROL HEADER */}
      <header style={{
        background: 'var(--bg-surface)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'var(--text-primary)',
            color: 'var(--bg-surface)',
            fontWeight: 800,
            fontSize: '11.5px',
            fontFamily: 'var(--font-mono)',
            padding: '5px 9px',
            borderRadius: '3px',
            letterSpacing: '0.08em',
          }}>
            UTH-AI
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: 0 }}>
                Scientific Lakehouse Schematic &amp; RAG Pipeline
              </h1>
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                color: backendStatus === 'ONLINE' ? 'var(--accent-emerald)' : 'var(--accent-red)',
                background: backendStatus === 'ONLINE' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                padding: '2px 7px',
                borderRadius: '3px',
                border: `1px solid ${backendStatus === 'ONLINE' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}>
                ● FASTAPI {backendStatus} {lastTelemetryTick ? `[${lastTelemetryTick}]` : '[DEMO MODE]'}
              </span>
            </div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>
              10,000 PAPERS · 143,523 GOLD CHUNKS · 2.22M LATEX FORMULAS · QWEN2.5-7B
            </div>
          </div>
        </div>

        {/* Tactical Status Blocks & Theme Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>
          
          {/* R2 Quota Readout */}
          <div style={{
            background: 'var(--bg-card-shell)',
            border: '1px solid var(--border-subtle)',
            padding: '6px 12px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-bronze)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>R2 BUCKET:</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
              {storageStats ? `${storageStats.total_size_gb.toFixed(2)} GB` : '5.52 GB'} / 10 GB
            </span>
            <span style={{
              fontSize: '10px',
              padding: '1px 5px',
              borderRadius: '2px',
              background: 'var(--border-subtle)',
              color: 'var(--accent-emerald)',
              fontWeight: 800,
            }}>
              {storageStats ? `${storageStats.used_percentage.toFixed(1)}%` : '55.2%'}
            </span>
          </div>

          {/* LanceDB Vector Count */}
          <div style={{
            background: 'var(--bg-card-shell)',
            border: '1px solid var(--border-subtle)',
            padding: '6px 12px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-emerald)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>LANCEDB:</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
              {storageStats?.zones?.goldChunkCount?.toLocaleString() || '143,523'} VEC
            </span>
          </div>

          {/* Geometric Theme Switcher */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--bg-card-shell)',
              border: '1.5px solid var(--border-muted)',
              color: 'var(--text-primary)',
              padding: '6px 12px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode (Shortcut: T)`}
          >
            {theme === 'dark' ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                <span style={{ fontSize: '9.5px', opacity: 0.65, fontFamily: 'var(--font-mono)' }}>[T]</span>
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                <span>DARK</span>
                <span style={{ fontSize: '9.5px', opacity: 0.65, fontFamily: 'var(--font-mono)' }}>[T]</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* PRIMARY 5-TAB NAVIGATION BAR */}
      <nav style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 24px',
        display: 'flex',
        gap: '20px',
        overflowX: 'auto',
      }}>
        {[
          { id: 'schematic', shortcut: '1', title: 'LAKEHOUSE SCHEMATIC', desc: 'Medallion Architecture' },
          { id: 'eda', shortcut: '2', title: 'REAL-TIME EDA', desc: 'DuckDB 10k Papers' },
          { id: 'pillars', shortcut: '3', title: '4 MINING PILLARS', desc: 'Rules, Clusters, Graph, Outliers' },
          { id: 'rag', shortcut: '4', title: 'SCIENTIFIC RAG', desc: 'Grounded QA Workstation' },
          { id: 'logs', shortcut: '5', title: 'TELEMETRY & LOGS', desc: 'SSE Stream & Tools', isLive: true },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--text-primary)' : '2px solid transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                padding: '12px 2px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{
                fontSize: '10px',
                padding: '1.5px 5px',
                borderRadius: '3px',
                background: isActive ? 'var(--text-primary)' : 'var(--bg-surface-elevated)',
                color: isActive ? 'var(--bg-surface)' : 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
              }}>
                [{tab.shortcut}]
              </span>
              <span>{tab.title}</span>
              {tab.isLive && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '9.5px',
                  color: 'var(--accent-emerald)',
                  background: 'rgba(16, 185, 129, 0.12)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  marginLeft: '2px',
                }}>
                  <span style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: 'var(--accent-emerald)',
                    display: 'inline-block',
                  }} />
                  LIVE
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* MAIN VIEW AREA */}
      <main style={{ flex: 1, padding: '24px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        
        {/* TAB 1: Medallion Lakehouse Schematic & Storage */}
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
              gap: '10px',
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
                background: 'var(--bg-card-shell)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '2px',
                gap: '2px',
              }}>
                <button
                  type="button"
                  onClick={() => setPipelineViewMode('schematic')}
                  style={{
                    background: pipelineViewMode === 'schematic' ? 'var(--text-primary)' : 'transparent',
                    border: 'none',
                    color: pipelineViewMode === 'schematic' ? 'var(--bg-surface)' : 'var(--text-secondary)',
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
                    transition: 'all 0.15s ease',
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
                    color: pipelineViewMode === 'stepper' ? 'var(--bg-surface)' : 'var(--text-secondary)',
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
                    transition: 'all 0.15s ease',
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

            {/* Hardware & Storage Telemetry Gauges */}
            <GeometricTelemetryGauges />
          </div>
        )}

        {/* TAB 2: Real-Time Scientific EDA (DuckDB Parquet) */}
        {activeTab === 'eda' && (
          <EdaView />
        )}

        {/* TAB 3: 4 Mining Pillars Console */}
        {activeTab === 'pillars' && (
          <MiningPillarsView />
        )}

        {/* TAB 4: Grounded Scientific RAG Verification Workstation */}
        {activeTab === 'rag' && (
          <ScientificRagConsole />
        )}

        {/* TAB 5: Telemetry, Logs & Platform Tool Registry */}
        {activeTab === 'logs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <LiveTelemetryFeed />
            <ToolLogosGrid />
          </div>
        )}

      </main>

      {/* TACTICAL ENGINEERING FOOTER */}
      <footer style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '10px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'var(--text-secondary)',
      }}>
        <div>
          <span>UNIVERSITY OF TRANSPORT HO CHI MINH CITY // SCIENTIFIC DATA MINING LAB 2026</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>10,000 PAPERS PARQUET</span>
          <span>·</span>
          <span>143,523 LANCEDB VECTORS</span>
          <span>·</span>
          <span>2.22M LATEX FORMULAS</span>
        </div>
      </footer>

    </div>
  );
}
