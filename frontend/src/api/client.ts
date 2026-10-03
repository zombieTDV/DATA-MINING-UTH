/**
 * API Client for interacting with the FastAPI Lakehouse Backend.
 */

import type {
  EdaResponse,
  AssociationRulesResponse,
  ClustersResponse,
  GraphResponse,
  TrendsResponse,
  StorageStatsResponse,
  ChatResponse,
} from './types';

const BASE_URL = ''; // Relative path leverages Vite proxy to http://127.0.0.1:8000

export async function fetchHealth(): Promise<{ status: string; lancedb_ready: boolean; parquet_ready: boolean }> {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchEdaSummary(): Promise<EdaResponse> {
  const res = await fetch(`${BASE_URL}/api/mining/eda`);
  if (!res.ok) throw new Error(`Failed to load EDA: ${res.statusText}`);
  return res.json();
}

export async function fetchAssociationRules(): Promise<AssociationRulesResponse> {
  const res = await fetch(`${BASE_URL}/api/mining/pillars/association-rules`);
  if (!res.ok) throw new Error(`Failed to load Association Rules: ${res.statusText}`);
  return res.json();
}

export async function fetchClusters(): Promise<ClustersResponse> {
  const res = await fetch(`${BASE_URL}/api/mining/pillars/clusters`);
  if (!res.ok) throw new Error(`Failed to load Clusters: ${res.statusText}`);
  return res.json();
}

export async function fetchGraph(): Promise<GraphResponse> {
  const res = await fetch(`${BASE_URL}/api/mining/pillars/graph`);
  if (!res.ok) throw new Error(`Failed to load Graph: ${res.statusText}`);
  return res.json();
}

export async function fetchTrends(): Promise<TrendsResponse> {
  const res = await fetch(`${BASE_URL}/api/mining/pillars/trends`);
  if (!res.ok) throw new Error(`Failed to load Trends: ${res.statusText}`);
  return res.json();
}

export async function fetchStorageStats(): Promise<StorageStatsResponse> {
  const res = await fetch(`${BASE_URL}/api/storage/stats`);
  if (!res.ok) throw new Error(`Failed to load Storage stats: ${res.statusText}`);
  return res.json();
}

export async function sendChatQuery(query: string, category?: string): Promise<ChatResponse> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, category, top_k: 5 }),
  });
  if (!res.ok) throw new Error(`Chat query failed: ${res.statusText}`);
  return res.json();
}

export function subscribeTelemetry(
  onData: (data: any) => void,
  onError?: (err: any) => void,
): () => void {
  const eventSource = new EventSource(`${BASE_URL}/api/mining/telemetry/stream`);

  eventSource.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      onData(parsed);
    } catch {
      onData(event.data);
    }
  };

  eventSource.onerror = (err) => {
    if (onError) onError(err);
  };

  return () => {
    eventSource.close();
  };
}
