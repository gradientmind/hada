"use client";

import { useMemo, useState } from "react";
import { MermaidDiagram } from "@/components/chat/mermaid-diagram";
import { InlineChart } from "@/components/chat/inline-chart";
import { cn } from "@/lib/utils";
import { Maximize2, Minimize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Visual {
  type: "mermaid" | "chart";
  code: string;
}

function extractVisuals(content: string): { visuals: Visual[]; textContent: string } {
  const visuals: Visual[] = [];
  // Match ```mermaid ... ``` and ```chart ... ``` blocks
  const pattern = /```(mermaid|chart)\n([\s\S]*?)```/g;
  const textContent = content.replace(pattern, (_, lang: string, code: string) => {
    visuals.push({ type: lang as "mermaid" | "chart", code: code.trim() });
    return ""; // remove from text flow
  });
  return { visuals, textContent: textContent.trim() };
}

function VisualPanel({ visual }: { visual: Visual }) {
  if (visual.type === "mermaid") {
    return <MermaidDiagram chart={visual.code} />;
  }
  return <InlineChart code={visual.code} />;
}

interface RichMessageContentProps {
  content: string;
  isStreaming?: boolean;
}

export function RichMessageContent({ content, isStreaming }: RichMessageContentProps) {
  const [expanded, setExpanded] = useState(false);
  const { visuals, textContent } = useMemo(() => extractVisuals(content), [content]);

  const hasVisuals = visuals.length > 0 && !isStreaming;

  if (!hasVisuals) {
    return <PlainMarkdown content={content} />;
  }

  return (
    <div className="min-w-0 w-full">
      {/* Side-by-side on large screens, stacked on small */}
      <div className={cn(
        "flex flex-col gap-4",
        "lg:flex-row lg:items-start lg:gap-5",
      )}>
        {/* Visual panel */}
        <div className={cn(
          "shrink-0 w-full",
          "lg:sticky lg:top-2 lg:self-start",
          expanded ? "lg:w-[55%]" : "lg:w-[45%]",
          "transition-[width] duration-200",
        )}>
          <div className="relative">
            <div className="space-y-3">
              {visuals.map((visual, i) => (
                <VisualPanel key={i} visual={visual} />
              ))}
            </div>
            {/* Expand/collapse toggle */}
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="absolute right-2 top-2 hidden rounded-lg border border-zinc-200 bg-white/90 p-1.5 text-zinc-400 shadow-sm backdrop-blur transition-colors hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/90 dark:hover:text-zinc-200 lg:block"
              aria-label={expanded ? "Shrink visual" : "Expand visual"}
            >
              {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Text content */}
        <div className={cn(
          "min-w-0 flex-1",
          expanded ? "lg:w-[45%]" : "lg:w-[55%]",
        )}>
          <PlainMarkdown content={textContent} />
        </div>
      </div>
    </div>
  );
}

function PlainMarkdown({ content }: { content: string }) {
  return (
    <div className="min-w-0 w-full max-w-full overflow-hidden text-sm leading-relaxed space-y-1 [overflow-wrap:anywhere] [&>*]:min-w-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-2 list-disc space-y-1 pl-5 break-words [overflow-wrap:anywhere]">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 list-decimal space-y-1 pl-5 break-words [overflow-wrap:anywhere]">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-snug break-words [overflow-wrap:anywhere]">{children}</li>,
          h1: ({ children }) => (
            <p className="mt-3 mb-2 text-base font-bold text-zinc-900 first:mt-0 dark:text-zinc-100">{children}</p>
          ),
          h2: ({ children }) => (
            <p className="mt-3 mb-1.5 text-sm font-bold text-zinc-900 first:mt-0 dark:text-zinc-100">{children}</p>
          ),
          h3: ({ children }) => (
            <p className="mt-2 mb-1 font-semibold text-zinc-900 first:mt-0 dark:text-zinc-100">{children}</p>
          ),
          h4: ({ children }) => (
            <p className="mt-2 mb-1 font-semibold text-zinc-700 first:mt-0 dark:text-zinc-300">{children}</p>
          ),
          h5: ({ children }) => (
            <p className="font-medium mb-1 text-zinc-600 dark:text-zinc-400">{children}</p>
          ),
          h6: ({ children }) => (
            <p className="font-medium mb-1 text-zinc-500 dark:text-zinc-500">{children}</p>
          ),
          pre: ({ children }) => {
            const child = Array.isArray(children) ? children[0] : children;
            if (child && typeof child === "object" && "props" in child) {
              const codeProps = child.props as { className?: string; children?: React.ReactNode };
              const lang = codeProps.className?.replace("language-", "");
              const text = String(codeProps.children ?? "").replace(/\n$/, "");
              if (lang === "mermaid") {
                return <MermaidDiagram chart={text} />;
              }
              if (lang === "chart") {
                return <InlineChart code={text} />;
              }
            }
            return (
              <pre className="mb-2 max-w-full overflow-x-auto rounded-lg bg-zinc-100 p-3 font-mono text-xs whitespace-pre dark:bg-zinc-800">
                {children}
              </pre>
            );
          },
          code: ({ className, children }) => {
            const isBlock = !!className;
            return isBlock ? (
              <code className={`${className} break-words`}>{children}</code>
            ) : (
              <code className="break-all rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs dark:bg-zinc-800">
                {children}
              </code>
            );
          },
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-blue-600 underline hover:no-underline dark:text-blue-400"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-2 border-l-4 border-zinc-300 pl-4 italic break-words text-zinc-500 [overflow-wrap:anywhere] dark:border-zinc-600 dark:text-zinc-400">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-2 max-w-full overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full min-w-[20rem] border-collapse text-xs">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-zinc-100 px-3 py-2 break-words align-top text-zinc-700 dark:border-zinc-800/60 dark:text-zinc-300">
              {children}
            </td>
          ),
          hr: () => <hr className="my-3 border-zinc-200 dark:border-zinc-700" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
