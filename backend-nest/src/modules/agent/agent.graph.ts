import { StateGraph, START, END } from '@langchain/langgraph';
import type { BaseCheckpointSaver } from '@langchain/langgraph';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { AgentState, type AgentStateType } from './agent.state';

const routeByConversationType = (
  state: AgentStateType,
): 'tutorAnswer' | 'assistantAgent' =>
  state.conversationType === 'tutor' ? 'tutorAnswer' : 'assistantAgent';

export type AgentNode = (
  state: AgentStateType,
  runConfig: LangGraphRunnableConfig,
) => Promise<Partial<AgentStateType>>;

export const buildAgentGraph = (dependencies: {
  tutorAnswerNode: AgentNode;
  assistantAgentNode: AgentNode;
  checkpointer: BaseCheckpointSaver;
}) =>
  new StateGraph(AgentState)
    .addNode('tutorAnswer', dependencies.tutorAnswerNode)
    .addNode('assistantAgent', dependencies.assistantAgentNode)
    .addConditionalEdges(START, routeByConversationType, [
      'tutorAnswer',
      'assistantAgent',
    ])
    .addEdge('tutorAnswer', END)
    .addEdge('assistantAgent', END)
    .compile({ checkpointer: dependencies.checkpointer });

export type AgentGraph = ReturnType<typeof buildAgentGraph>;
