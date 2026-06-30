import { Webhook } from "svix";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import { user } from "@/lib/db/schema";

export async function POST(req: Request) {
    const payload = await req.text();

    const headerPayload = await headers();

    const svixId = headerPayload.get("svix-id")!;
    const svixTimestamp = headerPayload.get("svix-timestamp")!;
    const svixSignature = headerPayload.get("svix-signature")!;

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

    const evt = wh.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as { type: string; data: any };

    if (evt.type === "user.created") {
        const data = evt.data;

        await db.insert(user).values({
            id: data.id,
            name:
                `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
            email: data.email_addresses[0]?.email_address,
            image: data.image_url,
            phone: data.phone_numbers[0]?.phone_number,
            emailVerified: true,
        });
    }

    return new Response("OK");
}