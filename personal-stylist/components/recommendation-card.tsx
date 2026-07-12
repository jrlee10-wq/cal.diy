"use client";

import { Bookmark, BookmarkCheck, ExternalLink, X } from "lucide-react";
import * as React from "react";

import { setRecommendationStatus } from "@/app/actions";
import { Badge, Card } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

export type ItemView = {
  id: string;
  name: string;
  category: string | null;
  brandSuggestion: string | null;
  estimatedPrice: number | null;
  currency: string | null;
  shoppingUrl: string;
  imageUrl: string | null;
  whyItFits: string | null;
};

export type RecommendationView = {
  id: string;
  title: string;
  rationale: string | null;
  kind: string;
  status: string;
  scenarioPrompt: string | null;
  createdAt: string | Date;
  items: ItemView[];
};

function ItemRow({ item }: { item: ItemView }) {
  return (
    <a
      href={item.shoppingUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 rounded-xl p-2 transition-colors hover:bg-black/[.03]"
    >
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)]">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />
        ) : (
          <span className="font-display text-lg text-[var(--muted)]">
            {(item.category ?? item.name).charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-medium">{item.name}</p>
          <span className="shrink-0 text-sm text-[var(--muted)]">
            {formatPrice(item.estimatedPrice, item.currency ?? "USD")}
          </span>
        </div>
        {item.brandSuggestion && (
          <p className="text-xs text-[var(--muted)]">{item.brandSuggestion}</p>
        )}
        {item.whyItFits && (
          <p className="mt-0.5 line-clamp-2 text-sm text-[var(--muted)]">{item.whyItFits}</p>
        )}
      </div>
      <ExternalLink className="mt-1 size-4 shrink-0 text-[var(--muted)] opacity-0 transition-opacity group-hover:opacity-100" />
    </a>
  );
}

export function RecommendationCard({ rec }: { rec: RecommendationView }) {
  const [pending, startTransition] = React.useTransition();
  const [status, setStatus] = React.useState(rec.status);
  const [hidden, setHidden] = React.useState(false);

  if (hidden) return null;

  function update(next: "saved" | "dismissed" | "new") {
    startTransition(async () => {
      const result = await setRecommendationStatus(rec.id, next);
      if (result.ok) {
        if (next === "dismissed") setHidden(true);
        else setStatus(next);
      }
    });
  }

  const saved = status === "saved";

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          {rec.kind === "scenario" && rec.scenarioPrompt && (
            <Badge className="mb-2">{rec.scenarioPrompt}</Badge>
          )}
          <h3 className="font-display text-xl leading-tight">{rec.title}</h3>
          {rec.rationale && (
            <p className="mt-1 text-sm text-[var(--muted)]">{rec.rationale}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => update(saved ? "new" : "saved")}
            disabled={pending}
            aria-label={saved ? "Unsave" : "Save"}
            className="rounded-full p-2 text-[var(--muted)] hover:bg-black/[.05]"
          >
            {saved ? (
              <BookmarkCheck className="size-5 text-[var(--accent)]" />
            ) : (
              <Bookmark className="size-5" />
            )}
          </button>
          <button
            onClick={() => update("dismissed")}
            disabled={pending}
            aria-label="Dismiss"
            className="rounded-full p-2 text-[var(--muted)] hover:bg-black/[.05]"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {rec.items.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </div>
    </Card>
  );
}
