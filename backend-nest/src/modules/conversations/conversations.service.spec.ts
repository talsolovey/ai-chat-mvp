import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsRepository } from './conversations.repository';
import { FakeConversationsRepository } from './testing/fake-conversations.repository';

describe('ConversationsService', () => {
  let service: ConversationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        {
          provide: ConversationsRepository,
          useClass: FakeConversationsRepository,
        },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
  });

  it('returns the conversation for its owner', async () => {
    const created = await service.createConversationForUser('user-1', 'Hi');

    await expect(
      service.getConversationOwnedBy(created.id, 'user-1'),
    ).resolves.toEqual(created);
  });

  it('throws NotFoundException for an unknown conversation', async () => {
    await expect(
      service.getConversationOwnedBy('does-not-exist', 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws ForbiddenException when the user is not the owner', async () => {
    const created = await service.createConversationForUser('user-1', 'Hi');

    await expect(
      service.getConversationOwnedBy(created.id, 'user-2'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('assertOwnedBy rejects a non-owner without returning the conversation', async () => {
    const created = await service.createConversationForUser('user-1', 'Hi');

    await expect(
      service.assertOwnedBy(created.id, 'user-2'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lists only the requesting user conversations, newest first', async () => {
    const older = await service.createConversationForUser('user-1', 'Older');
    await service.updateLastMessage(older.id, 'a', '2020-01-01T00:00:00.000Z');
    const newer = await service.createConversationForUser('user-1', 'Newer');
    await service.updateLastMessage(newer.id, 'b', '2025-01-01T00:00:00.000Z');
    await service.createConversationForUser('user-2', 'Theirs');

    const result = await service.getConversationsForUser('user-1');

    expect(result.map((c) => c.id)).toEqual([newer.id, older.id]);
  });

  it('updateLastMessage persists snippet and timestamp', async () => {
    const created = await service.createConversationForUser('user-1', 'Hi');

    await service.updateLastMessage(
      created.id,
      'latest',
      '2025-06-01T00:00:00.000Z',
    );

    const [reloaded] = await service.getConversationsForUser('user-1');
    expect(reloaded.lastMessageSnippet).toBe('latest');
    expect(reloaded.lastMessageAt).toBe('2025-06-01T00:00:00.000Z');
  });
});
