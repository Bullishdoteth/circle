import { getNombaConfig } from './config';
import {
    NombaError,
    NOMBA_SUCCESS_CODE,
    type NombaResponse,
    type NombaTokenData,
} from './types';

/**
 * Low-level Nomba HTTP client: OAuth token lifecycle + a typed request wrapper.
 *
 * Server-only. Import from server actions / route handlers, never from client
 * components — it reads `NOMBA_CLIENT_SECRET`.
 */

/** Refresh this many ms before the token's stated expiry. */
const EXPIRY_BUFFER_MS = 5 * 60 * 1000;
/** Fallback lifetime if `expiresAt` is unparseable (docs: ~30 min). */
const FALLBACK_LIFETIME_MS = 30 * 60 * 1000;

interface CachedToken {
    accessToken: string;
    refreshToken: string;
    /** Epoch ms after which the access token should be considered stale. */
    expiresAtMs: number;
}

// Module-level cache. Persists for the lifetime of the server runtime/lambda,
// so we avoid re-issuing a token on every request.
let cache: CachedToken | null = null;
// De-dupes concurrent auth attempts into a single network call.
let inflight: Promise<string> | null = null;

function parseExpiry(expiresAt: string): number {
    const parsed = Date.parse(expiresAt);
    if (Number.isNaN(parsed)) {
        return Date.now() + FALLBACK_LIFETIME_MS;
    }
    return parsed;
}

function isFresh(token: CachedToken | null): boolean {
    return !!token && Date.now() < token.expiresAtMs - EXPIRY_BUFFER_MS;
}

/** Raw auth POST — bypasses the request wrapper (issue has no bearer yet). */
async function postAuth(
    path: string,
    body: Record<string, string>,
    extraHeaders: Record<string, string> = {}
): Promise<NombaTokenData> {
    const { baseUrl, accountId } = getNombaConfig();

    let res: Response;
    try {
        res = await fetch(`${baseUrl}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                accountId,
                ...extraHeaders,
            },
            body: JSON.stringify(body),
            cache: 'no-store',
        });
    } catch (err) {
        throw new NombaError(
            `Network error calling Nomba auth (${path}): ${
                err instanceof Error ? err.message : String(err)
            }`,
            { code: 'NETWORK_ERROR' }
        );
    }

    const json = (await res
        .json()
        .catch(() => null)) as NombaResponse<NombaTokenData> | null;

    if (!json) {
        throw new NombaError(
            `Nomba auth (${path}) returned a non-JSON response (HTTP ${res.status}).`,
            { code: 'INVALID_RESPONSE', httpStatus: res.status }
        );
    }

    if (json.code !== NOMBA_SUCCESS_CODE || !json.data?.access_token) {
        throw new NombaError(
            `Nomba auth failed (${path}): ${json.description || 'unknown error'}`,
            { code: json.code, httpStatus: res.status, description: json.description }
        );
    }

    return json.data;
}

function storeToken(data: NombaTokenData): string {
    cache = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAtMs: parseExpiry(data.expiresAt),
    };
    return cache.accessToken;
}

async function issueToken(): Promise<string> {
    const { clientId, clientSecret } = getNombaConfig();
    const data = await postAuth('/v1/auth/token/issue', {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
    });
    return storeToken(data);
}

async function refreshToken(current: CachedToken): Promise<string> {
    const data = await postAuth(
        '/v1/auth/token/refresh',
        { grant_type: 'refresh_token', refresh_token: current.refreshToken },
        { Authorization: `Bearer ${current.accessToken}` }
    );
    return storeToken(data);
}

/**
 * Return a valid access token, refreshing or issuing as needed. Concurrent
 * callers share a single in-flight auth request.
 */
export async function getAccessToken(): Promise<string> {
    const current = cache;
    if (current && isFresh(current)) return current.accessToken;

    if (!inflight) {
        const stale = current;
        inflight = (async () => {
            // Try refresh when we have a refresh token; fall back to a fresh issue.
            if (stale?.refreshToken) {
                try {
                    return await refreshToken(stale);
                } catch {
                    return await issueToken();
                }
            }
            return await issueToken();
        })().finally(() => {
            inflight = null;
        });
    }

    return inflight;
}

/** Force-invalidate the cached token (e.g. after a 401 or a revoke). */
export function clearNombaToken(): void {
    cache = null;
}

export interface NombaRequestOptions {
    /** JSON body; serialized automatically. */
    body?: unknown;
    /** Extra headers merged over the defaults. */
    headers?: Record<string, string>;
    /** Value for the `X-Idempotent-key` header (use for transfers). */
    idempotencyKey?: string;
    /** Query params appended to the path. */
    query?: Record<string, string | number | undefined>;
}

function buildUrl(
    baseUrl: string,
    path: string,
    query?: NombaRequestOptions['query']
): string {
    const url = `${baseUrl}${path}`;
    if (!query) return url;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) params.set(key, String(value));
    }
    const qs = params.toString();
    return qs ? `${url}?${qs}` : url;
}

/**
 * Make an authenticated Nomba request and return the unwrapped `data`.
 *
 * Handles auth headers, token refresh, one automatic retry on 401, and
 * envelope validation — throws {@link NombaError} unless `code === "00"`.
 */
export async function nombaRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    options: NombaRequestOptions = {}
): Promise<T> {
    const { baseUrl, accountId } = getNombaConfig();
    const url = buildUrl(baseUrl, path, options.query);

    const doFetch = async (token: string): Promise<Response> => {
        const headers: Record<string, string> = {
            Authorization: `Bearer ${token}`,
            accountId,
            'Content-Type': 'application/json',
            ...options.headers,
        };
        if (options.idempotencyKey) {
            headers['X-Idempotent-key'] = options.idempotencyKey;
        }

        return fetch(url, {
            method,
            headers,
            body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
            cache: 'no-store',
        });
    };

    let res: Response;
    try {
        res = await doFetch(await getAccessToken());
        // Auth expired server-side despite our buffer — refresh once and retry.
        if (res.status === 401) {
            clearNombaToken();
            res = await doFetch(await getAccessToken());
        }
    } catch (err) {
        if (err instanceof NombaError) throw err;
        throw new NombaError(
            `Network error calling Nomba (${method} ${path}): ${
                err instanceof Error ? err.message : String(err)
            }`,
            { code: 'NETWORK_ERROR' }
        );
    }

    const json = (await res
        .json()
        .catch(() => null)) as NombaResponse<T> | null;

    if (!json) {
        throw new NombaError(
            `Nomba (${method} ${path}) returned a non-JSON response (HTTP ${res.status}).`,
            { code: 'INVALID_RESPONSE', httpStatus: res.status }
        );
    }

    if (json.code !== NOMBA_SUCCESS_CODE) {
        throw new NombaError(
            `Nomba request failed (${method} ${path}): ${
                json.description || 'unknown error'
            }`,
            { code: json.code, httpStatus: res.status, description: json.description }
        );
    }

    return json.data;
}
