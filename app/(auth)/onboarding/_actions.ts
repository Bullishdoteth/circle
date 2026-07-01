'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'

export const completeOnboarding = async (formData: FormData) => {
    const { isAuthenticated, userId } = await auth()

    if (!isAuthenticated) {
        return { message: 'No signed-in user' }
    }

    const client = await clerkClient()

    try {
        const res = await client.users.updateUserMetadata(userId, {
        publicMetadata: {
            onboardingComplete: true,
            applicationName: formData.get('applicationName'),
            applicationType: formData.get('applicationType'),
        },
        })
        return { message: res.publicMetadata }
    } catch {
        return { error: 'There was an error updating the user metadata.' }
    }
}