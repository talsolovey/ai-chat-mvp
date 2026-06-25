import { z } from 'zod';
import { LlmTool } from '../../modules/llm/llm-tool';
import { MessagesService } from '../../modules/messages/messages.service';
import { UserId } from '../../modules/users/user.entity';

const SummarizeRecentMessagesInputSchema = z.object({
  limit: z.number().int().min(1).max(50),
});

const SummarizeRecentMessagesOutputSchema = z.object({
  messages: z.array(
    z.object({
      conversationId: z.string(),
      content: z.string(),
      sentAt: z.string(),
    }),
  ),
});

export type SummarizeMyRecentMessagesDependencies = {
  messagesService: MessagesService;
};

export function createSummarizeMyRecentMessagesTool(
  dependencies: SummarizeMyRecentMessagesDependencies,
  authenticatedUserId: UserId,
): LlmTool {
  return {
    name: 'summarize_my_recent_messages',
    description:
      "Fetch the current user's most recent messages (newest last) so they " +
      'can be summarized. Use when the user asks for a recap or summary of ' +
      'what they have recently said.',
    inputJsonSchema: z.toJSONSchema(
      SummarizeRecentMessagesInputSchema,
    ) as Record<string, unknown>,
    async run(rawToolInput: unknown): Promise<unknown> {
      const { limit: requestedMessageLimit } =
        SummarizeRecentMessagesInputSchema.parse(rawToolInput);

      const recentMessages = await dependencies.messagesService.getRecentByUser(
        authenticatedUserId,
        requestedMessageLimit,
      );

      return SummarizeRecentMessagesOutputSchema.parse({
        messages: recentMessages.map((message) => ({
          conversationId: message.conversationId,
          content: message.content,
          sentAt: message.sentAt,
        })),
      });
    },
  };
}
