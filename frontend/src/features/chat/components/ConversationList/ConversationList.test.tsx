import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConversationList from "./ConversationList";
import type { Conversation } from "../../types";

function noop(): void {}

const sampleConversations: Conversation[] = [
  {
    id: "c1",
    title: "Frontend Support",
    lastMessageSnippet: "Sure, I can help with that.",
    lastMessageAt: "2026-05-26T10:00:00.000Z",
    userId: "me",
  },
  {
    id: "c2",
    title: "Project Chat",
    lastMessageSnippet: "Let's ship the MVP this week.",
    lastMessageAt: "2026-05-25T18:30:00.000Z",
    userId: "me",
  },
];

type ListProps = ComponentProps<typeof ConversationList>;

const defaultProps: ListProps = {
  conversations: sampleConversations,
  selectedConversationId: null,
  onSelectConversation: noop,
  onCreateConversation: noop,
  conversationsLoading: false,
  conversationsError: null,
};

function renderList(overrides: Partial<ListProps> = {}) {
  return render(<ConversationList {...defaultProps} {...overrides} />);
}

describe("ConversationList", () => {
  it("shows the loading skeleton when conversationsLoading is true", () => {
    renderList({ conversations: [], conversationsLoading: true });

    expect(screen.getByTestId("conversations-skeleton")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows an error alert when conversationsError is set", () => {
    renderList({
      conversations: [],
      conversationsError: new Error("network down"),
    });

    expect(screen.getByRole("alert")).toHaveTextContent(/network down/);
  });

  it("shows the empty state when there are no conversations", () => {
    renderList({ conversations: [] });

    expect(screen.getByTestId("conversations-empty")).toBeInTheDocument();
  });

  it("renders one button per conversation and calls onSelectConversation with the id when clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderList({ onSelectConversation: onSelect });

    expect(
      screen.getByRole("button", { name: /Frontend Support/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Project Chat/ }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Project Chat/ }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("c2");
  });

  it("marks the selected conversation with aria-pressed=true and others with false", () => {
    renderList({ selectedConversationId: "c1" });

    expect(
      screen.getByRole("button", { name: /Frontend Support/, pressed: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Project Chat/, pressed: false }),
    ).toBeInTheDocument();
  });

  it("calls onCreateConversation with the trimmed title from the new-conversation form", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    renderList({ onCreateConversation: onCreate });

    await user.type(
      screen.getByLabelText(/new conversation title/i),
      "  Design sync  ",
    );
    await user.click(screen.getByRole("button", { name: /new conversation/i }));

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate).toHaveBeenCalledWith("Design sync");
  });

  it("disables the create button until a title is entered", () => {
    renderList();

    expect(
      screen.getByRole("button", { name: /new conversation/i }),
    ).toBeDisabled();
  });
});
