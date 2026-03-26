import type { AgentTool } from "@/lib/chat/agent-loop";
import type { ToolContext } from "@/lib/chat/tools/types";
import type { ToolManifest } from "@/lib/chat/tools/tool-registry";
import type { TaskPlan, TaskStep } from "@/lib/types/database";

export const planTaskManifest: ToolManifest = {
  name: "plan_task",
  displayName: "Plan Task",
  description: "Decompose a complex request into ordered subtasks with tool assignments.",
  category: "system",
  riskLevel: "low",
  parameters: {
    type: "object",
    properties: {
      goal: {
        type: "string",
        description: "The overall goal to accomplish.",
      },
      steps: {
        type: "array",
        description: "Ordered execution steps for the task.",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            toolsNeeded: {
              type: "array",
              description: "Tool names this step is expected to use.",
              items: { type: "string" },
            },
          },
          required: ["title", "description"],
        },
      },
    },
    required: ["goal", "steps"],
  },
};

export function createPlanTaskTool(context: ToolContext): AgentTool {
  void context;
  return {
    name: planTaskManifest.name,
    description: planTaskManifest.description,
    parameters: planTaskManifest.parameters,
    async execute(args) {
      const goal = typeof args.goal === "string" ? args.goal.trim() : "";
      const inputSteps = Array.isArray(args.steps) ? args.steps : [];

      if (!goal || inputSteps.length === 0) {
        return JSON.stringify({
          success: false,
          error: "goal and at least one step are required",
        });
      }

      const steps: TaskStep[] = inputSteps
        .map((step, index) => normalizeStep(step, index))
        .filter((step): step is TaskStep => Boolean(step));

      if (steps.length === 0) {
        return JSON.stringify({
          success: false,
          error: "steps must include a title and description",
        });
      }

      const plan: TaskPlan = {
        id: crypto.randomUUID(),
        goal,
        steps,
      };

      return JSON.stringify(plan);
    },
  };
}

function normalizeStep(step: unknown, index: number): TaskStep | null {
  if (!step || typeof step !== "object") {
    return null;
  }

  const record = step as Record<string, unknown>;
  const title = typeof record.title === "string" ? record.title.trim() : "";
  const description =
    typeof record.description === "string" ? record.description.trim() : "";

  if (!title || !description) {
    return null;
  }

  const toolsNeeded = Array.isArray(record.toolsNeeded)
    ? Array.from(
        new Set(
          record.toolsNeeded
            .filter((tool): tool is string => typeof tool === "string")
            .map((tool) => tool.trim())
            .filter(Boolean),
        ),
      )
    : undefined;

  return {
    id: `step_${index + 1}_${crypto.randomUUID()}`,
    title,
    description,
    status: "pending",
    ...(toolsNeeded?.length ? { toolsNeeded } : {}),
  };
}
