import { useCallback } from 'react';
import { analyticsService, TimelineParams } from '@/services/analytics';
import type {
  AnalyticsSummary,
  CategoryStats,
  TimelineDataPoint,
  TrendingTopic,
} from '@/types/entities';
import { useAsync } from './useAsync';

export function useAnalyticsSummary() {
  return useAsync<AnalyticsSummary>(() => analyticsService.getSummary(), []);
}

export function useCategoryStats() {
  return useAsync<CategoryStats[]>(() => analyticsService.getCategoryStats(), []);
}

export function useTimeline(params: TimelineParams = {}) {
  const fetcher = useCallback(
    () => analyticsService.getTimeline(params),
    [params.range, params.category],
  );
  return useAsync<TimelineDataPoint[]>(fetcher, [params.range, params.category]);
}

export function useTrendingTopics(limit = 10) {
  const fetcher = useCallback(
    () => analyticsService.getTrendingTopics(limit),
    [limit],
  );
  return useAsync<TrendingTopic[]>(fetcher, [limit]);
}
