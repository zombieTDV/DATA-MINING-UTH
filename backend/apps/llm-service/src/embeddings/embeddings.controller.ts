import { Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Embeddings')
@Controller('v1/embeddings')
export class EmbeddingsController {
  @Post()
  @ApiOperation({
    summary: 'Generate text embeddings (Placeholder)',
    description:
      'Placeholder for 768-dimensional nomic-embed-text-v1.5 embeddings. Returns HTTP 501 until embedding model GGUF is mounted.',
  })
  @ApiResponse({ status: 501, description: 'Embeddings endpoint is currently a placeholder' })
  createEmbeddings() {
    throw new HttpException(
      {
        statusCode: HttpStatus.NOT_IMPLEMENTED,
        error: 'Not Implemented',
        message:
          'Dense vector embedding service is currently a placeholder. R2 database currently supports Full-Text Search (FTS). Vector embedding will be activated once nomic-embed-text-v1.5 GGUF is mounted.',
      },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }
}
