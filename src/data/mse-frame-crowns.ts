import type { FrameTreatment } from "@/types/card";

export type MseM15LegendaryCrownFamily =
  | "standard"
  | "borderless"
  | "nyx"
  | "godzillaAlias"
  | "borderlessGodzillaLegendary";

export function getMseM15LegendaryCrownFamily(
  treatment: FrameTreatment,
  isNyx: boolean,
  options: { usesGodzillaAlias?: boolean } = {},
): MseM15LegendaryCrownFamily {
  if (options.usesGodzillaAlias && treatment === "borderless") {
    return "borderlessGodzillaLegendary";
  }

  if (options.usesGodzillaAlias) {
    return "godzillaAlias";
  }

  if (treatment === "borderless") {
    return "borderless";
  }

  return isNyx ? "nyx" : "standard";
}
