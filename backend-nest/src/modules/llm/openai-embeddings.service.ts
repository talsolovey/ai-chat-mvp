import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import { EmbeddingsProvider } from './embeddings-provider';

@Injectable()
export class OpenAiEmbeddingsService extends EmbeddingsProvider {
  private readonly openAiEmbeddings: OpenAIEmbeddings;

  constructor(configService: ConfigService) {
    super();
    this.openAiEmbeddings = new OpenAIEmbeddings({
      apiKey: configService.get<string>('llm.apiKey'),
      model: configService.get<string>('llm.embeddingModel'),
    });
  }

  embedDocuments(chunkTexts: string[]): Promise<number[][]> {
    return this.openAiEmbeddings.embedDocuments(chunkTexts);
  }

  embedQuery(queryText: string): Promise<number[]> {
    return this.openAiEmbeddings.embedQuery(queryText);
  }
}
