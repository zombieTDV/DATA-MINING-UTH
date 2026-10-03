import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Observable, interval, map } from 'rxjs';
import { LRUCache } from 'lru-cache';
import {
  EdaResponseDto,
  AssociationRulesResponseDto,
  ClustersResponseDto,
  GraphResponseDto,
  TrendsResponseDto,
} from '@app/shared';

@Injectable()
export class MiningService {
  private readonly logger = new Logger(MiningService.name);
  private readonly miningDir: string;

  private readonly cache = new LRUCache<string, any>({
    max: 50,
    ttl: 5 * 60 * 1000, // 5 minutes cache TTL
  });

  constructor() {
    // Resolve project root data/gold/mining directory
    this.miningDir = path.resolve(process.cwd(), '../data/gold/mining');
    if (!fs.existsSync(this.miningDir)) {
      // Fallback for running from root
      this.miningDir = path.resolve(process.cwd(), 'data/gold/mining');
    }
    this.logger.log(`Initialized MiningService with artifacts directory: ${this.miningDir}`);
  }

  private loadArtifact<T>(filename: string): T {
    const cacheKey = `artifact:${filename}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached as T;
    }

    const filePath = path.join(this.miningDir, filename);
    if (!fs.existsSync(filePath)) {
      this.logger.error(`Mining artifact not found at: ${filePath}`);
      throw new NotFoundException(
        `Mining artifact ${filename} not found. Please ensure the Python data mining engine has executed.`,
      );
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      this.cache.set(cacheKey, parsed);
      return parsed as T;
    } catch (err: any) {
      this.logger.error(`Error reading or parsing ${filename}: ${err.message}`);
      throw new Error(`Failed to load mining artifact ${filename}: ${err.message}`);
    }
  }

  async getEdaSummary(): Promise<EdaResponseDto> {
    return this.loadArtifact<EdaResponseDto>('eda_summary.json');
  }

  async getAssociationRules(): Promise<AssociationRulesResponseDto> {
    return this.loadArtifact<AssociationRulesResponseDto>('association_rules.json');
  }

  async getClusters(): Promise<ClustersResponseDto> {
    return this.loadArtifact<ClustersResponseDto>('clusters.json');
  }

  async getGraph(): Promise<GraphResponseDto> {
    return this.loadArtifact<GraphResponseDto>('graph_coauthorship.json');
  }

  async getTrendsAndAnomalies(): Promise<TrendsResponseDto> {
    return this.loadArtifact<TrendsResponseDto>('trends_anomalies.json');
  }

  async getManifest(): Promise<Record<string, any>> {
    return this.loadArtifact<Record<string, any>>('mining_manifest.json');
  }

  getTelemetryStream(): Observable<{ data: Record<string, any> }> {
    return interval(3000).pipe(
      map(() => {
        let manifest: any = {};
        try {
          manifest = this.loadArtifact('mining_manifest.json');
        } catch {
          manifest = { status: 'STANDBY' };
        }

        return {
          data: {
            timestamp: new Date().toISOString(),
            status: manifest.status || 'READY',
            total_execution_seconds: manifest.total_execution_seconds || 0,
            modules: manifest.modules || {},
          },
        };
      }),
    );
  }
}
