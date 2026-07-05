import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import llmConfig from '../../src/config/llm.config';
import { KnowledgeModule } from '../../src/modules/knowledge/knowledge.module';
import { LlmModule } from '../../src/modules/llm/llm.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [llmConfig] }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),
    LlmModule,
    KnowledgeModule,
  ],
})
export class TutorEvalModule {}
