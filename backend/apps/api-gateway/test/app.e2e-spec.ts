process.env.NODE_ENV = 'test';
process.env.RETRIEVAL_MODE = 'mock';
process.env.GATEWAY_PORT = '8000';
process.env.LLM_SERVICE_URL = 'http://localhost:9001';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { LlmClientService } from '../src/llm-client/llm-client.service';

describe('ApiGateway (e2e)', () => {
  let app: INestApplication;

  const mockLlmClient = {
    checkHealth: jest.fn().mockResolvedValue({ status: 'ok', backend: 'mock', loaded: true }),
    generateChatCompletion: jest.fn().mockResolvedValue({
      answer: 'According to [Chunk 1], AWQ reduces quantization error significantly.',
      tokensUsed: 45,
    }),
    streamChatCompletion: jest
      .fn()
      .mockImplementation(async (_messages, onChunk) => {
        onChunk('According to ');
        onChunk('[Chunk 1], ');
        onChunk('AWQ reduces quantization error.');
        return 'According to [Chunk 1], AWQ reduces quantization error.';
      }),
  };

  beforeAll(async () => {
    process.env.RETRIEVAL_MODE = 'mock';
    process.env.GATEWAY_PORT = '8000';
    process.env.LLM_SERVICE_URL = 'http://localhost:9001';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LlmClientService)
      .useValue(mockLlmClient)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health returns 200 and healthy status', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('api-gateway');
    expect(res.body.dependencies.retrieval.status).toBe('ready');
  });

  it('POST /api/search returns results for valid query', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/search')
      .send({ query: 'quantization', topK: 2 })
      .expect(200);

    expect(res.body.query).toBe('quantization');
    expect(res.body.results.length).toBeLessThanOrEqual(2);
    expect(res.body.results.length).toBeGreaterThan(0);
    expect(res.body.results[0]).toHaveProperty('chunk_id');
    expect(res.body.results[0]).toHaveProperty('title');
  });

  it('POST /api/search rejects empty query with 400 Bad Request', async () => {
    await request(app.getHttpServer()).post('/api/search').send({ query: '' }).expect(400);
  });

  it('POST /api/chat returns grounded answer with citations', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/chat')
      .send({ message: 'Explain AWQ quantization.' })
      .expect(200);

    expect(res.body.answer).toContain('AWQ');
    expect(res.body.citations.length).toBeGreaterThan(0);
    expect(res.body.chunks.length).toBeGreaterThan(0);
    expect(res.body.timings).toHaveProperty('retrievalMs');
  });

  it('GET /api/papers/:paperId returns chunk list', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/papers/2401.00001')
      .expect(200);

    expect(res.body.paper_id).toBe('2401.00001');
    expect(res.body.chunks.length).toBeGreaterThan(0);
  });

  it('GET /api/storage/stats returns lakehouse statistics', async () => {
    const res = await request(app.getHttpServer()).get('/api/storage/stats').expect(200);
    expect(res.body.status).toBe('ready');
    expect(res.body.zones.goldChunkCount).toBe(143523);
  });
});
