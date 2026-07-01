import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";

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