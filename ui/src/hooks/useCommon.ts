import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Track previous value of a state/prop.
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

/**
 * Force a re-render (rarely needed; use sparingly).
 */
export function useForceUpdate() {
  return useState(0)[1];
}

/**
 * Returns a stable callback that always sees the latest state.
 * Useful for async handlers.
 */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

/**
 * Toggle boolean state.
 */
export function useToggle(initial = false): [boolean, () => void, (v: boolean) => void] {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle, setValue];
}
