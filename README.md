# ATS Resume Management System

A production-ready application for recruiting teams: each recruiter has a dedicated folder in
Microsoft OneDrive, uploads candidate resumes (PDF) there weekly, and this system automatically
syncs, processes, and visualizes that activity — no manual tracking required.

- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS, React Router, React Query, Recharts
- **Backend:** Node.js + Express + Prisma ORM + SQLite (default, SQL Server-ready)
- **Auth:** JWT access + refresh tokens, bcrypt password hashing, admin-only login
- **Integration:** Microsoft Graph API (app-only / client-credentials flow) for OneDrive
- **Infra:** Docker Compose, persistent SQLite volume, nginx-served frontend with API proxy

---

## 1. Quick Start (Docker)

```bash
git clone <this-repo>
cd ats-resume-system
cp backend/.env.example backend/.env   # fill in Microsoft Graph credentials (see §4)
docker compose up --build
```

- Frontend: **http://localhost:8080**
- Backend API: **http://localhost:4000/api**

The first boot will:
1. Push the Prisma schema to a fresh SQLite database (persisted in the `ats_db_data` volume)
2. Seed the admin user from `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `.env` (default `admin` / `admin@123`)
3. Start the API and the 15-minute background OneDrive sync job

**Change the default admin password immediately after first login** (via Settings, or by
updating `ADMIN_PASSWORD` and re-seeding before going to production).

---

## 2. What you get out of the box

- **Public landing dashboard** (no login) — total recruiters, resumes, processed/pending counts,
  today/week/month uploads, last sync time, recently active recruiters, and a live bar chart.
- **Admin dashboard** — the same stats plus storage used, success rate, top recruiter, average
  uploads, a monthly trend line chart, a processing-status pie chart, and a recruiter comparison
  bar chart, dark/light mode, responsive sidebar + topbar.
- **Recruiters module** — full CRUD, search, status filter, pagination, per-recruiter manual sync.
- **Resumes module** — searchable/filterable/paginated table, OneDrive link, download link, CSV
  and Excel export.
- **Settings page** — Microsoft Graph credentials, sync interval, "Test Connection" button.
- **Logs viewer** — sync / error / auth / download / duplicate-detection events.
- **Reports** — recruiter / weekly / monthly / yearly reports as Excel or PDF.
- **Background sync service** — polls OneDrive every N minutes (configurable), detects new,
  modified, and deleted files, and flags duplicates by content hash.
- **Security** — JWT + refresh tokens, bcrypt, helmet, rate limiting, CORS, input validation.

---

## 3. Local development (without Docker)

### Backend
```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma db push        # creates ./data/ats.db
npm run seed               # creates the admin user
npm run dev                 # http://localhost:4000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173, proxies /api to :4000
```

---

## 4. Microsoft Graph / Azure App Registration setup

The sync engine uses **app-only (client-credentials) Graph access**, so it can read every
recruiter's folder without any per-user sign-in.

1. Go to **Azure Portal → Azure Active Directory → App registrations → New registration**.
   - Name: `ATS Resume Sync` (or anything)
   - Supported account types: *Single tenant* is fine
2. Under **Certificates & secrets**, create a new **Client secret**. Copy its value immediately
   (it's only shown once) — this is `MS_CLIENT_SECRET`.
3. Under **API permissions → Add a permission → Microsoft Graph → Application permissions**, add:
   - `Files.Read.All` (or `Files.ReadWrite.All` if you want future write-back features)
   - `Sites.Read.All` if the OneDrive is backed by a SharePoint site
   - Click **Grant admin consent** for your tenant.
4. Note down:
   - **Directory (tenant) ID** → `MS_TENANT_ID`
   - **Application (client) ID** → `MS_CLIENT_ID`
5. Find your **Drive ID**:
   - For a user's OneDrive: `GET https://graph.microsoft.com/v1.0/users/{user-id}/drive` and copy `id`
   - For a SharePoint document library: `GET https://graph.microsoft.com/v1.0/sites/{site-id}/drive`
   - This is `MS_DRIVE_ID`.
6. Confirm the **parent folder** name that contains all recruiter sub-folders (e.g. `Recruiters`,
   containing `Recruiters/Ajay`, `Recruiters/Shiva`, etc.) → `MS_PARENT_FOLDER`.

Enter all five values either in `backend/.env` before starting Docker, or later via the in-app
**Settings** page (saved to the database and applied immediately — no restart needed). Use
**Test Connection** on the Settings page to verify.

Each **Recruiter** record you create in the app must have an `oneDriveFolderName` that matches
their actual sub-folder name exactly (case-insensitive) under `MS_PARENT_FOLDER`.

---

## 5. Environment variables (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | API port | `4000` |
| `CORS_ORIGIN` | Allowed origin(s) for the API | `*` |
| `DATABASE_URL` | Prisma connection string | `file:./data/ats.db` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Rotate these before production | — |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token lifetimes | `15m` / `7d` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Seeded on first boot only | `admin` / `admin@123` |
| `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, `MS_DRIVE_ID`, `MS_PARENT_FOLDER` | Graph credentials | — |
| `SYNC_INTERVAL_MINUTES` | Background sync frequency | `15` |

---

## 6. Migrating from SQLite to SQL Server

1. In `backend/prisma/schema.prisma`, change:
   ```prisma
   datasource db {
     provider = "sqlserver"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL="sqlserver://HOST:1433;database=ats;user=sa;password=YourPassword;trustServerCertificate=true"
   ```
3. Regenerate the client and push the schema:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
4. If you'd rather use versioned migrations instead of `db push`, run
   `npx prisma migrate dev --name init` once you're on your target database.

---

## 7. API surface (all under `/api`, JWT-protected unless noted)

| Endpoint | Notes |
|---|---|
| `POST /auth/login`, `/auth/refresh`, `/auth/logout` | — |
| `GET /dashboard/public` | **No auth** — powers the landing page |
| `GET /dashboard/admin` | Full stats + chart data |
| `GET/POST/PUT/DELETE /recruiters[/:id]` | CRUD, `?search=&status=&page=&pageSize=&sortBy=&sortDir=` |
| `GET /resumes` | `?search=&status=&recruiterId=&page=&pageSize=` |
| `GET /resumes/export/csv` \| `/export/excel` | Filtered export |
| `POST /sync/all`, `POST /sync/:id`, `GET /sync/status` | Manual sync triggers |
| `GET/PUT /settings`, `POST /settings/test-connection` | Graph credentials |
| `GET /logs` | `?type=Sync\|Error\|Auth\|Download\|Duplicate` |
| `GET /reports/excel`, `/reports/pdf` | `?period=weekly\|monthly\|yearly` |
| `GET /health` | Liveness check (no auth) |

---

## 8. Project structure

```
ats-resume-system/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma        # Admin, Recruiter, Resume, SyncLog, AppSetting, RefreshToken
│   │   └── seed.js
│   └── src/
│       ├── config/db.js         # Prisma client singleton
│       ├── controllers/         # request handlers per module
│       ├── routes/              # Express routers per module
│       ├── middleware/          # auth guard, error handler
│       ├── services/            # graphService, syncService, scheduler, resumeProcessor
│       └── utils/                # jwt, logger
└── frontend/
    ├── Dockerfile
    ├── nginx.conf                # serves the SPA + proxies /api to the backend
    └── src/
        ├── pages/                 # LandingPage, LoginPage, DashboardPage, RecruitersPage, ...
        ├── components/layout/     # Sidebar, Topbar, AdminLayout
        ├── components/ui/         # StatCard, CountUp
        ├── hooks/                 # useAuth, useTheme
        └── services/               # axios client + typed endpoint functions
```

---

## 9. Troubleshooting

- **"Microsoft Graph credentials are not configured"** — fill in Settings or `.env`, then
  **Test Connection**.
- **A recruiter never syncs / "OneDrive folder not found"** — the `oneDriveFolderName` on the
  recruiter record must exactly match (case-insensitive) a sub-folder name directly under
  `MS_PARENT_FOLDER` in the configured Drive.
- **Prisma engine download fails during `docker compose build`** — this happens only in fully
  offline/sandboxed build environments; a normal internet connection resolves it.
- **Port already in use** — change the host-side ports in `docker-compose.yml` (`"8080:80"`,
  `"4000:4000"`).
- **Reset the database** — `docker compose down -v` removes the `ats_db_data` volume; the next
  `docker compose up` starts fresh and re-seeds the admin user.

---

## 10. Deployment notes

- Put the frontend behind HTTPS (e.g. a reverse proxy / load balancer terminating TLS in front of
  the `frontend` container) and set `CORS_ORIGIN` to that exact origin.
- Rotate `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` and the seeded admin password before go-live.
- For horizontal scaling of the API, move off SQLite to SQL Server (§6) since SQLite is a
  single-writer file database.
