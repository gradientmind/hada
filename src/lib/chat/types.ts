export interface TraceEvent {
  callId: string;
  name: string;
  args: Record<string, unknown>;
  result?: string;
  durationMs?: number;
  truncated?: boolean;
  agentName?: string;
  order?: number;
  status: "running" | "done" | "error";
}

export interface ThinkingEvent {
  content: string;
  agentName?: string;
  order?: number;
}
