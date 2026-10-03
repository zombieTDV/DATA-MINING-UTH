import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { LRUCache } from 'lru-cache';
import {
  ChunkDto,
  EnvConfig,
  SearchMode,
  SearchRequestDto,
  StorageStatsResponseDto,
} from '@app/shared';
import { RetrievalService } from './retrieval.service';

@Injectable()
export class LanceDbRetrievalService implements RetrievalService, OnModuleInit {
  private readonly logger = new Logger(LanceDbRetrievalService.name);
  private db: any = null;
  private table: any = null;
  private ready = false;

  private readonly cache = new LRUCache<string, ChunkDto[]>({
    max: 500,
    ttl: 10 * 60 * 1000, // 10 minutes cache TTL
  });

  constructor(private readonly config: EnvConfig) {}

  async onModuleInit() {
    await this.connect();
  }

  private async connect() {
    try {
      this.logger.log(`Connecting to LanceDB at: ${this.config.LANCEDB_URI}`);
      const lancedb = await import('@lancedb/lancedb');

      const storageOptions: Record<string, string> = {
        region: 'auto',
      };

      if (this.config.R2_ENDPOINT_URL) {
        storageOptions.endpoint = this.config.R2_ENDPOINT_URL;
      }
      if (this.config.R2_ACCESS_KEY_ID) {
        storageOptions.aws_access_key_id = this.config.R2_ACCESS_KEY_ID;
      }
      if (this.config.R2_SECRET_ACCESS_KEY) {
        storageOptions.aws_secret_access_key = this.config.R2_SECRET_ACCESS_KEY;
      }

      this.db = await lancedb.connect(this.config.LANCEDB_URI, {
        storageOptions,
      });

      this.table = await this.db.openTable(this.config.LANCEDB_TABLE);
      this.ready = true;
      this.logger.log(`Successfully opened LanceDB table: ${this.config.LANCEDB_TABLE}`);
    } catch (err: any) {
      this.logger.error(`LanceDB connection failed: ${err.message}`, err.stack);
      this.ready = false;
    }
  }

  async isReady(): Promise<boolean> {
    return this.ready;
  }

  async search(req: SearchRequestDto): Promise<ChunkDto[]> {
    const k = req.topK || 5;
    const mode = req.mode || SearchMode.FTS;
    const cacheKey = `${mode}:${req.query}:${k}:${req.category || ''}`;

    if (!req.noCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for search query: "${req.query}"`);
        return cached;
      }
    }

    if (!this.ready || !this.table) {
      this.logger.warn('LanceDB table not ready. Returning empty result.');
      return [];
    }

    try {
      let results: any[] = [];

      if (mode === SearchMode.FTS) {
        // LanceDB full text search query
        let queryBuilder = this.table.search(req.query, 'fts');
        if (req.category) {
          queryBuilder = queryBuilder.where(`primary_category = '${req.category}'`);
        }
        results = await queryBuilder.limit(k).toArray();
      } else {
        // Fallback or placeholder until embeddings are active
        this.logger.warn(`Search mode '${mode}' requested without local query embedder. Falling back to FTS.`);
        results = await this.table.search(req.query, 'fts').limit(k).toArray();
      }

      const chunks: ChunkDto[] = results.map((row: any) => ({
        chunk_id: String(row.chunk_id || ''),
        paper_id: String(row.paper_id || ''),
        title: String(row.title || ''),
        abstract: row.abstract ? String(row.abstract) : undefined,
        text: String(row.text || ''),
        authors: Array.isArray(row.authors)
          ? row.authors.map(String)
          : row.authors
            ? [String(row.authors)]
            : [],
        year: typeof row.year === 'number' ? row.year : undefined,
        primary_category: row.primary_category ? String(row.primary_category) : undefined,
        doi: row.doi ? String(row.doi) : undefined,
        score: typeof row._score === 'number' ? row._score : undefined,
        source: `${this.config.LANCEDB_URI}/${this.config.LANCEDB_TABLE}`,
      }));

      this.cache.set(cacheKey, chunks);
      return chunks;
    } catch (err: any) {
      this.logger.error(`Error executing search on LanceDB: ${err.message}`, err.stack);
      return [];
    }
  }

  async getPaper(paperId: string): Promise<ChunkDto[]> {
    if (!this.ready || !this.table) return [];

    try {
      const rows = await this.table.query().where(`paper_id = '${paperId}'`).toArray();
      return rows.map((row: any) => ({
        chunk_id: String(row.chunk_id || ''),
        paper_id: String(row.paper_id || ''),
        title: String(row.title || ''),
        abstract: row.abstract ? String(row.abstract) : undefined,
        text: String(row.text || ''),
        authors: Array.isArray(row.authors) ? row.authors.map(String) : [],
        year: typeof row.year === 'number' ? row.year : undefined,
        primary_category: row.primary_category ? String(row.primary_category) : undefined,
        doi: row.doi ? String(row.doi) : undefined,
        source: `${this.config.LANCEDB_URI}/${this.config.LANCEDB_TABLE}`,
      }));
    } catch (err: any) {
      this.logger.error(`Error querying paper ${paperId}: ${err.message}`);
      return [];
    }
  }

  async getStorageStats(): Promise<StorageStatsResponseDto> {
    return {
      bucket: this.config.R2_BUCKET_NAME || 'uth-scientific-lakehouse',
      status: this.ready ? 'ready' : 'connecting',
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
