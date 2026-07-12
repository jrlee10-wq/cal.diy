"use client";

import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export function ChipMultiSelect({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  function toggle(option: string) {
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm capitalize transition-colors",
              active
                ? "border-[var(--accent)] bg-[var(--accent)] text-cream"
                : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = React.useState("");

  function add() {
    const t = draft.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 h-11 text-sm outline-none focus:border-[var(--accent)]"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-xl border border-[var(--border)] px-4 text-sm hover:bg-black/[.03]"
        >
          Add
        </button>
      </div>
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2.5 py-1 text-sm"
            >
              {tag}
              <button type="button" onClick={() => onChange(value.filter((v) => v !== tag))}>
                <X className="size-3.5 text-[var(--muted)]" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
