/**
 * Mining service - topic modeling and citation graph queries.
 * (placeholder for future endpoints)
 */

import { apiClient, ENDPOINTS } from '../api';
import type { TrendingTopic } from '@/types/entities';

const USE_MOCK = true;

export interface CitationGraphNode {
  id: string;
  paperId: string;
  title: string;
  citations: number;
  year: number;
}

export interface CitationGraphEdge {
  source: string;
  target: string;
  weight: number;
}

export interface CitationGraph {
  nodes: CitationGraphNode[];
  edges: CitationGraphEdge[];
}

export const miningService = {
  async getTopics(): Promise<TrendingTopic[]> {
    if (USE_MOCK) return [];
    return apiClient.get<TrendingTopic[]>(ENDPOINTS.MINING.TOPICS);
  },

  async getCitationGraph(rootPaperId?: string, depth = 2): Promise<CitationGraph> {
    if (USE_MOCK) return { nodes: [], edges: [] };
    return apiClient.get<CitationGraph>(ENDPOINTS.MINING.CITATION_GRAPH, {
      // headers: { root: rootPaperId ?? '', depth: String(depth) },
    });
  },
};
