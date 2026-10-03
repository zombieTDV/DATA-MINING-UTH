import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Post,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import {
  ChatRequestDto,
  ChatResponseDto,
  GroundedPromptBuilder,
  SearchMode,
} from '@app/shared';
import { RETRIEVAL_SERVICE, RetrievalService } from '../retrieval/retrieval.service';
import { LlmClientService } from '../llm-client/llm-client.service';

@ApiTags('Chat')
@Controller('api/chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    @Inject(RETRIEVAL_SERVICE)
    private readonly retrievalService: RetrievalService,
    private readonly llmClient: LlmClientService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ask question with grounded R2 LanceDB retrieval and LLM response',
  })
  @ApiResponse({ status: 200, type: ChatResponseDto })
  async chat(@Body() body: ChatRequestDto): Promise<ChatResponseDto> {
    const totalStart = performance.now();

    const userQuery = (body.message || body.query || '').trim();
    this.logger.log(
      `Received chat request: "${userQuery}" (history: ${body.history?.length || 0} messages, mode: ${body.mode || 'fts'}, topK: ${body.topK || 5})`,
    );

    // 1. Retrieval
    const retStart = performance.now();
    const chunks = await this.retrievalService.search({
      query: userQuery,
      mode: body.mode || SearchMode.FTS,
      topK: body.topK || 5,
      category: body.category,
      noCache: body.noCache,
    });
    const retrievalMs = Math.round(performance.now() - retStart);

    // 2. Build grounded prompt
    const systemPrompt = GroundedPromptBuilder.getSystemPrompt();
    const userPrompt = GroundedPromptBuilder.buildUserPrompt(userQuery, chunks);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(body.history || []),
      { role: 'user', content: userPrompt },
    ];

    // 3. LLM Generation
    const genStart = performance.now();
    const llmResult = await this.llmClient.generateChatCompletion(
      messages,
      2048,
      body.temperature ?? 0.7,
    );
    const generationMs = Math.round(performance.now() - genStart);
    const totalMs = Math.round(performance.now() - totalStart);

    // 4. Extract citations
    const citations = GroundedPromptBuilder.extractCitations(llmResult.answer, chunks);

    return {
      answer: llmResult.answer,
      citations,
      chunks,
      timings: {
        retrievalMs,
        generationMs,
        totalMs,
      },
    };
  }

  @Post('stream')
  @ApiOperation({
    summary: 'Streaming chat with Server-Sent Events (SSE)',
    description:
      'Streams tokens incrementally, followed by citations and timing metadata events.',
  })
  async chatStream(@Body() body: ChatRequestDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const totalStart = performance.now();

    try {
      const userQuery = (body.message || body.query || '').trim();
      this.logger.log(
        `Received streaming chat request: "${userQuery}" (history: ${body.history?.length || 0} messages, mode: ${body.mode || 'fts'}, topK: ${body.topK || 5})`,
      );

      // 1. Retrieval
      const retStart = performance.now();
      const chunks = await this.retrievalService.search({
        query: userQuery,
        mode: body.mode || SearchMode.FTS,
        topK: body.topK || 5,
        category: body.category,
        noCache: body.noCache,
      });
      const retrievalMs = Math.round(performance.now() - retStart);

      // 2. Prompt construction
      const systemPrompt = GroundedPromptBuilder.getSystemPrompt();
      const userPrompt = GroundedPromptBuilder.buildUserPrompt(userQuery, chunks);

      const messages = [
        { role: 'system', content: systemPrompt },
        ...(body.history || []),
        { role: 'user', content: userPrompt },
      ];

      // 3. Stream from LLM service to client
      const genStart = performance.now();
      const fullAnswer = await this.llmClient.streamChatCompletion(
        messages,
        (token: string) => {
          res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
        },
        2048,
        body.temperature ?? 0.7,
      );
      const generationMs = Math.round(performance.now() - genStart);
      const totalMs = Math.round(performance.now() - totalStart);

      // 4. Send citations event
      const citations = GroundedPromptBuilder.extractCitations(fullAnswer, chunks);
      res.write(
        `event: citations\ndata: ${JSON.stringify({ citations, chunks })}\n\n`,
      );

      // 5. Send done event
      res.write(
        `event: done\ndata: ${JSON.stringify({
          timings: { retrievalMs, generationMs, totalMs },
        })}\n\n`,
      );

      res.end();
    } catch (err: any) {
      res.write(
        `event: error\ndata: ${JSON.stringify({ message: err.message || 'Stream error' })}\n\n`,
      );
      res.end();
    }
  }
}
