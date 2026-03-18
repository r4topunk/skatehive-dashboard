# SkateHive Admin Dashboard

Local dashboard for monitoring and managing SkateHive user accounts. Connects to Supabase to display users, identities, sponsorships, and on-chain activity.

## Features

**Account Tier System**
- **Full** — Users with their own Hive blockchain account
- **EVM** — Wallet-connected users without a Hive account
- **Lite** — Email-only users posting via the shared `@skateuser` account

**Users Management**
- Interactive table with search (handle, name, email, address), tier filters, and sort (newest, last active, most engaged)
- User detail page with profile, linked identities, sessions, auth methods, posts, and votes
- Sponsorship candidate detection — highlights active Lite/EVM users eligible for upgrade

**Sponsorship Pipeline**
- Status tracking (pending, processing, completed, failed)
- Sponsor leaderboard
- Cost tracking in HIVE
- TX links to HiveHub

**Activity Monitoring**
- Soft posts and votes with broadcast status
- Per-user engagement metrics (posts/votes count)
- Links to PeakD for on-chain content

## Stack

- **Next.js 16** (App Router, RSC, Turbopack)
- **Tailwind CSS 4** + **shadcn/ui** (radix-lyra preset, stone base)
- **Supabase** REST API (direct fetch, no SDK)
- **Bricolage Grotesque** + **DM Sans** + **JetBrains Mono**

## Setup

```bash
git clone https://github.com/r4topunk/skatehive-dashboard.git
cd skatehive-dashboard
pnpm install
```

Copy the environment file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=sb_secret_your_secret_key_here
```

> The secret key is used server-side only to bypass RLS and read all tables.

```bash
pnpm dev
```

## Database Schema

The dashboard reads from these Supabase tables:

| Table | Purpose |
|-------|---------|
| `userbase_users` | User profiles (handle, display name, status, onboarding step) |
| `userbase_identities` | Linked identities (EVM wallets, Hive accounts) |
| `userbase_auth_methods` | Login methods and email addresses |
| `userbase_sessions` | Active and expired sessions |
| `userbase_hive_keys` | Encrypted posting keys for sponsored accounts |
| `userbase_sponsorships` | Hive account sponsorship records |
| `userbase_soft_posts` | Posts pending or broadcasted to Hive |
| `userbase_soft_votes` | Votes pending or broadcasted to Hive |
| `userbase_magic_links` | Magic link tokens for email login |
| `userbase_identity_challenges` | Verification challenges (nonce/signature) |

## Routes

| Route | Description |
|-------|-------------|
| `/` | Overview — tier breakdown, sponsorship pipeline, recent signups, candidates |
| `/users` | All users with search, filters, sort, and email |
| `/users/[id]` | User detail — profile, identities, sessions, posts, votes, auth |
| `/sponsorships` | Sponsorship status cards, table, leaderboard, candidates |
| `/activity` | Soft posts and votes with status tracking |
