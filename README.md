# SoloFlow

A full-stack freelance business management platform. Manage clients, projects, proposals, invoices, and a calendar — with an AI assistant for proposal drafting and client communication strategy.

---

## Stack

**Frontend** — React 19, TypeScript, Tailwind CSS v4, Vite 6, React Router v7

**Backend** — NestJS 10, TypeScript, MongoDB 8, Mongoose 8

**Auth** — JWT (7-day expiry), bcrypt (12 rounds)

**AI** — Google Gemini via `@google/genai` — `gemini-2.5-flash` with `gemini-2.0-flash` fallback. Graceful template fallback when the API is unavailable.

---

## Repository Layout

```
soloflow/
├── frontend/
│   ├── src/
│   │   ├── components/        Layout shell, sidebar, UI primitives
│   │   ├── pages/             20 page components
│   │   ├── services/api.ts    Typed fetch client (all API calls in one place)
│   │   └── types.ts           Shared domain interfaces
│   ├── index.html
│   ├── vite.config.ts         Dev server on :3000 — proxies /api to :3001
│   ├── tsconfig.json
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── auth/              Registration, login, JWT strategy, guard
│   │   ├── users/             User schema and service
│   │   ├── clients/           Client CRUD with aggregated spend and project count
│   │   ├── projects/          Project CRUD, Kanban status transitions
│   │   ├── proposals/         Proposal CRUD, sequential numbering, AI generation
│   │   ├── invoices/          Invoice CRUD, line items, mark-paid with timestamp
│   │   ├── calendar/          Manual events + events derived from projects and invoices
│   │   ├── dashboard/         MongoDB aggregation pipeline for KPIs and revenue timeline
│   │   ├── analytics/         Aggregated revenue, win rate, collection rate
│   │   ├── activities/        Internal event log consumed by the dashboard
│   │   ├── ai/                Gemini service — proposal generation and chat assistant
│   │   └── database/seed/     Development seeder (safe to re-run)
│   ├── .env                   Environment secrets — not committed
│   ├── package.json
│   ├── tsconfig.json
│   └── tsconfig.build.json
│
├── .env.example               Copy to backend/.env and fill in values
├── .gitignore
└── README.md
```

---

## Prerequisites

- Node.js v18 or higher
- MongoDB running on `localhost:27017`, or a MongoDB Atlas connection string
- A Google Gemini API key (optional — the application works without it)

---

## Getting Started

**1. Configure the backend environment**

```bash
cp .env.example backend/.env
```

Open `backend/.env` and set the required values:

```env
MONGODB_URI=mongodb://localhost:27017/soloflow
JWT_SECRET=<replace-with-a-long-random-secret>
GEMINI_API_KEY=<your-key>
```

To generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**2. Install dependencies**

```bash
cd frontend && npm install
cd ../backend && npm install
```

**3. Seed demo data** (optional)

```bash
cd backend && npm run seed
```

This creates one demo account and a realistic dataset of clients, projects, invoices, and proposals. The seed is safe to re-run — it removes the previous demo records before inserting fresh ones.

Demo credentials:

```
Email:    demo@soloflow.com
Password: demo123
```

**4. Start the development servers**

Open two terminal windows.

Terminal 1 — backend:

```bash
cd backend
npm run start:dev
```

Terminal 2 — frontend:

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000`. All `/api` requests are proxied to the NestJS server on port 3001 — no CORS configuration needed on the frontend side.

---

## Production Build

```bash
# Compile the frontend to frontend/dist/
cd frontend && npm run build

# Compile the backend to backend/dist/
cd ../backend && npm run build

# Start the API server
cd backend && npm run start
```

For production deployment, configure a reverse proxy (nginx, Caddy, or similar) to serve `frontend/dist/` as static files and forward all `/api/*` requests to the NestJS process on port 3001.

---

## API

All endpoints require an `Authorization: Bearer <token>` header except the two auth routes below.

### Authentication

```
POST  /api/auth/register
POST  /api/auth/login
GET   /api/auth/me
PUT   /api/auth/profile
```

### Clients

```
GET    /api/clients          ?search=
POST   /api/clients
GET    /api/clients/:id      Returns client + related projects, proposals, invoices
PUT    /api/clients/:id
DELETE /api/clients/:id
```

### Projects

```
GET    /api/projects         ?search= &clientId=
POST   /api/projects
PUT    /api/projects/:id
PATCH  /api/projects/:id/status
DELETE /api/projects/:id
```

### Proposals

```
GET    /api/proposals        ?search= &clientId=
POST   /api/proposals/generate    Gemini generation — returns structured JSON, not persisted
POST   /api/proposals
GET    /api/proposals/:id
PUT    /api/proposals/:id
PATCH  /api/proposals/:id/status
DELETE /api/proposals/:id
```

### Invoices

```
GET    /api/invoices         ?search= &clientId=
POST   /api/invoices
GET    /api/invoices/:id
PUT    /api/invoices/:id
PATCH  /api/invoices/:id/status
DELETE /api/invoices/:id
```

### Calendar

```
GET    /api/calendar         Returns manual events + events derived from project deadlines and invoice due dates
POST   /api/calendar
PATCH  /api/calendar/:id
DELETE /api/calendar/:id
```

### Dashboard and Analytics

```
GET    /api/dashboard        Aggregated KPIs: revenue, pending payments, project counts, timeline, top clients
GET    /api/analytics        Revenue totals, proposal win rate, collection rate, monthly breakdown
```

### AI

```
POST   /api/ai/chat          Freelance business assistant — pricing, scope, client communication
```

---

## Data Model

Every resource is scoped to its owner. The backend enforces ownership on every query — no user can read or modify another user's records.

| Collection | Key relationships |
|---|---|
| `users` | Root owner of all other records |
| `clients` | Belongs to `users` |
| `projects` | Belongs to `users`, references `clients` |
| `proposals` | Belongs to `users`, references `clients` and optionally `projects` |
| `invoices` | Belongs to `users`, references `clients` and optionally `projects` |
| `calendarevents` | Belongs to `users` — `sourceType: manual | project | invoice` |
| `activities` | Belongs to `users` — written internally on key mutations |

`totalSpent` and `projectsCount` on clients are not stored — they are computed at query time via MongoDB aggregation pipelines. Dashboard and analytics charts derive all values from real invoice and project records; nothing is hardcoded.

---

## Security

- Passwords are hashed with bcrypt before storage. Plaintext passwords are never written to the database.
- JWT tokens are signed with a secret loaded from the environment variable `JWT_SECRET`. The default value in the codebase is intentionally weak — replace it before any deployment.
- Every protected controller method uses `JwtAuthGuard`. The guard validates the token, loads the user from MongoDB, and attaches it to the request. Expired or tampered tokens are rejected.
- Rate limiting is configured at 100 requests per 60 seconds per IP via `@nestjs/throttler`.
- The `GEMINI_API_KEY` is read server-side only and is never included in any response sent to the browser.
