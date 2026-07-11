# Buyzo

A dark-themed Next.js app with two portals sharing one product catalog:

- **Admin portal** (`/admin`) — dashboard with inventory stats and stock alerts, plus full product management (create, edit, delete) at `/admin/products`.
- **Customer portal** (`/shop`) — browse the catalog with search and category filters, view product details, and manage a cart (persisted in `localStorage`) with a demo checkout.

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (dark theme via design tokens in `src/app/globals.css`)
- REST API routes at `/api/products` backed by an in-memory store (`src/lib/products.ts`) seeded with demo products — data resets when the server restarts

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and pick a portal.

## Project structure

```
src/
├── lib/products.ts              # Product type + in-memory store (seeded)
└── app/
    ├── page.tsx                 # Landing page (portal chooser)
    ├── api/products/            # REST API (GET/POST, GET/PUT/DELETE by id)
    ├── admin/                   # Admin portal: dashboard + product CRUD
    └── shop/                    # Customer portal: catalog, detail, cart
```

## Next steps

- Swap the in-memory store for a real database (Prisma + SQLite/Postgres)
- Add authentication to protect the admin portal
- Turn checkout into real order handling
