import { describe, expect, it } from "vitest";
import { sanitizeFollowUpSuggestions } from "@/lib/chat/follow-up-suggestions";

describe("sanitizeFollowUpSuggestions", () => {
  it("keeps only 2-3 concise strings", () => {
    expect(
      sanitizeFollowUpSuggestions([
        "Compare this against competitors",
        "Turn this into a short slide outline",
        "What risks should I watch next quarter?",
        "extra value",
      ]),
    ).toEqual([
      "Compare this against competitors",
      "Turn this into a short slide outline",
      "What risks should I watch next quarter?",
    ]);
  });

  it("drops empty and duplicate suggestions", () => {
    expect(
      sanitizeFollowUpSuggestions([
        "Summarize this in five bullets",
        "",
        "Summarize this in five bullets",
      ]),
    ).toEqual(["Summarize this in five bullets"]);
  });
});
