'use server';

import { auth } from '@clerk/nextjs/server';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/db';
import { circles, users, circleMembers, invitations } from '@/lib/db/schema';

export interface CircleRecord {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    currency: 'NGN' | 'USD' | 'EUR' | 'GBP';
    ownerId: string;
    visibility: 'invite_only' | 'private';
    status: 'active' | 'archived' | 'suspended';
    createdBy: string;
    lastActivityAt: string | Date | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    deletedAt: string | Date | null;
}

export interface CreateCircleInput {
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string | null;
    privacy?: 'invite_only' | 'private';
    currency?: 'NGN' | 'USD' | 'EUR' | 'GBP';
    members?: Array<{
        id: string;
        name: string;
        email: string;
        role?: string;
    }>;
}

export interface ActionResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Create Circle
 */
export async function createCircleAction(
    input: CreateCircleInput
    ): Promise<ActionResponse<CircleRecord>> {
    try {
        const { userId } = await auth();

        if (!userId) {
        return {
            success: false,
            error: 'Unauthorized',
        };
        }

        // Retrieve database user record by Clerk's userId
        const dbUser = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.clerkId, userId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!dbUser) {
            return {
                success: false,
                error: 'Local user record not found in the database. Please try logging in again.',
            };
        }

        let finalSlug = input.slug.trim().toLowerCase();

        if (!finalSlug) {
        finalSlug = input.name
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-');
        }

        const now = new Date();

        const [insertedCircle] = await db
            .insert(circles)
            .values({
                slug: finalSlug,
                name: input.name.trim(),
                description: input.description?.trim() || null,
                imageUrl: input.logoUrl || null,
                //eslint-disable-next-line @typescript-eslint/no-explicit-any
                currency: (input.currency || 'NGN') as any,
                ownerId: dbUser.id,
                createdBy: dbUser.id,
                visibility: input.privacy || 'invite_only',
                status: 'active',
                lastActivityAt: now,
            })
            .returning();

        if (!insertedCircle) {
            throw new Error('Failed to create the circle record.');
        }

        // Create initial owner membership record
        await db.insert(circleMembers).values({
            circleId: insertedCircle.id,
            userId: dbUser.id,
            role: 'owner',
            status: 'active',
        });

        // Create initial member invitation records
        if (input.members && input.members.length > 0) {
            const invitationValues = input.members.map((member) => ({
                circleId: insertedCircle.id,
                invitedBy: dbUser.id,
                email: member.email,
                token: crypto.randomUUID(),
                role: (member.role === 'Admin' ? 'admin' : 'member') as 'admin' | 'member',
                status: 'pending' as const,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            }));

            await db.insert(invitations).values(invitationValues);
        }

        return {
            success: true,
            data: insertedCircle as CircleRecord,
        };
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Create Circle Error:', error);

        return {
        success: false,
        error:
            error.message ||
            'An unexpected error occurred while creating the circle.',
        };
    }
}

/**
 * Get Circle by Slug
 */
export async function getCircleBySlugAction(
    slug: string
    ): Promise<ActionResponse<CircleRecord | null>> {
    try {
        const rows = await db
        .select()
        .from(circles)
        .where(and(eq(circles.slug, slug), isNull(circles.deletedAt)))
        .limit(1);

        return {
        success: true,
        data: rows.length ? (rows[0] as CircleRecord) : null,
        };
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Get Circle Error:', error);

        return {
        success: false,
        error: error.message,
        };
    }
}

/**
 * List all active circles
 */
export async function listCirclesAction(): Promise<
    ActionResponse<CircleRecord[]>
    > {
    try {
        const rows = await db
        .select()
        .from(circles)
        .where(isNull(circles.deletedAt));

        return {
        success: true,
        data: rows as CircleRecord[],
        };
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('List Circles Error:', error);

        return {
        success: false,
        error: error.message,
        };
    }
}

export interface CircleMemberDetail {
    id: string;
    userId: string;
    name: string;
    email: string;
    imageUrl: string | null;
    role: 'owner' | 'admin' | 'treasurer' | 'member';
    status: 'active' | 'suspended' | 'removed';
    joinedAt: Date | string;
}

export interface CircleInvitationDetail {
    id: string;
    email: string;
    role: 'owner' | 'admin' | 'treasurer' | 'member';
    status: 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked';
    invitedAt: Date | string;
}

export interface CircleDetails {
    circle: CircleRecord & { memberCount: number };
    members: CircleMemberDetail[];
    invitations: CircleInvitationDetail[];
    currentUserRole: 'owner' | 'admin' | 'treasurer' | 'member' | null;
}

/**
 * Get circles where the current authenticated user is a member
 */
export async function getMyCirclesAction(): Promise<
    ActionResponse<Array<CircleRecord & { memberCount: number }>>
> {
    try {
        const { userId } = await auth();

        if (!userId) {
            return {
                success: false,
                error: 'Unauthorized',
            };
        }

        const dbUser = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.clerkId, userId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!dbUser) {
            return {
                success: false,
                error: 'Local user record not found in the database.',
            };
        }

        const rows = await db
            .select({
                circle: circles,
            })
            .from(circles)
            .innerJoin(circleMembers, eq(circleMembers.circleId, circles.id))
            .where(
                and(
                    eq(circleMembers.userId, dbUser.id),
                    eq(circleMembers.status, 'active'),
                    isNull(circles.deletedAt)
                )
            );

        const data = await Promise.all(
            rows.map(async (row) => {
                const countResult = await db
                    .select({
                        count: sql<number>`count(*)::int`,
                    })
                    .from(circleMembers)
                    .where(
                        and(
                            eq(circleMembers.circleId, row.circle.id),
                            eq(circleMembers.status, 'active')
                        )
                    );

                return {
                    ...row.circle,
                    memberCount: countResult[0]?.count ?? 1,
                };
            })
        );

        return {
            success: true,
            data,
        };
    } catch (error: any) {
        console.error('Get My Circles Error:', error);
        return {
            success: false,
            error: error.message || 'An unexpected error occurred.',
        };
    }
}

/**
 * Get circle details by slug
 */
export async function getCircleDetailsAction(
    slug: string
): Promise<ActionResponse<CircleDetails>> {
    try {
        const { userId } = await auth();

        if (!userId) {
            return { success: false, error: 'Unauthorized' };
        }

        const dbUser = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.clerkId, userId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!dbUser) {
            return { success: false, error: 'User not found in local database.' };
        }

        const [circle] = await db
            .select()
            .from(circles)
            .where(and(eq(circles.slug, slug), isNull(circles.deletedAt)))
            .limit(1);

        if (!circle) {
            return { success: false, error: 'Circle not found' };
        }

        const countResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(circleMembers)
            .where(and(eq(circleMembers.circleId, circle.id), eq(circleMembers.status, 'active')));

        const circleWithCount = {
            ...circle,
            memberCount: countResult[0]?.count ?? 1,
        };

        const membersRows = await db
            .select({
                memberId: circleMembers.id,
                userId: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                imageUrl: users.imageUrl,
                role: circleMembers.role,
                status: circleMembers.status,
                joinedAt: circleMembers.createdAt,
            })
            .from(circleMembers)
            .innerJoin(users, eq(users.id, circleMembers.userId))
            .where(eq(circleMembers.circleId, circle.id));

        const members: CircleMemberDetail[] = membersRows.map((row) => ({
            id: row.memberId,
            userId: row.userId,
            name: [row.firstName, row.lastName].filter(Boolean).join(' ') || row.email.split('@')[0],
            email: row.email,
            imageUrl: row.imageUrl,
            role: row.role as any,
            status: row.status as any,
            joinedAt: row.joinedAt,
        }));

        const invitationRows = await db
            .select()
            .from(invitations)
            .where(and(eq(invitations.circleId, circle.id), eq(invitations.status, 'pending')));

        const invitationsList: CircleInvitationDetail[] = invitationRows.map((row) => ({
            id: row.id,
            email: row.email,
            role: row.role as any,
            status: row.status as any,
            invitedAt: row.createdAt,
        }));

        const currentUserMember = members.find((m) => m.userId === dbUser.id);
        const currentUserRole = currentUserMember ? currentUserMember.role : null;

        return {
            success: true,
            data: {
                circle: circleWithCount as any,
                members,
                invitations: invitationsList,
                currentUserRole,
            },
        };
    } catch (error: any) {
        console.error('Get Circle Details Error:', error);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}

/**
 * Invite a member to a circle
 */
export async function inviteCircleMemberAction(
    circleId: string,
    email: string,
    role: 'admin' | 'member'
): Promise<ActionResponse<CircleInvitationDetail>> {
    try {
        const { userId } = await auth();

        if (!userId) {
            return { success: false, error: 'Unauthorized' };
        }

        const dbUser = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.clerkId, userId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!dbUser) {
            return { success: false, error: 'User not found' };
        }

        const [targetUser] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email.trim().toLowerCase()))
            .limit(1);

        if (targetUser) {
            const [existingMember] = await db
                .select()
                .from(circleMembers)
                .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, targetUser.id)))
                .limit(1);

            if (existingMember && existingMember.status === 'active') {
                return { success: false, error: 'User is already a member of this circle.' };
            }
        }

        const [existingInvitation] = await db
            .select()
            .from(invitations)
            .where(and(eq(invitations.circleId, circleId), eq(invitations.email, email.trim().toLowerCase()), eq(invitations.status, 'pending')))
            .limit(1);

        if (existingInvitation) {
            return { success: false, error: 'An invitation is already pending for this email.' };
        }

        const [insertedInvitation] = await db
            .insert(invitations)
            .values({
                circleId,
                invitedBy: dbUser.id,
                invitedUserId: targetUser?.id || null,
                email: email.trim().toLowerCase(),
                token: crypto.randomUUID(),
                role: role,
                status: 'pending',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            })
            .returning();

        return {
            success: true,
            data: {
                id: insertedInvitation.id,
                email: insertedInvitation.email,
                role: insertedInvitation.role as any,
                status: insertedInvitation.status as any,
                invitedAt: insertedInvitation.createdAt,
            },
        };
    } catch (error: any) {
        console.error('Invite Member Error:', error);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}

/**
 * Update circle settings
 */
export async function updateCircleSettingsAction(
    circleId: string,
    data: {
        name: string;
        slug: string;
        description?: string;
        privacy?: 'invite_only' | 'private';
    }
): Promise<ActionResponse<CircleRecord>> {
    try {
        const { userId } = await auth();

        if (!userId) {
            return { success: false, error: 'Unauthorized' };
        }

        const dbUser = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.clerkId, userId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!dbUser) {
            return { success: false, error: 'User not found' };
        }

        const [member] = await db
            .select()
            .from(circleMembers)
            .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, dbUser.id)))
            .limit(1);

        if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
            return { success: false, error: 'You do not have permission to manage this circle.' };
        }

        const cleanSlug = data.slug.trim().toLowerCase();
        const [existingCircle] = await db
            .select()
            .from(circles)
            .where(and(eq(circles.slug, cleanSlug), isNull(circles.deletedAt)))
            .limit(1);

        if (existingCircle && existingCircle.id !== circleId) {
            return { success: false, error: 'This slug is already taken.' };
        }

        const [updatedCircle] = await db
            .update(circles)
            .set({
                name: data.name.trim(),
                slug: cleanSlug,
                description: data.description?.trim() || null,
                visibility: data.privacy,
                updatedAt: new Date(),
            })
            .where(eq(circles.id, circleId))
            .returning();

        return {
            success: true,
            data: updatedCircle as CircleRecord,
        };
    } catch (error: any) {
        console.error('Update Circle Settings Error:', error);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}