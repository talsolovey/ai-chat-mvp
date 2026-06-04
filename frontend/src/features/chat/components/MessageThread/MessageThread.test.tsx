import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import MessageThread from "./MessageThread";
import {
  initialMessageThreadState,
  type MessageThreadState,
} from "../../hooks/messageThreadReducer";
import type { Message } from "../../types";

function noop(): void {}

function makeState(overrides: Partial<MessageThreadState>): MessageThreadState {
  return { ...initialMessageThreadState, ...overrides };
}

const sampleMessages: Message[] = [
  {
    id: "m1",
    conversationId: "c1",
    senderId: "me",
    sentAt: "2026-05-26T09:40:00.000Z",
    content: "Hey, I need help with a React bug.",
  },
  {
    id: "m2",
    conversationId: "c1",
    senderId: "system",
    sentAt: "2026-05-26T09:42:00.000Z",
    content: "Sure — what's happening?",
  },
];

type ThreadProps = ComponentProps<typeof MessageThread>;

const defaultProps: ThreadProps = {
  thread: initialMessageThreadState,
  selectedConversationId: "c1",
  currentUserId: "me",
  messageText: "",
  onMessageTextChange: noop,
  onSendMessage: noop,
  onLoadOlder: noop,
};

function renderThread(overrides: Partial<ThreadProps> = {}) {
  return render(<MessageThread {...defaultProps} {...overrides} />);
}

describe("MessageThread", () => {
  it("renders the 'select a conversation' prompt when no conversation is selected", () => {
    renderThread({ selectedConversationId: null });

    expect(screen.getByTestId("messages-no-selection")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("renders the loading skeleton when the thread is loading", () => {
    renderThread({ thread: makeState({ isLoading: true }) });

    expect(screen.getByTestId("messages-skeleton")).toBeInTheDocument();
  });

  it("renders the empty-thread state when a conversation is selected but has no messages", () => {
    renderThread();

    expect(screen.getByTestId("messages-empty")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders each message's content when messages are present", () => {
    renderThread({ thread: makeState({ messages: sampleMessages }) });

    expect(
      screen.getByText("Hey, I need help with a React bug."),
    ).toBeInTheDocument();
    expect(screen.getByText("Sure — what's happening?")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("renders an inline error alert when the thread has a load error", () => {
    renderThread({ thread: makeState({ error: new Error("offline") }) });

    expect(screen.getByRole("alert")).toHaveTextContent(/offline/);
  });
});
