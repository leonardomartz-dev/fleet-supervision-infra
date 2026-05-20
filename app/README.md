# Fleet Supervision Demo App

Phase 2 no-purchase demo for Fleet Supervision Infra. This app uses simulated Traccar data and demo property records only.

## Local Stack

From the repo root:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

From `app/`:

```bash
npm install
npx prisma generate
npm run seed:demo
npm run dev
```

Open `http://localhost:3000`.

## Checks

```bash
npm run lint
npm run build
```

## Demo Boundary

- Leo's repo/server are demo-only.
- Do not connect real GPS devices or real vehicle movement data here.
- Production requires company-controlled GitHub ownership, host, Docker deployment, backups, and Cloudflare Access.

