'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Settings, X, Loader2, Save, HelpCircle, Shield, Globe } from 'lucide-react';
import { updateCircleSettingsAction } from '@/lib/actions/circle';

interface CircleData {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    currency: 'NGN' | 'USD' | 'EUR' | 'GBP';
    visibility: 'invite_only' | 'private';
    contributionAmount: string;
    frequency: string;
    payoutMethod: string;
    currentRound: number;
}

interface Props {
    circle: CircleData;
}

export function ContributionSettingsButton({ circle }: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form states
    const [name, setName] = useState(circle.name);
    const [slug, setSlug] = useState(circle.slug);
    const [description, setDescription] = useState(circle.description || '');
    const [contributionAmount, setContributionAmount] = useState(parseFloat(circle.contributionAmount));
    const [frequency, setFrequency] = useState(circle.frequency);
    const [privacy, setPrivacy] = useState<'invite_only' | 'private'>(circle.visibility);
    const [payoutMethod, setPayoutMethod] = useState(circle.payoutMethod);
    const [currentRound, setCurrentRound] = useState(circle.currentRound);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim()) {
            toast.error('Circle name cannot be empty.');
            return;
        }

        if (!slug.trim()) {
            toast.error('Circle slug cannot be empty.');
            return;
        }

        if (contributionAmount <= 0) {
            toast.error('Contribution amount must be greater than zero.');
            return;
        }

        setLoading(true);
        try {
            const res = await updateCircleSettingsAction(circle.id, {
                name,
                slug,
                description,
                privacy,
                contributionAmount,
                payoutMethod,
                frequency,
                currentRound,
            });

            if (res.success) {
                toast.success('Circle settings updated successfully!');
                setIsOpen(false);
                router.refresh();
            } else {
                toast.error(res.error || 'Failed to update circle settings.');
            }
        } catch (err: any) {
            console.error(err);
            toast.error('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-700"
                title="Circle Settings"
            >
                <Settings size={18} />
            </button>

            {/* Sidebar Slide-Over Overlay Container */}
            <div className={`fixed inset-0 z-50 overflow-hidden ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                {/* Glassmorphic Backdrop */}
                <div 
                    className={`absolute inset-0 bg-gray-900/30 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
                        isOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                    onClick={() => setIsOpen(false)}
                />

                {/* Sliding Sidebar Panel */}
                <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
                    <div 
                        className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform ${
                            isOpen ? 'translate-x-0' : 'translate-x-full'
                        }`}
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-white">
                            <div>
                                <h2 className="text-base font-bold text-gray-900 font-space-grotesk flex items-center gap-2">
                                    <Settings className="text-purple-600 animate-spin-slow" size={18} />
                                    Circle & Contribution Settings
                                </h2>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                    Configure savings rules and targets for this circle.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                            {/* Savings Target Section */}
                            <div className="rounded-2xl border border-purple-100 bg-purple-50/20 p-4 space-y-4">
                                <h3 className="text-xs font-bold text-purple-900 font-space-grotesk uppercase tracking-wider flex items-center gap-1.5">
                                    <HelpCircle size={14} className="text-purple-600" />
                                    Savings Strategy
                                </h3>
                                
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                        Contribution Target ({circle.currency})
                                    </label>
                                    <div className="relative rounded-xl shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <span className="text-xs font-semibold text-gray-400 font-mono">
                                                {circle.currency === 'NGN' ? '₦' : '$'}
                                            </span>
                                        </div>
                                        <input
                                            type="number"
                                            value={contributionAmount}
                                            onChange={(e) => setContributionAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                                            placeholder="50,000.00"
                                            className="block w-full rounded-xl border border-gray-200 py-2.5 pl-8 pr-3 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono"
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400">
                                        The fixed savings amount required from each member per cycle.
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                        Contribution Frequency
                                    </label>
                                    <select
                                        value={frequency}
                                        onChange={(e) => setFrequency(e.target.value)}
                                        className="block w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    >
                                        <option value="weekly">Weekly</option>
                                        <option value="bi-weekly">Bi-weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                    <p className="text-[10px] text-gray-400">
                                        Defines how often rotation round distributions and deposits take place.
                                    </p>
                                </div>
                            </div>

                            {/* Basic Details Section */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    General Details
                                </h3>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                        Circle Name
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="block w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                        Circle URL Slug
                                    </label>
                                    <input
                                        type="text"
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value)}
                                        className="block w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                        Description
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        className="block w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        placeholder="What is this circle for?"
                                    />
                                </div>
                            </div>

                            {/* Access & Policy Section */}
                            <div className="space-y-4 pt-2">
                                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Privacy & Execution
                                </h3>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                        Visibility / Privacy
                                    </label>
                                    <select
                                        value={privacy}
                                        onChange={(e) => setPrivacy(e.target.value as any)}
                                        className="block w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    >
                                        <option value="invite_only">Invite Only (Private)</option>
                                        <option value="private">Hidden (Invisible to Search)</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                        Payout Method
                                    </label>
                                    <select
                                        value={payoutMethod}
                                        onChange={(e) => setPayoutMethod(e.target.value)}
                                        className="block w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    >
                                        <option value="manual">Manual Treasury Disbursal</option>
                                        <option value="auto">Automated Sub-Account Settlement</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                        Current Cycle Round
                                    </label>
                                    <input
                                        type="number"
                                        value={currentRound}
                                        onChange={(e) => setCurrentRound(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="block w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        required
                                    />
                                </div>
                            </div>
                        </form>

                        {/* Footer Controls */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-500 transition hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-60"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Saving Changes...
                                    </>
                                ) : (
                                    <>
                                        <Save size={14} />
                                        Save Settings
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
