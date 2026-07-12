import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Sonnet is a good default for the stylist's reasoning/latency trade-off.
// Override with ANTHROPIC_MODEL (e.g. claude-opus-4-8 for richer curation).
export const STYLIST_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

/**
 * Call Claude and get back schema-validated JSON. We use tool-use with a forced
 * tool_choice so the model must respond with structured data matching `schema`.
 */
export async function generateStructured<T extends z.ZodTypeAny>(opts: {
  schema: T;
  toolName: string;
  toolDescription: string;
  system: string;
  prompt: string;
  maxTokens?: number;
  model?: string;
}): Promise<z.infer<T>> {
  const { schema, toolName, toolDescription, system, prompt } = opts;
  const jsonSchema = z.toJSONSchema(schema, { target: "draft-2020-12" });

  const message = await anthropic.messages.create({
    model: opts.model ?? STYLIST_MODEL,
    max_tokens: opts.maxTokens ?? 4096,
    system,
    tools: [
      {
        name: toolName,
        description: toolDescription,
        input_schema: jsonSchema as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: toolName },
    messages: [{ role: "user", content: prompt }],
  });

  const toolUse = message.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Model did not return structured output");
  }
  return schema.parse(toolUse.input);
}

export function isAiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
