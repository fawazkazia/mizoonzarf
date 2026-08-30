import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import { queryProducts, type SortOption } from "@/lib/data/catalog";
import type { ProductCard } from "@/lib/data/products";

export interface StyleAssistantRequest {
  message: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

export interface StyleAssistantResponse {
  reply: string;
  products: ProductCard[];
}

export interface AIProvider {
  isConfigured(): boolean;
  chatStyleAssistant(request: StyleAssistantRequest): Promise<StyleAssistantResponse>;
}

const MODEL = "gpt-4o-mini";
const MAX_TOOL_ROUNDS = 2;

const SEARCH_PRODUCTS_TOOL: ChatCompletionTool = {
  type: "function",
  function: {
    name: "search_products",
    description:
      "Search the store's real product catalog. Always call this before recommending any product — never invent or describe a product you haven't found this way.",
    parameters: {
      type: "object",
      properties: {
        categorySlug: { type: "string", enum: ["men", "women", "kids", "perfumes", "jewellery"], description: "Top-level department." },
        searchTerm: { type: "string", description: "Free-text term to match against product name, tags (e.g. occasion like 'wedding', 'office', 'casual'), brand, or category." },
        colors: { type: "array", items: { type: "string" }, description: "Colors to filter by, e.g. ['black', 'navy']." },
        maxPrice: { type: "number", description: "Maximum price in the store's currency." },
        minPrice: { type: "number", description: "Minimum price in the store's currency." },
        sort: { type: "string", enum: ["recommended", "newest", "price_asc", "price_desc", "best_selling", "rating", "highest_discount"] },
      },
    },
  },
};

const SYSTEM_PROMPT = `You are the "Help Me Choose" shopping assistant for MIZOON ZARF, a premium fashion, perfume, and jewellery e-commerce store. Help customers find real products from the store's own catalog for their occasion, budget, and taste.

Rules:
- Always call search_products before recommending anything — never describe or invent a product you haven't retrieved that way.
- If the first search returns nothing useful, try again with broader or different terms before telling the customer nothing is available.
- Keep replies short and warm (2-4 sentences), like a helpful in-store stylist. The product cards are shown separately in the UI, so don't repeat prices/names in exhaustive detail — just explain your picks briefly.
- If the request is unclear (occasion, budget, or gender unspecified), ask one concise clarifying question instead of guessing.
- Stay in scope: fashion, perfume, jewellery, and accessories shopping for this store only.`;

const FALLBACK_REPLY = "I couldn't find anything quite right — could you tell me a bit more about what you're looking for?";

export class OpenAIProvider implements AIProvider {
  isConfigured(): boolean {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  async chatStyleAssistant(request: StyleAssistantRequest): Promise<StyleAssistantResponse> {
    if (!this.isConfigured()) {
      throw new Error("OPENAI_API_KEY is not set.");
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(request.history ?? []).map((h) => ({ role: h.role, content: h.content }) as ChatCompletionMessageParam),
      { role: "user", content: request.message },
    ];

    let lastProducts: ProductCard[] = [];

    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const response = await client.chat.completions.create({
        model: MODEL,
        max_tokens: 600,
        tools: [SEARCH_PRODUCTS_TOOL],
        messages,
      });

      const choice = response.choices[0];
      const toolCalls = (choice.message.tool_calls ?? []).filter((call) => call.type === "function");

      if (choice.finish_reason !== "tool_calls" || toolCalls.length === 0 || round === MAX_TOOL_ROUNDS) {
        const text = choice.message.content?.trim() ?? "";
        return { reply: text || FALLBACK_REPLY, products: lastProducts };
      }

      messages.push(choice.message);

      for (const call of toolCalls) {
        const args = JSON.parse(call.function.arguments || "{}") as {
          categorySlug?: string;
          searchTerm?: string;
          colors?: string[];
          maxPrice?: number;
          minPrice?: number;
          sort?: SortOption;
        };
        const result = await queryProducts({
          categorySlug: args.categorySlug,
          searchTerm: args.searchTerm,
          colors: args.colors,
          maxPrice: args.maxPrice,
          minPrice: args.minPrice,
          sort: args.sort,
        });
        lastProducts = result.products.slice(0, 6);
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(
            lastProducts.map((p) => ({ id: p.id, name: p.name, brand: p.brand, price: p.price, colors: p.colors.map((c) => c.name), inStock: p.inStock }))
          ),
        });
      }
    }

    return { reply: FALLBACK_REPLY, products: lastProducts };
  }
}

export function getAIProvider(): AIProvider {
  return new OpenAIProvider();
}
