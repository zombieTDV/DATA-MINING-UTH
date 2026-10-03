# UTH Data Mining: Backend API & RAG Serving Monorepo

Welcome to the backend service monorepo for the UTH Scientific Paper Mining and Literature Review platform. This branch (`feature/backend-api`) contains a clean, standalone TypeScript/NestJS monorepo designed to power real-time scientific exploration, hybrid retrieval over Cloudflare R2 Lakehouse, and grounded LLM generation for frontend applications.

---

## 🏛️ System Architecture

```
                       ┌───────────────────────────────┐
                       │   React Frontend Application   │
                       │   (e.g., Vite on port 5173)   │
                       └───────────────┬───────────────┘
                                       │
                      REST & SSE Stream│
                                       ▼
                       ┌───────────────────────────────┐
                       │      API Gateway (:8000)      │
                       │   Swagger UI: /api/docs       │
                       │   Swagger JSON: /api/docs-json│
                       └───────┬───────────────┬───────┘
                               │               │
        @lancedb/lancedb (S3)  │               │ HTTP /v1/chat/completions (SSE)
                               ▼               ▼
      ┌──────────────────────────┐    ┌──────────────────────────┐
      │   Cloudflare R2 Bucket   │    │    LLM Service (:9001)   │
      │   uth-scientific-lakehouse   │    │    Swagger UI: /docs     │
      │ 143k chunks (IVF-PQ + FTS│    │ node-llama-cpp + Qwen2.5 │
      └──────────────────────────┘    └─────────────┬────────────┘
                                                    │ loads local GGUF
                                                    ▼
                                      ┌──────────────────────────┐
                                      │ models/qwen2.5-7b-*.gguf │
                                      └──────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js >= 22.0.0** (required by `@lancedb/lancedb` and `node-llama-cpp`)
- **nvm** (Node Version Manager) recommended

```powershell
# Activate Node 22 using nvm-windows
nvm use 22.23.3
node --version
# Expected: v22.23.3
```

### Installation
```powershell
npm ci
```

### Environment Setup
Copy `.env.example` to `.env` and fill in your Cloudflare R2 credentials (if running against real lakehouse data):
```powershell
cp .env.example .env
```

Key environment options:
| Variable | Default | Description |
| :--- | :--- | :--- |
| `GATEWAY_PORT` | `8000` | Port for frontend-facing API Gateway |
| `LLM_PORT` | `9001` | Port for internal/dedicated LLM service |
| `RETRIEVAL_MODE` | `lancedb` | `lancedb` (queries Cloudflare R2) or `mock` (in-memory test data) |
| `LLM_MODE` | `gguf` | `gguf` (loads local Qwen GGUF via `node-llama-cpp`) or `mock` |
| `LLM_MODEL_PATH` | `./models/...` | Path to local GGUF weights |
| `FRONTEND_ORIGIN`| `http://localhost:5173` | Allowed CORS origin for React/Vite |

### Running the Services
```powershell
# Run both API Gateway (:8000) and LLM Service (:9001) concurrently in dev mode:
npm run dev

# Expose API Gateway (:8000) over free public HTTPS tunnel for remote frontend teammates:
npm run tunnel

# Or run services individually:
npm run start:gateway
npm run start:llm
```

### Running Tests
```powershell
# Unit tests (prompt builders, citation parser, zod schema validation)
npm test

# End-to-end integration tests (mock mode: no GPU or R2 secrets required)
npm run test:e2e

# Build production artifacts
npm run build
```

---

## 📖 API Documentation & Swagger

- **API Gateway Swagger UI**: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
- **API Gateway OpenAPI JSON Spec**: [http://localhost:8000/api/docs-json](http://localhost:8000/api/docs-json)
- **LLM Service Swagger UI**: [http://localhost:9001/docs](http://localhost:9001/docs)

For detailed endpoint contracts and Server-Sent Event (SSE) specs, refer to [docs/backend/API.md](file:///C:/document/Study%20documents/Uth-Data-Mining/docs/backend/API.md).
