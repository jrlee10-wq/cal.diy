import { RecommendationCard } from "@/components/recommendation-card";
import { ScenarioComposer } from "@/components/scenario-composer";
import { prisma } from "@/lib/db";
import { requireProfile, requireUser } from "@/lib/session";

export default async function ScenarioPage() {
  const user = await requireUser();
  await requireProfile(user.id);

  const recs = await prisma.recommendation.findMany({
    where: { userId: user.id, kind: "scenario", status: { not: "dismissed" } },
    orderBy: { createdAt: "desc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
    take: 20,
  });

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-3xl">Style a moment</h1>
        <p className="text-[var(--muted)]">
          A trip, a meeting, an event — get a capsule built for it.
        </p>
      </div>

      <ScenarioComposer />

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
    </div>
  );
}
