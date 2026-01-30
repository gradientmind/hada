# Settings Page & Health Monitoring

## Overview

Add a settings page with tabbed navigation showing bot server status, and implement auto-reconnect logic for the gateway connection.

## Design Decisions

- **Tabbed settings page** - Sidebar on desktop, horizontal tabs on mobile. Extensible for future integrations.
- **Silent auto-reconnect** - Exponential backoff, message queueing, minimal user disruption.
- **Dedicated health endpoint** - `/api/health` for clean separation from chat API.

## Settings Page Structure

**Route:** `/settings`

**Tabs:**
- Status - Bot server health, connection status
- Integrations - Placeholder (Telegram, WhatsApp, Email, Calendar)
- Account - Placeholder (profile, preferences)

## Auto-Reconnect Logic

**Connection states:** `connecting` → `connected` → `disconnected`

**Reconnect strategy:**
- On disconnect: wait 1s, then retry
- Exponential backoff: 1s → 2s → 4s → 8s → max 30s
- Reset backoff on successful connection

**Message queueing:**
- Queue messages if disconnected while sending
- Flush queue on reconnect
- Show "Reconnecting..." in chat only if >2s delay

**Health polling:**
- Settings page polls `/api/health` every 10s when visible
- Chat page relies on connection state (no polling)

## Implementation

### New Files

- `src/app/settings/page.tsx` - Main settings page
- `src/app/settings/layout.tsx` - Settings layout with tabs
- `src/components/settings/status-tab.tsx` - Bot status display
- `src/components/settings/integrations-tab.tsx` - Placeholder
- `src/components/settings/account-tab.tsx` - Placeholder
- `src/lib/openclaw/connection-manager.ts` - Reconnect logic & state
- `src/app/api/health/route.ts` - Dedicated health endpoint

### Modified Files

- `src/lib/openclaw/websocket-client.ts` - Add reconnect logic
- `src/app/chat/page.tsx` - Use connection manager, show reconnecting state

### UI Components

- Tabs (shadcn/ui)
- Status badge (colored dot + text)
