export interface StyleAssistantRequest {
  message: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

export interface StyleAssistantResponse {
  reply: string;
  suggestedCategorySlugs?: string[];
}

/**
 * Generative AI features (the conversational Style Assistant, AI marketing
 * copy, AI banner generation) are Phase 4. This interface is defined now so
 * that work can be wired in without touching the storefront — it is not
 * called anywhere in Phase 1. The one AI-labeled feature shipped in Phase 1
 * (the "Find Your Style" home section) is a real, fully-working rule-based
 * product filter, not a generative call, and does not depend on this file.
 */
export interface AIProvider {
  isConfigured(): boolean;
  chatStyleAssistant(request: StyleAssistantRequest): Promise<StyleAssistantResponse>;
}

export class AnthropicAIProvider implements AIProvider {
  isConfigured(): boolean {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  }

  async chatStyleAssistant(): Promise<StyleAssistantResponse> {
    if (!this.isConfigured()) {
      throw new Error("ANTHROPIC_API_KEY is not set. The AI Style Assistant ships in a later phase.");
    }
    throw new Error("AI Style Assistant is not yet implemented (Phase 4).");
  }
}

export function getAIProvider(): AIProvider {
  return new AnthropicAIProvider();
}
