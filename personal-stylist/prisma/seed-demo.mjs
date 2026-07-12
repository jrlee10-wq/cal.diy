// Seeds the demo user (demo@atelier.local) with a style profile, a sample
// recommendation, and a couple of inferred purchases — so the UI has content
// to show without calling Claude. Run: node prisma/seed-demo.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function shoppingUrl(query, brand) {
  const q = [brand, query].filter(Boolean).join(" ");
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}`;
}

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@atelier.local" },
    update: {},
    create: { email: "demo@atelier.local", name: "Demo" },
  });

  await prisma.styleProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      sizes: { tops: "M", bottoms: "32", shoes: "US 10", outerwear: "M" },
      fitPreferences: "Relaxed up top, slim-straight trousers, no cropped hems.",
      favoriteColors: ["olive", "cream", "navy", "tobacco"],
      styleTags: ["minimal", "elevated-basics", "smart-casual"],
      dislikes: ["loud logos", "skinny fit"],
      budget: { default: { min: 60, max: 280 } },
      currency: "USD",
      notes: "Mostly WFH with occasional client dinners. Prefer natural fabrics.",
      onboardedAt: new Date(),
    },
  });

  // A sample feed recommendation.
  const existing = await prisma.recommendation.findFirst({
    where: { userId: user.id, title: "Autumn essentials, quietly refined" },
  });
  if (!existing) {
    await prisma.recommendation.create({
      data: {
        userId: user.id,
        kind: "feed",
        title: "Autumn essentials, quietly refined",
        rationale:
          "Leaning into your olive/tobacco palette and elevated-basics leaning, with natural fabrics and a relaxed-but-sharp balance for WFH and client dinners alike.",
        season: "fall",
        status: "new",
        items: {
          create: [
            {
              name: "Ecru brushed-wool overshirt",
              category: "outerwear",
              brandSuggestion: "COS",
              estimatedPrice: 175,
              currency: "USD",
              shoppingUrl: shoppingUrl("brushed wool overshirt ecru", "COS"),
              whyItFits: "A relaxed layer in your palette that dresses up or down.",
              sortOrder: 0,
            },
            {
              name: "Tobacco pleated trousers",
              category: "bottoms",
              brandSuggestion: "Uniqlo U",
              estimatedPrice: 60,
              currency: "USD",
              shoppingUrl: shoppingUrl("pleated trousers tobacco", "Uniqlo U"),
              whyItFits: "Slim-straight with an easy pleat — sharp without being tight.",
              sortOrder: 1,
            },
            {
              name: "Cream merino crewneck",
              category: "tops",
              brandSuggestion: "Everlane",
              estimatedPrice: 98,
              currency: "USD",
              shoppingUrl: shoppingUrl("merino crewneck cream", "Everlane"),
              whyItFits: "Natural fabric, quiet color, layers under the overshirt.",
              sortOrder: 2,
            },
            {
              name: "Suede chukka boots, snuff",
              category: "shoes",
              brandSuggestion: "Clarks",
              estimatedPrice: 160,
              currency: "USD",
              shoppingUrl: shoppingUrl("suede chukka boots snuff", "Clarks"),
              whyItFits: "Warm-toned to tie the palette together; dinner-appropriate.",
              sortOrder: 3,
            },
          ],
        },
      },
    });
  }

  // A couple of inferred purchases (as if scanned from email).
  const purchases = [
    { itemName: "Oxford cloth button-down, blue", retailer: "J.Crew", category: "tops", price: 88 },
    { itemName: "Selvedge denim, rinse", retailer: "3sixteen", category: "bottoms", price: 220 },
  ];
  for (const p of purchases) {
    await prisma.purchase.upsert({
      where: {
        userId_sourceMessageId_itemName: {
          userId: user.id,
          sourceMessageId: `seed-${p.itemName}`,
          itemName: p.itemName,
        },
      },
      update: {},
      create: {
        userId: user.id,
        source: "gmail",
        sourceMessageId: `seed-${p.itemName}`,
        retailer: p.retailer,
        itemName: p.itemName,
        category: p.category,
        price: p.price,
        currency: "USD",
        purchasedAt: new Date(),
      },
    });
  }

  console.log("Seeded demo user:", user.email);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
