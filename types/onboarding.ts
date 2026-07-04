export type PrivacyOption = 'invite_only' | 'private';

export interface CircleMember {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    role: 'Admin' | 'Member';
    status: 'active' | 'invited';
}

export interface CircleFormData {
    name: string;
    slug: string;
    description: string;
    logoUrl: string | null;
    privacy: PrivacyOption;
    members: CircleMember[];
    targetAmount?: number;
    monthlyContribution?: number;
    cycleLengthMonths?: number;
}

export type OnboardingStep = 1 | 2;
