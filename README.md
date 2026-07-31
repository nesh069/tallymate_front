# TallyMate Frontend

React (Vite) frontend for TallyMate — split expenses with friends. Backend:
[nesh069/tallymate_back](https://github.com/nesh069/tallymate_back).

## Run locally

```bash
npm install
npm run dev    # http://localhost:5173
```

All API calls go through the `/api` prefix and are proxied to the backend
(Vite dev proxy, or nginx when running via docker-compose).

## Tests

```bash
npm test       # Vitest component/unit suite
```

## Deployment (Vercel)

The frontend deploys on Vercel:

1. Import the `tallymate_front` GitHub repo. Use branch `dev` for testing; switch
   to `main` once a release branch exists.
2. Vercel auto-detects Vite: build command `npm run build`, output directory `dist`.
3. `vercel.json` rewrites `/api/*` to the Render backend and falls back to
   `/index.html` for client-side routes (deep links):
   - If your Render service URL differs from `https://tallymate-backend.onrender.com`,
     update the destination in `vercel.json` and commit.
4. No `VITE_API_URL` is needed — the same-origin `/api` proxy mirrors the local
   nginx setup, so no CORS configuration is required.

## Features

### Balances & Settlements
**Frontend**
- `/groups/:groupId/balances` — Balances page (protected route) showing net balances, suggested settlements, and activity feed
- Settle-up modal for recording a payment between two users
- Toast notification on successful settlement
