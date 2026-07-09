import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import type { UserId } from '../users/user.entity';

export function getAuthenticatedUserIdFromRunConfig(
  runConfig: LangGraphRunnableConfig,
): UserId {
  const authenticatedUserId = runConfig.configurable?.userId as unknown;
  if (
    typeof authenticatedUserId !== 'string' ||
    authenticatedUserId.length === 0
  ) {
    throw new Error('Missing authenticated userId in agent run config');
  }
  return authenticatedUserId;
}
