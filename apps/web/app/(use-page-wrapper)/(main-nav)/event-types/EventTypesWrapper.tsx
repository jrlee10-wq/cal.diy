"use client";

import { useDebounce } from "@calcom/lib/hooks/useDebounce";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import type { AppRouter } from "@calcom/trpc/types/server/routers/_app";
import { Button } from "@calcom/ui/components/button";
import { showToast } from "@calcom/ui/components/toast";
import type { TRPCClientErrorLike } from "@trpc/client";
import { ShellMainAppDir } from "app/(use-page-wrapper)/(main-nav)/ShellMainAppDir";
import { useTheme as useNextTheme } from "next-themes";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import EventTypes, { EventTypesCTA, SearchContext } from "~/event-types/views/event-types-listing-view";

type GetUserEventGroupsResponse = Parameters<typeof EventTypesCTA>[0]["userEventGroupsData"];

const CTAWithContext = ({
  userEventGroupsData,
}: {
  userEventGroupsData: GetUserEventGroupsResponse;
}): ReactElement => {
  return <EventTypesCTA userEventGroupsData={userEventGroupsData} />;
};

const HomeThemeToggle = (): ReactElement => {
  const { t } = useLocale();
  const utils = trpc.useUtils();
  const { resolvedTheme, setTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);
  const mutation = trpc.viewer.me.updateProfile.useMutation();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted && resolvedTheme === "dark";
  let nextTheme: "dark" | "light" = "dark";
  let label = t("switch_to_dark_mode");
  let themeIcon: "moon" | "sun" = "moon";

  if (isDarkMode) {
    nextTheme = "light";
    label = t("switch_to_light_mode");
    themeIcon = "sun";
  }

  if (!mounted) {
    label = t("toggle_dark_mode");
  }

  return (
    <Button
      variant="icon"
      color="minimal"
      size="base"
      StartIcon={themeIcon}
      aria-label={label}
      tooltip={label}
      data-testid="home-theme-toggle"
      className="h-9 w-9 ltr:mr-2 rtl:ml-2"
      disabled={!mounted}
      loading={mutation.isPending}
      onClick={() => {
        let previousTheme: "dark" | "light" = "light";
        if (resolvedTheme === "dark") {
          previousTheme = "dark";
        }

        setTheme(nextTheme);
        mutation.mutate(
          { appTheme: nextTheme },
          {
            onError: (error: TRPCClientErrorLike<AppRouter>) => {
              setTheme(previousTheme);
              showToast(error.message || t("error_updating_settings"), "error");
            },
            onSettled: async () => {
              await utils.viewer.me.invalidate();
            },
          }
        );
      }}
    />
  );
};

export function EventTypesWrapper({
  userEventGroupsData,
  user,
}: {
  userEventGroupsData: GetUserEventGroupsResponse;
  user: {
    id: number;
    completedOnboarding?: boolean;
  } | null;
}): ReactElement {
  const { t } = useLocale();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm, debouncedSearchTerm }}>
      <ShellMainAppDir
        heading={t("event_types_page_title")}
        subtitle={t("event_types_page_subtitle")}
        beforeCTAactions={<HomeThemeToggle />}
        CTA={<CTAWithContext userEventGroupsData={userEventGroupsData} />}>
        <EventTypes userEventGroupsData={userEventGroupsData} user={user} />
      </ShellMainAppDir>
    </SearchContext.Provider>
  );
}
