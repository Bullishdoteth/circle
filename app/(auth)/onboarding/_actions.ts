'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';

import { circleFormSchema, CircleFormValues } from '@/components/forms/schema/circleFormSchema';
import { createCircleAction } from '@/lib/actions/circle';

export interface CompleteOnboardingResult {
    success: boolean;
    error?: string;
    fieldErrors?: Record<string, string[] | undefined>;
    circleId?: string;
}

export async function completeOnboarding(
    data: CircleFormValues
): Promise<CompleteOnboardingResult> {
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
        name: parsed.data.name,
        slug: parsed.data.slug || '',
        description: parsed.data.description,
        logoUrl: parsed.data.logoUrl,
        privacy: parsed.data.privacy,
        members: parsed.data.members,
    });

    if (!result.success || !result.data) {
        return {
            success: false,
            error: result.error ?? 'Unable to create your circle.',
        };
    }

    // Update Clerk metadata
    try {
        const clerk = await clerkClient();

        await clerk.users.updateUserMetadata(userId, {
            publicMetadata: {
                onboardingComplete: true,
                activeCircleId: result.data.id,
            },
        });
    } catch (error) {
        console.error('Failed to update Clerk metadata:', error);
        // Circle was created successfully; don't fail the whole action
        // over a metadata sync issue, but surface it so the caller knows
        // onboardingComplete may not be reflected in the session yet.
        return {
            success: true,
            circleId: result.data.id,
            error: 'Circle created, but we could not finalize your account setup. Please refresh.',
        };
    }

    return {
        success: true,
        circleId: result.data.id,
    };
}