import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import type { BaseCheckpointSaver } from '@langchain/langgraph';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { MessagesDomainModule } from '../messages/messages-domain.module';
import { MessagesService } from '../messages/messages.service';
import {
  checkpointerProvider,
  AGENT_CHECKPOINTER,
} from './checkpointer.provider';
import { buildAgentGraph, type AgentGraph } from './agent.graph';
import { buildTutorAnswerNode } from './nodes/tutor-answer.node';
import { buildAssistantAgentNode } from './nodes/assistant-agent.node';
import { buildSearchDocumentsTool } from './tools/search-documents.tool';
import { buildSummarizeMyRecentMessagesTool } from './tools/summarize-my-recent-messages.tool';

export const AGENT_GRAPH = Symbol('AGENT_GRAPH');

const TUTOR_ANSWER_MAX_TOKENS = 512;
const TUTOR_TEMPERATURE = 0.2;

@Module({
  imports: [KnowledgeModule, MessagesDomainModule],
  providers: [
    checkpointerProvider,
    {
      provide: AGENT_GRAPH,
      inject: [
        KnowledgeService,
        MessagesService,
        ConfigService,
        AGENT_CHECKPOINTER,
      ],
      useFactory: (
        knowledgeService: KnowledgeService,
        messagesService: MessagesService,
        configService: ConfigService,
        checkpointer: BaseCheckpointSaver,
      ): AgentGraph => {
        const sharedChatModelOptions = {
          apiKey: configService.get<string>('llm.apiKey'),
          model: configService.get<string>('llm.model'),
          streaming: true,
        };
        const tutorChatModel = new ChatOpenAI({
          ...sharedChatModelOptions,
          maxTokens: TUTOR_ANSWER_MAX_TOKENS,
          temperature: TUTOR_TEMPERATURE,
        });
        const assistantChatModel = new ChatOpenAI({
          ...sharedChatModelOptions,
          maxTokens: configService.get<number>('llm.maxTokens'),
          temperature: configService.get<number>('llm.temperature'),
        });

        return buildAgentGraph({
          tutorAnswerNode: buildTutorAnswerNode(
            knowledgeService,
            tutorChatModel,
          ),
          assistantAgentNode: buildAssistantAgentNode(assistantChatModel, [
            buildSearchDocumentsTool(knowledgeService),
            buildSummarizeMyRecentMessagesTool(messagesService),
          ]),
          checkpointer,
        });
      },
    },
  ],
  exports: [AGENT_GRAPH, checkpointerProvider],
})
export class AgentModule {}
