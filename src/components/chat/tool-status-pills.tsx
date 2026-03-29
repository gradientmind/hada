"use client";

import { motion } from "framer-motion";
import type { ToolStatusPill } from "@/lib/chat/tool-status";

export function ToolStatusPills({ pills }: { pills: ToolStatusPill[] }) {
  if (!pills.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {pills.map((pill) => (
        <motion.span
          key={pill.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-full border border-zinc-200/70 bg-zinc-50/80 px-3 py-1 text-xs text-zinc-600 dark:border-zinc-800/70 dark:bg-zinc-950/60 dark:text-zinc-300"
        >
          {pill.label}
          {pill.tone === "working" ? "…" : ""}
        </motion.span>
      ))}
    </div>
  );
}
