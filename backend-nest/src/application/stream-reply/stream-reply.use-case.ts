import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConversationsService } from '../../modules/conversations/conversations.service';
import { MessagesService } from '../../modules/messages/messages.service';
import { UserId } from '../../modules/users/user.entity';
import { LlmMessage, LlmProvider } from '../../modules/llm/llm-provider';
import { TransactionRunner } from '../../common/persistence/transaction-runner';
import {
  ASSISTANT_SYSTEM_PROMPT,
  ASSISTANT_HISTORY_MESSAGE_LIMIT,
} from '../../modules/llm/prompts/assistant.prompt';
import { createSummarizeMyRecentMessagesTool } from '../tools/summarize-my-recent-messages.tool';

export type StreamReplyEvent =
  | { type: 'token'; text: string }
  | { type: 'done'; messageId: string; sentAt: string };

@Injectable()
export class StreamReplyUseCase {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
    private readonly llmProvider: LlmProvider,
    private readonly transactionRunner: TransactionRunner,
  ) {}

  async *execute(
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

    const savedAssistantMessage = await this.transactionRunner.run(
      async (transaction) => {
        const persistedAssistantMessage =
          await this.messagesService.createAssistantMessage(
            conversationId,
            accumulatedReplyText,
            transaction,
          );

        await this.conversationsService.updateLastMessage(
          conversationId,
          accumulatedReplyText,
          persistedAssistantMessage.sentAt,
          transaction,
        );

        return persistedAssistantMessage;
      },
    );

    yield {
      type: 'done',
      messageId: savedAssistantMessage.id,
      sentAt: savedAssistantMessage.sentAt,
    };
  }
}
