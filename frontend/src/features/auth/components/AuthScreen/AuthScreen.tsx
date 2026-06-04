import { useState, type FormEvent, type ReactElement } from "react";
import type { User } from "../../types";
import { useLogin } from "../../hooks/useLogin";
import styles from "./AuthScreen.module.css";

type AuthScreenProps = {
  onUserSelected: (user: User) => void;
};

export default function AuthScreen({
  onUserSelected,
}: AuthScreenProps): ReactElement {
  const [userId, setUserId] = useState("");
  const { login, isSubmitting, error } = useLogin();

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const user = await login(userId);
    if (user) {
      onUserSelected(user);
    }
  }

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>Log in</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label} htmlFor="userId">
          User ID
        </label>
        <input
          id="userId"
          className={styles.input}
          type="text"
          value={userId}
          onChange={(e): void => setUserId(e.target.value)}
          placeholder="e.g. me, support, teammate"
          autoComplete="username"
          disabled={isSubmitting}
        />
        {error && (
          <p role="alert" className={styles.error}>
            {error.message}
          </p>
        )}
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting || !userId.trim()}
        >
          {isSubmitting ? "Logging in..." : "Log in"}
        </button>
      </form>
    </div>
  );
}
