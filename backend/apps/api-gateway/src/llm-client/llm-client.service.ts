import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LlmCompletionResponse {
  answer: string;
  tokensUsed?: number;
}

@Injectable()
export class LlmClientService {
  private readonly logger = new Logger(LlmClientService.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'LLM_SERVICE_URL',
      'http://localhost:9001',
    );
  }

  async checkHealth(): Promise<{ status: string; backend?: string; loaded?: boolean }> {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      if (!res.ok) {
        return { status: 'down' };
      }
      const data = await res.json();
      return {
        status: data.status || 'ok',
        backend: data.model?.backend,
        loaded: data.model?.loaded,
      };
    } catch {
      return { status: 'unreachable' };
    }
  }

  async generateChatCompletion(
    messages: Array<{ role: string; content: string }>,
    maxTokens?: number,
    temperature?: number,
  ): Promise<LlmCompletionResponse> {
    const url = `${this.baseUrl}/v1/chat/completions`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`LLM service returned HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const answer = data.choices?.[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens;

    return { answer, tokensUsed };
  }

  async streamChatCompletion(
    messages: Array<{ role: string; content: string }>,
    onChunk: (token: string) => void,
    maxTokens?: number,
    temperature?: number,
  ): Promise<string> {
    const url = `${this.baseUrl}/v1/chat/completions`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      const errText = await res.text();
      throw new Error(`LLM stream failed with HTTP ${res.status}: ${errText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullAnswer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const dataStr = trimmed.slice(5).trim();
        if (dataStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullAnswer += delta;
            onChunk(delta);
          }
        } catch {
          // ignore partial json
        }
      }
    }

    return fullAnswer;
  }
}
