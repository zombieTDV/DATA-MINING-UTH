import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RETRIEVAL_SERVICE, RetrievalService } from '../retrieval/retrieval.service';
import { LlmClientService } from '../llm-client/llm-client.service';

@ApiTags('Health')
@Controller('api/health')
export class HealthController {
  constructor(
    @Inject(RETRIEVAL_SERVICE)
    private readonly retrievalService: RetrievalService,
    private readonly llmClient: LlmClientService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Check API Gateway and upstream services health' })
  @ApiResponse({ status: 200, description: 'Gateway, R2/LanceDB, and LLM status' })
  async checkHealth() {
    const [retrievalReady, llmStatus] = await Promise.all([
      this.retrievalService.isReady().catch(() => false),
      this.llmClient.checkHealth(),
    ]);

    const isHealthy = retrievalReady && llmStatus.status !== 'unreachable';

    return {
      status: isHealthy ? 'ok' : 'degraded',
      service: 'api-gateway',
      port: 8000,
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
      dependencies: {
        retrieval: {
          status: retrievalReady ? 'ready' : 'unavailable',
        },
        llmService: {
          status: llmStatus.status,
          backend: llmStatus.backend,
          loaded: llmStatus.loaded,
        },
      },
    };
  }
}
