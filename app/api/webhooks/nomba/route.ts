import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { db } from '@/lib/db/db';
import { eq } from 'drizzle-orm';
import { virtualAccounts, contributions, payouts } from '@/lib/db/schema';
import { verifyNombaWebhook } from '@/lib/nomba/webhook';
import type { NombaWebhookPayload } from '@/lib/nomba/types';

// node:crypto (HMAC) requires the Node.js runtime, not edge.
export const runtime = 'nodejs';

/**
 * Nomba webhook receiver.
 *
 * Verifies the HMAC-SHA256 signature, then dispatches by `event_type`.
 * Responds 2XX on success/ignored so Nomba stops retrying; 400 on a bad
 * signature or missing headers.
 */
export async function POST(req: Request) {
    console.log('[Nomba Webhook] Incoming request');

    try {
        // Raw body is required — verification must run against the exact bytes.
        const rawBody = await req.text();
        const headerPayload = await headers();

        const signature = headerPayload.get('nomba-signature');
        const timestamp = headerPayload.get('nomba-timestamp');

        const result = verifyNombaWebhook(rawBody, signature, timestamp);

        if (!result.valid) {
            console.error('[Nomba Webhook] Verification failed', {
                reason: result.reason,
            });

            // A missing secret is our misconfiguration, not a bad request.
            const status = result.reason.includes('NOMBA_WEBHOOK_SIGNATURE_KEY')
                ? 500
                : 400;

            return NextResponse.json({ error: result.reason }, { status });
        }

        const event = result.payload;
        const eventType = event.event_type;

        console.log('[Nomba Webhook] Verification successful', {
            eventType,
            transactionId: event.data?.transaction?.transactionId,
        });

        try {
            await handleEvent(event);
        } catch (error) {
            console.error('[Nomba Webhook] Event handling failed', {
                eventType,
                error,
            });

            // Return 500 so Nomba retries with backoff.
            return NextResponse.json(
                { error: 'Event handling failed' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('[Nomba Webhook] Unexpected error', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Dispatch a verified event. Handles virtual account deposit mapping
 * and payout status updates.
 */
async function handleEvent(event: NombaWebhookPayload): Promise<void> {
    const paymentDetails = event.data?.paymentDetails as any;
    const virtualAccount = event.data?.virtualAccount as any;
    const transaction = event.data?.transaction as any;

    const bankAccountNumber = 
        paymentDetails?.accountNumber || 
        paymentDetails?.bankAccountNumber ||
        virtualAccount?.accountNumber || 
        virtualAccount?.bankAccountNumber ||
        transaction?.bankAccountNumber ||
        transaction?.accountNumber ||
        (event.data as any)?.bankAccountNumber;

    const accountRef = 
        virtualAccount?.accountRef || 
        virtualAccount?.accountReference || 
        transaction?.accountRef ||
        transaction?.accountReference ||
        (event.data as any)?.accountRef;

    const transactionId = 
        transaction?.transactionId || 
        (event.data as any)?.transactionId || 
        event.requestId;

    const amount = 
        transaction?.amount || 
        paymentDetails?.amount || 
        (event.data as any)?.amount || 
        '0.00';

    switch (event.event_type) {
        case 'payment_success': {
            if (!transactionId) {
                throw new Error('payment_success event missing transaction ID');
            }

            console.log('[Nomba Webhook] processing payment_success', {
                transactionId,
                bankAccountNumber,
                accountRef,
                amount,
            });

            // Find matching virtual account in DB
            let vaRecord = null;
            if (bankAccountNumber) {
                [vaRecord] = await db
                    .select()
                    .from(virtualAccounts)
                    .where(eq(virtualAccounts.bankAccountNumber, bankAccountNumber))
                    .limit(1);
            }
            if (!vaRecord && accountRef) {
                [vaRecord] = await db
                    .select()
                    .from(virtualAccounts)
                    .where(eq(virtualAccounts.accountRef, accountRef))
                    .limit(1);
            }

            if (!vaRecord) {
                console.warn('[Nomba Webhook] No matching virtual account found for deposit.', {
                    bankAccountNumber,
                    accountRef,
                });
                return;
            }

            // Check if contribution already exists (idempotency check)
            const [existing] = await db
                .select()
                .from(contributions)
                .where(eq(contributions.reference, transactionId))
                .limit(1);

            if (existing) {
                console.log('[Nomba Webhook] Contribution already exists, skipping duplicate.', { transactionId });
                if (existing.status !== 'success') {
                    await db
                        .update(contributions)
                        .set({ status: 'success', updatedAt: new Date() })
                        .where(eq(contributions.id, existing.id));
                }
                return;
            }

            // Retrieve sender info if present
            const senderName = transaction?.senderName || transaction?.senderAccountName || paymentDetails?.senderName || null;
            const senderBank = transaction?.senderBank || paymentDetails?.senderBank || null;
            const senderAccountNumber = transaction?.senderAccountNumber || paymentDetails?.senderAccountNumber || null;

            // Insert unreconciled contribution
            await db.insert(contributions).values({
                circleId: vaRecord.circleId,
                userId: null, // Initially unmatched
                amount: String(amount),
                status: 'success',
                reference: transactionId,
                senderName,
                senderBank,
                senderAccountNumber,
                reconciled: false,
                rawPayload: JSON.stringify(event),
            });
            console.log('[Nomba Webhook] Unreconciled contribution recorded successfully.');
            break;
        }

        case 'payment_failed':
        case 'payment_reversal': {
            if (transactionId) {
                const newStatus = event.event_type === 'payment_failed' ? 'failed' : 'reversed';
                await db
                    .update(contributions)
                    .set({
                        status: newStatus,
                        updatedAt: new Date(),
                    })
                    .where(eq(contributions.reference, transactionId));
                console.log(`[Nomba Webhook] Updated contribution ${transactionId} status to: ${newStatus}`);
            }
            break;
        }

        case 'payout_success':
        case 'payout_failed': {
            const payoutRef = transaction?.merchantTxRef || transactionId;
            if (payoutRef) {
                const newStatus = event.event_type === 'payout_success' ? 'success' : 'failed';
                await db
                    .update(payouts)
                    .set({
                        status: newStatus,
                        updatedAt: new Date(),
                    })
                    .where(eq(payouts.reference, payoutRef));
                console.log(`[Nomba Webhook] Updated payout ${payoutRef} status to: ${newStatus}`);
            }
            break;
        }

        case 'payout_refund': {
            const payoutRef = transaction?.merchantTxRef || transactionId;
            if (payoutRef) {
                await db
                    .update(payouts)
                    .set({
                        status: 'refunded',
                        updatedAt: new Date(),
                    })
                    .where(eq(payouts.reference, payoutRef));
                console.log(`[Nomba Webhook] Updated payout ${payoutRef} status to: refunded`);
            }
            break;
        }

        default:
            console.log('[Nomba Webhook] Ignoring event', {
                eventType: event.event_type,
            });
            break;
    }
}
