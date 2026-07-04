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
        process.env.NOMBA_BASE_URL ?? BASE_URLS[environment]
    ).replace(/\/+$/, '');

    return {
        environment,
        baseUrl,
        clientId: requireEnv('NOMBA_CLIENT_ID'),
        clientSecret: requireEnv('NOMBA_CLIENT_SECRET'),
        accountId: requireEnv('NOMBA_ACCOUNT_ID'),
    };
}
