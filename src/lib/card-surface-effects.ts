import type { ImageSourcePropType } from "react-native";

export type CardFoilKind = "none" | "rainbow" | "etched" | "cosmos" | "metal";

export type CardMaskKind =
  | "none"
  | "full"
  | "art"
  | "frame"
  | "rules"
  | "border"
  | "custom";

export type CardFoilSpec = {
  kind: CardFoilKind;
  intensity: number;
  opacity: number;
  mask: CardMaskKind;
};

export type CardMaskSpec = {
  kind: CardMaskKind;
  imageUri?: string;
  source?: ImageSourcePropType;
  strength: number;
};

export type CardSurfaceEffects = {
  foil?: CardFoilSpec;
  mask?: CardMaskSpec;
};

export const EMPTY_CARD_SURFACE_EFFECTS: CardSurfaceEffects = {
  foil: {
    kind: "none",
    intensity: 0,
    opacity: 0,
    mask: "none",
  },
  mask: {
    kind: "none",
    strength: 0,
  },
};

export function hasCardSurfaceEffects(effects?: CardSurfaceEffects): boolean {
  if (!effects) {
    return false;
  }

  return (
    Boolean(effects.foil && effects.foil.kind !== "none" && effects.foil.opacity > 0) ||
    Boolean(effects.mask && effects.mask.kind !== "none" && effects.mask.strength > 0)
  );
}
