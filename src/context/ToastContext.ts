import { createContext, useContext } from 'react';

export interface ToastItem {
  id: string;
  type: 'success' | 'info' | 'error' | 'warning';
  message: string;
  duration?: number;
}

export interface ToastContextType {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
