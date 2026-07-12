import { signOut } from "@/auth";
import { ProfileForm } from "@/components/profile-form";
import { Button } from "@/components/ui";
import { requireProfile, requireUser } from "@/lib/session";
import type { ProfileInput } from "@/lib/stylist/types";

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await requireProfile(user.id);

  const initial: ProfileInput = {
    sizes: (profile.sizes as Record<string, string>) ?? {},
    fitPreferences: profile.fitPreferences ?? undefined,
    favoriteColors: profile.favoriteColors ?? [],
    styleTags: profile.styleTags ?? [],
    dislikes: profile.dislikes ?? [],
    budget: (profile.budget as ProfileInput["budget"]) ?? {},
    currency: profile.currency,
    notes: profile.notes ?? undefined,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl">Profile</h1>
        <p className="text-[var(--muted)]">
          Signed in as {user.email}. Keep your taste and sizes current.
        </p>
      </div>

      <ProfileForm mode="settings" initial={initial} />

      <div className="mt-10 border-t border-[var(--border)] pt-6">
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button type="submit" variant="ghost" className="text-[var(--muted)]">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
