# OpenClaw Integration

## Overview

Hada uses [OpenClaw](https://github.com/openclaw/openclaw) as its AI gateway. OpenClaw provides a WebSocket-based control plane for managing AI agents, sessions, and LLM interactions.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Hada Next.js App                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │  src/lib/moltbot/websocket-client.ts               │ │
│  │  - WebSocket protocol implementation               │ │
│  │  - Connection pooling & reconnect logic            │ │
│  │  - Exponential backoff (1s → 30s max)              │ │
│  └────────────────────┬───────────────────────────────┘ │
│                       │ WebSocket                        │
└───────────────────────┼──────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              OpenClaw Gateway (Railway)                  │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Gateway WebSocket Server                          │ │
│  │  - Port: 18789                                     │ │
│  │  - Bind: 0.0.0.0 (lan mode)                        │ │
│  │  - Auth: Token-based (OPENCLAW_GATEWAY_TOKEN)      │ │
│  └────────────────────┬───────────────────────────────┘ │
│                       │                                  │
│  ┌────────────────────┴───────────────────────────────┐ │
│  │  Pi Agent Runtime                                  │ │
│  │  - Session management (sessionKey = userId)        │ │
│  │  - Context preservation across messages            │ │
│  │  - Configured LLM provider (MiniMax)               │ │
│  └────────────────────┬───────────────────────────────┘ │
└───────────────────────┼──────────────────────────────────┘
                        │
                        ▼
              LLM Provider (MiniMax)
```

## WebSocket Protocol

OpenClaw uses a JSON-based frame protocol over WebSocket.

### Connection Flow

1. **Client connects** to `ws://gateway-url:18789`
2. **Send connect request:**
   ```json
   {
     "type": "req",
     "id": "connect-1",
     "method": "connect",
     "params": {
       "minProtocol": 3,
       "maxProtocol": 3,
       "client": {
         "id": "webchat-ui",
         "version": "1.0.0",
         "platform": "web",
         "mode": "webchat"
       },
       "auth": {
         "token": "your-token-here"
       }
     }
   }
   ```
3. **Receive connect response:**
   ```json
   {
     "type": "res",
     "id": "connect-1",
     "ok": true,
     "payload": { ... }
   }
   ```

### Sending Messages

```json
{
  "type": "req",
  "id": "req-123",
  "method": "agent",
  "params": {
    "message": "Hello, how are you?",
    "sessionKey": "user-id-here",
    "idempotencyKey": "req-123"
  }
}
```

### Response Handling

OpenClaw sends two responses per agent request:

1. **Accepted acknowledgment:**
   ```json
   {
     "type": "res",
     "id": "req-123",
     "ok": true,
     "payload": {
       "runId": "run-abc",
       "status": "accepted"
     }
   }
   ```

2. **Final result:**
   ```json
   {
     "type": "res",
     "id": "req-123",
     "ok": true,
     "payload": {
       "runId": "run-abc",
       "status": "ok",
       "result": {
         "payloads": [
           { "text": "I'm doing great, thanks for asking!" }
         ]
       }
     }
   }
   ```

## Configuration

### OpenClaw Config (`moltbot/config/openclaw.json`)

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "minimax/MiniMax-M2.1"
      }
    }
  },
  "models": {
    "providers": {
      "minimax": {
        "baseUrl": "https://api.minimax.io/v1",
        "api": "openai-completions",
        "models": [
          {
            "id": "MiniMax-M2.1",
            "name": "MiniMax M2.1",
            "contextWindow": 200000,
            "maxTokens": 8192
          }
        ]
      }
    }
  },
  "gateway": {
    "port": 18789,
    "mode": "local"
  }
}
```

### Environment Variables

**Next.js App:**
- `OPENCLAW_GATEWAY_URL` - WebSocket URL (e.g., `ws://openclaw.railway.internal:18789`)
- `OPENCLAW_GATEWAY_TOKEN` - Auth token matching gateway config
- `MINIMAX_API_KEY` - MiniMax API key (for fallback)

**OpenClaw Container:**
- `MINIMAX_API_KEY` - MiniMax API key (for gateway)
- `OPENCLAW_GATEWAY_TOKEN` - Gateway auth token
- `OPENCLAW_SKIP_CHANNELS=1` - Skip channel integrations

## Deployment

### Docker Container

The OpenClaw gateway runs in a Docker container on Railway:

```dockerfile
FROM node:22-slim

# Clone and build OpenClaw
RUN git clone --depth 1 https://github.com/openclaw/openclaw.git .
RUN pnpm install && pnpm build

# Copy config
COPY config/openclaw.json /root/.openclaw/openclaw.json

# Start gateway
CMD ["sh", "-c", "OPENCLAW_SKIP_CHANNELS=1 node openclaw.mjs gateway --port 18789 --bind lan --verbose"]
```

### Railway Setup

1. **Create OpenClaw service:**
   - Deploy from GitHub repo
   - Set Root Directory to `moltbot`
   - Add environment variables

2. **Configure Next.js service:**
   - Add `OPENCLAW_GATEWAY_URL=http://openclaw.railway.internal:18789`
   - Add `OPENCLAW_GATEWAY_TOKEN` (same as gateway)

3. **Internal networking:**
   - Railway services use `<service-name>.railway.internal` for internal communication
   - Gateway must bind to `lan` (not `loopback`) to accept connections

## Fallback Behavior

When the OpenClaw gateway is unavailable, Hada automatically falls back to direct LLM API calls:

1. **Health check** (`/api/health`) polls gateway every 30s
2. **Chat API** attempts gateway first, falls back on error
3. **Reconnect logic** uses exponential backoff (1s → 2s → 4s → ... → 30s max)
4. **UI indicator** shows connection status:
   - 🟢 Online - Gateway connected
   - 🟡 Fallback - Using direct LLM
   - 🔴 Offline - No LLM available

## Session Management

- **sessionKey = userId** - Each user gets isolated session context
- **Context persistence** - OpenClaw maintains conversation context in memory
- **DB storage** - Messages stored to Supabase for UI display and history
- **Lazy loading** - Last 25 messages loaded on page load, older messages on scroll

## Troubleshooting

### Gateway won't start
- Check config format matches latest OpenClaw schema
- Ensure `gateway.mode=local` is set
- Verify `--bind lan` flag (not `0.0.0.0`)

### Connection refused
- Verify service name matches Railway internal URL
- Check gateway binds to `0.0.0.0` or `lan`, not `loopback`
- Ensure auth token matches between app and gateway

### Messages not persisting
- Check Supabase connection
- Verify RLS policies allow user access
- Check `/api/conversations/messages` endpoint

## Future Improvements

- [ ] Multi-instance orchestration for Pro tier
- [ ] Message streaming for real-time responses
- [ ] Custom skills/tools integration
- [ ] Voice input via OpenClaw channels
