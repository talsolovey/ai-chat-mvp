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
