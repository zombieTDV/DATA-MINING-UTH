export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  onChunk?: (token: string) => void;
}

export interface CompletionResult {
  text: string;
  tokensUsed?: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  backend: string;
  contextSize: number;
  loaded: boolean;
  modelPath: string;
}

export interface LlmEngine {
  isLoaded(): boolean;
  getModelInfo(): ModelInfo;
  generateCompletion(options: CompletionOptions): Promise<CompletionResult>;
}

export const LLM_ENGINE = Symbol('LLM_ENGINE');
