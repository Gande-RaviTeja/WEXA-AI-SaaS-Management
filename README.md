# StockFlow MVP

StockFlow is a minimal, polished, multi-tenant SaaS inventory management application built for desktop browsers using Next.js (App Router), TypeScript, Tailwind CSS, and Prisma ORM.

---

## Tech Stack & Architecture Choices

| Layer | Technology | Details |
| --- | --- | --- |
| **Framework** | Next.js 16 (App Router) | Server Components, Server Actions, modern layouts & streaming |
| **Language** | TypeScript | Strict type checking across components, actions, and data layer |
| **Database & ORM** | Prisma ORM 7 + PostgreSQL (Neon) | Configured with `@prisma/adapter-pg` and `pg.Pool` connection pooling |
| **Styling** | Tailwind CSS v4 + PostCSS | Linear/Stripe-inspired clean SaaS theme, neutral grays, single indigo accent |
| **Typography** | Inter | Loaded via `next/font/google` with fallback font definitions |
| **Authentication** | Custom Session Cookie | Signed JWT via `jose` (HS256) stored in `httpOnly`, `SameSite=Lax` cookies; bcrypt for password hashing |
| **Validation** | Zod | Server-side validation on every Server Action and form mutation |
| **Testing** | Vitest | Comprehensive unit tests, tenant-isolation tests, and integration tests |

---

## Quick Setup & Running Locally

Ensure you have **Node.js 18+** installed.

```bash
# 1. Install dependencies
npm install

# 2. Run migrations
npx prisma migrate dev

# 3. Seed demo organizations and inventory
npx prisma db seed

# 4. Start the development server
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## Demo Credentials

The database seed script sets up two separate organizations with pre-loaded products and users:

| Organization | User Email | Password | Pre-loaded Inventory |
| --- | --- | --- | --- |
| **Acme Hardware** | `alice@acme.com` | `password123` | 6 products (HMR-001, DRL-002 [low stock], PVC-003, ELC-004 [low stock], GLV-005 [low stock], SAF-006) |
| **Acme Hardware** | `bob@acme.com` | `password123` | Same Acme account, secondary team member |
| **Blue Nile Electronics** | `carol@bluenile.com` | `password123` | 6 products (HMR-001 [cross-org SKU], KB-TKL-01 [low stock], MS-WL-02, MON-27-03 [low stock], CBL-HDMI-04, CAM-1080-05) |
| **Blue Nile Electronics** | `dave@bluenile.com` | `password123` | Same Blue Nile account, secondary team member |

> **Note**: Both organizations share the SKU `HMR-001`. This demonstrates that SKUs are unique **per organization**, allowing different companies to use identical SKUs without conflict.

---

## How Multi-Tenancy Is Enforced

Multi-tenant security in StockFlow is enforced through several strict architectural layers:

1. **Session-Driven Identity**:
   - `organizationId` is **never accepted from client inputs, URL queries, or request bodies**.
   - It is extracted server-side exclusively from the verified JWT payload (`getSession()`).
2. **Mandatory Data Access Layer (`lib/data/*`)**:
   - Pages and Server Actions never make direct raw database queries.
   - All queries pass through `src/lib/data/products.ts` and `src/lib/data/organizations.ts`, where every function requires `organizationId` as a mandatory parameter.
3. **Compound Read, Update, and Delete Constraints**:
   - Single-record lookups and mutations query by **both** record `id` AND `organizationId`:
     ```ts
     const existing = await prisma.product.findFirst({
       where: { id, organizationId }
     })
     if (!existing) return null // Or triggers Next.js notFound()
     ```
   - If User A from Org A attempts to view, edit, or delete a product belonging to Org B by guessing its ID in the URL, the query returns `null` and yields a 404 page.
4. **Database-Level SKU Isolation**:
   - The Prisma schema enforces an organization-scoped compound unique constraint:
     ```prisma
     @@unique([organizationId, sku])
     ```
   - Attempting to create duplicate SKUs within the same organization fails with a friendly inline validation error, while identical SKUs across different organizations are safely permitted.
5. **Credential Protection**:
   - `passwordHash` is excluded from all client-facing data queries.

---

## Running the Automated Test Suite

Run the full suite of unit and integration tests:

```bash
npm test
```

Included test suites:
- **`tests/low-stock.test.ts`**: Verifies low-stock boundary conditions, organization defaults, and custom product threshold overrides.
- **`tests/tenant-isolation.test.ts`**: Proves that Org A cannot list, view, edit, or delete Org B's products, verifies URL tampering resistance, and validates compound SKU uniqueness.
- **`tests/verify-m2.test.ts`**: Verifies validation rules, password hashing, and authentication error handling.
- **`tests/verify-m3-m4.test.ts`**: Verifies full product lifecycle, search, delete modal logic, dashboard aggregations, and settings persistence.
- **`tests/adjust-stock.test.ts`**: Verifies inline stock increments, decrements, floor clamping (never negative), and audit attribution (`lastUpdatedBy`).

---

## Production Deployment (PostgreSQL / Neon)

StockFlow is configured for PostgreSQL using Prisma 7 and `@prisma/adapter-pg`.

### Required Environment Variables
Configure these in your production host (Vercel, Render, Railway, Docker, etc.):

| Variable | Description | Example / Format |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `TEST_DATABASE_URL` | *(Optional)* Dedicated test database URL | `postgresql://user:pass@ep-xyz-test.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `SESSION_SECRET` | 32+ character JWT encryption key | `your-secure-random-secret-key-min-32-chars` |
| `NEXT_PUBLIC_APP_URL` | Production public URL | `https://stockflow.yourdomain.com` |

### Deploying & Migrating the Database

1. **Install Dependencies & Generate Client**:
   ```bash
   npm install
   ```
   *(The `postinstall` script automatically runs `prisma generate`).*

2. **Apply Migrations to Production**:
   ```bash
   npx prisma migrate deploy
   ```

3. **Seed Initial Demo Data**:
   ```bash
   npx prisma db seed
   ```

4. **Build and Start Production Server**:
   ```bash
   npm run build
   npm start
   ```

---

## What I Would Add Next

1. **Audit Logs & Stock History**: Detailed changelog table recording who adjusted stock, exact timestamp, before/after quantities, and adjustment notes.
2. **CSV Import & Export**: Bulk import with validation and automatic duplicate SKU resolution, plus CSV export for inventory reporting.
3. **Purchase Orders & Suppliers**: Supplier directory, purchase orders with receiving workflows that automatically increment stock.
4. **Multi-Location / Multi-Warehouse**: Tracking stock across multiple physical warehouses or retail storefronts.
5. **Role-Based Access Control (RBAC)**: Roles (Owner, Manager, Staff) with granular permissions (e.g. read-only staff vs. managers with delete rights).
6. **Low Stock Email / Webhook Alerts**: Automated notification when stock dips below threshold.
