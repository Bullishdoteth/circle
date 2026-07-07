---
title: Getting Started
description: Practical developer setup guide to get the Circle project running locally.
lastUpdated: July 7, 2026
---

# Getting Started

Follow this guide to set up your local development environment, configure the required database and external services, and run the Circle application locally.

---

## Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18.x or later, recommended v20+)
- **npm** (v10.x or later)
- **Git**

You will also need active developer accounts with the following third-party services:
- **Clerk Console:** For authentication and identity management.
- **Neon Console:** Serverless PostgreSQL provider.
- **Nomba Developer Portal:** For payment rails, virtual account provisioning, and transfers sandbox (NGN).

---

## Local Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd circle
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root of the project. Fill in the required variables (copy values from your developer dashboards):
   ```text
   # Neon Database URL
   DATABASE_URL="postgresql://username:password@neon-host/dbname?sslmode=require"

   # Clerk Keys
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
   CLERK_SECRET_KEY="sk_test_..."
   CLERK_WEBHOOK_SIGNING_SECRET="whsec_..."

   # Nomba API Credentials
   NOMBA_CLIENT_ID="your-client-id"
   NOMBA_CLIENT_SECRET="your-client-secret"
   NOMBA_ACCOUNT_ID="your-account-id"
   NOMBA_SUB_ACCOUNT_ID="your-sub-account-id-for-virtual-accounts"
   NOMBA_WEBHOOK_SIGNATURE_KEY="your-webhook-hmac-secret-key"

   # App Configs
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   CRON_SECRET="your-secure-cron-header-token"
   ```

---

## Database Setup & Migrations

Circle uses **Drizzle ORM** with **Neon Postgres**. Database schema definitions reside in `lib/db/schema.ts`.

1. **Generate Database Migrations:**
   Whenever schema modifications are made, generate the corresponding migration files using:
   ```bash
   npm run generate
   ```
   This generates SQL scripts in the `lib/db/migrations/` directory.

2. **Apply Migrations to database:**
   To sync your local or cloud Neon database with the schema definitions, run:
   ```bash
   npm run migrate
   ```

3. **Resetting/Dropping Tables:**
   If you need to start fresh (sandbox environment only!), you can run:
   ```bash
   npm run drop
   ```

---

## Running the Application

1. **Start the local development server:**
   ```bash
   npm run dev
   ```
   This spins up the Next.js development server at `http://localhost:3000`.

2. **Verify Type-Checking:**
   Next.js 16 is configured to ignore typescript build errors in `next.config.ts` to speed up compilation. To ensure there are no compilation problems, run type-checking manually:
   ```bash
   npx tsc --noEmit
   ```

3. **Linter Inspection:**
   Inspect code styling and structure rules using:
   ```bash
   npm run lint
   ```

4. **Production Build:**
   Compile the production bundle to verify compilation success:
   ```bash
   npm run build
   ```
