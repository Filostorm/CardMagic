import { CREDIT_SPEND_COSTS } from "@/lib/progression";

// Art-image generation quality options and the derived quality union, plus the
// art-library thumbnail cap. Extracted from App.tsx so the art/generator
// component modules and App can share a single source of truth.

export const ART_IMAGE_QUALITY_OPTIONS = [
  {
    value: "medium",
    label: "Medium",
    detail: `${CREDIT_SPEND_COSTS.artImage} credits`,
    spendCategory: "artImage",
  },
  {
    value: "high",
    label: "High",
    detail: `${CREDIT_SPEND_COSTS.artImageHigh} credits`,
    spendCategory: "artImageHigh",
  },
] as const;

export type ArtImageQuality = (typeof ART_IMAGE_QUALITY_OPTIONS)[number]["value"];

export const ART_LIBRARY_VISIBLE_THUMBNAIL_LIMIT = 32;
