import type { ReactElement } from "react";
import type { User } from "../../types";
import { useAvailableUsers } from "../../hooks/useAvailableUsers";
import styles from "./AuthScreen.module.css";

type AuthScreenProps = {
  onUserSelected: (user: User) => void;
};

export default function AuthScreen({
  onUserSelected,
}: AuthScreenProps): ReactElement {
  const { users, usersError, status } = useAvailableUsers();

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>Choose a user</h1>
      {status === "loading" && <p>Loading users...</p>}
      {status === "error" && <p>Error loading users: {usersError?.message}</p>}
      {status === "empty" && <p>No users available.</p>}
      {status === "ready" && (
        <div className={styles.userList}>
          {users.map((user) => (
            <button
              key={user.id}
              className={styles.userButton}
              onClick={(): void => onUserSelected(user)}
            >
              {user.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
