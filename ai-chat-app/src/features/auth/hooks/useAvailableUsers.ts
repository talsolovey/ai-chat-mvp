import { useEffect, useState } from "react";
import type { User } from "../types";
import { auth as authApi } from "../../../lib/apiClient";

export type AvailableUsersStatus = "loading" | "error" | "empty" | "ready";

type AvailableUsersState = {
  users: User[];
  usersLoading: boolean;
  usersError: Error | null;
};

export type UseAvailableUsersResult = AvailableUsersState & {
  status: AvailableUsersStatus;
};

const initialAvailableUsers: AvailableUsersState = {
  users: [],
  usersLoading: true,
  usersError: null,
};

function deriveStatus({
  usersLoading,
  usersError,
  users,
}: AvailableUsersState): AvailableUsersStatus {
  if (usersLoading) {
    return "loading";
  }
  if (usersError) {
    return "error";
  }
  if (users.length === 0) {
    return "empty";
  }
  return "ready";
}

export function useAvailableUsers(): UseAvailableUsersResult {
  const [availableUsers, setAvailableUsers] = useState<AvailableUsersState>(
    initialAvailableUsers,
  );

  useEffect(() => {
    authApi
      .getAvailableUsers()
      .then((data) => {
        setAvailableUsers({
          users: data,
          usersLoading: false,
          usersError: null,
        });
      })
      .catch((err: unknown) => {
        setAvailableUsers({
          ...initialAvailableUsers,
          usersLoading: false,
          usersError: err instanceof Error ? err : new Error(String(err)),
        });
      });
  }, []);

  return { ...availableUsers, status: deriveStatus(availableUsers) };
}
