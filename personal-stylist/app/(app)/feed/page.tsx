import { Sparkles } from "lucide-react";

import { FeedControls } from "@/components/feed-controls";
import { RecommendationCard } from "@/components/recommendation-card";
import { prisma } from "@/lib/db";
import { requireProfile, requireUser } from "@/lib/session";

export default async function FeedPage() {
  const user = await requireUser();
  await requireProfile(user.id);

  const recs = await prisma.recommendation.findMany({
    where: { userId: user.id, kind: "feed", status: { not: "dismissed" } },
    orderBy: { createdAt: "desc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
    take: 30,
  });

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-3xl">Your feed</h1>
        <p className="text-[var(--muted)]">Curated picks for the season, tuned to your taste.</p>
      </div>

      <FeedControls />

      {recs.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-black/[.04]">
            <Sparkles className="size-6 text-[var(--accent)]" />
          </div>
          <p className="font-display text-xl">No picks yet</p>
          <p className="mt-1 max-w-xs text-sm text-[var(--muted)]">
            Tap “Bring me new picks” and your stylist will put together a set just for you.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recs.map((rec) => (
            <RecommendationCard
              key={rec.id}
              rec={{
                id: rec.id,
                title: rec.title,
                rationale: rec.rationale,
                kind: rec.kind,
                status: rec.status,
                scenarioPrompt: rec.scenarioPrompt,
                createdAt: rec.createdAt.toISOString(),
                items: rec.items.map((i) => ({
                  id: i.id,
                  name: i.name,
                  category: i.category,
                  brandSuggestion: i.brandSuggestion,
                  estimatedPrice: i.estimatedPrice,
                  currency: i.currency,
                  shoppingUrl: i.shoppingUrl,
                  imageUrl: i.imageUrl,
                  whyItFits: i.whyItFits,
                })),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
