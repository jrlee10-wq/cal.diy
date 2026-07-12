import { z } from "zod";

// One suggested item. The model returns a `searchQuery` (brand + descriptor)
// and we build the actual shopping URL server-side so links are always valid.
export const RecommendedItemSchema = z.object({
  name: z.string().describe("Short human name for the item, e.g. 'Ecru linen blazer'"),
  category: z
    .string()
    .describe("One of: tops, bottoms, outerwear, shoes, dress, accessories, bag"),
  brandSuggestion: z.string().optional().describe("A brand that fits taste + budget"),
  estimatedPrice: z.number().optional().describe("Approx price in the user's currency"),
  searchQuery: z
    .string()
    .describe("Retailer search query to find this item, e.g. 'ecru linen blazer women'"),
  whyItFits: z.string().describe("One sentence tying this to the user's taste/scenario"),
});

export const RecommendationBatchSchema = z.object({
  title: z.string().describe("Short title for this set of recommendations"),
  rationale: z.string().describe("2-3 sentences on the thinking behind these picks"),
  items: z.array(RecommendedItemSchema).min(1).max(12),
});

export type RecommendationBatch = z.infer<typeof RecommendationBatchSchema>;

// Parsed structure of a free-text scenario like "Paris in April".
export const ScenarioContextSchema = z.object({
  destination: z.string().optional(),
  dateOrSeason: z.string().optional(),
  likelyWeather: z.string().optional(),
  occasion: z.string().optional(),
  formality: z.string().optional().describe("casual, smart-casual, business, formal"),
  summary: z.string().describe("One sentence framing of what to pack/wear"),
});

export type ScenarioContext = z.infer<typeof ScenarioContextSchema>;

// What the model extracts from a single order-confirmation email.
export const EmailPurchaseSchema = z.object({
  isOrder: z.boolean().describe("True only if this email confirms a clothing/apparel purchase"),
  retailer: z.string().optional(),
  purchasedAt: z.string().optional().describe("ISO 8601 date if present"),
  items: z
    .array(
      z.object({
        itemName: z.string(),
        category: z.string().optional(),
        price: z.number().optional(),
        currency: z.string().optional(),
        attributes: z
          .object({
            color: z.string().optional(),
            material: z.string().optional(),
            style: z.string().optional(),
          })
          .optional(),
      })
    )
    .default([]),
});

export type EmailPurchase = z.infer<typeof EmailPurchaseSchema>;
