import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import llmConfig from '../../src/config/llm.config';
import { CommonModule } from '../../src/common/common.module';
import { KnowledgeModule } from '../../src/modules/knowledge/knowledge.module';
import { AgentModule } from '../../src/modules/agent/agent.module';

@Module({
  imports: [
    CommonModule,
    ConfigModule.forRoot({ isGlobal: true, load: [llmConfig] }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),
    AgentModule,
    KnowledgeModule,
  ],
})
export class TutorEvalModule {}
