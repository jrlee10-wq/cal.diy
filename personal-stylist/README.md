# Atelier — Personal Stylist

Your own personal tastemaker. Atelier brings clothing recommendations **to you** —
tuned to your sizes, taste, budget, and the season — so you don't have to shop.
Ask it to style a moment ("traveling to Paris in April", "client on-site next week")
and it builds a capsule for it. Connect Gmail and it learns from what you've already
bought.

Built as a mobile-first PWA with Next.js, Claude, and Prisma/Postgres.

## Features

- **Style profile** — sizes, style tags, colors, dislikes, and a budget that acts as a
  hard price filter on every recommendation.
- **Recommendation feed** — Claude curates seasonal picks from your profile; save or
  dismiss, filter by category and max price. Every item links out to shop it.
- **Scenario requests** — describe a trip or occasion and get a cohesive capsule
  (Claude parses destination/weather/formality, then builds the set).
- **Email scanning** — read-only Gmail access parses order-confirmation emails into a
  "closet" of past purchases, which feeds back into recommendations. Runs on demand and
  on a daily cron.

## Tech stack

- **Next.js 16** (App Router) + **React 19**, mobile-first **PWA**
- **Tailwind CSS v4**
- **Prisma 6 + PostgreSQL**
- **Auth.js (NextAuth v5)** with Google OAuth (login + `gmail.readonly`)
- **Anthropic Claude** (`@anthropic-ai/sdk`) with tool-use structured output
- Optional **SerpApi** Google Shopping enrichment (real product, price, image)

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (Neon / Vercel Postgres / Supabase / local) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth Web client |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `CRON_SECRET` | Any random string (guards the daily scan endpoint) |
| `SERPAPI_KEY` | _Optional_ — enrich items with real products |

**Google OAuth setup** (Google Cloud Console):

1. Create an OAuth client → *Web application*.
2. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (and your
   production equivalent).
3. Enable the **Gmail API** for the project.
4. On the OAuth consent screen add the scope
   `https://www.googleapis.com/auth/gmail.readonly`. While in "Testing" mode, add
   yourself as a test user — no Google verification needed for personal use.

### 3. Create the database schema

```bash
npm run db:push        # or: npm run db:migrate
```

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000, sign in with Google, complete onboarding, and tap
**Bring me new picks**.

## How it works

```
app/
  actions.ts              server actions (save profile, generate, scan, status)
  (app)/                  authenticated shell: feed, scenario, purchases, settings
  onboarding/ login/      profile wizard + Google sign-in
  api/
    auth/[...nextauth]/   Auth.js handlers
    cron/scan-email/      daily inbox scan (Bearer CRON_SECRET)
lib/
  ai/                     Claude client, Zod output schemas, prompt builders
  stylist/                RecommendationService, ScenarioService, shopping links
  email/                  GmailClient (REST), PurchaseExtractionService
  db.ts / session.ts      Prisma client, auth guards
components/               UI primitives + feature components
prisma/schema.prisma      Auth.js + stylist domain models
```

Claude is always called with **tool-use structured output** (`lib/ai/client.ts`), so
responses are schema-validated JSON. Item shopping links are built server-side from the
model's search query (Google Shopping search by default; a specific product when SerpApi
is configured), so links are always valid.

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add all `.env` variables in the Vercel project settings.
3. Set the Google OAuth redirect URI to
   `https://<your-domain>/api/auth/callback/google`.
4. `vercel.json` registers a daily cron (`08:00 UTC`) hitting `/api/cron/scan-email`;
   Vercel automatically sends `Authorization: Bearer $CRON_SECRET`.
5. `postinstall` runs `prisma generate`; run `npm run db:push` once against the
   production database.

## Roadmap (next)

- Web-push + weekly email delivery of fresh recommendations (infra is PWA-ready).
- Per-category budgets in the UI (the data model already supports them).
- Curated product cards beyond search links (expand SerpApi usage).

## Notes

- The app is single-user friendly out of the box; every query is scoped by the
  signed-in user.
- Gmail access is **read-only** and limited to order-confirmation emails.
