# Immigrateiq — Site Map & Documentation

> Complete reference for routes, components, design, and architecture. Use this for consistent updates and onboarding.

---

## 1. Routes & Pages

| Route | File | Purpose |
|-------|------|---------|
| `/` | `src/app/page.tsx` | **Homepage** — Hero, features, testimonials, pricing, FAQ, CTAs |
| `/auth` | `src/app/auth/page.tsx` | **Auth** — Sign in / sign up (AuthForm) |
| `/dashboard` | `src/app/(app)/dashboard/page.tsx` | **Dashboard** — CRS score chart, eligibility pie, recent draws table |
| `/draw-tracker` | `src/app/(app)/draw-tracker/page.tsx` | **Draw Tracker** — Server-fetched Airtable draws, filters (province, category) |
| `/chatbot` | `src/app/(app)/chatbot/page.tsx` | **AI Tools** — Tabs: AI Chatbot, CRS Calculator, NOC Finder |
| `/faq` | `src/app/(app)/faq/page.tsx` | **FAQ** — Searchable accordion of immigration FAQs |
| `/profile` | `src/app/(app)/profile/page.tsx` | **Profile** — User profile form, subscription, payment history |

### Layouts
| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout — metadata, AuthProvider, Toaster, Inter font, dark mode |
| `src/app/(app)/layout.tsx` | App layout — Sidebar nav, header, auth-gated shell |

---

## 2. Components

### Page-Level Components
| Component | File | Purpose |
|-----------|------|---------|
| `AuthForm` | `src/components/auth-form.tsx` | Sign in / sign up form with Firebase |
| `ChatInterface` | `src/components/chat-interface.tsx` | AI chatbot UI |
| `CrsCalculator` | `src/components/crs-calculator.tsx` | CRS score calculator |
| `NocFinder` | `src/components/noc-finder.tsx` | NOC code lookup |
| `DrawTrackerClient` | `src/components/draw-tracker-client.tsx` | Draw tracker table + filters |
| `Footer` | `src/components/footer.tsx` | Site footer — About, Pricing, FAQ links |
| `TypedText` | `src/components/typed-text.tsx` | Typing animation for hero search placeholder |
| `PremiumContent` | `src/components/premium-content.tsx` | Wraps premium features (paywall) |
| `ParticleBackground` | `src/components/particle-background.tsx` | Particle effects (tsparticles) |
| `Icons` | `src/components/icons.tsx` | Custom icon set |

### UI Components (shadcn/ui)
Located in `src/components/ui/`:
- `accordion`, `alert`, `alert-dialog`, `avatar`, `badge`, `button`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `dialog`, `dropdown-menu`, `form`, `input`, `label`, `menubar`, `popover`, `progress`, `radio-group`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `switch`, `table`, `tabs`, `textarea`, `toast`, `toaster`, `tooltip`

---

## 3. Design System

### Theme
- **Mode**: Dark by default (`html className='dark'`)
- **Font**: Inter (`font-body`, `font-headline`)

### Colors (from `src/app/globals.css`)
| Token | Light | Dark |
|-------|-------|------|
| `background` | White | Deep black |
| `foreground` | Near black | White |
| `primary` | Dark | White |
| `muted` | Light gray | Dark gray |
| `sidebar-*` | Sidebar palette | Sidebar palette |

### Typography
- **Hero heading**: `text-4xl` → `text-7xl`, `font-extrabold`
- **Section headings**: `text-2xl font-bold`
- **Body**: `text-base sm:text-lg`, `text-foreground/85` or `text-foreground/80`

### Layout
- Page padding: `px-[5%]`
- Max width: `max-w-7xl mx-auto`
- Vertical gutters: `py-20` for sections

### Animations (from `tailwind.config.ts` & `globals.css`)
- `animate-fade-in-up` — fade + slide up
- `animation-delay-3000`, `3500`, `4000`, `4500` — staggered delays
- `animate-underline-draw` — underline draw on load (hero keyword)
- `animate-blink-caret` — typing cursor

---

## 4. Homepage Sections (src/app/page.tsx)

| Section | ID | Content |
|---------|-----|---------|
| Hero | — | Heading, subtitle, TypedText search box |
| Why choose our app | `#why-us` | Feature list (eligibility, draw tracker, NOC, etc.) |
| How It Works | `#features` | 4 feature cards (Eligibility, Draw Tracker, NOC Finder, AI Assistant) |
| Social Proof | `#social-proof` | Testimonials |
| CTA | `#cta` | "Ready to take the next step?" + Get Started |
| Pricing | `#pricing` | Free vs Premium cards |
| About | `#about` | Mission statement |
| FAQ | `#faq` | Accordion (legal, consultant, differentiator) |
| Final CTA | `#final-cta` | "Start your PR journey today" |

---

## 5. Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useAuth` | `src/hooks/use-auth.tsx` | Firebase auth state, `withAuth` HOC |
| `useToast` | `src/hooks/use-toast.ts` | Toast notifications |
| `useMobile` | `src/hooks/use-mobile.tsx` | Mobile breakpoint detection |

---

## 6. Lib & Services

| File | Purpose |
|------|---------|
| `src/lib/utils.ts` | `cn()` — class name merger |
| `src/lib/firebase.ts` | Firebase app, Firestore |
| `src/lib/auth.ts` | `handleSignOut`, `handleProfileUpdate`, `resendVerificationEmail` |
| `src/lib/stripe.ts` | `getCheckoutUrl`, `getPortalUrl` |
| `src/lib/airtable.ts` | `getAirtableDraws`, `getUniqueFieldValues` |
| `src/lib/pinecone.ts` | Pinecone client |
| `src/lib/actions.ts` | Server actions |
| `src/lib/data/crs-instructions.ts` | CRS calculation instructions |
| `src/lib/placeholder-images.json` | Placeholder image URLs |

---

## 7. AI (Genkit)

| File | Purpose |
|------|---------|
| `src/ai/genkit.ts` | Genkit config |
| `src/ai/dev.ts` | Dev server entry |
| `src/ai/flows/immigration-chatbot.ts` | Immigration Q&A flow |
| `src/ai/flows/crs-calculator-chatbot.ts` | CRS calculator flow |
| `src/ai/flows/noc-finder-chatbot.ts` | NOC finder flow |
| `src/ai/flows/search-term-extractor.ts` | Search term extraction |
| `src/ai/tools/noc-lookup.ts` | NOC lookup tool |

---

## 8. API Routes

| Route | File | Purpose |
|-------|------|---------|
| `/api/stripe-webhooks` | `src/app/api/stripe-webhooks/route.ts` | Stripe webhook handler |

---

## 9. Config Files

| File | Purpose |
|------|---------|
| `tailwind.config.ts` | Tailwind theme, colors, keyframes, animations |
| `src/app/globals.css` | CSS variables (light/dark), base styles, utilities |

---

## 10. Quick Reference for Updates

- **Change hero text**: `src/app/page.tsx` — Hero section
- **Change features list**: `src/app/page.tsx` — `features`, `featureCards`
- **Change FAQ content**: `src/app/page.tsx` — `faqData`; app FAQ: `src/app/(app)/faq/page.tsx` — `faqData`
- **Change colors**: `src/app/globals.css` — `:root`, `.dark`
- **Add animation**: `tailwind.config.ts` — `keyframes`, `animation`
- **Add nav item**: `src/app/(app)/layout.tsx` — `navItems`
- **Change sidebar branding**: `src/app/(app)/layout.tsx` — SidebarHeader
