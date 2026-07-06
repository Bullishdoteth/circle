'use server';

import { auth } from '@clerk/nextjs/server';
import { and, eq, isNull, sql, desc, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/db';
import { contributions, circles, users, circleMembers, payouts } from '@/lib/db/schema';
import type { ActionResponse } from './circle';
import { sendContributionReconciledEmail } from '@/lib/mail';

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

        // Send payment confirmation email notification
        try {
            const [targetUser] = await db
                .select({ email: users.email })
                .from(users)
                .where(eq(users.id, targetUserId))
                .limit(1);
            
            const [circle] = await db
                .select({ name: circles.name })
                .from(circles)
                .where(eq(circles.id, contribution.circleId))
                .limit(1);

            if (targetUser && circle) {
                await sendContributionReconciledEmail({
                    to: targetUser.email,
                    amount: contribution.amount,
                    circleName: circle.name,
                    round: round || '1',
                });
            }
        } catch (emailErr) {
            console.error('Failed to send reconciliation email notification:', emailErr);
        }

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

export interface ActivityItem {
    id: string;
    type: 'contribution' | 'payout' | 'member';
    icon: 'users' | 'gift' | 'wallet' | 'user-plus';
    title: string;
    description: string;
    time: string;
    amount?: string;
    createdAt: string | Date;
}

export async function getRecentActivityAction(
    circleSlug?: string | null
): Promise<ActionResponse<ActivityItem[]>> {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return { success: false, error: 'Unauthorized' };
        }

        const dbUser = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.clerkId, clerkId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!dbUser) {
            return { success: false, error: 'User not found' };
        }

        // Get the list of circles the user belongs to
        const userCircles = await db
            .select({ circleId: circleMembers.circleId })
            .from(circleMembers)
            .where(and(eq(circleMembers.userId, dbUser.id), eq(circleMembers.status, 'active')));

        if (userCircles.length === 0) {
            return { success: true, data: [] };
        }

        let targetCircleIds = userCircles.map((uc) => uc.circleId);

        // If circleSlug is provided, filter by it
        if (circleSlug && circleSlug !== 'all') {
            const [circle] = await db
                .select({ id: circles.id })
                .from(circles)
                .where(eq(circles.slug, circleSlug))
                .limit(1);
            if (circle) {
                if (targetCircleIds.includes(circle.id)) {
                    targetCircleIds = [circle.id];
                } else {
                    return { success: false, error: 'Access denied to this circle.' };
                }
            }
        }

        if (targetCircleIds.length === 0) {
            return { success: true, data: [] };
        }

        // 1. Fetch recent contributions
        const recentContribs = await db
            .select({
                id: contributions.id,
                amount: contributions.amount,
                createdAt: contributions.reconciledAt,
                userName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
                userEmail: users.email,
                circleName: circles.name,
            })
            .from(contributions)
            .innerJoin(users, eq(users.id, contributions.userId))
            .innerJoin(circles, eq(circles.id, contributions.circleId))
            .where(
                and(
                    inArray(contributions.circleId, targetCircleIds),
                    eq(contributions.reconciled, true)
                )
            )
            .orderBy(desc(contributions.reconciledAt))
            .limit(5);

        // 2. Fetch recent payouts
        const recentPayouts = await db
            .select({
                id: payouts.id,
                amount: payouts.amount,
                createdAt: payouts.createdAt,
                userName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
                userEmail: users.email,
                circleName: circles.name,
            })
            .from(payouts)
            .innerJoin(users, eq(users.id, payouts.userId))
            .innerJoin(circles, eq(circles.id, payouts.circleId))
            .where(
                and(
                    inArray(payouts.circleId, targetCircleIds),
                    eq(payouts.status, 'success')
                )
            )
            .orderBy(desc(payouts.createdAt))
            .limit(5);

        // 3. Fetch recent member additions
        const recentMembers = await db
            .select({
                id: circleMembers.id,
                createdAt: circleMembers.createdAt,
                userName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
                userEmail: users.email,
                circleName: circles.name,
            })
            .from(circleMembers)
            .innerJoin(users, eq(users.id, circleMembers.userId))
            .innerJoin(circles, eq(circles.id, circleMembers.circleId))
            .where(
                and(
                    inArray(circleMembers.circleId, targetCircleIds),
                    eq(circleMembers.status, 'active')
                )
            )
            .orderBy(desc(circleMembers.createdAt))
            .limit(5);

        // 4. Combine and map to ActivityItem
        const activities: ActivityItem[] = [
            ...recentContribs.map((c) => {
                const name = c.userName.trim() || c.userEmail.split('@')[0];
                return {
                    id: `c_${c.id}`,
                    type: 'contribution' as const,
                    icon: 'gift' as const,
                    title: `${name} contributed to ${c.circleName}`,
                    description: '',
                    time: '',
                    amount: `₦${parseFloat(c.amount).toLocaleString()}`,
                    createdAt: c.createdAt || new Date(),
                };
            }),
            ...recentPayouts.map((p) => {
                const name = p.userName.trim() || p.userEmail.split('@')[0];
                return {
                    id: `p_${p.id}`,
                    type: 'payout' as const,
                    icon: 'wallet' as const,
                    title: `Payout of ₦${parseFloat(p.amount).toLocaleString()} to ${name} in ${p.circleName}`,
                    description: '',
                    time: '',
                    amount: `₦${parseFloat(p.amount).toLocaleString()}`,
                    createdAt: p.createdAt,
                };
            }),
            ...recentMembers.map((m) => {
                const name = m.userName.trim() || m.userEmail.split('@')[0];
                return {
                    id: `m_${m.id}`,
                    type: 'member' as const,
                    icon: 'user-plus' as const,
                    title: `${name} joined ${m.circleName}`,
                    description: '',
                    time: '',
                    createdAt: m.createdAt,
                };
            }),
        ];

        // Sort by date desc and limit to 5 items
        activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return { success: true, data: activities.slice(0, 5) };
    } catch (error: any) {
        console.error('Get Recent Activity Error:', error);
        return { success: false, error: error.message || 'Failed to fetch recent activity' };
    }
}

export interface DashboardStats {
    totalBalance: number;
    contributionsThisMonth: number;
    complianceRate: number;
    totalCircles: number;
}

export async function getDashboardStatsAction(
    circleSlug?: string | null
): Promise<ActionResponse<DashboardStats>> {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return { success: false, error: 'Unauthorized' };
        }

        const dbUser = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.clerkId, clerkId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!dbUser) {
            return { success: false, error: 'User not found' };
        }

        // Get the list of circles the user belongs to
        const userCircles = await db
            .select({ 
                circleId: circleMembers.circleId,
                role: circleMembers.role,
                status: circleMembers.status,
                circleName: circles.name,
                circleSlug: circles.slug,
                currentRound: circles.currentRound,
                contributionAmount: circles.contributionAmount,
            })
            .from(circleMembers)
            .innerJoin(circles, eq(circles.id, circleMembers.circleId))
            .where(and(eq(circleMembers.userId, dbUser.id), eq(circleMembers.status, 'active')));

        if (userCircles.length === 0) {
            return {
                success: true,
                data: {
                    totalBalance: 0,
                    contributionsThisMonth: 0,
                    complianceRate: 0,
                    totalCircles: 0,
                }
            };
        }

        let activeCircles = userCircles;
        if (circleSlug && circleSlug !== 'all') {
            activeCircles = userCircles.filter(c => c.circleSlug === circleSlug);
        }

        if (activeCircles.length === 0) {
            return {
                success: true,
                data: {
                    totalBalance: 0,
                    contributionsThisMonth: 0,
                    complianceRate: 0,
                    totalCircles: userCircles.length,
                }
            };
        }

        const activeCircleIds = activeCircles.map(c => c.circleId);

        // 1. Calculate Total Balance
        // Sum reconciled contributions
        const contribSumRes = await db
            .select({ total: sql<number>`sum(amount)::float` })
            .from(contributions)
            .where(and(inArray(contributions.circleId, activeCircleIds), eq(contributions.reconciled, true)));
        const totalContribs = contribSumRes[0]?.total || 0;

        // Sum successful payouts
        const payoutSumRes = await db
            .select({ total: sql<number>`sum(amount)::float` })
            .from(payouts)
            .where(and(inArray(payouts.circleId, activeCircleIds), eq(payouts.status, 'success')));
        const totalPayouts = payoutSumRes[0]?.total || 0;

        const totalBalance = Math.max(0, totalContribs - totalPayouts);

        // 2. Contributions This Month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const monthContribRes = await db
            .select({ total: sql<number>`sum(amount)::float` })
            .from(contributions)
            .where(
                and(
                    inArray(contributions.circleId, activeCircleIds),
                    eq(contributions.reconciled, true),
                    sql`${contributions.reconciledAt} >= ${startOfMonth}`,
                    sql`${contributions.reconciledAt} <= ${endOfMonth}`
                )
            );
        const contributionsThisMonth = monthContribRes[0]?.total || 0;

        // 3. Compliance Rate
        let totalExpected = 0;
        let totalActual = 0;

        for (const ac of activeCircles) {
            // Count total active members in this circle
            const memberCountRes = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(circleMembers)
                .where(and(eq(circleMembers.circleId, ac.circleId), eq(circleMembers.status, 'active')));
            const count = memberCountRes[0]?.count || 0;
            totalExpected += count;

            // Count members who have contributed in current round
            const paidCountRes = await db
                .select({ count: sql<number>`count(distinct ${contributions.userId})::int` })
                .from(contributions)
                .where(
                    and(
                        eq(contributions.circleId, ac.circleId),
                        eq(contributions.round, String(ac.currentRound)),
                        eq(contributions.reconciled, true)
                    )
                );
            const paidCount = paidCountRes[0]?.count || 0;
            totalActual += paidCount;
        }

        const complianceRate = totalExpected > 0 ? Math.min(100, Math.round((totalActual / totalExpected) * 100)) : 100;

        return {
            success: true,
            data: {
                totalBalance,
                contributionsThisMonth,
                complianceRate,
                totalCircles: userCircles.length
            }
        };
    } catch (error: any) {
        console.error('Get Dashboard Stats Error:', error);
        return { success: false, error: error.message || 'Failed to fetch dashboard stats' };
    }
}

export interface ReportMemberItem {
    userId: string;
    name: string;
    email: string;
    imageUrl: string | null;
    paidRounds: number;
    totalRounds: number;
    currentRoundStatus: 'paid' | 'pending' | 'overdue';
    compliancePercentage: number;
    rotationPosition: number | null;
    payoutDate: string | null;
}

export interface ReportRoundChartItem {
    round: string;
    amount: number;
    heightPercentage: number;
}

export interface ReportStats {
    projectedSavings: number;
    avgComplianceRate: number;
    health: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    currency: string;
    circleName: string;
    chartData: ReportRoundChartItem[];
    membersData: ReportMemberItem[];
}

export async function getReportsStatsAction(
    circleSlug: string
): Promise<ActionResponse<ReportStats>> {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return { success: false, error: 'Unauthorized' };
        }

        const dbUser = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.clerkId, clerkId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!dbUser) {
            return { success: false, error: 'User not found' };
        }

        // Get the active circle
        const [circle] = await db
            .select()
            .from(circles)
            .where(and(eq(circles.slug, circleSlug), isNull(circles.deletedAt)))
            .limit(1);

        if (!circle) {
            return { success: false, error: 'Circle not found.' };
        }

        // Fetch active members in the circle
        const membersList = await db
            .select({
                memberId: circleMembers.id,
                userId: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                imageUrl: users.imageUrl,
                rotationPosition: circleMembers.rotationPosition,
                payoutDate: circleMembers.payoutDate,
            })
            .from(circleMembers)
            .innerJoin(users, eq(users.id, circleMembers.userId))
            .where(and(eq(circleMembers.circleId, circle.id), eq(circleMembers.status, 'active')));

        const memberCount = membersList.length;

        // 1. Projected Savings = contributionAmount * memberCount
        const contributionVal = parseFloat(circle.contributionAmount);
        const projectedSavings = contributionVal * memberCount;

        // 2. Average Compliance Rate
        const currentRoundNum = circle.currentRound;
        const totalExpectedContribs = currentRoundNum * memberCount * contributionVal;

        // Sum actual reconciled contributions
        const actualContribSumRes = await db
            .select({ total: sql<number>`sum(amount)::float` })
            .from(contributions)
            .where(and(eq(contributions.circleId, circle.id), eq(contributions.reconciled, true)));
        const totalActualContribs = actualContribSumRes[0]?.total || 0;

        const avgComplianceRate = totalExpectedContribs > 0 
            ? Math.min(100, Math.round((totalActualContribs / totalExpectedContribs) * 100)) 
            : 100;

        // 3. Health status
        let health: 'Excellent' | 'Good' | 'Fair' | 'Poor' = 'Excellent';
        if (avgComplianceRate < 50) health = 'Poor';
        else if (avgComplianceRate < 75) health = 'Fair';
        else if (avgComplianceRate < 90) health = 'Good';

        // 4. Cumulative Chart Data: Round 1 up to current round
        const chartData: ReportRoundChartItem[] = [];
        let maxAmount = 0;

        // Sum contributions round-by-round
        for (let r = 1; r <= currentRoundNum; r++) {
            const roundSumRes = await db
                .select({ total: sql<number>`sum(amount)::float` })
                .from(contributions)
                .where(
                    and(
                        eq(contributions.circleId, circle.id),
                        eq(contributions.round, String(r)),
                        eq(contributions.reconciled, true)
                    )
                );
            const amount = roundSumRes[0]?.total || 0;
            if (amount > maxAmount) maxAmount = amount;
            chartData.push({
                round: `R${r}`,
                amount,
                heightPercentage: 0
            });
        }

        // Apply height percentage
        chartData.forEach(item => {
            item.heightPercentage = maxAmount > 0 ? Math.round((item.amount / maxAmount) * 100) : 0;
        });

        // 5. Member Compliance List
        const membersData: ReportMemberItem[] = [];

        for (const m of membersList) {
            // Count total rounds this user has contributed in
            const userPaidRoundsRes = await db
                .select({ count: sql<number>`count(distinct ${contributions.round})::int` })
                .from(contributions)
                .where(
                    and(
                        eq(contributions.circleId, circle.id),
                        eq(contributions.userId, m.userId),
                        eq(contributions.reconciled, true)
                    )
                );
            const paidRounds = userPaidRoundsRes[0]?.count || 0;

            // Check current round status
            const hasPaidCurrentRoundRes = await db
                .select()
                .from(contributions)
                .where(
                    and(
                        eq(contributions.circleId, circle.id),
                        eq(contributions.userId, m.userId),
                        eq(contributions.round, String(currentRoundNum)),
                        eq(contributions.reconciled, true)
                    )
                )
                .limit(1);

            const hasPaid = hasPaidCurrentRoundRes.length > 0;
            let currentRoundStatus: 'paid' | 'pending' | 'overdue' = 'paid';

            if (!hasPaid) {
                // If not paid, check if past scheduled date
                if (m.payoutDate && new Date() > new Date(m.payoutDate)) {
                    currentRoundStatus = 'overdue';
                } else {
                    currentRoundStatus = 'pending';
                }
            }

            const compliancePercentage = currentRoundNum > 0 
                ? Math.min(100, Math.round((paidRounds / currentRoundNum) * 100)) 
                : 100;

            membersData.push({
                userId: m.userId,
                name: [m.firstName, m.lastName].filter(Boolean).join(' ') || m.email.split('@')[0],
                email: m.email,
                imageUrl: m.imageUrl,
                paidRounds,
                totalRounds: currentRoundNum,
                currentRoundStatus,
                compliancePercentage,
                rotationPosition: m.rotationPosition,
                payoutDate: m.payoutDate ? m.payoutDate.toISOString() : null
            });
        }

        return {
            success: true,
            data: {
                projectedSavings,
                avgComplianceRate,
                health,
                currency: circle.currency,
                circleName: circle.name,
                chartData,
                membersData
            }
        };
    } catch (error: any) {
        console.error('Get Reports Stats Error:', error);
        return { success: false, error: error.message || 'Failed to fetch reports stats' };
    }
}
