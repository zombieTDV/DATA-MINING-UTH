# Frontend Teammate Integration Guide (React + Vite)

Hello! If you are building the React frontend for the Scientific Literature Mining & RAG project, this guide provides everything you need to connect your UI to the backend API.

---

## ⚡ Quick Start: 2-Minute Setup

### 1. Ask your teammate for the Live Tunnel URL
Your backend teammate will run `npm run tunnel` on their machine and send you a public HTTPS URL that looks like:
```
https://xxxx-xxxx-xxxx.trycloudflare.com
```

### 2. Configure your React project's `.env`
In your React/Vite project root, create or edit `.env`:
```env
# If using Vite:
VITE_API_URL=https://xxxx-xxxx-xxxx.trycloudflare.com

# If using Create-React-App (CRA):
REACT_APP_API_URL=https://xxxx-xxxx-xxxx.trycloudflare.com
```

### 3. Verify in your browser
Open your browser to:
```
https://xxxx-xxxx-xxxx.trycloudflare.com/api/docs
```
You should see the interactive Swagger UI showing all endpoints (`/api/search`, `/api/chat`, `/api/chat/stream`, `/api/papers/:id`, `/api/storage/stats`).

---

## 🚀 Ready-to-Copy React Integration Code

### Custom Hook: `useScientificChat.ts`
This TypeScript hook handles Server-Sent Events (SSE) streaming, progressive token rendering, inline citations, and error handling.

```tsx
import { useState, useCallback, useRef } from 'react';

export interface Citation {
  id: string; // e.g. "[Chunk 1]"
  paper_id: string; // e.g. "2401.00001"
  title: string;
  authors?: string[];
  year?: number;
  doi?: string;
}

export interface Chunk {
  chunk_id: string;
  paper_id: string;
  title: string;
  text: string;
  abstract?: string;
  year?: number;
}

export interface Timings {
  retrievalMs: number;
  generationMs: number;
  totalMs: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  chunks?: Chunk[];
  timings?: Timings;
  isStreaming?: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function useScientificChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim()) return;

    setError(null);
    setIsLoading(true);

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `asst-${Date.now()}`;

    // 1. Append user question and placeholder assistant message
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: question },
      { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true },
    ]);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          mode: 'fts', // 'fts' | 'vector' | 'hybrid'
          topK: 5,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = 'message';
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.replace('event:', '').trim();
          } else if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.replace('data:', '').trim();
            if (!dataStr) continue;

            const payload = JSON.parse(dataStr);

            if (currentEvent === 'token') {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: msg.content + payload.token }
                    : msg,
                ),
              );
            } else if (currentEvent === 'citations') {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? {
                        ...msg,
                        citations: payload.citations,
                        chunks: payload.chunks,
                      }
                    : msg,
                ),
              );
            } else if (currentEvent === 'done') {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? {
                        ...msg,
                        timings: payload.timings,
                        isStreaming: false,
                      }
                    : msg,
                ),
              );
            } else if (currentEvent === 'error') {
              throw new Error(payload.message || 'Stream generation failed');
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'An error occurred during generation');
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content:
                    msg.content || 'Failed to generate answer. Please try again.',
                  isStreaming: false,
                }
              : msg,
          ),
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  return { messages, isLoading, error, sendMessage, stopGeneration };
}
```

---

### Component Example: `PaperSearch.tsx`
Call `POST /api/search` to display matching scientific chunks and papers.

```tsx
import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function PaperSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, topK: 5 }),
      });
      const data = await res.json();
      setResults(data.results || []);
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div style={{ padding: '1rem' }}>
      <form onSubmit={handleSearch}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search 143k paper chunks..."
          style={{ width: '300px', padding: '0.5rem' }}
        />
        <button type="submit" disabled={isSearching} style={{ marginLeft: '0.5rem' }}>
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div style={{ marginTop: '1rem' }}>
        {results.map((chunk) => (
          <div
            key={chunk.chunk_id}
            style={{ border: '1px solid #ccc', margin: '0.5rem 0', padding: '0.75rem', borderRadius: '4px' }}
          >
            <h4>{chunk.title} <span style={{ fontSize: '0.8rem', color: '#666' }}>({chunk.year})</span></h4>
            <p style={{ fontSize: '0.9rem' }}>{chunk.text.slice(0, 200)}...</p>
            <small style={{ color: '#0066cc' }}>arXiv ID: {chunk.paper_id}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🛠️ Fallback: Running Backend in Mock Mode on Your Own Machine

If your backend teammate is offline or sleeping, you can run the backend locally on your own machine in **100% Mock Mode**:

1. Clone or checkout the backend branch:
   ```powershell
   git checkout feature/backend-api
   ```
2. Install dependencies:
   ```powershell
   npm ci
   ```
3. Set mock mode in your `.env`:
   ```env
   RETRIEVAL_MODE=mock
   LLM_MODE=mock
   ```
4. Start both Gateway and LLM Service:
   ```powershell
   npm run dev
   ```
   The backend will start immediately on `http://localhost:8000` with realistic simulated paper chunks and responses. **No GPU and no 4.36 GB model download required.**
