import { generateStructured } from "@/lib/ai/client";
import {
  STYLIST_SYSTEM,
  scenarioGeneratePrompt,
  scenarioParsePrompt,
} from "@/lib/ai/prompts";
import {
  RecommendationBatchSchema,
  ScenarioContextSchema,
  type ScenarioContext,
} from "@/lib/ai/schemas";

import { loadStylistContext, persistBatch } from "./RecommendationService";
import { maxBudgetFor, toProfileSummary } from "./types";

// Two-step: parse the free-text request into structured context, then generate
// a cohesive capsule for it.
export async function generateScenario(userId: string, rawPrompt: string) {
  const { profile, purchases } = await loadStylistContext(userId);

  const context: ScenarioContext = await generateStructured({
    schema: ScenarioContextSchema,
    toolName: "return_scenario_context",
    toolDescription: "Return structured context parsed from the styling request.",
    system: STYLIST_SYSTEM,
    prompt: scenarioParsePrompt(rawPrompt),
    maxTokens: 1024,
  });

  const maxPrice = maxBudgetFor(profile);

  const batch = await generateStructured({
    schema: RecommendationBatchSchema,
    toolName: "return_recommendations",
    toolDescription: "Return a cohesive capsule of items for this scenario.",
    system: STYLIST_SYSTEM,
    prompt: scenarioGeneratePrompt({
      profile: toProfileSummary(profile),
      purchases,
      context,
      rawPrompt,
      maxPrice,
    }),
    maxTokens: 4096,
  });

  return persistBatch(userId, batch, {
    kind: "scenario",
    scenarioPrompt: rawPrompt,
    scenarioContext: context,
    currency: profile.currency,
  });
}
