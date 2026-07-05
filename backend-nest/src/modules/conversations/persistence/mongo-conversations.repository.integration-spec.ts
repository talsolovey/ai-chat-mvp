import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ConversationsRepository } from '../conversations.repository';
import { MongoConversationsRepository } from './mongo-conversations.repository';
import { ConversationSchema } from './conversation.schema';

const userA = new Types.ObjectId().toString();
const userB = new Types.ObjectId().toString();

describe('MongoConversationsRepository (integration)', () => {
  let mongod: MongoMemoryServer;
  let moduleRef: TestingModule;
  let connection: Connection;
  let repo: ConversationsRepository;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();

    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongod.getUri()),
        MongooseModule.forFeature([
          { name: 'Conversation', schema: ConversationSchema },
        ]),
      ],
      providers: [
        {
          provide: ConversationsRepository,
          useClass: MongoConversationsRepository,
        },
      ],
    }).compile();

    connection = moduleRef.get<Connection>(getConnectionToken());
    repo = moduleRef.get(ConversationsRepository);
  });

  afterEach(async () => {
    await connection.collection('conversations').deleteMany({});
  });

  afterAll(async () => {
    await moduleRef.close();
    await mongod.stop();
  });

  it('creates a conversation with a Mongo-generated id and reads it back', async () => {
    const created = await repo.create({
      title: 'Hi',
      lastMessageSnippet: '',
      lastMessageAt: new Date().toISOString(),
      userId: userA,
    });

    expect(typeof created.id).toBe('string');
    expect(created.id.length).toBeGreaterThan(0);

    await expect(repo.findById(created.id)).resolves.toEqual(created);
  });

  it('lists only conversations the user owns', async () => {
    await repo.create({
      title: 'Mine',
      lastMessageSnippet: '',
      lastMessageAt: new Date().toISOString(),
      userId: userA,
    });
    await repo.create({
      title: 'Theirs',
      lastMessageSnippet: '',
      lastMessageAt: new Date().toISOString(),
      userId: userB,
    });

    const found = await repo.findByUser(userA);
    expect(found).toHaveLength(1);
    expect(found[0].title).toBe('Mine');
  });

  it('updates the last message snippet and timestamp', async () => {
    const created = await repo.create({
      title: 'Hi',
      lastMessageSnippet: '',
      lastMessageAt: new Date().toISOString(),
      userId: userA,
    });

    await repo.updateLastMessage(
      created.id,
      'latest',
      '2025-06-01T00:00:00.000Z',
    );

    const reloaded = await repo.findById(created.id);
    expect(reloaded?.lastMessageSnippet).toBe('latest');
    expect(reloaded?.lastMessageAt).toBe('2025-06-01T00:00:00.000Z');
  });

  it('returns undefined for a malformed id instead of throwing', async () => {
    await expect(repo.findById('not-an-object-id')).resolves.toBeUndefined();
  });
});
