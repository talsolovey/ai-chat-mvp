import { Module } from '@nestjs/common';
import { LlmProvider } from './llm-provider';
import { OpenAiService } from './openai.service';

@Module({
  providers: [
    {
      provide: LlmProvider,
      useClass: OpenAiService,
    },
  ],
  exports: [LlmProvider],
})
export class LlmModule {}
