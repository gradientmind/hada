import type { AgentTool } from "@/lib/chat/agent-loop";
import type { ToolContext } from "@/lib/chat/tools/types";

import type { ToolManifest } from "@/lib/chat/tools/tool-registry";

export const recallMemoryManifest: ToolManifest = {
  name: "recall_memory",
  displayName: "Recall Memory",
  description: "Recall long-term memory topics for this user. Optional topic filter returns a specific memory.",
  category: "memory",
  riskLevel: "low",
  parameters: {
    type: "object",
    properties: {
      topic: {
        type: "string",
        description: "Optional topic key to filter by.",
      },
    },
    required: [],
  },
};

export function createRecallMemoryTool(context: ToolContext): AgentTool {
  return {
    name: recallMemoryManifest.name,
    description: recallMemoryManifest.description,
    parameters: recallMemoryManifest.parameters,
    async execute(args) {
      const topic = typeof args.topic === "string" ? args.topic.trim() : "";

      let query = context.supabase
        .from("user_memories")
        .select("topic, content, updated_at")
        .eq("user_id", context.userId)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (topic) {
        query = query.eq("topic", topic);
      }

      const { data, error } = await query;

      if (error) {
        return JSON.stringify({ success: false, error: error.message });
      }

      return JSON.stringify({ success: true, memories: data || [] });
    },
  };
}
