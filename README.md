# SoloFlow

A full-stack freelance business management platform. Manage clients, projects, invoices, and analytics — with AI-powered assistance for business strategy and client communication.

---

## Features

- **Client CRM** — Centralized client profiles with lifetime value, project history, and activity tracking
- **Project Management** — Kanban boards with status transitions, budgets, priorities, and deadlines
- **Invoicing** — Itemized invoices with tax calculation, payment tracking, and status management
- **Financial Analytics** — Revenue trends, collection rates, win rates, and monthly breakdowns
- **Unified Calendar** — Deadlines, invoice due dates, and meetings in a single view
- **AI Assistant** — Business strategy advice on pricing, scope, and client communication
- **Admin Panel** — User management, plan grants, account status controls, and platform stats
- **Role-Based Access** — USER and ADMIN roles with enforced ownership on all resources
- **Subscription System** — Starter (free) and Pro plans with entitlement guards

---

## Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Vite 6, React Router v7 |
| **Backend** | NestJS 10, TypeScript, Mongoose 8 |
| **Database** | MongoDB 8 (local or Atlas) |
| **Auth** | JWT (7-day expiry), bcrypt (12 rounds) |
| **AI** | Google Gemini via `@google/genai` |

---

## Repository Layout

```
soloflow/
├── frontend/
│   ├── src/
│   │   ├── components/        Layout shell, sidebar, UI primitives
│   │   ├── pages/             19 page components
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
│   │   ├── invoices/          Invoice CRUD, line items, mark-paid with timestamp
│   │   ├── calendar/          Manual events + events derived from projects and invoices
│   │   ├── dashboard/         MongoDB aggregation pipeline for KPIs and revenue timeline
│   │   ├── analytics/         Aggregated revenue, collection rate, win rate
│   │   ├── activities/        Internal event log consumed by the dashboard
│   │   ├── ai/                Gemini-powered business assistant
│   │   ├── admin/             Admin-only user management and platform stats
│   │   ├── subscriptions/     Subscription lifecycle and plan management
│   │   ├── payments/          Payment provider abstraction (mock for now)
│   │   ├── entitlements/      Plan definitions, feature flags, role guards
│   │   └── database/seed/     Development seeder (safe to re-run)
│   ├── .env                   Environment secrets — not committed
│   ├── package.json
│   ├── tsconfig.json
│   └── tsconfig.build.json
│
├── DEPLOYMENT.md              Production deployment guide (Render + Cloudflare Pages + Atlas)
├── ARCHITECTURE.md            Data model, relationships, and API contracts
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

This creates demo accounts with a realistic dataset of clients, projects, invoices, and activities. Safe to re-run — it clears previous demo records first.

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

Open `http://localhost:3000`. All `/api` requests are proxied to the NestJS server on port 3001 — no CORS configuration needed in development.

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

For production deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md) for a complete guide covering Render, Cloudflare Pages, and MongoDB Atlas.

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
GET    /api/clients/:id      Returns client + related projects, invoices, activities
PUT    /api/clients/:id
DELETE /api/clients/:id
GET    /api/clients/:id/projects
POST   /api/clients/:id/projects
GET    /api/clients/:id/invoices
POST   /api/clients/:id/invoices
```

### Projects

```
GET    /api/projects         ?search= &clientId=
POST   /api/projects
PUT    /api/projects/:id
PATCH  /api/projects/:id/status
DELETE /api/projects/:id
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
GET    /api/calendar         Manual events + events derived from project deadlines and invoice due dates
POST   /api/calendar
PATCH  /api/calendar/:id
DELETE /api/calendar/:id
```

### Dashboard and Analytics

```
GET    /api/dashboard        Aggregated KPIs: revenue, pending payments, project counts, timeline, top clients
GET    /api/analytics        Revenue totals, collection rate, monthly breakdown
```

### AI

```
POST   /api/ai/chat          Business assistant — pricing, scope, client communication advice
```

### Admin

```
GET    /api/admin/stats                      Platform-wide statistics
GET    /api/admin/users           ?search= &plan= &status= &page=
GET    /api/admin/users/:id
POST   /api/admin/users/:id/grant-pro
POST   /api/admin/users/:id/revoke-pro
PATCH  /api/admin/users/:id/account-status
```

---

## Data Model

Every resource is scoped to its owner. The backend enforces ownership on every query — no user can read or modify another user's records.

| Collection | Key relationships |
|---|---|
| `users` | Root owner of all other records |
| `clients` | Belongs to `users` |
| `projects` | Belongs to `users`, references `clients` |
| `invoices` | Belongs to `users`, references `clients` and optionally `projects` |
| `calendarevents` | Belongs to `users` — `sourceType: manual | project | invoice` |
| `activities` | Belongs to `users` — written internally on key mutations |
| `subscriptions` | Belongs to `users` — tracks plan lifecycle and billing status |

`totalSpent` and `projectsCount` on clients are computed at query time via MongoDB aggregation pipelines. Dashboard and analytics charts derive all values from real invoice and project records — nothing is hardcoded.

---

## Plans

| | Starter | Pro |
|---|---|---|
| **Price** | Free forever | $19/mo |
| Active clients | Unlimited | Unlimited |
| Active projects | Unlimited | Unlimited |
| Invoices/month | Unlimited | Unlimited |
| AI assistant | Limited daily usage | Unlimited |
| Analytics | Full access | Full access |
| Calendar | Full access | Full access |
| Admin features | — | — |

Both plans have unlimited resource limits. The AI daily usage limits are configurable via environment variables.

---

## Security

- Passwords are hashed with bcrypt (12 rounds) before storage. Plaintext passwords are never written to the database.
- JWT tokens are signed with a secret loaded from `JWT_SECRET`. Replace the default before any deployment.
- Every protected endpoint uses `JwtAuthGuard`. Expired or tampered tokens are rejected.
- Rate limiting is configured at 100 requests per 60 seconds per IP via `@nestjs/throttler`.
- Admin endpoints are protected by `RolesGuard` — only users with `role: 'ADMIN'` can access them.
- The `GEMINI_API_KEY` is read server-side only and is never included in any response sent to the browser.
- All resource queries are scoped by `userId` — cross-user data access is impossible at the query level.

---

## License

This project is proprietary software.
