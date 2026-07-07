import { NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { circles, virtualAccounts, contributions } from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { nombaRequest, getNombaConfig } from '@/lib/nomba';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    console.log('[Cron] Starting automatic inflow sync...');

    // Optional: Protect cron endpoint using authorization key
    const authHeader = req.headers.get('Authorization');
    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const activeCircles = await db
            .select()
            .from(circles)
            .where(isNull(circles.deletedAt));

        console.log(`[Cron] Found ${activeCircles.length} active circles to sync`);

        const { subAccountId } = getNombaConfig();
        if (!subAccountId) {
            return NextResponse.json({ error: 'NOMBA_SUB_ACCOUNT_ID is not configured' }, { status: 500 });
        }

        // Fetch recent transactions from Nomba
        const txData = await nombaRequest<any>(
            'GET',
            `/v1/transactions/accounts/${subAccountId}`,
            {
                query: { limit: 100 }
            }
        );

        const results = txData?.results || [];
        console.log(`[Cron] Fetched ${results.length} recent transactions from Nomba`);

        let totalSynced = 0;

        // Process each active circle
        for (const circle of activeCircles) {
            const [vaRecord] = await db
                .select()
                .from(virtualAccounts)
                .where(eq(virtualAccounts.circleId, circle.id))
                .limit(1);

            if (!vaRecord) continue;

            for (const tx of results) {
                const isSuccess = String(tx.status).toUpperCase() === 'SUCCESS';
                const isVirtualAccountDeposit = 
                    String(tx.type).toLowerCase() === 'vact_transfer' || 
                    String(tx.type).toLowerCase() === 'deposit';

                if (!isSuccess || !isVirtualAccountDeposit) continue;

                const txAccountRef = tx.virtualAccountReference || tx.accountRef || '';
                const txAccountNumber = tx.recipientAccountNumber || tx.accountNumber || '';

                const isRefMatch = txAccountRef && txAccountRef === vaRecord.accountRef;
                const isNumberMatch = txAccountNumber && txAccountNumber === vaRecord.bankAccountNumber;

                if (!isRefMatch && !isNumberMatch) continue;

                const transactionId = tx.id || tx.transactionId || tx.sessionId;
                if (!transactionId) continue;

                const [existing] = await db
                    .select()
                    .from(contributions)
                    .where(eq(contributions.reference, transactionId))
                    .limit(1);

                if (existing) continue;

                const amount = String(tx.amount || '0.00');
                const senderName = tx.senderName || tx.ktaSenderName || null;
                const senderBank = tx.bankName || tx.ktaSenderBankCode || null;
                const senderAccountNumber = tx.accountNumber || tx.ktaSenderAccountNumber || null;

                await db.insert(contributions).values({
                    circleId: vaRecord.circleId,
                    userId: null,
                    amount,
                    status: 'success',
                    reference: transactionId,
                    senderName,
                    senderBank,
                    senderAccountNumber,
                    reconciled: false,
                    rawPayload: JSON.stringify(tx),
                });

                totalSynced++;
            }
        }

        console.log(`[Cron] Completed sync. Synced ${totalSynced} new contributions.`);
        return NextResponse.json({ success: true, syncedCount: totalSynced }, { status: 200 });
    } catch (err: any) {
        console.error('[Cron] Error syncing inflows:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
