---
title: Database Schema
description: Complete database entity reference, indices, data types, and relationships.
lastUpdated: July 7, 2026
---

# Database Schema

Circle uses **Drizzle ORM** communicating with a serverless **Neon PostgreSQL** database. The schema is defined in `lib/db/schema.ts`.

---

## Entity Relationship Overview

The core connections between tables are diagrammed below:

```mermaid
erDiagram
    users ||--o{ circles : "owns/creates"
    users ||--o{ circle_members : "is member"
    circles ||--o{ circle_members : "has members"
    circles ||--o{ invitations : "invites to"
    circles ||--o1 virtual_accounts : "has VA"
    circles ||--o{ contributions : "collects"
    users ||--o{ contributions : "reconciles/belongs to"
    circles ||--o{ payouts : "disburses"
    users ||--o{ payouts : "receives"
    users ||--o{ notifications : "receives alerts"
```

---

## Tables Reference

### 1. `users`
Represents customer profile identities, synced from Clerk and updated with settlement bank metadata.

- **Fields:**
  - `id`: `uuid` (Primary Key)
  - `clerkId`: `text` (Unique, Not Null) — Clerk identity key.
  - `firstName`: `text` (Nullable)
  - `lastName`: `text` (Nullable)
  - `username`: `text` (Unique, Nullable)
  - `email`: `text` (Unique, Not Null)
  - `imageUrl`: `text` (Nullable)
  - `address`: `text` (Nullable)
  - `phoneNumber`: `text` (Nullable)
  - `onboardingCompleted`: `boolean` (Default: `false`) — Clerk-side completion marker.
  - `isActive`: `boolean` (Default: `true`)
  - `payoutBankCode`: `text` (Nullable) — Target bank code for payouts.
  - `payoutBankName`: `text` (Nullable)
  - `payoutAccountNumber`: `text` (Nullable) — Target account number for payouts.
  - `payoutAccountName`: `text` (Nullable)
  - `createdAt`: `timestamp` (Default: `now`)
  - `updatedAt`: `timestamp` (Default: `now`)

- **Example Row:**
  | id | clerkId | email | firstName | payoutAccountNumber |
  | :--- | :--- | :--- | :--- | :--- |
  | `f47ac10b-...` | `user_2bF...` | `ada@gmail.com` | `Ada` | `0123456789` |

---

### 2. `circles`
Contains the configuration settings, owner mappings, and pricing rules of savings circles.

- **Fields:**
  - `id`: `uuid` (Primary Key)
  - `slug`: `text` (Unique, Not Null)
  - `name`: `text` (Not Null)
  - `description`: `text` (Nullable)
  - `imageUrl`: `text` (Nullable)
  - `currency`: `currency` (Enum: `NGN`)
  - `ownerId`: `uuid` (Foreign Key -> `users.id`, Restrict)
  - `visibility`: `circle_visibility` (Enum: `private`, `invite_only`)
  - `status`: `circle_status` (Enum: `active`, `archived`, `suspended`, `deleted`)
  - `createdBy`: `uuid` (Foreign Key -> `users.id`, Restrict)
  - `lastActivityAt`: `timestamp` (Nullable)
  - `contributionAmount`: `numeric(12,2)` (Default: `50000.00`)
  - `payoutMethod`: `text` (Default: `'manual'`)
  - `frequency`: `text` (Default: `'monthly'`)
  - `currentRound`: `integer` (Default: `1`)
  - `createdAt`: `timestamp` (Default: `now`)
  - `updatedAt`: `timestamp` (Default: `now`)
  - `deletedAt`: `timestamp` (Nullable)

- **Indexes:**
  - `circle_owner_idx` on `ownerId` for fast filtering.

---

### 3. `circle_members`
A join table mapping users to circles, tracking roles, rotation position, and payout schedules.

- **Fields:**
  - `id`: `uuid` (Primary Key)
  - `circleId`: `uuid` (Foreign Key -> `circles.id`, Cascade)
  - `userId`: `uuid` (Foreign Key -> `users.id`, Cascade)
  - `role`: `circle_member_role` (Enum: `owner`, `admin`, `treasurer`, `member`)
  - `status`: `membership_status` (Enum: `active`, `suspended`, `removed`)
  - `invitedBy`: `uuid` (Foreign Key -> `users.id`, Set Null)
  - `rotationPosition`: `integer` (Nullable) — Position in the payout queue.
  - `payoutDate`: `timestamp` (Nullable) — Target round disbursement date.
  - `acceptedAt`: `timestamp` (Nullable)
  - `createdAt`: `timestamp` (Default: `now`)

- **Constraints & Indexes:**
  - `unique_membership` unique index on `(circleId, userId)`.
  - `circle_member_circle_idx` index on `circleId`.
  - `circle_member_user_idx` index on `userId`.

---

### 4. `invitations`
Logs pending email invites sent to potential participants.

- **Fields:**
  - `id`: `uuid` (Primary Key)
  - `circleId`: `uuid` (Foreign Key -> `circles.id`, Cascade)
  - `invitedBy`: `uuid` (Foreign Key -> `users.id`, Set Null)
  - `invitedUserId`: `uuid` (Foreign Key -> `users.id`, Set Null)
  - `email`: `text` (Not Null)
  - `token`: `text` (Unique, Not Null) — Sent in invitation email.
  - `role`: `circle_member_role` (Enum: `admin`, `member`)
  - `status`: `invitation_status` (Enum: `pending`, `accepted`, `declined`, `expired`, `revoked`)
  - `expiresAt`: `timestamp` (Not Null)
  - `acceptedAt`: `timestamp` (Nullable)

- **Indexes:**
  - `invitation_email_idx` on `email`.
  - `invitation_circle_idx` on `circleId`.

---

### 5. `virtual_accounts`
Maps provisioned Nomba MFB virtual bank accounts to their corresponding circles.

- **Fields:**
  - `id`: `uuid` (Primary Key)
  - `circleId`: `uuid` (Unique, Foreign Key -> `circles.id`, Cascade)
  - `accountRef`: `text` (Unique, Not Null) — Generated reference ID.
  - `accountName`: `text` (Not Null)
  - `bankName`: `text` (Not Null)
  - `bankAccountNumber`: `text` (Unique, Not Null) — Provisioned NGN account number.
  - `bankAccountName`: `text` (Not Null)
  - `status`: `text` (Default: `'active'`)

- **Indexes:**
  - `va_circle_idx` on `circleId`.
  - `va_bank_account_idx` on `bankAccountNumber`.

---

### 6. `contributions`
Logs member deposits (inflows) captured via bank transfers to virtual accounts.

- **Fields:**
  - `id`: `uuid` (Primary Key)
  - `circleId`: `uuid` (Foreign Key -> `circles.id`, Cascade)
  - `userId`: `uuid` (Foreign Key -> `users.id`, Set Null) — Nullable for unreconciled entries.
  - `amount`: `numeric(12,2)` (Not Null)
  - `status`: `text` (Default: `'pending'`) — `pending`, `success`, `failed`, `reversed`.
  - `reference`: `text` (Unique, Not Null) — Nomba transaction ID or session identifier.
  - `senderName`: `text` (Nullable)
  - `senderBank`: `text` (Nullable)
  - `senderAccountNumber`: `text` (Nullable)
  - `round`: `text` (Nullable) — The target round this contribution is applied to.
  - `reconciled`: `boolean` (Default: `false`)
  - `reconciledAt`: `timestamp` (Nullable)
  - `reconciledBy`: `uuid` (Foreign Key -> `users.id`, Set Null)
  - `rawPayload`: `text` (Nullable) — JSON payload from Nomba webhook.

- **Indexes:**
  - `contribution_circle_idx` on `circleId`.
  - `contribution_user_idx` on `userId`.
  - `contribution_ref_idx` on `reference`.

---

### 7. `payouts`
Logs disbursements (outflows) transferred to members' personal bank accounts.

- **Fields:**
  - `id`: `uuid` (Primary Key)
  - `circleId`: `uuid` (Foreign Key -> `circles.id`, Cascade)
  - `userId`: `uuid` (Foreign Key -> `users.id`, Cascade)
  - `amount`: `numeric(12,2)` (Not Null)
  - `status`: `text` (Default: `'pending'`) — `pending`, `success`, `failed`, `refunded`.
  - `reference`: `text` (Unique, Not Null) — Nomba payout transfer reference.
  - `destinationBank`: `text` (Not Null)
  - `destinationAccountNumber`: `text` (Not Null)
  - `destinationAccountName`: `text` (Not Null)
  - `round`: `text` (Nullable)

- **Indexes:**
  - `payout_circle_idx` on `circleId`.
  - `payout_user_idx` on `userId`.
  - `payout_ref_idx` on `reference`.

---

### 8. `notifications`
Stores in-app alerts displayed to users on actions like invitations, payouts, and collections.

- **Fields:**
  - `id`: `uuid` (Primary Key)
  - `userId`: `uuid` (Foreign Key -> `users.id`, Cascade)
  - `circleId`: `uuid` (Foreign Key -> `circles.id`, Cascade, Nullable)
  - `title`: `text` (Not Null)
  - `message`: `text` (Not Null)
  - `type`: `text` (Default: `'info'`)
  - `read`: `boolean` (Default: `false`)
  - `createdAt`: `timestamp` (Default: `now`)
  - `deletedAt`: `timestamp` (Nullable)
