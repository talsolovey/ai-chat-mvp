import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MessageComposer from "./MessageComposer";

function noop(): void {}

type ComposerProps = ComponentProps<typeof MessageComposer>;

const defaultProps: ComposerProps = {
  messageText: "hello",
  onMessageTextChange: noop,
  onSendMessage: noop,
  disabled: false,
};

function renderComposer(overrides: Partial<ComposerProps> = {}) {
  return render(<MessageComposer {...defaultProps} {...overrides} />);
}

describe("MessageComposer", () => {
  it("calls onSendMessage when Enter is pressed without Shift", () => {
    const onSend = vi.fn();
    renderComposer({ onSendMessage: onSend });

    fireEvent.keyDown(screen.getByRole("textbox"), {
      key: "Enter",
      shiftKey: false,
    });

    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onSendMessage when Shift+Enter is pressed", () => {
    const onSend = vi.fn();
    renderComposer({ onSendMessage: onSend });

    fireEvent.keyDown(screen.getByRole("textbox"), {
      key: "Enter",
      shiftKey: true,
    });

    expect(onSend).not.toHaveBeenCalled();
  });

  it("disables the Send button when messageText is empty", () => {
    renderComposer({ messageText: "" });

    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("disables the Send button when messageText is whitespace only", () => {
    renderComposer({ messageText: "   " });

    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("disables the Send button and the textarea when the disabled prop is true", () => {
    renderComposer({ disabled: true });

    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("calls onSendMessage when the Send button is clicked", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    renderComposer({ onSendMessage: onSend });

    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(onSend).toHaveBeenCalledTimes(1);
  });
});
