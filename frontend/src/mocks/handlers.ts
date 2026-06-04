import { http, HttpResponse } from "msw";
import type {
  GetMessagesResponse,
  SendMessageRequest,
  Message,
  CreateConversationRequest,
  Conversation,
} from "../features/chat/types";
import type { LoginRequest, LoginResponse } from "../features/auth/types";
import { MESSAGES_PAGE_SIZE, conversations, messages, users } from "./fixtures";
import { paginateByCursor } from "./pagination";

const loginHandler = http.post("/api/auth/login", async ({ request }) => {
  const { userId } = (await request.json()) as LoginRequest;
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return HttpResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Unknown user" } },
      { status: 401 },
    );
  }

  const body: LoginResponse = { token: `mock-token-${user.id}`, user };
  return HttpResponse.json(body);
});

const getConversationsHandler = http.get(
  "/api/conversations",
  ({ request }) => {
    const userId = request.headers.get("x-user-id") ?? "";
    const scoped = conversations.filter((c) => c.userId === userId);
    return HttpResponse.json(scoped);
  },
);

const createConversationHandler = http.post(
  "/api/conversations",
  async ({ request }) => {
    const userId = request.headers.get("x-user-id") ?? "";
    const { title } = (await request.json()) as CreateConversationRequest;

    if (!userId) {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Missing user" } },
        { status: 401 },
      );
    }

    if (typeof title !== "string" || title.trim() === "") {
      return HttpResponse.json(
        { error: { code: "BAD_REQUEST", message: "title is required" } },
        { status: 400 },
      );
    }

    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: title.trim(),
      lastMessageSnippet: "",
      lastMessageAt: new Date().toISOString(),
      userId,
    };

    conversations.push(newConversation);
    return HttpResponse.json(newConversation, { status: 201 });
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
    const senderId = request.headers.get("x-user-id") ?? "";
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
      senderId,
      sentAt: new Date().toISOString(),
      content: body.content,
    };

    messages.push(newMessage);
    return HttpResponse.json(newMessage, { status: 201 });
  },
);

export const handlers = [
  loginHandler,
  getConversationsHandler,
  createConversationHandler,
  getMessagesHandler,
  sendMessageHandler,
];
