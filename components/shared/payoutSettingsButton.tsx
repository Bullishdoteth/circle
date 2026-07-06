'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Loader2, Landmark, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { fetchNombaBanksAction, type NombaBank } from '@/lib/actions/payouts';
import { getUserPayoutProfileAction, updateUserPayoutProfileAction } from '@/lib/actions/user';

export function PayoutSettingsButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [banks, setBanks] = useState<NombaBank[]>([]);

    const [bankCode, setBankCode] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch banks list
                const banksRes = await fetchNombaBanksAction();
                if (banksRes.success && banksRes.data) {
                    setBanks(banksRes.data);
                }

                // Fetch current user payout bank details
                const profileRes = await getUserPayoutProfileAction();
                if (profileRes.success && profileRes.data) {
                    const data = profileRes.data;
                    setBankCode(data.payoutBankCode || '');
                    setAccountNumber(data.payoutAccountNumber || '');
                    setAccountName(data.payoutAccountName || '');
                }
            } catch (err) {
                console.error(err);
                toast.error('Failed to load bank settings.');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [isOpen]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!bankCode || !accountNumber || !accountName) {
            toast.error('All payout fields are required.');
            return;
        }

        const selectedBank = banks.find((b) => b.code === bankCode);
        if (!selectedBank) {
            toast.error('Invalid bank selected.');
            return;
        }

        setSaving(true);
        const res = await updateUserPayoutProfileAction({
            payoutBankCode: bankCode,
            payoutBankName: selectedBank.name,
            payoutAccountNumber: accountNumber,
            payoutAccountName: accountName,
        });
        setSaving(false);

        if (res.success) {
            toast.success('Payout bank details updated successfully!');
            setIsOpen(false);
        } else {
            toast.error(res.error || 'Failed to update bank details.');
        }
    };

    return (
        <div>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-purple-50 hover:bg-purple-100 px-4 py-2.5 text-xs font-bold text-purple-700 transition"
            >
                <CreditCard size={15} /> Payout Bank Settings
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-gray-900 font-space-grotesk flex items-center gap-2">
                                <Landmark className="text-purple-600" size={18} />
                                Payout Bank Details
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-xs font-semibold text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                Close
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                                <span className="text-xs font-medium">Fetching bank details...</span>
                            </div>
                        ) : (
                            <form onSubmit={handleSave} className="space-y-4">
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Please register the bank account where your circle payouts should be deposited. Ensure details match your official ID.
                                </p>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Destination Bank</label>
                                    <select
                                        required
                                        value={bankCode}
                                        onChange={(e) => setBankCode(e.target.value)}
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

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Account Name (Holder)</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. John Doe"
                                        value={accountName}
                                        onChange={(e) => setAccountName(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-500 hover:bg-gray-50 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="inline-flex h-10 items-center justify-center rounded-xl bg-purple-600 px-5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-60 shadow-[0_4px_12px_rgba(147,51,234,0.15)] cursor-pointer"
                                    >
                                        {saving ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <span className="flex items-center gap-1.5"><CheckCircle size={14} /> Save Details</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
