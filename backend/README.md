# EarlyJobs – Backend

Express + MongoDB (Mongoose) REST API for the EarlyJobs ATS dashboard. JWT auth, zod validation, ES modules.

## 1. Install

```bash
cd backend
npm install
```

You need Node 18+ and a running MongoDB (local `mongod` or a MongoDB Atlas connection string).

## 2. Configure

Copy the template and edit it:

```bash
cp .env.example .env      # Windows cmd: copy .env.example .env
```

| Variable | Purpose |
|---|---|
| `PORT` | API port (default `5000`) |
| `MONGO_URI` | e.g. `mongodb://127.0.0.1:27017/earlyjobs` |
| `JWT_SECRET` | long random string used to sign tokens (**required**) |
| `JWT_EXPIRES_IN` | token lifetime, e.g. `7d` |
| `CLIENT_URL` | allowed CORS origin(s), comma separated (default `http://localhost:5173`) |
| `NODE_ENV` | `development` or `production` |

## 3. Seed demo data

```bash
npm run seed          # adds anything missing (safe to run twice)
npm run seed:reset    # wipes every collection, then reseeds
```

Creates default settings (stages, sources, integrations), 3 users, 8 jobs, 48 candidates, 15 interviews and a few notifications.

**Demo login:** `abhishek.ybit@gmail.com` / `password123`
(also `sneha.verma@earlyjobs.com` – Hiring Manager, `rahul.mehra@earlyjobs.com` – Admin, same password)

## 4. Run

```bash
npm run dev      # nodemon, restarts on change
npm start        # plain node
```

API: `http://localhost:5000/api` · health check: `GET /api/health` → `{ "status": "ok" }`

To use it from the frontend set `VITE_USE_MOCK=false` in `frontend/.env` and restart `npm run dev` there (Vite proxies `/api` → `http://localhost:5000`).

## Conventions

- Everything lives under `/api`. Send `Authorization: Bearer <token>` on every route except `POST /api/auth/login` and `GET /api/health`.
- Errors are always `{ "message": "…" }` with a proper status (400 validation, 401, 404, 409 conflict, 500).
- Paginated lists return `{ data, total, page, pages, limit, ...extras }` (`limit` max 5000).
- Documents expose `_id`; dates are ISO strings.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/login` | `{ email, password }` → `{ token, user }` (10 failed tries / 15 min) |
| GET | `/auth/me` | `{ user }` |
| POST | `/auth/change-password` | `{ currentPassword, newPassword }` (min 8 chars) |
| GET | `/dashboard` | stats + trends, pipeline donut, 6-month chart, upcoming interviews, recent candidates, top jobs |
| GET | `/candidates` | `search, stage, jobId, source, sort (name\|job\|stage\|appliedOn), order, page, limit` → also returns `counts` |
| POST | `/candidates` | `{ name, email, jobId, … }` |
| GET / PUT / DELETE | `/candidates/:id` | delete also removes the candidate's interviews |
| PATCH | `/candidates/:id/stage` | `{ stage }` |
| POST | `/candidates/:id/notes` | `{ text }` |
| GET | `/jobs` | `search, department, status, page, limit` → also returns `counts` |
| POST | `/jobs` | auto-generates `JD-001`, `JD-002`, … |
| GET / PUT / DELETE | `/jobs/:id` | delete returns 409 while the job still has candidates |
| GET | `/interviews` | `from, to, candidateId, jobId, type, search` → `{ data, total }` |
| GET | `/interviews/stats` | `{ totalScheduled, today, completed, pending, trends }` |
| POST | `/interviews` | `{ candidateId, start, end, type, location, interviewers[] }` |
| PUT / DELETE | `/interviews/:id` | update used for reschedule, feedback `{ rating, text }` and notes |
| PATCH | `/interviews/:id/status` | `{ status }` |
| GET | `/notifications` | `{ data (latest 20), unread }` |
| POST | `/notifications/read` | mark all read |
| GET | `/settings` | profile, company, stages, sources, users, notifications, integrations |
| PUT | `/settings/profile` · `/settings/company` · `/settings/notifications` | |
| PUT | `/settings/integrations/:key` | `{ connected }` |
| POST / DELETE | `/settings/users` · `/settings/users/:id` | new users get a random temporary password printed in the **server console** |
| POST / PUT / DELETE | `/settings/stages` · `/settings/stages/:id` | core stages (Applied, Hired, Rejected) are locked; renames cascade to candidates |
| PUT | `/settings/stages/reorder` | `{ ids }` → full list |
| POST / PUT / DELETE | `/settings/sources` · `/settings/sources/:id` | same rules (no locked sources) |
| PUT | `/settings/sources/reorder` | `{ ids }` → full list |

## Structure

```
src/
  server.js  app.js
  config/       db.js · defaults.js
  models/       User · Settings · Job · Candidate · Interview · Notification
  controllers/  auth · dashboard · candidates · jobs · interviews · notifications · settings
  routes/       one file per controller + index.js (mounted at /api)
  middleware/   auth.js (JWT) · error.js (404 + central handler) · validate.js (zod)
  utils/        ApiError · asyncHandler · pagination · activity · notify · escapeRegex · serializers · stats · objectId
  seed/         seed.js
```
