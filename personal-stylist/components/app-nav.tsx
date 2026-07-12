"use client";

import { Home, Plane, Settings, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/scenario", label: "Scenario", icon: Plane },
  { href: "/purchases", label: "Closet", icon: ShoppingBag },
  { href: "/settings", label: "Profile", icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-20 border-t border-[var(--border)] bg-[var(--card)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-stretch justify-around">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition-colors",
                active ? "text-[var(--accent)]" : "text-[var(--muted)]"
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
