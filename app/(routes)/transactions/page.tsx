'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Filter 
} from 'lucide-react';
import { getMyCirclesAction } from '@/lib/actions/circle';
import { getCircleTransactionsAction, type TransactionRecord } from '@/lib/actions/contributions';



interface CircleInfo {
  name: string;
  currency: string;
  slug: string;
}

function TransactionsContent() {
  const searchParams = useSearchParams();
  const circleSlug = searchParams?.get('circle') ?? null;

  const [activeCircle, setActiveCircle] = useState<CircleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'contribution' | 'payout'>('all');
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  useEffect(() => {
    const fetchCircleInfo = async () => {
      const res = await getMyCirclesAction();
      if (res.success && res.data) {
        const match = circleSlug && circleSlug !== 'all'
          ? res.data.find(c => c.slug === circleSlug)
          : res.data[0];
        if (match) setActiveCircle(match);
      }
      setLoading(false);
    };
    fetchCircleInfo();
  }, [circleSlug]);

  useEffect(() => {
    if (activeCircle) {
      const fetchTransactions = async () => {
        const res = await getCircleTransactionsAction(activeCircle.slug);
        if (res.success && res.data) {
          setTransactions(res.data);
        }
      };
      fetchTransactions();
    }
  }, [activeCircle]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  const circleName = activeCircle ? activeCircle.name : 'All Circles';
  const currency = activeCircle ? activeCircle.currency : 'NGN';

  // Filter and Search logic
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = 
      (tx.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (tx.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (tx.reference || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || tx.type === filterType;

    return matchesSearch && matchesType;
  });

  const formatCurrency = (val: number) => {
    return currency === 'NGN' ? `₦${val.toLocaleString()}` : `$${val.toLocaleString()}`;
  };

  const formatDate = (isoString: string | Date) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-space-grotesk flex items-center gap-2">
              <ArrowUpRight className="text-purple-600" />
              Transactions
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Audit trails and transaction logs for <span className="font-semibold text-purple-700">{circleName}</span>.
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

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member or reference ID..."
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-xs outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
            />
          </div>

          {/* Type filters */}
          <div className="flex items-center gap-2.5">
            <Filter size={15} className="text-gray-400 shrink-0" />
            <div className="flex rounded-xl bg-gray-100 p-1">
              <button
                onClick={() => setFilterType('all')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  filterType === 'all'
                    ? 'bg-white text-purple-700 shadow-sm font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('contribution')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  filterType === 'contribution'
                    ? 'bg-white text-purple-700 shadow-sm font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Contributions
              </button>
              <button
                onClick={() => setFilterType('payout')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  filterType === 'payout'
                    ? 'bg-white text-purple-700 shadow-sm font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Payouts
              </button>
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.01)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-xs">
                      No transactions found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50/40 transition">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-purple-600">{tx.reference}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{tx.userName || tx.userEmail}</td>
                      <td className="px-6 py-4">
                        {tx.type === 'contribution' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-xs">
                            <ArrowDownLeft size={14} /> Contribution
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-purple-600 font-medium text-xs">
                            <ArrowUpRight size={14} /> Payout
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-gray-800">
                        {tx.type === 'payout' ? '-' : '+'}{formatCurrency(parseFloat(tx.amount))}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">{formatDate(tx.createdAt)}</td>
                      <td className="px-6 py-4">
                        {tx.status === 'success' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/10">
                            <CheckCircle2 size={12} /> Success
                          </span>
                        )}
                        {tx.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-gray-600/10">
                            <Clock size={12} /> Pending
                          </span>
                        )}
                        {tx.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-rose-600/10">
                            <AlertCircle size={12} /> Failed
                          </span>
                        )}
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

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    }>
      <TransactionsContent />
    </Suspense>
  );
}
