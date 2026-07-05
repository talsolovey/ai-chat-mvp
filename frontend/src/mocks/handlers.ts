import { http, HttpResponse } from "msw";
import type {
  GetMessagesResponse,
  SendMessageRequest,
  Message,
  CreateConversationRequest,
  Conversation,
} from "../features/chat/types";
import type {
  AuthResponse,
  LoginRequest,
  SignupRequest,
  User,
} from "../features/auth/types";
import { MESSAGES_PAGE_SIZE, conversations, messages, users } from "./fixtures";
import { paginateByCursor } from "./pagination";

function tokenFor(user: User): string {
  return `mock-token-${user.id}`;
}

function userFromAuthHeader(request: Request): User | undefined {
  const header = request.headers.get("Authorization") ?? "";
  const match = /^Bearer mock-token-(.+)$/.exec(header);
  if (!match) {
    return undefined;
  }
  return users.find((u) => u.id === match[1]);
}

function errorResponse(status: number, error: string, message: string) {
  return HttpResponse.json({ message, error, statusCode: status }, { status });
}

const signupHandler = http.post("/api/auth/signup", async ({ request }) => {
  const { email, name } = (await request.json()) as SignupRequest;

  if (users.some((u) => u.email === email)) {
    return errorResponse(409, "Conflict", "Email already in use");
  }

  const user: User = { id: crypto.randomUUID(), email, name };
  users.push(user);

  const body: AuthResponse = { token: tokenFor(user), user };
  return HttpResponse.json(body, { status: 201 });
});

const loginHandler = http.post("/api/auth/login", async ({ request }) => {
  const { email } = (await request.json()) as LoginRequest;
  const user = users.find((u) => u.email === email);

  if (!user) {
    return errorResponse(401, "Unauthorized", "Invalid email or password");
  }

  const body: AuthResponse = { token: tokenFor(user), user };
  return HttpResponse.json(body);
});

const meHandler = http.get("/api/me", ({ request }) => {
  const user = userFromAuthHeader(request);
  if (!user) {
    return errorResponse(401, "Unauthorized", "Unauthorized");
  }
  return HttpResponse.json(user);
});

const getConversationsHandler = http.get(
  "/api/conversations",
  ({ request }) => {
    const user = userFromAuthHeader(request);
    if (!user) {
      return errorResponse(401, "Unauthorized", "Unauthorized");
    }
    const scoped = conversations.filter((c) => c.userId === user.id);
    return HttpResponse.json(scoped);
  },
);

const createConversationHandler = http.post(
  "/api/conversations",
  async ({ request }) => {
    const user = userFromAuthHeader(request);
    if (!user) {
      return errorResponse(401, "Unauthorized", "Unauthorized");
    }

    const { title, type } = (await request.json()) as CreateConversationRequest;
    if (typeof title !== "string" || title.trim() === "") {
      return errorResponse(400, "Bad Request", "title is required");
    }

    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: title.trim(),
      type: type ?? "chat",
      lastMessageSnippet: "",
      lastMessageAt: new Date().toISOString(),
      userId: user.id,
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
    const authenticatedUser = userFromAuthHeader(request);
    const sendMessageBody = (await request.json()) as SendMessageRequest;

    await delay(50);

    if (
      sendMessageBody.content
        .trim()
        .toLowerCase()
        .startsWith(SEND_FAILURE_TRIGGER)
    ) {
      return errorResponse(
        500,
        "Internal Server Error",
        "Simulated send failure (mock-only debug trigger).",
      );
    }

    const persistedUserMessage: Message = {
      id: crypto.randomUUID(),
      conversationId: String(id),
      senderId: authenticatedUser?.id ?? "",
      sentAt: new Date().toISOString(),
      content: sendMessageBody.content,
    };
    messages.push(persistedUserMessage);

    const assistantReplyText = "Hi there!";
    const assistantMessageId = crypto.randomUUID();
    const textEncoder = new TextEncoder();

    const serverSentEventStream = new ReadableStream<Uint8Array>({
      start(streamController) {
        const enqueueServerSentEvent = (streamEvent: unknown): void => {
          streamController.enqueue(
            textEncoder.encode(`data: ${JSON.stringify(streamEvent)}\n\n`),
          );
        };

        enqueueServerSentEvent({ type: "token", text: "Hi " });
        enqueueServerSentEvent({ type: "token", text: "there!" });

        const persistedAssistantMessage: Message = {
          id: assistantMessageId,
          conversationId: String(id),
          senderId: null,
          sentAt: new Date().toISOString(),
          content: assistantReplyText,
        };
        messages.push(persistedAssistantMessage);

        enqueueServerSentEvent({
          type: "done",
          messageId: assistantMessageId,
          sentAt: persistedAssistantMessage.sentAt,
        });
        streamController.close();
      },
    });

    return new HttpResponse(serverSentEventStream, {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });
  },
);

const getKnowledgeDocumentsHandler = http.get(
  "/api/knowledge/documents",
  () => HttpResponse.json([]),
);

export const handlers = [
  signupHandler,
  loginHandler,
  meHandler,
  getConversationsHandler,
  createConversationHandler,
  getMessagesHandler,
  sendMessageHandler,
  getKnowledgeDocumentsHandler,
];
