# API Contract

## Conventions

### Base URL

All paths in this document are relative. The current mock serves them under an `/api/` prefix (e.g. `GET /api/conversations`).

---

## Endpoints

### POST /auth/login

Authenticates a user and returns a session token plus the resolved user identity.

In this mock there are no credentials — the request carries a `userId` chosen from the picker. In production this is replaced by a real credentials body (e.g. email + password) but the response shape is unchanged.

**Request body:**

```json
{ "userId": "me" }
```

**Response — 200 OK:**

```json
{
  "token": "mock-token-me",
  "user": { "id": "me", "name": "Me" }
}
```

**Response — 401 Unauthorized:**

```json
{
  "error": { "code": "UNAUTHORIZED", "message": "Unknown user" }
}
```

---

### GET /auth/users

Returns the list of user identities the picker can choose from.

_Request:_ no body, no query params.

**Response — 200 OK:**

```json
[
  { "id": "me", "name": "Me" },
  { "id": "support", "name": "Support" },
  { "id": "teammate", "name": "Teammate" }
]
```

---

### GET /conversations

Returns only the conversations the requesting user participates in (auth-scoped on the server).

_Request:_ no body, no query params. Identifies the caller via the `x-user-id` request header. (In the mock this stands in for the auth token; the real Week-3 endpoint scopes from the token, not a header.)

**Response — 200 OK:**

```json
[
  {
    "id": "c1",
    "title": "Frontend Support",
    "lastMessageSnippet": "Sure, I can help with that.",
    "lastMessageAt": "2026-05-26T10:00:00.000Z",
    "participantIds": ["me", "support"]
  },
  {
    "id": "c2",
    "title": "Project Chat",
    "lastMessageSnippet": "Let's ship the MVP this week.",
    "lastMessageAt": "2026-05-25T18:30:00.000Z",
    "participantIds": ["me", "teammate"]
  }
]
```

The list is already scoped to the caller by the server; the frontend only sorts by `lastMessageAt` descending.

---

### GET /conversations/:id/messages

Returns one page of messages in the conversation `id`, newest first. Cursor-paginated: the client requests the next (older) page by passing the previous response's `nextCursor` back via the `?cursor=` query param.

_Path params:_ `id` — the conversation ID.

_Query params:_

- `cursor` _(optional, string)_ — opaque cursor from a previous response. Omit on the first request to get the most recent page.

**Response — 200 OK:**

```json
{
  "messages": [
    {
      "id": "m6",
      "conversationId": "c1",
      "senderId": "support",
      "sentAt": "2026-05-26T09:53:00.000Z",
      "content": "Are the deps in the useEffect stable?"
    },
    {
      "id": "m7",
      "conversationId": "c1",
      "senderId": "me",
      "sentAt": "2026-05-26T09:57:00.000Z",
      "content": "Good point, the array is a new ref each render."
    },
    {
      "id": "m8",
      "conversationId": "c1",
      "senderId": "support",
      "sentAt": "2026-05-26T10:00:00.000Z",
      "content": "There it is. Stabilize that and you're good."
    }
  ],
  "nextCursor": "m6"
}
```

---

### POST /conversations/:id/messages

Creates a new message in the conversation `id`.

_Path params:_ `id` — the conversation ID.

**Request body:**

```json
{
  "content": "Hello!",
  "senderId": "me"
}
```

**Response — 201 Created:**

```json
{
  "id": "m-uuid",
  "conversationId": "c1",
  "senderId": "me",
  "sentAt": "2026-05-26T10:00:01.234Z",
  "content": "Hello!"
}
```

The server generates `id` and `sentAt`.

**Response — 500 Internal Server Error:**

```json
{
  "error": {
    "code": "INTERNAL",
    "message": "Something went wrong."
  }
}
```

---

## TypeScript shapes

Frontend canonical types live in `ai-chat-app/src/features/{auth,chat}/types.ts`.

```ts
// auth domain
export type User = {
  id: string;
  name: string;
};

export type AuthToken = string;

export type GetAvailableUsersResponse = User[];

export type LoginRequest = {
  userId: string;
};

export type LoginResponse = {
  token: AuthToken;
  user: User;
};

// chat domain
export type Conversation = {
  id: string;
  title: string;
  lastMessageSnippet: string;
  lastMessageAt: string;
  participantIds: string[];
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  sentAt: string;
  content: string;
};

export type GetConversationsResponse = Conversation[];

export type GetMessagesResponse = {
  messages: Message[];
  nextCursor: string | null;
};

export type SendMessageRequest = { content: string; senderId: string };
export type SendMessageResponse = Message;
```
