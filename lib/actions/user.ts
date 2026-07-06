'use server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/db';
import { users } from '@/lib/db/schema';
import type { ActionResponse } from './circle';

export interface UserPayoutProfile {
    payoutBankCode: string | null;
    payoutBankName: string | null;
    payoutAccountNumber: string | null;
    payoutAccountName: string | null;
}

/**
 * Fetch personal bank details of the current logged-in user
 */
export async function getUserPayoutProfileAction(): Promise<ActionResponse<UserPayoutProfile>> {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return { success: false, error: 'Unauthorized' };
        }

        const [user] = await db
            .select({
                payoutBankCode: users.payoutBankCode,
                payoutBankName: users.payoutBankName,
                payoutAccountNumber: users.payoutAccountNumber,
                payoutAccountName: users.payoutAccountName,
            })
            .from(users)
            .where(eq(users.clerkId, clerkId))
            .limit(1);

        if (!user) {
            return { success: false, error: 'User record not found.' };
        }

        return { success: true, data: user };
    } catch (error: any) {
        console.error('Get User Payout Profile Error:', error);
        return { success: false, error: error.message || 'Failed to fetch payout profile.' };
    }
}

/**
 * Update personal bank details of the current logged-in user
 */
export async function updateUserPayoutProfileAction(input: UserPayoutProfile): Promise<ActionResponse<void>> {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return { success: false, error: 'Unauthorized' };
        }

        await db
            .update(users)
            .set({
                payoutBankCode: input.payoutBankCode,
                payoutBankName: input.payoutBankName,
                payoutAccountNumber: input.payoutAccountNumber,
                payoutAccountName: input.payoutAccountName,
            })
            .where(eq(users.clerkId, clerkId));

        return { success: true };
    } catch (error: any) {
        console.error('Update User Payout Profile Error:', error);
        return { success: false, error: error.message || 'Failed to update payout profile.' };
    }
}