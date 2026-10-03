import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '@app/shared';
import { LLM_ENGINE } from './llm-engine.interface';
import { MockEngine } from './mock.engine';
import { NodeLlamaCppEngine } from './node-llama-cpp.engine';

@Module({
  providers: [
    {
      provide: LLM_ENGINE,
      useFactory: (configService: ConfigService) => {
        const mode = configService.get<string>('LLM_MODE', 'gguf');

        if (mode === 'mock') {
          return new MockEngine();
        }

        const resolvedConfig: EnvConfig = {
          GATEWAY_PORT: configService.get<number>('GATEWAY_PORT', 8000),
          LLM_PORT: configService.get<number>('LLM_PORT', 9001),
          FRONTEND_ORIGIN: configService.get<string>('FRONTEND_ORIGIN', 'http://localhost:5173'),
          LLM_SERVICE_URL: configService.get<string>('LLM_SERVICE_URL', 'http://localhost:9001'),
          RETRIEVAL_MODE: configService.get<'lancedb' | 'mock'>('RETRIEVAL_MODE', 'lancedb'),
          LANCEDB_URI: configService.get<string>(
            'LANCEDB_URI',
            's3://uth-scientific-lakehouse/gold/lancedb',
          ),
          LANCEDB_TABLE: configService.get<string>('LANCEDB_TABLE', 'scientific_papers_gold'),
          R2_ENDPOINT_URL: configService.get<string>('R2_ENDPOINT_URL', ''),
          R2_ACCESS_KEY_ID: configService.get<string>('R2_ACCESS_KEY_ID', ''),
          R2_SECRET_ACCESS_KEY: configService.get<string>('R2_SECRET_ACCESS_KEY', ''),
          R2_BUCKET_NAME: configService.get<string>('R2_BUCKET_NAME', 'uth-scientific-lakehouse'),
          LLM_MODE: configService.get<'gguf' | 'mock'>('LLM_MODE', 'gguf'),
          LLM_MODEL_PATH: configService.get<string>(
            'LLM_MODEL_PATH',
            './models/qwen2.5-7b-instruct-q4_k_m/qwen2.5-7b-instruct-q4_k_m.gguf',
          ),
          LLM_CONTEXT_SIZE: configService.get<number>('LLM_CONTEXT_SIZE', 8192),
          LLM_MAX_TOKENS: configService.get<number>('LLM_MAX_TOKENS', 2048),
          LLM_SEQUENCES: configService.get<number>('LLM_SEQUENCES', 2),
          LLM_TEMPERATURE: configService.get<number>('LLM_TEMPERATURE', 0.7),
        };

        return new NodeLlamaCppEngine(resolvedConfig);
      },
      inject: [ConfigService],
    },
  ],
  exports: [LLM_ENGINE],
})
export class EngineModule {}
