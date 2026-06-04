import { useState, type ReactElement } from "react";
import ConversationList from "../ConversationList";
import MessageThread from "../MessageThread";
import Toast from "../../../../components/Toast";
import { useConversations } from "../../hooks/useConversations";
import { useMessages } from "../../hooks/useMessages";
import type { User } from "../../../auth/types";
import styles from "./ChatApp.module.css";

type ChatAppProps = {
  currentUser: User;
};

export default function ChatApp({ currentUser }: ChatAppProps): ReactElement {
  const { conversations, conversationsLoading, conversationsError } =
    useConversations(currentUser);

  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);

  const { thread, sendMessage, dismissSendError } = useMessages(
    selectedConversationId,
    currentUser.id,
  );

  const [messageText, setMessageText] = useState<string>("");

  async function handleSend(): Promise<void> {
    if (!messageText.trim()) {
      return;
    }
    const text = messageText.trim();
    setMessageText("");
    void sendMessage(text).then((success) => {
      if (!success) {
        setMessageText(text);
      }
    });
  }

  return (
    <div className={styles.root}>
      <div className={styles.pane}>
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          conversationsLoading={conversationsLoading}
          conversationsError={conversationsError}
        />
        <MessageThread
          thread={thread}
          selectedConversationId={selectedConversationId}
          currentUserId={currentUser.id}
          messageText={messageText}
          onMessageTextChange={setMessageText}
          onSendMessage={handleSend}
        />
      </div>

      {thread.sendError && (
        <Toast
          message={`Couldn't send message: ${thread.sendError.message}`}
          onDismiss={dismissSendError}
        />
      )}
    </div>
  );
}
