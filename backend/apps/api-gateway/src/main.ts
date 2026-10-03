import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('ApiGateway');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('GATEWAY_PORT', 8000);
  const frontendOrigin = configService.get<string>(
    'FRONTEND_ORIGIN',
    'http://localhost:5173',
  );

  // Enable CORS for frontend applications (React, Vite, tunnel domains)
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const allowedOriginPatterns = [
        /^http:\/\/localhost:[0-9]+$/,
        /^http:\/\/127\.0\.0\.1:[0-9]+$/,
        /\.trycloudflare\.com$/,
        /\.ngrok-free\.app$/,
        /\.ngrok\.app$/,
        /\.vercel\.app$/,
      ];

      const isExplicitlyAllowed = origin === frontendOrigin;
      const matchesPattern = allowedOriginPatterns.some((pattern) => pattern.test(origin));

      if (isExplicitlyAllowed || matchesPattern || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} blocked by CORS policy`), false);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    exposedHeaders: ['Content-Type', 'Cache-Control', 'Connection'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Swagger Documentation on /api/docs and /api/docs-json
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Scientific Literature RAG API Gateway')
    .setDescription(
      'API Gateway providing full-text & semantic retrieval over Cloudflare R2 LanceDB and grounded LLM answers.',
    )
    .setVersion('1.0.0')
    .addTag('Health', 'Gateway and upstream lakehouse status')
    .addTag('Search', 'LanceDB FTS and vector search endpoints')
    .addTag('Chat', 'Grounded scientific literature question answering (JSON and SSE stream)')
    .addTag('Papers', 'Individual paper and chunk inspection')
    .addTag('Storage', 'Cloudflare R2 Lakehouse storage statistics')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs-json',
  });

  await app.listen(port);
  logger.log(`API Gateway running on http://localhost:${port}`);
  logger.log(`Swagger documentation available at http://localhost:${port}/api/docs`);
  logger.log(`Swagger JSON spec available at http://localhost:${port}/api/docs-json`);
}

bootstrap();
