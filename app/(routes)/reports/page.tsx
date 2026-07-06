import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  BarChart3, 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  CheckCircle2
} from 'lucide-react';
import { getCircleRoleAction, getMyCirclesAction } from '@/lib/actions/circle';

interface PageProps {
  searchParams: Promise<{
    circle?: string;
  }>;
}

async function ReportsContent({ searchParams }: PageProps) {
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
  const activeCircle = circleSlug ? userCircles.find(c => c.slug === circleSlug) : userCircles[0];

  const circleName = activeCircle ? activeCircle.name : 'All Circles';
  const currency = activeCircle ? activeCircle.currency : 'NGN';

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-space-grotesk flex items-center gap-2">
              <BarChart3 className="text-purple-600" />
              Reports & Insights
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Analytical charts and compliance insights for <span className="font-semibold text-purple-700">{circleName}</span>.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Analytics Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <TrendingUp size={16} className="text-purple-500" />
              <span>Projected Savings</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {currency === 'NGN' ? '₦1,250,000' : '$2,500'}
            </p>
            <p className="text-[11px] text-gray-400 mt-1 font-medium">
              Based on active contribution schedule
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <CheckCircle2 size={16} className="text-purple-500" />
              <span>Avg Compliance Rate</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">84.2%</p>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">
              Top 10% compliance across platforms
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <Users size={16} className="text-purple-500" />
              <span>Circle Health</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">Excellent</p>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">
              All slots successfully filled
            </p>
          </div>
        </div>

        {/* CSS Chart Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Savings Progress Bar Chart */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.01)] p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-space-grotesk">
                Monthly Savings Rotation Accumulation
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Projected cumulative contributions by round</p>
            </div>
            {/* Chart Area */}
            <div className="h-60 flex items-end gap-3 pt-6 border-b border-gray-100 pb-2">
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-purple-200/50 hover:bg-purple-300 rounded-t-lg transition-all h-[20%]" />
                <span className="text-[10px] font-semibold text-gray-400">R1</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-purple-200/80 hover:bg-purple-300 rounded-t-lg transition-all h-[40%]" />
                <span className="text-[10px] font-semibold text-gray-400">R2</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-purple-400 hover:bg-purple-500 rounded-t-lg transition-all h-[60%]" />
                <span className="text-[10px] font-semibold text-gray-400">R3</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-purple-500 hover:bg-purple-600 rounded-t-lg transition-all h-[80%]" />
                <span className="text-[10px] font-semibold text-gray-400">R4</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-purple-600 hover:bg-purple-700 rounded-t-lg transition-all h-[100%]" />
                <span className="text-[10px] font-semibold text-gray-400">R5</span>
              </div>
            </div>
          </div>

          {/* Compliance Breakdown */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.01)] p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-space-grotesk">
                Compliance & Participation Breakdown
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Track individual member metrics</p>
            </div>
            
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                  <span>Ada Lovelace</span>
                  <span>100% (Paid 1/1)</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                  <span>Alan Turing</span>
                  <span>100% (Paid 1/1)</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                  <span>Grace Hopper</span>
                  <span>100% (Paid 1/1)</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                  <span>Margaret Hamilton</span>
                  <span>0% (Pending Round 1)</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-300 rounded-full" style={{ width: '0%' }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                  <span>Charles Babbage</span>
                  <span>0% (Overdue Round 1)</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-400 rounded-full" style={{ width: '0%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    }>
      <ReportsContent searchParams={searchParams} />
    </Suspense>
  );
}
