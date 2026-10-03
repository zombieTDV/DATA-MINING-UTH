# Scientific Literature Platform: Frontend Integration & API Contract

This document provides the API specifications and client integration examples for the React frontend team.

---

## 🌐 Server Endpoints & Ports

- **Base URL (Gateway)**: `http://localhost:8000`
- **Swagger Documentation**: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
- **OpenAPI JSON Spec**: [http://localhost:8000/api/docs-json](http://localhost:8000/api/docs-json)
- **CORS Allowed Origins**: `http://localhost:5173` (Vite default), `http://localhost:3000` (Create-React-App default).

---

## 1. Search API (`POST /api/search`)

Searches the 143k+ scientific paper chunks indexed in Cloudflare R2 using LanceDB.

### Request
```http
POST /api/search HTTP/1.1
Host: localhost:8000
Content-Type: application/json

{
  "query": "quantization techniques for large language models",
  "mode": "fts",
  "topK": 5,
  "category": "cs.AI"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `query` | `string` | **Yes** | Natural language or keyword query string. |
| `mode` | `string` | No | `"fts"` (Full-Text Search, default), `"vector"`, or `"hybrid"`. |
| `topK` | `number` | No | Maximum number of results to return (1 - 50, default `5`). |
| `category` | `string` | No | Optional arXiv category filter (e.g., `cs.AI`, `cs.LG`, `cs.CL`). |

### Response (`200 OK`)
```json
{
  "query": "quantization techniques for large language models",
  "mode": "fts",
  "total": 1,
  "tookMs": 45,
  "cached": false,
  "results": [
    {
      "chunk_id": "2401.00001_chunk_0",
      "paper_id": "2401.00001",
      "title": "Post-Training Quantization for Large Language Models: A Comprehensive Survey",
      "abstract": "Quantization transforms weights and activations...",
      "text": "Section 3.1: Post-training quantization (PTQ) methods including AWQ and GPTQ...",
      "authors": ["Alice Zhang", "Bob Vance"],
      "year": 2024,
      "primary_category": "cs.LG",
      "doi": "10.48550/arXiv.2401.00001",
      "score": 0.942,
      "source": "s3://uth-scientific-lakehouse/gold/lancedb/scientific_papers_gold.lance"
    }
  ]
}
```

---

## 2. Grounded Chat API (`POST /api/chat`)

Performs context retrieval from R2 LanceDB and generates a grounded response with citations.

### Request
```http
POST /api/chat HTTP/1.1
Host: localhost:8000
Content-Type: application/json

{
  "message": "What is the difference between AWQ and GPTQ quantization?",
  "mode": "fts",
  "topK": 5,
  "temperature": 0.7,
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hello! How can I assist your literature review?" }
  ]
}
```

### Response (`200 OK`)
```json
{
  "answer": "According to [Chunk 1], AWQ (Activation-aware Weight Quantization) protects outlier salient channels by analyzing activation distributions, whereas GPTQ employs second-order Taylor approximation...",
  "citations": [
    {
      "id": "[Chunk 1]",
      "paper_id": "2401.00001",
      "title": "Post-Training Quantization for Large Language Models: A Comprehensive Survey",
      "authors": ["Alice Zhang", "Bob Vance"],
      "year": 2024,
      "doi": "10.48550/arXiv.2401.00001"
    }
  ],
  "chunks": [
    {
      "chunk_id": "2401.00001_chunk_0",
      "paper_id": "2401.00001",
      "title": "Post-Training Quantization for Large Language Models: A Comprehensive Survey",
      "text": "..."
    }
  ],
  "timings": {
    "retrievalMs": 120,
    "generationMs": 1450,
    "totalMs": 1570
  }
}
```

---

## 3. Streaming Chat API with SSE (`POST /api/chat/stream`)

Streams generated tokens in real time via Server-Sent Events (SSE).

### Frontend Consumption Pattern (`fetch` + `ReadableStream`)
```ts
async function streamChat(message: string, onToken: (token: string) => void, onComplete: (citations: any) => void) {
  const response = await fetch('http://localhost:8000/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, mode: 'fts', topK: 5 }),
  });

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
      if (line.startsWith('event:')) {
        currentEvent = line.replace('event:', '').trim();
      } else if (line.startsWith('data:')) {
        const data = JSON.parse(line.replace('data:', '').trim());
        if (currentEvent === 'token') {
          onToken(data.token);
        } else if (currentEvent === 'citations') {
          onComplete(data.citations);
        }
      }
    }
  }
}
```

### Event Sequence
1. **`event: token`**:
   `data: {"token": "In"}`
2. **`event: token`**:
   `data: {"token": " summary, "}`
3. **`event: citations`**:
   `data: {"citations": [...], "chunks": [...]}`
4. **`event: done`**:
   `data: {"timings": {"retrievalMs": 85, "generationMs": 1200, "totalMs": 1285}}`

---

## 4. Paper Inspection (`GET /api/papers/:paperId`)

Retrieves metadata and all embedded text chunks for an individual arXiv paper.

### Request
```http
GET /api/papers/2401.00001 HTTP/1.1
Host: localhost:8000
```

### Response (`200 OK`)
```json
{
  "paper_id": "2401.00001",
  "title": "Post-Training Quantization for Large Language Models: A Comprehensive Survey",
  "chunkCount": 3,
  "chunks": [ ... ]
}
```

---

## 5. Lakehouse Storage Stats (`GET /api/storage/stats`)

Provides an overview of data volumes across Lakehouse tiers in Cloudflare R2.

### Response (`200 OK`)
```json
{
  "bucket": "uth-scientific-lakehouse",
  "status": "ready",
  "zones": {
    "bronzeCount": 4330,
    "bronzeSizeBytes": 6785123456,
    "silverTables": ["papers.parquet", "citations.parquet"],
    "goldTables": ["scientific_papers_gold.lance"],
    "goldChunkCount": 143523
  },
  "remoteIndicesReady": true
}
```
