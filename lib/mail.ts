import { Resend } from 'resend';
import * as React from 'react';
import { CircleInviteEmail } from '@/components/email/circle-invite-email';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendCircleInviteEmail({
    to,
    circleName,
    inviterName,
    inviterEmail,
    role,
    inviteLink,
}: {
    to: string;
    circleName: string;
    inviterName: string;
    inviterEmail: string;
    role: string;
    inviteLink: string;
}) {
    const from = process.env.EMAIL_FROM || 'Circles <onboarding@resend.dev>';
    const subject = `You've been invited to join the circle "${circleName}"`;

    try {
        console.log(`[Mail] Sending circle invitation email to ${to} for circle ${circleName}...`);
        const data = await resend.emails.send({
            from,
            to,
            subject,
            react: React.createElement(CircleInviteEmail, {
                circleName,
                inviterName,
                inviterEmail,
                role,
                inviteLink,
            }),
        });
        console.log(`[Mail] Invitation email sent successfully to ${to}. Data:`, data);
        return { success: true, data };
    } catch (error) {
        console.error(`[Mail] Failed to send invitation email to ${to}:`, error);
        return { success: false, error };
    }
}
