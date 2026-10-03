import { useState, useCallback, type FC, type ReactNode } from 'react';
import { ToastContext, type ToastItem } from '../context/ToastContext';

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const duration = toast.duration ?? 3200;

    setToasts((prev) => {
      const next = [...prev, { ...toast, id }];
      if (next.length > 3) {
        return next.slice(next.length - 3);
      }
      return next;
    });

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {/* Toast Notification Container */}
      <aside
        aria-label="Notifications"
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxWidth: '380px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => {
          const typeColors = {
            success: {
              border: 'rgba(52, 211, 153, 0.4)',
              bg: 'var(--bg-card-core)',
              badge: 'var(--accent-emerald)',
              text: 'var(--text-primary)',
              label: 'SUCCESS',
            },
            info: {
              border: 'rgba(96, 165, 250, 0.4)',
              bg: 'var(--bg-card-core)',
              badge: 'var(--accent-silver)',
              text: 'var(--text-primary)',
              label: 'INFO',
            },
            warning: {
              border: 'rgba(251, 191, 36, 0.4)',
              bg: 'var(--bg-card-core)',
              badge: 'var(--accent-bronze)',
              text: 'var(--text-primary)',
              label: 'WARNING',
            },
            error: {
              border: 'rgba(248, 113, 113, 0.4)',
              bg: 'var(--bg-card-core)',
              badge: 'var(--accent-red)',
              text: 'var(--text-primary)',
              label: 'ERROR',
            },
          }[t.type];

          return (
            <div
              key={t.id}
              role="status"
              style={{
                pointerEvents: 'auto',
                background: typeColors.bg,
                border: `1px solid ${typeColors.border}`,
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--card-shadow)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11.5px',
                color: typeColors.text,
                backdropFilter: 'blur(12px)',
                animation: 'toastSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              }}
            >
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  padding: '2px 5px',
                  borderRadius: '3px',
                  background: `${typeColors.badge}1f`,
                  color: typeColors.badge,
                  border: `1px solid ${typeColors.badge}40`,
                }}
              >
                [{typeColors.label}]
              </span>
              <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss notification"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '2px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
};
