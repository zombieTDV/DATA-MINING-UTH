/**
 * RAG service - chat sessions, queries, and streaming.
 * Mirrors the backend ScientificRAGEngine API surface.
 */

import { apiClient, ENDPOINTS } from '../api';
import { MOCK_CHAT_SESSIONS, MOCK_PAPERS } from '@/data/mockData';
import type { ChatSession, ChatMessage, Citation } from '@/types/entities';
import type { RagQueryRequest, RagQueryResponse, RagStreamChunk } from '@/types/responses';

const USE_MOCK = true;

export const ragService = {
  /**
   * Send a single query to the RAG engine and get a full response.
   */
  async query(req: RagQueryRequest): Promise<RagQueryResponse> {
    if (USE_MOCK) {
      return mockQuery(req);
    }
    return apiClient.post<RagQueryResponse>(ENDPOINTS.RAG.QUERY, req);
  },

  /**
   * Open a streaming connection. Returns an async iterator of chunks.
   */
  async *streamQuery(req: RagQueryRequest): AsyncGenerator<RagStreamChunk> {
    if (USE_MOCK) {
      yield* mockStream(req);
      return;
    }
    const response = await fetch(
      apiClient['request'] ? `${ENDPOINTS.RAG.QUERY_STREAM}` : '',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      },
    );
    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            yield JSON.parse(line.slice(6)) as RagStreamChunk;
          } catch {
            // skip malformed
          }
        }
      }
    }
  },

  /**
   * Get all chat sessions.
   */
  async listSessions(): Promise<ChatSession[]> {
    if (USE_MOCK) return MOCK_CHAT_SESSIONS;
    return apiClient.get<ChatSession[]>(ENDPOINTS.RAG.SESSIONS);
  },

  /**
   * Get a single session with full message history.
   */
  async getSession(id: string): Promise<ChatSession> {
    if (USE_MOCK) {
      const s = MOCK_CHAT_SESSIONS.find((s) => s.id === id);
      if (!s) throw new Error(`Session ${id} not found`);
      return s;
    }
    return apiClient.get<ChatSession>(ENDPOINTS.RAG.SESSION_DETAIL(id));
  },

  /**
   * Create a new empty chat session.
   */
  async createSession(title?: string): Promise<ChatSession> {
    if (USE_MOCK) {
      return {
        id: `session-${Date.now()}`,
        title: title || 'Cuộc trò chuyện mới',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return apiClient.post<ChatSession>(ENDPOINTS.RAG.SESSIONS, { title });
  },

  /**
   * Delete a chat session.
   */
  async deleteSession(id: string): Promise<void> {
    if (USE_MOCK) return;
    return apiClient.delete<void>(ENDPOINTS.RAG.SESSION_DETAIL(id));
  },
};

// ---------------- Mock implementations ----------------

async function mockQuery(req: RagQueryRequest): Promise<RagQueryResponse> {
  await new Promise((r) => setTimeout(r, 800));
  const userMessage: ChatMessage = {
    id: `msg-${Date.now()}`,
    role: 'user',
    content: req.query,
    timestamp: new Date().toISOString(),
  };
  const assistantMessage: ChatMessage = {
    id: `msg-${Date.now() + 1}`,
    role: 'assistant',
    content: buildMockAnswer(req.query),
    timestamp: new Date().toISOString(),
    citations: pickMockCitations(req.query),
  };
  return {
    userMessage,
    assistantMessage,
    sources: MOCK_PAPERS.slice(0, 2),
    retrievalTimeMs: 142,
    generationTimeMs: 1240,
  };
}

async function* mockStream(req: RagQueryRequest): AsyncGenerator<RagStreamChunk> {
  const answer = buildMockAnswer(req.query);
  const words = answer.split(/(\s+)/);
  let accumulated = '';
  for (const word of words) {
    accumulated += word;
    yield { type: 'token', content: word };
    await new Promise((r) => setTimeout(r, 25));
  }
  yield { type: 'done', content: accumulated };
}

function buildMockAnswer(query: string): string {
  return `Dựa trên các bài báo khoa học trong kho dữ liệu, đây là câu trả lời cho câu hỏi: "${query}".\n\nCâu trả lời này được sinh ra bởi RAG engine sử dụng kết hợp:\n- **Hybrid Search** (Dense Embeddings + BM25)\n- **Cross-Encoder Reranking** (bge-reranker)\n- **Contextual Grounding** với strict citation enforcement\n\nReferences:\n[Paper: FlashAttention-3, Section: Abstract] [Paper: DPO, Section: Methodology]`;
}

function pickMockCitations(_query: string): Citation[] {
  return [
    { paperId: 'arxiv:2401.12345', paperTitle: 'FlashAttention-3', section: 'Abstract', arxivId: '2401.12345' },
    { paperId: 'arxiv:2410.01234', paperTitle: 'Direct Preference Optimization', section: 'Methodology', arxivId: '2410.01234' },
  ];
}
