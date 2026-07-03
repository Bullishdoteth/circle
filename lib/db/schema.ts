import { pgTable, text, timestamp, boolean, uuid, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";

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