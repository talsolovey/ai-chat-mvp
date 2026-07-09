import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LlmModule } from '../llm/llm.module';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeRepository } from './knowledge.repository';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeDocumentSchema } from './persistence/knowledge-document.schema';
import { KnowledgeChunkSchema } from './persistence/knowledge-chunk.schema';
import { MongoKnowledgeRepository } from './persistence/mongo-knowledge.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'KnowledgeDocument', schema: KnowledgeDocumentSchema },
      { name: 'KnowledgeChunk', schema: KnowledgeChunkSchema },
    ]),
    LlmModule,
  ],
  controllers: [KnowledgeController],
  providers: [
    KnowledgeService,
    {
      provide: KnowledgeRepository,
      useClass: MongoKnowledgeRepository,
    },
  ],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
