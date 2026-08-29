# 🚀 SoloFlow — Deployment Guide

A step-by-step guide to deploying SoloFlow in production:

| Layer | Service | URL Pattern |
|-------|---------|-------------|
| **Database** | MongoDB Atlas (free M0) | `mongodb+srv://...` |
| **Backend API** | Render Web Service | `https://soloflow-backend.onrender.com` |
| **Frontend SPA** | Cloudflare Pages | `https://soloflow.pages.dev` |

---

## Architecture

```
                          ┌──────────────────────────┐
                          │      MongoDB Atlas        │
                          │   (free M0, 512 MB)      │
                          └────────────▲─────────────┘
                                       │ MONGODB_URI
                                       │
┌──────────────────┐   /api/*   ┌──────┴──────────────┐
│  Cloudflare      │ ─────────▶│     Render           │
│  Pages           │           │  (NestJS + Node)     │
│  (React SPA)     │◀──────────│  free / $7-mo tier   │
└──────────────────┘   JSON    └──────────────────────┘
  soloflow.pages.dev              soloflow-backend.onrender.com
```

---

## Prerequisites

- A **GitHub** account (to connect both Render and Cloudflare)
- A **MongoDB Atlas** account (free tier)
- A **Render** account (free or paid)
- A **Cloudflare** account (free tier)
- **Node.js 18+** installed locally (for building and testing)

---

## Step 1 — MongoDB Atlas (Database)

### 1.1 Create a free cluster

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and sign up / log in.
2. Click **"Build a Database"**.
3. Select the **FREE M0** tier.
4. Choose a cloud provider and region — **pick US East** (close to Render's US region).
5. Click **"Create"**.

### 1.2 Create a database user

1. In the left sidebar, go to **Security → Database Access**.
2. Click **"Add New Database User"**.
3. Choose **Password** authentication.
4. Set a username (e.g. `soloflow-prod`) and a **strong password** — save it somewhere safe.
5. Under **Database User Privileges**, select **"Read and write to any database"**.
6. Click **"Add User"**.

### 1.3 Allow network access

1. Go to **Security → Network Access**.
2. Click **"Add IP Address"**.
3. Enter `0.0.0.0/0` (allow from anywhere — Render's IPs are dynamic).
4. Click **"Confirm"**.

### 1.4 Get the connection string

1. Go to **Deployment → Database**.
2. Click **"Connect"** on your cluster.
3. Choose **"Connect your application"**.
4. Select **Node.js** and version **5.0 or later**.
5. Copy the connection string. It looks like:

```
mongodb+srv://soloflow-prod:<password>@cluster0.xxxxx.mongodb.net/soloflow?retryWrites=true&w=majority
```

> **Replace** `<password>` with your actual database user password.
> **Save this string** — you'll need it in Step 2.

---

## Step 2 — Render (Backend API)

### 2.1 Create a Web Service

1. Go to [render.com](https://render.com) and sign up / log in.
2. Click **"New +"** → **"Web Service"**.
3. Click **"Connect a repository"** and authorize GitHub.
4. Select your **SoloFlow repository**.

### 2.2 Configure the service

Fill in these settings:

| Field | Value |
|-------|-------|
| **Name** | `soloflow-backend` |
| **Region** | US East (Ohio) — or closest to your Atlas region |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free (or Starter $7/mo for always-on) |

### 2.3 Add environment variables

Click **"Advanced"** → **"Add Environment Variable"** and add each one:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Enables production mode |
| `PORT` | `10000` | Render injects its own port; this is a fallback |
| `MONGODB_URI` | `mongodb+srv://...` | Your Atlas connection string from Step 1.4 |
| `JWT_SECRET` | `<generate locally>` | See below |
| `FRONTEND_URL` | `https://soloflow.pages.dev` | CORS allowlist — update after Step 3 |
| `GEMINI_API_KEY` | *(optional)* | For AI features; leave blank to disable |
| `STARTER_AI_PROPOSAL_LIMIT` | `3` | Daily AI proposal limit (Starter plan) |
| `PRO_AI_PROPOSAL_LIMIT` | `20` | Daily AI proposal limit (Pro plan) |

#### Generating a JWT_SECRET

Run this locally to generate a secure secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and paste it as the `JWT_SECRET` value.

### 2.4 Deploy

1. Click **"Create Web Service"**.
2. Render will clone your repo, install dependencies, build, and start the server.
3. Wait for the deploy to succeed — you'll see a **"Live"** badge.
4. Your backend is now running at:

```
https://soloflow-backend.onrender.com
```

5. Verify it works by visiting:

```
https://soloflow-backend.onrender.com/api
```

> **Note:** The free tier sleeps after 15 minutes of inactivity. The first request
> after sleep takes ~30 seconds to wake up. Upgrade to Starter ($7/mo) to keep it
> always on.

---

## Step 3 — Cloudflare Pages (Frontend SPA)

### 3.1 Create a Pages project

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and sign up / log in.
2. In the left sidebar, click **"Workers & Pages"**.
3. Click **"Create"** → **"Pages"** tab → **"Connect to Git"**.
4. Authorize GitHub and select your **SoloFlow repository**.

### 3.2 Configure the build

| Field | Value |
|-------|-------|
| **Project name** | `soloflow` |
| **Production branch** | `main` |
| **Framework preset** | None (or Vite) |
| **Build command** | `npm install && npm run build` |
| **Build output directory** | `frontend/dist` |
| **Root directory** | `/` (project root, not `frontend/`) |

> **Important:** The root directory must be `/` (the repo root), not `frontend/`.
> The build command runs from the root, so `npm install` installs root dependencies
> and `npm run build` runs the Vite build in the `frontend/` directory.

### 3.3 Add environment variables

Before deploying, click **"Environment variables"** and add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://soloflow-backend.onrender.com/api` |

> This tells the frontend where to send API requests in production.
> In local development, it falls back to `/api` (proxied by Vite).

### 3.4 Deploy

1. Click **"Save and Deploy"**.
2. Cloudflare will build and deploy your SPA.
3. Once live, you'll get a URL like:

```
https://soloflow.pages.dev
```

### 3.5 Verify SPA routing works

Navigate to `https://soloflow.pages.dev/dashboard` in your browser.
It should load the app (not show a 404). This works because of the
`_redirects` file in `frontend/public/`:

```
/*  /index.html  200
```

---

## Step 4 — Final Wiring

### 4.1 Update Render's CORS

Go back to your Render dashboard → **Environment** → add or update:

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | `https://soloflow.pages.dev` |

This allows the backend to accept CORS requests from your Cloudflare Pages domain.

### 4.2 Seed demo data (optional)

To populate the database with demo data, run locally:

```bash
cd backend
MONGODB_URI="mongodb+srv://soloflow-prod:<password>@cluster0.xxxxx.mongodb.net/soloflow?retryWrites=true&w=majority" \
JWT_SECRET="your-jwt-secret" \
npm run seed
```

This creates a demo user (`demo@soloflow.com` / `demo123`) with sample clients,
projects, and invoices.

### 4.3 Test the full flow

1. Visit `https://soloflow.pages.dev`
2. Click **"Launch Demo"** or register a new account
3. Verify the dashboard loads with data from the API
4. Create a client, project, and invoice to confirm CRUD works

---

## Environment Variables Reference

### Backend (Render)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `development` | Set to `production` |
| `PORT` | No | `3001` | Server port (Render injects its own) |
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/soloflow` | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | *(insecure default)* | Secret for signing JWT tokens |
| `FRONTEND_URL` | No | — | Allowed CORS origin for production frontend |
| `GEMINI_API_KEY` | No | — | Google Gemini API key for AI features |
| `STARTER_AI_PROPOSAL_LIMIT` | No | `3` | Daily AI proposal limit (Starter plan) |
| `PRO_AI_PROPOSAL_LIMIT` | No | `20` | Daily AI proposal limit (Pro plan) |
| `AI_USAGE_TIMEZONE` | No | `UTC` | IANA timezone for AI usage day boundary |

### Frontend (Cloudflare Pages)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | `/api` | Full URL to backend API (e.g. `https://soloflow-backend.onrender.com/api`) |

---

## Troubleshooting

### "CORS error" in the browser console

- Make sure `FRONTEND_URL` is set on Render and matches your Cloudflare Pages URL exactly (including `https://`).
- Make sure the backend has redeployed after changing environment variables.

### Backend won't start on Render

- Check the **Logs** tab in Render for errors.
- Common cause: `MONGODB_URI` is wrong or the Atlas network access doesn't allow `0.0.0.0/0`.
- Common cause: `JWT_SECRET` is missing — the app needs it to start.

### Frontend shows 404 on page refresh

- Make sure `frontend/public/_redirects` exists with `/*  /index.html  200`.
- Redeploy on Cloudflare Pages.

### API calls return 401 Unauthorized

- The JWT token may have expired. Log out and log back in.
- Make sure `JWT_SECRET` is set and hasn't changed between deploys (changing it invalidates all existing tokens).

### Render free tier sleeps and first request is slow

- This is expected behavior. The first request after 15 minutes of inactivity takes ~30s to wake the server.
- Upgrade to **Starter** ($7/mo) on Render for always-on hosting.

### Build fails on Cloudflare Pages

- Make sure the **Root Directory** is `/` (not `frontend/`).
- Make sure the **Build output directory** is `frontend/dist`.
- Check the deploy logs for the specific error.

---

## Cost Summary

| Service | Tier | Cost |
|---------|------|------|
| MongoDB Atlas | M0 Free | **$0/mo** |
| Render | Free | **$0/mo** (sleeps after 15 min) |
| Render | Starter | **$7/mo** (always on) |
| Cloudflare Pages | Free | **$0/mo** (unlimited bandwidth) |
| **Total (free)** | | **$0/mo** |
| **Total (paid)** | | **$7/mo** |

---

## Files Modified for Production Readiness

| File | Purpose |
|------|---------|
| `backend/src/main.ts` | CORS reads `FRONTEND_URL` env var for production |
| `frontend/src/services/api.ts` | `API_BASE` reads `VITE_API_URL` env var |
| `frontend/index.html` | Fixed favicon path (`/logo.svg` instead of `/public/logo.svg`) |
| `frontend/public/_redirects` | SPA catch-all routing for Cloudflare Pages |
| `frontend/public/_headers` | Security headers + asset caching |
| `.env.example` | Documented `FRONTEND_URL` variable |
