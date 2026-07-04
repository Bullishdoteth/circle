'use server';

import { auth } from '@clerk/nextjs/server';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/db';
import { circles } from '@/lib/db/schema';

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

        let finalSlug = input.slug.trim().toLowerCase();

        if (!finalSlug) {
        finalSlug = input.name
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-');
        }

        const now = new Date();

        const insertedRows = await db
        .insert(circles)
        .values({
            slug: finalSlug,
            name: input.name.trim(),
            description: input.description?.trim() || null,
            imageUrl: input.logoUrl || null,
            //eslint-disable-next-line @typescript-eslint/no-explicit-any
            currency: (input.currency || 'NGN') as any,
            ownerId: userId,
            createdBy: userId,
            visibility: input.privacy || 'invite_only',
            status: 'active',
            lastActivityAt: now,
        })
        .returning();

        return {
        success: true,
        data: insertedRows[0] as CircleRecord,
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