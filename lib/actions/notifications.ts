'use server';

import { auth } from '@clerk/nextjs/server';
import { and, eq, desc, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/db';
import { notifications, users } from '@/lib/db/schema';
import type { ActionResponse } from './circle';

export interface NotificationRecord {
    id: string;
    userId: string;
    circleId: string | null;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string | Date;
}

/**
 * Fetch all notifications for the authenticated user
 */
export async function getNotificationsAction(): Promise<ActionResponse<NotificationRecord[]>> {
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
            return { success: false, error: 'User record not found.' };
        }

        const rows = await db
            .select()
            .from(notifications)
            .where(
                and(
                    eq(notifications.userId, dbUser.id),
                    isNull(notifications.deletedAt)
                )
            )
            .orderBy(desc(notifications.createdAt))
            .limit(50);

        return { success: true, data: rows as NotificationRecord[] };
    } catch (error: any) {
        console.error('Get Notifications Error:', error);
        return { success: false, error: error.message || 'Failed to fetch notifications.' };
    }
}

/**
 * Mark a specific notification as read
 */
export async function markNotificationAsReadAction(
    notificationId: string
): Promise<ActionResponse<{ success: boolean }>> {
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
            return { success: false, error: 'User record not found.' };
        }

        await db
            .update(notifications)
            .set({ read: true })
            .where(
                and(
                    eq(notifications.id, notificationId),
                    eq(notifications.userId, dbUser.id)
                )
            );

        return { success: true, data: { success: true } };
    } catch (error: any) {
        console.error('Mark Notification Read Error:', error);
        return { success: false, error: error.message || 'Failed to update notification.' };
    }
}

/**
 * Mark all notifications as read for the authenticated user
 */
export async function markAllNotificationsAsReadAction(): Promise<ActionResponse<{ success: boolean }>> {
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
            return { success: false, error: 'User record not found.' };
        }

        await db
            .update(notifications)
            .set({ read: true })
            .where(
                and(
                    eq(notifications.userId, dbUser.id),
                    eq(notifications.read, false)
                )
            );

        return { success: true, data: { success: true } };
    } catch (error: any) {
        console.error('Mark All Notifications Read Error:', error);
        return { success: false, error: error.message || 'Failed to update notifications.' };
    }
}

/**
 * Helper logic to insert a new notification record from backend processes
 */
export async function createNotificationAction(input: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    circleId?: string;
}): Promise<ActionResponse<NotificationRecord>> {
    try {
        const [newNotif] = await db
            .insert(notifications)
            .values({
                userId: input.userId,
                circleId: input.circleId || null,
                title: input.title,
                message: input.message,
                type: input.type || 'info',
                read: false,
            })
            .returning();

        return { success: true, data: newNotif as NotificationRecord };
    } catch (error: any) {
        console.error('Create Notification Error:', error);
        return { success: false, error: error.message || 'Failed to create notification.' };
    }
}
