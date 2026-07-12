import { z } from "zod";
import type { StyleProfile } from "@prisma/client";

import type { ProfileSummary } from "@/lib/ai/prompts";

// Categories used across sizing, budgets, and recommendations.
export const CATEGORY_OPTIONS = [
  "tops",
  "bottoms",
  "outerwear",
  "shoes",
  "dress",
  "accessories",
  "bag",
] as const;

// Fields captured in the sizing step of onboarding.
export const SIZE_FIELDS = [
  { key: "tops", label: "Tops", placeholder: "M / 40" },
  { key: "bottoms", label: "Bottoms / waist", placeholder: "32" },
  { key: "dress", label: "Dress / suit", placeholder: "8 / 40R" },
  { key: "shoes", label: "Shoes", placeholder: "US 10" },
  { key: "outerwear", label: "Outerwear", placeholder: "M" },
] as const;

export const STYLE_TAG_OPTIONS = [
  "minimal",
  "classic",
  "streetwear",
  "preppy",
  "smart-casual",
  "workwear",
  "tailored",
  "bohemian",
  "athleisure",
  "avant-garde",
  "vintage",
  "elevated-basics",
] as const;

const BudgetBandSchema = z.object({
  min: z.number().nonnegative().optional(),
  max: z.number().nonnegative().optional(),
});

export const ProfileInputSchema = z.object({
  sizes: z.record(z.string(), z.string()).default({}),
  fitPreferences: z.string().max(500).optional(),
  favoriteColors: z.array(z.string()).default([]),
  styleTags: z.array(z.string()).default([]),
  dislikes: z.array(z.string()).default([]),
  budget: z.record(z.string(), BudgetBandSchema).default({}),
  currency: z.string().default("USD"),
  notes: z.string().max(1000).optional(),
});

export type ProfileInput = z.infer<typeof ProfileInputSchema>;

// Coerce a Prisma StyleProfile row (Json fields are `unknown`) into the typed
// shape the prompt builders expect.
export function toProfileSummary(profile: StyleProfile): ProfileSummary {
  return {
    sizes: (profile.sizes as Record<string, string>) ?? {},
    fitPreferences: profile.fitPreferences,
    favoriteColors: profile.favoriteColors ?? [],
    styleTags: profile.styleTags ?? [],
    dislikes: profile.dislikes ?? [],
    budget: (profile.budget as Record<string, { min?: number; max?: number }>) ?? {},
    currency: profile.currency,
    notes: profile.notes,
  };
}

// The single most relevant max-price constraint for a request.
export function maxBudgetFor(
  profile: StyleProfile,
  category?: string
): number | undefined {
  const budget = (profile.budget as Record<string, { min?: number; max?: number }>) ?? {};
  const band = (category && budget[category]) || budget.default;
  return band?.max;
}
