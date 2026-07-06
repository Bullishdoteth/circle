import React from 'react';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { getInvitationDetailsAction } from '@/lib/actions/circle';
import { InvitationAcceptCard } from '@/components/shared/invitationAcceptCard';

interface InvitationPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { token } = await params;
  const { userId } = await auth();
  const isAuthenticated = !!userId;

  const res = await getInvitationDetailsAction(token);

  if (!res.success || !res.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-tr from-emerald-50/50 via-slate-50 to-purple-50/50 p-6">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-4">
            <AlertCircle size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">
            Invalid or Expired Invitation
          </h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            {res.error || 'This invitation link is invalid, has already been used, or has expired. Please request a new invitation from the Circle owner.'}
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition"
            >
              <ArrowLeft size={16} />
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const invitation = res.data;

  // If the invitation is not pending anymore, show a status page
  if (invitation.status !== 'pending') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-tr from-emerald-50/50 via-slate-50 to-purple-50/50 p-6">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
            <AlertCircle size={24} className="text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">
            Invitation Already {invitation.status === 'accepted' ? 'Accepted' : 'Declined'}
          </h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            This invitation to join the circle <span className="font-semibold text-slate-800">{invitation.circleName}</span> has already been {invitation.status}.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-tr from-emerald-50/40 via-slate-50 to-purple-50/40 p-6">
      <InvitationAcceptCard invitation={invitation} isAuthenticated={isAuthenticated} />
    </div>
  );
}
