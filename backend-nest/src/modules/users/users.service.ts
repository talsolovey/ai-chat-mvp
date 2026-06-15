import { Injectable } from '@nestjs/common';
import { User, PublicUser } from './user.entity';
import { IdGeneratorService } from '../../common/id-generator.service';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async createUser(
    email: string,
    name: string,
    hashedPassword: string,
  ): Promise<User> {
    const user: User = {
      id: `u-${this.idGenerator.generateId()}`,
      email,
      name,
      hashedPassword,
    };
    await this.repo.save(user);
    return user;
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
