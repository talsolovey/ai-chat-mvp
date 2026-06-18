import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MessagesRepository } from '../messages.repository';
import { MongoMessagesRepository } from './mongo-messages.repository';
import { MessageSchema } from './message.schema';

const conversationA = new Types.ObjectId().toString();
const conversationB = new Types.ObjectId().toString();
const senderId = new Types.ObjectId().toString();

describe('MongoMessagesRepository (integration)', () => {
  let mongod: MongoMemoryServer;
  let moduleRef: TestingModule;
  let connection: Connection;
  let repo: MessagesRepository;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();

    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongod.getUri()),
        MongooseModule.forFeature([{ name: 'Message', schema: MessageSchema }]),
      ],
      providers: [
        { provide: MessagesRepository, useClass: MongoMessagesRepository },
      ],
    }).compile();

    connection = moduleRef.get<Connection>(getConnectionToken());
    repo = moduleRef.get(MessagesRepository);
  });

  afterEach(async () => {
    await connection.collection('messages').deleteMany({});
  });

  afterAll(async () => {
    await moduleRef.close();
    await mongod.stop();
  });

  it('persists a message and reads it back with a Mongo-generated string id', async () => {
    const created = await repo.create({
      conversationId: conversationA,
      senderId,
      sentAt: new Date().toISOString(),
      content: 'hello',
    });

    expect(typeof created.id).toBe('string');
    expect(created.id.length).toBeGreaterThan(0);

    const { messages } = await repo.findPage(conversationA, { limit: 20 });
    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(created);
  });

  it('isolates messages by conversation', async () => {
    await repo.create({
      conversationId: conversationA,
      senderId,
      sentAt: new Date().toISOString(),
      content: 'one',
    });
    await repo.create({
      conversationId: conversationB,
      senderId,
      sentAt: new Date().toISOString(),
      content: 'two',
    });

    const { messages } = await repo.findPage(conversationA, { limit: 20 });
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe('one');
  });

  it('round-trips sentAt as an ISO string', async () => {
    const sentAt = new Date('2026-01-02T03:04:05.000Z').toISOString();

    const created = await repo.create({
      conversationId: conversationA,
      senderId,
      sentAt,
      content: 'x',
    });
    expect(created.sentAt).toBe(sentAt);

    const {
      messages: [found],
    } = await repo.findPage(conversationA, { limit: 20 });
    expect(found.sentAt).toBe(sentAt);
  });

  it('returns an empty page for a malformed conversation id', async () => {
    await expect(
      repo.findPage('not-an-object-id', { limit: 20 }),
    ).resolves.toEqual({ messages: [], hasMore: false });
  });

  it('returns an empty page for a malformed cursor', async () => {
    await expect(
      repo.findPage(conversationA, { cursor: 'not-an-object-id', limit: 20 }),
    ).resolves.toEqual({ messages: [], hasMore: false });
  });

  it('cursor-paginates a 100+ message thread newest-first to the end', async () => {
    for (let i = 0; i < 105; i++) {
      await repo.create({
        conversationId: conversationA,
        senderId,
        sentAt: new Date(Date.now() + i).toISOString(),
        content: `m${i}`,
      });
    }

    const seen: string[] = [];
    let cursor: string | undefined;
    let pages = 0;

    for (;;) {
      const { messages, hasMore } = await repo.findPage(conversationA, {
        cursor,
        limit: 20,
      });
      pages++;
      seen.push(...messages.map((m) => m.content));
      if (!hasMore) {
        break;
      }
      cursor = messages[messages.length - 1].id;
    }

    expect(seen).toHaveLength(105);
    expect(new Set(seen).size).toBe(105);
    expect(seen[0]).toBe('m104');
    expect(seen[seen.length - 1]).toBe('m0');
    expect(pages).toBe(6);
  });
});
