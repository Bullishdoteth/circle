import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

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
 * Dispatch a verified event. Persistence is stubbed — Circle has no
 * transactions/payments table yet; wire these to DB writes when contribution
 * and payout ledgers land.
 */
async function handleEvent(event: NombaWebhookPayload): Promise<void> {
    const transactionId = event.data?.transaction?.transactionId;

    switch (event.event_type) {
        case 'payment_success':
            // TODO: mark contribution as paid, credit the circle.
            console.log('[Nomba Webhook] payment_success', { transactionId });
            break;

        case 'payment_failed':
            // TODO: mark contribution attempt as failed.
            console.log('[Nomba Webhook] payment_failed', { transactionId });
            break;

        case 'payment_reversal':
            // TODO: reverse a previously credited contribution.
            console.log('[Nomba Webhook] payment_reversal', { transactionId });
            break;

        case 'payout_success':
            // TODO: mark payout as completed.
            console.log('[Nomba Webhook] payout_success', { transactionId });
            break;

        case 'payout_failed':
            // TODO: mark payout as failed, release the hold.
            console.log('[Nomba Webhook] payout_failed', { transactionId });
            break;

        case 'payout_refund':
            // TODO: record refunded payout back to the circle balance.
            console.log('[Nomba Webhook] payout_refund', { transactionId });
            break;

        default:
            console.log('[Nomba Webhook] Ignoring event', {
                eventType: event.event_type,
            });
            break;
    }
}
