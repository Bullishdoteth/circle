---
title: Development Guide
description: Coding guidelines, database schema workflows, environment variables, and styling conventions.
lastUpdated: July 7, 2026
---

# Development & Coding Guide

This guide provides technical best practices, state management rules, folder patterns, and style conventions used across the Circle codebase.

---

## 1. Directory Structure Conventions

Developers should locate files according to their specific roles:
- **Routes / Pages:** Always create pages within `app/(routes)/`.
- **Server Actions:** Write transactional actions inside `lib/actions/`. Use file names matching their entity scope (e.g. `lib/actions/circle.ts`).
- **UI Components:** Add raw UI primitives to `components/ui/`. Group complex, layout-dependent interfaces under `components/shared/` or sub-folders matching their target entity.

---

## 2. Coding Best Practices

- **Strict TypeScript:** Enforce complete types. Avoid `any` except when deserializing complex dynamic payloads.
- **Server-First Logic:** Render database records inside **Server Components** rather than client components to leverage caching and quick loads.
- **Form Schemas:** Always validate user inputs. Use **Zod** client-side and duplicate the validations within target **Server Actions** via `safeParse`.
- **Lucide Icons:** Use Lucide icons for UI symbols. Maintain design alignment with existing icons.

---

## 3. Database Workflows

Circle uses **Drizzle Kit** to track database states.

1. **Schema Modifications:** Edit table schemas inside `lib/db/schema.ts`.
2. **Migration Files:** Run `npm run generate` to compile your changes into migrations.
3. **Execution:** Apply migrations using `npm run migrate`. Ensure you verify columns and index configurations before deploying migrations to live environments.

---

## 4. State Management, Caching, & Revalidation

Circle does not use client-side state engines (such as Redux or Zustand). Instead:
- **Next.js Cache:** Relies on Server Components fetching data from Neon database on load.
- **React State:** Manage local view states (e.g. active tab indexes, form values, and toggle gates) using React's `useState`.
- **Revalidation:** Use `revalidatePath` or `revalidateTag` in Server Actions to trigger cache invalidation and reload active dashboard states:
  ```typescript
  // Trigger update
  await db.insert(circles).values({...});
  revalidatePath('/dashboard');
  ```
- **Context API:** Used minimally. For instance, themes are wrapped in ThemeProvider contexts.

---

## 5. Styling Conventions (Tailwind CSS v4 & shadcn)

- **Utility Classes:** Use Tailwind utility classes for layout styling. Maintain a clean, modern aesthetic: rounded buttons, subtle borders, and smooth shadows.
- **Shadcn Primitives:** Import components from `components/ui/` (buttons, dialogs, inputs, sheets) and override classes as needed.
- **Theme Variables:** Use standard theme variables (e.g. `border-border`, `bg-background`, `text-muted-foreground`) to ensure consistent design.
- **Colors:** Green (`#4AA054`) is Circle's core action color. Dark components should use `neutral` values matching the main theme.

---

## 6. Security & Permissions Checks

- **Server Action Validation:** Every server action that updates data must verify the user's Clerk session:
  ```typescript
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  ```
- **Role Constraints:** Verify membership roles before running restricted operations (e.g., payouts, invite revocations):
  ```typescript
  const [member] = await db.select().from(circleMembers).where(and(...));
  if (!member || !['owner', 'admin', 'treasurer'].includes(member.role)) {
      throw new Error("Permission Denied");
  }
  ```
- **Secrets Management:** Keep secrets strictly on the server. Never prefix private API keys with `NEXT_PUBLIC_`.
- **Inputs Sanitization:** Use Zod schemas to validate inputs, sanitizing strings to prevent SQL injections or XSS.

---

## 7. Environment Variables Reference

Here is a reference of the environment variables used by the application:

| Name | Purpose | Required | Example |
| :--- | :--- | :---: | :--- |
| `DATABASE_URL` | Neon serverless connection link | Yes | `postgresql://...` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client credentials | Yes | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk server signing key | Yes | `sk_test_...` |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Clerk Svix validation secret | Yes | `whsec_...` |
| `NOMBA_CLIENT_ID` | Nomba account credentials | Yes | `client_...` |
| `NOMBA_CLIENT_SECRET` | Nomba account secret | Yes | `secret_...` |
| `NOMBA_ACCOUNT_ID` | Nomba primary account ID | Yes | `acc_...` |
| `NOMBA_SUB_ACCOUNT_ID` | Nomba sub-account for payments | Yes | `sub_...` |
| `NOMBA_WEBHOOK_SIGNATURE_KEY` | Nomba webhook HMAC signature secret | Yes | `hmac_...` |
| `CRON_SECRET` | Header key protecting inflow sync | Yes | `secret_...` |
| `NEXT_PUBLIC_APP_URL` | Application base domain URL | Yes | `http://localhost:3000` |
