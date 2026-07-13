import { Module } from '@nestjs/common';
import { EmbeddingsProvider } from './embeddings-provider';
import { OpenAiEmbeddingsService } from './openai-embeddings.service';

@Module({
  providers: [
    {
      provide: EmbeddingsProvider,
      useClass: OpenAiEmbeddingsService,
    },
  ],
  exports: [EmbeddingsProvider],
})
export class LlmModule {}
