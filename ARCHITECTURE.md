# SoloFlow Architecture — Client-Centered Business Model

## 1. Current Data Model (as inspected before the reset)

MongoDB database: `soloflow` (development — `MONGODB_URI=mongodb://localhost:27017/soloflow`)

### Collections found during inspection

| Collection | Key fields | Notes |
|---|---|---|
| `users` | name, email(unique), passwordHash, businessName, currency, role(USER/ADMIN), plan(free/pro), subscriptionStatus, accountStatus, bankDetails, aiSettings | Auth root |
| `clients` | userId→User(indexed), name, company, email, phone, website, address, status(Active/Lead/Inactive), tier, country, notes | Compound index `{userId:1, createdAt:-1}` |
| `projects` | userId→User(indexed), clientId→Client, title, description, budget, priority, status, startDate?, deadline, tags[], tasks[], proposalId? | Indexes `{userId,status}`, `{userId,clientId}` |
| `proposals` | userId→User(indexed), proposalNumber, clientId→Client, projectId?→Project, title, amount, status, tone, overview, scopeOfWork[], deliverables[], timeline, investment, terms | Indexes `{userId,createdAt:-1}`, `{userId,clientId}` |
| `invoices` | userId→User(indexed), invoiceNumber, clientId→Client, projectId?→Project, issueDate, dueDate, status, items[], subtotal, taxRate, taxAmount, total, currency, notes, paidAt? | Indexes `{userId,status}`, `{userId,clientId}` |
| `activities` | userId→User, type, title, subtitle, iconType?, timestamp | Feed log |
| `calendarevents` | userId, title, clientId?, date, type, description, completed, sourceType | Calendar |
| `subscriptions` | userId, plan, status, startedAt, expiresAt, provider… | Billing |

**Findings at inspection time:**
- Document schemas were already relational (references, no embedded arrays of projects/proposals/invoices inside Client docs). ✔
- Ownership guards existed (`validateClient` verified `client.userId === currentUser`). ✔
- Client-scoped READ endpoints existed (`GET /api/clients/:id/projects|proposals|invoices`). ✔
- BUT creation was **standalone**: `POST /api/projects|proposals|invoices` accepted `clientId` from the request body. ✘
- The frontend used client dropdowns and flat module routing. ✘

## 2. Target Architecture

```
USER
 └── CLIENT
      ├── PROJECTS
      ├── PROPOSALS
      └── INVOICES
```

### Relationships
- Every business resource carries BOTH `userId` and `clientId`.
- `projectId` on Proposal/Invoice is optional.
- Client documents never embed arrays of related resources — references only.

### API contracts (single source of truth for CREATION)

| Method | Route | Purpose |
|---|---|---|
| GET/POST | `/api/clients` | List (cards w/ counts) / create client |
| GET/PUT/DELETE | `/api/clients/:id` | Client detail (+related records) / update / delete |
| GET | `/api/clients/:id/projects` | Client-scoped project list |
| POST | `/api/clients/:id/projects` | Create project inside client (clientId from ROUTE) |
| GET | `/api/clients/:id/proposals` | Client-scoped proposal list |
| POST | `/api/clients/:id/proposals` | Create proposal inside client |
| GET | `/api/clients/:id/invoices` | Client-scoped invoice list |
| POST | `/api/clients/:id/invoices` | Create invoice inside client |
| GET/PATCH/DELETE | `/api/projects/:id…`, `/api/proposals/:id…`, `/api/invoices/:id…` | Resource-scoped read/update/status/delete (ownership checked) |

Standalone `POST /api/projects|proposals|invoices` endpoints are REMOVED — creation happens only inside a client scope. The request body contains resource-specific fields only; `clientId` always comes from the route and is re-validated against `currentUser`.

### Frontend routing

Primary (client workspace):
```
/clients                        → client cards
/clients/:clientId              → Overview tab
/clients/:clientId/projects     → Projects tab        …/projects/new  → create form
/clients/:clientId/proposals    → Proposals tab       …/proposals/new → create form
/clients/:clientId/invoices     → Invoices tab        …/invoices/new  → create form
/clients/:clientId/notes        → Notes tab
```
Secondary global views (grouped by client):
```
/all-projects  /all-proposals  /all-invoices
```

Sidebar navigation: Dashboard · Clients · Calendar · Analytics · AI Assistant (+ Settings via profile). Global record views are secondary links.

## 3. Database Reset Procedure (development ONLY)

1. Inspect schema (this document §1).
2. Snapshot: `npm run backup --workspace=backend` → writes JSON exports to `backend/database-backups/<timestamp>/`.
3. Reset + reseed: `npm run seed --workspace=backend` → clears the dev DB collections and inserts the controlled test dataset below.

Never targets production. Only the URI in `backend/.env`.

## 4. Fresh Test Data (seeded)

```
demo@soloflow.com / demo123 (Pro freelancer)
├── Acme Ltd
│    ├── Website Redesign          (project)
│    ├── Website Proposal PROP-…   (proposal, linked to project)
│    ├── INV-2026-001 (Paid)       (invoice, linked to project)
│    └── INV-2026-002 (Sent)
└── Kigali Tech
     ├── Mobile App                (project)
     ├── Mobile App Proposal PROP-…
     └── INV-2026-003 (Overdue)

other@soloflow.com / other123 (isolation-test user)
└── Other Client Co
     └── Secret Project            (must NEVER be visible to demo user)
admin@soloflow.com / admin123    (platform admin)
```
