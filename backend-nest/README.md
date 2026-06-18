# Chat Backend (NestJS)

NestJS backend for the chat app: JWT authentication (Passport), bcrypt-hashed
passwords, and per-user conversations and messages. Data is persisted in
**MongoDB** via Mongoose.

## Prerequisites

A running MongoDB **configured as a replica set**. The app writes messages
inside a transaction (`session.withTransaction`), and MongoDB transactions
require a replica set — a standalone `mongod` will not work.

A single-node replica set is enough for local development. Either:

**Option A — Docker**

```bash
docker run -d --name mongo-rs -p 27017:27017 mongo:7 --replSet rs0
# initialize the replica set once (pin the host to localhost):
docker exec mongo-rs mongosh --quiet --eval \
  "rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]})"
```

**Option B — local `mongod`**

```bash
mongod --dbpath ~/data/db --replSet rs0   # leave this running
# in another terminal, run once:
mongosh --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]})"
```

`rs.initiate(...)` only needs to run once per data directory; afterwards just
start Mongo.

## Setup

```bash
npm install
cp .env.example .env   # set a real JWT_SECRET (MONGO_URI is prefilled)
# make sure MongoDB (rs0) from the step above is running, then:
npm run start:dev      # http://localhost:4000
```

The frontend dev server proxies `/api/*` to port 4000, so no CORS setup is
needed in development.

> If the API returns `503 SERVICE_UNAVAILABLE` (or the UI shows "The server is
> temporarily unavailable"), MongoDB is not reachable — check that the `rs0`
> replica set is running and initialized.

## Environment

| Variable      | Required | Description                                        |
| ------------- | -------- | -------------------------------------------------- |
| `JWT_SECRET`  | yes      | Secret used to sign and verify JWTs                |
| `MONGO_URI` | yes      | MongoDB connection string (replica set; see above) |
| `PORT`        | no       | Defaults to `4000`                                 |

## Scripts

| Command                  | Purpose                                            |
| ------------------------ | -------------------------------------------------- |
| `npm run start:dev`      | Run with file watching                             |
| `npm run build`          | Compile to `dist/`                                 |
| `npm test`               | Unit tests (no database needed)                    |
| `npm run test:integration` | Repository tests against an in-memory MongoDB    |
| `npm run lint`           | ESLint                                             |
