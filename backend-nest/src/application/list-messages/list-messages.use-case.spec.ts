import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ListMessagesUseCase } from './list-messages.use-case';
import { SendMessageUseCase } from '../send-message/send-message.use-case';
import { ConversationsService } from '../../modules/conversations/conversations.service';
import { ConversationsRepository } from '../../modules/conversations/conversations.repository';
import { FakeConversationsRepository } from '../../modules/conversations/testing/fake-conversations.repository';
import { MessagesService } from '../../modules/messages/messages.service';
import { MessagesRepository } from '../../modules/messages/messages.repository';
import { FakeMessagesRepository } from '../../modules/messages/testing/fake-messages.repository';
import { TransactionRunner } from '../../common/persistence/transaction-runner';
import { FakeTransactionRunner } from '../../common/persistence/fake-transaction.runner';

describe('ListMessagesUseCase', () => {
  let listMessages: ListMessagesUseCase;
  let sendMessage: SendMessageUseCase;
  let conversations: ConversationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListMessagesUseCase,
        SendMessageUseCase,
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

    listMessages = module.get(ListMessagesUseCase);
    sendMessage = module.get(SendMessageUseCase);
    conversations = module.get(ConversationsService);
  });

  it('returns messages to the owner', async () => {
    const convo = await conversations.createConversationForUser('owner', 'Hi');
    await sendMessage.execute(convo.id, 'owner', 'hello');

    const page = await listMessages.execute(
      convo.id,
      'owner',
      undefined,
      undefined,
    );

    expect(page.messages).toHaveLength(1);
    expect(page.messages[0].content).toBe('hello');
  });

  it('blocks a non-owner with 403', async () => {
    const convo = await conversations.createConversationForUser('owner', 'Hi');

    await expect(
      listMessages.execute(convo.id, 'intruder', undefined, undefined),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws 404 for an unknown conversation', async () => {
    await expect(
      listMessages.execute('nope', 'owner', undefined, undefined),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
