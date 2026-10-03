import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { EnvConfig } from '@app/shared';
import {
  CompletionOptions,
  CompletionResult,
  LlmEngine,
  ModelInfo,
} from './llm-engine.interface';

@Injectable()
export class NodeLlamaCppEngine implements LlmEngine, OnModuleInit {
  private readonly logger = new Logger(NodeLlamaCppEngine.name);
  private llama: any = null;
  private model: any = null;
  private context: any = null;
  private backend = 'cpu';
  private loaded = false;
  private queue: Promise<any> = Promise.resolve();

  constructor(private readonly config: EnvConfig) {}

  async onModuleInit() {
    await this.initializeModel();
  }

  private async initializeModel() {
    const rawPath = this.config.LLM_MODEL_PATH;
    const resolvedPath = path.isAbsolute(rawPath)
      ? rawPath
      : path.resolve(process.cwd(), rawPath);

    this.logger.log(`Checking GGUF model at: ${resolvedPath}`);

    if (!fs.existsSync(resolvedPath)) {
      this.logger.warn(
        `Model file does not exist at ${resolvedPath}. LLM service running in uninitialized state.`,
      );
      this.loaded = false;
      return;
    }

    try {
      this.logger.log('Initializing node-llama-cpp runtime...');
      const dynamicImport = new Function('specifier', 'return import(specifier)');
      const { getLlama } = await dynamicImport('node-llama-cpp');
      this.llama = await getLlama();
      this.backend = this.llama.gpu ? `${this.llama.gpu}` : 'cpu';
      this.logger.log(`node-llama-cpp loaded. Detected compute backend: ${this.backend}`);

      this.logger.log(`Loading model into memory (contextSize: ${this.config.LLM_CONTEXT_SIZE})...`);
      this.model = await this.llama.loadModel({
        modelPath: resolvedPath,
      });

      this.context = await this.model.createContext({
        contextSize: this.config.LLM_CONTEXT_SIZE,
      });

      this.loaded = true;
      this.logger.log(`GGUF model loaded successfully on backend: ${this.backend}`);
    } catch (error: any) {
      this.logger.error(`Failed to initialize node-llama-cpp: ${error.message}`, error.stack);
      this.loaded = false;
    }
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  getModelInfo(): ModelInfo {
    return {
      id: 'qwen2.5-7b-instruct',
      name: 'Qwen 2.5 7B Instruct (Q4_K_M GGUF)',
      backend: this.backend,
      contextSize: this.config.LLM_CONTEXT_SIZE,
      loaded: this.loaded,
      modelPath: this.config.LLM_MODEL_PATH,
    };
  }

  async generateCompletion(options: CompletionOptions): Promise<CompletionResult> {
    if (!this.loaded || !this.context) {
      throw new Error(
        'LLM engine is not loaded or model file missing. Verify LLM_MODEL_PATH in .env.',
      );
    }

    // Serialize generation to protect context sequence concurrency
    return new Promise((resolve, reject) => {
      this.queue = this.queue
        .then(async () => {
          try {
            const dynamicImport = new Function('specifier', 'return import(specifier)');
            const { LlamaChatSession } = await dynamicImport('node-llama-cpp');
            const systemMsg = options.messages.find((m) => m.role === 'system')?.content;
            const userMsg = options.messages
              .filter((m) => m.role === 'user')
              .map((m) => m.content)
              .join('\n\n');

            const session = new LlamaChatSession({
              contextSequence: this.context.getSequence(),
              systemPrompt: systemMsg,
            });

            const answer = await session.prompt(userMsg, {
              maxTokens: options.maxTokens || this.config.LLM_MAX_TOKENS,
              temperature: options.temperature ?? this.config.LLM_TEMPERATURE,
              onTextChunk: options.onChunk,
            });

            resolve({
              text: answer,
              tokensUsed: Math.ceil(answer.length / 4),
            });
          } catch (err) {
            reject(err);
          }
        })
        .catch((err) => {
          this.logger.error(`Queue error during completion: ${err.message}`);
          reject(err);
        });
    });
  }
}
