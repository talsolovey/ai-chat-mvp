import { User } from './user.entity';

export abstract class UsersRepository {
  abstract findByEmail(email: string): Promise<User | undefined>;
  abstract findById(id: string): Promise<User | undefined>;
  abstract create(input: Omit<User, 'id'>): Promise<User>;
}
