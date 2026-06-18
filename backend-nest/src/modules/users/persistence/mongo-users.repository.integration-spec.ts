import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { UsersRepository } from '../users.repository';
import { MongoUsersRepository } from './mongo-users.repository';
import { UserSchema } from './user.schema';

describe('MongoUsersRepository (integration)', () => {
  let mongod: MongoMemoryServer;
  let moduleRef: TestingModule;
  let connection: Connection;
  let repo: UsersRepository;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();

    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongod.getUri()),
        MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
      ],
      providers: [{ provide: UsersRepository, useClass: MongoUsersRepository }],
    }).compile();

    connection = moduleRef.get<Connection>(getConnectionToken());
    repo = moduleRef.get(UsersRepository);
  });

  afterEach(async () => {
    await connection.collection('users').deleteMany({});
  });

  afterAll(async () => {
    await moduleRef.close();
    await mongod.stop();
  });

  it('creates a user with a Mongo-generated id and finds it by email and id', async () => {
    const created = await repo.create({
      email: 'a@b.com',
      name: 'Alice',
      hashedPassword: 'hashed',
    });

    expect(typeof created.id).toBe('string');
    expect(created.id.length).toBeGreaterThan(0);

    await expect(repo.findByEmail('a@b.com')).resolves.toEqual(created);
    await expect(repo.findById(created.id)).resolves.toEqual(created);
  });

  it('returns undefined for an unknown email', async () => {
    await expect(repo.findByEmail('missing@b.com')).resolves.toBeUndefined();
  });

  it('returns undefined for a malformed id instead of throwing', async () => {
    await expect(repo.findById('not-an-object-id')).resolves.toBeUndefined();
  });
});
