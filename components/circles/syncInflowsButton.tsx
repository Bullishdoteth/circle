'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RefreshCw, Loader2 } from 'lucide-react';
import { syncCircleInflowsAction } from '@/lib/actions/contributions';

interface Props {
    circleSlug: string;
}

export function SyncInflowsButton({ circleSlug }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSync = async () => {
        setLoading(true);
        try {
            const res = await syncCircleInflowsAction(circleSlug);
            if (res.success && res.data) {
                const count = res.data.syncedCount;
                if (count > 0) {
                    toast.success(`Successfully synced ${count} new deposit(s)!`);
                } else {
                    toast.info('No new deposits found to sync.');
                }
                router.refresh();
            } else {
                toast.error(res.error || 'Failed to sync deposits.');
            }
        } catch (err: any) {
            console.error(err);
            toast.error('An unexpected error occurred during sync.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleSync}
            disabled={loading}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 disabled:opacity-60"
        >
            {loading ? (
                <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-700" />
                    Syncing...
                </>
            ) : (
                <>
                    <RefreshCw className="h-3.5 w-3.5 text-purple-700" />
                    Sync Inflows
                </>
            )}
        </button>
    );
}
