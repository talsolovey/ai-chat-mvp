import ChatApp from "./features/chat/components/ChatApp";
import { useState } from "react";
import type { User } from "./features/auth/types";
import AuthScreen from "./features/auth/components/AuthScreen";
import styles from "./App.module.css";

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  return (
    <div className={styles.root}>
      <h1 className={styles.header}>AI Chat App</h1>
      {currentUser ? (
        <ChatApp currentUser={currentUser} />
      ) : (
        <AuthScreen onUserSelected={setCurrentUser} />
      )}
    </div>
  );
}

export default App;
