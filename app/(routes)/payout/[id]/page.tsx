import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { ArrowLeft, Wallet, Landmark, Calendar, CheckCircle2, XCircle, AlertCircle, Users } from 'lucide-react';
import { db } from '@/lib/db/db';
import { payouts, circles, users } from '@/lib/db/schema';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function PayoutDetailsPage({ params }: Props) {
    const { id } = await params;
    const { userId: clerkId } = await auth();

    if (!clerkId) {
        redirect('/sign-in');
    }

    // Resolve local db user
    const dbUser = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkId))
        .limit(1)
        .then((rows) => rows[0]);

    if (!dbUser) {
        redirect('/onboarding');
    }

    // Fetch payout details
    const [payoutRecord] = await db
        .select()
        .from(payouts)
        .where(eq(payouts.id, id))
        .limit(1);

    if (!payoutRecord) {
        notFound();
    }

    // Fetch circle details
    const [circleRecord] = await db
        .select()
        .from(circles)
        .where(eq(circles.id, payoutRecord.circleId))
        .limit(1);

    // Fetch payout recipient user details
    const [recipientUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, payoutRecord.userId))
        .limit(1);

    const amountFormatted = parseFloat(payoutRecord.amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const createdDate = new Date(payoutRecord.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const createdTime = new Date(payoutRecord.createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });

    const statusUpper = payoutRecord.status.toUpperCase();

    return (
        <div className="bg-white min-h-screen p-4 md:p-8 flex items-center justify-center">
            <div className="w-full max-w-xl bg-white border border-gray-100 rounded-3xl shadow-xl p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <Link
                        href="/payouts"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition"
                    >
                        <ArrowLeft size={14} /> Back to Payouts
                    </Link>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-space-grotesk">
                        Transaction Receipt
                    </span>
                </div>

                {/* Status Illustration */}
                <div className="flex flex-col items-center justify-center text-center space-y-2 py-4">
                    {statusUpper === 'SUCCESS' && (
                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-sm">
                            <CheckCircle2 size={24} />
                        </div>
                    )}
                    {statusUpper === 'FAILED' && (
                        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-sm">
                            <XCircle size={24} />
                        </div>
                    )}
                    {(statusUpper === 'PENDING' || statusUpper === 'PROCESSING') && (
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm animate-pulse">
                            <AlertCircle size={24} />
                        </div>
                    )}

                    <h2 className="text-2xl font-bold text-gray-900 font-space-grotesk mt-2">
                        ₦{amountFormatted}
                    </h2>
                    
                    {/* Status Badge */}
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        statusUpper === 'SUCCESS'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : statusUpper === 'FAILED'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                        {statusUpper}
                    </span>
                </div>

                {/* Receipt Details */}
                <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-4 space-y-4 text-xs text-gray-700">
                    <div className="flex justify-between items-center py-0.5">
                        <span className="text-gray-500 font-medium">Circle</span>
                        <span className="text-gray-900 font-bold flex items-center gap-1">
                            <Users size={12} className="text-purple-600" />
                            {circleRecord?.name || 'Unknown Circle'}
                        </span>
                    </div>

                    <div className="flex justify-between items-center py-0.5">
                        <span className="text-gray-500 font-medium">Rotation Round</span>
                        <span className="text-gray-900 font-semibold">{payoutRecord.round || 'Round 1'}</span>
                    </div>

                    <hr className="border-gray-100" />

                    <div className="flex justify-between items-start py-0.5">
                        <span className="text-gray-500 font-medium mt-0.5">Recipient Member</span>
                        <div className="text-right">
                            <div className="text-gray-900 font-bold">
                                {[recipientUser?.firstName, recipientUser?.lastName].filter(Boolean).join(' ') || recipientUser?.username || recipientUser?.email.split('@')[0] || 'Member'}
                            </div>
                            <div className="text-[10px] text-gray-400">{recipientUser?.email || ''}</div>
                        </div>
                    </div>

                    <div className="flex justify-between items-start py-0.5">
                        <span className="text-gray-500 font-medium mt-0.5">Destination Bank</span>
                        <div className="text-right">
                            <div className="text-gray-900 font-bold flex items-center gap-1 justify-end">
                                <Landmark size={12} className="text-gray-400" />
                                {payoutRecord.destinationBank || 'Unknown Bank'}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">
                                {payoutRecord.destinationAccountNumber || ''} ({payoutRecord.destinationAccountName || ''})
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    <div className="flex justify-between items-center py-0.5">
                        <span className="text-gray-500 font-medium">Transaction Reference</span>
                        <span className="text-gray-950 font-mono text-[10px] break-all select-all font-bold">
                            {payoutRecord.reference}
                        </span>
                    </div>

                    <div className="flex justify-between items-center py-0.5">
                        <span className="text-gray-500 font-medium">Date & Time</span>
                        <span className="text-gray-900 font-semibold flex items-center gap-1">
                            <Calendar size={12} className="text-gray-400" />
                            {createdDate} at {createdTime}
                        </span>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link
                        href={`/circles/${circleRecord?.slug || ''}`}
                        className="flex-1 inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                    >
                        View Circle Details
                    </Link>
                    <Link
                        href="/payouts"
                        className="flex-1 inline-flex h-11 items-center justify-center rounded-xl bg-purple-600 text-xs font-semibold text-white hover:bg-purple-700 transition shadow-[0_4px_12px_rgba(147,51,234,0.15)] cursor-pointer"
                    >
                        Back to Payouts
                    </Link>
                </div>

            </div>
        </div>
    );
}
