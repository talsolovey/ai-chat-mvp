import { useEffect, useState, type ReactElement } from "react";
import ChatApp from "./features/chat/components/ChatApp";
import type { User } from "./features/auth/types";
import AuthScreen from "./features/auth/components/AuthScreen";
import { auth as authApi } from "./lib/apiClient";
import { clearToken, getToken } from "./lib/tokenStorage";
import { onUnauthorized } from "./lib/authEvents";
import styles from "./App.module.css";

function App(): ReactElement {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(
    () => getToken() !== null,
  );

  useEffect(() => {
    if (!getToken()) {
      return;
    }
    authApi
      .getMe()
      .then(setCurrentUser)
      .catch(() => clearToken())
      .finally(() => setIsRestoring(false));
  }, []);

  useEffect(() => {
    return onUnauthorized(() => setCurrentUser(null));
  }, []);

  function handleLogout(): void {
    clearToken();
    setCurrentUser(null);
  }

  return (
    <div className={styles.root}>
      <div className={styles.headerRow}>
        <div className={styles.brand}>
          <div className={styles.brandLogo} aria-hidden="true">
            💬
          </div>
          <h1 className={styles.header}>AI Chat App</h1>
        </div>
        {currentUser && (
          <div className={styles.userBox}>
            <div className={styles.avatar} aria-hidden="true">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <span className={styles.userName}>{currentUser.name}</span>
            <button
              type="button"
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        )}
      </div>
      {isRestoring ? (
        <p className={styles.restoring} role="status">
          Restoring your session…
        </p>
      ) : currentUser ? (
        <ChatApp currentUser={currentUser} />
      ) : (
        <AuthScreen onUserSelected={setCurrentUser} />
      )}
    </div>
  );
}

export default App;
