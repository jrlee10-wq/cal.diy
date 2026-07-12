"use client";

import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { scanEmailNow } from "@/app/actions";
import { Button } from "@/components/ui";

export function ScanButton() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function scan() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await scanEmailNow();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(
        `Scanned ${result.data.processed} email${result.data.processed === 1 ? "" : "s"}, found ${
          result.data.imported
        } item${result.data.imported === 1 ? "" : "s"}.`
      );
      router.refresh();
    });
  }

  return (
    <div>
      <Button onClick={scan} loading={pending} variant="secondary">
        <Mail className="size-4" />
        Scan my inbox
      </Button>
      {message && <p className="mt-2 text-sm text-green-700">{message}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
