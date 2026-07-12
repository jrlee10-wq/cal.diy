import { redirect } from "next/navigation";

import { signIn } from "@/auth";
import { Button } from "@/components/ui";
import { getSessionUser } from "@/lib/session";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user?.id) redirect("/");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-8 flex size-14 items-center justify-center rounded-2xl bg-ink text-cream font-display text-3xl">
          A
        </div>
        <h1 className="font-display text-4xl mb-3">Atelier</h1>
        <p className="text-[var(--muted)] mb-10 leading-relaxed">
          Your personal tastemaker. Recommendations brought to you — tuned to your sizes,
          taste, budget, and wherever life is taking you next.
        </p>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <Button type="submit" size="lg" className="w-full">
            Continue with Google
          </Button>
        </form>

        <p className="mt-6 text-xs text-[var(--muted)] leading-relaxed">
          We request read-only inbox access so your stylist can learn from what you&apos;ve
          already bought. You can skip email scanning anytime.
        </p>
      </div>
    </main>
  );
}
