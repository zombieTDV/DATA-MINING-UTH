import { Controller, Get, Sse } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import {
  EdaResponseDto,
  AssociationRulesResponseDto,
  ClustersResponseDto,
  GraphResponseDto,
  TrendsResponseDto,
} from '@app/shared';
import { MiningService } from './mining.service';

@ApiTags('Data Mining & EDA')
@Controller('api/mining')
export class MiningController {
  constructor(private readonly miningService: MiningService) {}

  @Get('eda')
  @ApiOperation({
    summary: 'Get Real-Time Exploratory Data Analysis (EDA) of the 10,000 papers',
    description:
      'Returns global dataset volume, category distribution, math formula density, top authors, and category co-occurrences.',
  })
  @ApiResponse({ status: 200, type: EdaResponseDto })
  async getEda(): Promise<EdaResponseDto> {
    return this.miningService.getEdaSummary();
  }

  @Get('pillars/association-rules')
  @ApiOperation({
    summary: 'Pillar 1: Frequent Pattern & Association Rule Mining (FP-Growth)',
    description:
      'Returns frequent itemsets and high-lift association rules (lift, confidence, support, leverage) mined from arXiv categories and scientific terms.',
  })
  @ApiResponse({ status: 200, type: AssociationRulesResponseDto })
  async getAssociationRules(): Promise<AssociationRulesResponseDto> {
    return this.miningService.getAssociationRules();
  }

  @Get('pillars/clusters')
  @ApiOperation({
    summary: 'Pillar 2: Semantic Topic Clustering & Density Analysis',
    description:
      'Returns K-Means and DBSCAN clustering results on 143k LanceDB vector embeddings with Silhouette Score, Davies-Bouldin Index, and 2D scatter coordinates.',
  })
  @ApiResponse({ status: 200, type: ClustersResponseDto })
  async getClusters(): Promise<ClustersResponseDto> {
    return this.miningService.getClusters();
  }

  @Get('pillars/graph')
  @ApiOperation({
    summary: 'Pillar 3: Scientific Co-Authorship Graph Mining',
    description:
      'Returns co-authorship collaboration topology, PageRank centrality scores, and Louvain modularity communities for graph rendering.',
  })
  @ApiResponse({ status: 200, type: GraphResponseDto })
  async getGraph(): Promise<GraphResponseDto> {
    return this.miningService.getGraph();
  }

  @Get('pillars/trends')
  @ApiOperation({
    summary: 'Pillar 4: Trend Velocity & Anomaly Outlier Detection',
    description:
      'Returns structural anomalies detected via Isolation Forest and temporal growth momentum across AI/DS subfields.',
  })
  @ApiResponse({ status: 200, type: TrendsResponseDto })
  async getTrends(): Promise<TrendsResponseDto> {
    return this.miningService.getTrendsAndAnomalies();
  }

  @Get('manifest')
  @ApiOperation({
    summary: 'Get execution manifest of the most recent Data Mining run',
  })
  @ApiResponse({ status: 200, description: 'Execution metadata and timing breakdown' })
  async getManifest(): Promise<Record<string, any>> {
    return this.miningService.getManifest();
  }

  @Sse('telemetry/stream')
  @ApiOperation({
    summary: 'Server-Sent Events (SSE) telemetry stream for Real-Time Dashboard updates',
    description: 'Emits live telemetry ticks containing pipeline state, timing, and checkpoint status.',
  })
  getTelemetryStream(): Observable<{ data: Record<string, any> }> {
    return this.miningService.getTelemetryStream();
  }
}
