import type { Prisma, StyleProfile } from "@prisma/client";

import { generateStructured } from "@/lib/ai/client";
import { STYLIST_SYSTEM, feedPrompt, type PurchaseSummary } from "@/lib/ai/prompts";
import { RecommendationBatchSchema, type RecommendationBatch } from "@/lib/ai/schemas";
import { prisma } from "@/lib/db";
import { currentSeason } from "@/lib/utils";

import { buildShoppingUrl, enrichWithSerpApi } from "./shopping";
import { maxBudgetFor, toProfileSummary } from "./types";

export class ProfileRequiredError extends Error {
  constructor() {
    super("PROFILE_REQUIRED");
    this.name = "ProfileRequiredError";
  }
}

export type StylistContext = {
  profile: StyleProfile;
  purchases: PurchaseSummary[];
};

export async function loadStylistContext(userId: string): Promise<StylistContext> {
  const profile = await prisma.styleProfile.findUnique({ where: { userId } });
  if (!profile) throw new ProfileRequiredError();
  const purchases = await prisma.purchase.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { itemName: true, retailer: true, category: true, attributes: true },
  });
  return { profile, purchases };
}

// Turns a model-generated batch into a persisted Recommendation, building a real
// shopping URL for every item (and enriching with a specific product if SerpApi
// is configured).
export async function persistBatch(
  userId: string,
  batch: RecommendationBatch,
  meta: {
    kind: "feed" | "scenario";
    season?: string;
    scenarioPrompt?: string;
    scenarioContext?: Prisma.InputJsonValue;
    currency: string;
  }
) {
  const items = await Promise.all(
    batch.items.map(async (item, index) => {
      const query = [item.brandSuggestion, item.searchQuery].filter(Boolean).join(" ");
      const enrichment = await enrichWithSerpApi(query);
      return {
        name: item.name,
        category: item.category,
        brandSuggestion: item.brandSuggestion,
        estimatedPrice: enrichment?.price ?? item.estimatedPrice,
        currency: meta.currency,
        shoppingUrl: enrichment?.shoppingUrl ?? buildShoppingUrl(item.searchQuery, item.brandSuggestion),
        imageUrl: enrichment?.imageUrl,
        whyItFits: item.whyItFits,
        sortOrder: index,
      };
    })
  );

  return prisma.recommendation.create({
    data: {
      userId,
      kind: meta.kind,
      title: batch.title,
      rationale: batch.rationale,
      season: meta.season,
      scenarioPrompt: meta.scenarioPrompt,
      scenarioContext: meta.scenarioContext,
      items: { create: items },
    },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function generateFeed(
  userId: string,
  opts?: { count?: number; categoryFocus?: string; maxPrice?: number }
) {
  const { profile, purchases } = await loadStylistContext(userId);
  const season = currentSeason();
  const maxPrice = opts?.maxPrice ?? maxBudgetFor(profile, opts?.categoryFocus);

  const batch = await generateStructured({
    schema: RecommendationBatchSchema,
    toolName: "return_recommendations",
    toolDescription: "Return a curated set of clothing recommendations for the client.",
    system: STYLIST_SYSTEM,
    prompt: feedPrompt({
      profile: toProfileSummary(profile),
      purchases,
      season,
      count: opts?.count ?? 6,
      categoryFocus: opts?.categoryFocus,
      maxPrice,
    }),
    maxTokens: 4096,
  });

  return persistBatch(userId, batch, { kind: "feed", season, currency: profile.currency });
}
