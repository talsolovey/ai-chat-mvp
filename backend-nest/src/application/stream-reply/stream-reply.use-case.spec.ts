import { ServiceUnavailableException } from '@nestjs/common';
import { AIMessage } from '@langchain/core/messages';
import {
  StreamReplyUseCase,
  type StreamReplyEvent,
} from './stream-reply.use-case';
import type { AgentGraph } from '../../modules/agent/agent.graph';
import type { ConversationsService } from '../../modules/conversations/conversations.service';
import type { MessagesService } from '../../modules/messages/messages.service';
import type { TransactionRunner } from '../../common/persistence/transaction-runner';
import type { Message } from '../../modules/messages/messages.entity';
import type { Citation } from '../../modules/knowledge/knowledge.entity';

type FakeGraphEvent = {
  event: string;
  name: string;
  data: { chunk?: { text: string } };
};

const buildFakeGraphEvent = (
  event: string,
  options: { name?: string; tokenText?: string } = {},
): FakeGraphEvent => ({
  event,
  name: options.name ?? '',
  data:
    options.tokenText === undefined
      ? { chunk: undefined }
      : { chunk: { text: options.tokenText } },
});

const buildUseCaseUnderTest = (options: {
  graphEvents: FakeGraphEvent[];
  finalStateMessages: AIMessage[];
  finalStateCitations?: Citation[];
  persistedHistory: Array<Pick<Message, 'role' | 'content'>>;
}): { useCase: StreamReplyUseCase; createAssistantMessage: jest.Mock } => {
  async function* replayGraphEvents(): AsyncGenerator<FakeGraphEvent> {
    for (const graphEvent of options.graphEvents) {
      yield await Promise.resolve(graphEvent);
    }
  }

  const fakeAgentGraph = {
    streamEvents: () => replayGraphEvents(),
    getState: () =>
      Promise.resolve({
        values: {
          messages: options.finalStateMessages,
          citations: options.finalStateCitations ?? [],
        },
      }),
  } as unknown as AgentGraph;

  const createAssistantMessage = jest.fn().mockResolvedValue({
    id: 'saved-message-1',
    sentAt: '2026-07-09T10:00:00.000Z',
  });
  const fakeMessagesService = {
    getRecentHistory: jest.fn().mockResolvedValue(options.persistedHistory),
    createAssistantMessage,
  } as unknown as MessagesService;

  const fakeConversationsService = {
    updateLastMessage: jest.fn().mockResolvedValue(undefined),
  } as unknown as ConversationsService;

  const fakeTransactionRunner = {
    run: (work: (transaction: unknown) => Promise<unknown>) => work(null),
  } as unknown as TransactionRunner;

  const useCase = new StreamReplyUseCase(
    fakeAgentGraph,
    fakeConversationsService,
    fakeMessagesService,
    fakeTransactionRunner,
  );

  return { useCase, createAssistantMessage };
};

const collectStreamedEvents = async (
  eventStream: AsyncGenerator<StreamReplyEvent>,
): Promise<StreamReplyEvent[]> => {
  const streamedEvents: StreamReplyEvent[] = [];
  for await (const streamedEvent of eventStream) {
    streamedEvents.push(streamedEvent);
  }
  return streamedEvents;
};

const userQuestionHistory: Array<Pick<Message, 'role' | 'content'>> = [
  { role: 'user', content: 'What is 2 + 2?' },
];

describe('StreamReplyUseCase', () => {
  it('maps graph events to token, tool_call, and tool_result events', async () => {
    const { useCase } = buildUseCaseUnderTest({
      graphEvents: [
        buildFakeGraphEvent('on_chat_model_stream', { tokenText: 'The ' }),
        buildFakeGraphEvent('on_tool_start', {
          name: 'summarize_my_recent_messages',
        }),
        buildFakeGraphEvent('on_tool_end', {
          name: 'summarize_my_recent_messages',
        }),
        buildFakeGraphEvent('on_chat_model_stream', { tokenText: 'answer.' }),
      ],
      finalStateMessages: [new AIMessage('The answer.')],
      persistedHistory: userQuestionHistory,
    });

    const streamedEvents = await collectStreamedEvents(
      useCase.execute('conversation-1', 'user-1', 'assistant'),
    );

    expect(streamedEvents).toEqual([
      { type: 'token', text: 'The ' },
      { type: 'tool_call', name: 'summarize_my_recent_messages' },
      { type: 'tool_result', name: 'summarize_my_recent_messages' },
      { type: 'token', text: 'answer.' },
      {
        type: 'done',
        messageId: 'saved-message-1',
        sentAt: '2026-07-09T10:00:00.000Z',
      },
    ]);
  });

  it('emits a deterministic reply as a single token when nothing streamed', async () => {
    const { useCase } = buildUseCaseUnderTest({
      graphEvents: [],
      finalStateMessages: [new AIMessage('Not found in your documents.')],
      persistedHistory: userQuestionHistory,
    });

    const streamedEvents = await collectStreamedEvents(
      useCase.execute('conversation-1', 'user-1', 'tutor'),
    );

    expect(streamedEvents[0]).toEqual({
      type: 'token',
      text: 'Not found in your documents.',
    });
  });

  it('emits citations before done when the final state has them', async () => {
    const citation: Citation = {
      chunkId: 'chunk-1',
      documentId: 'doc-1',
      documentName: 'notes.pdf',
      chunkText: 'Some excerpt.',
    };
    const { useCase, createAssistantMessage } = buildUseCaseUnderTest({
      graphEvents: [
        buildFakeGraphEvent('on_chat_model_stream', { tokenText: 'Answer.' }),
      ],
      finalStateMessages: [new AIMessage('Answer.')],
      finalStateCitations: [citation],
      persistedHistory: userQuestionHistory,
    });

    const streamedEvents = await collectStreamedEvents(
      useCase.execute('conversation-1', 'user-1', 'tutor'),
    );

    expect(streamedEvents).toContainEqual({
      type: 'citations',
      citations: [citation],
    });
    expect(createAssistantMessage).toHaveBeenCalledWith(
      'conversation-1',
      'Answer.',
      null,
      [citation],
    );
  });

  it('fails when the agent produces an empty reply', async () => {
    const { useCase, createAssistantMessage } = buildUseCaseUnderTest({
      graphEvents: [],
      finalStateMessages: [new AIMessage('')],
      persistedHistory: userQuestionHistory,
    });

    await expect(
      collectStreamedEvents(
        useCase.execute('conversation-1', 'user-1', 'assistant'),
      ),
    ).rejects.toThrow(ServiceUnavailableException);
    expect(createAssistantMessage).not.toHaveBeenCalled();
  });

  it('fails when the latest persisted message is not a user question', async () => {
    const { useCase } = buildUseCaseUnderTest({
      graphEvents: [],
      finalStateMessages: [],
      persistedHistory: [
        { role: 'assistant', content: 'Earlier reply.' },
      ] satisfies Array<Pick<Message, 'role' | 'content'>>,
    });

    await expect(
      collectStreamedEvents(
        useCase.execute('conversation-1', 'user-1', 'assistant'),
      ),
    ).rejects.toThrow('No user question found to answer');
  });
});
