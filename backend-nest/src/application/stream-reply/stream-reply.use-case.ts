import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  AIMessage,
  HumanMessage,
  isAIMessage,
  type AIMessageChunk,
  type BaseMessage,
} from '@langchain/core/messages';
import type { RunnableConfig } from '@langchain/core/runnables';
import { ConversationsService } from '../../modules/conversations/conversations.service';
import { ConversationType } from '../../modules/conversations/conversations.entity';
import { MessagesService } from '../../modules/messages/messages.service';
import { UserId } from '../../modules/users/user.entity';
import { Citation } from '../../modules/knowledge/knowledge.entity';
import { TransactionRunner } from '../../common/persistence/transaction-runner';
import { AGENT_GRAPH } from '../../modules/agent/agent.module';
import type { AgentGraph } from '../../modules/agent/agent.graph';
import type { AgentStateType } from '../../modules/agent/agent.state';

const THREAD_SEED_MESSAGE_LIMIT = 20;

export type StreamReplyEvent =
  | { type: 'token'; text: string }
  | { type: 'tool_call'; name: string }
  | { type: 'tool_result'; name: string }
  | { type: 'citations'; citations: Citation[] }
  | { type: 'done'; messageId: string; sentAt: string };

@Injectable()
export class StreamReplyUseCase {
  constructor(
    @Inject(AGENT_GRAPH) private readonly agentGraph: AgentGraph,
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
    private readonly transactionRunner: TransactionRunner,
  ) {}

  async *execute(
    conversationId: string,
    authenticatedUserId: UserId,
    conversationType: Extract<ConversationType, 'assistant' | 'tutor'>,
  ): AsyncGenerator<StreamReplyEvent> {
    const runConfig: RunnableConfig = {
      configurable: { thread_id: conversationId, userId: authenticatedUserId },
    };

    const graphInputMessages = await this.buildGraphInputMessages(
      conversationId,
      runConfig,
    );

    let streamedAnyToken = false;
    const graphEventStream = this.agentGraph.streamEvents(
      {
        messages: graphInputMessages,
        conversationId,
        conversationType,
      },
      { ...runConfig, version: 'v2' as const },
    );
    for await (const graphEvent of graphEventStream) {
      if (graphEvent.event === 'on_chat_model_stream') {
        const tokenChunk = graphEvent.data.chunk as AIMessageChunk;
        if (tokenChunk.text) {
          streamedAnyToken = true;
          yield { type: 'token', text: tokenChunk.text };
        }
      } else if (graphEvent.event === 'on_tool_start') {
        yield { type: 'tool_call', name: graphEvent.name };
      } else if (graphEvent.event === 'on_tool_end') {
        yield { type: 'tool_result', name: graphEvent.name };
      }
    }

    const finalAgentState = await this.getAgentThreadState(runConfig);
    const finalAgentMessage = finalAgentState.messages.at(-1);
    // The streaming models yield an AIMessageChunk (not an AIMessage), so an
    // `instanceof AIMessage` check silently drops the reply. isAIMessage()
    // covers both, keying off the message type instead of the concrete class.
    const assistantReplyText =
      finalAgentMessage && isAIMessage(finalAgentMessage)
        ? finalAgentMessage.text
        : '';

    if (!assistantReplyText.trim()) {
      throw new ServiceUnavailableException(
        'The assistant did not return a reply',
      );
    }

    if (!streamedAnyToken) {
      yield { type: 'token', text: assistantReplyText };
    }

    if (finalAgentState.citations.length > 0) {
      yield { type: 'citations', citations: finalAgentState.citations };
    }

    yield await this.persistAssistantReply(
      conversationId,
      assistantReplyText,
      finalAgentState.citations,
    );
  }

  private async getAgentThreadState(
    runConfig: RunnableConfig,
  ): Promise<AgentStateType> {
    const threadStateSnapshot = await this.agentGraph.getState(runConfig);
    return threadStateSnapshot.values as AgentStateType;
  }

  private async buildGraphInputMessages(
    conversationId: string,
    runConfig: RunnableConfig,
  ): Promise<BaseMessage[]> {
    const recentPersistedHistory = await this.messagesService.getRecentHistory(
      conversationId,
      THREAD_SEED_MESSAGE_LIMIT,
    );
    const latestPersistedMessage = recentPersistedHistory.at(-1);
    if (!latestPersistedMessage || latestPersistedMessage.role !== 'user') {
      throw new ServiceUnavailableException('No user question found to answer');
    }

    const agentThreadState = await this.getAgentThreadState(runConfig);
    const agentThreadIsEmpty = (agentThreadState.messages?.length ?? 0) === 0;

    const toLangChainMessage = (persistedMessage: {
      role: string;
      content: string;
    }): BaseMessage =>
      persistedMessage.role === 'user'
        ? new HumanMessage(persistedMessage.content)
        : new AIMessage(persistedMessage.content);

    return agentThreadIsEmpty
      ? recentPersistedHistory.map(toLangChainMessage)
      : [toLangChainMessage(latestPersistedMessage)];
  }

  private async persistAssistantReply(
    conversationId: string,
    assistantReplyText: string,
    citations: Citation[],
  ): Promise<Extract<StreamReplyEvent, { type: 'done' }>> {
    const savedAssistantMessage = await this.transactionRunner.run(
      async (transaction) => {
        const persistedAssistantMessage =
          await this.messagesService.createAssistantMessage(
            conversationId,
            assistantReplyText,
            transaction,
            citations,
          );

        await this.conversationsService.updateLastMessage(
          conversationId,
          assistantReplyText,
          persistedAssistantMessage.sentAt,
          transaction,
        );

        return persistedAssistantMessage;
      },
    );

    return {
      type: 'done',
      messageId: savedAssistantMessage.id,
      sentAt: savedAssistantMessage.sentAt,
    };
  }
}
