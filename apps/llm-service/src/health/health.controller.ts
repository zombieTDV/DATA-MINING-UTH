import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LLM_ENGINE, LlmEngine } from '../engine/llm-engine.interface';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @Inject(LLM_ENGINE)
    private readonly engine: LlmEngine,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Check LLM service health and model status' })
  @ApiResponse({ status: 200, description: 'LLM service status and loaded model info' })
  checkHealth() {
    const modelInfo = this.engine.getModelInfo();
    return {
      status: modelInfo.loaded ? 'ok' : 'degraded',
      service: 'llm-service',
      port: 9001,
      model: modelInfo,
      uptimeSeconds: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
