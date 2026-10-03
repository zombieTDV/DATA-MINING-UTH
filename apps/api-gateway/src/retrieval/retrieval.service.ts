import { ChunkDto, SearchRequestDto, StorageStatsResponseDto } from '@app/shared';

export interface RetrievalService {
  search(req: SearchRequestDto): Promise<ChunkDto[]>;
  getPaper(paperId: string): Promise<ChunkDto[]>;
  getStorageStats(): Promise<StorageStatsResponseDto>;
  isReady(): Promise<boolean>;
}

export const RETRIEVAL_SERVICE = Symbol('RETRIEVAL_SERVICE');
