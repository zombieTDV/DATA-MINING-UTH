import { ApiProperty } from '@nestjs/swagger';
import { ChunkDto } from './search.dto';

export class StorageStatsResponseDto {
  @ApiProperty({ example: 'uth-scientific-lakehouse' })
  bucket: string;

  @ApiProperty({ example: 'ready' })
  status: string;

  @ApiProperty({
    example: {
      bronzeCount: 4330,
      bronzeSizeBytes: 6785123456,
      silverTables: ['papers.parquet', 'citations.parquet'],
      goldTables: ['scientific_papers_gold.lance'],
      goldChunkCount: 143523,
    },
  })
  zones: {
    bronzeCount: number;
    bronzeSizeBytes: number;
    silverTables: string[];
    goldTables: string[];
    goldChunkCount: number;
  };

  @ApiProperty({ example: true })
  remoteIndicesReady: boolean;
}

export class PaperDetailsDto {
  @ApiProperty({ example: '2301.00001' })
  paper_id: string;

  @ApiProperty({ example: 'Efficient Quantization of Large Language Models' })
  title: string;

  @ApiProperty({ example: 4 })
  chunkCount: number;

  @ApiProperty({ type: [ChunkDto] })
  chunks: ChunkDto[];
}
