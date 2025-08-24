
# Wi‑Fi Kids — Monorepo (PWA + Backend)

This repository contains:
- `apps/pwa` — Bilingual PWA (Vite + React + TS) with the **“Acessar Internet / Access Internet”** CTA.
- `apps/backend` — Node/Express TypeScript backend integrating **LangChain** (GPT‑5) and **OpenNDS FAS** grant flow.
- `docker-compose.yml` — One command to run both services for local dev.

## Quick Start (Local)

### 0) Requirements
- Node 18+ (or 20+)
- pnpm (recommended) or npm/yarn
- (Optional) Docker + Docker Compose

### 1) Configure environment
Copy `.env.example` to `.env` in `apps/backend/` and set your keys.

```bash
cp apps/backend/.env.example apps/backend/.env
```

### 2) Install dependencies
```bash
pnpm i -r
```

### 3) Run dev (two terminals) 
#### Terminal A — backend
```bash
cd apps/backend
pnpm dev
```

#### Terminal B — PWA
```bash
cd apps/pwa
pnpm dev
```
- PWA runs on http://localhost:5174
- Backend runs on http://localhost:3001

### 4) Docker (optional)
```bash
docker compose up --build
```
- PWA at http://localhost:8080
- Backend at http://localhost:3001

## OpenNDS Integration (MVP)
- Configure OpenNDS to redirect to the PWA URL.
- Ensure FAS remote calls hit `apps/backend` `/api/fas/grant` server‑to‑server.
- Backend expects `tok`, `clientip`, `gatewayname` in query or headers.

## Structure
```
apps/
  backend/
  pwa/
docker-compose.yml
```

## Security Notes
- Never expose FAS grant URLs to the client.
- Sign session tokens and store session → allow_until mapping server-side.
- Rate-limit by `device_id` and `clientip`.
