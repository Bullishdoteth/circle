import { pgTable, text, timestamp, boolean, uuid, integer, decimal, jsonb, uniqueIndex, unique, index  } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    address: text("address"),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    phone: text("phone"),
    role: text("role").default("guest").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
});