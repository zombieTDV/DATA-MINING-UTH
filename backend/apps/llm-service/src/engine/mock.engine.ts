import { Injectable, Logger } from '@nestjs/common';
import {
  CompletionOptions,
  CompletionResult,
  LlmEngine,
  ModelInfo,
} from './llm-engine.interface';

@Injectable()
export class MockEngine implements LlmEngine {
  private readonly logger = new Logger(MockEngine.name);

  constructor() {
    this.logger.log('Initialized MockEngine (simulated LLM for testing & CI)');
  }

  isLoaded(): boolean {
    return true;
  }

  getModelInfo(): ModelInfo {
    return {
      id: 'mock-qwen2.5-7b',
      name: 'Mock Qwen 2.5 7B Instruct (Test Engine)',
      backend: 'mock-cpu',
      contextSize: 4096,
      loaded: true,
      modelPath: 'mock://in-memory',
    };
  }

  async generateCompletion(options: CompletionOptions): Promise<CompletionResult> {
    // Simulate generation with chunk citations
    const simulatedResponse =
      `Based on the provided scientific literature, recent techniques in large language models emphasize efficient parameter fine-tuning and quantization [Chunk 1]. ` +
      `Furthermore, empirical evaluations demonstrate that post-training quantization methods such as AWQ and GPTQ achieve near-lossless perplexity [Chunk 2]. ` +
      `In summary, these approaches significantly reduce GPU VRAM requirements while maintaining inference speed.`;

    if (options.onChunk) {
      const words = simulatedResponse.split(' ');
      for (const word of words) {
        options.onChunk(word + ' ');
        // Small delay for streaming simulation
        await new Promise((resolve) => setTimeout(resolve, 15));
      }
    }

    return {
      text: simulatedResponse,
      tokensUsed: 64,
    };
  }
}
