import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Gift, 
  Calendar, 
  ArrowLeft, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Clock 
} from 'lucide-react';
import { getCircleRoleAction, getMyCirclesAction, getCircleDetailsAction } from '@/lib/actions/circle';
import { getCircleContributionsAction, getUnreconciledContributionsAction, syncCircleInflowsAction } from '@/lib/actions/contributions';
import { ReconcileContributionButton } from '@/components/circles/reconcileContributionButton';
import { SyncInflowsButton } from '@/components/circles/syncInflowsButton';
import { ContributionSettingsButton } from '@/components/circles/contributionSettingsButton';

interface PageProps {
  searchParams: Promise<{
    circle?: string;
  }>;
}

async function ContributionsContent({ searchParams }: PageProps) {
  const { circle: circleSlug } = await searchParams;

  // Enforce role-based access control
  if (circleSlug && circleSlug !== 'all') {
    const roleRes = await getCircleRoleAction(circleSlug);
    if (roleRes.success && roleRes.data === 'member') {
      redirect(`/dashboard?circle=${circleSlug}&error=unauthorized`);
    }
  } else {
    // If no circle param or 'all', check if the user is only a member in all their circles
    const circlesRes = await getMyCirclesAction();
    const userCircles = circlesRes.success ? circlesRes.data || [] : [];
    if (userCircles.length > 0 && userCircles.every(c => c.userRole === 'member')) {
      redirect('/dashboard?error=unauthorized');
    }
  }

  // Get active circle name
  const circlesRes = await getMyCirclesAction();
  const userCircles = circlesRes.success ? circlesRes.data || [] : [];
  const activeCircle = circleSlug && circleSlug !== 'all' 
    ? userCircles.find(c => c.slug === circleSlug) 
    : userCircles[0];

  const circleName = activeCircle ? activeCircle.name : 'No Circles';
  const currency = activeCircle ? activeCircle.currency : 'NGN';

  // Fetch real data
  const targetSlug = activeCircle?.slug || '';

  const detailsRes = await getCircleDetailsAction(targetSlug);
  const circleDetails = detailsRes.success ? detailsRes.data : null;
  const members = circleDetails ? circleDetails.members : [];
  const userRole = circleDetails ? circleDetails.currentUserRole : null;
  const isManager = userRole === 'owner' || userRole === 'admin' || userRole === 'treasurer';

  // Automatically trigger sync if manager loads the page
  if (isManager && targetSlug) {
    try {
      console.log(`[Contributions Page] Auto-syncing inflows for circle: ${targetSlug}`);
      await syncCircleInflowsAction(targetSlug);
    } catch (autoSyncErr) {
      console.error('[Contributions Page] Auto-sync failed:', autoSyncErr);
    }
  }

  const reconciledRes = await getCircleContributionsAction(targetSlug);
  const reconciledList = reconciledRes.success ? reconciledRes.data || [] : [];

  const unreconciledRes = await getUnreconciledContributionsAction(targetSlug);
  const unreconciledList = unreconciledRes.success ? unreconciledRes.data || [] : [];

  // Stats calculation
  const totalContributed = reconciledList.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
  const expectedPerMember = parseFloat(circleDetails?.circle.contributionAmount || '50000');
  const totalExpected = members.length * expectedPerMember;
  const complianceRate = members.length > 0 
    ? Math.round((reconciledList.length / members.length) * 100) 
    : 0;

  return (
    <div className="bg-white min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-space-grotesk flex items-center gap-2">
              <Gift className="text-purple-600" />
              Contributions
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage and track monthly member contributions for <span className="font-semibold text-purple-700">{circleName}</span>.
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
              <ContributionSettingsButton circle={circleDetails.circle} />
            )}
            <button className="inline-flex h-10 items-center justify-center rounded-xl bg-purple-600 px-4 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(147,51,234,0.15)] transition hover:bg-purple-700">
              Record Contribution
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>Total Contributed</span>
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {currency === 'NGN' ? `₦${totalContributed.toLocaleString()}` : `$${totalContributed.toLocaleString()}`}
            </p>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium font-space-grotesk">
              Reconciled funds
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>Expected Contribution</span>
              <Calendar size={16} className="text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {currency === 'NGN' ? `₦${totalExpected.toLocaleString()}` : `$${totalExpected.toLocaleString()}`}
            </p>
            <p className="text-[11px] text-gray-500 mt-1 font-medium">
              {members.length} members ({currency === 'NGN' ? '₦' : '$'}{expectedPerMember.toLocaleString()} each)
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>Compliance Rate</span>
              <CheckCircle2 size={16} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{complianceRate}%</p>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">
              {reconciledList.length} of {members.length} members paid
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>Next Deadline</span>
              <Clock size={16} className="text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">15th of Month</p>
            <p className="text-[11px] text-amber-600 mt-1 font-medium font-space-grotesk">
              {circleDetails?.circle.frequency ? circleDetails.circle.frequency.charAt(0).toUpperCase() + circleDetails.circle.frequency.slice(1) : 'Monthly'} rotation cycle
            </p>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.01)] overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 font-space-grotesk">
              Contribution Compliance Ledger
            </h3>
            <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-purple-600/10">
              Active Round
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Member</th>
                  <th className="px-6 py-3.5">Cycle Round</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Reconciliation Date</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {reconciledList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-xs">
                      No reconciled contributions recorded yet for this circle.
                    </td>
                  </tr>
                ) : (
                  reconciledList.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/40 transition">
                      <td className="px-6 py-4 font-semibold text-gray-900">{row.userName || row.userEmail || '—'}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">{row.round || 'N/A'}</td>
                      <td className="px-6 py-4 font-mono font-medium text-gray-800">
                        ₦{parseFloat(row.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(row.reconciledAt || row.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/10">
                          <CheckCircle2 size={12} /> Reconciled
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Unreconciled Deposits (Only for managers) */}
        {isManager && (
          <div className="rounded-2xl border border-purple-100 bg-white shadow-[0_4px_20px_rgba(124,58,237,0.04)] overflow-hidden">
            <div className="border-b border-purple-50 px-6 py-4 flex items-center justify-between bg-purple-50/20">
              <h3 className="text-sm font-bold text-purple-900 font-space-grotesk flex items-center gap-2">
                <AlertCircle className="text-purple-600 animate-pulse" size={16} />
                Unreconciled Bank Deposits ({unreconciledList.length})
              </h3>
              <div className="flex items-center gap-2">
                <SyncInflowsButton circleSlug={targetSlug} />
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/10">
                  Action Required
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Reference / Sender</th>
                    <th className="px-6 py-3.5">Source Account</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Received Date</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {unreconciledList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-xs">
                        All bank deposits are fully reconciled. No pending items!
                      </td>
                    </tr>
                  ) : (
                    unreconciledList.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/40 transition">
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs font-semibold text-purple-600">{row.reference}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{row.senderName || 'Unknown Sender'}</div>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {row.senderBank ? `${row.senderBank} (${row.senderAccountNumber || '—'})` : 'Direct Bank Transfer'}
                        </td>
                        <td className="px-6 py-4 font-mono font-semibold text-purple-900">
                          ₦{parseFloat(row.amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {new Date(row.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ReconcileContributionButton
                            contributionId={row.id}
                            members={members.map((m) => ({
                              userId: m.userId,
                              name: m.name,
                              email: m.email,
                            }))}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContributionsPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    }>
      <ContributionsContent searchParams={searchParams} />
    </Suspense>
  );
}
