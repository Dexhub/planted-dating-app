# Backend Setup Guide for Planted

## Overview
This guide explains how to set up the backend integration for the Planted dating app application form.

## 1. Zapier Webhook Setup

1. **Create a Zapier Account** (if you don't have one)
   - Go to [zapier.com](https://zapier.com)
   - Sign up for a free account

2. **Create a New Zap**
   - Click "Create Zap"
   - Choose "Webhooks by Zapier" as the trigger
   - Select "Catch Hook" as the trigger event
   - Copy the webhook URL provided

3. **Set Up Actions**
   - Add actions to:
     - Send data to Google Sheets or Airtable
     - Send notification emails
     - Create entries in your CRM
     - Send SMS verification via Twilio (optional)

4. **Update backend.js**
   - Replace `YOUR_ZAPIER_ID` and `YOUR_HOOK_ID` with your actual webhook URL

## 2. Stripe Integration

1. **Create Stripe Account**
   - Go to [stripe.com](https://stripe.com)
   - Sign up and verify your account

2. **Get API Keys**
   - Go to Dashboard → Developers → API Keys
   - Copy your publishable key (starts with `pk_`)

3. **Create Products & Prices**
   - Create a product called "Planted Membership"
   - Set up two prices:
     - $1 for verification (one-time)
     - $19/month for membership (recurring)

4. **Set Up Checkout**
   - Use Stripe Checkout for the payment flow
   - Configure success and cancel URLs

5. **Update backend.js**
   - Replace `pk_test_YOUR_STRIPE_PUBLIC_KEY` with your actual publishable key

## 3. Phone Verification (Optional)

1. **Twilio Setup via Zapier**
   - Add Twilio integration to your Zap
   - Configure SMS sending for phone verification
   - Set up verification code generation

## 4. Data Storage Options

### Option A: Google Sheets (Simple)
- Add Google Sheets action in Zapier
- Create columns for all form fields
- Auto-populate new rows with applications

### Option B: Airtable (Recommended)
- Better for managing applications
- Can add views for approved/rejected
- Supports file attachments for photos

### Option C: Database (Advanced)
- Set up PostgreSQL or MongoDB
- Create API endpoints
- More scalable solution

## 5. Environment Variables

Create a `.env` file (don't commit to git):

```
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/YOUR_ID/YOUR_HOOK/
STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
```

## 6. Testing

1. **Test Zapier Webhook**
   - Submit a test application
   - Check Zapier dashboard for caught data
   - Verify actions are triggered

2. **Test Stripe Integration**
   - Use test card: 4242 4242 4242 4242
   - Verify $1 authorization works
   - Check Stripe dashboard

## 7. Production Checklist

- [ ] Replace test API keys with live keys
- [ ] Set up proper error handling
- [ ] Add server-side validation
- [ ] Implement rate limiting
- [ ] Set up monitoring/alerts
- [ ] Configure CORS properly
- [ ] Add SSL certificate
- [ ] Set up backup system

## 8. Security Notes

- Never expose secret keys in frontend code
- Validate all data server-side
- Use HTTPS for all requests
- Implement CAPTCHA for spam prevention
- Store sensitive data encrypted

## Support

For questions about:
- Zapier: support@zapier.com
- Stripe: support.stripe.com
- General setup: Create an issue in this repo