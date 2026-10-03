/**
 * Auth store — placeholder for future authentication integration.
 */

import { create } from 'zustand';
import type { User } from '@/types/entities';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updatePreferences: (prefs: Partial<User['preferences']>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
  updatePreferences: (prefs) =>
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            preferences: { ...state.user.preferences, ...prefs } as User['preferences'],
          }
        : null,
    })),
}));
