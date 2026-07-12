"use client";

import { Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { requestScenario } from "@/app/actions";
import { Button, Card, Textarea } from "@/components/ui";

const EXAMPLES = [
  "Traveling to Paris in April",
  "Client on-site next week, need a sharp outfit",
  "Beach wedding guest in July",
  "Weekend in the mountains, cold and casual",
];

export function ScenarioComposer() {
  const router = useRouter();
  const [prompt, setPrompt] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await requestScenario(prompt);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPrompt("");
      router.refresh();
    });
  }

  return (
    <Card className="mb-6 p-4">
      <Textarea
        rows={2}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the trip or occasion…"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setPrompt(ex)}
            className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)] hover:border-[var(--accent)]"
          >
            {ex}
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={submit} loading={pending}>
          <Wand2 className="size-4" />
          Style this
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Card>
  );
}
