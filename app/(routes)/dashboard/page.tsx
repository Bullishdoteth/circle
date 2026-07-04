'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getMyCirclesAction } from '@/lib/actions/circle';
import { BalanceCard } from '@/components/shared/balanceCard';
import { ContributionsCard } from '@/components/shared/contributionsCard';
import { Greetings } from '@/components/shared/greetings';
import { RecentActivity } from '@/components/shared/recentActivity';
import { SecurityCard } from '@/components/shared/securityCard';
import { TopCircles } from '@/components/shared/topCircles';

function DashboardContent() {
    const searchParams = useSearchParams();
    const [circles, setCircles] = useState<any[]>([]);
    const [activeCircle, setActiveCircle] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const circleSlug = searchParams?.get('circle') ?? null;

    useEffect(() => {
        const fetchCircles = async () => {
            const res = await getMyCirclesAction();
            if (res.success && res.data) {
                setCircles(res.data);
                if (circleSlug) {
                    const match = res.data.find(c => c.slug === circleSlug);
                    if (match) setActiveCircle(match);
                } else if (res.data.length > 0) {
                    setActiveCircle(res.data[0]);
                }
            }
            setLoading(false);
        };
        fetchCircles();
    }, [circleSlug]);

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center p-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="flex-1 overflow-auto">
                <div className="p-4 md:p-8">
                    {/* Header - Greeting */}
                    <Greetings />

                    {/* Active Circle Details Header if present */}
                    {activeCircle && (
                        <div className="mb-6 rounded-2xl border border-purple-100 bg-purple-50/50 p-4 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-200 text-xs font-bold text-purple-800">
                                        {activeCircle.name.charAt(0).toUpperCase()}
                                    </span>
                                    {activeCircle.name}
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    {activeCircle.description || 'No description provided for this circle.'}
                                </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
                                    Active Circle
                                </span>
                                <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-purple-600/20 ring-inset">
                                    {activeCircle.visibility === 'invite_only' ? 'Invite Only' : 'Private'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Top Section - Balance and Contributions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                        <div className="lg:col-span-2">
                            <BalanceCard activeCircle={activeCircle} totalCirclesCount={circles.length} />
                        </div>
                        <div>
                            <ContributionsCard activeCircle={activeCircle} />
                        </div>
                    </div>

                    {/* Middle Section - Recent Activity and Top Circles */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                        <RecentActivity />
                        <TopCircles circles={circles} />
                    </div>

                    {/* Bottom Section - Security Card */}
                    <SecurityCard />
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
