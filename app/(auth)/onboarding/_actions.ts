'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';

import type { CircleFormData } from '@/types/onboarding';
import { circleFormSchema } from '@/components/forms/schema/circleFormSchema';
import { createCircleAction } from '@/lib/actions/circle';

export async function completeOnboarding(data: CircleFormData) {
    const { userId } = await auth();

    if (!userId) {
        return {
            success: false,
            error: 'You must be signed in to continue.',
        };
    }

    // Validate the submitted data
    const parsed = circleFormSchema.safeParse(data);

    if (!parsed.success) {
        return {
            success: false,
            error: 'Please complete all required fields.',
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }

    // Create the circle
    const result = await createCircleAction({
        ...parsed.data,
        slug: parsed.data.slug || '',
    });

    if (!result.success || !result.data) {
        return {
            success: false,
            error: result.error ?? 'Unable to create your circle.',
        };
    }

    // Update Clerk metadata
    const clerk = await clerkClient();

    await clerk.users.updateUserMetadata(userId, {
        publicMetadata: {
            onboardingComplete: true,
            activeCircleId: result.data.id,
        },
    });

    return {
        success: true,
        circleId: result.data.id,
    };
}