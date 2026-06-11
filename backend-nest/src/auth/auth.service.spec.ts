import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<
    Pick<UsersService, 'findUserByEmail' | 'createUser' | 'toPublicUser'>
  >;
  let jwtService: jest.Mocked<Pick<JwtService, 'sign'>>;

  beforeEach(async () => {
    usersService = {
      findUserByEmail: jest.fn(),
      createUser: jest.fn(),
      toPublicUser: jest.fn(),
    };
    jwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('signs up a new user and returns a token without the password hash', async () => {
    const created: User = {
      id: 'u-100',
      email: 'a@b.com',
      name: 'Alice',
      hashedPassword: 'hashed',
    };
    usersService.findUserByEmail.mockResolvedValue(undefined);
    usersService.createUser.mockResolvedValue(created);
    usersService.toPublicUser.mockReturnValue({
      id: 'u-100',
      email: 'a@b.com',
      name: 'Alice',
    });
    jwtService.sign.mockReturnValue('signed-token');

    const result = await service.signup({
      email: 'a@b.com',
      name: 'Alice',
      password: 'password123',
    });

    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 'u-100',
      email: 'a@b.com',
    });
    expect(result).toEqual({
      token: 'signed-token',
      user: { id: 'u-100', email: 'a@b.com', name: 'Alice' },
    });
    expect(result.user).not.toHaveProperty('hashedPassword');
  });

  it('throws ConflictException when the email already exists', async () => {
    usersService.findUserByEmail.mockResolvedValue({
      id: 'u-1',
      email: 'a@b.com',
      name: 'Existing',
      hashedPassword: 'hashed',
    });

    await expect(
      service.signup({
        email: 'a@b.com',
        name: 'Alice',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(usersService.createUser).not.toHaveBeenCalled();
  });

  it('logs in a valid user and returns a token without the password hash', async () => {
    const existing: User = {
      id: 'u-100',
      email: 'a@b.com',
      name: 'Alice',
      hashedPassword: 'stored-hash',
    };
    usersService.findUserByEmail.mockResolvedValue(existing);
    usersService.toPublicUser.mockReturnValue({
      id: 'u-100',
      email: 'a@b.com',
      name: 'Alice',
    });
    jwtService.sign.mockReturnValue('signed-token');
    const compareMock = bcrypt.compare as jest.Mock;
    compareMock.mockResolvedValue(true);

    const result = await service.login({
      email: 'a@b.com',
      password: 'password123',
    });

    expect(compareMock).toHaveBeenCalledWith('password123', 'stored-hash');
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 'u-100',
      email: 'a@b.com',
    });
    expect(result).toEqual({
      token: 'signed-token',
      user: { id: 'u-100', email: 'a@b.com', name: 'Alice' },
    });
    expect(result.user).not.toHaveProperty('hashedPassword');
  });

  it('throws UnauthorizedException when the email is not found', async () => {
    usersService.findUserByEmail.mockResolvedValue(undefined);

    await expect(
      service.login({ email: 'missing@b.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when the password does not match', async () => {
    usersService.findUserByEmail.mockResolvedValue({
      id: 'u-100',
      email: 'a@b.com',
      name: 'Alice',
      hashedPassword: 'stored-hash',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login({ email: 'a@b.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(jwtService.sign).not.toHaveBeenCalled();
  });
});
