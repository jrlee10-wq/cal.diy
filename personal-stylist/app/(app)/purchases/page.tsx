import { ShoppingBag } from "lucide-react";

import { ScanButton } from "@/components/scan-button";
import { Badge, Card } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireProfile, requireUser } from "@/lib/session";
import { formatPrice } from "@/lib/utils";

export default async function PurchasesPage() {
  const user = await requireUser();
  await requireProfile(user.id);

  const [purchases, scan] = await Promise.all([
    prisma.purchase.findMany({
      where: { userId: user.id },
      orderBy: [{ purchasedAt: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.emailScan.findUnique({ where: { userId: user.id } }),
  ]);

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-3xl">Your closet</h1>
        <p className="text-[var(--muted)]">
          What we&apos;ve learned from your inbox. This sharpens every recommendation.
        </p>
      </div>

      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium">Learn from purchase emails</p>
            <p className="text-sm text-[var(--muted)]">
              {scan?.lastScannedAt
                ? `Last scanned ${new Date(scan.lastScannedAt).toLocaleDateString()}`
                : "Read-only. We only look for order confirmations."}
            </p>
          </div>
          <ScanButton />
        </div>
      </Card>

      {purchases.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-black/[.04]">
            <ShoppingBag className="size-6 text-[var(--accent)]" />
          </div>
          <p className="font-display text-xl">Nothing here yet</p>
          <p className="mt-1 max-w-xs text-sm text-[var(--muted)]">
            Scan your inbox to build your closet from what you&apos;ve already bought.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {purchases.map((p) => (
            <Card key={p.id} className="flex items-center justify-between gap-3 p-3.5">
              <div className="min-w-0">
                <p className="truncate font-medium">{p.itemName}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                  {p.retailer && <span>{p.retailer}</span>}
                  {p.category && <Badge>{p.category}</Badge>}
                  {p.purchasedAt && <span>{new Date(p.purchasedAt).toLocaleDateString()}</span>}
                </div>
              </div>
              <span className="shrink-0 text-sm text-[var(--muted)]">
                {formatPrice(p.price, p.currency ?? "USD")}
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
