'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Users, Lock, Mail, ArrowRight } from 'lucide-react';
import { getMyCirclesAction, type CircleRecord } from '@/lib/actions/circle';
import { CreateCircleButton } from '@/components/circles/createCircleButton';

type CircleWithCount = CircleRecord & { memberCount: number };

function StatusBadge({ status }: { status: CircleRecord['status'] }) {
    const styles: Record<string, string> = {
        active: 'bg-green-50 text-green-700 ring-green-600/20',
        archived: 'bg-gray-100 text-gray-600 ring-gray-500/20',
        suspended: 'bg-red-50 text-red-700 ring-red-600/20',
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ring-1 ring-inset ${
                styles[status] ?? styles.active
            }`}
        >
            {status}
        </span>
    );
}

function CircleCard({ circle }: { circle: CircleWithCount }) {
    return (
        <Link
            href={`/circles/${circle.slug}`}
            className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:border-purple-200 hover:shadow-[0_8px_24px_rgba(124,58,237,0.08)]"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-purple-100 to-purple-50 text-lg font-bold text-purple-700">
                        {circle.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={circle.imageUrl}
                                alt={circle.name}
                                className="h-full w-full rounded-xl object-cover"
                            />
                        ) : (
                            circle.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-gray-900">
                            {circle.name}
                        </h3>
                        <p className="text-xs text-gray-400">/{circle.slug}</p>
                    </div>
                </div>
                <StatusBadge status={circle.status} />
            </div>

            <p className="mt-3 line-clamp-2 min-h-[2rem] text-xs text-gray-500">
                {circle.description || 'No description provided for this circle.'}
            </p>

            <div className="mt-4 flex items-center gap-4 border-t border-gray-50 pt-4 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                    <Users size={14} className="text-gray-400" />
                    {circle.memberCount} {circle.memberCount === 1 ? 'member' : 'members'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    {circle.visibility === 'invite_only' ? (
                        <Mail size={14} className="text-gray-400" />
                    ) : (
                        <Lock size={14} className="text-gray-400" />
                    )}
                    {circle.visibility === 'invite_only' ? 'Invite only' : 'Private'}
                </span>
                <span className="ml-auto font-semibold text-purple-600 opacity-0 transition-opacity group-hover:opacity-100">
                    <ArrowRight size={16} />
                </span>
            </div>
        </Link>
    );
}

export default function CirclesPage() {
    const [circles, setCircles] = useState<CircleWithCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCircles = async () => {
            const res = await getMyCirclesAction();
            if (res.success && res.data) {
                setCircles(res.data);
            } else {
                setError(res.error || 'Failed to load your circles.');
            }
            setLoading(false);
        };
        fetchCircles();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-4 md:p-8">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
                            My Circles
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            All savings circles you own and manage.
                        </p>
                    </div>
                    <CreateCircleButton />
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex h-64 w-full items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50/50 p-6 text-center text-sm text-red-600">
                        {error}
                    </div>
                ) : circles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                            <Users size={26} />
                        </div>
                        <h3 className="text-base font-bold text-gray-900">
                            No circles yet
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-gray-500">
                            You are not managing any circles. Create your first savings
                            circle to start inviting members.
                        </p>
                        <Link
                            href="/onboarding"
                            className="mt-5 inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
                        >
                            <Plus size={18} />
                            Create a Circle
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {circles.map((circle) => (
                            <CircleCard key={circle.id} circle={circle} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
