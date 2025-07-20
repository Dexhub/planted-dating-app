// Backend handler for Planted application
// This handles form submission, Zapier webhook, and Stripe payment

// Configuration (replace with your actual keys)
const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/YOUR_ZAPIER_ID/YOUR_HOOK_ID/';
const STRIPE_PUBLIC_KEY = 'pk_test_YOUR_STRIPE_PUBLIC_KEY';

// Initialize Stripe
let stripe = null;
if (typeof Stripe !== 'undefined') {
    stripe = Stripe(STRIPE_PUBLIC_KEY);
}

// Handle form submission
async function handleFormSubmission(formData) {
    try {
        // Step 1: Send data to Zapier webhook
        const zapierResponse = await sendToZapier(formData);
        
        if (!zapierResponse.ok) {
            throw new Error('Failed to submit application');
        }
        
        // Step 2: Create Stripe checkout session for $1 pre-authorization
        const checkoutSession = await createStripeSession(formData);
        
        return {
            success: true,
            checkoutUrl: checkoutSession.url,
            applicationId: zapierResponse.id
        };
    } catch (error) {
        console.error('Submission error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Send form data to Zapier
async function sendToZapier(formData) {
    const response = await fetch(ZAPIER_WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...formData,
            submittedAt: new Date().toISOString(),
            source: 'planted-dating-app'
        })
    });
    
    return {
        ok: response.ok,
        id: Date.now().toString() // Generate application ID
    };
}

// Create Stripe checkout session
async function createStripeSession(formData) {
    // In production, this would be done on your server
    // For now, we'll create a payment link client-side
    
    // This is a placeholder - in production, you'd create a checkout session
    // on your server and return the URL
    return {
        url: `https://checkout.stripe.com/pay/cs_test_YOUR_SESSION_ID#${formData.email}`
    };
}

// Phone verification using Twilio (via Zapier)
async function verifyPhone(phoneNumber) {
    // This would trigger a Zapier automation to send SMS via Twilio
    const response = await fetch(ZAPIER_WEBHOOK_URL + '/verify-phone', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            phone: phoneNumber,
            action: 'send-verification'
        })
    });
    
    return response.ok;
}

// Export functions for use in application
window.PlantedBackend = {
    handleFormSubmission,
    verifyPhone,
    STRIPE_PUBLIC_KEY
};