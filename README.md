# Buyzo

A dark-themed Next.js storefront with two portals sharing one product catalog, backed by a **libSQL/SQLite** database — a local file in development, hosted [Turso](https://turso.tech) in production.

- **Admin portal** (`/admin`) — dashboard with inventory stats and stock alerts, plus full product and category management (create, edit, delete).
- **Customer portal** (`/shop`) — browse the catalog with search and category filters, view product details, sign up / sign in (with emailed verification code), manage a profile + address book and a wishlist, and check out a cart.

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (dark theme via design tokens in `src/app/globals.css`)
- **libSQL/SQLite** via [`@libsql/client`](https://github.com/tursodatabase/libsql-client-ts) — one driver that talks to a local `file:` database or a hosted Turso one
- REST API routes under `src/app/api/*` reading and writing through the data layer in `src/lib/`

## Prerequisites

| Requirement | Version | Notes |
| --- | --- | --- |
| **Node.js** | **≥ 24** (developed on 26) | Enforced by the `engines` field in `package.json`. Check with `node --version`. |
| **npm** | ships with Node | Or use `pnpm` / `yarn` if you prefer. |
| **Git** | any | To clone the repo. |

> `@libsql/client` is pure JavaScript for remote databases and ships prebuilt native bindings for local `file:` ones, so no compiler setup is needed.

## Getting started on a new machine

```bash
# 1. Clone and enter the project
git clone <your-repo-url> Buyzo
cd Buyzo

# 2. Install dependencies
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
| `TURSO_DATABASE_URL` | in production | Hosted database URL (`libsql://…`). Takes precedence over `DATABASE_URL`. |
| `TURSO_AUTH_TOKEN` | with a `libsql://` URL | Turso auth token. Required whenever the URL is not a `file:` one. |
| `DATABASE_URL` | optional | Local SQLite file as a `file:` URL. Defaults to `file:data/buyzo.db` when no URL is set at all. |
| `ADMIN_EMAIL` | yes | Email for the admin sign-in. There is no fallback — admin login fails without it. |
| `ADMIN_PASSWORD` | yes | Password for the admin sign-in. There is no fallback. |
| `SESSION_SECRET` | recommended | Salt for the admin session token. Changing it invalidates existing admin sessions. |
| `RESEND_API_KEY` | in production | Enables real transactional email via [Resend](https://resend.com). Sign-up needs it — see below. Without it, mail runs in demo mode (logged to the server console + saved in the outbox table). |
| `MAIL_FROM` | optional | The `From` address for outgoing email when Resend is enabled. |
| `OTP_SECRET` | recommended | Salt used to hash verification codes at rest. Changing it invalidates codes already in flight. |

## Sign-up and email verification

Creating a customer account requires proving the email address is reachable:

1. `POST /api/customers/otp` `{ email }` — mails a 6-digit code, valid 10 minutes. The code is **never** in the response body; only a hash of it is stored (`otp_codes`). One code per address at a time, with a 30-second resend cooldown.
2. `POST /api/customers/otp/verify` `{ email, code }` — at most 5 attempts per code.
3. `POST /api/customers` — rejected with 400 unless that email has a verified, unexpired code. The code is deleted on success so it cannot be reused.

Phone is an optional profile field and is **not** verified. It used to carry the OTP, but SMS to Indian numbers requires TRAI DLT registration (entity, sender ID and template approval per operator), which email avoids entirely.

**Without `RESEND_API_KEY` nobody can sign up in production.** In that state the app is in demo mode: the code is printed to the server console instead of being mailed, and the sign-up form says so. That keeps local development working, but a provider that actively rejects a send returns 502 rather than pretending to succeed.

## Database

Buyzo talks to one libSQL database through `@libsql/client`. The same code path serves both targets, chosen purely by the URL in the environment:

- **Local development** — a SQLite file at `data/buyzo.db` (git-ignored; each machine builds its own from the migrations and seed data).
- **Production** — a hosted Turso database, because serverless platforms like Vercel have an ephemeral, read-only filesystem and cannot keep a SQLite file.

Every function in `src/lib/` is `async`: a remote database is a network call, so reads and writes are awaited.

### npm scripts

| Script | What it does |
| --- | --- |
| `npm run db:migrate` | Applies any pending SQL migrations in `database/migrations/`. Safe to re-run — already-applied migrations are skipped (tracked in the `database_migrations` table). |
| `npm run db:import-legacy` | One-time import of the legacy JSON snapshot (`data/buyzo-db.json`). Refuses to run twice or over a non-empty database. |
| `npm run db:setup` | Convenience: runs `db:migrate` then `db:import-legacy`. |

### How it works

- **Schema** lives as plain SQL files in `database/migrations/`, applied in filename order:
  - `001_initial.sql` — core tables: `categories`, `products`, `customers`, `email_outbox`, `app_meta`.
  - `002_customer_profile.sql` — adds `avatar` and `addresses_json` columns to `customers`.
  - `003_orders.sql` — `orders`, with the fulfilment lifecycle and JSON snapshots of line items and address.
  - `004_otp_codes.sql` — `otp_codes`, the email verification codes for sign-up.
- **Migrations run only via `npm run db:migrate`**, never on a request. Applying schema changes from inside the app would mean a migration check on every cold start, so run the script before (or as part of) a deploy.
- **Seeding:** on a fresh, empty database the app seeds a small demo catalog automatically. Running `db:import-legacy` instead loads the fuller snapshot from `data/buyzo-db.json`; the two are mutually exclusive (a seed marker in `app_meta` prevents double-seeding).

### Resetting the local database

Delete the SQLite files and rebuild:

```bash
rm -f data/buyzo.db data/buyzo.db-shm data/buyzo.db-wal
npm run db:setup
```

### Moving a local database to Turso

```bash
turso db create buyzo
turso db show buyzo --url        # -> TURSO_DATABASE_URL
turso db tokens create buyzo     # -> TURSO_AUTH_TOKEN
npm run db:migrate               # creates the schema on Turso
```

To carry existing rows across, note that `sqlite3 .dump` output needs two edits before Turso accepts it: `unistr('…')` wrappers (emitted for text containing control characters) have no equivalent function in libSQL, and the `PRAGMA writable_schema` / `sqlite_sequence` block is rejected. Strip both — `AUTOINCREMENT` counters rebuild themselves from the inserted rowids.

## Deploying to Vercel

```bash
npx vercel
```

Set `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `OTP_SECRET` and `RESEND_API_KEY` as environment variables in the Vercel project, and run `npm run db:migrate` against the Turso database whenever `database/migrations/` gains a file.

`RESEND_API_KEY` is not optional in production — customer sign-up depends on delivering the verification code.

## Project structure

```
database/
└── migrations/                  # Versioned SQL schema migrations
scripts/
├── migrate-database.mjs         # `db:migrate` — apply migrations
└── import-legacy-json.mjs       # `db:import-legacy` — import data/buyzo-db.json
src/
├── lib/
│   ├── database.ts              # libSQL client + async query/transaction helpers
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
| `npm run db:import-legacy` | Import legacy JSON data into the database. |
| `npm run db:setup` | Migrate + import in one step. |

## Next steps

- Add authentication hardening (rate limiting, hashed admin credentials).
- Turn checkout into real order handling with an `orders` table.
- Wire the outbox up to a real email provider in production.
