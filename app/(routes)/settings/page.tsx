'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
    getUserProfileAction, 
    updateUserProfileAction, 
    getUserPayoutProfileAction, 
    updateUserPayoutProfileAction,
    type UserProfile,
    type UserPayoutProfile
} from '@/lib/actions/user';
import { 
    fetchNombaBanksAction, 
    resolveBankAccountAction, 
    type NombaBank 
} from '@/lib/actions/payouts';
import { 
    User, 
    Landmark, 
    Bell, 
    Sliders, 
    Loader2, 
    CheckCircle2, 
    ShieldAlert, 
    Moon, 
    Sun, 
    Sparkles, 
    Settings as SettingsIcon,
    ArrowRight
} from 'lucide-react';

type SettingsTab = 'profile' | 'payout' | 'notifications' | 'general';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Profile States
    const [profile, setProfile] = useState<Partial<UserProfile>>({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phoneNumber: '',
        address: ''
    });

    // Payout Bank States
    const [banks, setBanks] = useState<NombaBank[]>([]);
    const [bankCode, setBankCode] = useState('');
    const [bankSearch, setBankSearch] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [resolvingName, setResolvingName] = useState(false);
    const [isResolved, setIsResolved] = useState(false);

    // Notification Preference States
    const [inAppContrib, setInAppContrib] = useState(true);
    const [inAppPayout, setInAppPayout] = useState(true);
    const [inAppUpdates, setInAppUpdates] = useState(true);
    const [emailReceipts, setEmailReceipts] = useState(true);
    const [emailReports, setEmailReports] = useState(false);
    const [emailInvites, setEmailInvites] = useState(true);

    // General States
    const [darkMode, setDarkMode] = useState(false);
    const [compactView, setCompactView] = useState(false);

    const filteredBanks = banks.filter((b) =>
        b.name.toLowerCase().includes(bankSearch.toLowerCase())
    );

    // Load initial data
    useEffect(() => {
        const loadSettingsData = async () => {
            try {
                // Fetch profile
                const profileRes = await getUserProfileAction();
                if (profileRes.success && profileRes.data) {
                    setProfile(profileRes.data);
                }

                // Fetch bank details
                const bankProfileRes = await getUserPayoutProfileAction();
                if (bankProfileRes.success && bankProfileRes.data) {
                    const data = bankProfileRes.data;
                    setBankCode(data.payoutBankCode || '');
                    setAccountNumber(data.payoutAccountNumber || '');
                    setAccountName(data.payoutAccountName || '');
                }

                // Fetch banks list
                const banksRes = await fetchNombaBanksAction();
                if (banksRes.success && banksRes.data) {
                    setBanks(banksRes.data);
                }

                // Load Notification/General preferences from localStorage
                if (typeof window !== 'undefined') {
                    setInAppContrib(localStorage.getItem('pref_inapp_contrib') !== 'false');
                    setInAppPayout(localStorage.getItem('pref_inapp_payout') !== 'false');
                    setInAppUpdates(localStorage.getItem('pref_inapp_updates') !== 'false');
                    setEmailReceipts(localStorage.getItem('pref_email_receipts') !== 'false');
                    setEmailReports(localStorage.getItem('pref_email_reports') === 'true');
                    setEmailInvites(localStorage.getItem('pref_email_invites') !== 'false');
                    setDarkMode(localStorage.getItem('pref_dark_mode') === 'true');
                    setCompactView(localStorage.getItem('pref_compact_view') === 'true');
                }

            } catch (err) {
                console.error(err);
                toast.error('Failed to load settings.');
            } finally {
                setLoading(false);
            }
        };

        loadSettingsData();
    }, []);

    // Sync bankSearch text input when bankCode or banks change
    useEffect(() => {
        if (bankCode && banks.length > 0) {
            const currentBank = banks.find((b) => b.code === bankCode);
            if (currentBank) {
                setBankSearch(currentBank.name);
            }
        }
    }, [bankCode, banks]);

    // Auto Name Resolve Lookup via Nomba
    useEffect(() => {
        if (bankCode && accountNumber.length === 10) {
            const resolveName = async () => {
                setResolvingName(true);
                setIsResolved(false);
                const res = await resolveBankAccountAction({
                    bankCode,
                    accountNumber
                });
                setResolvingName(false);

                if (res.success && res.data?.accountName) {
                    setAccountName(res.data.accountName);
                    setIsResolved(true);
                    toast.success(`Account verified: ${res.data.accountName}`);
                } else {
                    toast.error(res.error || 'Could not resolve account name.');
                }
            };
            resolveName();
        }
    }, [bankCode, accountNumber]);

    // Save Profile Settings
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const res = await updateUserProfileAction({
            firstName: profile.firstName || null,
            lastName: profile.lastName || null,
            username: profile.username || null,
            phoneNumber: profile.phoneNumber || null,
            address: profile.address || null,
        });
        setSaving(false);

        if (res.success) {
            toast.success('Profile settings updated successfully!');
        } else {
            toast.error(res.error || 'Failed to update profile settings.');
        }
    };

    // Save Payout Bank Settings
    const handleSavePayoutBank = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bankCode || !accountNumber || !accountName) {
            toast.error('All bank account details are required.');
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
        } else {
            toast.error(res.error || 'Failed to save bank details.');
        }
    };

    // Save Notification Preferences
    const handleSaveNotifications = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        
        if (typeof window !== 'undefined') {
            localStorage.setItem('pref_inapp_contrib', String(inAppContrib));
            localStorage.setItem('pref_inapp_payout', String(inAppPayout));
            localStorage.setItem('pref_inapp_updates', String(inAppUpdates));
            localStorage.setItem('pref_email_receipts', String(emailReceipts));
            localStorage.setItem('pref_email_reports', String(emailReports));
            localStorage.setItem('pref_email_invites', String(emailInvites));
        }

        setTimeout(() => {
            setSaving(false);
            toast.success('Notification preferences updated successfully!');
        }, 600);
    };

    // Save General Settings
    const handleSaveGeneral = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        if (typeof window !== 'undefined') {
            localStorage.setItem('pref_dark_mode', String(darkMode));
            localStorage.setItem('pref_compact_view', String(compactView));
            
            // Apply visual dark mode class if user toggles it
            if (darkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }

        setTimeout(() => {
            setSaving(false);
            toast.success('General options updated successfully!');
        }, 500);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                <span className="text-xs font-semibold text-gray-500 font-space-grotesk">Loading app settings...</span>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen p-4 md:p-8 flex items-start justify-center">
            <div className="w-full max-w-4xl bg-white border border-gray-150 rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[550px] animate-in fade-in zoom-in-95 duration-200">
                
                {/* Left Sidebar Navigation */}
                <div className="w-full md:w-64 border-r border-gray-100 bg-gray-50/50 p-4 md:p-6 flex flex-col justify-between shrink-0">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-base font-bold text-gray-900 font-space-grotesk flex items-center gap-2">
                                <SettingsIcon className="text-purple-600 w-5 h-5 animate-spin-slow" />
                                Settings
                            </h2>
                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-1">Circle Account Control</p>
                        </div>

                        <div className="space-y-1">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                    activeTab === 'profile'
                                        ? 'bg-purple-600 text-white shadow-[0_4px_12px_rgba(147,51,234,0.15)]'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <User size={16} />
                                Profile Details
                            </button>
                            <button
                                onClick={() => setActiveTab('payout')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                    activeTab === 'payout'
                                        ? 'bg-purple-600 text-white shadow-[0_4px_12px_rgba(147,51,234,0.15)]'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <Landmark size={16} />
                                Payout Bank
                            </button>
                            <button
                                onClick={() => setActiveTab('notifications')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                    activeTab === 'notifications'
                                        ? 'bg-purple-600 text-white shadow-[0_4px_12px_rgba(147,51,234,0.15)]'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <Bell size={16} />
                                Notifications
                            </button>
                            <button
                                onClick={() => setActiveTab('general')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                    activeTab === 'general'
                                        ? 'bg-purple-600 text-white shadow-[0_4px_12px_rgba(147,51,234,0.15)]'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <Sliders size={16} />
                                General Options
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-gray-100 pt-4 text-[10px] text-gray-400">
                        Securely powered by Clerk Authentication & Nomba Open Banking API
                    </div>
                </div>

                {/* Right Form Area */}
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                    
                    {/* TAB 1: Profile Details */}
                    {activeTab === 'profile' && (
                        <form onSubmit={handleSaveProfile} className="space-y-6 animate-in fade-in duration-200">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 font-space-grotesk">Profile Details</h3>
                                <p className="text-xs text-gray-500 mt-1">Configure your personal information displayed within the circle workspace.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">First Name</label>
                                    <input
                                        type="text"
                                        placeholder="First Name"
                                        value={profile.firstName || ''}
                                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        placeholder="Last Name"
                                        value={profile.lastName || ''}
                                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Username</label>
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        value={profile.username || ''}
                                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Email (Read Only)</label>
                                    <input
                                        type="email"
                                        disabled
                                        value={profile.email || ''}
                                        className="w-full rounded-xl border border-gray-150 bg-gray-50/50 p-2.5 text-xs text-gray-400 outline-none select-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        placeholder="Phone Number"
                                        value={profile.phoneNumber || ''}
                                        onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Home Address</label>
                                    <input
                                        type="text"
                                        placeholder="Home Address"
                                        value={profile.address || ''}
                                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="h-11 inline-flex cursor-pointer items-center justify-center rounded-xl bg-purple-600 px-6 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-60 transition"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* TAB 2: Payout Bank Account */}
                    {activeTab === 'payout' && (
                        <form onSubmit={handleSavePayoutBank} className="space-y-6 animate-in fade-in duration-200">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 font-space-grotesk">Payout Bank Details</h3>
                                <p className="text-xs text-gray-500 mt-1">Specify the destination bank details where you want your round distributions deposited.</p>
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
                                    {bankCode && (
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
                                                        setBankCode(b.code);
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
                                            <CheckCircle2 size={10} /> Resolved via Nomba
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

                            <div className="pt-4 border-t border-gray-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving || resolvingName}
                                    className="h-11 inline-flex cursor-pointer items-center justify-center rounded-xl bg-purple-600 px-6 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-60 transition"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Bank Details'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* TAB 3: Notifications */}
                    {activeTab === 'notifications' && (
                        <form onSubmit={handleSaveNotifications} className="space-y-6 animate-in fade-in duration-200">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 font-space-grotesk">Notification Preferences</h3>
                                <p className="text-xs text-gray-500 mt-1">Determine how and when you want to receive transaction alerts and activity updates.</p>
                            </div>

                            <div className="space-y-5">
                                
                                {/* Section 1: In-App */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">In-App Notifications</h4>
                                    
                                    <label className="flex items-center justify-between p-3.5 bg-gray-50/50 border border-gray-100 rounded-xl hover:bg-gray-100/30 transition cursor-pointer select-none">
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-bold text-gray-800">Contributions Received</div>
                                            <div className="text-[10px] text-gray-500">Alert me in the notification hub when members make deposits.</div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={inAppContrib}
                                            onChange={(e) => setInAppContrib(e.target.checked)}
                                            className="w-4.5 h-4.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 accent-purple-600 cursor-pointer"
                                        />
                                    </label>

                                    <label className="flex items-center justify-between p-3.5 bg-gray-50/50 border border-gray-100 rounded-xl hover:bg-gray-100/30 transition cursor-pointer select-none">
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-bold text-gray-800">Payout Disbursements</div>
                                            <div className="text-[10px] text-gray-500">Alert me when payouts are initialized or completed successfully.</div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={inAppPayout}
                                            onChange={(e) => setInAppPayout(e.target.checked)}
                                            className="w-4.5 h-4.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 accent-purple-600 cursor-pointer"
                                        />
                                    </label>

                                    <label className="flex items-center justify-between p-3.5 bg-gray-50/50 border border-gray-100 rounded-xl hover:bg-gray-100/30 transition cursor-pointer select-none">
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-bold text-gray-800">Circle Activity & Updates</div>
                                            <div className="text-[10px] text-gray-500">Alert me on new memberships, invitations, and metadata changes.</div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={inAppUpdates}
                                            onChange={(e) => setInAppUpdates(e.target.checked)}
                                            className="w-4.5 h-4.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 accent-purple-600 cursor-pointer"
                                        />
                                    </label>
                                </div>

                                <hr className="border-gray-100" />

                                {/* Section 2: Email */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Email Alerts</h4>

                                    <label className="flex items-center justify-between p-3.5 bg-gray-50/50 border border-gray-100 rounded-xl hover:bg-gray-100/30 transition cursor-pointer select-none">
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-bold text-gray-800">Transaction Receipts</div>
                                            <div className="text-[10px] text-gray-500">Send an email receipt with full metadata for every contribution and payout.</div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={emailReceipts}
                                            onChange={(e) => setEmailReceipts(e.target.checked)}
                                            className="w-4.5 h-4.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 accent-purple-600 cursor-pointer"
                                        />
                                    </label>

                                    <label className="flex items-center justify-between p-3.5 bg-gray-50/50 border border-gray-100 rounded-xl hover:bg-gray-100/30 transition cursor-pointer select-none">
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-bold text-gray-800">Monthly Analytics Reports</div>
                                            <div className="text-[10px] text-gray-500">Receive summaries containing circle statistics and member compliance ratings.</div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={emailReports}
                                            onChange={(e) => setEmailReports(e.target.checked)}
                                            className="w-4.5 h-4.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 accent-purple-600 cursor-pointer"
                                        />
                                    </label>

                                    <label className="flex items-center justify-between p-3.5 bg-gray-50/50 border border-gray-100 rounded-xl hover:bg-gray-100/30 transition cursor-pointer select-none">
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-bold text-gray-800">Circle Invitations & Onboarding</div>
                                            <div className="text-[10px] text-gray-500">Receive alerts when someone invites you to join or manage a circle.</div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={emailInvites}
                                            onChange={(e) => setEmailInvites(e.target.checked)}
                                            className="w-4.5 h-4.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 accent-purple-600 cursor-pointer"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="h-11 inline-flex cursor-pointer items-center justify-center rounded-xl bg-purple-600 px-6 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-60 transition"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Notification Preferences'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* TAB 4: General Options */}
                    {activeTab === 'general' && (
                        <form onSubmit={handleSaveGeneral} className="space-y-6 animate-in fade-in duration-200">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 font-space-grotesk">General Customizations</h3>
                                <p className="text-xs text-gray-500 mt-1">Configure layout densities, visual preferences, and localized configurations.</p>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Theme Preferences</h4>
                                    
                                    <label className="flex items-center justify-between p-3.5 bg-gray-50/50 border border-gray-100 rounded-xl hover:bg-gray-100/30 transition cursor-pointer select-none">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                                {darkMode ? <Moon size={16} /> : <Sun size={16} />}
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="text-xs font-bold text-gray-800">Visual Theme</div>
                                                <div className="text-[10px] text-gray-500">Toggle dark mode visual layout (experimental).</div>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={darkMode}
                                            onChange={(e) => setDarkMode(e.target.checked)}
                                            className="w-4.5 h-4.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 accent-purple-600 cursor-pointer"
                                        />
                                    </label>
                                </div>

                                <hr className="border-gray-100" />

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Layout Preferences</h4>

                                    <label className="flex items-center justify-between p-3.5 bg-gray-50/50 border border-gray-100 rounded-xl hover:bg-gray-100/30 transition cursor-pointer select-none">
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-bold text-gray-800">Compact Dashboard View</div>
                                            <div className="text-[10px] text-gray-500">Display condensed tables and dense analytics grids for better information density.</div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={compactView}
                                            onChange={(e) => setCompactView(e.target.checked)}
                                            className="w-4.5 h-4.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 accent-purple-600 cursor-pointer"
                                        />
                                    </label>
                                </div>

                                <hr className="border-gray-100" />

                                <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-2xl flex items-start gap-3">
                                    <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={16} />
                                    <div className="text-[10px] text-amber-800 leading-relaxed font-semibold">
                                        Warning: Adjusting account-level configuration modifies database tables linked across all associated circles. Make changes cautiously to avoid impacting contribution schedules.
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="h-11 inline-flex cursor-pointer items-center justify-center rounded-xl bg-purple-600 px-6 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-60 transition"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save General Options'}
                                </button>
                            </div>
                        </form>
                    )}

                </div>
            </div>
        </div>
    );
}
