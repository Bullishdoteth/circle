import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";

export async function POST(req: Request) {
    console.log("[Clerk Webhook] Incoming request");

    try {
        const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

        if (!WEBHOOK_SECRET) {
            console.error(
                "[Clerk Webhook] Missing CLERK_WEBHOOK_SIGNING_SECRET"
            );

            return NextResponse.json(
                {
                    error: "Webhook secret is missing",
                },
                {
                    status: 500,
                }
            );
        }

        const payload = await req.text();
        const headerPayload = await headers();

        const svixId = headerPayload.get("svix-id");
        const svixTimestamp = headerPayload.get("svix-timestamp");
        const svixSignature = headerPayload.get("svix-signature");

        if (!svixId || !svixTimestamp || !svixSignature) {
            console.error("[Clerk Webhook] Missing Svix headers", {
                hasSvixId: !!svixId,
                hasTimestamp: !!svixTimestamp,
                hasSignature: !!svixSignature,
            });

            return NextResponse.json(
                {
                    error: "Missing Svix headers",
                },
                {
                    status: 400,
                }
            );
        }

        const wh = new Webhook(WEBHOOK_SECRET);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let evt: any;

        try {
            evt = wh.verify(payload, {
                "svix-id": svixId,
                "svix-timestamp": svixTimestamp,
                "svix-signature": svixSignature,
            });

            console.log("[Clerk Webhook] Verification successful", {
                eventType: evt.type,
                clerkId: evt.data?.id,
            });
        } catch (error) {
            console.error("[Clerk Webhook] Verification failed", error);

            return NextResponse.json(
                {
                    error: "Invalid webhook signature",
                },
                {
                    status: 400,
                }
            );
        }

        const eventType = evt.type;

        try {
            switch (eventType) {
                case "user.created": {
                    const {
                        id,
                        first_name,
                        last_name,
                        username,
                        email_addresses,
                        image_url,
                        phone_numbers,
                    } = evt.data;

                    const primaryEmail =
                        email_addresses?.find(
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (email: any) =>
                                email.id === evt.data.primary_email_address_id
                        )?.email_address ??
                        email_addresses?.[0]?.email_address ??
                        null;

                    const primaryPhone =
                        phone_numbers?.find(
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (phone: any) =>
                                phone.id === evt.data.primary_phone_number_id
                        )?.phone_number ??
                        phone_numbers?.[0]?.phone_number ??
                        null;

                    if (!id || !primaryEmail) {
                        console.error(
                            "[Clerk Webhook] Missing required user data",
                            {
                                clerkId: id,
                                hasEmail: !!primaryEmail,
                            }
                        );

                        return NextResponse.json(
                            {
                                error: "Missing required user data",
                            },
                            {
                                status: 400,
                            }
                        );
                    }

                    console.log("[Clerk Webhook] Creating user", {
                        clerkId: id,
                        email: primaryEmail,
                    });

                    await db.insert(users).values({
                        id: uuid(),
                        clerkId: id,
                        email: primaryEmail,
                        firstName: first_name,
                        lastName: last_name,
                        username,
                        imageUrl: image_url,
                        phoneNumber: primaryPhone,
                    });

                    console.log("[Clerk Webhook] User created successfully", {
                        clerkId: id,
                    });

                    break;
                }

                case "user.updated": {
                    const {
                        id,
                        first_name,
                        last_name,
                        username,
                        email_addresses,
                        image_url,
                        phone_numbers,
                    } = evt.data;

                    const primaryEmail =
                        email_addresses?.find(
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (email: any) =>
                                email.id === evt.data.primary_email_address_id
                        )?.email_address ??
                        email_addresses?.[0]?.email_address ??
                        null;

                    const primaryPhone =
                        phone_numbers?.find(
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (phone: any) =>
                                phone.id === evt.data.primary_phone_number_id
                        )?.phone_number ??
                        phone_numbers?.[0]?.phone_number ??
                        null;

                    console.log("[Clerk Webhook] Updating user", {
                        clerkId: id,
                    });

                    await db
                        .update(users)
                        .set({
                            firstName: first_name,
                            lastName: last_name,
                            username,
                            email: primaryEmail,
                            imageUrl: image_url,
                            phoneNumber: primaryPhone,
                        })
                        .where(eq(users.clerkId, id));

                    console.log("[Clerk Webhook] User updated successfully", {
                        clerkId: id,
                    });

                    break;
                }

                case "user.deleted": {
                    const { id } = evt.data;

                    if (!id) {
                        console.error(
                            "[Clerk Webhook] Missing Clerk ID for deleted user"
                        );

                        return NextResponse.json(
                            {
                                error: "Missing Clerk ID",
                            },
                            {
                                status: 400,
                            }
                        );
                    }

                    console.log("[Clerk Webhook] Deleting user", {
                        clerkId: id,
                    });

                    await db.delete(users).where(eq(users.clerkId, id));

                    console.log("[Clerk Webhook] User deleted successfully", {
                        clerkId: id,
                    });

                    break;
                }

                default:
                    console.log("[Clerk Webhook] Ignoring event", {
                        eventType,
                    });

                    break;
            }
        } catch (error) {
            console.error("[Clerk Webhook] Database operation failed", {
                eventType,
                clerkId: evt.data?.id,
                error,
            });

            return NextResponse.json(
                {
                    error: "Database operation failed",
                },
                {
                    status: 500,
                }
            );
        }

        return NextResponse.json(
            {
                success: true,
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.error("[Clerk Webhook] Unexpected error", error);

        return NextResponse.json(
            {
                error: "Internal server error",
            },
            {
                status: 500,
            }
        );
    }
}