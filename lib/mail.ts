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
    const from = process.env.EMAIL_FROM || 'Circles <invitations@newnaija.ng>';
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

export async function sendContributionReconciledEmail({
    to,
    amount,
    circleName,
    round,
}: {
    to: string;
    amount: string;
    circleName: string;
    round: string;
}) {
    const from = process.env.EMAIL_FROM || 'Circles <notifications@newnaija.ng>';
    const subject = `Payment Confirmed: Your contribution for Round ${round} is received`;
    const text = `Hello,\n\nWe have successfully received and reconciled your contribution of ₦${parseFloat(amount).toLocaleString()} for Round ${round} in the "${circleName}" circle.\n\nThank you for saving with us!\n\nBest regards,\nCircles Team`;

    try {
        console.log(`[Mail] Sending payment reconciliation email to ${to}...`);
        const data = await resend.emails.send({
            from,
            to,
            subject,
            text,
        });
        return { success: true, data };
    } catch (error) {
        console.error(`[Mail] Failed to send payment email:`, error);
        return { success: false, error };
    }
}

export async function sendPayoutProcessedEmail({
    to,
    amount,
    circleName,
    bankName,
    accountNumber,
}: {
    to: string;
    amount: string;
    circleName: string;
    bankName: string;
    accountNumber: string;
}) {
    const from = process.env.EMAIL_FROM || 'Circles <notifications@newnaija.ng>';
    const subject = `Payout Disbursed: ₦${parseFloat(amount).toLocaleString()} has been sent to your account`;
    const text = `Hello,\n\nCongratulations! Your payout of ₦${parseFloat(amount).toLocaleString()} for the "${circleName}" circle has been successfully processed.\n\nThe funds have been transferred directly to your bank account:\n- Bank: ${bankName}\n- Account Number: ${accountNumber}\n\nBest regards,\nCircles Team`;

    try {
        console.log(`[Mail] Sending payout disbursement email to ${to}...`);
        const data = await resend.emails.send({
            from,
            to,
            subject,
            text,
        });
        return { success: true, data };
    } catch (error) {
        console.error(`[Mail] Failed to send payout email:`, error);
        return { success: false, error };
    }
}
