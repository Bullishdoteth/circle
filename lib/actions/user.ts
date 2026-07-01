"use server";

import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Create a new user in the database
export async function createUser(data: {
    clerkId: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    imageUrl?: string | null;
    phoneNumber?: string | null;
    }) {
    try {
        const [user] = await db
        .insert(users)
        .values({
            id: crypto.randomUUID(),
            clerkId: data.clerkId,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            username: data.username,
            imageUrl: data.imageUrl,
            phoneNumber: data.phoneNumber,
        })
        .returning();

        return {
        success: true,
        data: user,
        };
    } catch (error) {
        console.error("CREATE_USER_ERROR", error);

        return {
        success: false,
        error: "Unable to create user.",
        };
    }
}

// Update an existing user in the database
export async function updateUser(
    clerkId: string,
    data: {
        email?: string;
        firstName?: string | null;
        lastName?: string | null;
        username?: string | null;
        imageUrl?: string | null;
        phoneNumber?: string | null;
    }
    ) {
    try {
        const [user] = await db
        .update(users)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(eq(users.clerkId, clerkId))
        .returning();

        return {
        success: true,
        data: user,
        };
    } catch (error) {
        console.error("UPDATE_USER_ERROR", error);

        return {
        success: false,
        error: "Unable to update user.",
        };
    }
}

// Deactivate a user in the database
export async function deactivateUser(clerkId: string) {
    try {
        const [user] = await db
        .update(users)
        .set({
            isActive: false,
            updatedAt: new Date(),
        })
        .where(eq(users.clerkId, clerkId))
        .returning();

        return {
        success: true,
        data: user,
        };
    } catch (error) {
        console.error("DEACTIVATE_USER_ERROR", error);

        return {
        success: false,
        error: "Unable to deactivate user.",
        };
    }
}