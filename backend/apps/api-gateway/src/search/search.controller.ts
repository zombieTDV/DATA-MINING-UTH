import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchMode, SearchRequestDto, SearchResponseDto } from '@app/shared';
import { RETRIEVAL_SERVICE, RetrievalService } from '../retrieval/retrieval.service';

@ApiTags('Search')
@Controller('api/search')
export class SearchController {
  constructor(
    @Inject(RETRIEVAL_SERVICE)
    private readonly retrievalService: RetrievalService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search scientific papers and chunks via LanceDB or FTS',
    description:
      'Performs Full-Text Search (or vector/hybrid if enabled) across 143,523 chunks in Cloudflare R2.',
  })
  @ApiResponse({ status: 200, type: SearchResponseDto })
  async search(@Body() body: SearchRequestDto): Promise<SearchResponseDto> {
    const start = performance.now();
    const results = await this.retrievalService.search(body);
    const tookMs = Math.round(performance.now() - start);

    return {
      query: body.query,
      mode: body.mode || SearchMode.FTS,
      results,
      total: results.length,
      tookMs,
      cached: false,
    };
  }
}
