import Link from "next/link";

import { AppNav } from "@/components/app-nav";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-center px-5">
          <Link href="/feed" className="font-display text-xl tracking-tight">
            Atelier
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-6">{children}</div>

      <AppNav />
    </div>
  );
}
