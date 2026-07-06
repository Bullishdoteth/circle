import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from 'react-email';

interface CircleInviteEmailProps {
  circleName: string;
  inviterName: string;
  inviterEmail: string;
  role: string;
  inviteLink: string;
}

export const CircleInviteEmail = ({
  circleName = 'Savings Circle',
  inviterName = 'Someone',
  inviterEmail = 'someone@example.com',
  role = 'member',
  inviteLink = 'https://getcircle.vercel.app',
}: CircleInviteEmailProps) => {
  const previewText = `Join ${circleName} on Circle`;

  return (
    <Html>
      <Tailwind>
        <Head />
        <Body className="mx-auto my-auto bg-slate-50 px-2 font-sans">
          <Preview>{previewText}</Preview>
          <Container className="mx-auto my-[40px] max-w-[465px] rounded-xl border border-slate-200 bg-white p-[32px] shadow-sm">
            <Section className="mt-[16px] text-center">
              <Text className="text-emerald-600 font-bold text-[28px] tracking-tight my-0">
                circle
              </Text>
            </Section>
            <Heading className="mx-0 my-[24px] p-0 text-center font-semibold text-[22px] text-slate-900 leading-tight">
              Join <strong>{circleName}</strong>
            </Heading>
            <Text className="text-[14px] text-slate-700 leading-[24px]">
              Hello,
            </Text>
            <Text className="text-[14px] text-slate-700 leading-[24px]">
              <strong>{inviterName}</strong> (
              <Link href={`mailto:${inviterEmail}`} className="text-emerald-600 no-underline">
                {inviterEmail}
              </Link>
              ) has invited you to join the savings circle <strong>{circleName}</strong> as a <strong>{role}</strong>.
            </Text>
            <Section className="mt-[28px] mb-[28px] text-center">
              <Button
                className="rounded-lg bg-emerald-600 px-6 py-3.5 text-center font-medium text-[14px] text-white no-underline shadow-md hover:bg-emerald-700 transition"
                href={inviteLink}
              >
                Accept Invitation
              </Button>
            </Section>
            <Text className="text-[13px] text-slate-500 leading-[20px]">
              Or copy and paste this URL into your browser:{' '}
              <Link href={inviteLink} className="text-emerald-600 break-all">
                {inviteLink}
              </Link>
            </Text>
            <Hr className="mx-0 my-[24px] w-full border border-slate-200" />
            <Text className="text-slate-400 text-[11px] leading-[18px]">
              This invitation was sent to this email address. If you were not expecting this invitation, you can safely ignore this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default CircleInviteEmail;
