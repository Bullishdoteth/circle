import React, { Suspense } from 'react';
import Link from 'next/link';
import { 
  Wallet, 
  ArrowLeft, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { getMyCirclesAction, getCircleDetailsAction } from '@/lib/actions/circle';
import { getPayoutsAction, fetchNombaBanksAction } from '@/lib/actions/payouts';
import { CreatePayoutDialog } from '@/components/circles/createPayoutDialog';
import { AlertCircle } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{
    circle?: string;
  }>;
}

async function PayoutsContent({ searchParams }: PageProps) {
  const { circle: circleSlug } = await searchParams;

  // Get active circle info
  const circlesRes = await getMyCirclesAction();
  const userCircles = circlesRes.success ? circlesRes.data || [] : [];
  const activeCircle = circleSlug && circleSlug !== 'all' 
    ? userCircles.find(c => c.slug === circleSlug) 
    : userCircles[0];

  const circleName = activeCircle ? activeCircle.name : 'No Circles';
  const currency = activeCircle ? activeCircle.currency : 'NGN';

  const targetSlug = activeCircle?.slug || '';

  // Fetch real database payouts
  const payoutsRes = await getPayoutsAction(targetSlug);
  const payoutsList = payoutsRes.success ? payoutsRes.data || [] : [];

  // Fetch circle details for role/members check
  const detailsRes = await getCircleDetailsAction(targetSlug);
  const circleDetails = detailsRes.success ? detailsRes.data : null;
  const members = circleDetails ? circleDetails.members : [];
  const userRole = circleDetails ? circleDetails.currentUserRole : null;
  const isManager = userRole === 'owner' || userRole === 'admin' || userRole === 'treasurer';

  // Fetch Nomba banks list for the dropdown
  const banksRes = await fetchNombaBanksAction();
  const banks = banksRes.success ? banksRes.data || [] : [];

  // Compute payouts stats
  const totalPayoutsCompleted = payoutsList
    .filter(p => p.status === 'success')
    .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

  const totalPayoutPool = members.length * 250000; // Expected total pool value

  // Compute next recipient (members who haven't received payout yet)
  const receivedUserIds = new Set(payoutsList.filter(p => p.status === 'success').map(p => p.userId));
  const nextRecipient = members.find(m => !receivedUserIds.has(m.userId)) || members[0];

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-space-grotesk flex items-center gap-2">
              <Wallet className="text-purple-600" />
              Payouts
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              View payout rotation and distribution history for <span className="font-semibold text-purple-700">{circleName}</span>.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
            {isManager && circleDetails && (
              <CreatePayoutDialog
                circleId={circleDetails.circle.id}
                members={members.map((m) => ({
                  userId: m.userId,
                  name: m.name,
                  email: m.email,
                  payoutBankCode: m.payoutBankCode,
                  payoutBankName: m.payoutBankName,
                  payoutAccountNumber: m.payoutAccountNumber,
                  payoutAccountName: m.payoutAccountName,
                }))}
                banks={banks}
                circleContributionAmount={parseFloat(circleDetails.circle.contributionAmount || '50000')}
              />
            )}
          </div>
        </div>

        {/* Top Split: Next Payout Recipient Card & Payout Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Next Recipient Card */}
          <div className="lg:col-span-2 rounded-3xl border border-purple-100 bg-gradient-to-tr from-purple-500 to-indigo-600 p-6 md:p-8 text-white shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            {/* Visual background globes */}
            <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="absolute -right-2 -top-12 w-32 h-32 rounded-full bg-purple-400/25 blur-lg pointer-events-none" />
            
            <div className="flex justify-between items-start">
              <div>
                <span className="bg-white/20 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Next Payout Recipient
                </span>
                <h3 className="text-2xl font-bold font-space-grotesk mt-3">
                  {nextRecipient ? nextRecipient.name : 'No Members'}
                </h3>
              </div>
              <Wallet className="text-purple-200 shrink-0" size={32} />
            </div>

            <div className="flex items-end justify-between mt-6">
              <div>
                <span className="text-xs text-purple-100 font-medium block">Expected Amount</span>
                <span className="text-3xl font-extrabold font-mono tracking-tight animate-pulse">
                  ₦{(members.length * 50000).toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-purple-100 font-medium block">Rotation status</span>
                <span className="text-sm font-semibold flex items-center gap-1 mt-0.5 justify-end">
                  <Clock size={14} /> Rotating Active
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total Payout Pool
                </span>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {currency === 'NGN' ? `₦${totalPayoutPool.toLocaleString()}` : `$${totalPayoutPool.toLocaleString()}`}
                </p>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 font-medium leading-none">
                Across {members.length} member rotations
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Payouts Disbursed
                </span>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {currency === 'NGN' ? `₦${totalPayoutsCompleted.toLocaleString()}` : `$${totalPayoutsCompleted.toLocaleString()}`}
                </p>
              </div>
              <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                {payoutsList.filter(p => p.status === 'success').length} of {members.length} rounds completed ({members.length > 0 ? Math.round((payoutsList.filter(p => p.status === 'success').length / members.length) * 100) : 0}%)
              </p>
            </div>
          </div>
        </div>

        {/* Rotation Table */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.01)] overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 font-space-grotesk">
              Payout Schedule & Rotation Order Ledger
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Round</th>
                  <th className="px-6 py-3.5">Recipient</th>
                  <th className="px-6 py-3.5">Payout Amount</th>
                  <th className="px-6 py-3.5">Destination Account</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {payoutsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-xs">
                      No payouts processed yet for this circle.
                    </td>
                  </tr>
                ) : (
                  payoutsList.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/40 transition">
                      <td className="px-6 py-4 font-bold text-gray-900">{row.round || 'N/A'}</td>
                      <td className="px-6 py-4 font-semibold text-gray-800">{row.userName || row.userEmail || '—'}</td>
                      <td className="px-6 py-4 font-mono font-medium text-gray-800">
                        ₦{parseFloat(row.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        <div>{row.destinationAccountName}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{row.destinationBank} ({row.destinationAccountNumber})</div>
                      </td>
                      <td className="px-6 py-4">
                        {row.status === 'success' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/10">
                            <CheckCircle2 size={12} /> Disbursed
                          </span>
                        )}
                        {row.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-600/10 animate-pulse">
                            <Clock size={12} /> Processing
                          </span>
                        )}
                        {row.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-rose-600/10">
                            <AlertCircle size={12} /> Failed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/payout/${row.id}`}
                          className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 transition"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PayoutsPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    }>
      <PayoutsContent searchParams={searchParams} />
    </Suspense>
  );
}
