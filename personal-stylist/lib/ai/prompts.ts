import type { ScenarioContext } from "./schemas";

export type ProfileSummary = {
  sizes: Record<string, string>;
  fitPreferences?: string | null;
  favoriteColors: string[];
  styleTags: string[];
  dislikes: string[];
  budget: Record<string, { min?: number; max?: number }>;
  currency: string;
  notes?: string | null;
};

export type PurchaseSummary = {
  itemName: string;
  retailer?: string | null;
  category?: string | null;
  attributes?: unknown;
};

export const STYLIST_SYSTEM = `You are an expert personal stylist and tastemaker for a single client.
You know fashion across price points, seasonality, fit, and how to build cohesive wardrobes.
Your job is to bring the client great, specific recommendations so they don't have to shop.
Always respect the client's budget as a hard constraint, honor their stated taste and dislikes,
and prefer specific, real, currently-buyable garments and brands over vague descriptions.
Recommendations should feel curated and personal, not generic.`;

function budgetLine(budget: ProfileSummary["budget"], currency: string): string {
  const entries = Object.entries(budget ?? {});
  if (entries.length === 0) return "No explicit budget — assume mid-range, sensible spend.";
  return entries
    .map(([cat, band]) => {
      const min = band?.min != null ? `${band.min}` : "";
      const max = band?.max != null ? `${band.max}` : "";
      const range = min && max ? `${min}-${max}` : max ? `up to ${max}` : min ? `${min}+` : "any";
      return `${cat}: ${range} ${currency}`;
    })
    .join("; ");
}

export function buildProfileBlock(p: ProfileSummary): string {
  const sizes = Object.entries(p.sizes ?? {})
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
  return [
    "CLIENT PROFILE",
    `- Sizes: ${sizes || "not provided"}`,
    `- Fit preferences: ${p.fitPreferences || "none stated"}`,
    `- Favorite colors: ${p.favoriteColors?.join(", ") || "none stated"}`,
    `- Style tags: ${p.styleTags?.join(", ") || "none stated"}`,
    `- Dislikes / avoid: ${p.dislikes?.join(", ") || "none stated"}`,
    `- Budget (${p.currency}): ${budgetLine(p.budget, p.currency)}`,
    p.notes ? `- Notes: ${p.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildPurchasesBlock(purchases: PurchaseSummary[]): string {
  if (!purchases || purchases.length === 0) {
    return "KNOWN PURCHASES\n- None yet (no email history scanned).";
  }
  const lines = purchases
    .slice(0, 40)
    .map((p) => {
      const attrs =
        p.attributes && typeof p.attributes === "object"
          ? ` (${Object.values(p.attributes as Record<string, string>)
              .filter(Boolean)
              .join(", ")})`
          : "";
      return `- ${p.itemName}${p.category ? ` [${p.category}]` : ""}${
        p.retailer ? ` from ${p.retailer}` : ""
      }${attrs}`;
    })
    .join("\n");
  return `KNOWN PURCHASES (use to infer taste; avoid recommending near-duplicates)\n${lines}`;
}

export function feedPrompt(args: {
  profile: ProfileSummary;
  purchases: PurchaseSummary[];
  season: string;
  count: number;
  categoryFocus?: string;
  maxPrice?: number;
}): string {
  const { profile, purchases, season, count, categoryFocus, maxPrice } = args;
  return `${buildProfileBlock(profile)}

${buildPurchasesBlock(purchases)}

TASK
Recommend ${count} items for the current season (${season}) that fit this client's taste and budget.
${categoryFocus ? `Focus on the "${categoryFocus}" category.` : "Build a cohesive mix across categories."}
${maxPrice ? `Every item must cost at most ${maxPrice} ${profile.currency}.` : ""}
For each item give a concrete searchQuery a shopper could paste into a store search.
Vary brands and price points within budget. Do not repeat items the client already owns.`;
}

export function scenarioParsePrompt(input: string): string {
  return `Parse this styling request into structured context.
If a place and time are given, infer the likely weather and typical occasion/formality.

REQUEST: "${input}"`;
}

export function scenarioGeneratePrompt(args: {
  profile: ProfileSummary;
  purchases: PurchaseSummary[];
  context: ScenarioContext;
  rawPrompt: string;
  maxPrice?: number;
}): string {
  const { profile, purchases, context, rawPrompt, maxPrice } = args;
  return `${buildProfileBlock(profile)}

${buildPurchasesBlock(purchases)}

SCENARIO
- Request: "${rawPrompt}"
- Destination: ${context.destination || "n/a"}
- When: ${context.dateOrSeason || "n/a"}
- Likely weather: ${context.likelyWeather || "n/a"}
- Occasion: ${context.occasion || "n/a"}
- Formality: ${context.formality || "n/a"}
- Framing: ${context.summary}

TASK
Build a tight, cohesive capsule for this scenario that works with what the client likely already owns.
Recommend items to buy (not things they already have), each within budget${
    maxPrice ? ` and at most ${maxPrice} ${profile.currency}` : ""
  }.
Give each item a concrete searchQuery. Keep the set mix-and-match friendly.`;
}

export function emailExtractionPrompt(args: { subject: string; from: string; snippet: string; body: string }): string {
  const { subject, from, snippet, body } = args;
  return `Extract clothing/apparel purchases from this email. If it is NOT a clothing purchase
confirmation (e.g. it's marketing, shipping-only with no items, or a non-apparel order), set isOrder=false
and return an empty items array.

FROM: ${from}
SUBJECT: ${subject}
SNIPPET: ${snippet}
BODY:
${body.slice(0, 6000)}`;
}
