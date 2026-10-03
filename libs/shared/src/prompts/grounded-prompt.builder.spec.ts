import { GroundedPromptBuilder } from './grounded-prompt.builder';
import { ChunkDto } from '../dto/search.dto';

describe('GroundedPromptBuilder', () => {
  const mockChunks: ChunkDto[] = [
    {
      chunk_id: '2401.00001_0',
      paper_id: '2401.00001',
      title: 'Post-Training Quantization for Large Language Models',
      authors: ['Alice Smith', 'Bob Jones'],
      year: 2024,
      abstract: 'We explore 4-bit integer quantization.',
      text: 'AWQ and GPTQ achieve near-lossless perplexity on 70B models.',
    },
    {
      chunk_id: '2401.00002_0',
      paper_id: '2401.00002',
      title: 'Survey on Knowledge Distillation in NLP',
      authors: ['Charlie Brown'],
      year: 2023,
      text: 'Distillation transfers representations from large teachers to compact students.',
    },
  ];

  it('formats context chunks accurately', () => {
    const context = GroundedPromptBuilder.formatContext(mockChunks);
    expect(context).toContain('[Chunk 1]');
    expect(context).toContain('2401.00001');
    expect(context).toContain('Post-Training Quantization');
    expect(context).toContain('[Chunk 2]');
  });

  it('handles empty context gracefully', () => {
    const context = GroundedPromptBuilder.formatContext([]);
    expect(context).toContain('No scientific context available');
  });

  it('builds system prompt with grounding rules', () => {
    const sysPrompt = GroundedPromptBuilder.getSystemPrompt();
    expect(sysPrompt).toContain('Ground every claim directly');
    expect(sysPrompt).toContain('[Chunk 1]');
  });

  it('builds user prompt with context and inquiry', () => {
    const userPrompt = GroundedPromptBuilder.buildUserPrompt('What is AWQ?', mockChunks);
    expect(userPrompt).toContain('### Retrieved Context Chunks:');
    expect(userPrompt).toContain('What is AWQ?');
  });

  it('extracts explicit citations from response', () => {
    const answer = 'According to [Chunk 1], AWQ retains perplexity on 70B models.';
    const citations = GroundedPromptBuilder.extractCitations(answer, mockChunks);
    expect(citations.length).toBe(1);
    expect(citations[0].paper_id).toBe('2401.00001');
  });

  it('falls back to top chunks if no explicit tags in answer', () => {
    const answer = 'Quantization and distillation are both popular compression techniques.';
    const citations = GroundedPromptBuilder.extractCitations(answer, mockChunks);
    expect(citations.length).toBe(2);
    expect(citations[0].id).toBe('[Chunk 1]');
  });

  it('respects character budgeting and truncates when exceeding budget', () => {
    const context = GroundedPromptBuilder.formatContext(mockChunks, 150);
    expect(context).toContain('[Chunk 1]');
    expect(context).not.toContain('[Chunk 2]');
  });
});
