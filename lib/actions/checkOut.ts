'use server';

import axios from 'axios';

export async function createTestCheckoutOrder(amount: string, email: string) {
    const url = 'https://sandbox.nomba.com/v1/checkout/order';
    
    const token = process.env.NOMBA_ACCESS_TOKEN;
    const accountId = process.env.NOMBA_ACCOUNT_ID; 
    const callbackUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL;

    const payload = {
        order: {
        orderReference: `test_ref_${Date.now()}`,
        amount: amount,
        currency: "NGN",
        customerEmail: email,
        callbackUrl: callbackUrl
        }
    };

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accountId': accountId
    };

    try {
        const response = await axios.post(url, payload, { headers });
        // Return the link object back to your frontend UI
        return { success: true, data: response.data.data };
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Nomba API Error:', error.response?.data || error.message);
        return { success: false, error: error.response?.data?.description || 'Failed to create order' };
    }
}
