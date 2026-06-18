# ai-chat-mvp

A full-stack chat app: React frontend, NestJS backend with JWT auth
(`backend-nest/`), and the legacy Week 3 Express backend (`backend/`).

## Run

MongoDB (required by `backend-nest/`, must be a replica set — see
`backend-nest/README.md` for details and alternatives):

```bash
docker run -d --name mongo-rs -p 27017:27017 mongo:7 --replSet rs0
docker exec mongo-rs mongosh --quiet --eval \
  "rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]})"
```

Backend:

```bash
cd backend-nest
npm install
cp .env.example .env   # set JWT_SECRET (MONGODB_URI is prefilled)
npm run start:dev
```

Frontend (second terminal):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173, sign up, and start chatting.
