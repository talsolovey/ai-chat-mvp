import { User } from '../user.entity';
import { UsersRepository } from '../users.repository';

export class FakeUsersRepository extends UsersRepository {
  private users: User[] = [];
  private nextId = 1;

  findByEmail(email: string): Promise<User | undefined> {
    return Promise.resolve(this.users.find((u) => u.email === email));
  }

  findById(id: string): Promise<User | undefined> {
    return Promise.resolve(this.users.find((u) => u.id === id));
  }

  create(input: Omit<User, 'id'>): Promise<User> {
    const user: User = { id: `user-${this.nextId++}`, ...input };
    this.users.push(user);
    return Promise.resolve(user);
  }
}
