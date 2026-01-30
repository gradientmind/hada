# Architecture

## Overview

Hada is a multi-tenant SaaS that provides AI assistant capabilities by wrapping OpenClaw. The architecture prioritizes:

1. **Simplicity** - Solo founder friendly, minimal operational overhead
2. **Cost efficiency** - Shared infrastructure for lower tiers
3. **Scalability** - Can grow from 10 to 10,000+ users
4. **Security** - User data isolation via Row Level Security

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                              Users                                   │
│                    (Web Browser / Mobile App)                        │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Railway Platform                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      Next.js Application                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │ │
│  │  │   Frontend   │  │  API Routes  │  │     Middleware       │  │ │
│  │  │  (React 19)  │  │  (REST/WS)   │  │  (Auth, Sessions)    │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                  │                                   │
│                                  ▼                                   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                   Orchestration Layer                           │ │
│  │         (Routes users to correct OpenClaw instance)             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │ │
│  │  │ User Router  │  │ Load Balancer│  │  Instance Manager    │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                  │                                   │
│          ┌───────────────────────┼───────────────────────┐          │
│          ▼                       ▼                       ▼          │
│  ┌──────────────┐       ┌──────────────┐       ┌──────────────┐    │
│  │   OpenClaw   │       │   OpenClaw   │       │   OpenClaw   │    │
│  │  Instance 1  │       │  Instance 2  │       │  Instance N  │    │
│  │   (Shared)   │       │   (Shared)   │       │ (Dedicated)  │    │
│  └──────────────┘       └──────────────┘       └──────────────┘    │
│                                                                      │
│  ┌──────────────┐       ┌──────────────┐                            │
│  │  PostgreSQL  │       │    Redis     │                            │
│  │  (Supabase)  │       │  (Sessions)  │                            │
│  └──────────────┘       └──────────────┘                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       External Services                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │    Stripe    │  │ Google APIs  │  │      LLM Providers       │  │
│  │  (Billing)   │  │ (Cal/Email)  │  │ (MiniMax/Claude/OpenAI)  │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Authentication Flow

```
User → Login Page → Supabase Auth → Session Cookie → Middleware validates → Protected Routes
```

1. User enters credentials or clicks OAuth
2. Supabase handles authentication
3. Session stored in secure HTTP-only cookie
4. Middleware refreshes session on each request
5. Protected routes check for valid session

### Chat Message Flow

```
User Input → Next.js API → OpenClaw Gateway → LLM → Response → UI Update
                ↓ (fallback)
            Direct LLM API
```

1. User types message in chat UI
2. Message sent to Next.js API route
3. API attempts OpenClaw Gateway connection via WebSocket
4. OpenClaw processes request and calls configured LLM
5. LLM generates response
6. Response returned through WebSocket
7. UI updates with assistant message
8. If gateway unavailable, fallback to direct LLM API call

### Data Storage

```
User Data ──────────────────────────────────────────────────┐
    │                                                        │
    ▼                                                        ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐
│    Users     │    │ Conversations│    │     Integrations     │
│  (profiles)  │───▶│  (threads)   │    │  (OAuth tokens)      │
└──────────────┘    └──────────────┘    └──────────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Messages   │
                    │   (chat)     │
                    └──────────────┘
```

## Security Model

### Row Level Security (RLS)

Every table has RLS policies ensuring users can only access their own data:

```sql
-- Example: Users can only view their own conversations
create policy "Users can view own conversations" on public.conversations
  for select using (auth.uid() = user_id);
```

### Authentication

- Supabase Auth handles all authentication
- JWT tokens with short expiry
- Secure HTTP-only cookies for sessions
- Middleware refreshes sessions automatically

### Data Encryption

- All data encrypted at rest (Supabase default)
- TLS for all connections
- OAuth tokens stored encrypted in integrations table

## Multi-Tenancy Model

### Tiered Instance Strategy

| Tier | Instance Model | Users per Instance |
|------|---------------|-------------------|
| Free | Shared Pool | 100+ |
| Paid | Shared Pool | 20-50 |
| Pro | Dedicated | 1 |

### Instance Isolation

- **Free/Paid:** Logical isolation via user namespacing
- **Pro:** Physical isolation via dedicated containers

### Resource Allocation

```
Shared Instance:
├── Request Queue (per user)
├── Rate Limiting (by tier)
└── Fair Scheduling

Dedicated Instance:
├── Reserved CPU/Memory
├── Priority Processing
└── No Queueing
```

## Scalability Considerations

### Horizontal Scaling

- Next.js app scales automatically on Railway
- Add moltbot instances as demand grows
- Load balancer distributes requests

### Database Scaling

- Supabase handles PostgreSQL scaling
- Connection pooling via Supabase
- Read replicas available if needed

### Caching Strategy

- Redis for session state
- Response caching for common queries
- Edge caching for static assets

## Cost Optimization

### Infrastructure Costs (Estimated)

| Scale | Monthly Cost | Per User |
|-------|-------------|----------|
| 10 users | ~$50 | $5.00 |
| 100 users | ~$200 | $2.00 |
| 1,000 users | ~$1,500 | $1.50 |

### LLM Cost Management

- Track usage per user
- Implement rate limiting
- Cache common responses
- Use cheaper models for simple tasks

## Future Considerations

### Skills Platform

```
Skills Registry
├── Built-in Skills (Calendar, Email)
├── Operator Skills (Custom additions)
├── User Integrations (Connected apps)
└── Marketplace Skills (Third-party)
```

### Mobile Apps

- React Native for iOS/Android
- Share business logic with web
- Push notifications via Railway

### Messaging Integrations

- WhatsApp Business API
- Telegram Bot API
- Slack App
