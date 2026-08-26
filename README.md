# Tenant A EC2 and Envoy Lab

This repository contains two independent Node.js applications for Phase 1:

```text
Browser -> Envoy -> Frontend :3001
                 -> Backend  :4000
```

Envoy is intentionally not configured in this repository.

## Repository layout

```text
.
├── frontend/              # Static HTML, CSS, and browser JavaScript
│   ├── public/
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── backend/               # NestJS API, database, and Redis application
│   ├── src/
│   ├── test/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

The frontend uses `fetch('/api/hello')`. This relative URL keeps the browser on
the Envoy domain. Envoy routes that path to the backend; no EC2 address is
embedded in frontend code.

## Start with Docker Compose

Start both applications and the existing PostgreSQL/Redis dependencies:

```bash
docker compose up -d --build
```

Start only the frontend:

```bash
docker compose up -d --build frontend
```

Start the backend and its dependencies:

```bash
docker compose up -d --build backend
```

Local endpoints:

- frontend: <http://localhost:3001>
- backend health: <http://localhost:4000/health>
- backend greeting: <http://localhost:4000/api/hello>

A browser opened directly on port 3001 does not reproduce Envoy path routing.
Use `https://<envoy-domain>/?tenant=a` for the full browser-to-backend flow.

## Run without Docker

Frontend:

```bash
cd frontend
npm install
PORT=3001 npm start
```

Backend (with PostgreSQL and Redis already running):

```bash
cd backend
cp .env.example .env
npm install
PORT=4000 npm run start:dev
```

## Backend endpoints

- `GET /health`
- `GET /api/hello`
- `GET /api/health`
- `GET /api/stats`
- `GET /api/messages`
- `POST /api/messages` with `{ "text": "hello" }`
- `GET /api/deploy/check-db`
- `GET /api/deploy/check-redis`

## Build and test

```bash
cd frontend && npm run build
cd ../backend && npm run build
cd ../backend && npm test -- --runInBand
cd ../backend && npm run test:e2e -- --runInBand
```

When the backend moves to another EC2 instance, the frontend remains unchanged.
Update the Envoy backend upstream and EC2 networking/security rules so Envoy can
reach the backend private address on port 4000.
