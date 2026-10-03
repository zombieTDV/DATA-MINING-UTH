/**
 * Search filters and result records.
 */

import type { ArxivCategory, Paper } from './paper.entity';
import type { PaperChunk } from './section.entity';

export interface SearchFilters {
  query?: string;
  categories?: ArxivCategory[];
  authors?: string[];
  dateFrom?: string; // ISO
  dateTo?: string; // ISO
  minCitations?: number;
  maxCitations?: number;
}

export interface SearchResult {
  paper: Paper;
  relevanceScore: number;
  matchedChunks: PaperChunk[];
  highlights?: string[];
}
