import { validateEnv } from './env.schema';

describe('validateEnv', () => {
  it('applies default configurations when empty object provided', () => {
    const config = validateEnv({});
    expect(config.GATEWAY_PORT).toBe(8000);
    expect(config.LLM_PORT).toBe(9001);
    expect(config.RETRIEVAL_MODE).toBe('lancedb');
    expect(config.LLM_MODE).toBe('gguf');
    expect(config.LLM_CONTEXT_SIZE).toBe(4096);
  });

  it('parses custom configurations and coerces numbers', () => {
    const config = validateEnv({
      GATEWAY_PORT: '8080',
      RETRIEVAL_MODE: 'mock',
      LLM_MODE: 'mock',
      LLM_MAX_TOKENS: '512',
    });
    expect(config.GATEWAY_PORT).toBe(8080);
    expect(config.RETRIEVAL_MODE).toBe('mock');
    expect(config.LLM_MODE).toBe('mock');
    expect(config.LLM_MAX_TOKENS).toBe(512);
  });

  it('rejects invalid enum values', () => {
    expect(() =>
      validateEnv({
        RETRIEVAL_MODE: 'invalid_mode',
      }),
    ).toThrow('Environment validation failed');
  });
});
