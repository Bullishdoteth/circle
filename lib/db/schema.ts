import { pgTable, text, timestamp, boolean, uuid, pgEnum, index, uniqueIndex, numeric, integer } from "drizzle-orm/pg-core";

/**
 * Core Identity
 */

export const users = pgTable("users", {
    id: uuid("id").primaryKey(),
    clerkId: text("clerk_id").notNull().unique(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    username: text("user_name").unique(),
    email: text("email").notNull().unique(),
    imageUrl: text("image_url"),
    address: text("address"),
    phoneNumber: text("phone_number"),
    onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", {
        withTimezone: true,
    }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {
        withTimezone: true,
    })
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
});

/** 
 * Enums Table
 * */

export const circleVisibilityEnum = pgEnum("circle_visibility", [
    "private",
    "invite_only",
])

export const circleStatusEnum = pgEnum("circle_status", [
    "active",
    "archived",
    "suspended",
    "deleted"
])

export const circleMemberRoleEnum = pgEnum("circle_member_role", [
    "owner",
    "admin",
    "treasurer",
    "member",
])

export const membershipStatusEnum = pgEnum("membership_status", [
    "active",
    "suspended",
    "removed",
])

export const currencyEnum = pgEnum("currency", [
    "NGN",
])

export const invitationStatusEnum = pgEnum("invitation_status", [
    "pending",
    "accepted",
    "declined",
    "expired",
    "revoked",
])

export const invitationTypeEnum = pgEnum("invitation_type", [
    "email",
    "link",
    "code",
])

/**
 * Circle Configuration
 */

export const circles = pgTable("circles", {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    currency: currencyEnum("currency").default("NGN").notNull(),
    ownerId: uuid("owner_id").notNull().references(() => users.id, {
        onDelete: "restrict"
    }),
    visibility: circleVisibilityEnum("visibility").default("invite_only").notNull(),
    status: circleStatusEnum("status").default("active").notNull(),
    createdBy: uuid("created_by").notNull().references(() => users.id, {
        onDelete: "restrict"
    }),
    lastActivityAt: timestamp("last_activity_at", {
        withTimezone: true,
    }),
    contributionAmount: numeric("contribution_amount", { precision: 12, scale: 2 }).default("50000.00").notNull(),
    payoutMethod: text("payout_method").default("manual").notNull(),
    frequency: text("frequency").default("monthly").notNull(),
    currentRound: integer("current_round").default(1).notNull(),
    createdAt: timestamp("created_at", {
        withTimezone: true,
    }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {
        withTimezone: true,
    })
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
    deletedAt: timestamp("deleted_at", {
        withTimezone: true,
    }),
}, (table) => ({
    /**
     * Fast lookup:
     * Circles by owner
     */
    ownerIdx: index("circle_owner_idx").on(table.ownerId),
}));

/**
 * Membership
 */

export const circleMembers = pgTable("circle_members", {
    id: uuid("id").defaultRandom().primaryKey(),
    circleId: uuid("circle_id")
        .notNull()
        .references(() => circles.id, { onDelete: "cascade"}),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    role: circleMemberRoleEnum("role").default("member").notNull(),
    status: membershipStatusEnum("status").default("active").notNull(),
    invitedBy: uuid("invited_by").references(() => users.id, {
        onDelete: "set null",
    }),
    acceptedAt: timestamp("accepted_at", {
        withTimezone: true,
    }),
    removedAt: timestamp("removed_at", {
        withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
        withTimezone: true,
    }).defaultNow().notNull(),
    rotationPosition: integer("rotation_position"),
    payoutDate: timestamp("payout_date", { withTimezone: true }),
    updatedAt: timestamp("updated_at", {
        withTimezone: true,
    })
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
},
(table) => ({
    /**
     * Prevent duplicate memberships
     */
    uniqueMembership: uniqueIndex("unique_membership").on(table.circleId, table.userId),

        /**
     * Fast lookup:
     * Members in a circle
     */
    circleIdx: index("circle_member_circle_idx").on(
    table.circleId
    ),

    /**
     * Fast lookup:
     * Circles a user belongs to
     */
    userIdx: index("circle_member_user_idx").on(
    table.userId
    ),
}));

/**
 * Invitation Lifecycle
 */

export const invitations = pgTable("invitations", {
    id: uuid("id").defaultRandom().primaryKey(),
    circleId: uuid("circle_id")
        .notNull()
        .references(() => circles.id, { onDelete: "cascade" }),
    invitedBy: uuid("invited_by")
        .references(() => users.id, { onDelete: "set null" }),
    invitedUserId: uuid("invited_user_id").references(() => users.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    message: text("message"),
    token: text("token").notNull().unique(),
    type: invitationTypeEnum("type").default("email").notNull(),
    role: circleMemberRoleEnum("role").default("member").notNull(),
    status: invitationStatusEnum("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at", {
        withTimezone: true,
    }).notNull(),
    acceptedAt: timestamp("accepted_at", {
        withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
        withTimezone: true,
    }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {
        withTimezone: true,
    })
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
    deletedAt: timestamp("deleted_at", {
        withTimezone: true,
    }),
},
(table) => ({
    /**
     * Prevent duplicate invitations
     */
    emailIdx: index("invitation_email_idx").on(table.email),
    circleIdx: index("invitation_circle_idx").on(table.circleId),
    invitedUserIdx: index("invitation_invited_user_idx").on(table.invitedUserId),
})); 

/**
 * Circle Nomba Virtual Account
 */
export const virtualAccounts = pgTable("virtual_accounts", {
    id: uuid("id").defaultRandom().primaryKey(),
    circleId: uuid("circle_id")
        .notNull()
        .unique()
        .references(() => circles.id, { onDelete: "cascade" }),
    accountRef: text("account_ref").notNull().unique(),
    accountName: text("account_name").notNull(),
    bankName: text("bank_name").notNull(),
    bankAccountNumber: text("bank_account_number").notNull().unique(),
    bankAccountName: text("bank_account_name").notNull(),
    currency: text("currency").default("NGN").notNull(),
    status: text("status").default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
}, (table) => ({
    circleIdx: index("va_circle_idx").on(table.circleId),
    bankAccountIdx: index("va_bank_account_idx").on(table.bankAccountNumber),
}));

/**
 * Circle Member Contributions (Deposits)
 */
export const contributions = pgTable("contributions", {
    id: uuid("id").defaultRandom().primaryKey(),
    circleId: uuid("circle_id")
        .notNull()
        .references(() => circles.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
        .references(() => users.id, { onDelete: "set null" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    status: text("status").default("pending").notNull(), // 'pending', 'success', 'failed', 'reversed'
    reference: text("reference").notNull().unique(), // Nomba transactionId or unique ref
    senderName: text("sender_name"),
    senderBank: text("sender_bank"),
    senderAccountNumber: text("sender_account_number"),
    round: text("round"),
    reconciled: boolean("reconciled").default(false).notNull(),
    reconciledAt: timestamp("reconciled_at", { withTimezone: true }),
    reconciledBy: uuid("reconciled_by").references(() => users.id, { onDelete: "set null" }),
    rawPayload: text("raw_payload"), // Store JSON stringified payload
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
}, (table) => ({
    circleIdx: index("contribution_circle_idx").on(table.circleId),
    userIdx: index("contribution_user_idx").on(table.userId),
    referenceIdx: index("contribution_ref_idx").on(table.reference),
}));

/**
 * Circle Member Payouts (Withdrawals/Disbursements)
 */
export const payouts = pgTable("payouts", {
    id: uuid("id").defaultRandom().primaryKey(),
    circleId: uuid("circle_id")
        .notNull()
        .references(() => circles.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    status: text("status").default("pending").notNull(), // 'pending', 'success', 'failed'
    reference: text("reference").notNull().unique(), // Nomba transfer payout reference
    destinationBank: text("destination_bank").notNull(),
    destinationAccountNumber: text("destination_account_number").notNull(),
    destinationAccountName: text("destination_account_name").notNull(),
    round: text("round"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
}, (table) => ({
    circleIdx: index("payout_circle_idx").on(table.circleId),
    userIdx: index("payout_user_idx").on(table.userId),
    referenceIdx: index("payout_ref_idx").on(table.reference),
}));

/**
 * Live User Notifications
 */
export const notifications = pgTable("notifications", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    circleId: uuid("circle_id")
        .references(() => circles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    message: text("message").notNull(),
    type: text("type").default("info").notNull(), // 'info', 'success', 'warning', 'invite'
    read: boolean("read").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
    userIdx: index("notification_user_idx").on(table.userId),
    readIdx: index("notification_read_idx").on(table.read),
})); 