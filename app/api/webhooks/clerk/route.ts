import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/lib/db/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
    try {
        const payload = await req.text();

        const headerList = await headers();

        const svixId = headerList.get("svix-id");
        const svixTimestamp = headerList.get("svix-timestamp");
        const svixSignature = headerList.get("svix-signature");

        if (!svixId || !svixTimestamp || !svixSignature) {
        return NextResponse.json(
            { error: "Missing Svix headers" },
            { status: 400 }
        );
        }

        const wh = new Webhook(process.env.CLERK_WEBHOOK_SIGNING_SECRET!);

        const evt = wh.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
        }) as {
        type: string;
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any;
        };

        switch (evt.type) {
        case "user.created":
            await handleUserCreated(evt.data);
            break;

        case "user.updated":
            await handleUserUpdated(evt.data);
            break;

        case "user.deleted":
            await handleUserDeleted(evt.data);
            break;

        default:
            console.log(`Ignoring event ${evt.type}`);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
        { success: false },
        { status: 400 }
        );
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getFullName(data: any) {
    return (
        data.full_name ||
        `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim()
    );
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPrimaryEmail(data: any) {
    const primary = data.email_addresses.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (email: any) => email.id === data.primary_email_address_id
    );

    return primary?.email_address ?? "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPrimaryPhone(data: any) {
    const primary = data.phone_numbers.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (phone: any) => phone.id === data.primary_phone_number_id
    );

    return primary?.phone_number ?? null;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isEmailVerified(data: any) {
    const primary = data.email_addresses.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (email: any) => email.id === data.primary_email_address_id
    );

    return primary?.verification?.status === "verified";
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleUserCreated(data: any) {
    await db.insert(user).values({
        id: data.id,
        name: getFullName(data),
        email: getPrimaryEmail(data),
        phone: getPrimaryPhone(data),
        image: data.image_url,
        emailVerified: isEmailVerified(data),

        // Defaults
        role: "guest",
        isActive: true,
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleUserUpdated(data: any) {
    await db
        .update(user)
        .set({
        name: getFullName(data),
        email: getPrimaryEmail(data),
        phone: getPrimaryPhone(data),
        image: data.image_url,
        emailVerified: isEmailVerified(data),
        })
        .where(eq(user.id, data.id));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleUserDeleted(data: any) {
        if (!data.id) return;

        await db
        .update(user)
        .set({
            isActive: false,
        })
        .where(eq(user.id, data.id));
}