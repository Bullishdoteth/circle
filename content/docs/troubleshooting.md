---
title: Troubleshooting
description: Common issues, debugging checklists, and deployment resolution guides.
lastUpdated: July 7, 2026
---

# Troubleshooting Guide

This guide details common issues encountered during local development or production deployment, along with steps to resolve them.

---

## 1. Clerk Authentication & Session Issues

### Users Stuck in Onboarding Loop
- **Symptom:** A logged-in user is redirected back to `/onboarding` even after completing the steps.
- **Cause:** Clerk's session token does not yet contain the updated `onboardingComplete: true` claim in its metadata.
- **Solution:**
  1. Verify the `completeOnboarding` server action ran successfully without errors.
  2. Ensure the client code executes `await user?.reload()` before calling `router.push('/dashboard')`. This refreshes the session token.
  3. Clear browser cookies and re-authenticate to force-fetch a fresh token.

### Clerk Webhook Validation Failures
- **Symptom:** Clerk triggers a webhook, but the server returns a `400 Bad Request` or `Invalid signature` error.
- **Cause:** The `CLERK_WEBHOOK_SIGNING_SECRET` does not match the webhook configuration in the Clerk dashboard.
- **Solution:**
  1. Retrieve the signing secret (`whsec_...`) from the webhook settings in your Clerk dashboard.
  2. Update the `CLERK_WEBHOOK_SIGNING_SECRET` variable in your `.env.local` file.
  3. Ensure you are sending the raw request body (`await req.text()`) to the Svix verifier, as signature verification will fail if the body is parsed.

---

## 2. Nomba Integration Errors

### Webhook Signature Fails Verification
- **Symptom:** Incoming Nomba webhooks return `400 Bad Request`.
- **Cause:** The `NOMBA_WEBHOOK_SIGNATURE_KEY` is incorrect or missing.
- **Solution:**
  1. Verify the secret key in your Nomba developer dashboard.
  2. Ensure the request headers include `nomba-signature` and `nomba-timestamp`.
  3. Make sure the HMAC generation uses the raw request body (`await req.text()`).

### Virtual Account Creation Fails
- **Symptom:** Creating a circle fails with a "Failed to create Nomba virtual account" error.
- **Cause:** The sub-account configuration is incorrect, or the Nomba sandbox API is experiencing downtime.
- **Solution:**
  1. Confirm your `NOMBA_SUB_ACCOUNT_ID` is correctly configured in your environment variables.
  2. Check the Nomba developer portal status page to ensure their sandbox environment is online.

---

## 3. Database & Migration Issues

### Database Out of Sync
- **Symptom:** Database errors like `relation "users" does not exist` or missing columns.
- **Cause:** Migrations have not been applied to the Neon database instance.
- **Solution:**
  1. Run `npm run generate` to compile any pending schema modifications.
  2. Run `npm run migrate` to apply these changes to the active database.

---

## 4. Hydration Errors

### Text Content Mismatch
- **Symptom:** Next.js console warning: `Text content did not match. Server: "..." Client: "..."`.
- **Cause:** Rendering dates, times, or random IDs on the server that change when loaded in the browser.
- **Solution:**
  1. Avoid using functions like `new Date()` or `Math.random()` directly in component JSX.
  2. Wrap dynamic date formatting logic in a `useEffect` hook so it runs only on the client:
     ```typescript
     const [formattedDate, setFormattedDate] = useState('');
     useEffect(() => {
         setFormattedDate(new Date(dateString).toLocaleDateString());
     }, [dateString]);
     ```
