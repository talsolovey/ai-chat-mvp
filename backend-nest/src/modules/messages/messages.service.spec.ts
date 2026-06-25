import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { MessagesRepository } from './messages.repository';
import { FakeMessagesRepository } from './testing/fake-messages.repository';

describe('MessagesService', () => {
  let service: MessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: MessagesRepository, useClass: FakeMessagesRepository },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  it('persists a created message and returns it on listing', async () => {
    const created = await service.createUserMessage('c-1', 'user-1', 'hello');

    const page = await service.listForConversation('c-1', undefined, undefined);

    expect(created.content).toBe('hello');
    expect(created.conversationId).toBe('c-1');
    expect(page.messages).toHaveLength(1);
    expect(page.messages[0].id).toBe(created.id);
  });

  it('isolates messages by conversation', async () => {
    await service.createUserMessage('c-1', 'user-1', 'in one');
    await service.createUserMessage('c-2', 'user-1', 'in two');

    const page = await service.listForConversation('c-1', undefined, undefined);

    expect(page.messages).toHaveLength(1);
    expect(page.messages[0].content).toBe('in one');
  });

  it('paginates with a cursor and reports nextCursor until the end', async () => {
    for (let i = 0; i < 3; i++) {
      await service.createUserMessage('c-1', 'user-1', `m${i}`);
    }

    const firstPage = await service.listForConversation('c-1', undefined, 2);
    expect(firstPage.messages).toHaveLength(2);
    expect(firstPage.nextCursor).not.toBeNull();

    const secondPage = await service.listForConversation(
      'c-1',
      firstPage.nextCursor ?? undefined,
      2,
    );
    expect(secondPage.messages).toHaveLength(1);
    expect(secondPage.nextCursor).toBeNull();
  });
});
