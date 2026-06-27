# FinTrack

Modern full-stack personal finance dashboard built with React, TypeScript, Tailwind CSS, Recharts, React Query, Express, and JWT authentication.

## Features

- JWT signup/login flow
- Google sign-in option on the login screen
- Financial health dashboard with score, AI-style alerts, and analytics
- Expense tracking with filters, monthly summary, and category chart
- EMI and loan management with repayment progress and reminders
- Finance education hub with curated concepts and examples
- AI insights with budget, savings, and debt recommendations
- Editable profile and app settings
- Prisma + PostgreSQL persistence with Supabase-ready connection support

## Project Structure

```text
fintrack/
  client/        React + TypeScript frontend
  server/        Express API, Prisma schema, and generated client
  package.json   npm workspaces
```

## Environment Variables

### Server

Copy `server/.env.example` to `server/.env`.

```env
PORT=5001
HOST=127.0.0.1
JWT_SECRET=replace_this_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_oauth_web_client_id
DATABASE_URL=postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require&connect_timeout=15
DIRECT_URL=postgresql://postgres:YOUR_PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?sslmode=require&connect_timeout=15
PG_CONN_TIMEOUT_MS=15000
```

Optional client override:

```env
VITE_API_BASE_URL=http://127.0.0.1:5001/api
VITE_GOOGLE_CLIENT_ID=your_google_oauth_web_client_id
```

## Run Locally

```bash
npm install
npm run prisma:generate -w server
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:5001/api`
Database: Supabase PostgreSQL

If this is your first database run, add your Supabase connection strings to `server/.env` and apply the schema:

```bash
npm run prisma:migrate -w server -- --name init
```

## App Flow

1. Sign up with a name, email, and password, or use Google sign-in on the login page.
2. Start with your own empty account data and add expenses, financial items, profile details, and settings as needed.
3. Explore dashboard analytics, AI insights, education cards, and profile/settings updates with data persisted through Prisma + PostgreSQL.

## API Endpoints

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/dashboard`
- `GET /api/expenses`
- `POST /api/expenses`
- `GET /api/loans`
- `POST /api/loans`
- `GET /api/education`
- `GET /api/insights`
- `GET /api/profile`
- `PUT /api/profile`
- `GET /api/settings`
- `PUT /api/settings`

## Notes

- PostgreSQL is configured through Prisma in `server/prisma/schema.prisma`.
- Prisma CLI uses `DIRECT_URL`, while the app runtime uses the pooled `DATABASE_URL` through Prisma's PostgreSQL adapter.
- Supabase works well here because it gives a managed PostgreSQL database without needing local Docker/Postgres.
- The server reads and writes through the Prisma-backed store layer in `server/src/store/dataStore.js`.
- The frontend uses React Query and React Router.
- Settings include theme, currency, notifications, budget alerts, and CSV/PDF export placeholders.
