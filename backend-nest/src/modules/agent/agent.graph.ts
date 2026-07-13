import { StateGraph, START, END } from '@langchain/langgraph';
import type { BaseCheckpointSaver } from '@langchain/langgraph';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { AgentState, type AgentStateType } from './agent.state';

const routeByConversationType = (
  state: AgentStateType,
): 'tutor' | 'assistant' =>
  state.conversationType === 'tutor' ? 'tutor' : 'assistant';

export type AgentNode = (
  state: AgentStateType,
  runConfig: LangGraphRunnableConfig,
) => Promise<Partial<AgentStateType>>;

export const buildAgentGraph = (dependencies: {
  tutorNode: AgentNode;
  assistantNode: AgentNode;
  checkpointer: BaseCheckpointSaver;
}) =>
  new StateGraph(AgentState)
    .addNode('tutor', dependencies.tutorNode)
    .addNode('assistant', dependencies.assistantNode)
    .addConditionalEdges(START, routeByConversationType, [
      'tutor',
      'assistant',
    ])
    .addEdge('tutor', END)
    .addEdge('assistant', END)
    .compile({ checkpointer: dependencies.checkpointer });

export type AgentGraph = ReturnType<typeof buildAgentGraph>;
