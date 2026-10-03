import { useState } from 'react';
import { SCHEMATIC_NODES, type DiagramNode } from '../data/lakehouseData';

export function GeometricPipelineDiagram() {
  const [activeNodeId, setActiveNodeId] = useState<string>('node-gold');
  const [pulseSpeed, setPulseSpeed] = useState<'1x' | '2x' | 'pause'>('1x');
  const activeNode = SCHEMATIC_NODES.find(n => n.id === activeNodeId) || SCHEMATIC_NODES[5];

  const renderIcon = (type: DiagramNode['iconType']) => {
    switch (type) {
      case 'arxiv':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="var(--accent-red)" strokeWidth="2" strokeDasharray="3 3"/>
            <path d="M7 8h10M7 12h7M7 16h5" stroke="var(--accent-red)" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        );
      case 'r2':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <ellipse cx="12" cy="7" rx="8" ry="4" stroke="var(--accent-bronze)" strokeWidth="2"/>
            <path d="M4 7v10c0 2.2 3.6 4 8 4s8-1.8 8-4V7" stroke="var(--accent-bronze)" strokeWidth="2"/>
            <path d="M4 12c0 2.2 3.6 4 8 4s8-1.8 8-4" stroke="var(--accent-gold)" strokeWidth="1.5" strokeDasharray="2 2"/>
          </svg>
        );
      case 'duckdb':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="4" width="16" height="16" rx="4" stroke="var(--accent-gold)" strokeWidth="2"/>
            <circle cx="10" cy="10" r="2.5" fill="var(--accent-gold)"/>
            <path d="M14 10c0 2-2 3.5-5 3.5M9 16c4 0 7-1.5 7-4.5" stroke="var(--accent-gold)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case 'parquet':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="4" width="7" height="7" stroke="var(--accent-silver)" strokeWidth="2"/>
            <rect x="13" y="4" width="7" height="7" stroke="var(--accent-silver)" strokeWidth="2"/>
            <rect x="4" y="13" width="7" height="7" stroke="var(--accent-silver)" strokeWidth="2"/>
            <rect x="13" y="13" width="7" height="7" stroke="var(--accent-silver)" strokeWidth="2"/>
          </svg>
        );
      case 'nomic':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8" stroke="var(--accent-emerald)" strokeWidth="2"/>
            <line x1="12" y1="4" x2="12" y2="20" stroke="var(--accent-emerald)" strokeWidth="1.5"/>
            <line x1="4" y1="12" x2="20" stroke="var(--accent-emerald)" strokeWidth="1.5"/>
            <circle cx="12" cy="12" r="3" fill="var(--accent-emerald)"/>
          </svg>
        );
      case 'lancedb':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <polygon points="12 2 22 7 22 17 12 22 2 17 2 7" stroke="var(--accent-gold)" strokeWidth="2"/>
            <line x1="12" y1="2" x2="12" y2="22" stroke="var(--accent-gold)" strokeWidth="1.5"/>
            <line x1="2" y1="7" x2="22" y2="17" stroke="var(--accent-gold)" strokeWidth="1"/>
            <line x1="2" y1="17" x2="22" y2="7" stroke="var(--accent-gold)" strokeWidth="1"/>
          </svg>
        );
      case 'qwen':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="5" stroke="var(--accent-violet)" strokeWidth="2"/>
            <circle cx="12" cy="12" r="5" stroke="var(--accent-violet)" strokeWidth="1.5"/>
            <line x1="3" y1="12" x2="7" y2="12" stroke="var(--accent-violet)" strokeWidth="2"/>
            <line x1="17" y1="12" x2="21" y2="12" stroke="var(--accent-violet)" strokeWidth="2"/>
            <line x1="12" y1="3" x2="12" y2="7" stroke="var(--accent-violet)" strokeWidth="2"/>
            <line x1="12" y1="17" x2="12" y2="21" stroke="var(--accent-violet)" strokeWidth="2"/>
          </svg>
        );
      case 'terminal':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="var(--accent-cyan)" strokeWidth="2"/>
            <path d="M7 9l3 3-3 3M13 15h4" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
    }
  };

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Blueprint Grid Watermark & Corner Crosshairs */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        color: 'var(--border-muted)',
        letterSpacing: '0.1em'
      }}>
        + SCHEMATIC // SYS-REF 08-FLOW
      </div>
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        color: 'var(--border-muted)',
        letterSpacing: '0.1em'
      }}>
        BUS-FREQ 100MHZ // ZERO-COPY +
      </div>

      {/* Title & Status Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '14px',
        borderBottom: '1px solid var(--border-subtle)',
        marginTop: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            background: 'var(--accent-emerald)',
            boxShadow: '0 0 10px rgba(16, 185, 129, 0.6)'
          }} />
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            Interactive Lakehouse Circuit Schematic
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Kinetic Speed Switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            background: 'var(--bg-card-shell)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            padding: '2px'
          }}>
            <button
              type="button"
              onClick={() => setPulseSpeed('1x')}
              style={{
                background: pulseSpeed === '1x' ? 'var(--text-primary)' : 'transparent',
                color: pulseSpeed === '1x' ? 'var(--bg-surface)' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '3px',
                padding: '2px 7px',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              1x SPEED
            </button>
            <button
              type="button"
              onClick={() => setPulseSpeed('2x')}
              style={{
                background: pulseSpeed === '2x' ? 'var(--accent-emerald)' : 'transparent',
                color: pulseSpeed === '2x' ? '#000000' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '3px',
                padding: '2px 7px',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              2x BOOST
            </button>
            <button
              type="button"
              onClick={() => setPulseSpeed('pause')}
              style={{
                background: pulseSpeed === 'pause' ? 'var(--accent-red)' : 'transparent',
                color: pulseSpeed === 'pause' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '3px',
                padding: '2px 7px',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              PAUSE
            </button>
          </div>

          <div style={{
            display: 'flex',
            gap: '14px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)'
          }}>
            <span>BUS FREQ: <strong style={{ color: 'var(--text-primary)' }}>100 MHZ</strong></span>
            <span>PIPELINE HEALTH: <strong style={{ color: 'var(--accent-emerald)' }}>100% OPERATIONAL</strong></span>
          </div>
        </div>
      </div>

      {/* MAIN GEOMETRIC FLOW DIAGRAM (Scrollable on smaller screens) */}
      <div style={{ overflowX: 'auto', paddingBottom: '14px', marginBottom: '20px' }}>
        <div style={{ minWidth: '980px', position: 'relative' }}>
          
          {/* SVG Animated Bus Track Lines Connecting All Nodes */}
          <svg
            style={{ width: '100%', height: '110px', position: 'absolute', top: '48px', left: 0, zIndex: 1, pointerEvents: 'none' }}
          >
            <defs>
              <linearGradient id="busGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                <stop offset="25%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.8" />
                <stop offset="75%" stopColor="#fbbf24" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
              </linearGradient>

              {/* Arrow Marker */}
              <marker id="circuitArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 8 5 L 0 9 z" fill="var(--text-muted)" />
              </marker>
            </defs>

            {/* Main Primary Circuit Trace */}
            <path
              d="M 60 55 L 940 55"
              fill="none"
              stroke="var(--border-muted)"
              strokeWidth="2"
            />

            {/* Glowing Flow Pulse Line */}
            <path
              d="M 60 55 L 940 55"
              fill="none"
              stroke="url(#busGrad)"
              strokeWidth="3"
              strokeDasharray="16 24"
              style={{
                animation: pulseSpeed === 'pause' ? 'none' : `circuitFlow ${pulseSpeed === '2x' ? '1.5s' : '3s'} linear infinite`
              }}
            />

            {/* Kinetic Traveling Data Packet Pulses */}
            {pulseSpeed !== 'pause' && (
              <>
                <circle r="4" fill="#38bdf8" opacity="0.95" filter="drop-shadow(0 0 4px #38bdf8)">
                  <animateMotion path="M 60 55 L 940 55" dur={pulseSpeed === '2x' ? '1.8s' : '3.6s'} repeatCount="indefinite" />
                </circle>
                <circle r="3.5" fill="#10b981" opacity="0.95" filter="drop-shadow(0 0 4px #10b981)">
                  <animateMotion path="M 60 55 L 940 55" dur={pulseSpeed === '2x' ? '1.8s' : '3.6s'} begin={pulseSpeed === '2x' ? '0.6s' : '1.2s'} repeatCount="indefinite" />
                </circle>
                <circle r="3.5" fill="#fbbf24" opacity="0.95" filter="drop-shadow(0 0 4px #fbbf24)">
                  <animateMotion path="M 60 55 L 940 55" dur={pulseSpeed === '2x' ? '1.8s' : '3.6s'} begin={pulseSpeed === '2x' ? '1.2s' : '2.4s'} repeatCount="indefinite" />
                </circle>
              </>
            )}
          </svg>

          {/* 8 Geometric Nodes Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '12px',
            position: 'relative',
            zIndex: 2
          }}>
            {SCHEMATIC_NODES.map((node) => {
              const isActive = activeNodeId === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setActiveNodeId(node.id)}
                  style={{
                    background: isActive ? 'var(--bg-card-core)' : 'var(--bg-card-shell)',
                    border: isActive ? `2px solid ${node.zoneColor}` : '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '14px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    boxShadow: isActive ? `0 0 20px ${node.zoneColor}33` : 'none',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {/* Step Sequence Badge */}
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: node.zoneColor,
                    fontWeight: 700,
                    marginBottom: '8px',
                    letterSpacing: '0.06em'
                  }}>
                    {node.code}
                  </div>

                  {/* Geometric Icon Hub */}
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '8px',
                    background: 'var(--bg-surface)',
                    border: `1.5px solid ${isActive ? node.zoneColor : 'var(--border-muted)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px',
                    position: 'relative'
                  }}>
                    {renderIcon(node.iconType)}
                    
                    {/* Status Node Indicator */}
                    <div style={{
                      position: 'absolute',
                      bottom: '-3px',
                      right: '-3px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: node.zoneColor,
                      border: '2px solid var(--bg-surface)'
                    }} />
                  </div>

                  {/* Tool / Node Label */}
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: isActive ? node.zoneColor : 'var(--text-primary)',
                    lineHeight: 1.3,
                    minHeight: '34px',
                    marginBottom: '6px'
                  }}>
                    {node.toolName}
                  </div>

                  {/* Core Numeric Metric */}
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11.5px',
                    color: node.zoneColor,
                    fontWeight: 700,
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    width: '100%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {node.metricValue}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* INTERACTIVE SCHEMATIC INSPECTION BAY (Hardware Doppelrand Container) */}
      <div style={{
        background: 'var(--bg-card-shell)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '5px'
      }}>
        <div style={{
          background: 'var(--bg-card-core)',
          border: '1px solid var(--border-muted)',
          borderRadius: 'calc(var(--radius-md) - 5px)',
          padding: '20px',
          display: 'grid',
          gridTemplateColumns: '260px 1fr 280px',
          gap: '24px',
          alignItems: 'center'
        }}>
          {/* Bay Column 1: Node Radar Profile */}
          <div style={{ borderRight: '1px solid var(--border-subtle)', paddingRight: '20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                background: 'var(--bg-surface-elevated)',
                border: `1px solid ${activeNode.zoneColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {renderIcon(activeNode.iconType)}
              </div>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: activeNode.zoneColor, fontWeight: 700 }}>
                  {activeNode.code}
                </span>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {activeNode.toolName}
                </div>
              </div>
            </div>

            <div style={{
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              marginBottom: '6px'
            }}>
              CATEGORY: <strong style={{ color: 'var(--text-primary)' }}>{activeNode.toolCategory}</strong>
            </div>

            <div style={{
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)'
            }}>
              STATUS: <strong style={{ color: 'var(--accent-emerald)' }}>{activeNode.status}</strong>
            </div>
          </div>

          {/* Bay Column 2: Architecture Specifications */}
          <div>
            <div style={{
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              marginBottom: '10px',
              letterSpacing: '0.05em'
            }}>
              ACTIVE SPECIFICATIONS & PROTOCOLS
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              {activeNode.specList.map((spec, i) => (
                <div key={i} style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                  padding: '9px 13px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ color: activeNode.zoneColor, fontSize: '14px' }}>⬡</span>
                  {spec}
                </div>
              ))}
            </div>
          </div>

          {/* Bay Column 3: Live Metric Oscillogram */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              fontWeight: 700,
              letterSpacing: '0.08em',
              marginBottom: '4px'
            }}>
              {activeNode.metricLabel}
            </div>
            <div style={{
              fontSize: '26px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: activeNode.zoneColor,
              letterSpacing: '-0.02em',
              marginBottom: '4px'
            }}>
              {activeNode.metricValue}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 500
            }}>
              {activeNode.secondaryMetric}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes circuitFlow {
          from {
            stroke-dashoffset: 400;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
