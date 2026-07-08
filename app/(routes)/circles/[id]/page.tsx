'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Users,
    Settings as SettingsIcon,
    LayoutDashboard,
    Mail,
    Lock,
    Calendar,
    Wallet,
    UserPlus,
    Loader2,
    Crown,
    Shield,
    Clock,
} from 'lucide-react';
import {
    getCircleDetailsAction,
    inviteCircleMemberAction,
    updateCircleSettingsAction,
    updateCircleMemberPayoutAction,
    type CircleDetails,
} from '@/lib/actions/circle';

type Tab = 'overview' | 'members' | 'settings';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'members', label: 'Members', icon: Users },
    { key: 'settings', label: 'Settings', icon: SettingsIcon },
];

function formatDate(value: string | Date | null | undefined) {
    if (!value) return '—';
    const d = new Date(value);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function RoleBadge({ role }: { role: string }) {
    const styles: Record<string, string> = {
        owner: 'bg-purple-50 text-purple-700 ring-purple-600/20',
        admin: 'bg-blue-50 text-blue-700 ring-blue-600/20',
        treasurer: 'bg-amber-50 text-amber-700 ring-amber-600/20',
        member: 'bg-gray-100 text-gray-600 ring-gray-500/20',
    };
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ring-1 ring-inset ${
                styles[role] ?? styles.member
            }`}
        >
            {role === 'owner' && <Crown size={11} />}
            {role === 'admin' && <Shield size={11} />}
            {role}
        </span>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <Icon size={15} className="text-purple-500" />
                {label}
            </div>
            <div className="mt-2 text-lg font-bold text-gray-900">{value}</div>
        </div>
    );
}

/* ---------------- Overview ---------------- */

function OverviewTab({ details }: { details: CircleDetails }) {
    const { circle } = details;
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    icon={Users}
                    label="Members"
                    value={circle.memberCount}
                />
                <StatCard icon={Wallet} label="Currency" value={circle.currency} />
                <StatCard
                    icon={Clock}
                    label="Payout Method"
                    value={
                        <span className="text-sm capitalize font-semibold text-gray-700">
                            {circle.payoutMethod === 'draw' ? 'Random Draw' : circle.payoutMethod.replace('_', ' ')}
                        </span>
                    }
                />
                <StatCard
                    icon={Calendar}
                    label="Contribution Target"
                    value={
                        <span className="text-sm font-bold text-purple-700">
                            {circle.currency === 'USD' ? '$' : '₦'}{parseFloat(circle.contributionAmount || '50000').toLocaleString()}
                        </span>
                    }
                />
            </div>

            {details.virtualAccount ? (
                <div className="rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50 p-6">
                    <h3 className="text-sm font-bold text-gray-900 font-space-grotesk flex items-center gap-2">
                        <Wallet size={16} className="text-purple-600" />
                        Circle Bank Deposit Account
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Send bank transfers directly to this account to contribute to this circle. Reconciliations are processed automatically.
                    </p>
                    
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="bg-white p-3 rounded-xl border border-gray-100">
                            <span className="text-[10px] text-gray-400 font-semibold block uppercase">Bank Name</span>
                            <span className="text-xs font-bold text-gray-800 mt-1 block">{details.virtualAccount?.bankName || 'Nomba MFB'}</span>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-gray-100">
                            <span className="text-[10px] text-gray-400 font-semibold block uppercase">Account Number</span>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-xs font-mono font-bold text-purple-700">{details.virtualAccount?.bankAccountNumber || '—'}</span>
                                <button 
                                    onClick={() => {
                                        if (details.virtualAccount?.bankAccountNumber) {
                                            navigator.clipboard.writeText(details.virtualAccount.bankAccountNumber);
                                            toast.success('Account number copied to clipboard!');
                                        }
                                    }}
                                    className="text-[10px] text-purple-600 hover:text-purple-800 font-semibold cursor-pointer"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-gray-100">
                            <span className="text-[10px] text-gray-400 font-semibold block uppercase">Account Name</span>
                            <span className="text-xs font-bold text-gray-800 mt-1 block">{details.virtualAccount?.bankAccountName || 'Circle Account'}</span>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-gray-100">
                            <span className="text-[10px] text-gray-400 font-semibold block uppercase">Actual Balance</span>
                            <span className="text-xs font-bold text-green-700 mt-1 block">
                                {circle.currency === 'USD' ? '$' : '₦'}{(details.virtualAccount?.actualBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-xs text-gray-400">
                    No virtual deposit account has been provisioned for this circle.
                </div>
            )}

            <div className="rounded-2xl border border-gray-100 bg-white p-6">
                <h3 className="text-sm font-bold text-gray-900">About</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {circle.description ||
                        'No description has been provided for this circle yet.'}
                </p>

                <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-50 pt-6 sm:grid-cols-2">
                    <div>
                        <dt className="text-xs font-medium text-gray-400">Slug</dt>
                        <dd className="mt-0.5 text-sm text-gray-900">
                            /{circle.slug}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium text-gray-400">Status</dt>
                        <dd className="mt-0.5 text-sm capitalize text-gray-900">
                            {circle.status}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium text-gray-400">
                            Last activity
                        </dt>
                        <dd className="mt-0.5 text-sm text-gray-900">
                            {formatDate(circle.lastActivityAt)}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium text-gray-400">
                            Your role
                        </dt>
                        <dd className="mt-0.5">
                            {details.currentUserRole ? (
                                <RoleBadge role={details.currentUserRole} />
                            ) : (
                                <span className="text-sm text-gray-500">—</span>
                            )}
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}

/* ---------------- Members ---------------- */

function MembersTab({
    details,
    canManage,
    onRefresh,
}: {
    details: CircleDetails;
    canManage: boolean;
    onRefresh: () => void;
}) {
    const { circle, members, invitations } = details;
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'admin' | 'member'>('member');
    const [inviting, setInviting] = useState(false);

    const handleDrawLots = async () => {
        setInviting(true);
        try {
            const shufflable = [...members];
            for (let i = shufflable.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shufflable[i], shufflable[j]] = [shufflable[j], shufflable[i]];
            }
            for (let idx = 0; idx < shufflable.length; idx++) {
                await updateCircleMemberPayoutAction(circle.id, shufflable[idx].userId, {
                    rotationPosition: idx + 1
                });
            }
            toast.success('Random draw completed successfully!');
            onRefresh();
        } catch (err) {
            toast.error('Failed to perform draw.');
        } finally {
            setInviting(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setInviting(true);
        const res = await inviteCircleMemberAction(circle.id, email.trim(), role);
        setInviting(false);
        if (res.success) {
            toast.success(`Invitation sent to ${email.trim()}`);
            setEmail('');
            setRole('member');
            onRefresh();
        } else {
            toast.error(res.error || 'Failed to send invitation.');
        }
    };

    return (
        <div className="space-y-6">
            {canManage && (
                <form
                    onSubmit={handleInvite}
                    className="rounded-2xl border border-gray-100 bg-white p-5"
                >
                    <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                        <UserPlus size={16} className="text-purple-500" />
                        Invite a member
                    </h3>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                        />
                        <select
                            value={role}
                            onChange={(e) =>
                                setRole(e.target.value as 'admin' | 'member')
                            }
                            className="rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                        >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                        </select>
                        <button
                            type="submit"
                            disabled={inviting}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-60"
                        >
                            {inviting && <Loader2 size={16} className="animate-spin" />}
                            Send Invite
                        </button>
                    </div>
                </form>
            )}

            {/* Members list */}
            <div className="rounded-2xl border border-gray-100 bg-white">
                <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
                    <h3 className="text-sm font-bold text-gray-900">
                        Members ({members.length})
                    </h3>
                    {circle.payoutMethod === 'draw' && canManage && (
                        <button
                            onClick={handleDrawLots}
                            disabled={inviting}
                            className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-purple-50 hover:bg-purple-100 px-3 py-1.5 text-xs font-bold text-purple-700 transition"
                        >
                            Shuffle & Draw Lots
                        </button>
                    )}
                </div>
                <ul className="divide-y divide-gray-50">
                    {members.map((m) => (
                        <li
                            key={m.id}
                            className="flex items-center gap-3 px-5 py-3.5"
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">
                                {m.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={m.imageUrl}
                                        alt={m.name}
                                        className="h-full w-full rounded-full object-cover"
                                    />
                                ) : (
                                    m.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                    {m.name}
                                </p>
                                <p className="truncate text-xs text-gray-500">
                                    {m.email}
                                </p>
                            </div>

                            {/* Render rotation schedule input / label */}
                            {circle.payoutMethod === 'sequential' && (
                                <div className="shrink-0 flex items-center gap-1.5">
                                    {canManage ? (
                                        <>
                                            <span className="text-[10px] text-gray-400 font-semibold uppercase">Pos:</span>
                                            <input
                                                type="number"
                                                min="1"
                                                value={m.rotationPosition || ''}
                                                onChange={async (e) => {
                                                    const val = e.target.value ? parseInt(e.target.value) : null;
                                                    const res = await updateCircleMemberPayoutAction(circle.id, m.userId, { rotationPosition: val });
                                                    if (res.success) {
                                                        toast.success('Sequence position updated.');
                                                        onRefresh();
                                                    } else {
                                                        toast.error(res.error || 'Failed to update position.');
                                                    }
                                                }}
                                                className="w-12 text-center text-xs font-bold rounded-lg border border-gray-200 py-1 px-0.5 outline-none focus:border-purple-400 text-gray-700"
                                            />
                                        </>
                                    ) : (
                                        m.rotationPosition && (
                                            <span className="text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 font-semibold">
                                                Round {m.rotationPosition}
                                            </span>
                                        )
                                    )}
                                </div>
                            )}

                            {circle.payoutMethod === 'scheduled' && (
                                <div className="shrink-0 flex items-center gap-1.5">
                                    {canManage ? (
                                        <>
                                            <span className="text-[10px] text-gray-400 font-semibold uppercase">Date:</span>
                                            <input
                                                type="date"
                                                value={m.payoutDate ? new Date(m.payoutDate).toISOString().substring(0, 10) : ''}
                                                onChange={async (e) => {
                                                    const val = e.target.value ? new Date(e.target.value) : null;
                                                    const res = await updateCircleMemberPayoutAction(circle.id, m.userId, { payoutDate: val });
                                                    if (res.success) {
                                                        toast.success('Payout date updated.');
                                                        onRefresh();
                                                    } else {
                                                        toast.error(res.error || 'Failed to update payout date.');
                                                    }
                                                }}
                                                className="text-xs font-semibold rounded-lg border border-gray-200 py-1 px-1.5 outline-none focus:border-purple-400 text-gray-700"
                                            />
                                        </>
                                    ) : (
                                        m.payoutDate && (
                                            <span className="text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                                                Payout: {formatDate(m.payoutDate)}
                                            </span>
                                        )
                                    )}
                                </div>
                            )}

                            {circle.payoutMethod === 'draw' && m.rotationPosition && (
                                <span className="text-xs text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100 font-bold shrink-0">
                                    Draw Pos: {m.rotationPosition}
                                </span>
                            )}

                            <RoleBadge role={m.role} />
                        </li>
                    ))}
                </ul>
            </div>

            {/* Pending invitations */}
            {invitations.length > 0 && (
                <div className="rounded-2xl border border-gray-100 bg-white">
                    <div className="border-b border-gray-50 px-5 py-4">
                        <h3 className="text-sm font-bold text-gray-900">
                            Pending Invitations ({invitations.length})
                        </h3>
                    </div>
                    <ul className="divide-y divide-gray-50">
                        {invitations.map((inv) => (
                            <li
                                key={inv.id}
                                className="flex items-center gap-3 px-5 py-3.5"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                                    <Clock size={16} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-gray-900">
                                        {inv.email}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Invited {formatDate(inv.invitedAt)}
                                    </p>
                                </div>
                                <RoleBadge role={inv.role} />
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

/* ---------------- Settings ---------------- */

function SettingsTab({
    details,
    canManage,
    onRefresh,
}: {
    details: CircleDetails;
    canManage: boolean;
    onRefresh: () => void;
}) {
    const router = useRouter();
    const { circle } = details;
    const [name, setName] = useState(circle.name);
    const [slug, setSlug] = useState(circle.slug);
    const [description, setDescription] = useState(circle.description ?? '');
    const [privacy, setPrivacy] = useState<'invite_only' | 'private'>(
        circle.visibility
    );
    const [contributionAmount, setContributionAmount] = useState(Number(circle.contributionAmount || 50000));
    const [payoutMethod, setPayoutMethod] = useState(circle.payoutMethod || 'manual');
    const [frequency, setFrequency] = useState(circle.frequency || 'monthly');
    const [currentRound, setCurrentRound] = useState(circle.currentRound || 1);
    const [saving, setSaving] = useState(false);

    if (!canManage) {
        return (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
                    <Lock size={22} />
                </div>
                <h3 className="text-sm font-bold text-gray-900">
                    Restricted
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    Only owners and admins can manage circle settings.
                </p>
            </div>
        );
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
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
        setSaving(false);
        if (res.success && res.data) {
            toast.success('Circle settings updated.');
            if (res.data.slug !== circle.slug) {
                router.replace(`/circles/${res.data.slug}?tab=settings`);
            } else {
                onRefresh();
            }
        } else {
            toast.error(res.error || 'Failed to update settings.');
        }
    };

    return (
        <form
            onSubmit={handleSave}
            className="max-w-2xl space-y-5 rounded-2xl border border-gray-100 bg-white p-6"
        >
            <div>
                <label className="text-xs font-semibold text-gray-700">
                    Circle name
                </label>
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                />
            </div>

            <div>
                <label className="text-xs font-semibold text-gray-700">Slug</label>
                <div className="mt-1.5 flex items-center rounded-xl border border-gray-200 px-3.5 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100">
                    <span className="text-sm text-gray-400">/circles/</span>
                    <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="flex-1 bg-transparent py-2.5 text-sm text-gray-900 outline-none"
                    />
                </div>
            </div>

            <div>
                <label className="text-xs font-semibold text-gray-700">
                    Description
                </label>
                <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this circle about?"
                    className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                />
            </div>

            <div>
                <label className="text-xs font-semibold text-gray-700">
                    Privacy
                </label>
                <select
                    value={privacy}
                    onChange={(e) =>
                        setPrivacy(e.target.value as 'invite_only' | 'private')
                    }
                    className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                >
                    <option value="invite_only">Invite only</option>
                    <option value="private">Private</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-semibold text-gray-700">
                        Contribution Amount ({circle.currency})
                    </label>
                    <input
                        type="number"
                        min="1"
                        required
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(Number(e.target.value))}
                        className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                    />
                </div>

                <div>
                    <label className="text-xs font-semibold text-gray-700">
                        Current Round
                    </label>
                    <input
                        type="number"
                        min="1"
                        required
                        value={currentRound}
                        onChange={(e) => setCurrentRound(Number(e.target.value))}
                        className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-semibold text-gray-700">
                        Payout Method
                    </label>
                    <select
                        value={payoutMethod}
                        onChange={(e) => setPayoutMethod(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                    >
                        <option value="manual">Manual Select</option>
                        <option value="sequential">Sequential Rotation</option>
                        <option value="draw">Random Draw (Shuffled)</option>
                        <option value="scheduled">Scheduled Dates</option>
                    </select>
                </div>

                <div>
                    <label className="text-xs font-semibold text-gray-700">
                        Frequency
                    </label>
                    <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                    >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-end border-t border-gray-50 pt-5">
                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-60"
                >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    Save changes
                </button>
            </div>
        </form>
    );
}

/* ---------------- Page ---------------- */

function CircleDetailsContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const slug = (params?.id as string) ?? '';
    const tabParam = (searchParams?.get('tab') as Tab) ?? 'overview';
    const activeTab: Tab = TABS.some((t) => t.key === tabParam)
        ? tabParam
        : 'overview';

    const [details, setDetails] = useState<CircleDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDetails = useCallback(async () => {
        const res = await getCircleDetailsAction(slug);
        if (res.success && res.data) {
            setDetails(res.data);
            setError(null);
        } else {
            setError(res.error || 'Circle not found.');
        }
        setLoading(false);
    }, [slug]);

    useEffect(() => {
        setLoading(true);
        fetchDetails();
    }, [fetchDetails]);

    const setTab = (tab: Tab) => {
        router.push(`/circles/${slug}?tab=${tab}`);
    };

    if (loading) {
        return (
            <div className="flex h-full min-h-[60vh] w-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
            </div>
        );
    }

    if (error || !details) {
        return (
            <div className="p-4 md:p-8">
                <div className="rounded-2xl border border-red-100 bg-red-50/50 p-8 text-center">
                    <h2 className="text-base font-bold text-gray-900">
                        {error || 'Circle not found'}
                    </h2>
                    <Link
                        href="/circles"
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:underline"
                    >
                        <ArrowLeft size={16} />
                        Back to circles
                    </Link>
                </div>
            </div>
        );
    }

    const { circle } = details;
    const canManage =
        details.currentUserRole === 'owner' ||
        details.currentUserRole === 'admin';

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-4 md:p-8">
                {/* Back link */}
                <Link
                    href="/circles"
                    className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-purple-600"
                >
                    <ArrowLeft size={15} />
                    All circles
                </Link>

                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-purple-100 bg-purple-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-purple-200 to-purple-100 text-xl font-bold text-purple-800">
                            {circle.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={circle.imageUrl}
                                    alt={circle.name}
                                    className="h-full w-full rounded-2xl object-cover"
                                />
                            ) : (
                                circle.name.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="min-w-0">
                            <h1 className="truncate text-xl font-bold text-gray-900">
                                {circle.name}
                            </h1>
                            <p className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                                <Users size={13} />
                                {circle.memberCount}{' '}
                                {circle.memberCount === 1 ? 'member' : 'members'}
                                <span className="text-gray-300">·</span>
                                {circle.currency}
                            </p>
                        </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium capitalize text-green-700 ring-1 ring-inset ring-green-600/20">
                            {circle.status}
                        </span>
                        {details.currentUserRole && (
                            <RoleBadge role={details.currentUserRole} />
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex gap-1 border-b border-gray-200">
                    {TABS.map((tab) => {
                        const isActive = tab.key === activeTab;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setTab(tab.key)}
                                className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'border-purple-600 text-purple-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab content */}
                {activeTab === 'overview' && <OverviewTab details={details} />}
                {activeTab === 'members' && (
                    <MembersTab
                        details={details}
                        canManage={canManage}
                        onRefresh={fetchDetails}
                    />
                )}
                {activeTab === 'settings' && (
                    <SettingsTab
                        details={details}
                        canManage={canManage}
                        onRefresh={fetchDetails}
                    />
                )}
            </div>
        </div>
    );
}

export default function CircleDetailsPage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-screen items-center justify-center bg-gray-50">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
                </div>
            }
        >
            <CircleDetailsContent />
        </Suspense>
    );
}
