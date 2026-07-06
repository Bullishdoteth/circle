'use client';

import React, { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export function Greetings() {
    const { user } = useUser();
    const searchParams = useSearchParams();

    useEffect(() => {
        const error = searchParams?.get('error');
        if (error === 'unauthorized') {
            toast.error("Access Denied: You do not have permission to view that page.");
            
            // Cleanly strip the error param from the browser address bar
            const params = new URLSearchParams(window.location.search);
            params.delete('error');
            const searchStr = params.toString();
            const newUrl = window.location.pathname + (searchStr ? `?${searchStr}` : '');
            window.history.replaceState(null, '', newUrl);
        }
    }, [searchParams]);

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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-balance font-space-grotesk">
                {greeting}, {userName} 👋
            </h1>

            <p className="mt-1 text-xs text-gray-600 md:text-sm">
                Here&apos;s what&apos;s happening in your circles today.
            </p>
        </div>
    );
}