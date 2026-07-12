// Builds real, clickable shopping links for recommended items. By default we
// deep-link into Google Shopping search; if SERPAPI_KEY is set we upgrade to a
// specific product (with image + real price) via SerpApi's Google Shopping API.

export function buildShoppingUrl(query: string, brand?: string): string {
  const q = [brand, query].filter(Boolean).join(" ").trim();
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}`;
}

export type SerpEnrichment = {
  shoppingUrl?: string;
  imageUrl?: string;
  price?: number;
};

export async function enrichWithSerpApi(query: string): Promise<SerpEnrichment | null> {
  const key = process.env.SERPAPI_KEY;
  if (!key) return null;
  try {
    const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(
      query
    )}&num=1&api_key=${key}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      shopping_results?: Array<{
        link?: string;
        product_link?: string;
        thumbnail?: string;
        extracted_price?: number;
      }>;
    };
    const first = data.shopping_results?.[0];
    if (!first) return null;
    return {
      shoppingUrl: first.product_link || first.link,
      imageUrl: first.thumbnail,
      price: typeof first.extracted_price === "number" ? first.extracted_price : undefined,
    };
  } catch {
    return null;
  }
}
