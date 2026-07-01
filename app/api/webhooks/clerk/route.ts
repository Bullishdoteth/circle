import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid"

import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error("Missing CLERK_WEBHOOK_SECRET");
    }

    const payload = await req.text();
    const headerPayload = await headers();

    const svixId = headerPayload.get("svix-id");
    const svixTimestamp = headerPayload.get("svix-timestamp");
    const svixSignature = headerPayload.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
        return new NextResponse("Missing Svix headers", {
            status: 400,
        });
    }

    const wh = new Webhook(WEBHOOK_SECRET);

    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    let evt: any;

    try {
        evt = wh.verify(payload, {
            "svix-id": svixId,
            "svix-timestamp": svixTimestamp,
            "svix-signature": svixSignature,
        });
    } catch (err) {
        console.error("Webhook verification failed", err);

        return new NextResponse("Invalid webhook", {
            status: 400,
        });
    }

    const eventType = evt.type;

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
                email_addresses.find(
                    //eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (email: any) => email.id === evt.data.primary_email_address_id
                )?.email_address ??
                email_addresses[0]?.email_address;

            const primaryPhone =
                phone_numbers.find(
                    //eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (phone: any) => phone.id === evt.data.primary_phone_number_id
                )?.phone_number ??
                phone_numbers[0]?.phone_number ??
                null;

            if (!id || !primaryEmail) {
                return new NextResponse("Missing required data", {
                    status: 400,
                });
            }

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
                email_addresses.find(
                    //eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (email: any) => email.id === evt.data.primary_email_address_id
                )?.email_address ??
                email_addresses[0]?.email_address;

            const primaryPhone =
                phone_numbers.find(
                    //eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (phone: any) => phone.id === evt.data.primary_phone_number_id
                )?.phone_number ??
                phone_numbers[0]?.phone_number ??
                null;

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

            break;
        }

        case "user.deleted": {
            const { id } = evt.data;

            if (!id) {
                return new NextResponse("Missing user id", {
                    status: 400,
                });
            }

            await db
                .delete(users)
                .where(eq(users.clerkId, id));

            break;
        }

        default:
            break;
    }

    return NextResponse.json(
        {
            success: true,
        },
        {
            status: 200,
        }
    );
}