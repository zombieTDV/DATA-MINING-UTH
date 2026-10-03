import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum SearchMode {
  FTS = 'fts',
  VECTOR = 'vector',
  HYBRID = 'hybrid',
}

export class SearchRequestDto {
  @ApiProperty({
    description: 'Query text for semantic or full-text retrieval',
    example: 'deep learning quantization for transformer models',
  })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiPropertyOptional({
    description: 'Retrieval mode: fts (full-text search), vector (dense embedding), hybrid (reciprocal rank fusion)',
    enum: SearchMode,
    default: SearchMode.FTS,
  })
  @IsOptional()
  @IsEnum(SearchMode)
  mode?: SearchMode = SearchMode.FTS;

  @ApiPropertyOptional({
    description: 'Maximum number of chunks to return',
    minimum: 1,
    maximum: 50,
    default: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  topK?: number = 5;

  @ApiPropertyOptional({
    description: 'Filter by primary arXiv category (e.g. cs.AI, cs.LG, cs.CL)',
    example: 'cs.AI',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Bypass in-memory cache for fresh retrieval',
    default: false,
  })
  @IsOptional()
  noCache?: boolean = false;
}

export class ChunkDto {
  @ApiProperty({ example: '2301.00001_chunk_0' })
  chunk_id: string;

  @ApiProperty({ example: '2301.00001' })
  paper_id: string;

  @ApiProperty({ example: 'Efficient Quantization of Large Language Models' })
  title: string;

  @ApiPropertyOptional({ example: 'We propose a 4-bit quantization method...' })
  abstract?: string;

  @ApiProperty({ example: 'Section 1: In this work, we demonstrate post-training quantization...' })
  text: string;

  @ApiPropertyOptional({ example: ['John Doe', 'Jane Smith'] })
  authors?: string[];

  @ApiPropertyOptional({ example: 2024 })
  year?: number;

  @ApiPropertyOptional({ example: 'cs.LG' })
  primary_category?: string;

  @ApiPropertyOptional({ example: '10.1234/5678' })
  doi?: string;

  @ApiPropertyOptional({ example: 0.892 })
  score?: number;

  @ApiPropertyOptional({ example: 'gold/lancedb/scientific_papers_gold.lance' })
  source?: string;
}

export class SearchResponseDto {
  @ApiProperty({ example: 'deep learning quantization' })
  query: string;

  @ApiProperty({ enum: SearchMode, example: SearchMode.FTS })
  mode: SearchMode;

  @ApiProperty({ type: [ChunkDto] })
  results: ChunkDto[];

  @ApiProperty({ example: 5 })
  total: number;

  @ApiProperty({ example: 42 })
  tookMs: number;

  @ApiProperty({ example: false })
  cached: boolean;
}
