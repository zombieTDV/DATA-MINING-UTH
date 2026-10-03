/**
 * Domain entity: Paper.
 * Mirrors the backend Paper record returned by the API.
 */

export type ArxivCategory =
  | 'cs.AI'
  | 'cs.LG'
  | 'cs.CV'
  | 'cs.CL'
  | 'cs.IR'
  | 'cs.NE'
  | 'stat.ML'
  | 'math.OC'
  | 'other';

export interface Author {
  name: string;
  affiliation?: string;
  orcid?: string;
}

export interface Paper {
  id: string;
  arxivId: string;
  title: string;
  abstract: string;
  authors: Author[];
  categories: ArxivCategory[];
  primaryCategory: ArxivCategory;
  publishedDate: string; // ISO 8601
  updatedDate?: string;
  pdfUrl: string;
  htmlUrl?: string;
  citations: number;
  comments?: string;
  doi?: string;
}
