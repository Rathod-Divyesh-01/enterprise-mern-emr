# Enterprise EMR (development starter)

A JavaScript MERN starter with Vite/React, Express, MongoDB/Mongoose, role-based login, appointment scheduling, patient records, clinical notes, and a Super Admin account-management screen. **Use synthetic data only.** This starter has not been assessed for HIPAA, GDPR, or any other compliance regime and is not suitable for production clinical use without independent security, privacy, clinical, and legal review.

## Prerequisites

- Node.js 20+ and npm
- MongoDB running locally, or Docker Desktop with the Compose Mongo service

## Configure local environment

The server loads `server/.env`; create it from `server/.env.example` if it does not exist. Set unique random values for both JWT secrets. Do not share or commit `.env` files.

For local MongoDB, use `MONGO_URI=mongodb://127.0.0.1:27017/emr_db`. To start the included local database with Docker, run `docker compose up -d mongodb` from this folder. The root `.env.example` is for Docker Compose; copy it to root `.env` and set both JWT secrets before starting the full container stack.

## Install and run (development)

From the repository root:

```powershell
npm install
npm install --prefix client
npm install --prefix server
npm run seed
npm run dev
```

Start the MongoDB service before `npm run seed`. Seeding is disabled when `NODE_ENV=production`; it creates/updates only the three named demo accounts and does not clear collections.

- Frontend: `http://localhost:5173`
- API: `http://localhost:5000/api/v1`
- Health check: `http://localhost:5000/health`

`npm run dev` runs both Vite and the API. You can also run `npm run dev:client` or `npm run dev:server` separately. Vite proxies `/api` to port 5000.

## Development demo accounts

After a successful seed, sign in with the requested development credentials:

| Role         | Email                  | Password          |
| ------------ | ---------------------- | ----------------- |
| Super Admin  | `admin@emr.com`        | `Super123`        |
| Receptionist | `receptionist@emr.com` | `receptionist123` |
| Doctor       | `doctor@emr.com`       | `Doctor123`       |

Never reuse these credentials outside an isolated local development environment. Passwords are hashed by the User model before storage.

## Scripts

- `npm run dev` — frontend and backend development servers
- `npm run build` — production frontend bundle check
- `npm test` — API health and authorization tests (no database deletion)
- `npm run seed` — development-only demo accounts and sample doctor profile
- `docker compose up -d mongodb` — local MongoDB only
- `docker compose up --build` — complete containerized stack (requires root `.env` JWT secrets)

## Current workflows

- All roles: login, dashboard, and appointment list filtered to assigned doctor for doctor accounts.
- Super Admin: create/manage accounts and roles, create doctor profiles/schedule, view system aggregates, access patient records, and schedule appointments.
- Receptionist: register/search/view patients and schedule/cancel appointments.
- Doctor: view assigned appointments and authorized patient records; create notes linked to their own appointment.

Patient and clinical data in this starter are not encrypted at the application layer and must remain synthetic.
