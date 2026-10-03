process.env.NODE_ENV = 'test';
process.env.LLM_MODE = 'mock';
process.env.LLM_PORT = '9001';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('LlmService (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.LLM_MODE = 'mock';
    process.env.LLM_PORT = '9001';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200 with model info', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('llm-service');
    expect(res.body.model.loaded).toBe(true);
  });

  it('GET /v1/models returns OpenAI model list', async () => {
    const res = await request(app.getHttpServer()).get('/v1/models').expect(200);
    expect(res.body.object).toBe('list');
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].id).toContain('qwen');
  });

  it('POST /v1/embeddings returns 501 Not Implemented placeholder', async () => {
    await request(app.getHttpServer()).post('/v1/embeddings').send({ input: 'test' }).expect(501);
  });

  it('POST /v1/chat/completions returns completion result', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/chat/completions')
      .send({
        messages: [{ role: 'user', content: 'What is model quantization?' }],
        max_tokens: 100,
        temperature: 0.7,
      })
      .expect(200);

    expect(res.body.choices[0].message.role).toBe('assistant');
    expect(res.body.choices[0].message.content).toContain('Chunk 1');
  });
});
