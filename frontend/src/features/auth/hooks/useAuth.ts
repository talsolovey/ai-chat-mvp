import { useCallback, useState } from "react";
import type { User } from "../types";
import { auth as authApi } from "../../../lib/apiClient";
import { setToken } from "../../../lib/tokenStorage";

export type UseAuthResult = {
  login: (email: string, password: string) => Promise<User | null>;
  signup: (
    name: string,
    email: string,
    password: string,
  ) => Promise<User | null>;
  isSubmitting: boolean;
  error: Error | null;
};

export function useAuth(): UseAuthResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const run = useCallback(
    async (action: () => Promise<{ user: User }>): Promise<User | null> => {
      setIsSubmitting(true);
      setError(null);
      try {
        const { user } = await action();
        return user;
      } catch (err: unknown) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  const login = useCallback(
    (email: string, password: string): Promise<User | null> =>
      run(async () => {
        const response = await authApi.login({ email, password });
        setToken(response.token);
        return response;
      }),
    [run],
  );

  const signup = useCallback(
    (name: string, email: string, password: string): Promise<User | null> =>
      run(() => authApi.signup({ name, email, password })),
    [run],
  );

  return { login, signup, isSubmitting, error };
}
