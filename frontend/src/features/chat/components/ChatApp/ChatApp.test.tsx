import { beforeEach, describe, expect, it } from "vitest";
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatApp from "./ChatApp";
import type { User } from "../../../auth/types";

const me: User = { id: "me", email: "me@example.com", name: "Me" };

beforeEach(() => {
  localStorage.setItem("auth.token", "mock-token-me");
});

const KNOWN_C1_MESSAGE = "Good point, the object is a new ref each render.";

async function openFirstConversation(): Promise<void> {
  const user = userEvent.setup();
  const conversationButton = await screen.findByRole("button", {
    name: /Frontend Support/,
  });
  await user.click(conversationButton);
  await screen.findByText(KNOWN_C1_MESSAGE);
}

describe("ChatApp integration", () => {
  it("optimistically renders a sent message and replaces it with the server response", async () => {
    const user = userEvent.setup();
    render(<ChatApp currentUser={me} />);

    await openFirstConversation();

    const textarea = screen.getByRole("textbox", { name: /Message/ });
    await user.type(textarea, "hello world");
    await user.keyboard("{Enter}");

    expect(screen.getByText("hello world")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("hello world")).toBeInTheDocument();
    });
    expect(screen.queryByText(/Couldn't send/)).not.toBeInTheDocument();
  });

  it("rolls back the optimistic message and shows a toast when the send fails", async () => {
    const user = userEvent.setup();
    render(<ChatApp currentUser={me} />);

    await openFirstConversation();

    const textarea = screen.getByRole("textbox", { name: /Message/ });
    await user.type(textarea, "/fail rollback please");
    await user.keyboard("{Enter}");

    const messageList = screen.getByTestId("messages-scroll");
    expect(
      within(messageList).getByText("/fail rollback please"),
    ).toBeInTheDocument();

    await waitForElementToBeRemoved(() =>
      within(messageList).queryByText("/fail rollback please"),
    );

    const toast = await screen.findByRole("alert");
    expect(toast).toHaveTextContent(/Couldn't send message/);

    expect(textarea).toHaveValue("/fail rollback please");
  });
});
