import { useState } from 'react';
import { LAYERS } from '../data/lakehouseData';

export function StorageInspector() {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [activeZone, setActiveZone] = useState<string>('ALL');

  const handleCopy = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const filteredLayers = LAYERS.filter(layer => {
    if (activeZone === 'ALL') return true;
    return layer.zone === activeZone;
  });

  return (
    <div style={{
      background: 'var(--bg-card-shell)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '4px',
      boxShadow: 'var(--card-shadow)',
      marginTop: '20px'
    }}>
      {/* Inner Core */}
      <div style={{
        background: 'var(--bg-card-core)',
        borderRadius: 'calc(var(--radius-lg) - 2px)',
        padding: '22px 24px'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: 'var(--accent-bronze)',
                background: 'rgba(245, 158, 11, 0.12)',
                padding: '2px 7px',
                borderRadius: '3px',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                MEDALLION DEEP-DIVE
              </span>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Cloudflare R2 Storage & Partition Breakdown
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              BUCKET: <code style={{ color: 'var(--text-primary)', fontWeight: 700 }}>uth-scientific-lakehouse</code> (Zero Egress Fees · S3 Compatible API)
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            flexWrap: 'wrap'
          }}>
            {/* Zone Filter Chips */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              padding: '2px',
              gap: '2px'
            }}>
              {['ALL', 'BRONZE', 'SILVER', 'GOLD'].map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setActiveZone(z)}
                  style={{
                    background: activeZone === z ? 'var(--text-primary)' : 'transparent',
                    border: 'none',
                    color: activeZone === z ? 'var(--bg-surface)' : 'var(--text-secondary)',
                    padding: '4px 8px',
                    borderRadius: '3px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {z}
                </button>
              ))}
            </div>

            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              padding: '6px 12px',
              borderRadius: '4px'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>TOTAL FOOTPRINT: </span>
              <strong style={{ color: 'var(--text-primary)' }}>5.524 GB</strong>
            </div>

            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              padding: '6px 12px',
              borderRadius: '4px'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>FREE TIER LIMIT: </span>
              <strong style={{ color: 'var(--accent-emerald)' }}>10.00 GB</strong>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
            textAlign: 'left'
          }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid var(--border-muted)',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <th style={{ padding: '10px 14px' }}>Zone</th>
                <th style={{ padding: '10px 14px' }}>Dataset Name & Description</th>
                <th style={{ padding: '10px 14px' }}>Format</th>
                <th style={{ padding: '10px 14px' }}>Items Count</th>
                <th style={{ padding: '10px 14px' }}>Payload Size</th>
                <th style={{ padding: '10px 14px' }}>Lakehouse Partition Key</th>
              </tr>
            </thead>
            <tbody>
              {filteredLayers.map((layer, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: idx < filteredLayers.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  <td style={{ padding: '14px 14px', verticalAlign: 'top' }}>
                    <span style={{
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: 'var(--bg-surface-elevated)',
                      color: layer.color,
                      border: '1px solid var(--border-muted)',
                      letterSpacing: '0.04em'
                    }}>
                      {layer.zone}
                    </span>
                  </td>
                  <td style={{ padding: '14px 14px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                      {layer.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5, maxWidth: '420px' }}>
                      {layer.description}
                    </div>
                  </td>
                  <td style={{ padding: '14px 14px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                    {layer.format}
                  </td>
                  <td style={{ padding: '14px 14px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600, verticalAlign: 'top', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {layer.itemsCount}
                  </td>
                  <td style={{ padding: '14px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: layer.color, verticalAlign: 'top', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {layer.sizeBytes}
                  </td>
                  <td style={{ padding: '14px 14px', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <code style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        background: 'var(--bg-surface-elevated)',
                        padding: '3px 8px',
                        borderRadius: '3px',
                        border: '1px solid var(--border-subtle)',
                        maxWidth: '280px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {layer.r2Location}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopy(layer.r2Location)}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-muted)',
                          color: copiedPath === layer.r2Location ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          padding: '3px 7px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          flexShrink: 0
                        }}
                        title="Copy S3 partition path"
                      >
                        {copiedPath === layer.r2Location ? 'COPIED' : 'COPY'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
