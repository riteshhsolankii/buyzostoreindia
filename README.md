# Buyzo

A dark-themed Next.js storefront with two portals sharing one product catalog, backed by a local **SQLite** database.

- **Admin portal** (`/admin`) — dashboard with inventory stats and stock alerts, plus full product and category management (create, edit, delete).
- **Customer portal** (`/shop`) — browse the catalog with search and category filters, view product details, sign up / sign in (with phone OTP), manage a profile + address book and a wishlist, and check out a cart.

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (dark theme via design tokens in `src/app/globals.css`)
- **SQLite** via [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) — a real relational database stored in `data/buyzo.db`
- REST API routes under `src/app/api/*` reading and writing through the data layer in `src/lib/`

## Prerequisites

| Requirement | Version | Notes |
| --- | --- | --- |
| **Node.js** | **≥ 24** (developed on 26) | Enforced by the `engines` field in `package.json`. Check with `node --version`. |
| **npm** | ships with Node | Or use `pnpm` / `yarn` if you prefer. |
| **Git** | any | To clone the repo. |

> **About `better-sqlite3`:** it is a native (C++) module. `npm install` downloads a prebuilt binary for common platforms (Windows / macOS / Linux on current Node versions), so **no compiler is normally needed**. If a prebuilt binary is unavailable for your platform, npm falls back to compiling from source, which requires build tools:
> - **Windows:** the "Desktop development with C++" workload (Visual Studio Build Tools) + Python 3.
> - **macOS:** Xcode Command Line Tools (`xcode-select --install`).
> - **Linux:** `build-essential` (gcc/g++/make) + Python 3.

## Getting started on a new machine

```bash
# 1. Clone and enter the project
git clone <your-repo-url> Buyzo
cd Buyzo

# 2. Install all dependencies (this also fetches the SQLite native binary)
npm install

# 3. Create your local environment file
cp .env.example .env.local
#   then open .env.local and set at least ADMIN_EMAIL and ADMIN_PASSWORD

# 4. Build the database: run migrations, then import the seed/legacy data
npm run db:setup

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and pick a portal. Sign in to the admin portal with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set in `.env.local`.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values you need. `.env.local` is git-ignored, so your secrets stay on your machine.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | recommended | SQLite file location as a `file:` URL. Defaults to `file:./data/buyzo.db` if unset. |
| `ADMIN_EMAIL` | yes | Email for the admin sign-in. |
| `ADMIN_PASSWORD` | yes | Password for the admin sign-in. |
| `ADMIN_SESSION_SECRET` | optional | Reserved for signing the admin session. |
| `CUSTOMER_SESSION_SECRET` | optional | Reserved for signing customer sessions. |
| `RESEND_API_KEY` | optional | Enables real transactional email via [Resend](https://resend.com). Without it, mail runs in demo mode (logged to the console + saved in the outbox table). |
| `MAIL_FROM` | optional | The `From` address for outgoing email when Resend is enabled. |

## Database

Buyzo uses a single local SQLite file (`data/buyzo.db`). The database is **not** committed to git — each machine builds its own from the migrations and seed data.

### npm scripts

| Script | What it does |
| --- | --- |
| `npm run db:migrate` | Applies any pending SQL migrations in `database/migrations/`. Safe to re-run — already-applied migrations are skipped (tracked in the `database_migrations` table). |
| `npm run db:import-legacy` | One-time import of the legacy JSON snapshot (`data/buyzo-db.json`) into SQLite. Refuses to run twice or over a non-empty database. |
| `npm run db:setup` | Convenience: runs `db:migrate` then `db:import-legacy`. |

### How it works

- **Schema** lives as plain SQL files in `database/migrations/`, applied in filename order:
  - `001_initial.sql` — core tables: `categories`, `products`, `customers`, `email_outbox`, `app_meta`.
  - `002_customer_profile.sql` — adds `avatar` and `addresses_json` columns to `customers`.
- **The app itself also applies migrations on startup** (`src/lib/database.ts`), so the database is always up to date when the server boots — the `db:migrate` script just lets you do it ahead of time.
- **Seeding:** on a fresh, empty database the app seeds a small demo catalog automatically. Running `db:import-legacy` instead loads the fuller snapshot from `data/buyzo-db.json`; the two are mutually exclusive (a seed marker in `app_meta` prevents double-seeding).

### Resetting the database

Delete the SQLite files and rebuild:

```bash
rm -f data/buyzo.db data/buyzo.db-shm data/buyzo.db-wal
npm run db:setup
```

## Project structure

```
database/
└── migrations/                  # Versioned SQL schema migrations
scripts/
├── migrate-database.mjs         # `db:migrate` — apply migrations
└── import-legacy-json.mjs       # `db:import-legacy` — import data/buyzo-db.json
src/
├── lib/
│   ├── database.ts              # SQLite connection + migration runner
│   ├── products.ts              # Product data access (+ demo seed)
│   ├── categories.ts            # Category data access
│   ├── customers.ts             # Customer accounts, sessions, addresses
│   ├── mailer.ts                # Email sending + outbox
│   ├── auth.ts / otp.ts         # Admin session + phone OTP
│   └── types.ts                 # Shared types + client-safe helpers
└── app/
    ├── page.tsx                 # Landing page (portal chooser)
    ├── api/                     # REST API routes
    ├── admin/                   # Admin portal: dashboard, products, categories
    └── shop/                    # Customer portal: catalog, detail, cart, account
```

## Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server on port 3000. |
| `npm run build` | Production build. |
| `npm run start` | Serve the production build. |
| `npm run lint` | Run ESLint. |
| `npm run db:migrate` | Apply database migrations. |
| `npm run db:import-legacy` | Import legacy JSON data into SQLite. |
| `npm run db:setup` | Migrate + import in one step. |

## Next steps

- Add authentication hardening (rate limiting, hashed admin credentials).
- Turn checkout into real order handling with an `orders` table.
- Wire the outbox up to a real email provider in production.
