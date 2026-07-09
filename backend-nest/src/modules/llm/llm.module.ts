import { Module } from '@nestjs/common';
import { LlmProvider } from './llm-provider';
import { OpenAiService } from './openai.service';
import { EmbeddingsProvider } from './embeddings-provider';
import { OpenAiEmbeddingsService } from './openai-embeddings.service';
import { TutorRagChain } from './tutor-rag.chain';

@Module({
  providers: [
    {
      provide: LlmProvider,
      useClass: OpenAiService,
    },
    {
      provide: EmbeddingsProvider,
      useClass: OpenAiEmbeddingsService,
    },
    TutorRagChain,
  ],
  exports: [LlmProvider, EmbeddingsProvider, TutorRagChain],
})
export class LlmModule {}
