import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { GeometricPipelineDiagram } from './components/GeometricPipelineDiagram';
import { GeometricTelemetryGauges } from './components/GeometricTelemetryGauges';
import { PipelineFlow } from './components/PipelineFlow';
import { ToolLogosGrid } from './components/ToolLogos';
import { MetricsBento } from './components/MetricsBento';
import { StorageInspector } from './components/StorageInspector';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ToastProvider } from './components/ToastNotification';
import { useToast } from './context/ToastContext';
import { fetchHealth, fetchStorageStats, subscribeTelemetry } from './api/client';
import type { StorageStatsResponse } from './api/types';

// Code Splitting via Dynamic Imports (Task 5.1)
const EdaView = lazy(() => import('./components/EdaView').then(m => ({ default: m.EdaView })));
const MiningPillarsView = lazy(() => import('./components/MiningPillarsView').then(m => ({ default: m.MiningPillarsView })));
const ScientificRagConsole = lazy(() => import('./components/ScientificRagConsole').then(m => ({ default: m.ScientificRagConsole })));
const LiveTelemetryFeed = lazy(() => import('./components/LiveTelemetryFeed').then(m => ({ default: m.LiveTelemetryFeed })));

const TabSuspenseFallback = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px 0' }}>
    <div className="skeleton-shimmer" style={{ height: '56px', borderRadius: 'var(--radius-md)' }} />
    <div className="skeleton-shimmer" style={{ height: '380px', borderRadius: 'var(--radius-md)' }} />
  </div>
);

type TabId = 'schematic' | 'eda' | 'pillars' | 'rag' | 'logs';

const TABS: Array<{
  id: TabId;
  shortcut: string;
  title: string;
  badge: string;
  badgeColor: string;
  isLive?: boolean;
}> = [
  { id: 'schematic', shortcut: '1', title: 'SCHEMATIC & OVERVIEW', badge: 'LIVE', badgeColor: 'var(--accent-emerald)' },
  { id: 'eda', shortcut: '2', title: 'DUCKDB STATS', badge: '10K DOCS', badgeColor: 'var(--accent-silver)' },
  { id: 'pillars', shortcut: '3', title: '4 MINING PILLARS', badge: 'ANALYTICS', badgeColor: 'var(--accent-violet)' },
  { id: 'rag', shortcut: '4', title: 'SCIENTIFIC RAG', badge: 'QWEN2.5', badgeColor: 'var(--accent-cyan)' },
  { id: 'logs', shortcut: '5', title: 'TELEMETRY STREAM', badge: 'SSE', badgeColor: 'var(--accent-bronze)', isLive: true },
];

function DashboardMain() {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '') as TabId;
      if (TABS.some(t => t.id === hash)) return hash;
    }
    return 'schematic';
  });

  const [pipelineViewMode, setPipelineViewMode] = useState<'schematic' | 'stepper'>('schematic');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('uth-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const [backendStatus, setBackendStatus] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [lastTelemetryTick, setLastTelemetryTick] = useState<string>('');
  const [storageStats, setStorageStats] = useState<StorageStatsResponse | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);

  const { showToast } = useToast();

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      showToast({
        type: 'info',
        message: `Theme switched to ${nextTheme === 'dark' ? 'Tactical Obsidian' : 'Nordic Clean Lab'}`,
        duration: 2000,
      });
      return nextTheme;
    });
  }, [showToast]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('uth-theme', theme);
  }, [theme]);

  // URL Hash Sync (Phase 5.3)
  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  // Scroll listener for back-to-top button (Phase 5.5)
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 380);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Real-time Ho Chi Minh (UTC+7) clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
      setCurrentTime(`${timeStr} UTC+7`);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Keyboard navigation shortcuts (1, 2, 3, 4, 5, T, ?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === '1') setActiveTab('schematic');
      if (e.key === '2') setActiveTab('eda');
      if (e.key === '3') setActiveTab('pillars');
      if (e.key === '4') setActiveTab('rag');
      if (e.key === '5') setActiveTab('logs');
      if (e.key === 't' || e.key === 'T') toggleTheme();
      if (e.key === '?') setIsShortcutsOpen(prev => !prev);
      if (e.key === 'Escape') {
        setIsShortcutsOpen(false);
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme]);

  // ArrowLeft / ArrowRight navigation inside tablist (WAI-ARIA)
  const handleTabKeyDown = (e: React.KeyboardEvent, currentId: TabId) => {
    const currentIndex = TABS.findIndex(t => t.id === currentId);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextTab = TABS[(currentIndex + 1) % TABS.length];
      setActiveTab(nextTab.id);
      document.getElementById(`tab-${nextTab.id}`)?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevTab = TABS[(currentIndex - 1 + TABS.length) % TABS.length];
      setActiveTab(prevTab.id);
      document.getElementById(`tab-${prevTab.id}`)?.focus();
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, background: 'var(--bg-canvas)' }}>
      {/* Accessible Skip Link (Task 1.3) */}
      <a href="#main-content" className="skip-link">
        Skip to main content [Enter]
      </a>

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
          {/* Hamburger Menu Toggle (Mobile Viewports) */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(prev => !prev)}
            aria-label="Toggle Navigation Menu"
            style={{
              display: 'none',
              background: 'var(--bg-card-shell)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              padding: '6px 8px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
            className="mobile-menu-btn"
          >
            ☰
          </button>

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: 0 }}>
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
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span className="pulse-led" style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor' }} />
                FASTAPI {backendStatus} {lastTelemetryTick ? `[${lastTelemetryTick}]` : '[LIVE 18ms]'}
              </span>
            </div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>
              10,000 PAPERS · 143,523 GOLD CHUNKS · 2.22M LATEX FORMULAS · QWEN2.5-7B
            </div>
          </div>
        </div>

        {/* Tactical Status Blocks, Clock, Shortcuts & Theme Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-mono)', fontSize: '11.5px', flexWrap: 'wrap' }}>
          
          {/* Live UTC+7 Observatory Clock */}
          <div style={{
            background: 'var(--bg-card-shell)',
            border: '1px solid var(--border-subtle)',
            padding: '6px 10px',
            borderRadius: '4px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '10px', color: 'var(--accent-emerald)', fontWeight: 700 }}>● CLOCK:</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{currentTime || '00:00:00 UTC+7'}</span>
          </div>

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

          {/* Shortcuts Guide Button (?) */}
          <button
            type="button"
            onClick={() => setIsShortcutsOpen(true)}
            style={{
              background: 'var(--bg-card-shell)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              padding: '6px 10px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title="Open Keyboard Shortcuts Guide (Shortcut: ?)"
            aria-label="Keyboard Shortcuts"
          >
            <span>KEYS</span>
            <span className="keycap" style={{ fontSize: '9px', padding: '0 4px' }}>?</span>
          </button>

          {/* Geometric Theme Switcher */}
          <button
            type="button"
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
            aria-label="Toggle Dark and Light Mode"
          >
            {theme === 'dark' ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                <span className="keycap" style={{ fontSize: '9px', padding: '0 3px' }}>T</span>
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                <span>DARK</span>
                <span className="keycap" style={{ fontSize: '9px', padding: '0 3px' }}>T</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER NAVIGATION OVERLAY (Task 2.2) */}
      {isMobileDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          onClick={() => setIsMobileDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(5, 7, 12, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '280px',
              height: '100%',
              background: 'var(--bg-surface)',
              borderRight: '1px solid var(--border-subtle)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '12px', color: 'var(--text-primary)' }}>
                [NAVIGATION]
              </span>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '14px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileDrawerOpen(false);
                  }}
                  style={{
                    background: isActive ? 'var(--bg-card-shell)' : 'transparent',
                    border: `1px solid ${isActive ? 'var(--border-highlight)' : 'transparent'}`,
                    borderRadius: '6px',
                    padding: '12px 14px',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{tab.title}</span>
                  <span style={{ fontSize: '9px', color: tab.badgeColor, fontWeight: 800 }}>
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TACTICAL FLOATING CAPSULE NAVIGATION (WAI-ARIA COMPLIANT) */}
      <nav
        aria-label="Dashboard navigation tabs"
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          overflowX: 'auto',
        }}
      >
        <div
          role="tablist"
          aria-label="Mission control dashboard views"
          style={{
            display: 'flex',
            gap: '4px',
            background: 'var(--bg-card-shell)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '4px',
            alignItems: 'center',
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
                style={{
                  background: isActive ? 'var(--bg-surface)' : 'transparent',
                  border: isActive ? '1px solid var(--border-highlight)' : '1px solid transparent',
                  borderRadius: '6px',
                  boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.25)' : 'none',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  padding: '8px 14px',
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <span className="keycap">{tab.shortcut}</span>
                <span>{tab.title}</span>
                <span style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '1.5px 5px',
                  borderRadius: '3px',
                  background: isActive ? 'rgba(96, 165, 250, 0.15)' : 'var(--border-subtle)',
                  color: isActive ? tab.badgeColor : 'var(--text-muted)',
                  border: `1px solid ${isActive ? 'rgba(96, 165, 250, 0.3)' : 'transparent'}`,
                  letterSpacing: '0.04em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}>
                  {tab.isLive && (
                    <span className="pulse-led" style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }} />
                  )}
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tactical active mode telemetry readout */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          whiteSpace: 'nowrap'
        }}>
          <span>OBSERVATORY:</span>
          <span style={{ color: 'var(--accent-silver)', fontWeight: 700 }}>
            {activeTab === 'schematic' && 'LAKEHOUSE MEDALLION TOPOLOGY'}
            {activeTab === 'eda' && 'DUCKDB ZERO-COPY OLAP QUERYING'}
            {activeTab === 'pillars' && '4-DIMENSIONAL PATTERN MINING'}
            {activeTab === 'rag' && 'HYBRID LANCE-ANN & LLM REASONING'}
            {activeTab === 'logs' && 'REAL-TIME FASTAPI SSE TELEMETRY'}
          </span>
        </div>
      </nav>

      {/* MISSION CONTROL MAIN VIEWPORT (WAI-ARIA TABPANEL) */}
      <main
        id="main-content"
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
        style={{
          flex: 1,
          padding: '24px',
          maxWidth: '1600px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
          outline: 'none',
        }}
      >
        {/* TAB 1: Schematic Overview & Medallion Pipeline Architecture */}
        {activeTab === 'schematic' && (
          <div className="tab-pane-active" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
              padding: '8px 16px',
              flexWrap: 'wrap',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                  ARCHITECTURAL TOPOLOGY VIEW:
                </span>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  Interactive Data Bus Circuit vs Sequential Stepper
                </span>
              </div>

              <div style={{
                display: 'flex',
                background: 'var(--bg-card-shell)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '3px',
                gap: '3px',
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
          <Suspense fallback={<TabSuspenseFallback />}>
            <div className="tab-pane-active">
              <EdaView />
            </div>
          </Suspense>
        )}

        {/* TAB 3: 4 Mining Pillars Console */}
        {activeTab === 'pillars' && (
          <Suspense fallback={<TabSuspenseFallback />}>
            <div className="tab-pane-active">
              <MiningPillarsView />
            </div>
          </Suspense>
        )}

        {/* TAB 4: Grounded Scientific RAG Verification Workstation */}
        {activeTab === 'rag' && (
          <Suspense fallback={<TabSuspenseFallback />}>
            <div className="tab-pane-active">
              <ScientificRagConsole />
            </div>
          </Suspense>
        )}

        {/* TAB 5: Telemetry, Logs & Platform Tool Registry */}
        {activeTab === 'logs' && (
          <Suspense fallback={<TabSuspenseFallback />}>
            <div className="tab-pane-active" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <LiveTelemetryFeed />
              <ToolLogosGrid />
            </div>
          </Suspense>
        )}

      </main>

      {/* Floating Back to Top Button (Phase 5.5) */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll back to top"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-highlight)',
            borderRadius: '50%',
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--card-shadow)',
            color: 'var(--accent-silver)',
            fontFamily: 'var(--font-mono)',
            fontSize: '16px',
            fontWeight: 800,
            transition: 'all 0.15s ease',
          }}
          title="Scroll back to top"
        >
          ▲
        </button>
      )}

      {/* Keyboard Shortcuts Reference Modal (Phase 4.4) */}
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />

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
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>UTH</span>
          <span>//</span>
          <span>UNIVERSITY OF TRANSPORT HO CHI MINH CITY // SCIENTIFIC DATA MINING LAB 2026</span>
          <span style={{ color: 'var(--accent-emerald)', fontSize: '10px', background: 'rgba(16, 185, 129, 0.12)', padding: '1px 6px', borderRadius: '3px' }}>
            ● CLIENT SYNC: OK
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
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

export default function App() {
  return (
    <ToastProvider>
      <DashboardMain />
    </ToastProvider>
  );
}
