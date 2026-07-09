import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';
import type { LlmMessage } from './llm-provider';
import type { RetrievedChunk } from '../knowledge/knowledge.entity';
import { TUTOR_SYSTEM_PROMPT } from './prompts/tutor.prompt';

const TUTOR_ANSWER_MAX_TOKENS = 512;
const TUTOR_TEMPERATURE = 0.2;

@Injectable()
export class TutorRagChain {
  private readonly chatModel: ChatOpenAI;

  constructor(configService: ConfigService) {
    this.chatModel = new ChatOpenAI({
      apiKey: configService.get<string>('llm.apiKey'),
      model: configService.get<string>('llm.model'),
      maxTokens: TUTOR_ANSWER_MAX_TOKENS,
      temperature: TUTOR_TEMPERATURE,
    });
  }

  async *streamGroundedAnswer(args: {
    question: string;
    retrievedChunks: RetrievedChunk[];
    history: LlmMessage[];
  }): AsyncIterable<string> {
    const ragChain = ChatPromptTemplate.fromMessages([
      ['system', TUTOR_SYSTEM_PROMPT],
      ['placeholder', '{history}'],
      ['human', '{question}'],
    ])
      .pipe(this.chatModel)
      .pipe(new StringOutputParser());

    const tokenStream = await ragChain.stream({
      context: this.formatContext(args.retrievedChunks),
      history: this.toLangChainMessages(args.history),
      question: args.question,
    });

    for await (const token of tokenStream) {
      if (token) {
        yield token;
      }
    }
  }

  private formatContext(retrievedChunks: RetrievedChunk[]): string {
    return retrievedChunks
      .map(
        (chunk, index) =>
          `[${index + 1}] From "${chunk.documentName}":\n${chunk.chunkText}`,
      )
      .join('\n\n');
  }

  private toLangChainMessages(history: LlmMessage[]): BaseMessage[] {
    return history.map((message) =>
      message.role === 'user'
        ? new HumanMessage(message.content)
        : new AIMessage(message.content),
    );
  }
}
