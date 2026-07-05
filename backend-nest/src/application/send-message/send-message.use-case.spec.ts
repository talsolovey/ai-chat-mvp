import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { SendMessageUseCase } from './send-message.use-case';
import { ListMessagesUseCase } from '../list-messages/list-messages.use-case';
import { ConversationsService } from '../../modules/conversations/conversations.service';
import { ConversationsRepository } from '../../modules/conversations/conversations.repository';
import { FakeConversationsRepository } from '../../modules/conversations/testing/fake-conversations.repository';
import { MessagesService } from '../../modules/messages/messages.service';
import { MessagesRepository } from '../../modules/messages/messages.repository';
import { FakeMessagesRepository } from '../../modules/messages/testing/fake-messages.repository';
import { TransactionRunner } from '../../common/persistence/transaction-runner';
import { FakeTransactionRunner } from '../../common/persistence/fake-transaction.runner';

describe('SendMessageUseCase', () => {
  let sendMessage: SendMessageUseCase;
  let listMessages: ListMessagesUseCase;
  let conversations: ConversationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendMessageUseCase,
        ListMessagesUseCase,
        ConversationsService,
        {
          provide: ConversationsRepository,
          useClass: FakeConversationsRepository,
        },
        MessagesService,
        { provide: MessagesRepository, useClass: FakeMessagesRepository },
        { provide: TransactionRunner, useClass: FakeTransactionRunner },
      ],
    }).compile();

    sendMessage = module.get(SendMessageUseCase);
    listMessages = module.get(ListMessagesUseCase);
    conversations = module.get(ConversationsService);
  });

  it('lets the owner send a message and updates the conversation preview', async () => {
    const convo = await conversations.createConversationForUser('owner', 'Hi');

    const message = await sendMessage.execute(convo.id, 'owner', 'hello');

    expect(message.content).toBe('hello');
    const [reloaded] = await conversations.getConversationsForUser('owner');
    expect(reloaded.lastMessageSnippet).toBe('hello');
    expect(reloaded.lastMessageAt).toBe(message.sentAt);
  });

  it('blocks a non-owner with 403 and never writes the message', async () => {
    const convo = await conversations.createConversationForUser('owner', 'Hi');

    await expect(
      sendMessage.execute(convo.id, 'intruder', 'sneaky'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    const ownerView = await listMessages.execute(
      convo.id,
      'owner',
      undefined,
      undefined,
    );
    expect(ownerView.messages).toHaveLength(0);
    const [reloaded] = await conversations.getConversationsForUser('owner');
    expect(reloaded.lastMessageSnippet).toBe('');
  });
});
