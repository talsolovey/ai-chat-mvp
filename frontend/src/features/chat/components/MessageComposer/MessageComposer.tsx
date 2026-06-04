import type { KeyboardEvent, ReactElement } from "react";
import styles from "./MessageComposer.module.css";

type MessageComposerProps = {
  messageText: string;
  onMessageTextChange: (value: string) => void;
  onSendMessage: () => void;
  disabled: boolean;
};

export default function MessageComposer({
  messageText,
  onMessageTextChange,
  onSendMessage,
  disabled,
}: MessageComposerProps): ReactElement {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }
    event.preventDefault();
    if (disabled || !messageText.trim()) {
      return;
    }
    onSendMessage();
  }

  return (
    <div className={styles.root}>
      <textarea
        className={styles.textarea}
        placeholder="Type your message... (Enter to send, Shift+Enter for newline)"
        value={messageText}
        onChange={(e): void => onMessageTextChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={2}
        aria-label="Message"
      />
      <button
        className={styles.sendButton}
        onClick={onSendMessage}
        disabled={disabled || !messageText.trim()}
      >
        Send
      </button>
    </div>
  );
}
