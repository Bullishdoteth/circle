'use client'

import * as React from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from './_actions'
import { OnboardingCard } from '@/components/onboarding/onboardingCard'
import { CircleFormData } from '@/types/onboarding'

export default function OnboardingComponent() {
    const [error, setError] = React.useState('')
    const { user } = useUser()
    const router = useRouter()

    const handleSubmit = async (data: CircleFormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value);
    });
    const res = await completeOnboarding(formData);

    if (res?.message) {
        await user?.reload();
        router.push('/dashboard');
    }

    if (res?.error) {
        setError(res.error);
    }
};
    return (
        <OnboardingCard onComplete={handleSubmit} onCancel={() => router.push('/dashboard')} />
    )
}