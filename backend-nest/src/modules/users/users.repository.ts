import { Injectable } from '@nestjs/common';
import { User } from './user.entity';

@Injectable()
export class UsersRepository {
  private users: User[] = [];

  findByEmail(email: string): Promise<User | undefined> {
    return Promise.resolve(this.users.find((u) => u.email === email));
  }

  findById(id: string): Promise<User | undefined> {
    return Promise.resolve(this.users.find((u) => u.id === id));
  }

  save(user: User): Promise<void> {
    this.users.push(user);
    return Promise.resolve();
  }
}
