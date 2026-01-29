-- Hada Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  avatar_url text,
  tier text not null default 'free' check (tier in ('free', 'paid', 'pro')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Conversations table
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages table
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Integrations table (for Google, Microsoft OAuth tokens)
create table public.integrations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  provider text not null check (provider in ('google', 'microsoft')),
  access_token text not null,
  refresh_token text not null,
  expires_at timestamp with time zone not null,
  scopes text[] not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, provider)
);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.integrations enable row level security;

-- Users policies
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- Conversations policies
create policy "Users can view own conversations" on public.conversations
  for select using (auth.uid() = user_id);

create policy "Users can create conversations" on public.conversations
  for insert with check (auth.uid() = user_id);

create policy "Users can update own conversations" on public.conversations
  for update using (auth.uid() = user_id);

create policy "Users can delete own conversations" on public.conversations
  for delete using (auth.uid() = user_id);

-- Messages policies
create policy "Users can view messages in own conversations" on public.messages
  for select using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

create policy "Users can create messages in own conversations" on public.messages
  for insert with check (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

-- Integrations policies
create policy "Users can view own integrations" on public.integrations
  for select using (auth.uid() = user_id);

create policy "Users can create own integrations" on public.integrations
  for insert with check (auth.uid() = user_id);

create policy "Users can update own integrations" on public.integrations
  for update using (auth.uid() = user_id);

create policy "Users can delete own integrations" on public.integrations
  for delete using (auth.uid() = user_id);

-- Function to automatically create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create user profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_users_updated_at
  before update on public.users
  for each row execute procedure public.update_updated_at();

create trigger update_conversations_updated_at
  before update on public.conversations
  for each row execute procedure public.update_updated_at();

create trigger update_integrations_updated_at
  before update on public.integrations
  for each row execute procedure public.update_updated_at();

-- Indexes for performance
create index idx_conversations_user_id on public.conversations(user_id);
create index idx_messages_conversation_id on public.messages(conversation_id);
create index idx_messages_created_at on public.messages(created_at);
create index idx_integrations_user_id on public.integrations(user_id);
