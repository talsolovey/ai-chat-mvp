import type { User } from "../domain/models";
import { users } from "../data/inMemoryStore";

export const userRepository = {
  findUserById(id: string): User | undefined {
    return users.get(id);
  },
};
