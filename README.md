# Hada

Hada is an assistant application built around a local agent loop. It supports web chat, Telegram, long-term memory, scheduled tasks, live trace streaming, multi-step planning, specialist sub-agent delegation, and a dashboard control plane.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Supabase Auth + Postgres + RLS
- Built-in agent loop in `src/lib/chat/agent-loop.ts`
- Registry-backed tools in `src/lib/chat/tools/`
- Shared orchestration pipeline in `src/lib/chat/process-message.ts`
- Multi-provider LLM support in `src/lib/chat/providers.ts`

## What’s Implemented

- Persistent per-user conversation history
- Inline chat execution traces with tool calls, reasoning, and latencies
- Multi-step task planning via `plan_task`
- Specialist delegation via `delegate_task`
- Long-term memory via `user_memories`
- Web tools: `web_search`, `web_fetch`
- Google Calendar tools
- Scheduled one-time and recurring tasks
- Telegram integration with account linking
- Dashboard at `/dashboard` for activity, analytics, memories, and tasks

## Quick Start

### Prerequisites

- Node.js 20.9+
- Supabase project
- At least one supported LLM API key

### Install

```bash
npm install
```

### Configure environment

```bash
cp .env.local.example .env.local
```

Required values:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `LLM_PROVIDER`
- matching provider API key, for example `MINIMAX_API_KEY`

Common optional values:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_BOT_USERNAME`
- `SEARCH_PROVIDER`
- `SEARCH_API_KEY`
- `CRON_SECRET`

### Database setup

Run these migrations in Supabase SQL Editor:

- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_add_user_permissions.sql`
- `supabase/migrations/004_agent_and_telegram.sql`
- `supabase/migrations/005_agent_runs.sql`

### Run locally

```bash
npm run dev
```

Open:
- `http://localhost:3000/chat`
- `http://localhost:3000/dashboard`

## Verification

```bash
npm run lint
npm run build
```

## Important Paths

- `src/app/api/chat/route.ts` - web chat SSE API
- `src/app/api/tools/route.ts` - tool manifest introspection
- `src/app/api/dashboard/` - dashboard APIs
- `src/app/api/webhooks/telegram/route.ts` - Telegram webhook
- `src/app/api/cron/route.ts` - scheduled task runner
- `src/app/chat/page.tsx` - chat UI
- `src/app/dashboard/page.tsx` - dashboard UI
- `src/lib/chat/agent-loop.ts` - core runtime loop
- `src/lib/chat/process-message.ts` - orchestration + telemetry
- `src/lib/chat/tools/` - tool implementations
- `src/lib/chat/agents/` - sub-agent profiles
- `src/components/chat/agent-trace.tsx` - trace/delegation UI
- `src/components/chat/task-plan-card.tsx` - plan UI
- `docs/IMPLEMENTATION_PLAN.md` - implementation record
- `docs/ARCHITECTURE.md` - architecture overview
- `docs/DATABASE.md` - schema overview

## Notes

- Dashboard task `Run now` is intentionally guarded until immediate execution is wired through the scheduler path.
- Next.js currently emits a `middleware` → `proxy` deprecation warning during build; the app still builds successfully.
