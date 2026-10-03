import { Body, Controller, Inject, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { LLM_ENGINE, LlmEngine } from '../engine/llm-engine.interface';
import { ChatCompletionRequestInput } from './chat.dto';

@ApiTags('Chat')
@Controller('v1/chat')
export class ChatController {
  constructor(
    @Inject(LLM_ENGINE)
    private readonly engine: LlmEngine,
  ) {}

  @Post('completions')
  @ApiOperation({
    summary: 'OpenAI-compatible Chat Completions with SSE streaming support',
  })
  @ApiResponse({ status: 200, description: 'Generated chat completion' })
  async createCompletion(
    @Body() body: ChatCompletionRequestInput,
    @Res() res: Response,
  ) {
    const id = `chatcmpl-${Date.now()}`;
    const model = body.model || this.engine.getModelInfo().id;

    if (body.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      try {
        await this.engine.generateCompletion({
          messages: body.messages,
          maxTokens: body.max_tokens,
          temperature: body.temperature,
          onChunk: (token: string) => {
            const chunkPayload = {
              id,
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model,
              choices: [
                {
                  index: 0,
                  delta: { content: token },
                  finish_reason: null,
                },
              ],
            };
            res.write(`data: ${JSON.stringify(chunkPayload)}\n\n`);
          },
        });

        // Final closing chunk
        const stopPayload = {
          id,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model,
          choices: [
            {
              index: 0,
              delta: {},
              finish_reason: 'stop',
            },
          ],
        };
        res.write(`data: ${JSON.stringify(stopPayload)}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (err: any) {
        const errorPayload = { error: { message: err.message || 'Generation error' } };
        res.write(`data: ${JSON.stringify(errorPayload)}\n\n`);
        res.end();
      }
    } else {
      // Non-streaming completion
      const result = await this.engine.generateCompletion({
        messages: body.messages,
        maxTokens: body.max_tokens,
        temperature: body.temperature,
      });

      return res.status(200).json({
        id,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: result.text,
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: result.tokensUsed || 0,
          total_tokens: result.tokensUsed || 0,
        },
      });
    }
  }
}
