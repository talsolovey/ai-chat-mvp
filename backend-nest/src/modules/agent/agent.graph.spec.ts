import { MemorySaver } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import {
  AIMessage,
  HumanMessage,
  type BaseMessage,
} from '@langchain/core/messages';
import { buildAgentGraph, type AgentGraph } from './agent.graph';
import { buildTutorAnswerNode } from './nodes/tutor-answer.node';
import { buildAssistantAgentNode } from './nodes/assistant-agent.node';
import { buildSummarizeMyRecentMessagesTool } from './tools/summarize-my-recent-messages.tool';
import { buildSearchDocumentsTool } from './tools/search-documents.tool';
import { TUTOR_NO_CONTEXT_REPLY } from '../llm/prompts/tutor.prompt';
import type { KnowledgeService } from '../knowledge/knowledge.service';
import type { MessagesService } from '../messages/messages.service';
import type { RetrievedChunk } from '../knowledge/knowledge.entity';
import type { Message } from '../messages/messages.entity';

class FakeChatModel {
  public receivedMessages: BaseMessage[][] = [];

  constructor(private readonly scriptedReplies: AIMessage[]) {}

  bindTools(): FakeChatModel {
    return this;
  }

  invoke(messages: BaseMessage[]): Promise<AIMessage> {
    this.receivedMessages.push(messages);
    const nextReply = this.scriptedReplies.shift();
    if (!nextReply) {
      throw new Error('FakeChatModel: no scripted reply left');
    }
    return Promise.resolve(nextReply);
  }
}

const asChatOpenAi = (fakeChatModel: FakeChatModel): ChatOpenAI =>
  fakeChatModel as unknown as ChatOpenAI;

const sampleRetrievedChunk: RetrievedChunk = {
  chunkId: 'chunk-1',
  documentId: 'doc-1',
  documentName: 'notes.pdf',
  chunkText: 'Photosynthesis converts light into chemical energy.',
  score: 0.9,
};

const sampleUserMessage: Message = {
  id: 'message-1',
  conversationId: 'conversation-1',
  senderId: 'user-1',
  role: 'user',
  content: 'hello there',
  sentAt: '2026-07-01T10:00:00.000Z',
};

const runConfig = {
  configurable: { thread_id: 'conversation-1', userId: 'user-1' },
};

describe('agent graph', () => {
  const buildGraphUnderTest = (options: {
    tutorReplies?: AIMessage[];
    assistantReplies?: AIMessage[];
    retrievedChunks?: RetrievedChunk[];
    recentMessages?: Message[];
  }): {
    graph: AgentGraph;
    retrieveRelevantChunks: jest.Mock;
    getRecentByUser: jest.Mock;
  } => {
    const retrieveRelevantChunks = jest
      .fn()
      .mockResolvedValue(options.retrievedChunks ?? []);
    const getRecentByUser = jest
      .fn()
      .mockResolvedValue(options.recentMessages ?? []);

    const knowledgeService = {
      retrieveRelevantChunks,
    } as unknown as KnowledgeService;
    const messagesService = { getRecentByUser } as unknown as MessagesService;

    const graph = buildAgentGraph({
      tutorNode: buildTutorAnswerNode(
        knowledgeService,
        asChatOpenAi(new FakeChatModel(options.tutorReplies ?? [])),
      ),
      assistantNode: buildAssistantAgentNode(
        asChatOpenAi(new FakeChatModel(options.assistantReplies ?? [])),
        [
          buildSearchDocumentsTool(knowledgeService),
          buildSummarizeMyRecentMessagesTool(messagesService),
        ],
      ),
      checkpointer: new MemorySaver(),
    });

    return { graph, retrieveRelevantChunks, getRecentByUser };
  };

  it('routes tutor conversations through retrieval and returns citations', async () => {
    const { graph, retrieveRelevantChunks } = buildGraphUnderTest({
      retrievedChunks: [sampleRetrievedChunk],
      tutorReplies: [new AIMessage('Light becomes chemical energy.')],
    });

    const result = await graph.invoke(
      {
        messages: [new HumanMessage('What is photosynthesis?')],
        conversationId: 'conversation-1',
        conversationType: 'tutor',
      },
      runConfig,
    );

    expect(retrieveRelevantChunks).toHaveBeenCalledWith(
      'user-1',
      'What is photosynthesis?',
    );
    expect(result.messages.at(-1)?.text).toBe('Light becomes chemical energy.');
    expect(result.citations).toEqual([
      {
        chunkId: 'chunk-1',
        documentId: 'doc-1',
        documentName: 'notes.pdf',
        chunkText: 'Photosynthesis converts light into chemical energy.',
      },
    ]);
  });

  it('returns the fixed no-context reply when retrieval finds nothing', async () => {
    const { graph } = buildGraphUnderTest({ retrievedChunks: [] });

    const result = await graph.invoke(
      {
        messages: [new HumanMessage('Something not in my documents?')],
        conversationId: 'conversation-1',
        conversationType: 'tutor',
      },
      runConfig,
    );

    expect(result.messages.at(-1)?.text).toBe(TUTOR_NO_CONTEXT_REPLY);
    expect(result.citations).toEqual([]);
  });

  it('rejects tutor runs that are missing the authenticated userId', async () => {
    const { graph } = buildGraphUnderTest({
      retrievedChunks: [sampleRetrievedChunk],
    });

    await expect(
      graph.invoke(
        {
          messages: [new HumanMessage('What is photosynthesis?')],
          conversationId: 'conversation-1',
          conversationType: 'tutor',
        },
        { configurable: { thread_id: 'conversation-1' } },
      ),
    ).rejects.toThrow('Missing authenticated userId in agent run config');
  });

  it('runs assistant tool calls scoped to the configured user', async () => {
    const toolCallReply = new AIMessage({
      content: '',
      tool_calls: [
        {
          id: 'call-1',
          name: 'summarize_my_recent_messages',
          args: { limit: 5 },
        },
      ],
    });
    const { graph, getRecentByUser } = buildGraphUnderTest({
      assistantReplies: [toolCallReply, new AIMessage('You said hello.')],
      recentMessages: [sampleUserMessage],
    });

    const result = await graph.invoke(
      {
        messages: [new HumanMessage('Summarize my recent messages')],
        conversationId: 'conversation-1',
        conversationType: 'assistant',
      },
      runConfig,
    );

    expect(getRecentByUser).toHaveBeenCalledWith('user-1', 5);
    expect(result.messages.at(-1)?.text).toBe('You said hello.');
  });

  it('recovers from a request for a tool that does not exist', async () => {
    const unknownToolCallReply = new AIMessage({
      content: '',
      tool_calls: [
        { id: 'call-1', name: 'nonexistent_tool', args: { limit: 5 } },
      ],
    });
    const { graph } = buildGraphUnderTest({
      assistantReplies: [
        unknownToolCallReply,
        new AIMessage('I could not use that tool.'),
      ],
    });

    const result = await graph.invoke(
      {
        messages: [new HumanMessage('Do something impossible')],
        conversationId: 'conversation-1',
        conversationType: 'assistant',
      },
      runConfig,
    );

    expect(result.messages.at(-1)?.text).toBe('I could not use that tool.');
    const toolErrorMessage = result.messages.find(
      (message) =>
        typeof message.text === 'string' &&
        message.text.includes('Unknown tool: nonexistent_tool'),
    );
    expect(toolErrorMessage).toBeDefined();
  });

  it('accumulates history across turns on the same thread', async () => {
    const { graph } = buildGraphUnderTest({
      retrievedChunks: [sampleRetrievedChunk],
      tutorReplies: [
        new AIMessage('First answer.'),
        new AIMessage('Second answer.'),
      ],
    });

    await graph.invoke(
      {
        messages: [new HumanMessage('First question?')],
        conversationId: 'conversation-1',
        conversationType: 'tutor',
      },
      runConfig,
    );
    const secondTurn = await graph.invoke(
      { messages: [new HumanMessage('Second question?')] },
      runConfig,
    );

    const messageTexts = secondTurn.messages.map((message) => message.text);
    expect(messageTexts).toEqual([
      'First question?',
      'First answer.',
      'Second question?',
      'Second answer.',
    ]);
  });
});
