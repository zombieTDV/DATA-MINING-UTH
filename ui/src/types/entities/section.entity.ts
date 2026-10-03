/**
 * Domain entity: Paper section & chunk.
 */

export type SectionType =
  | 'abstract'
  | 'introduction'
  | 'methodology'
  | 'experiments'
  | 'conclusion'
  | 'other';

export interface PaperSection {
  paperId: string;
  title: string;
  type: SectionType;
  content: string;
  order: number;
  wordCount?: number;
}

export interface PaperChunk {
  chunkId: string;
  paperId: string;
  sectionTitle: string;
  sectionType: SectionType;
  text: string;
  contextText: string;
  wordCount: number;
  relevanceScore?: number;
}
