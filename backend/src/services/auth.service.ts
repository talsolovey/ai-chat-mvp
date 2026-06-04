import type { LoginResponse } from "../domain/models";
import { userRepository } from "../repositories/user.repository";

export function login(userId: string): LoginResponse | null {
  const user = userRepository.findUserById(userId);
  if (!user) {
    return null;
  }

  const token = `mock-token-${user.id}`;
  return { token, user };
}
