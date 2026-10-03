/**
 * Color palette for UTH Data Mining UI.
 * Supports both light and dark modes.
 */

export const Colors = {
  light: {
    // Brand
    primary: '#0F172A',
    primaryLight: '#1E293B',
    accent: '#3B82F6',
    accentLight: '#60A5FA',

    // Backgrounds
    background: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceElevated: '#FFFFFF',
    card: '#FFFFFF',

    // Text
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',

    // Borders
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    divider: '#E2E8F0',

    // States
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Categories (arXiv domains)
    csAI: '#8B5CF6',
    csLG: '#3B82F6',
    csCL: '#10B981',
    csCV: '#F59E0B',
    statML: '#EC4899',
    other: '#6B7280',
  },
  dark: {
    // Brand
    primary: '#F8FAFC',
    primaryLight: '#E2E8F0',
    accent: '#60A5FA',
    accentLight: '#93C5FD',

    // Backgrounds
    background: '#0F172A',
    surface: '#1E293B',
    surfaceElevated: '#334155',
    card: '#1E293B',

    // Text
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#64748B',
    textInverse: '#0F172A',

    // Borders
    border: '#334155',
    borderLight: '#1E293B',
    divider: '#334155',

    // States
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',

    // Categories
    csAI: '#A78BFA',
    csLG: '#60A5FA',
    csCL: '#34D399',
    csCV: '#FBBF24',
    statML: '#F472B6',
    other: '#9CA3AF',
  },
} as const;

export type ColorScheme = typeof Colors.light;
