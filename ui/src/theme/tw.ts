/**
 * Re-export of NativeWind's `tw` proxy + ready-made theme class maps.
 * Components can use either inline `className="..."` or these presets.
 *
 * The `tw` function reads the same JIT engine as `className` and returns
 * the resolved style object — useful when mixing className with style props.
 */

import { tw as nativewindTw } from 'nativewind';

/** NativeWind `tw` proxy — works for both className strings and at runtime. */
export const tw = nativewindTw;

/**
 * Semantic color tokens that adapt to the active color scheme via Tailwind.
 * Use these as `style={tw\`bg-bg text-text border-border\``}.
 */
export const twColors = {
  // Light backgrounds
  bg: 'bg-surface dark:bg-surface-dark',
  surface: 'bg-surface dark:bg-surface-800',
  card: 'bg-white dark:bg-surface-800',
  elevated: 'bg-white dark:bg-surface-700',

  // Text
  text: 'text-text dark:text-white',
  textSecondary: 'text-text-secondary dark:text-surface-300',
  textMuted: 'text-text-muted dark:text-surface-400',
  textInverse: 'text-white dark:text-text',

  // Borders
  border: 'border-border dark:border-surface-700',
  divider: 'border-border dark:border-surface-700',

  // Brand
  accent: 'bg-brand-accent',
  accentText: 'text-brand-accent',
} as const;

/**
 * Common Tailwind class compositions for shared UI patterns.
 */
export const twStyles = {
  card: 'bg-white dark:bg-surface-800 border border-border dark:border-surface-700 rounded-lg p-base',
  cardElevated:
    'bg-white dark:bg-surface-800 border border-border dark:border-surface-700 rounded-lg p-base shadow-soft-md',
  input:
    'bg-surface-50 dark:bg-surface-800 border border-border dark:border-surface-700 rounded-lg px-base py-md text-body text-text dark:text-white',
  chip: 'px-base py-sm rounded-full text-caption font-semibold',
  primaryBtn: 'bg-brand-accent px-lg py-md rounded-lg font-semibold',
  secondaryBtn: 'bg-surface-50 dark:bg-surface-800 border border-border dark:border-surface-700 px-lg py-md rounded-lg font-semibold',
  row: 'flex-row items-center',
  rowGap: 'flex-row items-center gap-md',
  col: 'flex-col',
  colGap: 'flex-col gap-md',
  flex1: 'flex-1',
  center: 'items-center justify-center',
} as const;
