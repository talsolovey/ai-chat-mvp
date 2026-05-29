import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../../../mocks/server";
import AuthScreen from "./AuthScreen";

describe("AuthScreen", () => {
  it("shows a loading message before the user list resolves", () => {
    render(<AuthScreen onUserSelected={(): void => {}} />);

    expect(screen.getByText(/Loading users/i)).toBeInTheDocument();
  });

  it("shows an error message when the user list fails to load", async () => {
    server.use(
      http.get("/api/auth/users", () => {
        return HttpResponse.json(
          { error: { code: "INTERNAL", message: "boom" } },
          { status: 500 },
        );
      }),
    );

    render(<AuthScreen onUserSelected={(): void => {}} />);

    expect(await screen.findByText(/Error loading users/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Me" }),
    ).not.toBeInTheDocument();
  });

  it("shows an empty-state message when no users are available", async () => {
    server.use(
      http.get("/api/auth/users", () => {
        return HttpResponse.json([]);
      }),
    );

    render(<AuthScreen onUserSelected={(): void => {}} />);

    expect(await screen.findByText(/No users available/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders one button per user returned by the API", async () => {
    render(<AuthScreen onUserSelected={(): void => {}} />);

    expect(
      await screen.findByRole("button", { name: "Me" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Support" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Teammate" }),
    ).toBeInTheDocument();
  });

  it("calls onUserSelected with the picked user when a button is clicked", async () => {
    const user = userEvent.setup();
    const onUserSelected = vi.fn();
    render(<AuthScreen onUserSelected={onUserSelected} />);

    const supportButton = await screen.findByRole("button", {
      name: "Support",
    });
    await user.click(supportButton);

    expect(onUserSelected).toHaveBeenCalledTimes(1);
    expect(onUserSelected).toHaveBeenCalledWith({
      id: "support",
      name: "Support",
    });
  });
});
