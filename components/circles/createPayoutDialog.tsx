'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createPayoutAction, type NombaBank } from '@/lib/actions/payouts';
import { Loader2, Plus } from 'lucide-react';

interface Member {
    userId: string;
    name: string;
    email: string;
}

interface Props {
    circleId: string;
    members: Member[];
    banks: NombaBank[];
}

export function CreatePayoutDialog({ circleId, members, banks }: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [selectedUser, setSelectedUser] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedBank, setSelectedBank] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [round, setRound] = useState('Round 1');

    const handleCreatePayout = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedUser || !amount || !selectedBank || !accountNumber || !accountName) {
            toast.error('Please fill in all payout details.');
            return;
        }

        const bankObj = banks.find((b) => b.code === selectedBank);
        if (!bankObj) {
            toast.error('Invalid bank selected.');
            return;
        }

        setLoading(true);
        const res = await createPayoutAction({
            circleId,
            userId: selectedUser,
            amount,
            bankCode: selectedBank,
            bankName: bankObj.name,
            accountNumber,
            accountName,
            round,
        });
        setLoading(false);

        if (res.success) {
            toast.success('Payout initiated successfully!');
            setIsOpen(false);
            // Reset form
            setSelectedUser('');
            setAmount('');
            setSelectedBank('');
            setAccountNumber('');
            setAccountName('');
            router.refresh();
        } else {
            toast.error(res.error || 'Failed to process payout.');
        }
    };

    return (
        <div>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-4 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(147,51,234,0.15)] transition hover:bg-purple-700"
            >
                <Plus size={14} /> Process Payout
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-gray-900 font-space-grotesk">
                                Process Circle Payout
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-xs font-semibold text-gray-400 hover:text-gray-600"
                            >
                                Close
                            </button>
                        </div>

                        <form onSubmit={handleCreatePayout} className="space-y-3.5">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Recipient Member</label>
                                <select
                                    required
                                    value={selectedUser}
                                    onChange={(e) => setSelectedUser(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                >
                                    <option value="">Select Recipient...</option>
                                    {members.map((m) => (
                                        <option key={m.userId} value={m.userId}>
                                            {m.name} ({m.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Amount (₦)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        step="any"
                                        placeholder="e.g. 250000"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Rotation Round</label>
                                    <select
                                        value={round}
                                        onChange={(e) => setRound(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    >
                                        <option value="Round 1">Round 1</option>
                                        <option value="Round 2">Round 2</option>
                                        <option value="Round 3">Round 3</option>
                                        <option value="Round 4">Round 4</option>
                                        <option value="Round 5">Round 5</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Destination Bank</label>
                                <select
                                    required
                                    value={selectedBank}
                                    onChange={(e) => setSelectedBank(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                >
                                    <option value="">Select Destination Bank...</option>
                                    {banks.map((b) => (
                                        <option key={b.code} value={b.code}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Account Number</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={10}
                                        minLength={10}
                                        placeholder="10-digit number"
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Account Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Full recipient name"
                                        value={accountName}
                                        onChange={(e) => setAccountName(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-500 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex h-10 items-center justify-center rounded-xl bg-purple-600 px-5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-60 shadow-[0_4px_12px_rgba(147,51,234,0.15)]"
                                >
                                    {loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        'Disburse Funds'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
