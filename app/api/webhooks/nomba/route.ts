import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { db } from '@/lib/db/db';
import { eq, and, inArray } from 'drizzle-orm';
import { virtualAccounts, contributions, payouts, circleMembers, circles } from '@/lib/db/schema';
import { verifyNombaWebhook } from '@/lib/nomba/webhook';
import type { NombaWebhookPayload } from '@/lib/nomba/types';
import { createNotificationAction } from '@/lib/actions/notifications';

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
                amount: String(parseFloat(String(amount)) / 100),
                status: 'success',
                reference: transactionId,
                senderName,
                senderBank,
                senderAccountNumber,
                reconciled: false,
                rawPayload: JSON.stringify(event),
            });
            console.log('[Nomba Webhook] Unreconciled contribution recorded successfully.');

            // Notify all active managers of this circle about the new deposit
            try {
                const managers = await db
                    .select({ userId: circleMembers.userId })
                    .from(circleMembers)
                    .where(
                        and(
                            eq(circleMembers.circleId, vaRecord.circleId),
                            eq(circleMembers.status, 'active'),
                            inArray(circleMembers.role, ['owner', 'admin', 'treasurer'])
                        )
                    );

                const [circle] = await db
                    .select({ name: circles.name })
                    .from(circles)
                    .where(eq(circles.id, vaRecord.circleId))
                    .limit(1);

                const amountFormatted = parseFloat(String(amount)).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });

                for (const manager of managers) {
                    await createNotificationAction({
                        userId: manager.userId,
                        circleId: vaRecord.circleId,
                        title: 'New Deposit Received',
                        message: `A deposit of ₦${amountFormatted} from ${senderName || 'Unknown Sender'} has been received for "${circle?.name || 'your circle'}". Please reconcile this deposit.`,
                        type: 'transaction_incoming',
                    });
                }
            } catch (notifErr) {
                console.error('[Nomba Webhook] Failed to send incoming deposit notifications:', notifErr);
            }
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

                // Notify recipient of final payout status
                try {
                    const [payoutRecord] = await db
                        .select()
                        .from(payouts)
                        .where(eq(payouts.reference, payoutRef))
                        .limit(1);

                    if (payoutRecord && payoutRecord.userId) {
                        const amountFormatted = parseFloat(payoutRecord.amount).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        });
                        await createNotificationAction({
                            userId: payoutRecord.userId,
                            circleId: payoutRecord.circleId,
                            title: event.event_type === 'payout_success' ? 'Payout Disbursed' : 'Payout Failed',
                            message: event.event_type === 'payout_success'
                                ? `Your payout of ₦${amountFormatted} for ${payoutRecord.round} has been successfully disbursed to your personal bank account.`
                                : `The payout of ₦${amountFormatted} for ${payoutRecord.round} failed to process.`,
                            type: event.event_type === 'payout_success' ? 'payout_success' : 'payout_failed',
                        });
                    }
                } catch (notifErr) {
                    console.error('[Nomba Webhook] Failed to send payout status notification:', notifErr);
                }
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

                // Notify recipient of refund status
                try {
                    const [payoutRecord] = await db
                        .select()
                        .from(payouts)
                        .where(eq(payouts.reference, payoutRef))
                        .limit(1);

                    if (payoutRecord && payoutRecord.userId) {
                        const amountFormatted = parseFloat(payoutRecord.amount).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        });
                        await createNotificationAction({
                            userId: payoutRecord.userId,
                            circleId: payoutRecord.circleId,
                            title: 'Payout Refunded',
                            message: `The payout of ₦${amountFormatted} for ${payoutRecord.round} has been returned and refunded back to the circle's wallet.`,
                            type: 'payout_refunded',
                        });
                    }
                } catch (notifErr) {
                    console.error('[Nomba Webhook] Failed to send payout refund notification:', notifErr);
                }
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
