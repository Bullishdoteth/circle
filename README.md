# Circle

<div align="center">
  <img src="docs/images/landing-page.png" alt="Circle Dashboard Banner" width="100%" style="border-radius: 12px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);" />
  
  <p align="center">
    <strong>A secure, automated community finance and collaborative savings platform (Ajo, Esusu, Pardna).</strong>
  </p>

  [![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19.2.4-blue?style=for-the-badge&logo=react)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Clerk Auth](https://img.shields.io/badge/Clerk_Auth-Security-6c47ff?style=for-the-badge&logo=clerk)](https://clerk.com/)
  [![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-1.0.0-c5f11a?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
  [![Neon PostgreSQL](https://img.shields.io/badge/Neon_PostgreSQL-Serverless-00e599?style=for-the-badge&logo=neon)](https://neon.tech/)
  [![Nomba API](https://img.shields.io/badge/Nomba_API-Payments-03a9f4?style=for-the-badge&logo=bank)](https://nomba.com/)
</div>

---

## 📖 Table of Contents

- [Introduction](#-introduction)
- [Product Walkthrough](#-product-walkthrough)
- [Key Features](#-key-features)
- [Technical Architecture](#-technical-architecture)
- [Folder Structure](#-folder-structure)
- [Core Workflows](#-core-workflows)
  - [Authentication & User Sync Flow](#authentication--user-sync-flow)
  - [Onboarding Flow](#onboarding-flow)
  - [Circle Lifecycle & Management](#circle-lifecycle--management)
  - [Payments Flow (Nomba API)](#payments-flow-nomba-api)
  - [Reconciliation & Transactions](#reconciliation--transactions)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Environment Variables](#-environment-variables)
- [Local Installation](#-local-installation)
- [Development Commands](#-development-commands)
- [Deployment](#-deployment)
- [Security Model](#-security-model)
- [Performance Optimization](#-performance-optimization)
- [Accessibility](#-accessibility)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Authors](#-authors)

---

## 🌟 Introduction

**Circle** is a modern community finance application designed to digitize, secure, and automate traditional rotational savings groups—commonly known as **Ajo**, **Esusu** (West Africa), or **Pardna** (Caribbean). In informal savings collectives, administrative burdens, lack of transparency, manual bookkeeping, and default risks often compromise trust. 

Circle bridges this gap by provisioning **dedicated virtual bank accounts** for every savings circle using **Nomba API**. It automates rotational slot payout assignments, schedules disbursements to personal bank accounts, tracks member compliance scores, and provides a real-time transaction ledger. Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **Clerk Auth**, **Drizzle ORM**, and **Neon Serverless Postgres**, Circle brings institution-grade safety and slick UX to community-driven finance.

---

## 🎥 Product Walkthrough

### Walkthrough & Interaction Flow

<p align="center">
  <a href="https://drive.google.com/file/d/1guNk_GOnn_5RL2-adLMeTUdrf6pZ-z1b/view?usp=sharing">
    <img src="docs/images/landing-page.png" alt="Circle Demo Video">
  </a>
</p>

<p align="center">
  <strong>👆 Click the image above to watch the full demo</strong>
</p>

### UI Screenshot Gallery

<details>
<summary>📸 Click to View Desktop Screenshots</summary>

#### Landing Page Hero
<img src="docs/images/landing-page.png" alt="Desktop Landing Page" width="100%" style="border-radius: 8px; border: 1px solid #eaeaea;" />

#### Feature Breakdown
<img src="docs/images/features.png" alt="Desktop Features Section" width="100%" style="border-radius: 8px; border: 1px solid #eaeaea;" />

#### Clerk Authentication
<img src="docs/images/sign-in.png" alt="Clerk Sign-In Page" width="100%" style="border-radius: 8px; border: 1px solid #eaeaea;" />

#### Developer API Documentation Dashboard
<img src="docs/images/developer-docs.png" alt="Developer Documentation Dashboard" width="100%" style="border-radius: 8px; border: 1px solid #eaeaea;" />

#### Nomba Payment Webhook Simulator (/test)
<img src="docs/images/webhook-tester.png" alt="Nomba Webhook Simulator" width="100%" style="border-radius: 8px; border: 1px solid #eaeaea;" />
</details>

<details>
<summary>📱 Click to View Mobile & Tablet Screenshots</summary>

#### Mobile View (Responsive Landing)
<div align="center">
  <img src="docs/images/mobile-landing.png" alt="Mobile Landing View" width="375" style="border-radius: 8px; border: 1px solid #eaeaea;" />
</div>
</details>

---

## 🚀 Key Features

*   **⚡ Automated Multi-Step Onboarding:** Restricts non-onboarded authenticated users, guiding them to create or join a circle, invite friends, configure payout settings, and register payout bank details securely.
*   **🏦 Dynamic Virtual Account Provisioning:** Integrates **Nomba MFB** virtual accounts. Every Circle gets a dedicated account number that automatically routes payments into the Circle pool.
*   **🔄 Automated Rotational Payout Tracker:** Calculates payout turns, dates, and order based on savings frequencies (weekly, monthly) and assigns members specific rotation numbers.
*   **🛠️ Manual Deposit Reconciliation:** Because standard interbank transfers only provide sender names and account numbers, Circle allows managers/treasurers to review incoming webhook deposits and map them directly to members and contribution rounds.
*   **📬 Live Notifications & Webhooks:** Leverages Clerk (Svix) webhooks for user profile synchronization and Nomba webhooks to capture deposit, disbursement (payout), failure, and refund events instantly.
*   **⏰ Cron-Driven Fallback Inflow Sync:** Periodic endpoint polling fetches recent Nomba transactions to synchronize any contributions missed by webhooks.
*   **🏦 Direct NGN Bank Transfers:** Disburses payout pools directly into Nigerian bank accounts via Nomba transfers API with complete idempotency tracking.

---

## 🏗️ Technical Architecture

Circle uses a server-first architecture to maximize loading speeds, leveraging Server Components for database fetches and Server Actions for data mutations.

```mermaid
graph TD
    User[Client Browser] -->|Interacts| ClientComp[Client Component]
    ClientComp -->|Triggers Action| ServerAction[Server Action]
    ServerAction -->|Reads/Writes| DB[(Neon PostgreSQL)]
    ServerAction -->|Calls APIs| NombaAPI[Nomba Gateway]
    ServerAction -->|Sends Emails| Resend[Resend Mail Service]
    Clerk[Clerk Auth] -->|Webhook User Sync| ClerkWebhook[Clerk Webhook Router]
    ClerkWebhook -->|Writes User| DB
    NombaGateway[Nomba Bank Rail] -->|Webhook Deposit Notification| NombaWebhook[Nomba Webhook Router]
    NombaWebhook -->|Logs Inflow / Payout Success| DB
```

### Server & Connection Architecture
1. **Next.js 16 Server (App Router):** Renders views server-side and routes API requests.
2. **Neon Serverless Postgres Pool:** Communicates via Drizzle HTTP connectors.
3. **Third-Party Rails:**
   - **Clerk Auth:** Authentication provider.
   - **Nomba API:** Dynamic bank accounts generator and bank payouts processor.
   - **Resend API:** Transactional emails dispatcher.

---

## 📂 Folder Structure

```text
circle/
├── app/                  # Next.js App Router folders
│   ├── (auth)/           # Route group for authentication (Clerk) and onboarding
│   │   ├── onboarding/   # Card-based onboarding flows and server actions
│   │   ├── sign-in/      # Clerk Sign-In catch-all
│   │   └── sign-up/      # Clerk Sign-Up catch-all
│   ├── (routes)/         # Authenticated layouts, cards, and pages
│   │   ├── circles/      # Circle details and listing
│   │   ├── contributions/# Deposit ledger and manual reconciliation dashboard
│   │   ├── dashboard/    # User greetings, active circle stats, recent activity
│   │   ├── payouts/      # Payout ledger and settlement profile configurations
│   │   ├── reports/      # Financial statistics
│   │   ├── settings/     # Personal profiles and payout bank configurations
│   │   └── transactions/ # Unified transaction history logs
│   ├── api/              # Rest Endpoints
│   │   ├── cron/         # Background routines (Nomba inflow synchronizer)
│   │   └── webhooks/     # Webhook receivers (Clerk sync and Nomba payment logs)
│   ├── docs/             # Public documentation page
│   ├── layout.tsx        # Global theme wrapper, Toaster, and ClerkProvider
│   └── page.tsx          # Marketing Landing page
├── components/           # Component library
│   ├── ui/               # Radix and shadcn UI primitives (buttons, modals, inputs)
│   └── shared/           # Complex widgets (sidebar, greetings, cards, charts)
├── content/              # Public markdown docs pages parsed by Next.js
├── lib/                  # Utilities, Actions, and API clients
│   ├── actions/          # Next.js Server Actions (Circle, Payout, User logic)
│   ├── db/               # Neon client database connections and Drizzle schemas
│   ├── nomba/            # Nomba API clients, configs, and signature verifications
│   └── utils.ts          # Class merging and common Tailwind helpers
├── types/                # TypeScript interfaces and globally augmented claims
└── middleware.ts         # Clerk routing access gates
```

---

## 🔄 Core Workflows

### Authentication & User Sync Flow

Identity status is verified via session tokens. Authentic profiles are mirrored locally via webhooks.

```mermaid
sequenceDiagram
    participant User as User Browser
    participant Clerk as Clerk Auth Server
    participant Middleware as Next.js Middleware
    participant Webhook as Clerk Webhook Handler
    participant DB as Neon Database

    User->>Clerk: Sign Up / Sign In
    Clerk-->>User: Issue Session JWT
    Clerk->>Webhook: Webhook: user.created (Svix)
    activate Webhook
    Webhook->>DB: Insert local User (clerkId, email)
    Webhook-->>Clerk: HTTP 200 OK
    deactivate Webhook
    
    User->>Middleware: Navigate to /dashboard
    activate Middleware
    Middleware->>Clerk: Validate Session JWT
    Clerk-->>Middleware: Session Active (onboardingComplete: false)
    Note over Middleware: Onboarding metadata is missing
    Middleware-->>User: Redirect to /onboarding
    deactivate Middleware
```

### Onboarding Flow

Forces authenticated members to finalize their configuration parameters before rendering dashboards.

```mermaid
graph TD
    A[Sign In / Sign Up Completed] --> B{Onboarding Complete?}
    B -->|Yes| C[Redirect to /dashboard]
    B -->|No| D[Force Redirect to /onboarding]
    D --> E[Step 1: Create or join Circle details]
    D --> F[Step 2: Add member invitations]
    E & F --> G[Submit Onboarding Form]
    G --> H[Create Circle Action & Provision VA]
    H --> I[Update Clerk metadata onboardingComplete = true]
    I --> J[Reload Session Token]
    J --> C
```

### Circle Lifecycle & Management

Circles are created, joined, configured, and payout positions are assigned.

```mermaid
stateDiagram-v2
    [*] --> Pending : Owner Sends Invite
    Pending --> Accepted : User Clicks Link & Signs In
    Pending --> Declined : User Rejects Invite
    Pending --> Expired : Expires after 7 Days
    Pending --> Revoked : Owner Cancels Invite
    Accepted --> ActiveMember : Join Circle
    ActiveMember --> RotationalPayout : Turn in rotation position
    RotationalPayout --> Complete : Payout completed
```

*   **Circle Invitations:** Email-based invites are generated with a unique token valid for 7 days.
*   **Rotation Schedule Calculation:**
    $$\text{Payout Date} = \text{Circle Activation Date} + (\text{Rotation Position} \times \text{Savings Frequency Interval})$$
*   **Role Hierarchy:**
    *   **Owner:** Full administrative power, can delete circle.
    *   **Admin:** Configurations, invites, payouts, and reconciliations.
    *   **Treasurer:** Financial activities (deposit reconciliation & payouts initiation).
    *   **Member:** View-only permissions, pays contributions, receives disbursements.

### Payments Flow (Nomba API)

Dynamic virtual accounts collect funds. Payouts disburse NGN transfers.

```mermaid
graph TD
    A[Incoming Webhook] --> B{Verify Signature}
    B -->|Invalid| C[Return HTTP 400/500]
    B -->|Valid| D{Event Type?}
    D -->|payment_success| E[Map Virtual Account -> Insert Unreconciled Contribution]
    D -->|payment_failed / payment_reversal| F[Update Contribution Status]
    D -->|payout_success / payout_failed| G[Update Payout Status -> Notify Member]
    D -->|payout_refund| H[Update Payout Status -> Refund Circle]
```

*   **In-Memory Token Caching:** `lib/nomba/client.ts` caches OAuth tokens and employs a concurrency lock promise to throttle identical login requests.
*   **Verification:** Webhook payloads are hashed with `HMAC-SHA256` using the `NOMBA_WEBHOOK_SIGNATURE_KEY` header payload timestamp to verify origins.

### Reconciliation & Transactions

*   **Unreconciled Inflows:** Deposits logged via webhooks are stored as unreconciled (`reconciled: false`, `userId: null`) because bank transactions do not contain user metadata.
*   **Double-Reconciliation Prevention:** Checks prevent mapping a contribution transaction twice.
*   **Double-Payout Prevention:** Prevents initiating payouts to the same beneficiary in the same round.
*   **Idempotency Checks:** Unique merchant transaction references (prefixed with `payout_`) prevent duplicate bank payouts.

---

## 🗄️ Database Schema

Circle uses **Neon Serverless Postgres** mapped with **Drizzle ORM**.

```mermaid
erDiagram
    users {
        uuid id PK
        text clerkId UK
        text firstName
        text lastName
        text username UK
        text email UK
        text imageUrl
        text address
        text phoneNumber
        boolean onboardingCompleted
        boolean isActive
        text payoutBankCode
        text payoutBankName
        text payoutAccountNumber
        text payoutAccountName
        timestamp createdAt
        timestamp updatedAt
    }
    circles {
        uuid id PK
        text slug UK
        text name
        text description
        text imageUrl
        enum currency
        uuid ownerId FK
        enum visibility
        enum status
        uuid createdBy FK
        timestamp lastActivityAt
        numeric contributionAmount
        text payoutMethod
        text frequency
        integer currentRound
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt
    }
    circle_members {
        uuid id PK
        uuid circleId FK
        uuid userId FK
        enum role
        enum status
        uuid invitedBy FK
        integer rotationPosition
        timestamp payoutDate
        timestamp acceptedAt
        timestamp createdAt
        timestamp updatedAt
    }
    invitations {
        uuid id PK
        uuid circleId FK
        uuid invitedBy FK
        uuid invitedUserId FK
        text email
        text token UK
        enum role
        enum status
        timestamp expiresAt
        timestamp acceptedAt
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt
    }
    virtual_accounts {
        uuid id PK
        uuid circleId FK "Unique"
        text accountRef UK
        text accountName
        text bankName
        text bankAccountNumber UK
        text bankAccountName
        text currency
        text status
        timestamp createdAt
        timestamp updatedAt
    }
    contributions {
        uuid id PK
        uuid circleId FK
        uuid userId FK
        numeric amount
        text status
        text reference UK
        text senderName
        text senderBank
        text senderAccountNumber
        text round
        boolean reconciled
        timestamp reconciledAt
        uuid reconciledBy FK
        text rawPayload
        timestamp createdAt
        timestamp updatedAt
    }
    payouts {
        uuid id PK
        uuid circleId FK
        uuid userId FK
        numeric amount
        text status
        text reference UK
        text destinationBank
        text destinationAccountNumber
        text destinationAccountName
        text round
        timestamp createdAt
        timestamp updatedAt
    }
    notifications {
        uuid id PK
        uuid userId FK
        uuid circleId FK
        text title
        text message
        text type
        boolean read
        timestamp createdAt
        timestamp deletedAt
    }

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

### Table Metadata & Purpose

1.  **`users`:** Accounts created via Clerk. Stores payout bank settings (`payoutAccountNumber`, `payoutBankCode`).
2.  **`circles`:** Configuration details of each group savings (amount, frequency, active round).
3.  **`circle_members`:** Mappings connecting members to circles. Houses rotation indices (`rotationPosition`) and payout dates.
4.  **`invitations`:** Track email invite states and tokens.
5.  **`virtual_accounts`:** Mapped Nomba bank numbers allocated to each circle.
6.  **`contributions`:** Deposits record logs. Links to users once reconciled by a manager.
7.  **`payouts`:** Scheduled disbursement records tracking bank transfer references.
8.  **`notifications`:** In-app transactional notification logs.

---

## 🔌 API Reference

| Method | Route | Purpose | Authentication | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/webhooks/clerk` | Syncs Clerk user data into Postgres | Svix Headers Signature | `{ "success": true }` |
| `POST` | `/api/webhooks/nomba` | Resolves virtual account deposits & transfers | HMAC-SHA256 Signature | `{ "success": true }` |
| `GET` | `/api/cron/sync-inflows` | Fallback polling of Nomba transactions | `Bearer <CRON_SECRET>` | `{ "success": true, "syncedCount": N }` |

---

## ⚙️ Environment Variables

Create a `.env.local` file in your root folder.

| Key | Purpose | Required | Example Value |
| :--- | :--- | :---: | :--- |
| `DATABASE_URL` | Neon database connection link | **Yes** | `postgresql://user:pwd@host/db?ssl=true` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client credentials | **Yes** | `pk_test_Y*****...` |
| `CLERK_SECRET_KEY` | Clerk server private credentials | **Yes** | ******`sk_test_JQ******...` |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Clerk Svix webhook signer validation key | **Yes** | `whsec_************...` |
| `NOMBA_ENV` | Nomba workspace selector | No | `sandbox` \| `production` |
| `NOMBA_CLIENT_ID` | Nomba developer client ID | **Yes** | `e******-***...` |
| `NOMBA_PRIVATE_KEY` | Nomba client secret key | **Yes** | `8/********...` (or `NOMBA_CLIENT_SECRET`) |
| `NOMBA_PARENT_ACCOUNT_ID` | Nomba primary account ID | **Yes** | `******-888e...` (or `NOMBA_ACCOUNT_ID`) |
| `NOMBA_SUB_ACCOUNT_ID` | Sub-account ID for virtual account routing | **Yes** | `5b4c8*****...` |
| `NOMBA_WEBHOOK_SIGNATURE_KEY` | Nomba Webhook HMAC validation key | **Yes** | `*********` |
| `RESEND_API_KEY` | Transactional email dispatcher key | **Yes** | `re_*******_...` |
| `EMAIL_FROM` | Dispatcher email header | No | `Circles <invitations@newnaija.ng>` |
| `CRON_SECRET` | Header key protecting inflow sync endpoint | No | `your-cron-header-token` |
| `NEXT_PUBLIC_SITE_URL` | Application base domain URL | No | `http://localhost:3000` |

---

## 💻 Local Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-org/circle.git
    cd circle
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Setup environment configurations:**
    *   Create a `.env.local` file and fill it using values from your Neon, Clerk, Nomba, and Resend developer portals.
4.  **Database Migration Compilation:**
    *   Compile database migrations:
        ```bash
        npm run generate
        ```
    *   Apply compiling scripts to Neon database:
        ```bash
        npm run migrate
        ```
5.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    *   Expose local server at `http://localhost:3000`.

---

## 🛠️ Development Commands

*   `npm run dev`: Fires dev server (Turbopack, port 3000).
*   `npm run build`: Compiles production assets.
*   `npm run lint`: Triggers ESLint checks (using Flat Config).
*   `npm run generate`: Generates Drizzle migrations based on schema updates.
*   `npm run migrate`: Syncs Neon DB with compiled migrations.
*   `npm run drop`: Drop the database tables (Development Sandbox only).
*   `npx tsc --noEmit`: Manually executes typescript compiler checks (recommended since next build ignores types for speed).

---

## ⛵ Deployment

### 1. Neon Database Setup
Deploy schema configurations to Neon. Connect server actions and migrations via the compiled database connection URL (`DATABASE_URL`).

### 2. Vercel Hosting
Configure Vercel with environment variables. Keep `NEXT_PUBLIC_` headers public and secure database credentials behind private locks.

### 3. Webhook Integration
Register Vercel endpoints on Clerk and Nomba consoles:
*   Clerk User Webhook: `https://your-domain.vercel.app/api/webhooks/clerk`
*   Nomba Payment Webhook: `https://your-domain.vercel.app/api/webhooks/nomba`

---

## 🔒 Security Model

*   **🛡️ Verification of Signatures:** Svix validation verifies Clerk webhooks, and HMAC-SHA256 hashing validates Nomba webhook requests.
*   **🚪 Middleware Page Access Gates:** Gated routes direct unauthenticated profiles to Clerk, and uncompleted onboarding paths to `/onboarding`.
*   **🚦 Role Controls:** Circle actions (payouts, settings edits, reconciliations) check database roles to ensure only owners, admins, or treasurers perform them.
*   **🧩 Anti-Race Guardrails:** Database unique indexes on table memberships, transaction references, and virtual account allocations prevent duplicate collections.

---

## ⚡ Performance Optimization

*   **💾 OAuth Token Caching:** In-memory caching prevents logging into Nomba on every request.
*   **⚡ Server-First Architecture:** Views fetch data on the server, minimizing client-side loading times.
*   **🔄 Instant Path Revalidations:** Next.js `revalidatePath` updates cache tags immediately after mutations.

---

## ♿ Accessibility

*   **🖥️ Semantic HTML5:** Circle uses clean semantic nodes (`<aside>`, `<nav>`, `<main>`, `<section>`).
*   **🌈 Responsive Tailwind Layout:** Adapts smoothly to desktop, tablet, and mobile views.
*   **📦 Radix UI Components:** Implements fully keyboard-accessible overlays (dialogs, select dropdowns).

---

## 🗺️ Roadmap

### Phase 1: Current Implementation 🟢
- [x] Clerk identity authentication and database syncing.
- [x] Onboarding workflow gates.
- [x] Nomba dynamic virtual account provisioning.
- [x] Webhook receivers and cron fallback inflows sync.
- [x] Manual deposit reconciliation and ledger mapping.

### Phase 2: Next Steps 🟡
- [ ] Direct automated matching algorithms for deposits.
- [ ] SMS notifications for payment due alerts.
- [ ] Support for multiple banking rails.

### Phase 3: Future Vision 🔵
- [ ] Escrow default protection insurance.
- [ ] Advanced accounting ledger exports (CSV, PDF).
- [ ] Multi-currency support (USD, GHS, KES).

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request with details on your proposed changes.

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 👥 Authors


*   **Micheal Agulonye** - Full Stack Developer - [GitHub](https://github.com/bullishdoteth)

---

## 🙏 Acknowledgements

*   **Nomba API Hackathon 2026** for the sandbox banking credentials and payment infrastructure support.
*   **Clerk Auth** and **Neon Database** for reliable serverless authentication and serverless PostgreSQL pools.
*   **shadcn/ui** and **Radix UI** for interactive component primitives.

---

<div align="center">
  <sub>Circle Community Finance. Built with ❤️ for Demo Day 2026.</sub>
</div>
