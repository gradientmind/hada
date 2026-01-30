-- Add permissions column to users table for configurable action permissions
-- This allows users to control whether actions require confirmation or execute directly

alter table public.users
  add column permissions jsonb default '{
    "google_calendar_read": "direct",
    "google_calendar_write": "confirm",
    "google_gmail_read": "direct",
    "google_gmail_send": "confirm"
  }'::jsonb;

-- Add comment explaining the structure
comment on column public.users.permissions is 'User action permissions. Keys are permission names, values are "direct" (execute immediately) or "confirm" (require user confirmation).';
