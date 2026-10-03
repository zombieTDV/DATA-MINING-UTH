import { useCallback, useMemo, useState } from 'react';
import { papersService } from '@/services/papers';
import { useDebounce } from './useDebounce';
import type { ArxivCategory, SearchResult } from '@/types/entities';
import { getErrorMessage } from './useAsync';

export interface UseSearchOptions {
  categories?: ArxivCategory[];
  debounceMs?: number;
}

export function useSearch(options: UseSearchOptions = {}) {
  const { categories = [], debounceMs = 300 } = options;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounced = useDebounce(query, debounceMs);

  const runSearch = useCallback(
    async (q: string) => {
      setLoading(true);
      setError(null);
      try {
        const r = await papersService.search({
          query: q,
          categories: categories.length ? categories : undefined,
        });
        setResults(r);
      } catch (err) {
        setError(getErrorMessage(err));
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [categories],
  );

  // Trigger when debounced query or filters change
  useMemo(() => {
    runSearch(debounced);
  }, [debounced, runSearch]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    hasQuery: debounced.length > 0,
  };
}
