import { useEffect, type FC } from 'react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: '1', desc: 'Switch to Schematic & Overview tab' },
    { key: '2', desc: 'Switch to DuckDB EDA Stats tab' },
    { key: '3', desc: 'Switch to 4 Mining Pillars tab' },
    { key: '4', desc: 'Switch to Scientific RAG Console tab' },
    { key: '5', desc: 'Switch to Real-time Telemetry Stream tab' },
    { key: 'T', desc: 'Toggle Dark / Light Mode' },
    { key: 'Ctrl + Enter', desc: 'Execute / submit scientific RAG query' },
    { key: '?', desc: 'Open / close this keyboard shortcuts guide' },
    { key: 'Esc', desc: 'Dismiss active modal or overlay' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(5, 7, 12, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card-shell)',
          border: '1px solid var(--border-highlight)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--card-shadow)',
          maxWidth: '520px',
          width: '100%',
          padding: '4px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            background: 'var(--bg-card-core)',
            borderRadius: 'calc(var(--radius-lg) - 2px)',
            padding: '20px 24px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: 'var(--accent-silver)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                padding: '2px 6px',
                borderRadius: '3px',
              }}>
                [GUIDE]
              </span>
              <h2 id="shortcuts-title" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-mono)' }}>
                KEYBOARD SHORTCUTS REFERENCE
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close shortcuts modal"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '4px',
              }}
            >
              ✕
            </button>
          </div>

          <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Accelerate your observatory workflow with tactile hardware-style keybindings:
          </p>

          {/* Shortcuts Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {shortcuts.map((s, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>{s.desc}</span>
                <span className="keycap" style={{ fontSize: '11px', padding: '3px 8px' }}>
                  {s.key}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '18px', textAlign: 'right' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--bg-card-shell)',
                border: '1px solid var(--border-muted)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11.5px',
                fontWeight: 700,
                padding: '6px 16px',
                cursor: 'pointer',
              }}
            >
              [CLOSE ESC]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
