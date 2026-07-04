/**
 * Standard Nomba envelope. Every response carries a `code` — `"00"` means
 * success; any other value is an error, regardless of HTTP status.
 */
export interface NombaResponse<T> {
    code: string;
    description: string;
    data: T;
}

export const NOMBA_SUCCESS_CODE = '00';

/** `data` payload returned by token issue and token refresh. */
export interface NombaTokenData {
    businessId: string;
    access_token: string;
    refresh_token: string;
    /** Expiration timestamp (ISO 8601). */
    expiresAt: string;
}

/** Webhook event types Nomba can deliver. */
export const NOMBA_WEBHOOK_EVENTS = [
    'payment_success',
    'payout_success',
    'payment_failed',
    'payment_reversal',
    'payout_failed',
    'payout_refund',
] as const;

export type NombaWebhookEventType = (typeof NOMBA_WEBHOOK_EVENTS)[number];

/**
 * Shape of an inbound webhook body. Only the fields used for signature
 * verification are typed; the rest of `data` is passed through.
 */
export interface NombaWebhookPayload {
    event_type: string;
    requestId?: string;
    data?: {
        merchant?: {
            userId?: string;
            walletId?: string;
            [key: string]: unknown;
        };
        transaction?: {
            transactionId?: string;
            type?: string;
            time?: string;
            responseCode?: string | number | null;
            [key: string]: unknown;
        };
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

/**
 * Thrown when Nomba returns a non-`"00"` `code` or the HTTP call fails.
 * Carries the Nomba `code`/`description` so callers can branch on them.
 */
export class NombaError extends Error {
    readonly code: string;
    readonly httpStatus?: number;
    readonly description?: string;

    constructor(
        message: string,
        opts: { code: string; httpStatus?: number; description?: string }
    ) {
        super(message);
        this.name = 'NombaError';
        this.code = opts.code;
        this.httpStatus = opts.httpStatus;
        this.description = opts.description;
    }
}
