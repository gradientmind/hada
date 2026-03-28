"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MermaidDiagram } from "@/components/chat/mermaid-diagram";
import { InlineChart } from "@/components/chat/inline-chart";
import { X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface ArtifactData {
  title: string;
  subtitle?: string;
  visuals: Array<{ type: "mermaid" | "chart"; code: string }>;
  textContent: string;
}

interface ArtifactPanelProps {
  artifact: ArtifactData;
  onClose: () => void;
}

export function ArtifactPanel({ artifact, onClose }: ArtifactPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex h-full flex-col border-l border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/60"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-teal-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
              Artifact
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close artifact panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 sm:px-8 sm:py-8">
            {/* Title */}
            <h1 className="text-2xl font-bold leading-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
              {artifact.title}
            </h1>
            {artifact.subtitle ? (
              <p className="mt-3 text-base leading-relaxed text-zinc-500 dark:text-zinc-400">
                {artifact.subtitle}
              </p>
            ) : null}

            {/* Visuals */}
            {artifact.visuals.length > 0 ? (
              <div className="mt-6 space-y-4">
                {artifact.visuals.map((visual, i) => (
                  <div key={i}>
                    {visual.type === "mermaid" ? (
                      <MermaidDiagram chart={visual.code} />
                    ) : (
                      <InlineChart code={visual.code} />
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            {/* Text content rendered as rich markdown */}
            {artifact.textContent ? (
              <div className="mt-8">
                <ArtifactMarkdown content={artifact.textContent} />
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function ArtifactMarkdown({ content }: { content: string }) {
  return (
    <div className="prose-artifact text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 [overflow-wrap:anywhere]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-3 last:mb-0">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 list-disc space-y-1.5 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 list-decimal space-y-1.5 pl-5">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => (
            <h2 className="mt-8 mb-3 text-xl font-bold text-zinc-900 first:mt-0 dark:text-zinc-100">{children}</h2>
          ),
          h2: ({ children }) => (
            <h3 className="mt-6 mb-2 text-lg font-bold text-zinc-900 first:mt-0 dark:text-zinc-100">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="mt-5 mb-2 text-base font-semibold text-zinc-900 first:mt-0 dark:text-zinc-100">{children}</h4>
          ),
          h4: ({ children }) => (
            <h5 className="mt-4 mb-1 font-semibold text-zinc-800 first:mt-0 dark:text-zinc-200">{children}</h5>
          ),
          h5: ({ children }) => (
            <h6 className="mt-3 mb-1 font-medium text-zinc-600 dark:text-zinc-400">{children}</h6>
          ),
          h6: ({ children }) => (
            <p className="mt-3 mb-1 font-medium text-zinc-500 dark:text-zinc-500">{children}</p>
          ),
          pre: ({ children }) => (
            <pre className="mb-3 max-w-full overflow-x-auto rounded-lg bg-zinc-100 p-4 font-mono text-xs dark:bg-zinc-900">
              {children}
            </pre>
          ),
          code: ({ className, children }) => {
            const isBlock = !!className;
            return isBlock ? (
              <code className={`${className}`}>{children}</code>
            ) : (
              <code className="rounded bg-zinc-200/60 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
                {children}
              </code>
            );
          },
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 underline hover:no-underline dark:text-teal-400"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-4 border-teal-500/30 pl-4 text-zinc-500 dark:border-teal-500/20 dark:text-zinc-400">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-3 max-w-full overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full border-collapse text-xs">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-zinc-200 bg-zinc-100 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-zinc-100 px-3 py-2 align-top dark:border-zinc-800/60">
              {children}
            </td>
          ),
          hr: () => <hr className="my-6 border-zinc-200 dark:border-zinc-800" />,
          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{children}</strong>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
