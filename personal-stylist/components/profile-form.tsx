"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { saveProfile } from "@/app/actions";
import { ChipMultiSelect, TagInput } from "@/components/chip-select";
import { Button, Input, Label, Textarea } from "@/components/ui";
import type { ProfileInput } from "@/lib/stylist/types";
import { SIZE_FIELDS, STYLE_TAG_OPTIONS } from "@/lib/stylist/types";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"];

export type ProfileFormInitial = ProfileInput;

export function ProfileForm({
  initial,
  mode,
}: {
  initial: ProfileFormInitial;
  mode: "onboarding" | "settings";
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const [sizes, setSizes] = React.useState<Record<string, string>>(initial.sizes ?? {});
  const [fitPreferences, setFit] = React.useState(initial.fitPreferences ?? "");
  const [favoriteColors, setColors] = React.useState<string[]>(initial.favoriteColors ?? []);
  const [styleTags, setStyleTags] = React.useState<string[]>(initial.styleTags ?? []);
  const [dislikes, setDislikes] = React.useState<string[]>(initial.dislikes ?? []);
  const [currency, setCurrency] = React.useState(initial.currency ?? "USD");
  const [budgetMin, setBudgetMin] = React.useState(
    initial.budget?.default?.min != null ? String(initial.budget.default.min) : ""
  );
  const [budgetMax, setBudgetMax] = React.useState(
    initial.budget?.default?.max != null ? String(initial.budget.default.max) : ""
  );
  const [notes, setNotes] = React.useState(initial.notes ?? "");

  function submit() {
    setError(null);
    setSaved(false);

    const band: { min?: number; max?: number } = {};
    if (budgetMin) band.min = Number(budgetMin);
    if (budgetMax) band.max = Number(budgetMax);

    const payload: ProfileInput = {
      sizes,
      fitPreferences: fitPreferences || undefined,
      favoriteColors,
      styleTags,
      dislikes,
      currency,
      budget: Object.keys(band).length ? { default: band } : {},
      notes: notes || undefined,
    };

    startTransition(async () => {
      const result = await saveProfile(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (mode === "onboarding") {
        router.push("/feed");
      } else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-xl mb-1">Your sizes</h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          So recommendations always come in a size that fits.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SIZE_FIELDS.map((field) => (
            <div key={field.key}>
              <Label>{field.label}</Label>
              <Input
                value={sizes[field.key] ?? ""}
                placeholder={field.placeholder}
                onChange={(e) => setSizes({ ...sizes, [field.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl mb-1">Your taste</h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          Pick the vibes that feel like you.
        </p>
        <Label>Style</Label>
        <ChipMultiSelect options={STYLE_TAG_OPTIONS} value={styleTags} onChange={setStyleTags} />
        <div className="mt-4">
          <Label>Favorite colors</Label>
          <TagInput value={favoriteColors} onChange={setColors} placeholder="e.g. olive, cream" />
        </div>
        <div className="mt-4">
          <Label>Things to avoid</Label>
          <TagInput value={dislikes} onChange={setDislikes} placeholder="e.g. logos, skinny fit" />
        </div>
        <div className="mt-4">
          <Label>Fit notes</Label>
          <Textarea
            rows={2}
            value={fitPreferences}
            onChange={(e) => setFit(e.target.value)}
            placeholder="e.g. relaxed up top, slim trousers, no cropped hems"
          />
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl mb-1">Budget</h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          Your comfortable spend per item. Used as a hard filter on recommendations.
        </p>
        <div className="flex items-end gap-3">
          <div className="w-28">
            <Label>Currency</Label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 h-11 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <Label>Min</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              placeholder="50"
            />
          </div>
          <div className="flex-1">
            <Label>Max</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              placeholder="300"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl mb-1">Anything else</h2>
        <Textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Body notes, brands you love, lifestyle (e.g. mostly WFH, occasional client dinners)…"
        />
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-700">Saved.</p>}

      <div className="flex items-center gap-3">
        <Button onClick={submit} loading={pending} size="lg">
          {mode === "onboarding" ? "Start styling" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
