'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createPayoutAction, resolveBankAccountAction, type NombaBank } from '@/lib/actions/payouts';
import { Loader2, Plus, X, Landmark, User, CreditCard, Users, CheckCircle, AlertTriangle, Sparkles, Coins } from 'lucide-react';

interface Member {
    userId: string;
    name: string;
    email: string;
    payoutBankCode?: string | null;
    payoutBankName?: string | null;
    payoutAccountNumber?: string | null;
    payoutAccountName?: string | null;
}

interface Props {
    circleId: string;
    members: Member[];
    banks: NombaBank[];
    circleContributionAmount: number;
}

type PayoutMode = 'member' | 'manual' | 'all';

export function CreatePayoutDialog({ circleId, members, banks, circleContributionAmount }: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resolvingName, setResolvingName] = useState(false);

    // Mode Selector
    const [mode, setMode] = useState<PayoutMode>('member');

    // General Form Fields
    const [amount, setAmount] = useState('');
    const [round, setRound] = useState('Round 1');

    // Circle Member Mode Fields
    const [selectedUser, setSelectedUser] = useState('');

    // Manual / Custom Lookup Mode Fields
    const [selectedBank, setSelectedBank] = useState('');
    const [bankSearch, setBankSearch] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [isResolved, setIsResolved] = useState(false);

    const filteredBanks = banks.filter((b) =>
        b.name.toLowerCase().includes(bankSearch.toLowerCase())
    );

    // Auto-trigger Nomba Name Resolution
    useEffect(() => {
        if (mode !== 'manual') return;
        if (selectedBank && accountNumber.length === 10) {
            const resolveName = async () => {
                setResolvingName(true);
                setIsResolved(false);
                const res = await resolveBankAccountAction({
                    bankCode: selectedBank,
                    accountNumber: accountNumber,
                });
                setResolvingName(false);

                if (res.success && res.data?.accountName) {
                    setAccountName(res.data.accountName);
                    setIsResolved(true);
                    toast.success(`Account resolved: ${res.data.accountName}`);
                } else {
                    toast.error(res.error || 'Could not resolve account name. You can still input details manually.');
                }
            };
            resolveName();
        }
    }, [selectedBank, accountNumber, mode]);

    const handleRecipientChange = (userId: string) => {
        setSelectedUser(userId);
        if (userId) {
            const member = members.find((m) => m.userId === userId);
            if (member) {
                // Pre-fill amount with the payout pool total (contribution amount * member count)
                const poolTotal = circleContributionAmount * members.length;
                setAmount(String(poolTotal));
                
                // Pre-fill bank details
                setSelectedBank(member.payoutBankCode || '');
                if (member.payoutBankCode) {
                    const bankObj = banks.find((b) => b.code === member.payoutBankCode);
                    setBankSearch(bankObj ? bankObj.name : '');
                } else {
                    setBankSearch('');
                }
                setAccountNumber(member.payoutAccountNumber || '');
                setAccountName(member.payoutAccountName || '');
            }
        } else {
            setAmount('');
            setSelectedBank('');
            setBankSearch('');
            setAccountNumber('');
            setAccountName('');
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Bulk Payouts Mode (All Members)
        if (mode === 'all') {
            const membersWithBanks = members.filter(
                (m) => m.payoutBankCode && m.payoutAccountNumber && m.payoutAccountName
            );

            if (membersWithBanks.length === 0) {
                toast.error('No members have set up their payout bank details yet.');
                return;
            }

            setLoading(true);
            let successCount = 0;
            let failureCount = 0;

            const baseAmount = String(circleContributionAmount);

            // Sequentially trigger transfers
            for (const m of membersWithBanks) {
                const toastId = toast.loading(`Processing payout to ${m.name}...`);
                const res = await createPayoutAction({
                    circleId,
                    userId: m.userId,
                    amount: baseAmount,
                    bankCode: m.payoutBankCode!,
                    bankName: m.payoutBankName || 'Destination Bank',
                    accountNumber: m.payoutAccountNumber!,
                    accountName: m.payoutAccountName!,
                    round,
                });

                toast.dismiss(toastId);
                if (res.success) {
                    successCount++;
                } else {
                    failureCount++;
                    console.error(`Failed bulk transfer to ${m.name}:`, res.error);
                }
            }

            setLoading(false);
            if (successCount > 0) {
                toast.success(`Successfully disbursed ${successCount} payouts!`);
            }
            if (failureCount > 0) {
                toast.error(`Failed to disburse ${failureCount} payouts.`);
            }

            setIsOpen(false);
            router.refresh();
            return;
        }

        // 2. Individual Payout (Member or Manual)
        if (!amount || !selectedBank || !accountNumber || !accountName) {
            toast.error('Please complete all payout fields.');
            return;
        }

        const targetUser = mode === 'member' ? selectedUser : 'manual_recipient';
        if (mode === 'member' && !selectedUser) {
            toast.error('Please select a recipient member.');
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
            userId: targetUser,
            amount,
            bankCode: selectedBank,
            bankName: bankObj.name,
            accountNumber,
            accountName,
            round,
        });
        setLoading(false);

        if (res.success) {
            toast.success('Payout processed successfully!');
            setIsOpen(false);
            // Reset
            setSelectedUser('');
            setAmount('');
            setSelectedBank('');
            setBankSearch('');
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
                className="inline-flex cursor-pointer h-10 items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-4 text-xs font-bold text-white shadow-[0_4px_12px_rgba(147,51,234,0.15)] transition hover:bg-purple-700"
            >
                <Plus size={14} /> Process Payout
            </button>

            {/* Backdrop Blur overlay */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
                />
            )}

            {/* Slide-in Sheet */}
            <div className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-out border-l border-gray-150 flex flex-col ${
                isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
                
                {/* Header */}
                <div className="border-b border-gray-100 p-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 font-space-grotesk flex items-center gap-2">
                            <Coins className="text-purple-600" size={20} />
                            Disburse Circle Payouts
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Distribute accumulated circle funds to members</p>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Main Form container */}
                <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                    
                    {/* Mode segmented control */}
                    <div className="bg-gray-100 p-1 rounded-xl grid grid-cols-3 gap-1 text-xs">
                        <button
                            type="button"
                            onClick={() => {
                                setMode('member');
                                handleRecipientChange('');
                            }}
                            className={`rounded-lg py-2 font-semibold transition cursor-pointer ${
                                mode === 'member' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Circle Member
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setMode('manual');
                                handleRecipientChange('');
                            }}
                            className={`rounded-lg py-2 font-semibold transition cursor-pointer ${
                                mode === 'manual' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Custom Bank
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setMode('all');
                                handleRecipientChange('');
                            }}
                            className={`rounded-lg py-2 font-semibold transition cursor-pointer ${
                                mode === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Payout to All
                        </button>
                    </div>

                    {/* Shared: Rotation Round selection */}
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

                    {/* MODE 1: Circle Member Selection */}
                    {mode === 'member' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Recipient Member</label>
                                <select
                                    required
                                    value={selectedUser}
                                    onChange={(e) => handleRecipientChange(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                >
                                    <option value="">Select Circle Member...</option>
                                    {members.map((m) => (
                                        <option key={m.userId} value={m.userId}>
                                            {m.name} ({m.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedUser && (
                                <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4 space-y-3.5 text-xs">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 font-medium">Payout Pool Total</span>
                                        <span className="text-purple-700 font-extrabold font-space-grotesk text-sm">
                                            ₦{parseFloat(amount || '0').toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="border-t border-purple-100 pt-3 space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 font-medium">Saved Bank</span>
                                            <span className="text-gray-900 font-bold">{bankSearch || 'Not Set'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 font-medium">Account Number</span>
                                            <span className="text-gray-900 font-mono font-bold">{accountNumber || 'Not Set'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 font-medium">Account Holder</span>
                                            <span className="text-gray-900 font-bold">{accountName || 'Not Set'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* MODE 2: Custom Bank / Lookup mode */}
                    {mode === 'manual' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Payout Amount (₦)</label>
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

                            <div className="relative">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Destination Bank</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        placeholder="Search bank name..."
                                        value={bankSearch}
                                        onChange={(e) => {
                                            setBankSearch(e.target.value);
                                            setDropdownOpen(true);
                                        }}
                                        onFocus={() => setDropdownOpen(true)}
                                        onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                                        className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    />
                                    {selectedBank && (
                                        <span className="absolute right-3 top-2.5 text-[9px] text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded-md">
                                            Selected
                                        </span>
                                    )}
                                </div>
                                {dropdownOpen && (
                                    <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-150 bg-white p-1 shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-50/50">
                                        {filteredBanks.length === 0 ? (
                                            <div className="p-2.5 text-center text-xs text-gray-400">No banks found.</div>
                                        ) : (
                                            filteredBanks.map((b) => (
                                                <button
                                                    key={b.code}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedBank(b.code);
                                                        setBankSearch(b.name);
                                                        setDropdownOpen(false);
                                                    }}
                                                    className="w-full text-left rounded-lg p-2 text-xs text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition cursor-pointer"
                                                >
                                                    {b.name}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Account Number</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={10}
                                    minLength={10}
                                    placeholder="10-digit account number"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                />
                            </div>

                            <div className="relative">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center justify-between">
                                    <span>Account Holder Name</span>
                                    {resolvingName && <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />}
                                    {isResolved && !resolvingName && (
                                        <span className="flex items-center text-[9px] font-bold text-green-600 gap-0.5 normal-case">
                                            <CheckCircle size={10} /> Resolved via Nomba
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Holder name"
                                    value={accountName}
                                    onChange={(e) => {
                                        setAccountName(e.target.value);
                                        setIsResolved(false);
                                    }}
                                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* MODE 3: Payout to All (Bulk) */}
                    {mode === 'all' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                            
                            {/* Summary Card */}
                            <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4 text-xs space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Disbursement Amount / Member</span>
                                    <span className="text-gray-900 font-bold">₦{circleContributionAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center border-t border-purple-100 pt-2.5">
                                    <span className="text-gray-500 font-medium">Disbursable Members</span>
                                    <span className="text-gray-900 font-extrabold">
                                        {members.filter(m => m.payoutBankCode && m.payoutAccountNumber).length} of {members.length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-t border-purple-100 pt-2.5">
                                    <span className="text-gray-500 font-bold">Total Bulk Disbursement</span>
                                    <span className="text-purple-700 font-extrabold font-space-grotesk text-sm">
                                        ₦{(circleContributionAmount * members.filter(m => m.payoutBankCode && m.payoutAccountNumber).length).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Members Checklist */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Payout Schedule Recipients</label>
                                <div className="rounded-xl border border-gray-100 divide-y divide-gray-100 max-h-60 overflow-y-auto">
                                    {members.map((m) => {
                                        const hasBank = !!m.payoutBankCode && !!m.payoutAccountNumber;
                                        return (
                                            <div key={m.userId} className="p-3 flex items-start justify-between text-xs gap-3">
                                                <div className="space-y-0.5">
                                                    <div className="font-bold text-gray-900">{m.name}</div>
                                                    <div className="text-[10px] text-gray-400">{m.email}</div>
                                                    {hasBank ? (
                                                        <div className="text-[10px] text-purple-700 font-semibold font-mono mt-1">
                                                            {m.payoutBankName} ({m.payoutAccountNumber})
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1 text-[9px] font-bold text-amber-600 mt-1">
                                                            <AlertTriangle size={10} /> Payout Details Missing
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                                    hasBank ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}>
                                                    {hasBank ? 'Ready' : 'Skip'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer Drawer actions */}
                <div className="border-t border-gray-100 p-4 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-xs font-semibold text-gray-500 hover:bg-gray-100 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleFormSubmit}
                        disabled={loading || resolvingName}
                        className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-purple-600 px-6 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-60 shadow-[0_4px_12px_rgba(147,51,234,0.15)] transition"
                    >
                        {loading ? (
                            <span className="flex items-center gap-1.5">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                            </span>
                        ) : (
                            <span>Confirm & Disburse</span>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
