import { Annotation, MessagesAnnotation } from '@langchain/langgraph';
import type { Citation } from '../knowledge/knowledge.entity';
import type { ConversationType } from '../conversations/conversations.entity';

export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  conversationId: Annotation<string>,
  conversationType: Annotation<
    Extract<ConversationType, 'tutor' | 'assistant'>
  >,
  citations: Annotation<Citation[]>({
    reducer: (_previousCitations, nextCitations) => nextCitations,
    default: () => [],
  }),
  lastToolCall: Annotation<{ name: string; args: unknown } | null>({
    reducer: (_previousToolCall, nextToolCall) => nextToolCall,
    default: () => null,
  }),
});

export type AgentStateType = typeof AgentState.State;
