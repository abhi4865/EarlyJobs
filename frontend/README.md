# EarlyJobs – Frontend

React + Vite + Tailwind (v4) + React Router + Axios + Recharts + Sonner + Lucide.

## Run
```bash
npm i react-router-dom axios recharts sonner lucide-react clsx tailwind-merge
npm run dev
```
`.env`
```
VITE_API_URL=/api
VITE_USE_MOCK=true    # demo data, no backend needed (login password: password123)
```
Set `VITE_USE_MOCK=false` once the Express API is running (Vite proxies `/api` → `http://localhost:5000`, see `vite.config.js`).

## Structure
```
src/
  api/        client.js (axios + interceptors) · services.js (all endpoints) · mock/ (fake backend)
  context/    AuthContext · SettingsContext (stages, sources, users shared app-wide)
  hooks/      useFetch · useDebounce · useMediaQuery
  lib/        constants · format · csv · stageIcons · utils
  components/ common/ (Button, Fields, Modal, Popover, Pagination, Badges, States…)
              layout/ (Sidebar, Header, GlobalSearch, AppLayout)
              candidates/ jobs/ interviews/  (forms + detail panels)
  pages/      Dashboard · Candidates · Jobs · Pipeline · Interviews · Settings(+settings/) · Login · NotFound
```

## REST contract the backend should implement (all under `/api`, JWT `Authorization: Bearer`)
| Method | Path | Notes |
|---|---|---|
| POST | /auth/login | `{email,password}` → `{token,user}` |
| GET | /auth/me · POST /auth/change-password | |
| GET | /dashboard | `{stats{…,trends}, pipeline{stages[{name,color,count}],filledPercent,trend[{month,applications}]}, upcomingInterviews, recentCandidates, jobOpenings}` |
| GET | /candidates | query: `search,jobId,stage,source,sort,order,page,limit` → `{data,total,page,pages,counts{total,<Stage>:n}}` |
| POST/PUT/DELETE | /candidates, /candidates/:id | body uses `jobId`; responses populate `job:{_id,title}` |
| PATCH | /candidates/:id/stage | `{stage}` |
| POST | /candidates/:id/notes | `{text}` → candidate (with `notes[]`, `activity[]`) |
| GET/POST/PUT/DELETE | /jobs, /jobs/:id | list → `{data,total,pages,counts{total,Active,"On Hold",Closed}}`; each job has `candidateCount`; DELETE → 409 if it has candidates |
| GET | /interviews | query: `from,to,candidateId,jobId,type,search` → `{data}` (populate `candidate`,`job`) |
| GET | /interviews/stats | `{totalScheduled,today,completed,pending,trends{…}}` |
| POST/PUT/DELETE | /interviews, /interviews/:id | `{candidateId,start,end,type,location,interviewers[{name,role}],feedback{rating,text},notes}` |
| PATCH | /interviews/:id/status | `{status}` |
| GET / POST | /notifications · /notifications/read | `{data,unread}` |
| GET | /settings | `{profile,company,stages,sources,users,notifications,integrations}` |
| PUT | /settings/profile · /company · /notifications | |
| POST/PUT/DELETE | /settings/stages(/:id) · /settings/sources(/:id) · PUT …/reorder `{ids}` | stage delete/rename blocked while candidates use it; Applied/Hired/Rejected are `locked` |
| POST/DELETE | /settings/users(/:id) · PUT /settings/integrations/:key | |

Errors: respond with `{ "message": "human readable text" }` and a proper status code – the UI shows it in a toast/inline.

## Notes
- Your shadcn `components/ui` is untouched; shared primitives live in `components/common`.
- `src/index.css`: keep the file shadcn generated, just add the `@theme` font block and base rules from this one.
- Not included (needs backend/storage): resume + logo/photo upload, dark theme.
