# Chat Frontend (React)

React 19 + Vite + TypeScript chat UI. Sign up or log in with email and
password; the JWT is stored in localStorage and sent on every request.
Conversations on the left, the active thread on the right, with optimistic
message sending. Talks to `backend-nest/` through the Vite dev proxy
(`/api/*` → http://localhost:4000); tests run against MSW mocks.

## Run

```bash
npm install
npm run dev   # http://localhost:5173
```

## Scripts

| Command        | Purpose            |
| -------------- | ------------------ |
| `npm run dev`  | Dev server         |
| `npm run build`| Type-check + build |
| `npm test`     | Tests (vitest)     |
| `npm run lint` | ESLint             |
