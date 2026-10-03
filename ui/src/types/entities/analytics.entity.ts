/**
 * Domain entity: Analytics records.
 */

import type { ArxivCategory } from './paper.entity';

export interface TrendingTopic {
  id: string;
  name: string;
  category: ArxivCategory;
  paperCount: number;
  growthPercent: number;
  description: string;
  keywords?: string[];
}

export interface CategoryStats {
  category: ArxivCategory;
  paperCount: number;
  totalCitations: number;
  avgCitationsPerPaper: number;
  topAuthors: { name: string; count: number }[];
}

export interface TimelineDataPoint {
  date: string; // YYYY-MM-DD
  count: number;
  category?: ArxivCategory;
}

export interface AnalyticsSummary {
  totalPapers: number;
  totalCitations: number;
  totalCategories: number;
  totalAuthors: number;
  lastUpdated: string;
}
