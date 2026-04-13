# FinTrack — Full Tech Stack

## 🖥️ Frontend (Client)

| Category | Technology | Version |
|---|---|---|
| Framework | **React** | ^18.3.1 |
| Language | **TypeScript** | ^5.6.3 |
| Build Tool | **Vite** | ^5.4.8 |
| Routing | **React Router DOM** | ^6.27.0 |
| Data Fetching & Caching | **TanStack React Query** | ^5.59.0 |
| HTTP Client | **Axios** | ^1.7.7 |
| Charts & Visualization | **Recharts** | ^2.13.0 |
| Styling | **Tailwind CSS** | ^3.4.13 |
| Icons | **Lucide React** | ^0.453.0 |
| Date Utilities | **date-fns** | ^4.1.0 |
| Class Utilities | **clsx** | ^2.1.1 |
| PostCSS | **Autoprefixer + PostCSS** | ^10.4.20 / ^8.4.47 |

### Key Client Patterns
- **Context API** — `NotificationsContext`, auth state, theme management
- **Custom Hooks** — data fetching and business logic hooks in `/hooks`
- **Pages** — `ExpensesPage`, `FinanceDiaryPage`, and others in `/pages`
- **API Layer** — centralized Axios calls in `/api`
- **Lib Layer** — shared utilities in `/lib`

---

## ⚙️ Backend (Server)

| Category | Technology | Version |
|---|---|---|
| Runtime | **Node.js** | (ESM modules) |
| Framework | **Express.js** | ^4.19.2 |
| Language | **JavaScript (ESM)** | — |
| Logging | **Morgan** | ^1.10.0 |
| CORS | **cors** | ^2.8.5 |
| Environment Variables | **dotenv** | ^16.4.5 |

### Server Architecture
- **MVC-style** — `controllers/`, `routes/`, `models/`, `middleware/`
- **Data Store** — in-memory/persistent store at `src/store/dataStore.js`
- **Config** — centralized at `src/config/`
- **Utils** — helper functions at `src/utils/`
- **Seed** — database seeding scripts at `src/seed/`

---

## 🔐 Authentication & Security

| Category | Technology | Version |
|---|---|---|
| Auth Strategy | **JWT (JSON Web Tokens)** | ^9.0.2 |
| OAuth | **Google Auth Library** | ^10.6.2 |
| Password Hashing | **bcryptjs** | ^2.4.3 |

---

## 🗄️ Database & ORM

| Category | Technology | Version |
|---|---|---|
| Database | **PostgreSQL 16** | (via Docker) |
| ORM | **Prisma** | ^7.5.0 |
| Prisma PG Adapter | **@prisma/adapter-pg** | ^7.5.0 |
| PG Driver | **pg** | ^8.20.0 |

### Database Models
| Model | Description |
|---|---|
| `User` | Auth, profile, income, savings goal, risk preference |
| `Expense` | Transactions with categories, members, custom splits, `isPaid` status |
| `Loan` | EMI tracking, interest rate, tenure, amountPaid, status |
| `Setting` | Per-user preferences — dark mode, currency, notifications |
| `RecurringPayment` | Bill reminders with frequency, autopay, next payment date |
| `FinanceDiary` | Group trip/diary tracking with members and shared expenses |

---

## 📄 File Processing & Parsing

| Category | Technology | Version |
|---|---|---|
| File Upload | **Multer** | ^1.4.5-lts.1 |
| OCR (Receipt Scanning) | **Tesseract.js** | ^5.1.0 |
| PDF Parsing | **pdf-parse** | ^1.1.1 |
| Excel/CSV Parsing | **xlsx** | ^0.18.5 |
| OFX (Bank Statement) | **ofx** | ^0.5.0 |

---

## 🐳 DevOps & Infrastructure

| Category | Technology |
|---|---|
| Containerization | **Docker** + **Docker Compose** |
| Database Container | `postgres:16-alpine` |
| Package Manager | **npm** (workspaces at root) |
| Monorepo Root | `package.json` with client + server as sub-packages |

---

## 🧰 Tooling & Config

| Tool | Purpose |
|---|---|
| `tsconfig.json` | TypeScript config (client) |
| `vite.config.ts` | Vite bundler config |
| `tailwind.config.ts` | Tailwind theme config |
| `postcss.config.js` | PostCSS pipeline |
| `prisma.config.ts` | Prisma datasource config |
| `docker-compose.yml` | Local Postgres dev environment |
| `.env` / `.env.example` | Environment variable management (both client & server) |

---

## 🏗️ Architecture Summary

```
FinTrack/
├── client/          → React + TypeScript + Vite (SPA)
├── server/          → Express.js + Node.js (REST API)
│   └── prisma/      → PostgreSQL schema & migrations
└── docker-compose.yml → Local Postgres database
```

**Pattern:** Full-stack Monorepo with a decoupled SPA frontend communicating with a REST API backend, backed by PostgreSQL via Prisma ORM.
