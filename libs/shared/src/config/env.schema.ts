import { z } from 'zod';

export const EnvSchema = z.object({
  // Ports & network
  GATEWAY_PORT: z.coerce.number().default(8000),
  LLM_PORT: z.coerce.number().default(9001),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  LLM_SERVICE_URL: z.string().default('http://localhost:9001'),

  // Retrieval
  RETRIEVAL_MODE: z.enum(['lancedb', 'mock']).default('lancedb'),
  LANCEDB_URI: z.string().default('s3://uth-scientific-lakehouse/gold/lancedb'),
  LANCEDB_TABLE: z.string().default('scientific_papers_gold'),
  R2_ENDPOINT_URL: z.string().optional().default(''),
  R2_ACCESS_KEY_ID: z.string().optional().default(''),
  R2_SECRET_ACCESS_KEY: z.string().optional().default(''),
  R2_BUCKET_NAME: z.string().optional().default('uth-scientific-lakehouse'),

  // LLM Engine
  LLM_MODE: z.enum(['gguf', 'mock']).default('gguf'),
  LLM_MODEL_PATH: z
    .string()
    .default('./models/qwen2.5-7b-instruct-q4_k_m/qwen2.5-7b-instruct-q4_k_m.gguf'),
  LLM_CONTEXT_SIZE: z.coerce.number().default(4096),
  LLM_MAX_TOKENS: z.coerce.number().default(1024),
  LLM_TEMPERATURE: z.coerce.number().default(0.7),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = EnvSchema.safeParse(config);
  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `Field ${e.path.join('.')}: ${e.message}`)
      .join(', ');
    throw new Error(`Environment validation failed: ${errors}`);
  }
  return result.data;
}
