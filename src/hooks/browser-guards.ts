import { useEffect, useState } from "react";
import { Platform } from "react-native";

export function useMobileWebInputZoomGuard() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      return;
    }

    const existingViewport = document.querySelector('meta[name="viewport"]');
    const viewportMeta = existingViewport ?? document.createElement("meta");
    const previousContent = viewportMeta.getAttribute("content");
    const createdViewportMeta = existingViewport === null;

    if (createdViewportMeta) {
      viewportMeta.setAttribute("name", "viewport");
      document.head.appendChild(viewportMeta);
    }

    viewportMeta.setAttribute(
      "content",
      "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no",
    );

    return () => {
      if (createdViewportMeta) {
        viewportMeta.remove();
        return;
      }

      if (previousContent !== null) {
        viewportMeta.setAttribute("content", previousContent);
      }
    };
  }, []);
}

export function useMobileBrowserBottomInset(viewportWidth: number) {
  const [bottomInset, setBottomInset] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      setBottomInset(0);
      return;
    }

    const visualViewport = window.visualViewport;
    const isCompactViewport = viewportWidth <= 700;
    const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent;
    const isMobileBrowser = /\b(iPhone|iPod|Android|Mobile)\b/i.test(userAgent);
    const fallbackInset = isCompactViewport && isMobileBrowser ? 6 : 0;

    const updateInset = () => {
      const measuredInset = visualViewport
        ? Math.max(0, window.innerHeight - visualViewport.height - visualViewport.offsetTop)
        : 0;
      const nextInset = Math.min(12, Math.round(Math.max(measuredInset * 0.12, fallbackInset)));

      setBottomInset((current) => (current === nextInset ? current : nextInset));
    };

    updateInset();
    visualViewport?.addEventListener("resize", updateInset);
    visualViewport?.addEventListener("scroll", updateInset);
    window.addEventListener("resize", updateInset);
    window.addEventListener("orientationchange", updateInset);

    return () => {
      visualViewport?.removeEventListener("resize", updateInset);
      visualViewport?.removeEventListener("scroll", updateInset);
      window.removeEventListener("resize", updateInset);
      window.removeEventListener("orientationchange", updateInset);
    };
  }, [viewportWidth]);

  return bottomInset;
}

export function useWebTextSelectionGuard() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      return;
    }

    const styleElement = document.createElement("style");

    styleElement.setAttribute("data-cardmagic-selection-guard", "true");
    styleElement.textContent = `
      html,
      body,
      #root,
      #root *:not(input):not(textarea):not([contenteditable="true"]):not([contenteditable="true"] *) {
        -webkit-touch-callout: none !important;
        -webkit-user-select: none !important;
        user-select: none !important;
      }

      #root input,
      #root textarea,
      #root [contenteditable="true"],
      #root [contenteditable="true"] *,
      #root [role="textbox"] {
        -webkit-touch-callout: default !important;
        -webkit-user-select: text !important;
        user-select: text !important;
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      styleElement.remove();
    };
  }, []);
}
