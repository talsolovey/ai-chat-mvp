import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { MessagesService } from '../../messages/messages.service';
import { getAuthenticatedUserIdFromRunConfig } from '../run-config';

const SummarizeRecentMessagesInputSchema = z.object({
  limit: z.number().int().min(1).max(50),
});

export function buildSummarizeMyRecentMessagesTool(
  messagesService: MessagesService,
) {
  return tool(
    async ({ limit }, runConfig: LangGraphRunnableConfig): Promise<string> => {
      const recentMessages = await messagesService.getRecentByUser(
        getAuthenticatedUserIdFromRunConfig(runConfig),
        limit,
      );
      return JSON.stringify({
        messages: recentMessages.map((recentMessage) => ({
          conversationId: recentMessage.conversationId,
          content: recentMessage.content,
          sentAt: recentMessage.sentAt,
        })),
      });
    },
    {
      name: 'summarize_my_recent_messages',
      description:
        "Fetch the current user's most recent messages (newest last) so they " +
        'can be summarized. Use when the user asks for a recap or summary of ' +
        'what they have recently said.',
      schema: SummarizeRecentMessagesInputSchema,
    },
  );
}
