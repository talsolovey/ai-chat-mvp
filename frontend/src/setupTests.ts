import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./mocks/server";
import { resetConversations, resetMessages } from "./mocks/fixtures";

if (typeof Element !== "undefined") {
  Element.prototype.scrollIntoView = (): void => {};
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetMessages();
  resetConversations();
});

afterAll(() => {
  server.close();
});
