'use server';

import { auth } from '@clerk/nextjs/server';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/db';
import { payouts, circles, users, circleMembers } from '@/lib/db/schema';
import { nombaRequest } from '@/lib/nomba';
import type { ActionResponse } from './circle';

export interface PayoutRecord {
    id: string;
    circleId: string;
    userId: string;
    userName?: string | null;
    userEmail?: string | null;
    amount: string;
    status: string;
    reference: string;
    destinationBank: string;
    destinationAccountNumber: string;
    destinationAccountName: string;
    round: string | null;
    createdAt: string | Date;
}

export interface NombaBank {
    code: string;
    name: string;
}

/**
 * Fetch all payouts for a circle
 */
export async function getPayoutsAction(
    circleSlug: string
): Promise<ActionResponse<PayoutRecord[]>> {
    try {
        const [circle] = await db
            .select()
            .from(circles)
            .where(and(eq(circles.slug, circleSlug), isNull(circles.deletedAt)))
            .limit(1);

        if (!circle) {
            return { success: false, error: 'Circle not found' };
        }

        const rows = await db
            .select({
                payout: payouts,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
            })
            .from(payouts)
            .innerJoin(users, eq(users.id, payouts.userId))
            .where(eq(payouts.circleId, circle.id))
            .orderBy(sql`${payouts.createdAt} DESC`);

        const data: PayoutRecord[] = rows.map((row) => {
            const userName = [row.firstName, row.lastName].filter(Boolean).join(' ') || row.email.split('@')[0];
            return {
                ...row.payout,
                userName,
                userEmail: row.email,
            };
        });

        return { success: true, data };
    } catch (error: any) {
        console.error('Get Payouts Error:', error);
        return { success: false, error: error.message || 'Failed to fetch payouts' };
    }
}

/**
 * Fetch bank list from Nomba
 */
export async function fetchNombaBanksAction(): Promise<ActionResponse<NombaBank[]>> {
    try {
        console.log('[Nomba] Fetching bank codes and names');
        const response = await nombaRequest<{ results: NombaBank[] }>('GET', '/v1/transfers/banks');
        return { success: true, data: response?.results || [] };
    } catch (error: any) {
        console.error('Fetch Nomba Banks Error:', error);
        // Fallback static list in case sandbox API is unreachable
        const fallbackBanks = [
            { code: '044', name: 'Access Bank' },
            { code: '050', name: 'Ecobank' },
            { code: '070', name: 'Fidelity Bank' },
            { code: '011', name: 'First Bank of Nigeria' },
            { code: '058', name: 'Guaranty Trust Bank' },
            { code: '030', name: 'Heritage Bank' },
            { code: '082', name: 'Keystone Bank' },
            { code: '999', name: 'Nomba MFB' },
            { code: '076', name: 'Polaris Bank' },
            { code: '221', name: 'Stanbic IBTC Bank' },
            { code: '068', name: 'Standard Chartered Bank' },
            { code: '232', name: 'Sterling Bank' },
            { code: '100', name: 'Suntrust Bank' },
            { code: '032', name: 'Union Bank of Nigeria' },
            { code: '033', name: 'United Bank for Africa' },
            { code: '215', name: 'Unity Bank' },
            { code: '035', name: 'Wema Bank' },
            { code: '057', name: 'Zenith Bank' },
        ];
        return { success: true, data: fallbackBanks };
    }
}

/**
 * Create a payout / initiate bank transfer via Nomba
 */
export async function createPayoutAction(input: {
    circleId: string;
    userId: string;
    amount: string;
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    round?: string;
}): Promise<ActionResponse<PayoutRecord>> {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return { success: false, error: 'Unauthorized' };
        }

        // Get DB user record for the caller
        const dbUser = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.clerkId, clerkId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!dbUser) {
            return { success: false, error: 'Caller record not found.' };
        }

        // Check if the caller has permissions (owner, admin, treasurer) on the circle
        const [member] = await db
            .select()
            .from(circleMembers)
            .where(
                and(
                    eq(circleMembers.circleId, input.circleId),
                    eq(circleMembers.userId, dbUser.id),
                    eq(circleMembers.status, 'active')
                )
            )
            .limit(1);

        if (!member || (member.role !== 'owner' && member.role !== 'admin' && member.role !== 'treasurer')) {
            return { success: false, error: 'Only owners, admins, or treasurers can process payouts.' };
        }

        const merchantTxRef = `payout_${crypto.randomUUID().replace(/-/g, '')}`;

        let status = 'pending';
        let reference = merchantTxRef;

        try {
            console.log(`[Nomba] Initiating bank transfer of NGN ${input.amount} to ${input.accountNumber} (${input.bankCode})`);
            const transferResult = await nombaRequest<any>('POST', '/v2/transfers/bank', {
                body: {
                    amount: parseFloat(input.amount),
                    accountNumber: input.accountNumber,
                    bankCode: input.bankCode,
                    accountName: input.accountName,
                    merchantTxRef,
                    senderName: `Circle ${input.circleId.substring(0, 8)}`,
                    narration: `Payout for Round ${input.round || '1'}`,
                }
            });

            console.log('[Nomba] Payout transfer initiated:', transferResult);
            // Transfer status could be SUCCESS, PROCESSING, PENDING_BILLING, etc.
            const responseCode = transferResult?.code;
            if (responseCode === '200' || responseCode === '00' || transferResult?.status === true) {
                const desc = String(transferResult?.description).toUpperCase();
                if (desc === 'SUCCESS') {
                    status = 'success';
                } else if (desc === 'FAILED') {
                    status = 'failed';
                } else {
                    status = 'pending';
                }
            } else {
                status = 'failed';
            }
        } catch (apiError: any) {
            console.error('[Nomba] Failed to execute transfer API:', apiError);
            return { success: false, error: `Failed to initiate bank transfer: ${apiError.message || String(apiError)}` };
        }

        // Record payout in the database
        const [insertedPayout] = await db
            .insert(payouts)
            .values({
                circleId: input.circleId,
                userId: input.userId,
                amount: input.amount,
                status,
                reference,
                destinationBank: input.bankName,
                destinationAccountNumber: input.accountNumber,
                destinationAccountName: input.accountName,
                round: input.round || null,
            })
            .returning();

        return { success: true, data: insertedPayout as PayoutRecord };
    } catch (error: any) {
        console.error('Create Payout Action Error:', error);
        return { success: false, error: error.message || 'An unexpected error occurred while processing payout.' };
    }
}
