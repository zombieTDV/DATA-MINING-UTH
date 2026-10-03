import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('LlmService');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('LLM_PORT', 9001);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Swagger Documentation on /docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('LLM Service API')
    .setDescription(
      'Dedicated local LLM serving service powered by node-llama-cpp and Qwen 2.5 7B GGUF.',
    )
    .setVersion('1.0.0')
    .addTag('Health', 'Service health and compute backend status')
    .addTag('Models', 'Loaded model specifications')
    .addTag('Chat', 'OpenAI-compatible streaming chat completions')
    .addTag('Embeddings', 'Vector embeddings (placeholder)')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  logger.log(`LLM Service running on http://localhost:${port}`);
  logger.log(`Swagger documentation available at http://localhost:${port}/docs`);
}

bootstrap();
