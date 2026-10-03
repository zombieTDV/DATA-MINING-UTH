import { Controller, Get, Inject, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaperDetailsDto } from '@app/shared';
import { RETRIEVAL_SERVICE, RetrievalService } from '../retrieval/retrieval.service';

@ApiTags('Papers')
@Controller('api/papers')
export class PapersController {
  constructor(
    @Inject(RETRIEVAL_SERVICE)
    private readonly retrievalService: RetrievalService,
  ) {}

  @Get(':paperId')
  @ApiOperation({ summary: 'Get chunks and metadata for a specific arXiv paper' })
  @ApiResponse({ status: 200, type: PaperDetailsDto })
  async getPaper(@Param('paperId') paperId: string): Promise<PaperDetailsDto> {
    const chunks = await this.retrievalService.getPaper(paperId);
    const title = chunks.length > 0 ? chunks[0].title : `Paper ${paperId}`;

    return {
      paper_id: paperId,
      title,
      chunkCount: chunks.length,
      chunks,
    };
  }
}
