# Backend — AI Chat MVP API

A small REST API powering the Week 2 Frontend Chat MVP. Built with **Express 5 + TypeScript** (strict mode), using **in-memory storage** (no database yet).

## Stack

- Node.js + Express 5
- TypeScript (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- [Zod](https://zod.dev) for runtime input validation
- In-memory `Map` storage seeded from mock data

## Getting started

```bash
npm install
npm run dev
```

The server starts on **http://localhost:4000**. CORS is configured to allow the Vite dev server origin (`http://localhost:5173`).

## Scripts

| Script              | Description                                   |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Start in watch mode (`ts-node-dev`).          |
| `npm run typecheck` | Type-check without emitting (`tsc --noEmit`). |
| `npm run build`     | Clean and compile to `dist/`.                 |
| `npm run start`     | Run the compiled server (`dist/index.js`).    |
| `npm run serve`     | Build then start.                             |
| `npm run clean`     | Remove `dist/`.                               |

## Architecture

Requests flow through clean layers — no business logic or data access in the routes:

```
routes → controllers → services → in-memory store
```

```
src/
├── index.ts                 # app entrypoint: CORS, JSON, logging, routes, error handling
├── routes/                  # route definitions; mounts auth middleware
├── controllers/             # HTTP layer: validate input, call services, send responses
├── services/                # business logic + data access (owns the store)
├── middleware/              # logging, auth (x-user-id), 404, global error handler
├── validation/              # Zod schemas for bodies and query params
├── lib/                     # AppError + validation helper
├── domain/                  # shared TypeScript types
└── data/                    # in-memory store + seed mock data
```

## Authentication (mock)

`POST /auth/login` returns a fake token, but it is **not** validated yet (real auth lands in Week 4). Protected endpoints identify the caller via the **`x-user-id`** request header, per `API_CONTRACT.md`. Requests without it receive `401`.

## Endpoints

All routes are mounted under `/api`.

| Method | Path                              | Auth        | Description                                                      |
| ------ | --------------------------------- | ----------- | ---------------------------------------------------------------- |
| `POST` | `/api/auth/login`                 | —           | Accepts `{ userId }`, returns `{ token, user }`.                 |
| `GET`  | `/api/conversations`              | `x-user-id` | List the caller's conversations (newest first).                  |
| `POST` | `/api/conversations`              | `x-user-id` | Create a conversation from `{ title }`.                          |
| `GET`  | `/api/conversations/:id/messages` | `x-user-id` | Paginated history. Query: `cursor`, `limit` (1–100, default 20). |
| `POST` | `/api/conversations/:id/messages` | `x-user-id` | Create a message from `{ content }`.                             |
| `GET`  | `/health`                         | —           | Health check.                                                    |

See [`../API_CONTRACT.md`](../API_CONTRACT.md) for full request/response shapes.

## Error responses

All errors share a consistent shape:

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request body",
    "details": { "issues": [] }
  }
}
```

| Status | Code           | When                                                |
| ------ | -------------- | --------------------------------------------------- |
| `400`  | `BAD_REQUEST`  | Validation failure / malformed JSON.                |
| `401`  | `UNAUTHORIZED` | Missing `x-user-id` or unknown login user.          |
| `403`  | `FORBIDDEN`    | Conversation exists but is not owned by the caller. |
| `404`  | `NOT_FOUND`    | Unknown route or missing conversation.              |
| `500`  | `INTERNAL`     | Unexpected error.                                   |

## Notes

- Storage is in-memory: all data resets when the process restarts.
- The frontend reaches the API via the Vite dev proxy (`/api` → `http://localhost:4000`); set `VITE_USE_MOCKS=false` (or leave it unset) to hit this backend instead of MSW.
