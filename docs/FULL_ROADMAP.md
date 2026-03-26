# Hada — Complete Agentic Platform Roadmap

This document outlines the full roadmap for evolving Hada from an AI chat application into a flagship agentic orchestration platform, spanning three tiers of maturity.

---

## 🏆 Tier 1: The Control Plane (Active)
> Focus: Observability, Orchestration, and System Extensibility.

### 1. Agent Trace / Reasoning Timeline (✅ Completed)
- Expose the agent's internal thought process.
- Show tool invocations (name, arguments) as collapsible cards.
- Display exact latency (`durationMs`) for every tool call.
- Surface "thinking" states.
- *Outcome:* The user can physically see the agent working, replacing the "black box" chat experience with a debuggable timeline.

### 2. Tool Plugin System (✅ Completed)
- Decouple tools from the core loop.
- Introduce `ToolRegistry` and `ToolManifest` interfaces.
- Dynamically load tools based on connected integrations.
- Expose `/api/tools` for ecosystem introspection.
- *Outcome:* An extensible architecture where adding a new capability requires only a self-contained module, not core loop modifications.

### 3. Multi-Step Task Orchestration (⏳ Next)
- Introduce the `plan_task` capability.
- Display a progress-tracked plan in the UI.
- Allow the agent to decompose complex workflows into sequential and parallel steps.
- *Outcome:* Empowers the agent to handle sophisticated, multi-turn goals autonomously.

### 4. Live Dashboard / Command Center
- Build a dedicated `/dashboard` interface.
- Implement an **Activity Feed** showing historical agent runs and token usage.
- Add **Tool Analytics** (success rates, latencies, usage volume).
- Add a **Memory Browser** to view, edit, or delete the agent's stored context.
- Add a **Task Manager** for cron-based background jobs.
- *Outcome:* Transitions Hada from a reactive chat window to a proactive operating system.

### 5. Multi-Agent Delegation
- Allow the primary agent to spawn focused sub-agents (e.g., "Research Agent", "Coding Agent").
- Support nested execution environments with different system prompts and LLM providers.
- *Outcome:* True agentic orchestration at the system frontier.

---

## 🥈 Tier 2: Depth & Polish
> Focus: Data Management, Safety, and User Experience.

### 6. Advanced Memory & Semantic Search
- Transition from simple key-value long-term memory to vector embeddings.
- Implement automatic memory pruning and importance scoring.
- Display a visual "Memory Graph" mapping user context.

### 7. Approval Workflows & Guardrails
- Introduce risk-levels for tools (already mapped in the `ToolManifest`).
- Require human-in-the-loop (HITL) approval before executing high-risk actions (e.g., `delete_calendar_event` or `send_email`).
- Maintain a secure audit log.

### 8. Rich Output Renderers
- Move beyond markdown.
- Render Kanban boards, interactive data charts, location maps, and document previews inline within the chat stream based on tool outputs.

### 9. Conversation Branching
- Provide a Git-like tree view of conversations.
- Allow branching from a previous node to explore alternative agent trajectories.

### 10. Webhooks & Event-Driven Triggers
- Allow external services (Zapier, incoming HTTP webhooks, emails) to trigger the agent's background loop without needing the UI open.

---

## 🥉 Tier 3: Competitive Differentiators
> Focus: Benchmarking, Collaboration, and Mobile.

### 11. Evaluation & Benchmarking Suite
- Native A/B testing of different LLM providers across identical tool-use tasks.
- Developer harness to measure regression in agent capability.

### 12. Agent Persona & Instruction Tuning
- User-authored system prompts per workspace.
- Pre-built personas (Concise, Academic, Assistant).

### 13. Collaboration & Team Workspaces
- Multiplayer agents: allow multiple users to interact with and share context in the same agentic workspace.
- Shared memory pools.

### 14. Mobile-First Edge Experiences
- Progressive Web App (PWA) with offline-support service workers.
- Native mobile push notifications when background asynchronous tasks complete.
