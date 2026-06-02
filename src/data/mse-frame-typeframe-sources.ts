import type { ImageSourcePropType } from "react-native";

import type { FrameIdentity } from "@/types/card";

type MseM15TypeFrameFamily = "saga" | "planeswalker";
type MseM15TypeFrameSourceMap = Record<FrameIdentity, ImageSourcePropType>;

let sagaTypeFrameSources: MseM15TypeFrameSourceMap | null = null;
let planeswalkerTypeFrameSources: MseM15TypeFrameSourceMap | null = null;

function getSagaTypeFrameSources(): MseM15TypeFrameSourceMap {
  sagaTypeFrameSources ??= {
    white: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-masked/white.png"),
    blue: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-masked/blue.png"),
    black: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-masked/black.png"),
    red: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-masked/red.png"),
    green: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-masked/green.png"),
    gold: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-masked/gold.png"),
    artifact: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-masked/artifact.png"),
    land: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-masked/land.png"),
    colorless: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-masked/colorless.png"),
  };

  return sagaTypeFrameSources;
}

function getPlaneswalkerTypeFrameSources(): MseM15TypeFrameSourceMap {
  planeswalkerTypeFrameSources ??= {
    white: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/planeswalker-masked/white.png"),
    blue: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/planeswalker-masked/blue.png"),
    black: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/planeswalker-masked/black.png"),
    red: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/planeswalker-masked/red.png"),
    green: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/planeswalker-masked/green.png"),
    gold: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/planeswalker-masked/gold.png"),
    artifact: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/planeswalker-masked/artifact.png"),
    land: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/planeswalker-masked/land.png"),
    colorless: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/planeswalker-masked/colorless.png"),
  };

  return planeswalkerTypeFrameSources;
}

export function getMseM15TypeFrameFamilySource(
  family: MseM15TypeFrameFamily,
  frameIdentity: FrameIdentity,
): ImageSourcePropType {
  const sources = family === "saga" ? getSagaTypeFrameSources() : getPlaneswalkerTypeFrameSources();

  return sources[frameIdentity];
}
