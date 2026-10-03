// API layer
export * from './api';

// Feature services
export { papersService } from './papers';
export type { PaperListParams } from './papers';
export { ragService } from './rag';
export { analyticsService } from './analytics';
export type { TimelineParams } from './analytics';
export { miningService } from './mining';
export type {
  CitationGraph,
  CitationGraphNode,
  CitationGraphEdge,
} from './mining';
