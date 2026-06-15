import { useState, type FormEvent, type ReactElement } from "react";
import type { User } from "../../types";
import { useAuth } from "../../hooks/useAuth";
import styles from "./AuthScreen.module.css";

type AuthScreenProps = {
  onUserSelected: (user: User) => void;
};

type AuthMode = "login" | "signup";

export default function AuthScreen({
  onUserSelected,
}: AuthScreenProps): ReactElement {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, signup, isSubmitting, error } = useAuth();

  const isSignup = mode === "signup";
  const canSubmit =
    email.trim() !== "" && password !== "" && (!isSignup || name.trim() !== "");

  function switchMode(): void {
    setMode(isSignup ? "login" : "signup");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const user = isSignup
      ? await signup(name.trim(), email.trim(), password)
      : await login(email.trim(), password);

    if (user) {
      onUserSelected(user);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.logo} aria-hidden="true">
          💬
        </div>
        <h1 className={styles.title}>{isSignup ? "Sign up" : "Log in"}</h1>
        <p className={styles.subtitle}>
          {isSignup
            ? "Create an account to start chatting"
            : "Welcome back — log in to continue"}
        </p>
        <form className={styles.form} onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <label className={styles.label} htmlFor="name">
                Name
              </label>
              <input
                id="name"
                className={styles.input}
                type="text"
                value={name}
                onChange={(e): void => setName(e.target.value)}
                autoComplete="name"
                disabled={isSubmitting}
              />
            </>
          )}
          <label className={styles.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className={styles.input}
            type="email"
            value={email}
            onChange={(e): void => setEmail(e.target.value)}
            autoComplete="email"
            disabled={isSubmitting}
          />
          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className={styles.input}
            type="password"
            value={password}
            onChange={(e): void => setPassword(e.target.value)}
            autoComplete={isSignup ? "new-password" : "current-password"}
            disabled={isSubmitting}
          />
          {isSignup && <p className={styles.hint}>At least 8 characters</p>}
          {error && (
            <p role="alert" className={styles.error}>
              {error.message}
            </p>
          )}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting || !canSubmit}
          >
            {isSubmitting
              ? isSignup
                ? "Signing up..."
                : "Logging in..."
              : isSignup
                ? "Sign up"
                : "Log in"}
          </button>
          <button
            type="button"
            className={styles.switchButton}
            onClick={switchMode}
            disabled={isSubmitting}
          >
            {isSignup
              ? "Already have an account? Log in"
              : "No account? Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
}
