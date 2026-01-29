# Database Schema

## Overview

Hada uses PostgreSQL via Supabase. All tables have Row Level Security (RLS) enabled, ensuring users can only access their own data.

## Entity Relationship Diagram

```
┌──────────────────┐
│   auth.users     │  (Supabase managed)
│──────────────────│
│ id               │
│ email            │
│ created_at       │
└────────┬─────────┘
         │
         │ 1:1 (auto-created via trigger)
         ▼
┌──────────────────┐       ┌──────────────────┐
│     users        │       │   integrations   │
│──────────────────│       │──────────────────│
│ id (FK)          │◄──────│ user_id (FK)     │
│ email            │  1:N  │ provider         │
│ name             │       │ access_token     │
│ avatar_url       │       │ refresh_token    │
│ tier             │       │ expires_at       │
│ created_at       │       │ scopes           │
│ updated_at       │       └──────────────────┘
└────────┬─────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐
│  conversations   │
│──────────────────│
│ id               │
│ user_id (FK)     │
│ title            │
│ created_at       │
│ updated_at       │
└────────┬─────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐
│    messages      │
│──────────────────│
│ id               │
│ conversation_id  │
│ role             │
│ content          │
│ metadata         │
│ created_at       │
└──────────────────┘
```

## Tables

### users

Extends Supabase auth.users with application-specific data.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, references auth.users |
| email | text | User's email address |
| name | text | Display name (nullable) |
| avatar_url | text | Profile picture URL (nullable) |
| tier | text | Subscription tier: 'free', 'paid', 'pro' |
| created_at | timestamptz | Account creation time |
| updated_at | timestamptz | Last profile update |

**RLS Policies:**
- Users can view their own profile
- Users can update their own profile

### conversations

Chat threads between user and assistant.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Owner of conversation |
| title | text | Auto-generated or user-set title (nullable) |
| created_at | timestamptz | Thread creation time |
| updated_at | timestamptz | Last message time |

**RLS Policies:**
- Users can CRUD their own conversations

### messages

Individual messages within conversations.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| conversation_id | uuid | Parent conversation |
| role | text | 'user' or 'assistant' |
| content | text | Message text |
| metadata | jsonb | Additional data (nullable) |
| created_at | timestamptz | Message timestamp |

**Metadata Examples:**
```json
// Calendar action
{
  "type": "calendar_event",
  "event_id": "abc123",
  "action": "created"
}

// Email action
{
  "type": "email",
  "message_id": "xyz789",
  "action": "sent"
}

// Tool use
{
  "type": "tool_call",
  "tool": "web_search",
  "query": "best restaurants nearby"
}
```

**RLS Policies:**
- Users can view/create messages in their own conversations

### integrations

OAuth tokens for third-party services.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Token owner |
| provider | text | 'google' or 'microsoft' |
| access_token | text | OAuth access token |
| refresh_token | text | OAuth refresh token |
| expires_at | timestamptz | Token expiration |
| scopes | text[] | Granted OAuth scopes |
| created_at | timestamptz | Connection time |
| updated_at | timestamptz | Last token refresh |

**RLS Policies:**
- Users can CRUD their own integrations

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_integrations_user_id ON integrations(user_id);
```

## Triggers

### on_auth_user_created

Automatically creates a user profile when someone signs up.

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

### update_*_updated_at

Automatically updates `updated_at` timestamp on row changes.

```sql
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
```

## Common Queries

### Get user's conversations with latest message

```sql
SELECT
  c.*,
  m.content as last_message,
  m.created_at as last_message_at
FROM conversations c
LEFT JOIN LATERAL (
  SELECT content, created_at
  FROM messages
  WHERE conversation_id = c.id
  ORDER BY created_at DESC
  LIMIT 1
) m ON true
WHERE c.user_id = auth.uid()
ORDER BY c.updated_at DESC;
```

### Get conversation with messages

```sql
SELECT
  c.*,
  json_agg(
    json_build_object(
      'id', m.id,
      'role', m.role,
      'content', m.content,
      'created_at', m.created_at
    ) ORDER BY m.created_at
  ) as messages
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE c.id = $1 AND c.user_id = auth.uid()
GROUP BY c.id;
```

### Check user's active integrations

```sql
SELECT provider, scopes, expires_at
FROM integrations
WHERE user_id = auth.uid()
  AND expires_at > now();
```

## TypeScript Types

See `src/lib/types/database.ts` for TypeScript definitions matching this schema.

```typescript
export type UserTier = "free" | "paid" | "pro";

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  tier: UserTier;
  created_at: string;
  updated_at: string;
}

// ... etc
```

## Migration Notes

Migrations are stored in `supabase/migrations/` and should be run via the Supabase SQL Editor.

**Naming convention:** `NNN_description.sql` (e.g., `001_initial_schema.sql`)

**To add a new migration:**

1. Create new file: `supabase/migrations/002_add_feature.sql`
2. Write SQL with rollback comments
3. Test in development project first
4. Run in production via SQL Editor
5. Update TypeScript types to match
