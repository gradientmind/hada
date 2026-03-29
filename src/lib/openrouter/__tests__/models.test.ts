import { describe, expect, it } from "vitest";
import {
  formatOpenRouterPricePerMillion,
  mapOpenRouterModel,
  toOpenRouterModelOptions,
} from "@/lib/openrouter/models";

describe("formatOpenRouterPricePerMillion", () => {
  it("formats per-token prices as dollar cost per million tokens", () => {
    expect(formatOpenRouterPricePerMillion("0.0000025")).toBe("$2.50/M");
    expect(formatOpenRouterPricePerMillion("0.00000015")).toBe("$0.15/M");
  });

  it("returns null for invalid values", () => {
    expect(formatOpenRouterPricePerMillion(null)).toBeNull();
    expect(formatOpenRouterPricePerMillion("abc")).toBeNull();
  });
});

describe("mapOpenRouterModel", () => {
  it("maps model payload into UI option with combined price label", () => {
    const option = mapOpenRouterModel({
      id: "openai/gpt-4.1-mini",
      name: "GPT-4.1 Mini",
      pricing: {
        prompt: "0.00000040",
        completion: "0.00000160",
      },
    });

    expect(option).toEqual({
      id: "openai/gpt-4.1-mini",
      name: "GPT-4.1 Mini",
      inputPriceLabel: "$0.40/M",
      outputPriceLabel: "$1.60/M",
      priceSummary: "$0.40/M in • $1.60/M out",
    });
  });

  it("returns null for entries without id", () => {
    expect(mapOpenRouterModel({ name: "No ID" })).toBeNull();
  });
});

describe("toOpenRouterModelOptions", () => {
  it("keeps valid entries and sorts them by id", () => {
    const options = toOpenRouterModelOptions([
      { id: "z/model", pricing: { prompt: "0.000001", completion: "0.000002" } },
      { name: "missing id" },
      { id: "a/model", pricing: { prompt: "0.000002", completion: "0.000003" } },
    ]);

    expect(options.map((option) => option.id)).toEqual(["a/model", "z/model"]);
  });
});
