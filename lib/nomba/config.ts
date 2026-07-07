import { config as loadEnv } from 'dotenv';

// Mirror lib/db/db.ts so the client also works in non-Next contexts (scripts, drizzle-kit).
// Next.js loads .env.local automatically at runtime, so this is a harmless no-op there.
loadEnv({ path: './.env.local' });

export type NombaEnvironment = 'sandbox' | 'production';

const BASE_URLS: Record<NombaEnvironment, string> = {
    sandbox: 'https://sandbox.nomba.com',
    production: 'https://api.nomba.com',
};

export interface NombaConfig {
    environment: NombaEnvironment;
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    accountId: string;
    subAccountId: string;
}

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(
            `[nomba] Missing required environment variable: ${name}. ` +
                `Add it to .env.local.`
        );
    }
    return value;
}

/**
 * Resolve Nomba configuration from the environment.
 *
 * Environment is selected via `NOMBA_ENV` ("sandbox" | "production", defaults
 * to "sandbox"). An explicit `NOMBA_BASE_URL` overrides the derived base URL.
 *
 * Required vars: `NOMBA_CLIENT_ID`, `NOMBA_CLIENT_SECRET`, `NOMBA_ACCOUNT_ID`.
 */
export function getNombaConfig(): NombaConfig {
    const rawEnv = (process.env.NOMBA_ENV ?? 'sandbox').toLowerCase();
    const environment: NombaEnvironment =
        rawEnv === 'production' ? 'production' : 'sandbox';

    const baseUrl = (
        process.env.NOMBA_BASE_URL || BASE_URLS[environment]
    ).replace(/\/+$/, '');

    const clientId = process.env.NOMBA_CLIENT_ID || '';
    if (!clientId) {
        throw new Error(
            "[nomba] Missing required environment variable: NOMBA_CLIENT_ID. Add it to .env.local."
        );
    }

    const clientSecret =
        process.env.NOMBA_CLIENT_SECRET || process.env.NOMBA_PRIVATE_KEY || '';
    if (!clientSecret) {
        throw new Error(
            "[nomba] Missing required environment variable: NOMBA_CLIENT_SECRET or NOMBA_PRIVATE_KEY. Add it to .env.local."
        );
    }

    const accountId =
        process.env.NOMBA_ACCOUNT_ID || process.env.NOMBA_PARENT_ACCOUNT_ID || '';
    if (!accountId) {
        throw new Error(
            "[nomba] Missing required environment variable: NOMBA_ACCOUNT_ID or NOMBA_PARENT_ACCOUNT_ID. Add it to .env.local."
        );
    }

    const subAccountId = process.env.NOMBA_SUB_ACCOUNT_ID || '';
    if (!subAccountId) {
        throw new Error(
            "[nomba] Missing required environment variable: NOMBA_SUB_ACCOUNT_ID. Add it to .env.local."
        );
    }

    return {
        environment,
        baseUrl,
        clientId,
        clientSecret,
        accountId,
        subAccountId,
    };
}
