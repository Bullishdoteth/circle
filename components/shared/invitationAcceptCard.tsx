'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { 
  Users, 
  Check, 
  X, 
  Shield, 
  AlertTriangle, 
  Loader2 
} from 'lucide-react';
import { acceptInvitationAction, declineInvitationAction, type InvitationDetails } from '@/lib/actions/circle';

interface InvitationAcceptCardProps {
  invitation: InvitationDetails;
  isAuthenticated: boolean;
}

export function InvitationAcceptCard({ invitation, isAuthenticated }: InvitationAcceptCardProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const currentUserEmail = user?.primaryEmailAddress?.emailAddress;
  const emailsMismatch = currentUserEmail && invitation.email.toLowerCase() !== currentUserEmail.toLowerCase();

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const res = await acceptInvitationAction(invitation.id);
      if (res.success && res.data) {
        toast.success(`Welcome to ${invitation.circleName}!`);
        // Reload Clerk user session so the onboarding metadata changes are picked up
        if (isLoaded && user) {
          await user.reload();
        }
        router.push(`/circles/${res.data.slug}`);
      } else {
        toast.error(res.error || 'Failed to accept invitation.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An unexpected error occurred.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      const res = await declineInvitationAction(invitation.id);
      if (res.success) {
        toast.success('Invitation declined.');
        router.push('/dashboard');
      } else {
        toast.error(res.error || 'Failed to decline invitation.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An unexpected error occurred.');
    } finally {
      setIsDeclining(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-8">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <span className="text-2xl font-bold tracking-tight text-emerald-600 font-space-grotesk">
          circle
        </span>
      </div>

      {/* Card Info */}
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
          <Users size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 leading-tight">
          Join {invitation.circleName}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          You&apos;ve been invited by <span className="font-semibold text-slate-800">{invitation.inviterName}</span> to join as a <span className="font-medium text-emerald-700 capitalize">{invitation.role}</span>.
        </p>
      </div>

      {/* Role details box */}
      <div className="mb-6 rounded-2xl bg-slate-50 border border-slate-100 p-4 flex items-center gap-3">
        {invitation.role === 'admin' ? (
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Shield size={20} />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users size={20} />
          </div>
        )}
        <div className="text-left">
          <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Role Assigned</p>
          <p className="text-sm font-semibold text-slate-800 capitalize">{invitation.role}</p>
        </div>
      </div>

      {/* Auth state check */}
      {!isAuthenticated ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-left flex gap-2">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-amber-800">
              Please sign in or create an account with Clerk to accept this invitation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a
              href={`/sign-in?redirect_url=/invitations/${invitation.id}`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-black"
            >
              Sign In
            </a>
            <a
              href={`/sign-up?redirect_url=/invitations/${invitation.id}`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Create Account
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Warn if email mismatch */}
          {emailsMismatch && (
            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-left flex gap-2.5">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
              <div>
                <p className="text-xs font-semibold text-amber-900">Email Address Mismatch</p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-normal">
                  This invite was sent to <span className="font-semibold">{invitation.email}</span>, but you are signed in as <span className="font-semibold">{currentUserEmail}</span>. You can still accept, but confirm you want to join with this account.
                </p>
              </div>
            </div>
          )}

          {/* Connected User Badge */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-500">Accepting as</span>
            </div>
            <span className="text-xs font-semibold text-slate-700 max-w-[200px] truncate">
              {currentUserEmail}
            </span>
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleAccept}
              disabled={isAccepting || isDeclining}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {isAccepting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Accept
                </>
              )}
            </button>

            <button
              onClick={handleDecline}
              disabled={isAccepting || isDeclining}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
            >
              {isDeclining ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Declining...
                </>
              ) : (
                <>
                  <X size={16} />
                  Decline
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
