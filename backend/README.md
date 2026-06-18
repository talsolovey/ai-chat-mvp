# Backend — Express (Week 3, legacy)

The Week 3 Express + TypeScript backend, kept for reference. Superseded by
`backend-nest/`, which the frontend now targets.

## Run

```bash
npm install
npm run dev   # http://localhost:4000
```

Storage is in-memory; data resets on restart. This backend predates the JWT
auth and MongoDB work in `backend-nest/` and has no auth endpoints. It also
listens on port 4000, so run it _instead of_ `backend-nest/`, not alongside it —
the frontend's login/signup flow only works against `backend-nest/`.
