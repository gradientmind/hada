import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StreamingMessage } from "@/components/chat/streaming-message";

describe("StreamingMessage", () => {
  it("renders stable segments in order", () => {
    render(
      <StreamingMessage
        segments={[
          { id: "1", text: "Here is" },
          { id: "2", text: " a streamed" },
          { id: "3", text: " answer." },
        ]}
      />,
    );

    const noTrim = { normalizer: (text: string) => text };
    expect(screen.getByText("Here is")).toBeInTheDocument();
    expect(screen.getByText(" a streamed", noTrim)).toBeInTheDocument();
    expect(screen.getByText(" answer.", noTrim)).toBeInTheDocument();
  });
});
