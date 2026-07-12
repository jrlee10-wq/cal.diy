import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user?.id) redirect("/login");
  return user;
}

// Requires a completed style profile; sends to onboarding if missing.
export async function requireProfile(userId: string) {
  const profile = await prisma.styleProfile.findUnique({ where: { userId } });
  if (!profile) redirect("/onboarding");
  return profile;
}
