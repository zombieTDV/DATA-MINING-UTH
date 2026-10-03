import { useCallback, useState } from 'react';
import { papersService, PaperListParams } from '@/services/papers';
import type { Paper } from '@/types/entities';
import type { PaginatedResponse } from '@/types/responses';
import { useAsync, getErrorMessage } from './useAsync';

export function usePapersList(params: PaperListParams = {}) {
  const [pagination, setPagination] = useState({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
  });

  const fetcher = useCallback(
    () => papersService.list({ ...params, ...pagination }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pagination.page, pagination.pageSize, params.category, params.sortBy],
  );

  const state = useAsync<PaginatedResponse<Paper>>(fetcher, [
    pagination.page,
    pagination.pageSize,
    params.category,
    params.sortBy,
  ]);

  const nextPage = () => {
    if (state.data?.pagination.hasNext) {
      setPagination((p) => ({ ...p, page: p.page + 1 }));
    }
  };

  const prevPage = () => {
    if (state.data?.pagination.hasPrev) {
      setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }));
    }
  };

  return {
    ...state,
    pagination: state.data?.pagination,
    errorMessage: state.error ? getErrorMessage(state.error) : null,
    nextPage,
    prevPage,
  };
}

export function usePaper(id: string | null) {
  const fetcher = useCallback(
    () => (id ? papersService.getById(id) : Promise.resolve(null)),
    [id],
  );
  return useAsync<Paper | null>(fetcher, [id], { immediate: !!id });
}
