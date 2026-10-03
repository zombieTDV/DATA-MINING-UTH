import { useCallback, useEffect, useRef, useState } from 'react';
import { ragService } from '@/services/rag';
import type { ChatMessage } from '@/types/entities';
import type { RagQueryRequest, RagStreamChunk } from '@/types/responses';
import { getErrorMessage } from './useAsync';

export interface UseRagChatOptions {
  sessionId?: string;
  topK?: number;
  categoryFilter?: string;
}

export interface UseRagChatResult {
  messages: ChatMessage[];
  isSending: boolean;
  isStreaming: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export function useRagChat(options: UseRagChatOptions = {}): UseRagChatResult {
  const { sessionId, topK = 5, categoryFilter } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    ragService
      .getSession(sessionId)
      .then((session) => {
        if (!cancelled) setMessages(session.messages);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isSending) return;
      setError(null);

      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };
      const assistantId = `msg-${Date.now() + 1}`;
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      const req: RagQueryRequest = {
        query: content,
        sessionId,
        topK,
        categoryFilter,
        stream: true,
      };

      try {
        setIsSending(true);
        setIsStreaming(true);

        const accumulated: string[] = [];
        for await (const chunk of ragService.streamQuery(req)) {
          handleStreamChunk(chunk, assistantId, accumulated, setMessages);
        }
      } catch (err) {
        setError(getErrorMessage(err));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: '⚠️ Xin lỗi, đã có lỗi xảy ra khi truy vấn RAG engine.' }
              : m,
          ),
        );
      } finally {
        setIsSending(false);
        setIsStreaming(false);
      }
    },
    [categoryFilter, isSending, sessionId, topK],
  );

  const clearMessages = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isSending,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
    setMessages,
  };
}

function handleStreamChunk(
  chunk: RagStreamChunk,
  assistantId: string,
  accumulated: string[],
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
) {
  switch (chunk.type) {
    case 'token':
      accumulated.push(chunk.content);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: accumulated.join('') } : m,
        ),
      );
      break;
    case 'citation':
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, citations: [...(m.citations || []), chunk.citation] }
            : m,
        ),
      );
      break;
    case 'done':
      // final flush
      break;
    case 'error':
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `${m.content}\n\n[Error: ${chunk.content}]` }
            : m,
        ),
      );
      break;
  }
}
