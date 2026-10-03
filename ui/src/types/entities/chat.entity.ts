/**
 * Domain entity: Chat & RAG session.
 */

import type { ArxivCategory } from './paper.entity';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Citation {
  paperId: string;
  paperTitle: string;
  section: string;
  arxivId: string;
  url?: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  citations?: Citation[];
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  // Optional metadata
  category?: ArxivCategory;
  pinned?: boolean;
}
