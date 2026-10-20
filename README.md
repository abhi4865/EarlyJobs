# EarlyJobs — Mini Applicant Tracking System (ATS)

A full-stack ATS dashboard to **manage candidates, move them through hiring stages, search/filter, schedule interviews, and track hiring metrics** — built with the MERN stack.

| | |
|---|---|
| 🌐 **Live App** | [https://earlyjobs-drab.vercel.app](https://earlyjobs-drab.vercel.app/) |
| 💻 **GitHub Repo** | [github.com/abhi4865/EarlyJobs](https://github.com/abhi4865/EarlyJobs) |
| 🔑 **Demo Login** | `abhishek.ybit@gmail.com` / `password123` |

> Other demo users (same password): `sneha.verma@earlyjobs.com` (Hiring Manager), `rahul.mehra@earlyjobs.com` (Admin)

---

## 1. Assignment Requirements → Where to Find Them

| Requirement | Implemented as | Where to look |
|---|---|---|
| Manage candidates | Full CRUD, notes, activity log, CSV export | **Candidates** page · `/api/candidates` |
| Hiring stages | Configurable stages, stage change via API/UI, locked core stages (Applied, Hired, Rejected) | **Pipeline** page · `PATCH /candidates/:id/stage` · **Settings → Stages** |
| Search | Debounced search + filters (stage, job, source) + sorting + pagination | Candidates page · Global search in header |
| Dashboard metrics | Stats with trends, pipeline donut, 6-month applications chart, upcoming interviews, recent candidates, top jobs | **Dashboard** page · `GET /dashboard` |

---

## 2. Features

**Authentication & Security**
- JWT login (`Bearer` token on every route except login/health)
- Login rate limit: 10 failed attempts / 15 minutes
- Change-password flow (min 8 characters)
- Request validation with **zod**; centralized error handler returning `{ "message": "…" }`

**Candidates**
- Create, view, edit, delete (deleting also removes the candidate's interviews)
- Search by text; filter by stage, job, source; sort by name / job / stage / applied date
- Per-stage counts returned with every list for instant tab badges
- Notes and an activity timeline per candidate

**Pipeline (Hiring Stages)**
- Move candidates between stages
- Stages and sources are editable, re-orderable; renaming a stage cascades to all candidates
- Core stages (Applied, Hired, Rejected) are locked; stages in use can't be deleted

**Jobs**
- CRUD with auto-generated IDs (`JD-001`, `JD-002`, …)
- Filter by department/status; each job shows its candidate count
- Safe delete: returns **409** while a job still has candidates

**Interviews**
- Schedule, reschedule, delete; types, location, multiple interviewers
- Status updates, feedback (rating + text) and notes
- Stats: total scheduled, today, completed, pending (with trends)

**Dashboard**
- KPI cards with trends, pipeline distribution donut, 6-month application chart, upcoming interviews, recent candidates, top jobs

**Settings & Notifications**
- Profile, company, notification preferences, integrations toggle, user management
- In-app notifications with unread count and "mark all read"

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS v4, React Router, Axios, Recharts, Sonner (toasts), Lucide icons |
| Backend | Node.js 18+, Express, Mongoose, JWT, zod (ES modules) |
| Database | MongoDB (local or Atlas) |

---

## 4. Quick Start (Run Locally)

**Prerequisites:** Node 18+, and MongoDB (local `mongod` or an Atlas connection string).

### Backend
```bash
cd backend
npm install
cp .env.example .env        # Windows cmd: copy .env.example .env
npm run seed                # load demo data
npm run dev                 # http://localhost:5000/api
```

| Variable | Purpose |
|---|---|
| `PORT` | API port (default `5000`) |
| `MONGO_URI` | e.g. `mongodb://127.0.0.1:27017/earlyjobs` |
| `JWT_SECRET` | Long random string for signing tokens (**required**) |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CLIENT_URL` | Allowed CORS origin(s), comma-separated (default `http://localhost:5173`) |
| `NODE_ENV` | `development` or `production` |

**Seed commands**
```bash
npm run seed         # adds anything missing (safe to run twice)
npm run seed:reset   # wipes every collection, then reseeds
```
Seed creates default settings (stages, sources, integrations), **3 users, 8 jobs, 48 candidates, 15 interviews** and sample notifications.

### Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```
`frontend/.env`
```
VITE_API_URL=/api
VITE_USE_MOCK=false         # true = built-in demo data, no backend needed
```
Vite proxies `/api` → `http://localhost:5000` (see `vite.config.js`). Restart `npm run dev` after changing `.env`.

> **Tip for evaluators:** set `VITE_USE_MOCK=true` to try the whole UI without MongoDB or the backend (login password: `password123`).

**Health check:** `GET /api/health` → `{ "status": "ok" }`

---

## 5. API Reference

Base path: `/api` · Auth: `Authorization: Bearer <token>`

**Conventions**
- Errors are always `{ "message": "…" }` with status 400 (validation), 401, 404, 409 (conflict), 500
- Paginated lists return `{ data, total, page, pages, limit, ...extras }` (`limit` max 5000)
- Documents expose `_id`; dates are ISO strings

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | `{ email, password }` → `{ token, user }` |
| GET | `/auth/me` | Current user |
| POST | `/auth/change-password` | `{ currentPassword, newPassword }` |

### Dashboard
| Method | Path | Description |
|---|---|---|
| GET | `/dashboard` | Stats + trends, pipeline donut, 6-month chart, upcoming interviews, recent candidates, top jobs |

### Candidates
| Method | Path | Description |
|---|---|---|
| GET | `/candidates` | Query: `search, stage, jobId, source, sort (name\|job\|stage\|appliedOn), order, page, limit` → also returns `counts` |
| POST | `/candidates` | `{ name, email, jobId, … }` |
| GET / PUT / DELETE | `/candidates/:id` | Delete also removes their interviews |
| PATCH | `/candidates/:id/stage` | `{ stage }` |
| POST | `/candidates/:id/notes` | `{ text }` |

### Jobs
| Method | Path | Description |
|---|---|---|
| GET | `/jobs` | Query: `search, department, status, page, limit` → also returns `counts` |
| POST | `/jobs` | Auto-generates `JD-001`, `JD-002`, … |
| GET / PUT / DELETE | `/jobs/:id` | Delete → 409 if job still has candidates |

### Interviews
| Method | Path | Description |
|---|---|---|
| GET | `/interviews` | Query: `from, to, candidateId, jobId, type, search` → `{ data, total }` |
| GET | `/interviews/stats` | `{ totalScheduled, today, completed, pending, trends }` |
| POST | `/interviews` | `{ candidateId, start, end, type, location, interviewers[] }` |
| PUT / DELETE | `/interviews/:id` | Reschedule, feedback `{ rating, text }`, notes |
| PATCH | `/interviews/:id/status` | `{ status }` |

### Notifications
| Method | Path | Description |
|---|---|---|
| GET | `/notifications` | `{ data (latest 20), unread }` |
| POST | `/notifications/read` | Mark all read |

### Settings
| Method | Path | Description |
|---|---|---|
| GET | `/settings` | Profile, company, stages, sources, users, notifications, integrations |
| PUT | `/settings/profile` · `/company` · `/notifications` | Update sections |
| PUT | `/settings/integrations/:key` | `{ connected }` |
| POST / DELETE | `/settings/users` · `/settings/users/:id` | New users get a random temporary password printed in the **server console** |
| POST / PUT / DELETE | `/settings/stages` · `/stages/:id` | Core stages locked; renames cascade to candidates |
| PUT | `/settings/stages/reorder` | `{ ids }` → full list |
| POST / PUT / DELETE | `/settings/sources` · `/sources/:id` | Same rules (no locked sources) |
| PUT | `/settings/sources/reorder` | `{ ids }` → full list |

---

## 6. Project Structure

```
earlyjobs/
├── backend/
│   └── src/
│       ├── server.js · app.js
│       ├── config/        db.js · defaults.js
│       ├── models/        User · Settings · Job · Candidate · Interview · Notification
│       ├── controllers/   auth · dashboard · candidates · jobs · interviews · notifications · settings
│       ├── routes/        one file per controller + index.js (mounted at /api)
│       ├── middleware/    auth (JWT) · error (404 + central handler) · validate (zod)
│       ├── utils/         ApiError · asyncHandler · pagination · activity · notify · serializers · stats …
│       └── seed/          seed.js
└── frontend/
    └── src/
        ├── api/           client.js (axios + interceptors) · services.js · mock/ (fake backend)
        ├── context/       AuthContext · SettingsContext
        ├── hooks/         useFetch · useDebounce · useMediaQuery
        ├── lib/           constants · format · csv · stageIcons · utils
        ├── components/    common/ · layout/ · candidates/ · jobs/ · interviews/
        └── pages/         Dashboard · Candidates · Jobs · Pipeline · Interviews · Settings · Login · NotFound
```

---

## 7. Design Decisions

- **Clean layering** — routes → controllers → models, with shared utilities, so each file has one job.
- **Validation at the edge** — zod schemas reject bad input before it reaches controllers.
- **Consistent API contract** — same error shape and pagination shape everywhere, which keeps the frontend simple.
- **Data integrity** — cascade deletes for interviews, 409 on deleting jobs with candidates, locked core stages, stage renames cascade.
- **Mock mode** — the frontend ships with a fake backend, so the UI can be reviewed instantly.
- **Reusable UI** — shared primitives (Button, Modal, Pagination, Badges…) live in `components/common`.

---

## 8. Known Limitations

- Resume / logo / photo upload is not included (needs file storage)
- Dark theme not included

---

## 9. Author

**Abhishek Yadav** — B.Tech IT, Ajay Kumar Garg Engineering College
Portfolio: https://abhishek-k2.vercel.app/ · GitHub: https://github.com/abhi4865