import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StorageStatsResponseDto } from '@app/shared';
import { RETRIEVAL_SERVICE, RetrievalService } from '../retrieval/retrieval.service';

@ApiTags('Storage')
@Controller('api/storage')
export class StorageController {
  constructor(
    @Inject(RETRIEVAL_SERVICE)
    private readonly retrievalService: RetrievalService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get Cloudflare R2 lakehouse storage statistics' })
  @ApiResponse({ status: 200, type: StorageStatsResponseDto })
  async getStats(): Promise<StorageStatsResponseDto> {
    return this.retrievalService.getStorageStats();
  }
}
