type CreateCircleInput = {
    name: string
    slug: string
    description?: string
    imageUrl?: string
    visibility?: "private" | "invite_only"
}

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
}

export type CreateCircleStep = 1 | 2;