'use client';

import React, { useState, useEffect } from 'react';
import { Users, Gift, Wallet, UserPlus, ArrowRight, Loader2 } from 'lucide-react';
import { getRecentActivityAction, type ActivityItem } from '@/lib/actions/contributions';

interface Props {
    activeCircleSlug?: string | null;
}

function getIcon(type: string) {
    const iconMap: Record<string, React.ReactNode> = {
        gift: <Gift size={20} className="text-amber-500" />,
        wallet: <Wallet size={20} className="text-blue-500" />,
        'user-plus': <UserPlus size={20} className="text-purple-500" />,
        users: <Users size={20} className="text-green-500" />,
    };
    return iconMap[type] || <Users size={20} className="text-gray-500" />;
}

function formatRelativeTime(dateInput: string | Date) {
    const date = new Date(dateInput);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0 || diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

export function RecentActivity({ activeCircleSlug }: Props) {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            setLoading(true);
            const res = await getRecentActivityAction(activeCircleSlug);
            if (res.success && res.data) {
                setActivities(res.data);
            }
            setLoading(false);
        };
        fetchActivity();
    }, [activeCircleSlug]);

    return (
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.01)] border border-gray-100 min-h-[300px] flex flex-col justify-between">
            <div>
                <h2 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6">Recent Activity</h2>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center text-xs text-gray-400 py-12">
                        No recent activity recorded for this circle.
                    </div>
                ) : (
                    <div className="space-y-3 md:space-y-4">
                        {activities.map((item) => (
                            <div key={item.id} className="flex items-start gap-3 md:gap-4 pb-3 md:pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                                <div className="shrink-0 w-9 md:w-10 h-9 md:h-10 bg-gray-50 rounded-full flex items-center justify-center">
                                    {getIcon(item.icon)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-xs md:text-sm font-medium text-gray-900 leading-tight text-pretty">
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(item.createdAt)}</p>
                                </div>

                                {item.amount && (
                                    <p className="text-xs md:text-sm font-semibold text-gray-900 shrink-0 whitespace-nowrap">
                                        {item.amount}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <a
                href="/transactions"
                className="inline-flex items-center gap-1 text-purple-600 font-medium text-xs md:text-sm mt-4 md:mt-6 hover:gap-2 transition-all"
            >
                View all transactions
                <ArrowRight size={16} />
            </a>
        </div>
    );
}
