import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConversationsService } from '../../modules/conversations/conversations.service';
import { ConversationType } from '../../modules/conversations/conversations.entity';
import { MessagesService } from '../../modules/messages/messages.service';
import { UserId } from '../../modules/users/user.entity';
import { LlmMessage, LlmProvider } from '../../modules/llm/llm-provider';
import { TutorRagChain } from '../../modules/llm/tutor-rag.chain';
import { KnowledgeService } from '../../modules/knowledge/knowledge.service';
import { Citation, toCitation } from '../../modules/knowledge/knowledge.entity';
import { TransactionRunner } from '../../common/persistence/transaction-runner';
import {
  ASSISTANT_SYSTEM_PROMPT,
  ASSISTANT_HISTORY_MESSAGE_LIMIT,
} from '../../modules/llm/prompts/assistant.prompt';
import {
  TUTOR_HISTORY_MESSAGE_LIMIT,
  TUTOR_NO_CONTEXT_REPLY,
} from '../../modules/llm/prompts/tutor.prompt';
import { createSummarizeMyRecentMessagesTool } from '../tools/summarize-my-recent-messages.tool';

export type StreamReplyEvent =
  | { type: 'token'; text: string }
  | { type: 'citations'; citations: Citation[] }
  | { type: 'done'; messageId: string; sentAt: string };

@Injectable()
export class StreamReplyUseCase {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
    private readonly llmProvider: LlmProvider,
    private readonly tutorRagChain: TutorRagChain,
    private readonly knowledgeService: KnowledgeService,
    private readonly transactionRunner: TransactionRunner,
  ) {}

  async *execute(
    conversationId: string,
    authenticatedUserId: UserId,
    conversationType: Extract<ConversationType, 'assistant' | 'tutor'>,
  ): AsyncGenerator<StreamReplyEvent> {
    yield* conversationType === 'tutor'
      ? this.streamTutorReply(conversationId, authenticatedUserId)
      : this.streamAssistantReply(conversationId, authenticatedUserId);
  }

  private async *streamAssistantReply(
    conversationId: string,
    authenticatedUserId: UserId,
  ): AsyncGenerator<StreamReplyEvent> {
    const recentMessageHistory = await this.messagesService.getRecentHistory(
      conversationId,
      ASSISTANT_HISTORY_MESSAGE_LIMIT,
    );

    const conversationHistoryForModel: LlmMessage[] = recentMessageHistory.map(
      (message) => ({
        role: message.role,
        content: message.content,
      }),
    );

    const userScopedTools = [
      createSummarizeMyRecentMessagesTool(
        { messagesService: this.messagesService },
        authenticatedUserId,
      ),
    ];

    let accumulatedReplyText = '';
    for await (const streamEvent of this.llmProvider.streamAssistantReply({
      systemPrompt: ASSISTANT_SYSTEM_PROMPT,
      messages: conversationHistoryForModel,
      tools: userScopedTools,
    })) {
      if (streamEvent.type === 'token') {
        accumulatedReplyText += streamEvent.text;
        yield { type: 'token', text: streamEvent.text };
      }
    }

    if (!accumulatedReplyText.trim()) {
      throw new ServiceUnavailableException(
        'The assistant did not return a reply',
      );
    }

    yield await this.persistReply(conversationId, accumulatedReplyText, []);
  }

  private async *streamTutorReply(
    conversationId: string,
    authenticatedUserId: UserId,
  ): AsyncGenerator<StreamReplyEvent> {
    const recentMessageHistory = await this.messagesService.getRecentHistory(
      conversationId,
      TUTOR_HISTORY_MESSAGE_LIMIT,
    );
    const latestUserMessage = recentMessageHistory.at(-1);
    if (!latestUserMessage || latestUserMessage.role !== 'user') {
      throw new ServiceUnavailableException('No user question found to answer');
    }

    const retrievedChunks = await this.knowledgeService.retrieveRelevantChunks(
      authenticatedUserId,
      latestUserMessage.content,
    );

    if (retrievedChunks.length === 0) {
      yield { type: 'token', text: TUTOR_NO_CONTEXT_REPLY };
      yield await this.persistReply(conversationId, TUTOR_NO_CONTEXT_REPLY, []);
      return;
    }

    const priorConversationHistory: LlmMessage[] = recentMessageHistory
      .slice(0, -1)
      .map((message) => ({ role: message.role, content: message.content }));

    let accumulatedReplyText = '';
    for await (const token of this.tutorRagChain.streamGroundedAnswer({
      question: latestUserMessage.content,
      retrievedChunks,
      history: priorConversationHistory,
    })) {
      accumulatedReplyText += token;
      yield { type: 'token', text: token };
    }

    if (!accumulatedReplyText.trim()) {
      throw new ServiceUnavailableException('The tutor did not return a reply');
    }

    const citations = retrievedChunks.map(toCitation);
    yield { type: 'citations', citations };
    yield await this.persistReply(
      conversationId,
      accumulatedReplyText,
      citations,
    );
  }

  private async persistReply(
    conversationId: string,
    replyText: string,
    citations: Citation[],
  ): Promise<Extract<StreamReplyEvent, { type: 'done' }>> {
    const savedAssistantMessage = await this.transactionRunner.run(
      async (transaction) => {
        const persistedAssistantMessage =
          await this.messagesService.createAssistantMessage(
            conversationId,
            replyText,
            transaction,
            citations,
          );

        await this.conversationsService.updateLastMessage(
          conversationId,
          replyText,
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
