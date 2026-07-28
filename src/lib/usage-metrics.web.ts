import { useEffect } from "react";

type UsageMetadata = Record<
  string,
  string | number | boolean | null | undefined
>;

type CraftsmannMetricsApi = {
  version: string;
  setSurface(name: string, group: string): void;
};

declare global {
  interface Window {
    craftsmannMetrics?: CraftsmannMetricsApi;
  }
}

const TRACKER_URL =
  "https://metrics.craftsmannsoftware.com/tracker/v1.0.0.js";
const TRACKER_READY_EVENT = "craftsmann:metrics-ready";
const TRACKED_HOSTNAMES = new Set([
  "cardmagic.craftsmannsoftware.com",
  "craftsmannsoftware.com",
  "www.craftsmannsoftware.com",
]);

let trackerLoadPromise: Promise<CraftsmannMetricsApi> | null = null;
let didLogTrackerFailure = false;
let didLogUnsupportedHost = false;

function installedMetricsApi(): CraftsmannMetricsApi | null {
  const metrics = window.craftsmannMetrics;
  return metrics && typeof metrics.setSurface === "function" ? metrics : null;
}

function surfaceKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_./-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

function loadTracker(): Promise<CraftsmannMetricsApi> {
  const installed = installedMetricsApi();
  if (installed) {
    return Promise.resolve(installed);
  }

  if (trackerLoadPromise) {
    return trackerLoadPromise;
  }

  trackerLoadPromise = new Promise((resolve, reject) => {
    let timeoutId = 0;

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${TRACKER_URL}"]`,
    );
    const script = existingScript ?? document.createElement("script");

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(TRACKER_READY_EVENT, handleReady);
      script.removeEventListener("error", handleError);
    };

    const handleReady = () => {
      const metrics = installedMetricsApi();
      cleanup();

      if (!metrics) {
        reject(
          new Error(
            "Craftsmann Signal emitted its ready event without installing its public API.",
          ),
        );
        return;
      }

      resolve(metrics);
    };

    const handleError = () => {
      cleanup();
      reject(new Error(`CardMagic could not load ${TRACKER_URL}.`));
    };

    window.addEventListener(TRACKER_READY_EVENT, handleReady);
    script.addEventListener("error", handleError, { once: true });

    timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Craftsmann Signal did not initialize within 15 seconds."));
    }, 15_000);

    if (!existingScript) {
      script.src = TRACKER_URL;
      script.async = true;
      script.dataset.layoutVersion = "cardmagic-web-v1";
      document.head.appendChild(script);
    } else if (installedMetricsApi()) {
      handleReady();
    }
  });

  return trackerLoadPromise;
}

export function useCardMagicScreenUsage(
  screenName: string,
  screenGroup: string,
  _metadata: UsageMetadata = {},
) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!TRACKED_HOSTNAMES.has(window.location.hostname)) {
      if (!didLogUnsupportedHost) {
        didLogUnsupportedHost = true;
        console.info(
          "CardMagic Craftsmann telemetry is disabled on this non-production hostname.",
          { hostname: window.location.hostname },
        );
      }
      return;
    }

    let active = true;

    void loadTracker()
      .then((metrics) => {
        if (active) {
          metrics.setSurface(surfaceKey(screenName), surfaceKey(screenGroup));
        }
      })
      .catch((error) => {
        if (!didLogTrackerFailure) {
          didLogTrackerFailure = true;
          console.warn("CardMagic Craftsmann telemetry failed to initialize.", {
            error,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [screenGroup, screenName]);
}
