import type { LlmTool } from './llm-tool';

export type LlmRole = 'user' | 'assistant';

export type LlmMessage = {
  role: LlmRole;
  content: string;
};

export type LlmStreamEvent =
  | { type: 'token'; text: string }
  | { type: 'done' };

export type AssistantReplyArgs = {
  systemPrompt: string;
  messages: LlmMessage[];
  maxTokens?: number;
  temperature?: number;
  tools?: LlmTool[];
};

export abstract class LlmProvider {
  abstract streamAssistantReply(
    args: AssistantReplyArgs,
  ): AsyncIterable<LlmStreamEvent>;
}
