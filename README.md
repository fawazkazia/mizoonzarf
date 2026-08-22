# Maison Luxe — Premium Fashion E-Commerce

A production-grade fashion storefront covering Men's, Women's and Kids' fashion & garments,
Perfumes, Fashion Jewellery and Accessories — built with Next.js 16 (App Router), TypeScript,
Tailwind CSS v4, PostgreSQL and Prisma.

This is **Phase 1** of a 5-phase build (see [Project Phases](#project-phases) below): the
architecture, full database schema, and the complete customer-facing storefront. Nothing is
faked — every button either works end-to-end against the real database, or is visibly
labeled "Coming Soon" with the integration point already scaffolded (payments beyond Cash on
Delivery, WhatsApp/SMS/Email sending, the generative AI assistant, loyalty/referrals).

## Quick Start

```bash
npm install

# Local database — spins up a disposable local Postgres and prints a DATABASE_URL
npx prisma dev

# Copy env template and fill in the DATABASE_URL from the command above (plus AUTH_SECRET)
cp .env.example .env

npx prisma migrate dev --name init
npm run db:seed

npm run dev
```

Open http://localhost:3000. The seed script populates ~50 realistic products across every
category, hero banners, an active flash sale, two coupons (`WELCOME10`, `SAVE50`), and
homepage section ordering.

> **Local dev database note:** `npx prisma dev` runs a lightweight, disposable Postgres
> instance for local development — convenient, but it can occasionally drop its listening
> port after being idle. If pages start returning 500s referencing a Prisma connection
> error, run `npx prisma dev` again (or `npx prisma dev start default`) to bring it back;
> your data persists. This does not affect a real hosted Postgres (Neon/Supabase/RDS) in
> production.

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** for styling, `next/font` for self-hosted fonts (Cormorant Garamond + Manrope)
- **PostgreSQL** + **Prisma ORM** (the new TS-native `prisma-client` generator with the `pg` driver adapter)
- **Auth.js (NextAuth v5)** — credentials auth with bcrypt-hashed passwords, JWT sessions, guest checkout supported
- **Zustand** for client cart/wishlist state, **Zod** for input validation, **sonner** for toasts

## Environment Variables

See [`.env.example`](.env.example) for the full list with comments. The required set for
Phase 1 is just:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET` | Session signing secret (`npx auth secret` to generate one) |
| `NEXT_PUBLIC_SITE_URL` | Used for canonical URLs, sitemap, JSON-LD |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Fallback WhatsApp number until it's set via the `Setting` table |

Everything under the "PHASE 3/4" sections of `.env.example` (payment gateways, WhatsApp/SMS/Email
providers, AI) is optional — the app runs correctly without any of them, with the
corresponding features shown as disabled/"Coming Soon" in the UI.

## Project Structure

```
prisma/schema.prisma      Full data model (see below)
prisma/seed.ts             Demo data generator
src/app/(storefront)/      Public pages: home, category, product, cart, checkout, account...
src/app/(auth)/            Login / register
src/app/api/                Route handlers: cart, checkout, wishlist, reviews, search, auth...
src/components/             UI organized by domain (layout, home, product, cart, account, ui)
src/lib/                    Business logic: db client, auth config, settings reader,
                            cart pricing, and the payment/notification/AI service interfaces
src/stores/                 Zustand stores (cart, wishlist, filter drawer)
```

### Service Abstractions (Important)

Three areas are built as **swappable interfaces**, not hard-coded to one vendor:

- **`src/lib/payments/`** — `PaymentProvider` interface. `CashOnDeliveryProvider` is the only
  live implementation; add a new file (`stripe.ts`, `telr.ts`, ...) implementing the same
  interface and register it in `registry.ts` to enable a new gateway. Card details are never
  meant to touch this server — real implementations should use the provider's hosted/tokenized
  checkout.
- **`src/lib/notifications/`** — `NotificationProvider` interface, one per channel
  (Email/SMS/WhatsApp). `ConsoleNotificationProvider` logs to the server console today;
  swap in Resend/Twilio/WhatsApp Business API in `registry.ts` when ready.
- **`src/lib/ai/`** — `AIProvider` interface with an Anthropic-backed implementation stubbed
  in, ready for Phase 4's generative Style Assistant. Nothing calls it yet — the "Find Your
  Style" homepage section is a real, fully-working **rule-based** product filter, not a
  generative one, so it works today without any AI key.

## Database Schema

`prisma/schema.prisma` models the full entity set from the product spec up front — Users,
Catalog (Category/Brand/Collection/Product/ProductVariant/ProductImage), Cart, Orders
(Order/OrderItem/Payment/Shipment/OrderStatusHistory/Return), Marketing (Coupon/Promotion/
Banner/HomepageSection/NewsletterSubscriber), Setting (the CMS config store), AuditLog, and
Phase 5's Loyalty/Referral/NotificationTemplate tables — so later phases don't require
breaking migrations. Tables not yet backed by UI are noted with a comment in the schema.

## Product Images

There is no real photography or cloud storage in Phase 1. Every image is an elegant,
deterministic placeholder — a generated SVG (`/api/art?seed=...`) with a curated
premium color palette and typographic monogram, derived from the product/category name. The
`imageUrl` fields in the database are ordinary URLs, so swapping in real photography (S3/
Cloudinary) later is a data change, not a code change — see `src/lib/placeholder-art.ts`.

## What's Live vs. What's Scaffolded

**Fully working today:** browsing, mega-menu navigation, search with autocomplete, category
filters/sorting, product pages with variants/reviews, cart, coupons, guest + account
checkout with Cash on Delivery, order history with a status timeline, wishlist, saved
addresses, newsletter signup, a contact form, and the rule-based Style Finder.

**Scaffolded, not yet live** (see [Project Phases](#project-phases)):

| Feature | Status |
|---|---|
| Admin dashboard / CMS editor | Not built — Phase 2 |
| Card / Apple Pay / Google Pay / Tabby / Tamara | UI shows "Coming Soon"; interface ready — Phase 3 |
| Real WhatsApp / SMS / Email delivery | Logs to console; interface ready — Phase 3 |
| Generative AI Style Assistant, AI marketing tools | Interface stubbed, unused — Phase 4 |
| Analytics dashboards, loyalty points, referrals | Schema only, no UI — Phase 5 |

## Deployment

1. Provision a managed Postgres database (Neon, Supabase, RDS, etc.) and set `DATABASE_URL`.
2. Deploy to Vercel (or any Node host): `npm run build && npm start`.
3. Run `npx prisma migrate deploy` against the production database before first boot.
4. Set `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, and `NEXT_PUBLIC_WHATSAPP_NUMBER` in your host's
   environment variables.
5. Seed demo data only in non-production environments (`npm run db:seed` is destructive — it
   clears existing rows first).

## Project Phases

1. **Phase 1 (this build):** Architecture, database schema, core storefront.
2. **Phase 2:** Admin dashboard — product/order/customer management, CMS website builder, bulk import/export.
3. **Phase 3:** Real payment gateways, shipping/tracking integrations, live WhatsApp/SMS/Email.
4. **Phase 4:** Generative AI Style Assistant, AI-assisted marketing and banner generation.
5. **Phase 5:** Analytics dashboards, loyalty program, referrals, advanced promotions.
