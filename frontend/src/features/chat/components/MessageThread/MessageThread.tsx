import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactElement,
  type UIEvent,
} from "react";
import MessageComposer from "../MessageComposer";
import Skeleton from "../../../../components/Skeleton";
import type { MessageThreadState } from "../../hooks/messageThreadReducer";
import { formatClockTime } from "../../../../lib/formatTime";
import styles from "./MessageThread.module.css";

const LOAD_OLDER_THRESHOLD_PX = 48;

const TOOL_PROGRESS_LABELS: Record<string, string> = {
  search_documents: "Searching your documents…",
  summarize_my_recent_messages: "Looking up your messages…",
};

type MessageThreadProps = {
  thread: MessageThreadState;
  selectedConversationId: string | null;
  conversationTitle?: string | null;
  currentUserId: string;
  messageText: string;
  onMessageTextChange: (value: string) => void;
  onSendMessage: () => void;
  onLoadOlder: () => void;
};

export default function MessageThread({
  thread,
  selectedConversationId,
  conversationTitle = null,
  currentUserId,
  messageText,
  onMessageTextChange,
  onSendMessage,
  onLoadOlder,
}: MessageThreadProps): ReactElement {
  const sortedMessages = useMemo(
    () => [...thread.messages].sort((a, b) => a.sentAt.localeCompare(b.sentAt)),
    [thread.messages],
  );

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastMessage =
    sortedMessages.length > 0
      ? sortedMessages[sortedMessages.length - 1]
      : null;
  const lastMessageId = lastMessage?.id ?? null;
  const lastMessageContentLength = lastMessage?.content.length ?? 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [lastMessageId, lastMessageContentLength]);

  const distanceFromBottomRef = useRef(0);
  const wasLoadingOlderRef = useRef(false);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && wasLoadingOlderRef.current && !thread.isLoadingOlder) {
      el.scrollTop = el.scrollHeight - distanceFromBottomRef.current;
    }
    wasLoadingOlderRef.current = thread.isLoadingOlder;
  }, [thread.isLoadingOlder, thread.messages]);

  const hasMore = thread.nextCursor !== null;

  function handleScroll(event: UIEvent<HTMLDivElement>): void {
    const el = event.currentTarget;
    if (
      el.scrollTop <= LOAD_OLDER_THRESHOLD_PX &&
      hasMore &&
      !thread.isLoadingOlder
    ) {
      distanceFromBottomRef.current = el.scrollHeight - el.scrollTop;
      onLoadOlder();
    }
  }

  return (
    <div className={styles.root}>
      <h2>{conversationTitle ?? "Messages"}</h2>

      <div
        ref={scrollRef}
        data-testid="messages-scroll"
        className={styles.scroll}
        onScroll={handleScroll}
      >
        {thread.isLoadingOlder && (
          <div
            data-testid="messages-loading-older"
            className={styles.loadingOlder}
          >
            Loading older messages…
          </div>
        )}

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
                    <span className={styles.messageContent}>
                      {message.content}
                    </span>
                    {!!message.citations?.length && (
                      <ul
                        className={styles.citationList}
                        aria-label="Sources"
                      >
                        {message.citations.map((citation) => (
                          <li key={citation.chunkId}>
                            <details className={styles.citation}>
                              <summary className={styles.citationSummary}>
                                {citation.documentName}
                              </summary>
                              <blockquote className={styles.citationText}>
                                {citation.chunkText}
                              </blockquote>
                            </details>
                          </li>
                        ))}
                      </ul>
                    )}
                    <time
                      className={styles.messageTime}
                      dateTime={message.sentAt}
                    >
                      {formatClockTime(message.sentAt)}
                    </time>
                  </li>
                );
              })}
            </ul>
            <div ref={bottomRef} aria-hidden="true" />
          </>
        )}

        {thread.activeToolName != null && (
          <p
            data-testid="tool-progress"
            className={styles.toolProgress}
            role="status"
          >
            {TOOL_PROGRESS_LABELS[thread.activeToolName] ??
              `Using ${thread.activeToolName}…`}
          </p>
        )}
      </div>

      {selectedConversationId != null && (
        <MessageComposer
          messageText={messageText}
          onMessageTextChange={onMessageTextChange}
          onSendMessage={onSendMessage}
          disabled={thread.isLoading || thread.isSending}
        />
      )}
    </div>
  );
}
