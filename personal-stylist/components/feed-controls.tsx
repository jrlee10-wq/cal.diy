"use client";

import { Sparkles, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { requestFeed } from "@/app/actions";
import { Button, Card, Input, Label } from "@/components/ui";
import { CATEGORY_OPTIONS } from "@/lib/stylist/types";
import { cn } from "@/lib/utils";

export function FeedControls() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [showFilters, setShowFilters] = React.useState(false);
  const [category, setCategory] = React.useState<string | null>(null);
  const [maxPrice, setMaxPrice] = React.useState("");

  function generate() {
    setError(null);
    startTransition(async () => {
      const result = await requestFeed({
        categoryFocus: category ?? undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mb-6">
      <div className="flex gap-2">
        <Button onClick={generate} loading={pending} className="flex-1">
          <Sparkles className="size-4" />
          Bring me new picks
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowFilters((s) => !s)}
          aria-label="Filters"
          className="px-4"
        >
          <SlidersHorizontal className="size-4" />
        </Button>
      </div>

      {showFilters && (
        <Card className="mt-3 p-4">
          <Label>Focus on a category</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(category === c ? null : c)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm capitalize transition-colors",
                  category === c
                    ? "border-[var(--accent)] bg-[var(--accent)] text-cream"
                    : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]"
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="mt-4 max-w-[180px]">
            <Label>Max price per item</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="e.g. 200"
            />
          </div>
        </Card>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
