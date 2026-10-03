import { ChunkDto } from '../dto/search.dto';
import { CitationDto } from '../dto/chat.dto';

export class GroundedPromptBuilder {
  /**
   * Format chunks into structured context blocks for the LLM
   */
  static formatContext(chunks: ChunkDto[]): string {
    if (!chunks || chunks.length === 0) {
      return 'No scientific context available.';
    }

    return chunks
      .map((chunk, idx) => {
        const id = `[Chunk ${idx + 1}]`;
        const authors = chunk.authors && chunk.authors.length > 0 ? chunk.authors.join(', ') : 'Unknown';
        const year = chunk.year ? ` (${chunk.year})` : '';
        const meta = `arXiv:${chunk.paper_id} | "${chunk.title}" | Authors: ${authors}${year}`;
        const body = (chunk.text || chunk.abstract || '').trim();
        return `${id} ${meta}\n${body}`;
      })
      .join('\n\n---\n\n');
  }

  /**
   * System prompt enforcing strict scientific grounding and citation format
   */
  static getSystemPrompt(): string {
    return [
      'You are a specialized AI Research Assistant for Scientific Paper Mining and Literature Review.',
      'Your task is to provide rigorous, accurate, and faithful answers to the user inquiry based strictly on the provided Context Chunks.',
      '',
      'Mandatory Grounding Rules:',
      '1. Ground every claim directly in the provided Context Chunks.',
      '2. Cite your sources inline using chunk references like [Chunk 1], [Chunk 2], or [arXiv:xxxx.xxxxx].',
      '3. If the provided context does not contain enough information to answer the question, explicitly state: "Based on the retrieved scientific papers, there is insufficient evidence to address this question."',
      '4. Do not invent citations, papers, benchmarks, or mathematical claims not present in the context.',
      '5. Maintain a professional, objective, academic tone.',
    ].join('\n');
  }

  /**
   * Construct the final user prompt including context and question
   */
  static buildUserPrompt(question: string, chunks: ChunkDto[]): string {
    const formattedContext = this.formatContext(chunks);
    return [
      '### Retrieved Context Chunks:',
      formattedContext,
      '',
      '### Research Inquiry:',
      question,
      '',
      '### Grounded Answer (remember to cite [Chunk X]):',
    ].join('\n');
  }

  /**
   * Extract citations used in the response and match them back to chunks
   */
  static extractCitations(answer: string, chunks: ChunkDto[]): CitationDto[] {
    const citations: CitationDto[] = [];
    const seenPaperIds = new Set<string>();

    chunks.forEach((chunk, idx) => {
      const chunkTag = `[Chunk ${idx + 1}]`;
      const paperTag = chunk.paper_id;

      const mentionsChunk = answer.includes(chunkTag);
      const mentionsPaper = paperTag && answer.includes(paperTag);

      // If explicitly cited or if only 1 chunk was provided and used
      if (mentionsChunk || mentionsPaper) {
        if (!seenPaperIds.has(chunk.paper_id)) {
          seenPaperIds.add(chunk.paper_id);
          citations.push({
            id: chunkTag,
            paper_id: chunk.paper_id,
            title: chunk.title,
            authors: chunk.authors,
            year: chunk.year,
            doi: chunk.doi,
          });
        }
      }
    });

    // If model didn't use explicit [Chunk X] tags but referenced the papers implicitly,
    // fallback to listing top chunks as references
    if (citations.length === 0 && chunks.length > 0) {
      chunks.slice(0, 3).forEach((chunk, idx) => {
        citations.push({
          id: `[Chunk ${idx + 1}]`,
          paper_id: chunk.paper_id,
          title: chunk.title,
          authors: chunk.authors,
          year: chunk.year,
          doi: chunk.doi,
        });
      });
    }

    return citations;
  }
}
