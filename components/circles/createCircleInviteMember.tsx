'use client';

import React, { useState } from 'react';
import {
    UserPlus,
    Mail,
    Trash2,
    Users,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { toast } from "sonner"
import { CircleMember } from '@/types/onboarding';
import { CircleFormValues, inviteEmailSchema } from '@/components/forms/schema/circleFormSchema';

interface Step2Props {
    formData: CircleFormValues;
    updateFormData: (data: Partial<CircleFormValues>) => void;
    onBack: () => void;
    onFinish: () => void;
    onSkip: () => void;
    isLoading: boolean;
}

export const Step2CreateCircleInviteMembers: React.FC<Step2Props> = ({
    formData,
    updateFormData,
    onBack,
    onFinish,
    onSkip,
    isLoading,
    }) => {
    const [emailInput, setEmailInput] = useState('');
    const [nameInput, setNameInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleAddMember = (e?: React.FormEvent) => {
        e?.preventDefault();

        setError(null);

        const result = inviteEmailSchema.safeParse({
        email: emailInput.trim(),
        });

        if (!result.success) {
        setError(
            result.error.format().email?._errors[0] ??
            'Please enter a valid email address.'
        );
        return;
        }

        const email = result.data.email.toLowerCase();

        const alreadyExists = formData.members.some(
        (member) => member.email.toLowerCase() === email
        );

        if (alreadyExists) {
        setError('This email has already been added.');
        return;
        }

        const displayName =
        nameInput.trim() ||
        email
            .split('@')[0]
            .replace(/[._-]/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());

        const newMember: CircleMember = {
        id: crypto.randomUUID(),
        name: displayName,
        email,
        role: 'Member',
        status: 'invited',
        };
        
        updateFormData({
            members: [...formData.members, newMember],
        });
        
        setEmailInput('');
        setNameInput('');
        toast.success(`Added ${displayName} to the invitation list.`);
    };

    const handleRemoveMember = (id: string) => {
        updateFormData({
        members: formData.members.filter((member) => member.id !== id),
        });
        toast.error("Member removed")
    };

    return (
        <div className="space-y-6">
        <header>
            <h1 className="mb-2 text-[28px] font-bold tracking-[-0.03em] text-[#111827] sm:text-[32px]">
            Invite members
            </h1>

            <p className="text-base text-[#6B7280] sm:text-lg">
            Invite people now or skip and do it later from your Circle dashboard.
            </p>
        </header>

        <form onSubmit={handleAddMember} className="space-y-3">
            <div className="space-y-2">
            <label
                htmlFor="member-email"
                className="block text-sm font-medium text-[#111827]"
            >
                Email address
            </label>

            <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />

                <input
                    id="member-email"
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                    setEmailInput(e.target.value);

                    if (error) {
                        setError(null);
                    }
                    }}
                    placeholder="friend@example.com"
                    className="w-full rounded-xl border border-[#E5E7EB] py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-[#4AA054] focus:ring-2 focus:ring-[#4AA054]/20"
                />
                </div>

                <button
                type="submit"
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#111827] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
                >
                <UserPlus className="h-4 w-4" />
                Add
                </button>
            </div>

            {error && (
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-rose-600">
                <AlertCircle className="h-3.5 w-3.5" />
                {error}
                </p>
            )}
            </div>
        </form>

        <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#6B7280]">
            <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                Members ({formData.members.length})
            </span>

            {formData.members.length > 0 && (
                <span className="text-[#4AA054]">Ready to invite</span>
            )}
            </div>

            {formData.members.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-[#F9FAFB] p-6 text-center">
                <Users className="mx-auto h-8 w-8 text-[#9CA3AF]" />

                <p className="mt-2 text-xs text-[#6B7280]">
                No invitations yet. You can always invite members later.
                </p>
            </div>
            ) : (
            <div className="max-h-56 space-y-2 overflow-y-auto">
                {formData.members.map((member) => (
                <div
                    key={member.id}
                    className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white p-3"
                >
                    <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4AA054]/10 font-bold text-[#4AA054]">
                        {member.name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                        <p className="font-semibold text-[#111827]">
                        {member.name}
                        </p>

                        <p className="text-xs text-[#6B7280]">{member.email}</p>
                    </div>
                    </div>

                    <button
                    type="button"
                    onClick={() => handleRemoveMember(member.id)}
                    className="cursor-pointer rounded-lg p-2 text-rose-600 transition hover:bg-rose-50"
                    >
                    <Trash2 className="h-4 w-4" />
                    </button>
                </div>
                ))}
            </div>
            )}
        </div>

        <div className="-mb-6 -mx-6 mt-8 flex items-center justify-between rounded-b-[24px] border-t border-[#E5E7EB] bg-[#F9FAFB] px-6 py-5 sm:-mx-10 sm:-mb-10 sm:px-10 sm:py-6">
            <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="text-[15px] font-semibold text-[#6B7280] transition hover:text-[#111827] disabled:opacity-50"
            >
            ← Back
            </button>

            <div className="flex items-center gap-3">
            <button
                type="button"
                onClick={onSkip}
                disabled={isLoading}
                className="cursor-pointer text-[15px] font-semibold text-[#6B7280] transition hover:text-[#111827] disabled:opacity-50"
            >
                Skip
            </button>

            <button
                type="button"
                onClick={onFinish}
                disabled={isLoading}
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#4AA054] px-8 py-3 font-bold text-white shadow-[0_4px_12px_rgba(74,160,84,0.25)] transition hover:bg-[#3E8D47] disabled:opacity-80"
            >
                {isLoading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Circle...
                </>
                ) : (
                <>
                    Create Circle
                    <span>✓</span>
                </>
                )}
            </button>
            </div>
        </div>
        </div>
    );
};