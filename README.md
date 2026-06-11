# ai-chat-mvp

A full-stack chat app: React frontend, NestJS backend with JWT auth
(`backend-nest/`), and the legacy Week 3 Express backend (`backend/`).

## Run

Backend:

```bash
cd backend-nest
npm install
cp .env.example .env   # set JWT_SECRET
npm run start:dev
```

Frontend (second terminal):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173, sign up, and start chatting.
