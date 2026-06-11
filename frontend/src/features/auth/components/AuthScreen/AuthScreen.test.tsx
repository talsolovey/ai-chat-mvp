import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../../../mocks/server";
import AuthScreen from "./AuthScreen";

describe("AuthScreen", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("disables the submit button until email and password are entered", async () => {
    const user = userEvent.setup();
    render(<AuthScreen onUserSelected={(): void => {}} />);

    const submit = screen.getByRole("button", { name: /^log in$/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/email/i), "me@example.com");
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/password/i), "password123");
    expect(submit).toBeEnabled();
  });

  it("logs in and calls onUserSelected with the resolved user", async () => {
    const user = userEvent.setup();
    const onUserSelected = vi.fn();
    render(<AuthScreen onUserSelected={onUserSelected} />);

    await user.type(screen.getByLabelText(/email/i), "support@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    await vi.waitFor(() => {
      expect(onUserSelected).toHaveBeenCalledWith({
        id: "support",
        email: "support@example.com",
        name: "Support",
      });
    });
    expect(onUserSelected).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("auth.token")).toBe("mock-token-support");
  });

  it("shows an error and does not log in with unknown credentials", async () => {
    const user = userEvent.setup();
    const onUserSelected = vi.fn();
    render(<AuthScreen onUserSelected={onUserSelected} />);

    await user.type(screen.getByLabelText(/email/i), "nobody@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /invalid email or password/i,
    );
    expect(onUserSelected).not.toHaveBeenCalled();
  });

  it("signup returns to the login form (with notice) instead of entering the app", async () => {
    const user = userEvent.setup();
    const onUserSelected = vi.fn();
    render(<AuthScreen onUserSelected={onUserSelected} />);

    await user.click(screen.getByRole("button", { name: /no account/i }));

    await user.type(screen.getByLabelText(/name/i), "New User");
    await user.type(screen.getByLabelText(/email/i), "new@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      /account created/i,
    );
    expect(
      screen.getByRole("heading", { name: /^log in$/i }),
    ).toBeInTheDocument();
    expect(onUserSelected).not.toHaveBeenCalled();
    expect(localStorage.getItem("auth.token")).toBeNull();

    expect(screen.getByLabelText(/email/i)).toHaveValue("new@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    await vi.waitFor(() => {
      expect(onUserSelected).toHaveBeenCalledWith(
        expect.objectContaining({ email: "new@example.com", name: "New User" }),
      );
    });
  });

  it("rejects signup with a duplicate email", async () => {
    const user = userEvent.setup();
    const onUserSelected = vi.fn();
    render(<AuthScreen onUserSelected={onUserSelected} />);

    await user.click(screen.getByRole("button", { name: /no account/i }));
    await user.type(screen.getByLabelText(/name/i), "Imposter");
    await user.type(screen.getByLabelText(/email/i), "me@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /email already in use/i,
    );
    expect(onUserSelected).not.toHaveBeenCalled();
  });

  it("surfaces a server error message", async () => {
    server.use(
      http.post("/api/auth/login", () => {
        return HttpResponse.json(
          { message: "boom", error: "Internal Server Error", statusCode: 500 },
          { status: 500 },
        );
      }),
    );

    const user = userEvent.setup();
    render(<AuthScreen onUserSelected={(): void => {}} />);

    await user.type(screen.getByLabelText(/email/i), "me@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/boom/i);
  });
});
