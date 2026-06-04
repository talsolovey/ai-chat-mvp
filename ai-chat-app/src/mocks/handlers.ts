import { http, HttpResponse } from "msw";
import type {
  GetMessagesResponse,
  SendMessageRequest,
  Message,
} from "../features/chat/types";
import { MESSAGES_PAGE_SIZE, conversations, messages, users } from "./fixtures";
import { paginateByCursor } from "./pagination";

const getAvailableUsersHandler = http.get("/api/auth/users", () => {
  return HttpResponse.json(users);
});

const getConversationsHandler = http.get(
  "/api/conversations",
  ({ request }) => {
    const userId = request.headers.get("x-user-id") ?? "";
    const scoped = conversations.filter((c) =>
      c.participantIds.includes(userId),
    );
    return HttpResponse.json(scoped);
  },
);

const getMessagesHandler = http.get(
  "/api/conversations/:id/messages",
  ({ params, request }) => {
    const { id } = params;
    const cursor = new URL(request.url).searchParams.get("cursor");

    const conversationMessages = messages
      .filter((m) => m.conversationId === id)
      .sort((a, b) => a.sentAt.localeCompare(b.sentAt));

    const { page, nextCursor } = paginateByCursor(
      conversationMessages,
      cursor,
      MESSAGES_PAGE_SIZE,
    );

    const body: GetMessagesResponse = { messages: page, nextCursor };
    return HttpResponse.json(body);
  },
);

const SEND_FAILURE_TRIGGER = "/fail";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const sendMessageHandler = http.post(
  "/api/conversations/:id/messages",
  async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as SendMessageRequest;

    await delay(300);

    if (body.content.trim().toLowerCase().startsWith(SEND_FAILURE_TRIGGER)) {
      return HttpResponse.json(
        {
          error: {
            code: "INTERNAL",
            message: "Simulated send failure (mock-only debug trigger).",
          },
        },
        { status: 500 },
      );
    }

    const newMessage: Message = {
      id: crypto.randomUUID(),
      conversationId: String(id),
      senderId: body.senderId,
      sentAt: new Date().toISOString(),
      content: body.content,
    };

    messages.push(newMessage);
    return HttpResponse.json(newMessage, { status: 201 });
  },
);

export const handlers = [
  getAvailableUsersHandler,
  getConversationsHandler,
  getMessagesHandler,
  sendMessageHandler,
];
