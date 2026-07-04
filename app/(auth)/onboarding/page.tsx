'use client'

import * as React from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from './_actions'
import { OnboardingCard } from '@/components/onboarding/onboardingCard'
import { CircleFormValues } from '@/components/forms/schema/circleFormSchema'

import { toast } from 'sonner'

export default function OnboardingComponent() {
    const [error, setError] = React.useState('')
    const { user } = useUser()
    const router = useRouter()

const handleSubmit = async (data: CircleFormValues) => {
        setError('');
        const res = await completeOnboarding(data);

        if (res.success) {
            toast.success('Circle created successfully!');
            await user?.reload();
            router.push('/dashboard');
        } else {
            const errorMsg = res.error ?? 'Something went wrong.';
            setError(errorMsg);
            toast.error(errorMsg);
        }
    };
    return (
        <OnboardingCard 
            onComplete={handleSubmit} 
            onCancel={() => router.push('/dashboard')} 
            error={error}
        />
    )
}