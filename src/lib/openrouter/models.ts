export interface OpenRouterModelOption {
  id: string;
  name: string;
  inputPriceLabel: string | null;
  outputPriceLabel: string | null;
  priceSummary: string;
}

interface OpenRouterModelPricing {
  prompt?: unknown;
  completion?: unknown;
}

interface OpenRouterModelEntry {
  id?: unknown;
  name?: unknown;
  pricing?: OpenRouterModelPricing;
}

export function formatOpenRouterPricePerMillion(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const parsed = Number.parseFloat(String(value));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  const perMillion = parsed * 1_000_000;
  return `$${perMillion.toFixed(2)}/M`;
}

export function mapOpenRouterModel(entry: unknown): OpenRouterModelOption | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const payload = entry as OpenRouterModelEntry;
  const id = typeof payload.id === "string" ? payload.id.trim() : "";
  if (!id) {
    return null;
  }

  const name = typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : id;
  const inputPriceLabel = formatOpenRouterPricePerMillion(payload.pricing?.prompt ?? null);
  const outputPriceLabel = formatOpenRouterPricePerMillion(payload.pricing?.completion ?? null);

  let priceSummary = "Pricing unavailable";
  if (inputPriceLabel && outputPriceLabel) {
    priceSummary = `${inputPriceLabel} in • ${outputPriceLabel} out`;
  } else if (inputPriceLabel) {
    priceSummary = `${inputPriceLabel} in`;
  } else if (outputPriceLabel) {
    priceSummary = `${outputPriceLabel} out`;
  }

  return {
    id,
    name,
    inputPriceLabel,
    outputPriceLabel,
    priceSummary,
  };
}

export function toOpenRouterModelOptions(entries: unknown[]): OpenRouterModelOption[] {
  return entries
    .map((entry) => mapOpenRouterModel(entry))
    .filter((entry): entry is OpenRouterModelOption => Boolean(entry))
    .sort((a, b) => a.id.localeCompare(b.id));
}
