/**
 * Analytics service - summary stats, category breakdowns, timelines, trends.
 */

import { apiClient, ENDPOINTS } from '../api';
import {
  MOCK_ANALYTICS_SUMMARY,
  MOCK_CATEGORY_STATS,
  MOCK_TIMELINE,
  MOCK_TRENDING_TOPICS,
} from '@/data/mockData';
import type {
  AnalyticsSummary,
  CategoryStats,
  TimelineDataPoint,
  TrendingTopic,
} from '@/types/entities';

const USE_MOCK = true;

export interface TimelineParams {
  range?: '7d' | '30d' | '90d' | '1y';
  category?: string;
}

export const analyticsService = {
  async getSummary(): Promise<AnalyticsSummary> {
    if (USE_MOCK) return MOCK_ANALYTICS_SUMMARY;
    return apiClient.get<AnalyticsSummary>(ENDPOINTS.ANALYTICS.SUMMARY);
  },

  async getCategoryStats(): Promise<CategoryStats[]> {
    if (USE_MOCK) return MOCK_CATEGORY_STATS;
    return apiClient.get<CategoryStats[]>(ENDPOINTS.ANALYTICS.CATEGORIES);
  },

  async getTimeline(params: TimelineParams = {}): Promise<TimelineDataPoint[]> {
    if (USE_MOCK) return MOCK_TIMELINE;
    return apiClient.get<TimelineDataPoint[]>(ENDPOINTS.ANALYTICS.TIMELINE, {
      // headers: { 'X-Params': JSON.stringify(params) },
    });
  },

  async getTrendingTopics(limit = 10): Promise<TrendingTopic[]> {
    if (USE_MOCK) return MOCK_TRENDING_TOPICS.slice(0, limit);
    return apiClient.get<TrendingTopic[]>(ENDPOINTS.ANALYTICS.TRENDING, {
      // headers: { 'X-Limit': String(limit) },
    });
  },
};
