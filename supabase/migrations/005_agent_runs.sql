create table if not exists public.agent_runs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  conversation_id uuid references public.conversations(id) on delete set null,
  source text not null default 'web' check (source in ('web', 'telegram', 'scheduled')),
  status text not null default 'running' check (status in ('running', 'completed', 'failed', 'timeout')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms integer,
  input_preview text,
  output_preview text,
  tool_calls jsonb not null default '[]'::jsonb,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_runs_user
  on public.agent_runs(user_id, started_at desc);

create index if not exists idx_agent_runs_status
  on public.agent_runs(user_id, status)
  where status = 'running';

alter table public.agent_runs enable row level security;

create policy "Users can view own agent runs"
  on public.agent_runs
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own agent runs"
  on public.agent_runs
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own agent runs"
  on public.agent_runs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
