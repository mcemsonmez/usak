"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

/** Product analytics, pageviews and session replay. Does nothing without a PostHog key. */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || posthog.__loaded) return;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      capture_pageview: "history_change",
      person_profiles: "identified_only",
    });
  }, []);
  return <>{children}</>;
}
