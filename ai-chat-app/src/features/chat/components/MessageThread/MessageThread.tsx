import { useEffect, useMemo, useRef, type ReactElement } from "react";
import MessageComposer from "../MessageComposer";
import Skeleton from "../../../../components/Skeleton";
import type { MessageThreadState } from "../../hooks/messageThreadReducer";
import styles from "./MessageThread.module.css";

type MessageThreadProps = {
  thread: MessageThreadState;
  selectedConversationId: string | null;
  currentUserId: string;
  messageText: string;
  onMessageTextChange: (value: string) => void;
  onSendMessage: () => void;
};

export default function MessageThread({
  thread,
  selectedConversationId,
  currentUserId,
  messageText,
  onMessageTextChange,
  onSendMessage,
}: MessageThreadProps): ReactElement {
  const sortedMessages = useMemo(
    () => [...thread.messages].sort((a, b) => a.sentAt.localeCompare(b.sentAt)),
    [thread.messages],
  );

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastMessageId =
    sortedMessages.length > 0
      ? sortedMessages[sortedMessages.length - 1].id
      : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [lastMessageId]);

  return (
    <div className={styles.root}>
      <h2>Messages</h2>

      <div data-testid="messages-scroll" className={styles.scroll}>
        {selectedConversationId == null && (
          <p data-testid="messages-no-selection" className={styles.statePrompt}>
            Select a conversation to start chatting.
          </p>
        )}

        {thread.isLoading && (
          <div data-testid="messages-skeleton" className={styles.skeletonStack}>
            <Skeleton width="55%" height={32} />
            <Skeleton width="70%" height={32} />
            <Skeleton width="45%" height={32} />
          </div>
        )}

        {thread.error && (
          <p role="alert" className={styles.stateAlert}>
            Error loading messages: {thread.error.message}
          </p>
        )}

        {!thread.isLoading &&
          !thread.error &&
          selectedConversationId != null &&
          sortedMessages.length === 0 && (
            <p data-testid="messages-empty" className={styles.statePrompt}>
              No messages yet. Say hi.
            </p>
          )}

        {sortedMessages.length > 0 && (
          <>
            <ul className={styles.messageList}>
              {sortedMessages.map((message) => {
                const isOutgoing = message.senderId === currentUserId;
                const className = `${styles.message} ${
                  isOutgoing ? styles.outgoing : styles.incoming
                }`;
                return (
                  <li key={message.id} className={className}>
                    {message.content}
                  </li>
                );
              })}
            </ul>
            <div ref={bottomRef} aria-hidden="true" />
          </>
        )}
      </div>

      {selectedConversationId != null && (
        <MessageComposer
          messageText={messageText}
          onMessageTextChange={onMessageTextChange}
          onSendMessage={onSendMessage}
          disabled={thread.isLoading}
        />
      )}
    </div>
  );
}
