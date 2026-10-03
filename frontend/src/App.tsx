import { useState, useEffect } from 'react';
import { GeometricPipelineDiagram } from './components/GeometricPipelineDiagram';
import { GeometricTelemetryGauges } from './components/GeometricTelemetryGauges';
import { ToolLogosGrid } from './components/ToolLogos';
import { LiveTelemetryFeed } from './components/LiveTelemetryFeed';
import { EdaView } from './components/EdaView';
import { MiningPillarsView } from './components/MiningPillarsView';
import { GroundedRagChat } from './components/GroundedRagChat';
import { subscribeTelemetry, fetchHealth } from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState<'schematic' | 'eda' | 'pillars' | 'rag' | 'logs'>('schematic');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('uth-theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  const [backendStatus, setBackendStatus] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [lastTelemetryTick, setLastTelemetryTick] = useState<string>('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('uth-theme', theme);
  }, [theme]);

  // Check health and subscribe to SSE telemetry
  useEffect(() => {
    fetchHealth()
      .then(() => setBackendStatus('ONLINE'))
      .catch(() => setBackendStatus('OFFLINE'));

    const unsubscribe = subscribeTelemetry(
      (data) => {
        setBackendStatus('ONLINE');
        if (data?.timestamp) {
          setLastTelemetryTick(data.timestamp.split('T')[1].split('.')[0]);
        }
      },
      () => setBackendStatus('OFFLINE')
    );

    return () => unsubscribe();
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-canvas)' }}>
      {/* Top Mission Control Header */}
      <header
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        {/* Brand & Mission Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              background: '#ef4444',
              color: '#fff',
              fontWeight: 800,
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              padding: '4px 8px',
              letterSpacing: '0.08em',
            }}
          >
            UTH-AI // MISSION CONTROL
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', margin: 0 }}>
                SCIENTIFIC DATA MINING & ADVANCED RAG LAKEHOUSE
              </h1>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  padding: '2px 6px',
                  background: backendStatus === 'ONLINE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: backendStatus === 'ONLINE' ? 'var(--accent-emerald)' : '#ef4444',
                }}
              >
                ● FASTAPI {backendStatus} {lastTelemetryTick ? `[${lastTelemetryTick}]` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Global Storage & Quota Readout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>R2 QUOTA:</span>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>5.688 GB / 10 GB</span>
            <span style={{ background: 'var(--border-subtle)', padding: '2px 6px', borderRadius: '2px', color: 'var(--accent-emerald)' }}>
              56.88%
            </span>
          </div>

          <button
            onClick={toggleTheme}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              padding: '5px 12px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            [{theme === 'dark' ? 'LIGHT MODE' : 'DARK MODE'}]
          </button>
        </div>
      </header>

      {/* Primary Navigation Tabs */}
      <nav
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          background: 'var(--border-subtle)',
          gap: '1px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {[
          { key: 'schematic', code: '01', title: 'LAKEHOUSE SCHEMATIC', desc: 'Medallion Data Architecture' },
          { key: 'eda', code: '02', title: 'REAL-TIME EDA', desc: 'DuckDB 10k Papers Analysis' },
          { key: 'pillars', code: '03', title: '4 MINING PILLARS', desc: 'Rules, Clusters, Graph, Anomalies' },
          { key: 'rag', code: '04', title: 'SCIENTIFIC RAG', desc: 'Grounded Hybrid QA Engine' },
          { key: 'logs', code: '05', title: 'TELEMETRY & LOGS', desc: 'Live Stream & Storage Audit' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                background: isActive ? 'var(--bg-canvas)' : 'var(--bg-surface)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none',
                borderBottom: isActive ? '2px solid #ef4444' : '2px solid transparent',
                padding: '12px 16px',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                transition: 'background 0.15s ease',
              }}
            >
              <div style={{ fontSize: '10px', color: isActive ? '#ef4444' : 'var(--text-secondary)', fontWeight: 800 }}>
                [ TAB {tab.code} ]
              </div>
              <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '2px', color: 'var(--text-primary)' }}>
                {tab.title}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {tab.desc}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Main Mission Body */}
      <main style={{ flex: 1, padding: '24px 32px' }}>
        {activeTab === 'schematic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <GeometricPipelineDiagram />
            <GeometricTelemetryGauges />
          </div>
        )}

        {activeTab === 'eda' && <EdaView />}

        {activeTab === 'pillars' && <MiningPillarsView />}

        {activeTab === 'rag' && <GroundedRagChat />}

        {activeTab === 'logs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <LiveTelemetryFeed />
            <ToolLogosGrid />
          </div>
        )}
      </main>

      {/* Tactical Engineering Footer */}
      <footer
        style={{
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-subtle)',
          padding: '10px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-secondary)',
        }}
      >
        <div>
          <span>UNIVERSITY OF TRANSPORT AND COMMUNICATIONS // DATA MINING LAB 2026</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>10,000 PAPERS PARQUET</span>
          <span>&bull;</span>
          <span>143,523 LANCEDB VECTORS</span>
          <span>&bull;</span>
          <span>2.22M LATEX FORMULAS</span>
        </div>
      </footer>
    </div>
  );
}
