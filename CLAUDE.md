# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

**Circle** — community finance / savings-circle ("ajo/esusu") app. Users form savings
circles, manage members, and move money (planned via Nomba payment APIs; NGN-only today).
Current state: auth + DB schema + UI scaffolding. Most product logic (circles/members/
invitations reads & writes) is not yet wired; the dashboard renders mock data.

## Stack

- **Next.js 16.2.9** (App Router, React 19.2.4) — NOT Next.js 15 (README is wrong). See @AGENTS.md.
- **Clerk** (`@clerk/nextjs`) for auth. **Drizzle ORM** + **Neon serverless Postgres**.
- **Tailwind v4** + **shadcn** (style `radix-luma`, lucide icons). `next-themes`, `sonner` toasts.
- Package manager: **npm**. TypeScript strict.

## Commands

- `npm run dev` — dev server (Turbopack, port 3000)
- `npm run build` / `npm run start`
- `npm run lint` — ESLint (flat config; `next lint` no longer exists in v16)
- `npm run generate` — drizzle-kit: generate migration from `lib/db/schema.ts`
- `npm run migrate` — drizzle-kit: apply migrations · `npm run drop` — drop
- **Typecheck:** `npx tsc --noEmit`. There is no `typecheck` script, and `next.config.ts`
  sets `typescript.ignoreBuildErrors: true`, so `next build` does NOT fail on type errors —
  run tsc manually to catch them.
- **No test framework** is installed (no vitest/jest/playwright). There is no way to run tests.

## Environment

- Secrets live in `.env.local` (gitignored; no `.env.example`). Required: `DATABASE_URL`
  (Neon), Clerk publishable/secret keys, `CLERK_WEBHOOK_SIGNING_SECRET`.
- `drizzle.config.ts` and `lib/db/db.ts` load env from `./.env.local` via dotenv.

## Architecture

App Router with route groups:
- `app/(auth)/` — Clerk `sign-in`/`sign-up` catch-all pages + `onboarding/`.
- `app/(routes)/` — authenticated shell (`layout.tsx` = Sidebar + TopNav) + `dashboard/`.
- `app/api/webhooks/clerk/route.ts` — Clerk → DB user sync.
- `app/layout.tsx` wraps everything in `<ClerkProvider>` and mounts `<Toaster>`.

**Auth & user sync flow:**
1. `middleware.ts` (`clerkMiddleware`) gates requests. Public: `/`, `/sign-in*`, `/sign-up*`,
   `/api*`. Unauthenticated → sign-in; authenticated but not onboarded → `/onboarding`.
2. Clerk fires a Svix webhook on user create/update/delete → `app/api/webhooks/clerk/route.ts`
   mirrors the user into the Neon `users` table, keyed by `clerkId`. **This is the
   authoritative user-sync path** — it inlines its own DB writes.
   NOTE: `lib/actions/user.ts` (`createUser`/`updateUser`/`deactivateUser`) duplicates this
   logic but is currently unused. Don't assume it runs.
3. **Onboarding state lives in Clerk `publicMetadata.onboardingComplete`, NOT the DB.**
   `app/(auth)/onboarding/_actions.ts` (`completeOnboarding`) sets it via
   `clerkClient().users.updateUserMetadata`; the page calls `user.reload()` to refresh the
   token; `middleware.ts` reads `sessionClaims.metadata.onboardingComplete`. The DB's
   `users.onboardingCompleted` column exists but is unused / not synced.
   The session-claim type is augmented in `types/globals.d.ts`.

**Data layer:**
- `lib/db/db.ts` exports `db` (Drizzle over Neon HTTP). Schema: `lib/db/schema.ts`
  (`users`, `circles`, `circleMembers`, `invitations` + enums). Migrations:
  `lib/db/migrations/`. After editing the schema, run `npm run generate` then `npm run migrate`.

**UI:**
- `components/ui/` — shadcn primitives. `components/shared/` — app components (sidebar, topNav,
  dashboard cards). `components/shared/landingPage/` — landing sections composed by `app/page.tsx`.
- Path alias `@/*` → repo root. `cn()` helper in `lib/utils.ts`.

## Non-obvious gotchas

- **Read the bundled Next.js 16 docs** in `node_modules/next/dist/docs/` before writing
  Next.js code (per @AGENTS.md) — many v16 APIs differ from training data.
- `middleware.ts` uses the **deprecated** `middleware` convention (v16 renames it to `proxy.ts`).
  It still works via Clerk's `clerkMiddleware`; verify Clerk supports the `proxy` rename
  before migrating (proxy runtime is nodejs-only, no edge).
- Async Request APIs (`cookies`/`headers`/`params`/`searchParams`) are **await-only** in v16.
- `next build` uses Turbopack by default and skips linting; type errors are suppressed.
