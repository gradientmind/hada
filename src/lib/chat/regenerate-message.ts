export interface RegenerationMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

export function resolveRegenerationPair(
  messages: RegenerationMessage[],
  assistantMessageId: string,
): { assistantMessageId: string; userMessageId: string; message: string } {
  const assistantIndex = messages.findIndex(
    (message) => message.id === assistantMessageId && message.role === "assistant",
  );

  if (assistantIndex < 0) {
    throw new Error("Assistant message not found for regeneration.");
  }

  for (let index = assistantIndex - 1; index >= 0; index -= 1) {
    const candidate = messages[index];
    if (candidate.role === "user") {
      return {
        assistantMessageId,
        userMessageId: candidate.id,
        message: candidate.content,
      };
    }
  }

  throw new Error("No matching user message found for regeneration.");
}
