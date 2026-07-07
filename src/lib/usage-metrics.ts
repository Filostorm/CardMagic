import { useEffect, useMemo, useRef } from "react";
import { AppState, Platform } from "react-native";

import { CARDMAGIC_APP_VERSION } from "@/lib/app-version";
import { supabase } from "@/lib/supabase";
import { createUuid } from "@/lib/uuid";

type UsageMetadata = Record<string, string | number | boolean | null | undefined>;

type ActiveUsageInterval = {
  screenName: string;
  screenGroup: string;
  metadata: UsageMetadata;
  startedAt: Date;
};

const usageSessionId = createUuid();
const MIN_USAGE_DURATION_MS = 1000;

function normalizeMetadata(metadata: UsageMetadata): Record<string, string> {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)]),
  );
}

function getAppPlatform() {
  return Platform.OS === "web" ? "web" : Platform.OS;
}

async function logCardMagicScreenUsage(interval: ActiveUsageInterval, endedAt: Date) {
  const durationMs = endedAt.getTime() - interval.startedAt.getTime();

  if (durationMs < MIN_USAGE_DURATION_MS) {
    return;
  }

  if (!supabase) {
    console.warn("CardMagic usage telemetry could not be logged because Supabase is not configured.");
    return;
  }

  const { error } = await supabase.rpc("log_cardmagic_screen_usage", {
    p_session_id: usageSessionId,
    p_screen_name: interval.screenName,
    p_screen_group: interval.screenGroup,
    p_app_platform: getAppPlatform(),
    p_app_version: CARDMAGIC_APP_VERSION,
    p_started_at: interval.startedAt.toISOString(),
    p_ended_at: endedAt.toISOString(),
    p_metadata: normalizeMetadata(interval.metadata),
  });

  if (error) {
    console.warn("CardMagic usage telemetry failed to log.", {
      screenName: interval.screenName,
      screenGroup: interval.screenGroup,
      error,
    });
  }
}

export function useCardMagicScreenUsage(
  screenName: string,
  screenGroup: string,
  metadata: UsageMetadata = {},
) {
  const metadataKey = JSON.stringify(normalizeMetadata(metadata));
  const normalizedMetadata = useMemo(() => normalizeMetadata(metadata), [metadataKey]);
  const activeIntervalRef = useRef<ActiveUsageInterval | null>(null);

  useEffect(() => {
    const previousInterval = activeIntervalRef.current;
    const nextInterval: ActiveUsageInterval = {
      screenName,
      screenGroup,
      metadata: normalizedMetadata,
      startedAt: new Date(),
    };

    activeIntervalRef.current = nextInterval;

    if (previousInterval) {
      void logCardMagicScreenUsage(previousInterval, nextInterval.startedAt);
    }

    return () => {
      if (activeIntervalRef.current !== nextInterval) {
        return;
      }

      activeIntervalRef.current = null;
      void logCardMagicScreenUsage(nextInterval, new Date());
    };
  }, [normalizedMetadata, screenGroup, screenName]);

  useEffect(() => {
    const flushCurrentInterval = () => {
      const currentInterval = activeIntervalRef.current;

      if (!currentInterval) {
        return;
      }

      const endedAt = new Date();
      activeIntervalRef.current = {
        ...currentInterval,
        startedAt: endedAt,
      };
      void logCardMagicScreenUsage(currentInterval, endedAt);
    };

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        flushCurrentInterval();
      }
    });
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushCurrentInterval();
      }
    };

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.addEventListener("pagehide", flushCurrentInterval);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      appStateSubscription.remove();
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.removeEventListener("pagehide", flushCurrentInterval);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      flushCurrentInterval();
    };
  }, []);
}
