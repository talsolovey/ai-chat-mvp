import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: jest.Mocked<
    Pick<UsersService, 'findUserById' | 'toPublicUser'>
  >;

  beforeEach(async () => {
    usersService = {
      findUserById: jest.fn(),
      toPublicUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UsersService, useValue: usersService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-secret') },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('returns the public user for a valid payload', async () => {
    const user: User = {
      id: 'u-1',
      email: 'a@b.com',
      name: 'Alice',
      hashedPassword: 'h',
    };
    usersService.findUserById.mockResolvedValue(user);
    usersService.toPublicUser.mockReturnValue({
      id: 'u-1',
      email: 'a@b.com',
      name: 'Alice',
    });

    const result = await strategy.validate({ sub: 'u-1', email: 'a@b.com' });

    expect(usersService.findUserById).toHaveBeenCalledWith('u-1');
    expect(result).toEqual({ id: 'u-1', email: 'a@b.com', name: 'Alice' });
  });

  it('throws UnauthorizedException when the user no longer exists', async () => {
    usersService.findUserById.mockResolvedValue(undefined);

    await expect(
      strategy.validate({ sub: 'gone', email: 'x@b.com' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
