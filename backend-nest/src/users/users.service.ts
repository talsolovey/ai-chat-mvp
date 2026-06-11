import { Injectable } from '@nestjs/common';
import { User, PublicUser } from './user.entity';
import { IdGeneratorService } from '../common/id-generator.service';

@Injectable()
export class UsersService {
  private users: User[] = [];

  constructor(private readonly idGenerator: IdGeneratorService) {}

  createUser(
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
    this.users.push(user);
    return Promise.resolve(user);
  }

  findUserByEmail(email: string): Promise<User | undefined> {
    return Promise.resolve(this.users.find((u) => u.email === email));
  }

  findUserById(id: string): Promise<User | undefined> {
    return Promise.resolve(this.users.find((u) => u.id === id));
  }

  toPublicUser(user: User): PublicUser {
    return { id: user.id, email: user.email, name: user.name };
  }
}
