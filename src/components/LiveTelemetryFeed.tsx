import { useState, useEffect } from 'react';
import { TELEMETRY_ENTRIES, type LogEntry } from '../data/lakehouseData';
import { subscribeTelemetry } from '../api/client';

export function LiveTelemetryFeed() {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>('log-01');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [copiedLogs, setCopiedLogs] = useState<boolean>(false);
  const [liveEntries, setLiveEntries] = useState<LogEntry[]>(TELEMETRY_ENTRIES);
  const [isLiveSSE, setIsLiveSSE] = useState<boolean>(false);

  // Subscribe to real Server-Sent Events (SSE) telemetry from FastAPI
  useEffect(() => {
    if (isPaused) return;

    const unsubscribe = subscribeTelemetry(
      (event) => {
        if (!event.isFallback) {
          setIsLiveSSE(true);
        }
        const newEntry: LogEntry = {
          id: `sse-${Date.now()}-${Math.random()}`,
          timestamp: event.timestamp.replace('T', ' ').slice(0, 23),
          level: (event.level as LogEntry['level']) || 'INFO',
          phase: (event.stage as LogEntry['phase']) || 'MINING',
          source: event.isFallback ? 'client/offline-cache' : 'backend/app/main.py:8000',
          message: event.message,
          detail: event.detail || (event.isFallback ? 'Offline Snapshot Replay' : 'FastAPI Server-Sent Event (SSE) Stream'),
        };
        setLiveEntries((prev) => [newEntry, ...prev.slice(0, 24)]);
      },
      () => {
        setIsLiveSSE(false);
      }
    );

    return () => unsubscribe();
  }, [isPaused]);

  const filteredLogs = liveEntries.filter(log => {
    if (filterLevel !== 'ALL' && log.level !== filterLevel) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return log.message.toLowerCase().includes(q) ||
             log.source.toLowerCase().includes(q) ||
             log.phase.toLowerCase().includes(q);
    }
    return true;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'SUCCESS': return 'var(--accent-emerald)';
      case 'QUERY': return 'var(--accent-silver)';
      case 'STORAGE': return 'var(--accent-bronze)';
      default: return 'var(--text-muted)';
    }
  };

  const handleCopyLogs = () => {
    const text = filteredLogs.map(l => `[${l.timestamp}] [${l.level}/${l.phase}] [${l.source}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  return (
    <div style={{
      width: '100%',
      background: 'var(--bg-card-shell)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--card-shadow)',
      padding: '4px',
      position: 'relative'
    }}>
      {/* Double-Bezel Inner Core */}
      <div style={{
        background: 'var(--bg-card-core)',
        borderRadius: 'calc(var(--radius-lg) - 2px)',
        padding: '22px 24px'
      }}>
        {/* Expanded Terminal Header Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: isPaused ? 'var(--accent-bronze)' : isLiveSSE ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                boxShadow: isPaused
                  ? '0 0 10px rgba(245, 158, 11, 0.6)'
                  : isLiveSSE
                    ? '0 0 10px rgba(16, 185, 129, 0.6)'
                    : '0 0 10px rgba(245, 158, 11, 0.4)',
                transition: 'background 0.2s ease'
              }} />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Pipeline Telemetry & Execution Log Stream
              </h3>
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                background: isPaused ? 'rgba(245, 158, 11, 0.12)' : isLiveSSE ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                border: isPaused ? '1px solid rgba(245, 158, 11, 0.3)' : isLiveSSE ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                padding: '2px 8px',
                borderRadius: '4px',
                color: isPaused ? 'var(--accent-bronze)' : isLiveSSE ? 'var(--accent-emerald)' : 'var(--accent-amber)'
              }}>
                {isPaused ? 'STREAM PAUSED' : isLiveSSE ? 'LIVE SSE STREAM' : 'OFFLINE REPLAY'}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              SOURCE AUDIT: {isLiveSSE ? 'FastAPI SSE Stream (http://127.0.0.1:8000/api/mining/telemetry/stream)' : 'Local Lakehouse Telemetry Snapshot (143,523 Vectors)'}
            </p>
          </div>

          {/* Controls: Stream Actions, Filters & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Pause / Resume Button */}
            <button
              onClick={() => setIsPaused(p => !p)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-muted)',
                color: isPaused ? 'var(--accent-emerald)' : 'var(--text-primary)',
                padding: '5px 11px',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{isPaused ? '▶ RESUME' : '⏸ PAUSE'}</span>
            </button>

            {/* Copy Logs Button */}
            <button
              onClick={handleCopyLogs}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-muted)',
                color: copiedLogs ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                padding: '5px 11px',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {copiedLogs ? 'COPIED BUFFER' : 'COPY LOGS'}
            </button>

            {/* Level Filter Chips */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              padding: '2px'
            }}>
              {['ALL', 'SUCCESS', 'QUERY', 'STORAGE', 'INFO'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  style={{
                    background: filterLevel === lvl ? 'var(--text-primary)' : 'transparent',
                    border: 'none',
                    color: filterLevel === lvl ? 'var(--bg-surface)' : 'var(--text-secondary)',
                    padding: '4px 9px',
                    borderRadius: '3px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Quick Search Input */}
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-muted)',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)',
                outline: 'none',
                width: '160px'
              }}
            />
          </div>
        </div>

        {/* Expanded Terminal Log Table */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden'
        }}>
          {/* Table Subheader */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '190px 105px 180px 1fr 40px',
            gap: '12px',
            padding: '10px 16px',
            background: 'var(--bg-surface-elevated)',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}>
            <div>Timestamp (UTC+7)</div>
            <div>Level / Phase</div>
            <div>Source File</div>
            <div>Pipeline Event Message</div>
            <div style={{ textAlign: 'right' }}>Info</div>
          </div>

          {/* Rows */}
          <div style={{
            maxHeight: '480px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {filteredLogs.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                No telemetry entries match the filter criteria.
              </div>
            ) : (
              filteredLogs.map((entry) => {
                const isExpanded = expandedLogId === entry.id;
                return (
                  <div
                    key={entry.id}
                    onClick={() => setExpandedLogId(isExpanded ? null : entry.id)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isExpanded ? 'var(--bg-surface-elevated)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '190px 105px 180px 1fr 40px',
                      gap: '12px',
                      padding: '13px 16px',
                      alignItems: 'center',
                      fontSize: '13px',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {/* Timestamp */}
                      <div style={{ color: 'var(--text-secondary)', fontSize: '11.5px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {entry.timestamp}
                      </div>

                      {/* Level / Phase Badge */}
                      <div>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 7px',
                          borderRadius: '3px',
                          fontSize: '10.5px',
                          fontWeight: 800,
                          background: 'var(--bg-surface)',
                          color: getLevelColor(entry.level),
                          border: '1px solid var(--border-subtle)'
                        }}>
                          [{entry.phase}]
                        </span>
                      </div>

                      {/* Source File */}
                      <div style={{
                        color: 'var(--text-secondary)',
                        fontSize: '11.5px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: 500
                      }}>
                        {entry.source}
                      </div>

                      {/* Event Message */}
                      <div style={{
                        color: 'var(--text-primary)',
                        fontSize: '12.5px',
                        fontWeight: 500,
                        wordBreak: 'break-word',
                        lineHeight: 1.5
                      }}>
                        {entry.message}
                      </div>

                      {/* Expand Indicator */}
                      <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700 }}>
                        {isExpanded ? '▼' : '▶'}
                      </div>
                    </div>

                    {/* Expanded Detail Box */}
                    {isExpanded && entry.detail && (
                      <div style={{
                        padding: '12px 18px',
                        background: 'var(--bg-card-shell)',
                        borderTop: '1px dashed var(--border-subtle)',
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <span style={{ color: 'var(--accent-silver)', fontWeight: 700 }}>METADATA:</span>
                        <span>{entry.detail}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Status Bar */}
        <div style={{
          marginTop: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)'
        }}>
          <span>SHOWING {filteredLogs.length} OF {liveEntries.length} EVENTS</span>
          <span>DOUBLE-BUFFERED TERMINAL STREAM : 0 ERRORS REPORTED</span>
        </div>
      </div>
    </div>
  );
}
