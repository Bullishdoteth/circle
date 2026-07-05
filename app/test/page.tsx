'use client';

import { useState } from 'react';
import { createTestCheckoutOrder } from '@/lib/actions/checkOut';

export default function CheckoutPage() {
    const [loading, setLoading] = useState(false);
    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

    const handleCheckout = async () => {
        setLoading(true);
        // Call our server action with test variables
        const result = await createTestCheckoutOrder("2500.00", "developer-test@example.com");
        setLoading(false);

        if (result.success && result.data?.checkoutLink) {
        setCheckoutUrl(result.data.checkoutLink);
        } else {
        alert("Error: Checkout link creation failed.");
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
        <h1>Nomba Webhook Tester</h1>
        <button 
            onClick={handleCheckout} 
            disabled={loading}
            style={{ padding: '10px 20px', cursor: 'pointer', background: '#000', color: '#fff', borderRadius: '5px' }}
        >
            {loading ? 'Generating...' : 'Pay ₦2,500.00'}
        </button>

        {checkoutUrl && (
            <div style={{ marginTop: '20px' }}>
            <p>Order created successfully!</p>
            <a 
                href={checkoutUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: 'blue', textDecoration: 'underline' }}
            >
                Click here to open Nomba Test Payment Page
            </a>
            </div>
        )}
        </div>
    );
}
