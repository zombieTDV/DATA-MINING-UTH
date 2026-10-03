import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ChunkDto, SearchMode } from './search.dto';

export class ChatMessageDto {
  @ApiProperty({ enum: ['system', 'user', 'assistant'], example: 'user' })
  @IsEnum(['system', 'user', 'assistant'])
  role: 'system' | 'user' | 'assistant';

  @ApiProperty({ example: 'What are the main methods for LLM quantization?' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class CitationDto {
  @ApiProperty({ example: '[Chunk 1]' })
  id: string;

  @ApiProperty({ example: '2301.00001' })
  paper_id: string;

  @ApiProperty({ example: 'Efficient Quantization of Large Language Models' })
  title: string;

  @ApiPropertyOptional({ example: ['John Doe', 'Jane Smith'] })
  authors?: string[];

  @ApiPropertyOptional({ example: 2024 })
  year?: number;

  @ApiPropertyOptional({ example: '10.1234/5678' })
  doi?: string;
}

export class ChatRequestDto {
  @ApiProperty({
    description: 'User question for grounded scientific retrieval & response generation',
    example: 'What are the modern quantization techniques for Large Language Models?',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Optional chat history to maintain conversation context',
    type: [ChatMessageDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history?: ChatMessageDto[];

  @ApiPropertyOptional({
    description: 'Retrieval mode for RAG context: fts, vector, or hybrid',
    enum: SearchMode,
    default: SearchMode.FTS,
  })
  @IsOptional()
  @IsEnum(SearchMode)
  mode?: SearchMode = SearchMode.FTS;

  @ApiPropertyOptional({
    description: 'Top-K scientific paper chunks to inject into context',
    minimum: 1,
    maximum: 10,
    default: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  topK?: number = 5;

  @ApiPropertyOptional({
    description: 'Temperature for LLM generation',
    minimum: 0.0,
    maximum: 2.0,
    default: 0.7,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.0)
  @Max(2.0)
  temperature?: number = 0.7;

  @ApiPropertyOptional({
    description: 'Optional filter by arXiv primary category',
    example: 'cs.AI',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Whether to stream responses using Server-Sent Events',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  stream?: boolean = false;

  @ApiPropertyOptional({
    description: 'Bypass in-memory retrieval cache for fresh queries',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  noCache?: boolean = false;

  @ApiPropertyOptional({
    description: 'Alternative alias for message parameter',
  })
  @IsOptional()
  @IsString()
  query?: string;
}

export class ChatTimingsDto {
  @ApiProperty({ example: 125 })
  retrievalMs: number;

  @ApiProperty({ example: 1450 })
  generationMs: number;

  @ApiProperty({ example: 1575 })
  totalMs: number;
}

export class ChatResponseDto {
  @ApiProperty({
    example:
      'Quantization methods include Post-Training Quantization (PTQ) such as GPTQ and AWQ, as described in [Chunk 1].',
  })
  answer: string;

  @ApiProperty({ type: [CitationDto] })
  citations: CitationDto[];

  @ApiProperty({ type: [ChunkDto] })
  chunks: ChunkDto[];

  @ApiProperty({ type: ChatTimingsDto })
  timings: ChatTimingsDto;
}
