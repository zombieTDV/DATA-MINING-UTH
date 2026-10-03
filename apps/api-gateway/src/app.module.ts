import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from '@app/shared';
import { RetrievalModule } from './retrieval/retrieval.module';
import { LlmClientModule } from './llm-client/llm-client.module';
import { HealthController } from './health/health.controller';
import { SearchController } from './search/search.controller';
import { ChatController } from './chat/chat.controller';
import { PapersController } from './papers/papers.controller';
import { StorageController } from './storage/storage.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env'],
      ignoreEnvFile: process.env.NODE_ENV === 'test',
    }),
    RetrievalModule,
    LlmClientModule,
  ],
  controllers: [
    HealthController,
    SearchController,
    ChatController,
    PapersController,
    StorageController,
  ],
})
export class AppModule {}
