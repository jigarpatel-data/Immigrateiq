# Immigrateiq

A Next.js web app that helps users explore Canadian immigration pathways. It combines real-time draw data, AI-powered guidance, CRS scoring, NOC lookup, and subscription billing.

**Tagline:** Simplifying Immigration for Canada.

---

## What This App Does

- **Eligibility & scoring** — CRS score calculator and eligibility-style overview (sample data on Dashboard).
- **Draw tracker** — Browse immigration draws with filters (Province, Category, search). Data comes from Airtable.
- **AI tools** — Chatbot for immigration questions, CRS calculator (with breakdown), and NOC finder. Uses Genkit AI with optional Pinecone.
- **Account & billing** — Sign up / sign in (Firebase Auth, including Google), profile, and premium subscription via Stripe (checkout + customer portal).

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Auth & DB:** Firebase (Auth, Firestore)
- **Payments:** Stripe (Firebase Stripe extension for checkout/portal)
- **Data:** Airtable (draw tracker), Pinecone (optional for AI)
- **AI:** Genkit (Google AI), with flows for immigration chatbot, CRS calculator, NOC finder, search-term extraction

---

## Pages & Routes

| Route | Description | Auth |
|-------|-------------|------|
| `/` | **Home** — Landing with features, pricing, FAQ, CTA. Checkout button (redirects to `/auth` if not signed in). | Public |
| `/auth` | **Sign In / Sign Up** — Email/password and Google sign-in, password reset. Supports `?redirect_to=checkout`. | Public |
| `/dashboard` | **Dashboard** — CRS-style summary cards, CRS trend chart, program eligibility pie chart, recent draws table. Uses **static/sample data** (not live). | Sidebar hidden when logged out; page itself does not require login |
| `/draw-tracker` | **Draw Tracker** — Paginated list of draws from Airtable with filters (Province, Category, search). Links to official draw URLs. | Same as Dashboard |
| `/chatbot` | **AI Assistant** — Three tabs: **AI Chatbot**, **CRS Calculator**, **NOC Finder**. Wrapped in premium upsell; requires sign-in. | **Requires login** (`withAuth`) |
| `/faq` | **FAQ** — Searchable accordion of immigration FAQs (Express Entry, CRS, PNP, job offer, language, processing times). | **Requires login** (`withAuth`) |
| `/profile` | **Profile** — Display name/email, edit profile, subscription status, “Upgrade” (checkout) and “Manage billing” (Stripe portal). | **Requires login** (`withAuth`) |

---

## Navigation & “Hidden” Areas

- **Sidebar** (when logged in): Dashboard, Draw Tracker, AI Assistant, FAQ. Profile is **not** in the sidebar list (`hidden: true` in `navItems`) but is reachable via:
  - Header avatar link
  - Sidebar footer user block
- **Profile** is the only route that exists but is intentionally omitted from the main nav list; it’s still a normal page.
- **CRS Calculator** and **NOC Finder** are not separate routes; they are tabs on the **AI Assistant** page (`/chatbot`).

---

## Data & Content Notes

- **Dashboard** — All numbers and charts are **hardcoded** (e.g. `chartData`, `recentDraws`, `eligibilityData`). No live CRS or draw data here.
- **Draw Tracker** — Uses **live** Airtable data (`getAirtableDraws`, `getUniqueFieldValues`). Server-only via `'use server'` in `src/lib/airtable.ts`.
- **Home FAQ** — Uses a small inline `faqData` on the landing page (legal disclaimer, consultant, “what makes this different”).
- **App FAQ** (`/faq`) — Separate, longer `faqData` (Express Entry, CRS, PNP, job offer, language, processing times).
- **Images** — Home page uses `src/lib/placeholder-images.json` for feature/placeholder images.

---

## Unused or Minor Items

- **`GraduationCap`** — Imported in `src/app/(app)/layout.tsx` but not used in the sidebar (Profile uses `User`). Safe to remove from imports if desired.
- No other orphaned pages or routes were found; all listed routes are used.

---

## Getting Started

1. **Env** — Add a `.env.local` (see `.gitignore`; never commit real keys). Typical vars:
   - Firebase: `NEXT_PUBLIC_FIREBASE_*` (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).
   - Airtable: `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, optional `AIRTABLE_TABLE_NAME`.
   - Stripe: `NEXT_PUBLIC_STRIPE_PRICE_ID`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (for webhooks).
   - Optional (AI): `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`, `PINECONE_HOST_URL`, plus any Genkit/Google AI config.
2. **Install & run**
   - `npm install`
   - `npm run dev` — Next.js app
   - (Optional) `npm run genkit:dev` — Genkit AI dev server
3. **Entry point** — Main landing is `src/app/page.tsx`; app shell and sidebar live under `src/app/(app)/layout.tsx`.

---

## Summary

- **App:** Canadian immigration helper (draws, CRS, NOC, AI chatbot, billing).
- **Pages:** Home, Auth, Dashboard (sample data), Draw Tracker (Airtable), Chatbot (3 tabs), FAQ, Profile.
- **Hidden from nav:** Profile (linked via avatar/footer only).
- **Static vs live:** Dashboard = sample; Draw Tracker = live Airtable.
- **Auth:** Chatbot, FAQ, Profile require login; Dashboard and Draw Tracker do not (sidebar hides when logged out).
