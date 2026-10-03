import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from '@app/shared';
import { EngineModule } from './engine/engine.module';
import { HealthController } from './health/health.controller';
import { EmbeddingsController } from './embeddings/embeddings.controller';
import { ChatController } from './chat/chat.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env'],
      ignoreEnvFile: process.env.NODE_ENV === 'test',
    }),
    EngineModule,
  ],
  controllers: [
    HealthController,
    EmbeddingsController,
    ChatController,
  ],
})
export class AppModule {}
