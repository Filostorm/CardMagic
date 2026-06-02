import type { ImageSourcePropType } from "react-native";

import type { FrameIdentity, FrameTreatment } from "@/types/card";

type MseM15TreatmentSourceMap = Record<FrameIdentity, ImageSourcePropType>;
type MseM15TreatmentSourceFamily =
  | "borderless"
  | "fullArt"
  | "extendedArt"
  | "textless"
  | "retro"
  | "showcase"
  | "etchedFoil";

const treatmentSourceLoaders: Record<MseM15TreatmentSourceFamily, () => MseM15TreatmentSourceMap> = {
  borderless: () => ({
    white: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/borderless-normal-height/masked/white.png"),
    blue: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/borderless-normal-height/masked/blue.png"),
    black: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/borderless-normal-height/masked/black.png"),
    red: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/borderless-normal-height/masked/red.png"),
    green: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/borderless-normal-height/masked/green.png"),
    gold: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/borderless-normal-height/masked/gold.png"),
    artifact: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/borderless-normal-height/masked/artifact.png"),
    land: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/borderless-normal-height/masked/land.png"),
    colorless: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/borderless-normal-height/masked/colorless.png"),
  }),
  fullArt: () => ({
    white: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/full-art/masked/white.png"),
    blue: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/full-art/masked/blue.png"),
    black: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/full-art/masked/black.png"),
    red: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/full-art/masked/red.png"),
    green: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/full-art/masked/green.png"),
    gold: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/full-art/masked/gold.png"),
    artifact: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/full-art/masked/artifact.png"),
    land: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/full-art/masked/land.png"),
    colorless: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/full-art/masked/colorless.png"),
  }),
  extendedArt: () => ({
    white: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/extended-art/masked/white.png"),
    blue: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/extended-art/masked/blue.png"),
    black: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/extended-art/masked/black.png"),
    red: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/extended-art/masked/red.png"),
    green: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/extended-art/masked/green.png"),
    gold: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/extended-art/masked/gold.png"),
    artifact: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/extended-art/masked/artifact.png"),
    land: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/extended-art/masked/land.png"),
    colorless: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/extended-art/masked/colorless.png"),
  }),
  textless: () => ({
    white: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/authentic/white.png"),
    blue: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/authentic/blue.png"),
    black: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/authentic/black.png"),
    red: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/authentic/red.png"),
    green: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/authentic/green.png"),
    gold: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/authentic/gold.png"),
    artifact: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/authentic/artifact.png"),
    land: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/authentic/land.png"),
    colorless: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/authentic/colorless.png"),
  }),
  retro: () => ({
    white: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/white.jpg"),
    blue: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/blue.jpg"),
    black: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/black.jpg"),
    red: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/red.jpg"),
    green: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/green.jpg"),
    gold: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/gold.jpg"),
    artifact: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/artifact.jpg"),
    land: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/land.jpg"),
    colorless: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/colorless.jpg"),
  }),
  showcase: () => ({
    white: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/showcase-zendikar/masked/white.png"),
    blue: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/showcase-zendikar/masked/blue.png"),
    black: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/showcase-zendikar/masked/black.png"),
    red: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/showcase-zendikar/masked/red.png"),
    green: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/showcase-zendikar/masked/green.png"),
    gold: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/showcase-zendikar/masked/gold.png"),
    artifact: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/showcase-zendikar/masked/artifact.png"),
    land: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/showcase-zendikar/masked/land.png"),
    colorless: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/showcase-zendikar/masked/colorless.png"),
  }),
  etchedFoil: () => ({
    white: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/etched-foil/masked/white.png"),
    blue: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/etched-foil/masked/blue.png"),
    black: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/etched-foil/masked/black.png"),
    red: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/etched-foil/masked/red.png"),
    green: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/etched-foil/masked/green.png"),
    gold: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/etched-foil/masked/gold.png"),
    artifact: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/etched-foil/masked/artifact.png"),
    land: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/etched-foil/masked/land.png"),
    colorless: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/etched-foil/masked/colorless.png"),
  }),
};

const treatmentSourceCache: Partial<Record<MseM15TreatmentSourceFamily, MseM15TreatmentSourceMap>> = {};

function isLazyTreatmentFamily(treatment: FrameTreatment): treatment is MseM15TreatmentSourceFamily {
  return treatment in treatmentSourceLoaders;
}

function getTreatmentSourceMap(treatment: MseM15TreatmentSourceFamily): MseM15TreatmentSourceMap {
  treatmentSourceCache[treatment] ??= treatmentSourceLoaders[treatment]();

  return treatmentSourceCache[treatment];
}

export function getMseM15TreatmentFamilySource(
  treatment: FrameTreatment,
  frameIdentity: FrameIdentity,
): ImageSourcePropType | null {
  if (!isLazyTreatmentFamily(treatment)) {
    return null;
  }

  return getTreatmentSourceMap(treatment)[frameIdentity];
}

export function getMseM15StampedTreatmentFamilySource(
  treatment: FrameTreatment,
  frameIdentity: FrameIdentity,
): ImageSourcePropType | null {
  return treatment === "borderless"
    ? getTreatmentSourceMap("borderless")[frameIdentity]
    : null;
}
