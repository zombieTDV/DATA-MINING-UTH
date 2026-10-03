/**
 * Theme store (light/dark/auto) using Zustand.
 * Persisted across app restarts via AsyncStorage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  resolvedMode: 'light' | 'dark';
}

const useSystemColorScheme = () => Appearance.getColorScheme();

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'auto',
      resolvedMode: (useSystemColorScheme() === 'dark' ? 'dark' : 'light'),
      setMode: (mode) => {
        const resolved = mode === 'auto'
          ? (useSystemColorScheme() === 'dark' ? 'dark' : 'light')
          : mode;
        set({ mode, resolvedMode: resolved });
      },
      toggle: () => {
        const current = get().resolvedMode;
        set({ mode: current, resolvedMode: current === 'dark' ? 'light' : 'dark' });
      },
    }),
    {
      name: 'uth-theme-storage',
      storage: createJSONStorage(() => {
        // Lazy require to avoid native module issues in SSR / web
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          return require('@react-native-async-storage/async-storage').default;
        } catch {
          // Fallback to in-memory storage on web
          return undefined as any;
        }
      }),
    },
  ),
);
