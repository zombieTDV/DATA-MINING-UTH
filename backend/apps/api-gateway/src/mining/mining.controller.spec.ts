import { Test, TestingModule } from '@nestjs/testing';
import { MiningController } from './mining.controller';
import { MiningService } from './mining.service';

describe('MiningController', () => {
  let controller: MiningController;
  let service: MiningService;

  const mockEdaResponse: any = {
    dataset_overview: { total_papers: 10000 },
    category_distribution: [{ category: 'cs.AI', count: 3420 }],
    top_authors: [{ author: 'Yang Liu', paper_count: 38 }],
  };

  const mockRulesResponse: any = {
    rules: [{ antecedents: ['cat:cs.AI'], consequents: ['cat:cs.LG'], lift: 1.84 }],
  };

  const mockClustersResponse: any = {
    validity_metrics: { silhouette_score: 0.0216 },
    cluster_profiles: [{ cluster_id: 0, size: 850 }],
  };

  const mockGraphResponse: any = {
    network_summary: { total_authors: 35117, total_collaborations: 130082 },
  };

  const mockTrendsResponse: any = {
    anomalies: [{ paper_id: '2310.01234', anomaly_score: -0.65 }],
    trend_velocity: [{ category: 'cs.AI', momentum: 'ACCELERATING' }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MiningController],
      providers: [
        {
          provide: MiningService,
          useValue: {
            getEdaSummary: jest.fn().mockResolvedValue(mockEdaResponse),
            getAssociationRules: jest.fn().mockResolvedValue(mockRulesResponse),
            getClusters: jest.fn().mockResolvedValue(mockClustersResponse),
            getGraph: jest.fn().mockResolvedValue(mockGraphResponse),
            getTrendsAndAnomalies: jest.fn().mockResolvedValue(mockTrendsResponse),
            getManifest: jest.fn().mockResolvedValue({ status: 'COMPLETED' }),
            getTelemetryStream: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MiningController>(MiningController);
    service = module.get<MiningService>(MiningService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return EDA summary', async () => {
    const result = await controller.getEda();
    expect(result.dataset_overview.total_papers).toBe(10000);
  });

  it('should return Association Rules', async () => {
    const result = await controller.getAssociationRules();
    expect(result.rules.length).toBeGreaterThan(0);
    expect(result.rules[0].lift).toBe(1.84);
  });

  it('should return Clusters', async () => {
    const result = await controller.getClusters();
    expect(result.validity_metrics.silhouette_score).toBe(0.0216);
  });

  it('should return Graph topology', async () => {
    const result = await controller.getGraph();
    expect(result.network_summary.total_authors).toBe(35117);
  });

  it('should return Trends and Anomalies', async () => {
    const result = await controller.getTrends();
    expect(result.anomalies.length).toBe(1);
    expect(result.trend_velocity[0].momentum).toBe('ACCELERATING');
  });
});
