'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { and, eq, isNull, sql, or } from 'drizzle-orm';
import { db } from '@/lib/db/db';
import { circles, users, circleMembers, invitations, virtualAccounts } from '@/lib/db/schema';
import { sendCircleInviteEmail } from '@/lib/mail';
import { nombaRequest } from '@/lib/nomba';

export interface CircleRecord {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    currency: 'NGN' | 'USD' | 'EUR' | 'GBP';
    ownerId: string;
    visibility: 'invite_only' | 'private';
    status: 'active' | 'archived' | 'suspended' | 'deleted';
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
            .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
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

        // Check if slug is already taken
        const [existingCircle] = await db
            .select({ id: circles.id })
            .from(circles)
            .where(and(eq(circles.slug, finalSlug), isNull(circles.deletedAt)))
            .limit(1);

        if (existingCircle) {
            return {
                success: false,
                error: `A circle named "${input.name.trim()}" (or with the slug "${finalSlug}") already exists. Please choose a unique name.`,
            };
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

        // Provision Virtual Account via Nomba
        let accountName = `Circle ${insertedCircle.name}`.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
        if (accountName.length < 8) {
            accountName = `${accountName} Account`;
        }
        if (accountName.length > 64) {
            accountName = accountName.substring(0, 64);
        }

        const accountRef = `circle_${insertedCircle.id.replace(/-/g, '')}`;

        let bankName = 'Nomba MFB';
        let bankAccountNumber = '';
        let bankAccountName = accountName;

        try {
            console.log(`[Nomba] Provisioning virtual account for circle: ${insertedCircle.id}`);
            const vaData = await nombaRequest<any>('POST', '/v1/accounts/virtual', {
                body: {
                    accountRef,
                    accountName,
                }
            });

            console.log('[Nomba] Virtual account response:', vaData);
            const bank = vaData?.banks?.[0] || {};
            bankName = bank.bankName || vaData?.bankName || 'Nomba MFB';
            bankAccountNumber = bank.bankAccountNumber || vaData?.bankAccountNumber || '';
            bankAccountName = bank.bankAccountName || vaData?.bankAccountName || accountName;

            if (!bankAccountNumber) {
                throw new Error('No bank account number returned from Nomba API.');
            }
        } catch (apiError: any) {
            console.error('[Nomba] Failed to provision virtual account:', apiError);
            throw new Error(`Failed to create Nomba virtual account for this circle: ${apiError.message || String(apiError)}`);
        }

        // Save virtual account details to DB
        await db.insert(virtualAccounts).values({
            circleId: insertedCircle.id,
            accountRef,
            accountName,
            bankName,
            bankAccountNumber,
            bankAccountName,
            currency: 'NGN',
            status: 'active',
        });

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
                email: member.email.trim().toLowerCase(),
                token: crypto.randomUUID(),
                role: (member.role === 'Admin' ? 'admin' : 'member') as 'admin' | 'member',
                status: 'pending' as const,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            }));

            const insertedInvitations = await db.insert(invitations).values(invitationValues).returning();

            const inviterName = [dbUser.firstName, dbUser.lastName].filter(Boolean).join(' ') || dbUser.email.split('@')[0];
            const headersList = await headers();
            const host = headersList.get('host') || 'localhost:3000';
            const protocol = host.includes('localhost') ? 'http' : 'https';

            // Send emails in background
            Promise.all(insertedInvitations.map((inv) => {
                const inviteLink = `${protocol}://${host}/invitations/${inv.token}`;
                console.log(`[Invitation] Onboarding invite created for ${inv.email}: ${inviteLink}`);
                return sendCircleInviteEmail({
                    to: inv.email,
                    circleName: insertedCircle.name,
                    inviterName,
                    inviterEmail: dbUser.email,
                    role: inv.role,
                    inviteLink,
                });
            })).catch((err) => {
                console.error('Failed to send some onboarding invitation emails:', err);
            });
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
    virtualAccount?: {
        id: string;
        circleId: string;
        accountRef: string;
        accountName: string;
        bankName: string;
        bankAccountNumber: string;
        bankAccountName: string;
        currency: string;
        status: string;
        createdAt: string | Date;
        updatedAt: string | Date;
    } | null;
}

/**
 * Get circles where the current authenticated user is a member
 */
export async function getMyCirclesAction(): Promise<
    ActionResponse<Array<CircleRecord & { memberCount: number; userRole: 'owner' | 'admin' | 'treasurer' | 'member' }>>
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
                role: circleMembers.role,
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
                    userRole: row.role as 'owner' | 'admin' | 'treasurer' | 'member',
                };
            })
        );

        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error('Get My Circles Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred.',
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

        // Fetch circle's Nomba virtual account details
        const [virtualAccount] = await db
            .select()
            .from(virtualAccounts)
            .where(eq(virtualAccounts.circleId, circle.id))
            .limit(1);

        return {
            success: true,
            data: {
                circle: circleWithCount as any,
                members,
                invitations: invitationsList,
                currentUserRole,
                virtualAccount: virtualAccount || null,
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
            .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
            .from(users)
            .where(eq(users.clerkId, userId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!dbUser) {
            return { success: false, error: 'User not found' };
        }

        const [circle] = await db
            .select({ name: circles.name })
            .from(circles)
            .where(eq(circles.id, circleId))
            .limit(1);

        if (!circle) {
            return { success: false, error: 'Circle not found.' };
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

        const inviterName = [dbUser.firstName, dbUser.lastName].filter(Boolean).join(' ') || dbUser.email.split('@')[0];
        const headersList = await headers();
        const host = headersList.get('host') || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const inviteLink = `${protocol}://${host}/invitations/${insertedInvitation.token}`;
        console.log(`[Invitation] Created member invite for ${email}: ${inviteLink}`);

        // Send email
        try {
            await sendCircleInviteEmail({
                to: email.trim().toLowerCase(),
                circleName: circle.name,
                inviterName,
                inviterEmail: dbUser.email,
                role: role,
                inviteLink,
            });
        } catch (mailError) {
            console.error('Failed to send invitation email:', mailError);
        }

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

export interface InvitationDetails {
    id: string;
    email: string;
    circleName: string;
    circleDescription: string | null;
    circleImageUrl: string | null;
    inviterName: string;
    inviterEmail: string;
    role: 'owner' | 'admin' | 'treasurer' | 'member';
    status: 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked';
    expiresAt: Date;
}

export async function getInvitationDetailsAction(
    token: string
): Promise<ActionResponse<InvitationDetails>> {
    try {
        const [invitation] = await db
            .select()
            .from(invitations)
            .where(eq(invitations.token, token))
            .limit(1);

        if (!invitation) {
            return { success: false, error: 'Invitation not found.' };
        }

        const [circle] = await db
            .select()
            .from(circles)
            .where(eq(circles.id, invitation.circleId))
            .limit(1);

        if (!circle) {
            return { success: false, error: 'Circle not found.' };
        }

        const inviter = invitation.invitedBy 
            ? await db
                .select({ firstName: users.firstName, lastName: users.lastName, email: users.email })
                .from(users)
                .where(eq(users.id, invitation.invitedBy))
                .limit(1)
                .then((rows) => rows[0])
            : null;

        const inviterName = inviter
            ? [inviter.firstName, inviter.lastName].filter(Boolean).join(' ') || inviter.email.split('@')[0]
            : 'Someone';

        return {
            success: true,
            data: {
                id: invitation.id,
                email: invitation.email,
                circleName: circle.name,
                circleDescription: circle.description,
                circleImageUrl: circle.imageUrl,
                inviterName,
                inviterEmail: inviter?.email || '',
                role: invitation.role as any,
                status: invitation.status as any,
                expiresAt: invitation.expiresAt,
            },
        };
    } catch (error: any) {
        console.error('Get Invitation Details Error:', error);
        return { success: false, error: error.message || 'Failed to load invitation.' };
    }
}

export async function acceptInvitationAction(
    token: string
): Promise<ActionResponse<{ slug: string }>> {
    try {
        const { userId } = await auth();

        if (!userId) {
            return { success: false, error: 'Unauthorized: Please log in to accept the invitation.' };
        }

        // Get DB user record
        const dbUser = await db
            .select()
            .from(users)
            .where(eq(users.clerkId, userId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!dbUser) {
            return { success: false, error: 'User record not found in the database. Please complete your profile.' };
        }

        // Get invitation
        const [invitation] = await db
            .select()
            .from(invitations)
            .where(eq(invitations.token, token))
            .limit(1);

        if (!invitation) {
            return { success: false, error: 'Invitation not found.' };
        }

        if (invitation.status !== 'pending') {
            return { success: false, error: `This invitation has already been ${invitation.status}.` };
        }

        if (new Date() > invitation.expiresAt) {
            // Update invitation status to expired
            await db
                .update(invitations)
                .set({ status: 'expired', updatedAt: new Date() })
                .where(eq(invitations.id, invitation.id));
            return { success: false, error: 'This invitation has expired.' };
        }

        // Check if user is already an active member of the circle
        const [existingMember] = await db
            .select()
            .from(circleMembers)
            .where(and(eq(circleMembers.circleId, invitation.circleId), eq(circleMembers.userId, dbUser.id)))
            .limit(1);

        if (existingMember && existingMember.status === 'active') {
            // Update invitation to accepted since they are already a member
            await db
                .update(invitations)
                .set({
                    status: 'accepted',
                    acceptedAt: new Date(),
                    invitedUserId: dbUser.id,
                    updatedAt: new Date(),
                })
                .where(eq(invitations.id, invitation.id));

            const [circle] = await db
                .select({ slug: circles.slug })
                .from(circles)
                .where(eq(circles.id, invitation.circleId))
                .limit(1);

            return { success: true, data: { slug: circle.slug } };
        }

        // We run updates in a transaction
        const targetSlug = await db.transaction(async (tx) => {
            // Insert member
            await tx.insert(circleMembers).values({
                circleId: invitation.circleId,
                userId: dbUser.id,
                role: invitation.role,
                status: 'active',
                invitedBy: invitation.invitedBy,
                acceptedAt: new Date(),
            });

            // Update invitation
            await tx
                .update(invitations)
                .set({
                    status: 'accepted',
                    acceptedAt: new Date(),
                    invitedUserId: dbUser.id,
                    updatedAt: new Date(),
                })
                .where(eq(invitations.id, invitation.id));

            // Get circle slug
            const [circle] = await tx
                .select({ slug: circles.slug })
                .from(circles)
                .where(eq(circles.id, invitation.circleId))
                .limit(1);

            return circle.slug;
        });

        // Update Clerk metadata so they skip onboarding and default to this circle
        try {
            const clerk = await clerkClient();
            await clerk.users.updateUserMetadata(userId, {
                publicMetadata: {
                    onboardingComplete: true,
                    activeCircleId: invitation.circleId,
                },
            });
        } catch (clerkError) {
            console.error('Failed to update Clerk metadata during invite acceptance:', clerkError);
        }

        return { success: true, data: { slug: targetSlug } };
    } catch (error: any) {
        console.error('Accept Invitation Error:', error);
        return { success: false, error: error.message || 'Failed to accept invitation.' };
    }
}

export async function declineInvitationAction(
    token: string
): Promise<ActionResponse<void>> {
    try {
        const { userId } = await auth();

        if (!userId) {
            return { success: false, error: 'Unauthorized: Please log in to decline the invitation.' };
        }

        const [invitation] = await db
            .select()
            .from(invitations)
            .where(eq(invitations.token, token))
            .limit(1);

        if (!invitation) {
            return { success: false, error: 'Invitation not found.' };
        }

        if (invitation.status !== 'pending') {
            return { success: false, error: `This invitation is already ${invitation.status}.` };
        }

        await db
            .update(invitations)
            .set({
                status: 'declined',
                updatedAt: new Date(),
            })
            .where(eq(invitations.id, invitation.id));

        return { success: true };
    } catch (error: any) {
        console.error('Decline Invitation Error:', error);
        return { success: false, error: error.message || 'Failed to decline invitation.' };
    }
}

export async function getCircleRoleAction(
    circleSlug: string
): Promise<ActionResponse<'owner' | 'admin' | 'treasurer' | 'member' | null>> {
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

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(circleSlug);
        const [member] = await db
            .select({ role: circleMembers.role })
            .from(circleMembers)
            .innerJoin(circles, eq(circles.id, circleMembers.circleId))
            .where(
                and(
                    eq(circleMembers.userId, dbUser.id),
                    eq(circleMembers.status, 'active'),
                    isUuid 
                        ? or(eq(circles.id, circleSlug), eq(circles.slug, circleSlug))
                        : eq(circles.slug, circleSlug)
                )
            )
            .limit(1);

        return { success: true, data: member ? member.role as 'owner' | 'admin' | 'treasurer' | 'member' : null };
    } catch (error) {
        console.error('Get Circle Role Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to get circle role.' };
    }
}