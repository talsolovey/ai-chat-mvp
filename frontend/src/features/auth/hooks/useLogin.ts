import { useCallback, useState } from "react";
import type { User } from "../types";
import { auth as authApi } from "../../../lib/apiClient";

export type UseLoginResult = {
  login: (userId: string) => Promise<User | null>;
  isSubmitting: boolean;
  error: Error | null;
};

export function useLogin(): UseLoginResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const login = useCallback(async (userId: string): Promise<User | null> => {
    const trimmed = userId.trim();
    if (!trimmed) {
      return null;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { user } = await authApi.login({ userId: trimmed });
      return user;
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { login, isSubmitting, error };
}
