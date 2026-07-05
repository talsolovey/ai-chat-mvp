import { Injectable } from '@nestjs/common';
import { User, PublicUser } from './user.entity';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  createUser(
    email: string,
    name: string,
    hashedPassword: string,
  ): Promise<User> {
    return this.repo.create({ email, name, hashedPassword });
  }

  findUserByEmail(email: string): Promise<User | undefined> {
    return this.repo.findByEmail(email);
  }

  findUserById(id: string): Promise<User | undefined> {
    return this.repo.findById(id);
  }

  toPublicUser(user: User): PublicUser {
    return { id: user.id, email: user.email, name: user.name };
  }
}
