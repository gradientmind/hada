# Conversation Persistence & Session Management

## Overview

Add message persistence to Supabase and proper session management for OpenClaw gateway. Single continuous conversation per user (WhatsApp/Telegram style).

## Design Decisions

- **Single conversation per user** - No multi-conversation UI. One ongoing thread per user.
- **Trust OpenClaw memory** - Gateway maintains context via `sessionKey = userId`. DB is for UI display, not context replay.
- **Load last 25 messages** - On page load. Lazy load older on scroll-up.
- **DB is source of display** - Messages stored for history viewing, backup, analytics.

## Data Flow

```
User sends message
    ↓
Chat API receives request
    ↓
Get/create conversation for user
    ↓
Save user message to DB
    ↓
Send to OpenClaw (sessionKey = userId)
    ↓
Receive response
    ↓
Save assistant message to DB
    ↓
Return response to client
```

## Implementation

### New Files

**`src/lib/db/conversations.ts`**
```typescript
// Database helpers for conversation persistence
getOrCreateConversation(userId: string): Promise<Conversation>
saveMessage(conversationId: string, role: 'user' | 'assistant', content: string, metadata?: MessageMetadata): Promise<Message>
getRecentMessages(conversationId: string, limit: number, before?: string): Promise<Message[]>
```

**`src/app/api/conversations/messages/route.ts`**
```typescript
// GET - fetch messages with pagination
// Query params: limit (default 25), before (message ID for pagination)
```

### Modified Files

**`src/app/api/chat/route.ts`**
- Get/create conversation before processing
- Save user message before sending to OpenClaw
- Save assistant message after receiving response
- Return conversationId in response

**`src/app/chat/page.tsx`**
- Fetch last 25 messages on mount
- Add scroll-up lazy loading for older messages
- Use database message IDs instead of generated ones
- Track pagination state (hasMore, oldestMessageId)

### Message Metadata Schema

```typescript
interface MessageMetadata {
  source?: 'gateway' | 'fallback';
  thinking?: string;
  runId?: string;
  gatewayError?: { code: string; message: string };
}
```

### Session Mapping

- `sessionKey` for OpenClaw gateway = `userId`
- One persistent OpenClaw session per user
- OpenClaw handles conversation context internally
- If context needs rebuilding later, can add history replay (not in scope now)

## Database

Uses existing schema from `001_initial_schema.sql`:
- `conversations` table (id, user_id, title, timestamps)
- `messages` table (id, conversation_id, role, content, metadata, created_at)
- RLS policies already handle user isolation

## Future Considerations

- History replay to OpenClaw if gateway loses context (not needed yet)
- "Clear conversation" / "Start fresh" action (add later if requested)
- Search within conversation history
