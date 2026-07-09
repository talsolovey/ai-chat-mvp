import { ServiceUnavailableException } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { KnowledgeService } from '../../knowledge/knowledge.service';
import {
  toCitation,
  type RetrievedChunk,
} from '../../knowledge/knowledge.entity';
import {
  TUTOR_SYSTEM_PROMPT,
  TUTOR_NO_CONTEXT_REPLY,
  TUTOR_HISTORY_MESSAGE_LIMIT,
} from '../../llm/prompts/tutor.prompt';
import { getAuthenticatedUserIdFromRunConfig } from '../run-config';
import type { AgentStateType } from '../agent.state';

function formatRetrievedChunksAsPromptContext(
  retrievedChunks: RetrievedChunk[],
): string {
  return retrievedChunks
    .map(
      (retrievedChunk, chunkIndex) =>
        `[${chunkIndex + 1}] From "${retrievedChunk.documentName}":\n${retrievedChunk.chunkText}`,
    )
    .join('\n\n');
}

export const buildTutorAnswerNode =
  (knowledgeService: KnowledgeService, tutorChatModel: ChatOpenAI) =>
  async (
    state: AgentStateType,
    runConfig: LangGraphRunnableConfig,
  ): Promise<Partial<AgentStateType>> => {
    const latestConversationMessage = state.messages.at(-1);
    if (!(latestConversationMessage instanceof HumanMessage)) {
      throw new ServiceUnavailableException('No user question found to answer');
    }

    const retrievedChunks = await knowledgeService.retrieveRelevantChunks(
      getAuthenticatedUserIdFromRunConfig(runConfig),
      latestConversationMessage.text,
    );

    if (retrievedChunks.length === 0) {
      return {
        messages: [new AIMessage(TUTOR_NO_CONTEXT_REPLY)],
        citations: [],
      };
    }

    const groundedAnswer = await tutorChatModel.invoke(
      [
        new SystemMessage(
          TUTOR_SYSTEM_PROMPT.replace(
            '{context}',
            formatRetrievedChunksAsPromptContext(retrievedChunks),
          ),
        ),
        ...state.messages.slice(-TUTOR_HISTORY_MESSAGE_LIMIT),
      ],
      runConfig,
    );

    return {
      messages: [groundedAnswer],
      citations: retrievedChunks.map(toCitation),
    };
  };
