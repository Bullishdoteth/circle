'use client';

import { useUser } from '@clerk/nextjs';

export function Greetings() {
    const { user } = useUser();

    const hour = new Date().getHours();

    const greeting =
        hour < 12
            ? 'Good morning'
            : hour < 17
                ? 'Good afternoon'
                : 'Good evening';

    const userName =
        user?.firstName ||
        user?.fullName ||
        user?.username ||
        user?.primaryEmailAddress?.emailAddress.split('@')[0] ||
        'there';

    return (
        <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-balance">
                {greeting}, {userName} 👋
            </h1>

            <p className="mt-1 text-xs text-gray-600 md:text-sm">
                Here&apos;s what&apos;s happening in your circles today.
            </p>
        </div>
    );
}