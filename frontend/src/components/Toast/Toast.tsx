import { useEffect, type ReactElement } from "react";
import styles from "./Toast.module.css";

type ToastProps = {
  message: string;
  onDismiss: () => void;
  durationMs?: number;
};

export default function Toast({
  message,
  onDismiss,
  durationMs = 4000,
}: ToastProps): ReactElement {
  useEffect(() => {
    const id = setTimeout(onDismiss, durationMs);
    return (): void => clearTimeout(id);
  }, [onDismiss, durationMs]);

  return (
    <div role="alert" className={styles.toast}>
      <span>{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className={styles.dismiss}
      >
        Dismiss
      </button>
    </div>
  );
}
