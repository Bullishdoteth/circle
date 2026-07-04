import { z } from 'zod';

export const memberRoleSchema = z.enum(['Admin', 'Member']);
export const memberStatusSchema = z.enum(['active', 'invited']);
export const privacyOptionSchema = z.enum(['invite_only', 'private']);

export const memberSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Member name is required'),
    email: z
        .string()
        .trim()
        .email('Please enter a valid email address'),
    avatarUrl: z.string().optional(),
    role: memberRoleSchema,
    status: memberStatusSchema,
});

export const inviteEmailSchema = z.object({
    email: z
        .string()
        .trim()
        .email('Please enter a valid email address'),
});

export const circleStep1Schema = z.object({
    name: z
        .string()
        .trim()
        .min(1, 'Circle name is required')
        .max(60, 'Circle name must be 60 characters or less'),

    slug: z.string().trim().optional(),

    description: z
        .string()
        .trim()
        .max(250, 'Description must be 250 characters or less')
        .optional()
        .default(''),

    logoUrl: z.string().nullable().optional(),

    privacy: privacyOptionSchema,
    });

    export const circleFormSchema = circleStep1Schema.extend({
    members: z.array(memberSchema).default([]),
});

export type CircleFormValues = z.infer<typeof circleFormSchema>;
export type CircleStep1Values = z.infer<typeof circleStep1Schema>;
export type CircleMemberValues = z.infer<typeof memberSchema>;
export type InviteEmailValues = z.infer<typeof inviteEmailSchema>;