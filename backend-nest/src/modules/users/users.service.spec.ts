import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { IdGeneratorService } from '../../common/id-generator.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, UsersRepository, IdGeneratorService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('creates a user and finds it by email and by id', async () => {
    const created = await service.createUser('a@b.com', 'Alice', 'hashed');

    await expect(service.findUserByEmail('a@b.com')).resolves.toEqual(created);
    await expect(service.findUserById(created.id)).resolves.toEqual(created);
  });

  it('returns undefined for an unknown email', async () => {
    await expect(service.findUserByEmail('missing@b.com')).resolves.toBeUndefined();
  });

  it('toPublicUser strips the password hash', () => {
    const publicUser = service.toPublicUser({
      id: 'u-1',
      email: 'a@b.com',
      name: 'Alice',
      hashedPassword: 'secret-hash',
    });

    expect(publicUser).toEqual({ id: 'u-1', email: 'a@b.com', name: 'Alice' });
    expect(publicUser).not.toHaveProperty('hashedPassword');
  });
});
