import { ChatOpenAI } from '@langchain/openai';
import {
  AIMessage,
  SystemMessage,
  ToolMessage,
  type BaseMessage,
} from '@langchain/core/messages';
import type { StructuredToolInterface } from '@langchain/core/tools';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import {
  ASSISTANT_SYSTEM_PROMPT,
  ASSISTANT_HISTORY_MESSAGE_LIMIT,
} from '../../llm/prompts/assistant.prompt';
import type { AgentStateType } from '../agent.state';

const MAXIMUM_TOOL_CALL_ROUNDS = 5;

export const buildAssistantAgentNode = (
  assistantChatModel: ChatOpenAI,
  availableTools: StructuredToolInterface[],
) => {
  const chatModelWithTools = assistantChatModel.bindTools(availableTools);
  const availableToolsByName = new Map(
    availableTools.map((availableTool) => [availableTool.name, availableTool]),
  );

  return async (
    state: AgentStateType,
    runConfig: LangGraphRunnableConfig,
  ): Promise<Partial<AgentStateType>> => {
    const messagesProducedThisTurn: BaseMessage[] = [];

    for (
      let toolCallRound = 0;
      toolCallRound < MAXIMUM_TOOL_CALL_ROUNDS;
      toolCallRound++
    ) {
      const modelReply = (await chatModelWithTools.invoke(
        [
          new SystemMessage(ASSISTANT_SYSTEM_PROMPT),
          ...state.messages.slice(-ASSISTANT_HISTORY_MESSAGE_LIMIT),
          ...messagesProducedThisTurn,
        ],
        runConfig,
      )) as AIMessage;
      messagesProducedThisTurn.push(modelReply);

      const requestedToolCalls = modelReply.tool_calls ?? [];
      if (requestedToolCalls.length === 0) {
        break;
      }

      for (const requestedToolCall of requestedToolCalls) {
        const matchingTool = availableToolsByName.get(requestedToolCall.name);
        const toolExecutionResult = matchingTool
          ? ((await matchingTool.invoke(
              { ...requestedToolCall, type: 'tool_call' as const },
              runConfig,
            )) as ToolMessage)
          : new ToolMessage({
              content: JSON.stringify({
                error: `Unknown tool: ${requestedToolCall.name}`,
              }),
              tool_call_id: requestedToolCall.id ?? '',
            });
        messagesProducedThisTurn.push(toolExecutionResult);
      }
    }

    return { messages: messagesProducedThisTurn };
  };
};
