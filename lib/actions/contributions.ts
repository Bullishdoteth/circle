'use server';

import { auth } from '@clerk/nextjs/server';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/db';
import { contributions, circles, users, circleMembers, payouts } from '@/lib/db/schema';
import type { ActionResponse } from './circle';

export interface ContributionRecord {
    id: string;
    circleId: string;
    userId: string | null;
    userName?: string | null;
    userEmail?: string | null;
    amount: string;
    status: string;
    reference: string;
    senderName: string | null;
    senderBank: string | null;
    senderAccountNumber: string | null;
    round: string | null;
    reconciled: boolean;
    reconciledAt: string | Date | null;
    reconciledBy: string | null;
    createdAt: string | Date;
}

/**
 * Fetch all reconciled (assigned) contributions for a circle
 */
export async function getCircleContributionsAction(
    circleSlug: string
): Promise<ActionResponse<ContributionRecord[]>> {
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
                contribution: contributions,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
            })
            .from(contributions)
            .leftJoin(users, eq(users.id, contributions.userId))
            .where(
                and(
                    eq(contributions.circleId, circle.id),
                    eq(contributions.reconciled, true),
                    eq(contributions.status, 'success')
                )
            )
            .orderBy(sql`${contributions.createdAt} DESC`);

        const data: ContributionRecord[] = rows.map((row) => {
            const userName = [row.firstName, row.lastName].filter(Boolean).join(' ') || row.email?.split('@')[0] || null;
            return {
                ...row.contribution,
                userName,
                userEmail: row.email,
            };
        });

        return { success: true, data };
    } catch (error: any) {
        console.error('Get Circle Contributions Error:', error);
        return { success: false, error: error.message || 'Failed to fetch contributions' };
    }
}

/**
 * Fetch all unreconciled (unassigned) bank deposits for a circle
 */
export async function getUnreconciledContributionsAction(
    circleSlug: string
): Promise<ActionResponse<ContributionRecord[]>> {
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
            .select()
            .from(contributions)
            .where(
                and(
                    eq(contributions.circleId, circle.id),
                    eq(contributions.reconciled, false),
                    eq(contributions.status, 'success')
                )
            )
            .orderBy(sql`${contributions.createdAt} DESC`);

        return { success: true, data: rows as ContributionRecord[] };
    } catch (error: any) {
        console.error('Get Unreconciled Contributions Error:', error);
        return { success: false, error: error.message || 'Failed to fetch unreconciled deposits' };
    }
}

/**
 * Manually reconcile a bank deposit to a circle member
 */
export async function reconcileContributionAction(
    contributionId: string,
    targetUserId: string,
    round?: string
): Promise<ActionResponse<{ success: boolean }>> {
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

        // Get contribution
        const [contribution] = await db
            .select()
            .from(contributions)
            .where(eq(contributions.id, contributionId))
            .limit(1);

        if (!contribution) {
            return { success: false, error: 'Contribution deposit not found.' };
        }

        // Check if the caller has permissions (owner, admin, treasurer) on the circle
        const [member] = await db
            .select()
            .from(circleMembers)
            .where(
                and(
                    eq(circleMembers.circleId, contribution.circleId),
                    eq(circleMembers.userId, dbUser.id),
                    eq(circleMembers.status, 'active')
                )
            )
            .limit(1);

        if (!member || (member.role !== 'owner' && member.role !== 'admin' && member.role !== 'treasurer')) {
            return { success: false, error: 'Only owners, admins, or treasurers can reconcile deposits.' };
        }

        // Update the contribution
        await db
            .update(contributions)
            .set({
                userId: targetUserId,
                reconciled: true,
                reconciledAt: new Date(),
                reconciledBy: dbUser.id,
                round: round || null,
                updatedAt: new Date(),
            })
            .where(eq(contributions.id, contributionId));

        return { success: true, data: { success: true } };
    } catch (error: any) {
        console.error('Reconcile Contribution Error:', error);
        return { success: false, error: error.message || 'Failed to reconcile contribution' };
    }
}

export interface TransactionRecord {
    id: string;
    reference: string;
    userName: string;
    userEmail: string;
    type: 'contribution' | 'payout';
    amount: string;
    status: string;
    createdAt: string | Date;
}

export async function getCircleTransactionsAction(
    circleSlug: string
): Promise<ActionResponse<TransactionRecord[]>> {
    try {
        const [circle] = await db
            .select()
            .from(circles)
            .where(and(eq(circles.slug, circleSlug), isNull(circles.deletedAt)))
            .limit(1);

        if (!circle) {
            return { success: false, error: 'Circle not found' };
        }

        // Fetch reconciled contributions
        const contribs = await db
            .select({
                id: contributions.id,
                reference: contributions.reference,
                amount: contributions.amount,
                status: contributions.status,
                createdAt: contributions.createdAt,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
            })
            .from(contributions)
            .leftJoin(users, eq(users.id, contributions.userId))
            .where(and(eq(contributions.circleId, circle.id), eq(contributions.reconciled, true)));

        // Fetch payouts
        const outs = await db
            .select({
                id: payouts.id,
                reference: payouts.reference,
                amount: payouts.amount,
                status: payouts.status,
                createdAt: payouts.createdAt,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
            })
            .from(payouts)
            .innerJoin(users, eq(users.id, payouts.userId))
            .where(eq(payouts.circleId, circle.id));

        const transactions: TransactionRecord[] = [
            ...contribs.map((c) => ({
                id: c.id,
                reference: c.reference,
                userName: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email?.split('@')[0] || 'Unknown',
                userEmail: c.email || '',
                type: 'contribution' as const,
                amount: c.amount,
                status: c.status,
                createdAt: c.createdAt,
            })),
            ...outs.map((o) => ({
                id: o.id,
                reference: o.reference,
                userName: [o.firstName, o.lastName].filter(Boolean).join(' ') || o.email?.split('@')[0] || 'Unknown',
                userEmail: o.email || '',
                type: 'payout' as const,
                amount: o.amount,
                status: o.status,
                createdAt: o.createdAt,
            })),
        ];

        // Sort by date desc
        transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return { success: true, data: transactions };
    } catch (error: any) {
        console.error('Get Circle Transactions Error:', error);
        return { success: false, error: error.message || 'Failed to fetch transactions' };
    }
}
