/**
 * Async data hook — minimal, zero-dependency data fetcher with loading/error states.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/services/api';

export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  setData: (data: T | null) => void;
}

interface UseAsyncOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps: any[] = [],
  options: UseAsyncOptions = { immediate: true },
): UseAsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(options.immediate !== false);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);
  const fnRef = useRef(asyncFn);
  fnRef.current = asyncFn;

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fnRef.current();
      if (mounted.current) {
        setData(result);
        options.onSuccess?.(result);
      }
    } catch (err) {
      if (mounted.current) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        options.onError?.(e);
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mounted.current = true;
    if (options.immediate !== false) {
      execute();
    }
    return () => {
      mounted.current = false;
    };
  }, [execute, options.immediate]);

  return { data, loading, error, refetch: execute, setData };
}

/**
 * Helper to format an error message from any thrown value.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return String(err);
}
