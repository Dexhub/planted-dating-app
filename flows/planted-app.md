# Planted - AI-Powered Dating App for Plant-Based Singles 🌱

@flow/setup
You are a world-class full-stack AI developer. Your job is to help build a high-quality, design-faithful dating app called "Planted" based on the brand guidelines provided below. Follow modern best practices, TypeScript, Next.js, TailwindCSS, and component architecture. Output full-stack code with modular logic.

---

## Step 1: Understand Brand and Visual System

@flow/ask
Here’s the full brand and design system. Summarize the core UX/UI principles, and extract reusable design tokens (typography scale, colors, spacing, transitions, etc.) that can be used in the app’s theme.ts or tailwind.config.js.

[Insert brand guidelines here or attach images]

---

## Step 2: Recommend Tech Stack

@flow/ask
Given that this app includes onboarding, matching logic with expiry, real-time chat, admin dashboard, and high design fidelity, suggest the ideal stack across:
- Frontend framework
- Backend/API layer
- Real-time infra
- Authentication
- Database
- Admin panel

---

## Step 3: Generate Folder Structure

@flow/ask
Generate a complete folder structure to reflect:
- Modular components
- UI elements like forms/cards/buttons
- Pages and layouts (Home, Onboarding, Feed, Chat, Profile)
- API routes
- Utility and constants
- Feature directories (auth, match, message, settings)

---

## Step 4: Tailwind Theme Config

@flow/ask
Create a full `tailwind.config.ts` setup reflecting typography, colors, shadows, spacing, and animations from the brand system.

---

## Step 5: Fonts and Global Styles

@flow/ask
Generate the global CSS and font setup using:
- Instrument Serif for headings
- Inter for body/UI
Implement best practices for font loading with Fallbacks and CLS optimization.

---

## Step 6: Database Schema (Prisma or Drizzle)

@flow/ask
Define a relational schema for:
- User
- Profile
- Preferences
- Match
- Message
- Admin Flags
- Subscription Plans
- Session (auth/session handling)

Use PostgreSQL as the target database.

---

## Step 7: Onboarding Flow

@flow/ask
Generate the complete onboarding flow:
- Multi-step form (Name, Lifestyle, Preferences, Photos)
- Save progress to backend
- Add animation for each step with subtle transitions

---

## Step 8: Match Feed with Expiry

@flow/ask
Build a swipe-free match feed based on profile compatibility and user preferences.
- Match visibility lasts 72 hours unless actioned
- Real-time status if someone likes you back
- Show expiry countdown per card

---

## Step 9: Messaging System

@flow/ask
Create a real-time chat system between matched users using Supabase or Pusher.
- Typing indicator
- Delivered/read status
- Presence indicator
- Match must be mutual

---

## Step 10: Admin Dashboard

@flow/ask
Build an internal admin panel using Next.js or a separate sub-app for:
- Member verification
- Match metrics
- Manual moderation (flag, ban, feature)
- Early access onboarding

---

## Step 11: Premium Features

@flow/ask
Create Stripe-integrated purchase flow for:
- Match Boosting
- Expiry Extension
- Read Receipts
- Verified Badge

---

## Step 12: Deployment Plan

@flow/ask
Write a full deployment pipeline:
- Use Vercel for frontend
- Use Supabase or PlanetScale for DB
- Set up environment variables
- Secure endpoints
- Email/SMS verification with Resend/Twilio

---

## Step 13: SEO and Web Performance

@flow/ask
Create the Next.js SEO config and dynamic OG image generator based on profile name and image. Optimize for Core Web Vitals.

---

## Step 14: Dummy Data Injection

@flow/ask
Generate 10 high-quality fake profiles (diverse in background, gender, identity) with public domain or generated profile pictures, including user bios, preferences, and mock messages. Add logic to load these into the system for testing/demo.

---

@flow/run
