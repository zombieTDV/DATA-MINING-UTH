import { Injectable, Logger } from '@nestjs/common';
import { ChunkDto, SearchRequestDto, StorageStatsResponseDto } from '@app/shared';
import { RetrievalService } from './retrieval.service';

@Injectable()
export class MockRetrievalService implements RetrievalService {
  private readonly logger = new Logger(MockRetrievalService.name);

  private readonly mockChunks: ChunkDto[] = [
    {
      chunk_id: '2401.00001_chunk_0',
      paper_id: '2401.00001',
      title: 'Post-Training Quantization for Large Language Models: A Comprehensive Survey',
      abstract: 'Quantization transforms weights and activations from high-precision to low-bit integers.',
      text: 'Section 3.1: Post-training quantization (PTQ) methods including AWQ and GPTQ allow running 70B parameter models on a single consumer GPU without retraining. These methods utilize Hessian-based weighting to protect sensitive outlier activations.',
      authors: ['Alice Zhang', 'Bob Vance', 'Carol Danvers'],
      year: 2024,
      primary_category: 'cs.LG',
      doi: '10.48550/arXiv.2401.00001',
      score: 0.942,
      source: 'mock/lancedb/scientific_papers_gold',
    },
    {
      chunk_id: '2401.00002_chunk_1',
      paper_id: '2401.00002',
      title: 'Efficient Speculative Decoding and Model Compression for Transformer Serving',
      abstract: 'Speculative decoding accelerates inference by generating candidate tokens with a draft model.',
      text: 'Section 4: Combining 4-bit weight compression with speculative draft verification improves throughput by 2.8x compared to standard FP16 decoding under high-concurrency batch regimes.',
      authors: ['David Miller', 'Elena Rostova'],
      year: 2024,
      primary_category: 'cs.AI',
      doi: '10.48550/arXiv.2401.00002',
      score: 0.887,
      source: 'mock/lancedb/scientific_papers_gold',
    },
    {
      chunk_id: '2309.00003_chunk_0',
      paper_id: '2309.00003',
      title: 'Graph-based Citation Analysis and Research Trend Mining in Computer Science',
      abstract: 'We construct a citation graph over 100,000 arXiv papers to identify emerging topic trajectories.',
      text: 'Section 2: Community detection via Louvain algorithm highlights a sharp transition in 2023 from traditional encoder models towards instruction-tuned decoder architectures and retrieval-augmented generation.',
      authors: ['Frank Sinatra', 'Grace Hopper'],
      year: 2023,
      primary_category: 'cs.DL',
      doi: '10.48550/arXiv.2309.00003',
      score: 0.835,
      source: 'mock/lancedb/scientific_papers_gold',
    },
  ];

  constructor() {
    this.logger.log('Initialized MockRetrievalService for testing & CI');
  }

  async isReady(): Promise<boolean> {
    return true;
  }

  async search(req: SearchRequestDto): Promise<ChunkDto[]> {
    const k = req.topK || 5;
    const queryLower = (req.query || '').toLowerCase();

    // Filter or rank by basic substring match if present
    const filtered = this.mockChunks.filter(
      (c) =>
        c.text.toLowerCase().includes(queryLower) ||
        c.title.toLowerCase().includes(queryLower) ||
        c.paper_id.includes(queryLower),
    );

    const results = filtered.length > 0 ? filtered : this.mockChunks;
    return results.slice(0, k);
  }

  async getPaper(paperId: string): Promise<ChunkDto[]> {
    const matches = this.mockChunks.filter((c) => c.paper_id === paperId);
    if (matches.length > 0) return matches;
    return [
      {
        chunk_id: `${paperId}_chunk_0`,
        paper_id: paperId,
        title: `Paper ${paperId}`,
        text: `Full content representation for paper ${paperId} (mock).`,
        year: 2024,
        source: 'mock/lancedb/scientific_papers_gold',
      },
    ];
  }

  async getStorageStats(): Promise<StorageStatsResponseDto> {
    return {
      bucket: 'uth-scientific-lakehouse',
      status: 'ready',
      zones: {
        bronzeCount: 4330,
        bronzeSizeBytes: 6785123456,
        silverTables: ['papers.parquet', 'citations.parquet'],
        goldTables: ['scientific_papers_gold.lance'],
        goldChunkCount: 143523,
      },
      remoteIndicesReady: true,
    };
  }
}
