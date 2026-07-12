import { NextResponse } from "next/server";

import { scanInbox } from "@/lib/email/PurchaseExtractionService";
import { prisma } from "@/lib/db";

export const maxDuration = 300;

// Daily inbox scan for every connected user. Triggered by Vercel Cron (see
// vercel.json), guarded by CRON_SECRET.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only users who have both a Google account (inbox access) and a profile.
  const users = await prisma.user.findMany({
    where: {
      profile: { isNot: null },
      accounts: { some: { provider: "google" } },
    },
    select: { id: true },
  });

  const results: Array<{ userId: string; processed?: number; imported?: number; error?: string }> = [];
  for (const user of users) {
    try {
      const r = await scanInbox(user.id, { maxMessages: 15 });
      results.push({ userId: user.id, ...r });
    } catch (error) {
      results.push({ userId: user.id, error: error instanceof Error ? error.message : "failed" });
    }
  }

  return NextResponse.json({ scanned: users.length, results });
}
