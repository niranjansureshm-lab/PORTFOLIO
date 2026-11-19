# Niranjan Suresh — Full-Stack Portfolio
React (CDN) frontend · Node/Express API · PostgreSQL · JWT auth · RBAC (admin / editor / viewer)

```
portfolio-fullstack/
├── client/public/
│   ├── index.html        ← your portfolio (loads content from the database)
│   └── admin.html        ← admin dashboard  (/admin)
└── server/
    ├── .env.example      ← copy to .env and edit
    ├── db/
    │   ├── schema.sql    ← tables
    │   ├── seedData.js   ← roles, permissions, initial content
    │   └── setup.js      ← creates DB + tables + seed + first admin
    └── src/              ← Express app (routes, RBAC middleware)
```

## Run it (4 steps)
1. Install **Node.js 18+** and **PostgreSQL 14+**; make sure PostgreSQL is running.
2. `cd server` → `npm install`
3. Copy `.env.example` to `.env` and set `DB_PASSWORD` (your postgres password) and a long random `JWT_SECRET`.
   (If you skip this, `.env` is already pre-filled with defaults — just fix DB_PASSWORD.)
4. `npm run db:setup`   (creates the database, tables, roles, sample content, admin user)
   then `npm start`

Open **http://localhost:5000** (portfolio) and **http://localhost:5000/admin** (dashboard).

First login: `admin@portfolio.local` / `Admin@12345` (set in `.env`) — **change it** from the dashboard (Password button).
`npm run db:reset` wipes everything and starts fresh.

## RBAC
| Permission                     | admin | editor | viewer |
|--------------------------------|:----:|:-----:|:-----:|
| View dashboard / all content   |  ✔  |  ✔   |  ✔   |
| Create/edit/delete projects, skills, experience, certifications | ✔ | ✔ | ✖ |
| Read messages                  |  ✔  |  ✔   |  ✔   |
| Mark/delete messages           |  ✔  |  ✔   |  ✖   |
| Manage users & roles           |  ✔  |  ✖   |  ✖   |

Permissions live in the `permissions` / `role_permissions` tables and are checked on **every request** by
`server/src/middleware/auth.js` (`authorize('projects:write')`). Changing a role or disabling a user takes effect immediately.
Public self-registration (`POST /api/auth/register`) only creates **viewer** accounts.

## API
Public: `GET /api/portfolio` · `POST /api/contact` · `GET /api/health`
Auth: `POST /api/auth/login` · `POST /api/auth/register` · `GET /api/auth/me` · `PUT /api/auth/password`
Admin (Bearer token): `/api/admin/{projects|skills|experiences|certifications}` (GET/POST/PUT/DELETE),
`/api/admin/messages`, `/api/admin/users`, `/api/admin/roles`, `/api/admin/stats`

## Deploy notes
Set `NODE_ENV=production`, a strong `JWT_SECRET`, a new admin password, and serve behind HTTPS (Render, Railway, VPS…).
Any managed PostgreSQL works — just change the `DB_*` values.

## Troubleshooting
- `ECONNREFUSED` → PostgreSQL isn't running or wrong `DB_PORT`.
- `password authentication failed` → fix `DB_PASSWORD` in `server/.env`.
- Open the site through `http://localhost:5000`, **not** by double-clicking index.html (the API wouldn't be reachable; the site then falls back to built-in content).
