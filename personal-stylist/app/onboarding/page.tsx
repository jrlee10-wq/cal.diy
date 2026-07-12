import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile-form";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function OnboardingPage() {
  const user = await requireUser();
  const existing = await prisma.styleProfile.findUnique({ where: { userId: user.id } });
  if (existing) redirect("/feed");

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10">
      <header className="mb-8">
        <p className="text-sm uppercase tracking-widest text-[var(--muted)]">Welcome</p>
        <h1 className="font-display text-3xl mt-1">Let&apos;s learn your taste</h1>
        <p className="text-[var(--muted)] mt-2">
          A couple of minutes now means every recommendation lands right.
        </p>
      </header>

      <ProfileForm
        mode="onboarding"
        initial={{
          sizes: {},
          favoriteColors: [],
          styleTags: [],
          dislikes: [],
          budget: {},
          currency: "USD",
        }}
      />
    </main>
  );
}
