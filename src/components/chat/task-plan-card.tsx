"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronDown, ChevronRight, Circle, CircleX, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskPlan, TaskStep } from "@/lib/types/database";

export interface TaskPlanCardProps {
  plan: TaskPlan;
  activeStepId?: string;
}

export function TaskPlanCard({ plan, activeStepId }: TaskPlanCardProps) {
  const [expanded, setExpanded] = useState(true);
  const completedSteps = useMemo(
    () => plan.steps.filter((step) => step.status === "done").length,
    [plan.steps],
  );
  const failedSteps = useMemo(
    () => plan.steps.filter((step) => step.status === "failed").length,
    [plan.steps],
  );
  const progress = plan.steps.length ? (completedSteps / plan.steps.length) * 100 : 0;
  const isFinished = completedSteps === plan.steps.length || failedSteps > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center gap-3 text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
              Execution Plan
            </span>
            {isFinished ? (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {failedSteps > 0 ? "Attention needed" : "Complete"}
              </span>
            ) : null}
          </div>
          {plan.goal ? (
            <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-100">
              {plan.goal}
            </p>
          ) : null}
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-zinc-400" />
        )}
      </button>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>{completedSteps} of {plan.steps.length} steps completed</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <motion.div
            className={cn(
              "h-full rounded-full",
              failedSteps > 0 ? "bg-red-500/80" : "bg-emerald-500/80",
            )}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="steps"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-4">
              {plan.steps.map((step, index) => (
                <PlanStepRow
                  key={step.id}
                  index={index}
                  step={step}
                  isActive={activeStepId === step.id}
                  isLast={index === plan.steps.length - 1}
                />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function PlanStepRow({
  index,
  step,
  isActive,
  isLast,
}: {
  index: number;
  step: TaskStep;
  isActive: boolean;
  isLast: boolean;
}) {
  const Icon =
    step.status === "done"
      ? CheckCircle2
      : step.status === "failed"
      ? CircleX
      : step.status === "running" || isActive
      ? LoaderCircle
      : Circle;

  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-semibold",
            step.status === "done" && "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400",
            step.status === "failed" && "border-red-200 bg-red-50 text-red-600 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400",
            (step.status === "running" || isActive) && "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400",
            step.status === "pending" && "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-400",
          )}
        >
          <Icon className={cn("h-3.5 w-3.5", (step.status === "running" || isActive) && "animate-spin")} />
        </span>
        {!isLast ? (
          <span className="mt-1 h-10 w-px bg-zinc-200 dark:bg-zinc-800" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-400">Step {index + 1}</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              step.status === "done" && "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
              step.status === "failed" && "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
              (step.status === "running" || isActive) && "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
              step.status === "pending" && "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
            )}
          >
            {isActive && step.status === "pending" ? "running" : step.status}
          </span>
        </div>
        <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-100">{step.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {step.description}
        </p>
        {step.toolsNeeded?.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {step.toolsNeeded.map((tool) => (
              <span
                key={`${step.id}-${tool}`}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              >
                {tool}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
