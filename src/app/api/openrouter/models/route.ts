import { NextResponse } from "next/server";
import { toOpenRouterModelOptions } from "@/lib/openrouter/models";

interface OpenRouterModelsResponse {
  data?: unknown[];
}

export async function GET() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 900,
      },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter models request failed (${response.status})`);
    }

    const payload = (await response.json()) as OpenRouterModelsResponse;
    const entries = Array.isArray(payload.data) ? payload.data : [];
    const models = toOpenRouterModelOptions(entries);

    return NextResponse.json({ models });
  } catch (error) {
    return NextResponse.json(
      {
        models: [],
        error: error instanceof Error ? error.message : "Failed to load OpenRouter models",
      },
      { status: 502 },
    );
  }
}
