import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../../../mocks/server";
import AuthScreen from "./AuthScreen";

describe("AuthScreen", () => {
  it("disables the submit button until a user ID is entered", () => {
    render(<AuthScreen onUserSelected={(): void => {}} />);

    expect(screen.getByRole("button", { name: /log in/i })).toBeDisabled();
  });

  it("logs in and calls onUserSelected with the resolved user", async () => {
    const user = userEvent.setup();
    const onUserSelected = vi.fn();
    render(<AuthScreen onUserSelected={onUserSelected} />);

    await user.type(screen.getByLabelText(/user id/i), "support");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await vi.waitFor(() => {
      expect(onUserSelected).toHaveBeenCalledWith({
        id: "support",
        name: "Support",
      });
    });
    expect(onUserSelected).toHaveBeenCalledTimes(1);
  });

  it("shows an error and does not log in when the user is unknown", async () => {
    const user = userEvent.setup();
    const onUserSelected = vi.fn();
    render(<AuthScreen onUserSelected={onUserSelected} />);

    await user.type(screen.getByLabelText(/user id/i), "nobody");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/unknown user/i);
    expect(onUserSelected).not.toHaveBeenCalled();
  });

  it("surfaces a server error message", async () => {
    server.use(
      http.post("/api/auth/login", () => {
        return HttpResponse.json(
          { error: { code: "INTERNAL", message: "boom" } },
          { status: 500 },
        );
      }),
    );

    const user = userEvent.setup();
    render(<AuthScreen onUserSelected={(): void => {}} />);

    await user.type(screen.getByLabelText(/user id/i), "me");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/boom/i);
  });
});
