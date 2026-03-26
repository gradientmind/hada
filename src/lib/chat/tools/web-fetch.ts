import type { AgentTool } from "@/lib/chat/agent-loop";

import type { ToolManifest } from "@/lib/chat/tools/tool-registry";

const MAX_FETCH_CHARS = 16_000;

export const webFetchManifest: ToolManifest = {
  name: "web_fetch",
  displayName: "Web Fetch",
  description: "Fetch and extract readable content from a public URL.",
  category: "web",
  riskLevel: "low",
  parameters: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "Public HTTP(S) URL to fetch.",
      },
    },
    required: ["url"],
  },
};

export function createWebFetchTool(): AgentTool {
  return {
    name: webFetchManifest.name,
    description: webFetchManifest.description,
    parameters: webFetchManifest.parameters,
    async execute(args, options) {
      const rawUrl = String(args.url || "").trim();
      if (!rawUrl) {
        return JSON.stringify({ success: false, error: "url is required" });
      }

      let url: URL;
      try {
        url = new URL(rawUrl);
      } catch {
        return JSON.stringify({ success: false, error: "invalid URL" });
      }

      if (!/^https?:$/i.test(url.protocol)) {
        return JSON.stringify({ success: false, error: "only HTTP(S) URLs are allowed" });
      }

      try {
        const response = await fetch(url.toString(), {
          signal: options?.signal,
          headers: {
            "User-Agent": "HadaBot/1.0 (+https://hada.app)",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });

        if (!response.ok) {
          return JSON.stringify({
            success: false,
            error: `fetch failed (${response.status})`,
          });
        }

        const contentType = response.headers.get("content-type") || "";
        const body = await response.text();
        const extracted = contentType.includes("text/html")
          ? htmlToText(body)
          : body;

        return JSON.stringify({
          success: true,
          url: url.toString(),
          content: extracted.slice(0, MAX_FETCH_CHARS),
          truncated: extracted.length > MAX_FETCH_CHARS,
        });
      } catch (error) {
        if (isAbortError(error)) {
          throw error;
        }
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "fetch failed",
        });
      }
    },
  };
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : error instanceof Error && error.name === "AbortError";
}
