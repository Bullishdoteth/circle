---
title: API Reference
description: Complete endpoint specification for webhooks, cron syncs, and custom endpoints.
lastUpdated: July 7, 2026
---

# API Reference

This page documents the API endpoints exposed by Circle. These endpoints handle webhook events from third-party integrations and trigger scheduled background jobs.

---

## 1. Clerk User Sync Webhook

Processes user events (creation, updates, deletion) dispatched by Clerk to maintain a synced local database profile.

- **URL:** `/api/webhooks/clerk`
- **Method:** `POST`
- **Authentication:** Svix Webhook Signature (verifies headers: `svix-id`, `svix-timestamp`, `svix-signature` using the `CLERK_WEBHOOK_SIGNING_SECRET`).
- **Events Handled:**
  - `user.created`: Inserts a new user record.
  - `user.updated`: Updates profile details (email, image, name, etc.).
  - `user.deleted`: Deletes the user record from the database.

### Example Payload (`user.created`)
```json
{
  "type": "user.created",
  "data": {
    "id": "user_2bF...",
    "first_name": "Ada",
    "last_name": "Lovelace",
    "username": "ada",
    "email_addresses": [
      {
        "id": "email_123",
        "email_address": "ada@gmail.com"
      }
    ],
    "primary_email_address_id": "email_123",
    "image_url": "https://img.clerk.com/..."
  }
}
```

### Responses
- **`200 OK`**: Event processed successfully.
  ```json
  { "success": true }
  ```
- **`400 Bad Request`**: Missing headers or invalid signature.
  ```json
  { "error": "Invalid webhook signature" }
  ```
- **`500 Internal Server Error`**: Database transaction failure.

---

## 2. Nomba Webhook Receiver

Captures payment notifications (successful deposits, payouts statuses) from Nomba.

- **URL:** `/api/webhooks/nomba`
- **Method:** `POST`
- **Authentication:** HMAC-SHA256 Signature (verifies header `nomba-signature` and `nomba-timestamp` using the `NOMBA_WEBHOOK_SIGNATURE_KEY`).
- **Events Handled:**
  - `payment_success`: Logs an unreconciled contribution.
  - `payment_failed` / `payment_reversal`: Updates contribution status.
  - `payout_success` / `payout_failed` / `payout_refund`: Updates payout state and alerts user.

### Example Payload (`payment_success`)
```json
{
  "event_type": "payment_success",
  "requestId": "req_xyz",
  "data": {
    "transaction": {
      "transactionId": "tx_987654",
      "amount": 5000000,
      "bankAccountNumber": "0123456789",
      "senderName": "Sola Coker",
      "senderBank": "Zenith Bank"
    }
  }
}
```

### Responses
- **`200 OK`**: Event logged successfully.
  ```json
  { "success": true }
  ```
- **`400 Bad Request`**: Invalid signature.
  ```json
  { "error": "Verification failed" }
  ```
- **`500 Internal Server Error`**: Database connection error. (Tells Nomba to retry with backoff).

---

## 3. Cron Inflow Synchronizer

A fallback endpoint that polls Nomba's transaction log to sync any deposits missed by webhooks.

- **URL:** `/api/cron/sync-inflows`
- **Method:** `GET`
- **Authentication:** Bearer token check. Verifies the `Authorization: Bearer <CRON_SECRET>` header.
- **Workflow:**
  1. Fetches all active circles from the database.
  2. Queries Nomba for the last 100 transactions on the merchant account.
  3. Matches transactions with `status: SUCCESS` against registered virtual account numbers.
  4. If a match is found and the transaction ID does not exist in the database, it inserts a new, unreconciled contribution.

### Responses
- **`200 OK`**: Sync completed successfully.
  ```json
  {
    "success": true,
    "syncedCount": 3
  }
  ```
- **`401 Unauthorized`**: Missing or incorrect bearer token.
  ```json
  { "error": "Unauthorized" }
  ```
- **`500 Internal Server Error`**: Nomba API or database query failure.
