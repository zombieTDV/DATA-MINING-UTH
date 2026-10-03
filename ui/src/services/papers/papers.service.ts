/**
 * Paper service - fetches papers, search, and metadata.
 * Replace mock implementations with apiClient calls when backend is ready.
 */

import { apiClient, ENDPOINTS } from '../api';
import { MOCK_PAPERS } from '@/data/mockData';
import type { Paper, PaperChunk, SearchFilters } from '@/types/entities';
import type { PaginatedResponse, SearchResult } from '@/types/responses';

export interface PaperListParams {
  page?: number;
  pageSize?: number;
  category?: string;
  sortBy?: 'date' | 'citations' | 'relevance';
}

const USE_MOCK = true; // Toggle to true while backend is not connected

export const papersService = {
  /**
   * List papers with pagination & optional category filter.
   */
  async list(params: PaperListParams = {}): Promise<PaginatedResponse<Paper>> {
    if (USE_MOCK) {
      return mockList(params);
    }
    return apiClient.get<PaginatedResponse<Paper>>(ENDPOINTS.PAPERS.LIST, {
      // headers: { 'X-Query': JSON.stringify(params) },
    });
  },

  /**
   * Get a single paper by id.
   */
  async getById(id: string): Promise<Paper> {
    if (USE_MOCK) {
      const paper = MOCK_PAPERS.find((p) => p.id === id);
      if (!paper) throw new Error(`Paper ${id} not found`);
      return paper;
    }
    return apiClient.get<Paper>(ENDPOINTS.PAPERS.DETAIL(id));
  },

  /**
   * Get paper sections (parsed content).
   */
  async getSections(id: string): Promise<PaperChunk[]> {
    if (USE_MOCK) {
      return [];
    }
    return apiClient.get<PaperChunk[]>(ENDPOINTS.PAPERS.SECTIONS(id));
  },

  /**
   * Search papers using a query and filters.
   */
  async search(filters: SearchFilters): Promise<SearchResult[]> {
    if (USE_MOCK) {
      return mockSearch(filters);
    }
    return apiClient.post<SearchResult[]>(ENDPOINTS.PAPERS.SEARCH, filters);
  },
};

// ---------------- Mock implementations ----------------

async function mockList(params: PaperListParams): Promise<PaginatedResponse<Paper>> {
  const { page = 1, pageSize = 20, category, sortBy = 'date' } = params;
  await new Promise((r) => setTimeout(r, 300)); // simulate latency

  let items = [...MOCK_PAPERS];
  if (category) {
    items = items.filter((p) => p.primaryCategory === category);
  }
  if (sortBy === 'citations') {
    items.sort((a, b) => b.citations - a.citations);
  }

  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return {
    items: paged,
    pagination: {
      page,
      pageSize,
      total: items.length,
      totalPages: Math.ceil(items.length / pageSize),
      hasNext: start + pageSize < items.length,
      hasPrev: page > 1,
    },
  };
}

async function mockSearch(filters: SearchFilters): Promise<SearchResult[]> {
  await new Promise((r) => setTimeout(r, 250));
  const q = filters.query?.toLowerCase() || '';

  return MOCK_PAPERS
    .filter((p) => {
      const matchQ =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.abstract.toLowerCase().includes(q);
      const matchCat =
        !filters.categories?.length ||
        filters.categories.includes(p.primaryCategory);
      return matchQ && matchCat;
    })
    .map((paper) => ({
      paper,
      relevanceScore: 0.7 + Math.random() * 0.3,
      matchedChunks: [],
    }));
}
