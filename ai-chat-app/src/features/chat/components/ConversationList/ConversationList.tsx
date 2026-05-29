import type { ReactElement } from "react";
import type { Conversation } from "../../types";
import Skeleton from "../../../../components/Skeleton";
import styles from "./ConversationList.module.css";

type ConversationListProps = {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  conversationsLoading: boolean;
  conversationsError: Error | null;
};

export default function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  conversationsLoading,
  conversationsError,
}: ConversationListProps): ReactElement {
  return (
    <div className={styles.root}>
      <h2>Conversations</h2>

      {conversationsLoading && (
        <div
          data-testid="conversations-skeleton"
          className={styles.skeletonStack}
        >
          <Skeleton height={36} />
          <Skeleton height={36} />
          <Skeleton height={36} />
        </div>
      )}

      {conversationsError && (
        <p role="alert" className={styles.stateAlert}>
          Error loading conversations: {conversationsError.message}
        </p>
      )}

      {!conversationsLoading &&
        !conversationsError &&
        conversations.length === 0 && (
          <p data-testid="conversations-empty" className={styles.statePrompt}>
            No conversations yet.
          </p>
        )}

      {!conversationsLoading &&
        !conversationsError &&
        conversations.length > 0 && (
          <div className={styles.itemList}>
            {conversations.map((conversation) => {
              const isSelected = selectedConversationId === conversation.id;
              const itemClassName = isSelected
                ? `${styles.item} ${styles.selected}`
                : styles.item;
              return (
                <button
                  key={conversation.id}
                  onClick={(): void => onSelectConversation(conversation.id)}
                  className={itemClassName}
                  aria-pressed={isSelected}
                >
                  <div className={styles.itemTitle}>{conversation.title}</div>
                  <div className={styles.itemSnippet}>
                    {conversation.lastMessageSnippet}
                  </div>
                </button>
              );
            })}
          </div>
        )}
    </div>
  );
}
