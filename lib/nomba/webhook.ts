import crypto from 'node:crypto';
import type { NombaWebhookPayload } from './types';

/**
 * Nomba webhook signature verification.
 *
 * Nomba signs each delivery by building a colon-joined string from selected
 * payload fields plus the `nomba-timestamp` header, computing an HMAC-SHA256
 * with your dashboard signature key, and base64-encoding it. We recompute the
 * same value and compare it (constant-time) against the `nomba-signature`
 * header.
 *
 * Field order (per docs):
 *   {event_type}:{requestId}:{userId}:{walletId}:{transactionId}:{type}:{time}:{responseCode}:{timestamp}
 * where userId/walletId come from `data.merchant`, and
 * transactionId/type/time/responseCode from `data.transaction`. A literal
 * `responseCode` of "null" is treated as an empty string.
 */

export type NombaWebhookVerification =
    | { valid: true; payload: NombaWebhookPayload }
    | { valid: false; reason: string };

/** Coerce a field to string for the signature line; nullish → "". */
function part(value: unknown): string {
    if (value === undefined || value === null) return '';
    return String(value);
}

function buildSignatureString(
    payload: NombaWebhookPayload,
    timestamp: string
): string {
    const merchant = payload.data?.merchant ?? {};
    const transaction = payload.data?.transaction ?? {};

    let responseCode = part(transaction.responseCode);
    if (responseCode === 'null') responseCode = '';

    return [
        part(payload.event_type),
        part(payload.requestId),
        part(merchant.userId),
        part(merchant.walletId),
        part(transaction.transactionId),
        part(transaction.type),
        part(transaction.time),
        responseCode,
        part(timestamp),
    ].join(':');
}

function computeSignature(signatureString: string, secret: string): string {
    return crypto
        .createHmac('sha256', secret)
        .update(signatureString, 'utf8')
        .digest('base64');
}

/** Constant-time comparison that never throws on length mismatch. */
function safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verify a raw webhook body against the `nomba-signature` header.
 *
 * @param rawBody   The exact request body string (do not re-serialize).
 * @param signature The `nomba-signature` header value.
 * @param timestamp The `nomba-timestamp` header value.
 * @param secret    The signature key configured on the Nomba dashboard
 *                  (defaults to `NOMBA_WEBHOOK_SIGNATURE_KEY`).
 */
export function verifyNombaWebhook(
    rawBody: string,
    signature: string | null | undefined,
    timestamp: string | null | undefined,
    secret: string | undefined = process.env.NOMBA_WEBHOOK_SIGNATURE_KEY
): NombaWebhookVerification {
    if (!secret) {
        return { valid: false, reason: 'Missing NOMBA_WEBHOOK_SIGNATURE_KEY' };
    }
    if (!signature) {
        return { valid: false, reason: 'Missing nomba-signature header' };
    }
    if (!timestamp) {
        return { valid: false, reason: 'Missing nomba-timestamp header' };
    }

    let payload: NombaWebhookPayload;
    try {
        payload = JSON.parse(rawBody) as NombaWebhookPayload;
    } catch {
        return { valid: false, reason: 'Body is not valid JSON' };
    }

    const expected = computeSignature(
        buildSignatureString(payload, timestamp),
        secret
    );

    if (!safeEqual(expected, signature)) {
        return { valid: false, reason: 'Signature mismatch' };
    }

    return { valid: true, payload };
}
