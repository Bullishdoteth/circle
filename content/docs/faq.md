---
title: FAQ
description: Developer Frequently Asked Questions about business logic, payment rails, and tech stack decisions.
lastUpdated: July 7, 2026
---

# Frequently Asked Questions (FAQ)

Here are answers to common questions developers ask when working on the Circle codebase.

---

## 1. Why does Circle require manual deposit reconciliation?

### Q: Why can't deposits be automatically matched to users?
**A:** Traditional bank transfers in Nigeria (sent via bank apps or USSD) only carry the sender's name and bank account number in the transaction payload. They do not carry a user ID or circle-specific metadata. 
While we parse the sender's name and bank info, name formats can vary (e.g. `Adamu Ibrahim` vs `A. Ibrahim`). To prevent mistakes and ensure correct ledger records, Circle logs the deposit as `unreconciled`. A circle manager or treasurer then reviews the sender details and matches the deposit to the correct member.

---

## 2. How are payout dates calculated?

### Q: How does the system determine when a member is paid?
**A:** Payout schedules are determined by a member's position in the rotation list and the circle's contribution frequency (weekly, monthly):
- **Position 1:** Paid at the end of the first period.
- **Position 2:** Paid at the end of the second period.
The estimated dates are calculated by adding the contribution frequency interval to the circle's activation date multiplied by the member's rotation index:
```typescript
const payoutDate = new Date(circleActivationDate);
payoutDate.setMonth(payoutDate.getMonth() + member.rotationPosition);
```

---

## 3. How do we test payments locally?

### Q: How do we test webhooks and bank deposits in development?
**A:** To test payment flows locally:
1. **Use a Webhook Tunnel:** Run a tool like **ngrok** or **Localtunnel** to expose your local port `3000` to the internet.
   ```bash
   ngrok http 3000
   ```
2. **Configure Webhook URLs:** In your Clerk and Nomba developer dashboards, set the webhook endpoints to point to your tunnel URL:
   - Clerk: `https://<tunnel-id>.ngrok-free.app/api/webhooks/clerk`
   - Nomba: `https://<tunnel-id>.ngrok-free.app/api/webhooks/nomba`
3. **Simulate Webhook Payloads:** You can send mock payloads using tools like Postman or Insomnia to verify your endpoints handle success, failure, and signature checks correctly.

---

## 4. Why are there no custom hooks in the project?

### Q: I noticed there isn't a `hooks/` folder. Should I add one?
**A:** Circle utilizes Next.js **Server Actions** (`lib/actions/`) for data mutations, combined with standard React hooks (`useState`, `useEffect`) in Client Components. 
Since most state transitions are handled directly on the server and revalidated via path tags, custom hooks for state management or data fetching are not needed. Feel free to create a `hooks/` folder if you need to implement reusable client-side utilities (e.g., event listeners or viewport dimensions).
