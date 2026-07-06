'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { reconcileContributionAction } from '@/lib/actions/contributions';
import { Loader2, Check } from 'lucide-react';

interface Member {
    userId: string;
    name: string;
    email: string;
}

interface Props {
    contributionId: string;
    members: Member[];
}

export function ReconcileContributionButton({ contributionId, members }: Props) {
    const router = useRouter();
    const [selectedUser, setSelectedUser] = useState('');
    const [round, setRound] = useState('Round 1');
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const handleReconcile = async () => {
        if (!selectedUser) {
            toast.error('Please select a member to map this deposit to.');
            return;
        }

        setLoading(true);
        const res = await reconcileContributionAction(contributionId, selectedUser, round);
        setLoading(false);

        if (res.success) {
            toast.success('Deposit successfully reconciled!');
            setShowDropdown(false);
            router.refresh();
        } else {
            toast.error(res.error || 'Failed to reconcile deposit.');
        }
    };

    return (
        <div className="relative">
            {!showDropdown ? (
                <button
                    onClick={() => setShowDropdown(true)}
                    className="inline-flex h-8 items-center justify-center rounded-lg bg-purple-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-700"
                >
                    Reconcile
                </button>
            ) : (
                <div className="absolute right-0 top-0 z-10 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-lg flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Map Deposit to:</span>
                    <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="rounded-lg border border-gray-200 p-1.5 text-xs text-gray-800 outline-none focus:border-purple-500"
                    >
                        <option value="">Select Member...</option>
                        {members.map((m) => (
                            <option key={m.userId} value={m.userId}>
                                {m.name} ({m.email})
                            </option>
                        ))}
                    </select>

                    <span className="text-[10px] font-bold text-gray-400 uppercase">Contribution Round:</span>
                    <select
                        value={round}
                        onChange={(e) => setRound(e.target.value)}
                        className="rounded-lg border border-gray-200 p-1.5 text-xs text-gray-800 outline-none focus:border-purple-500"
                    >
                        <option value="Round 1">Round 1</option>
                        <option value="Round 2">Round 2</option>
                        <option value="Round 3">Round 3</option>
                        <option value="Round 4">Round 4</option>
                        <option value="Round 5">Round 5</option>
                    </select>

                    <div className="flex items-center justify-end gap-1.5 mt-1">
                        <button
                            onClick={() => setShowDropdown(false)}
                            className="inline-flex h-7 items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 text-[10px] font-semibold text-gray-500 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReconcile}
                            disabled={loading}
                            className="inline-flex h-7 items-center justify-center rounded-md bg-emerald-600 px-2.5 text-[10px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                            {loading ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <span className="flex items-center gap-0.5"><Check size={10} /> Assign</span>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
