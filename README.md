# Hada

Your AI assistant that actually does things. Hada manages your calendar, drafts emails, books appointments, does research, and handles tasks - like having a brilliant executive assistant available 24/7.

## Quick Start

### Prerequisites

- Node.js 18+
- A Supabase account (free tier works)
- Railway account (for deployment)

### Local Development

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings > API to get your URL and anon key
   - Run the migration in `supabase/migrations/001_initial_schema.sql` via the SQL Editor
   - Enable Google OAuth in Authentication > Providers (optional)

3. Create `.env.local`:
   ```bash
   cp .env.local.example .env.local
   # Edit with your Supabase credentials
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

### Deploy to Railway

1. Push to GitHub
2. Create a new project in Railway
3. Connect your GitHub repo
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── auth/           # Authentication pages
│   ├── chat/           # Main chat interface
│   └── page.tsx        # Landing page
├── components/ui/      # shadcn/ui components
├── lib/
│   ├── supabase/       # Supabase client utilities
│   └── types/          # TypeScript type definitions
supabase/
└── migrations/         # Database migrations
```

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Animations:** Framer Motion
- **Deployment:** Railway

## Roadmap

- [ ] Phase 1: Foundation (current)
- [ ] Phase 2: OpenClaw Integration
- [ ] Phase 3: Core Integrations (Calendar, Email)
- [ ] Phase 4: Polish & Beta
- [ ] Phase 5: Monetization
- [ ] Phase 6: Scale
- [ ] Phase 7: Skills Platform
