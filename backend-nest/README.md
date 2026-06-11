# Chat Backend (NestJS)

NestJS backend for the chat app: JWT authentication (Passport), bcrypt-hashed
passwords, and per-user conversations and messages. Storage is in-memory.

## Setup

```bash
npm install
cp .env.example .env   # set a real JWT_SECRET
npm run start:dev      # http://localhost:4000
```

The frontend dev server proxies `/api/*` to port 4000, so no CORS setup is
needed in development.

## Environment

| Variable     | Required | Description                         |
| ------------ | -------- | ----------------------------------- |
| `JWT_SECRET` | yes      | Secret used to sign and verify JWTs |
| `PORT`       | no       | Defaults to `4000`                  |

## Scripts

| Command             | Purpose                |
| ------------------- | ---------------------- |
| `npm run start:dev` | Run with file watching |
| `npm run build`     | Compile to `dist/`     |
| `npm test`          | Unit tests             |
| `npm run lint`      | ESLint                 |

## API

All routes are prefixed with `/api`. Protected routes require
`Authorization: Bearer <token>`.

| Method | Path                          | Auth | Description                                                               |
| ------ | ----------------------------- | ---- | ------------------------------------------------------------------------- |
| GET    | `/health`                     | —    | Liveness check                                                            |
| POST   | `/auth/signup`                | —    | `{ email, password, name }` → `{ token, user }`; `409` on duplicate email |
| POST   | `/auth/login`                 | —    | `{ email, password }` → `{ token, user }`; `401` on bad credentials       |
| GET    | `/me`                         | JWT  | Current authenticated user                                                |
| GET    | `/conversations`              | JWT  | Caller's conversations, newest first                                      |
| POST   | `/conversations`              | JWT  | `{ title }` → `201` conversation                                          |
| GET    | `/conversations/:id/messages` | JWT  | Paginated (`?cursor=&limit=`); `403` if not a participant                 |
| POST   | `/conversations/:id/messages` | JWT  | `{ content }` → `201` message; `403` if not a participant                 |

Validation errors return `400`. Missing or invalid tokens return `401`.
Accessing another user's conversation returns `403` (never the data); unknown
conversation ids return `404`.

## Modules

- `AuthModule` — signup, login, JWT issuance, Passport strategy, guard, `/me`
- `UsersModule` — user storage and password-free public projection
- `ConversationsModule` — conversation storage and the ownership rule
- `MessagesModule` — message storage and cursor pagination
- `CommonModule` — shared id generation
