import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export default async function Home() {
  const user = await getSessionUser();
  if (!user?.id) redirect("/login");

  const profile = await prisma.styleProfile.findUnique({ where: { userId: user.id } });
  redirect(profile ? "/feed" : "/onboarding");
}
