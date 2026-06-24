import { ImageSourcePropType } from "react-native";

import {
  MSE_M15_COLOR_INDICATOR_BLEND_SOURCES,
  MSE_M15_COLOR_INDICATOR_SOURCES,
  MSE_M15_DFC_BACK_FRAME_BLEND_SOURCES,
  MSE_M15_DFC_NORMAL_FRAME_BLEND_SOURCES,
  MSE_M15_DFC_NOTCHED_FRAME_BLEND_SOURCES,
  MSE_M15_PT_BLEND_SOURCES,
  MSE_M15_SAGA_BOOKMARK_BLEND_SOURCES,
  MSE_M15_SAGA_FRAME_BLEND_SOURCES,
  MSE_M15_STANDARD_FRAME_BLEND_SOURCES,
  MseM15ColorBlend,
  MseM15ColorBlendKey,
  MseM15ColorBlendMode,
} from "@/data/mse-frame-blends";
import { getMseM15LegendaryCrownFamily } from "@/data/mse-frame-crowns";
import {
  getMseM15StampedTreatmentFamilySource,
  getMseM15TreatmentFamilySource,
} from "@/data/mse-frame-treatment-sources";
import { getMseM15TypeFrameFamilySource } from "@/data/mse-frame-typeframe-sources";
import { FrameEffect, FrameIdentity, FrameTreatment, ManaColor } from "@/types/card";

export type MseM15MainframeVariant = "standard" | "dfcNotched" | "dfcNormal" | "dfcBack";
export type MseM15OverlayLayer =
  | ImageSourcePropType
  | {
      kind: "split";
      left: ImageSourcePropType;
      right: ImageSourcePropType;
    }
  | {
      kind: "gradient";
      sources: ImageSourcePropType[];
    };

type CrownSourceSet = Record<FrameIdentity, ImageSourcePropType>;

const MANA_COLOR_FRAME_IDENTITIES: Record<ManaColor, FrameIdentity> = {
  W: "white",
  U: "blue",
  B: "black",
  R: "red",
  G: "green",
};

export const MSE_M15_RENDERER = {
  mainframes: {
    standard: {
      white: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-masked/white.png"),
      blue: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-masked/blue.png"),
      black: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-masked/black.png"),
      red: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-masked/red.png"),
      green: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-masked/green.png"),
      gold: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-masked/gold.png"),
      artifact: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-masked/artifact.png"),
      land: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-masked/land.png"),
      colorless: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-masked/colorless.png"),
    } satisfies Record<FrameIdentity, ImageSourcePropType>,
    dfcNotched: {
      white: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/notched-masked/white.png"),
      blue: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/notched-masked/blue.png"),
      black: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/notched-masked/black.png"),
      red: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/notched-masked/red.png"),
      green: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/notched-masked/green.png"),
      gold: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/notched-masked/gold.png"),
      artifact: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/notched-masked/artifact.png"),
      land: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/notched-masked/land.png"),
      colorless: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/notched-masked/colorless.png"),
    } satisfies Record<FrameIdentity, ImageSourcePropType>,
    dfcNormal: {
      white: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/normal-masked/white.png"),
      blue: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/normal-masked/blue.png"),
      black: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/normal-masked/black.png"),
      red: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/normal-masked/red.png"),
      green: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/normal-masked/green.png"),
      gold: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/normal-masked/gold.png"),
      artifact: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/normal-masked/artifact.png"),
      land: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/normal-masked/land.png"),
      colorless: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/normal-masked/colorless.png"),
    } satisfies Record<FrameIdentity, ImageSourcePropType>,
    dfcBack: {
      white: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-masked/white.png"),
      blue: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-masked/blue.png"),
      black: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-masked/black.png"),
      red: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-masked/red.png"),
      green: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-masked/green.png"),
      gold: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-masked/gold.png"),
      artifact: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-masked/artifact.png"),
      land: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-masked/land.png"),
      colorless: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-masked/colorless.png"),
    } satisfies Record<FrameIdentity, ImageSourcePropType>,
  },
  saga: {
    paper: require("../../assets/card-assets/basic-m15/mse-renderer/saga/paper/paper.png"),
    line: require("../../assets/card-assets/basic-m15/mse-renderer/saga/lines/line.png"),
    stripe: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks/stripe.png"),
    bookmarks: {
      white: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks/wmark.png"),
      blue: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks/umark.png"),
      black: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks/bmark.png"),
      red: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks/rmark.png"),
      green: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks/gmark.png"),
      gold: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks/mmark.png"),
      artifact: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks/amark.png"),
      land: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks/clmark.png"),
      colorless: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks/cmark.png"),
    } satisfies Record<FrameIdentity, ImageSourcePropType>,
    chapters: [
      require("../../assets/card-assets/basic-m15/mse-renderer/saga/chapters/chapter1.png"),
      require("../../assets/card-assets/basic-m15/mse-renderer/saga/chapters/chapter2.png"),
      require("../../assets/card-assets/basic-m15/mse-renderer/saga/chapters/chapter3.png"),
      require("../../assets/card-assets/basic-m15/mse-renderer/saga/chapters/chapter4.png"),
      require("../../assets/card-assets/basic-m15/mse-renderer/saga/chapters/chapter5.png"),
      require("../../assets/card-assets/basic-m15/mse-renderer/saga/chapters/chapter6.png"),
    ] satisfies ImageSourcePropType[],
    overlays: {
      nyx: {
        white: require("../../assets/card-assets/basic-m15/mse-renderer/saga/overlays/nyx-masked/white.png"),
        blue: require("../../assets/card-assets/basic-m15/mse-renderer/saga/overlays/nyx-masked/blue.png"),
        black: require("../../assets/card-assets/basic-m15/mse-renderer/saga/overlays/nyx-masked/black.png"),
        red: require("../../assets/card-assets/basic-m15/mse-renderer/saga/overlays/nyx-masked/red.png"),
        green: require("../../assets/card-assets/basic-m15/mse-renderer/saga/overlays/nyx-masked/green.png"),
        gold: require("../../assets/card-assets/basic-m15/mse-renderer/saga/overlays/nyx-masked/gold.png"),
        artifact: require("../../assets/card-assets/basic-m15/mse-renderer/saga/overlays/nyx-masked/artifact.png"),
        land: require("../../assets/card-assets/basic-m15/mse-renderer/saga/overlays/nyx-masked/land.png"),
        colorless: require("../../assets/card-assets/basic-m15/mse-renderer/saga/overlays/nyx-masked/colorless.png"),
      } satisfies Record<FrameIdentity, ImageSourcePropType>,
    },
    borders: {
      standard: require("../../assets/card-assets/basic-m15/mse-renderer/saga/borders/standard.png"),
      legendary: require("../../assets/card-assets/basic-m15/mse-renderer/saga/borders/legendary.png"),
    },
    crowns: {
      standard: {
        white: require("../../assets/card-assets/basic-m15/mse-renderer/saga/crowns/standard-masked/white.png"),
        blue: require("../../assets/card-assets/basic-m15/mse-renderer/saga/crowns/standard-masked/blue.png"),
        black: require("../../assets/card-assets/basic-m15/mse-renderer/saga/crowns/standard-masked/black.png"),
        red: require("../../assets/card-assets/basic-m15/mse-renderer/saga/crowns/standard-masked/red.png"),
        green: require("../../assets/card-assets/basic-m15/mse-renderer/saga/crowns/standard-masked/green.png"),
        gold: require("../../assets/card-assets/basic-m15/mse-renderer/saga/crowns/standard-masked/gold.png"),
        artifact: require("../../assets/card-assets/basic-m15/mse-renderer/saga/crowns/standard-masked/artifact.png"),
        land: require("../../assets/card-assets/basic-m15/mse-renderer/saga/crowns/standard-masked/land.png"),
        colorless: require("../../assets/card-assets/basic-m15/mse-renderer/saga/crowns/standard-masked/colorless.png"),
      } satisfies Record<FrameIdentity, ImageSourcePropType>,
      nyx: {
        white: require("../../assets/card-assets/basic-m15/mse-renderer/saga/crowns/nyx-masked/white.png"),
        blue: require("../../assets/card-assets/basic-m15/mse-renderer/saga/crowns/nyx-masked/blue.png"),
        black: require("../../assets/card-assets/basic-m15/mse-renderer/saga/crowns/nyx-masked/black.png"),
        red: require("../../assets/card-assets/basic-m15/mse-renderer/saga/crowns/nyx-masked/red.png"),
        green: require("../../assets/card-assets/basic-m15/mse-renderer/saga/crowns/nyx-masked/green.png"),
        gold: require("../../assets/card-assets/basic-m15/mse-renderer/saga/crowns/nyx-masked/gold.png"),
        artifact: require("../../assets/card-assets/basic-m15/mse-renderer/saga/crowns/nyx-masked/artifact.png"),
        land: require("../../assets/card-assets/basic-m15/mse-renderer/saga/crowns/nyx-masked/land.png"),
        colorless: require("../../assets/card-assets/basic-m15/mse-renderer/saga/crowns/nyx-masked/colorless.png"),
      } satisfies Record<FrameIdentity, ImageSourcePropType>,
    },
  },
  overlays: {
    nyx: {
      white: require("../../assets/card-assets/basic-m15/mse-renderer/overlays/nyx-masked/white.png"),
      blue: require("../../assets/card-assets/basic-m15/mse-renderer/overlays/nyx-masked/blue.png"),
      black: require("../../assets/card-assets/basic-m15/mse-renderer/overlays/nyx-masked/black.png"),
      red: require("../../assets/card-assets/basic-m15/mse-renderer/overlays/nyx-masked/red.png"),
      green: require("../../assets/card-assets/basic-m15/mse-renderer/overlays/nyx-masked/green.png"),
      gold: require("../../assets/card-assets/basic-m15/mse-renderer/overlays/nyx-masked/gold.png"),
      artifact: require("../../assets/card-assets/basic-m15/mse-renderer/overlays/nyx-masked/artifact.png"),
      land: require("../../assets/card-assets/basic-m15/mse-renderer/overlays/nyx-masked/land.png"),
      colorless: require("../../assets/card-assets/basic-m15/mse-renderer/overlays/nyx-masked/colorless.png"),
    } satisfies Record<FrameIdentity, ImageSourcePropType>,
  },
  aliases: {
    godzilla: {
      white: require("../../assets/card-assets/basic-m15/mse-renderer/alias/godzilla/wcard.png"),
      blue: require("../../assets/card-assets/basic-m15/mse-renderer/alias/godzilla/ucard.png"),
      black: require("../../assets/card-assets/basic-m15/mse-renderer/alias/godzilla/bcard.png"),
      red: require("../../assets/card-assets/basic-m15/mse-renderer/alias/godzilla/rcard.png"),
      green: require("../../assets/card-assets/basic-m15/mse-renderer/alias/godzilla/gcard.png"),
      gold: require("../../assets/card-assets/basic-m15/mse-renderer/alias/godzilla/mcard.png"),
      artifact: require("../../assets/card-assets/basic-m15/mse-renderer/alias/godzilla/acard.png"),
      land: require("../../assets/card-assets/basic-m15/mse-renderer/alias/godzilla/ccard.png"),
      colorless: require("../../assets/card-assets/basic-m15/mse-renderer/alias/godzilla/ccard.png"),
    } satisfies Record<FrameIdentity, ImageSourcePropType>,
  },
  borders: {
    standard: require("../../assets/card-assets/basic-m15/mse-renderer/borders/standard.png"),
    legendary: require("../../assets/card-assets/basic-m15/mse-renderer/borders/legendary.png"),
  },
  crowns: {
    standard: {
      white: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/standard-masked/white.png"),
      blue: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/standard-masked/blue.png"),
      black: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/standard-masked/black.png"),
      red: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/standard-masked/red.png"),
      green: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/standard-masked/green.png"),
      gold: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/standard-masked/gold.png"),
      artifact: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/standard-masked/artifact.png"),
      land: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/standard-masked/land.png"),
      colorless: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/standard-masked/colorless.png"),
    } satisfies Record<FrameIdentity, ImageSourcePropType>,
    borderless: {
      white: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/borderless/white.png"),
      blue: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/borderless/blue.png"),
      black: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/borderless/black.png"),
      red: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/borderless/red.png"),
      green: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/borderless/green.png"),
      gold: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/borderless/gold.png"),
      artifact: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/borderless/artifact.png"),
      land: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/borderless/land.png"),
      colorless: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/borderless/colorless.png"),
    } satisfies Record<FrameIdentity, ImageSourcePropType>,
    godzillaAlias: {
      white: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/godzilla-alias/white.png"),
      blue: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/godzilla-alias/blue.png"),
      black: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/godzilla-alias/black.png"),
      red: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/godzilla-alias/red.png"),
      green: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/godzilla-alias/green.png"),
      gold: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/godzilla-alias/gold.png"),
      artifact: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/godzilla-alias/artifact.png"),
      land: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/godzilla-alias/land.png"),
      colorless: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/godzilla-alias/colorless.png"),
    } satisfies Record<FrameIdentity, ImageSourcePropType>,
    borderlessGodzillaLegendary: {
      white: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/borderless-godzilla-legendary/white.png"),
      blue: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/borderless-godzilla-legendary/blue.png"),
      black: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/borderless-godzilla-legendary/black.png"),
      red: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/borderless-godzilla-legendary/red.png"),
      green: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/borderless-godzilla-legendary/green.png"),
      gold: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/borderless-godzilla-legendary/gold.png"),
      artifact: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/borderless-godzilla-legendary/artifact.png"),
      land: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/borderless-godzilla-legendary/land.png"),
      colorless: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/borderless-godzilla-legendary/colorless.png"),
    } satisfies Record<FrameIdentity, ImageSourcePropType>,
    nyx: {
      white: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/nyx-masked/white.png"),
      blue: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/nyx-masked/blue.png"),
      black: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/nyx-masked/black.png"),
      red: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/nyx-masked/red.png"),
      green: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/nyx-masked/green.png"),
      gold: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/nyx-masked/gold.png"),
      artifact: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/nyx-masked/artifact.png"),
      land: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/nyx-masked/land.png"),
      colorless: require("../../assets/card-assets/basic-m15/mse-renderer/crowns/nyx-masked/colorless.png"),
    } satisfies Record<FrameIdentity, ImageSourcePropType>,
  },
  ptBoxes: {
    white: require("../../assets/card-assets/basic-m15/mse-renderer/pt/white.png"),
    blue: require("../../assets/card-assets/basic-m15/mse-renderer/pt/blue.png"),
    black: require("../../assets/card-assets/basic-m15/mse-renderer/pt/black.png"),
    red: require("../../assets/card-assets/basic-m15/mse-renderer/pt/red.png"),
    green: require("../../assets/card-assets/basic-m15/mse-renderer/pt/green.png"),
    gold: require("../../assets/card-assets/basic-m15/mse-renderer/pt/gold.png"),
    artifact: require("../../assets/card-assets/basic-m15/mse-renderer/pt/artifact.png"),
    land: require("../../assets/card-assets/basic-m15/mse-renderer/pt/land.png"),
    colorless: require("../../assets/card-assets/basic-m15/mse-renderer/pt/colorless.png"),
  } satisfies Record<FrameIdentity, ImageSourcePropType>,
} as const;

const MSE_M15_TYPELINE_TEXTURE_SOURCES: Record<FrameIdentity, ImageSourcePropType> = {
  white: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/wtypeline.png"),
  blue: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/utypeline.png"),
  black: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/btypeline.png"),
  red: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/rtypeline.png"),
  green: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/gtypeline.png"),
  gold: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/mtypeline.png"),
  artifact: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/atypeline.png"),
  land: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/cltypeline.png"),
  colorless: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/ctypeline.png"),
};

const MSE_M15_FUTURE_TEXTBOX_TEXTURE_SOURCES: Record<FrameIdentity, ImageSourcePropType> = {
  white: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/wtextbox.png"),
  blue: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/utextbox.png"),
  black: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/btextbox.png"),
  red: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/rtextbox.png"),
  green: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/gtextbox.png"),
  gold: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/mtextbox.png"),
  artifact: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/atextbox.png"),
  land: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/cltextbox.png"),
  colorless: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/ctextbox.png"),
};

const MSE_M15_FUTURE_CARD_COLOR_SOURCES: Record<ManaColor, ImageSourcePropType> = {
  W: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/wcard.jpg"),
  U: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/ucard.jpg"),
  B: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/bcard.jpg"),
  R: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/rcard.jpg"),
  G: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/gcard.jpg"),
};

const MSE_M15_FUTURE_CARD_MULTICOLOR_BLEND_MASK_SOURCE = require(
  "../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/multicolor_blend_card.png",
);

const MSE_M15_FUTURE_TYPELINE_MULTICOLOR_BLEND_MASK_SOURCE = require(
  "../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/multicolor_blend_typeline.png",
);

const MSE_M15_FUTURE_TYPELINE_HYBRID_BLEND_MASK_SOURCE = require(
  "../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/hybrid_blend_typeline.png",
);

const MSE_M15_FUTURE_TEXTBOX_MULTICOLOR_BLEND_MASK_SOURCE = require(
  "../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/multicolor_blend_textbox.png",
);

const MSE_M15_FUTURE_TEXTBOX_HYBRID_BLEND_MASK_SOURCE = require(
  "../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/hybrid_blend_textbox.png",
);

const MSE_M15_BORDERLESS_DARK_TEXTBOX_FILL_SOURCE: ImageSourcePropType = require(
  "../../assets/card-assets/basic-m15/mse-renderer/treatments/transparent-borderless/dark-textbox-fill.png",
);

const MSE_M15_BORDERLESS_PINLINE_ONLY_RESTORE_MASK_SOURCE: ImageSourcePropType = require(
  "../../assets/card-assets/basic-m15/mse-renderer/treatments/transparent-borderless/pinline-only-restore-mask.png",
);

const MSE_M15_SUBJECT_MASK_FRAME_APPROVAL_SOURCE: ImageSourcePropType = require(
  "../../assets/card-assets/basic-m15/mse-renderer/treatments/borderless/mask-frame.png",
);


const MSE_M15_SECURITY_STAMP_SOURCE = require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-altered.mse-style/foil_stamp.png");

const MSE_M15_SECURITY_STAMP_BACKING_SOURCES = {
  white: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/standard/white.png"),
  blue: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/standard/blue.png"),
  black: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/standard/black.png"),
  red: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/standard/red.png"),
  green: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/standard/green.png"),
  gold: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/standard/gold.png"),
  artifact: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/standard/artifact.png"),
  land: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/standard/land.png"),
  colorless: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/standard/colorless.png"),
} satisfies Record<FrameIdentity, ImageSourcePropType>;

const MSE_M15_SECURITY_STAMP_PINLINE_BUMP_SOURCE: ImageSourcePropType = require("../../assets/card-assets/basic-m15/source-pack/data/magic-modules.mse-include/pinlines/744x1039/m15/normal/stamp/round.png");
const MSE_M15_SECURITY_STAMP_PINLINE_BUMP_COLOR_SOURCES = {
  white: require("../../assets/card-assets/basic-m15/source-pack/data/magic-modules.mse-include/pinlines/744x1039/m15/colors/base/bright/wcolor.png"),
  blue: require("../../assets/card-assets/basic-m15/source-pack/data/magic-modules.mse-include/pinlines/744x1039/m15/colors/base/bright/ucolor.png"),
  black: require("../../assets/card-assets/basic-m15/source-pack/data/magic-modules.mse-include/pinlines/744x1039/m15/colors/base/bright/bcolor.png"),
  red: require("../../assets/card-assets/basic-m15/source-pack/data/magic-modules.mse-include/pinlines/744x1039/m15/colors/base/bright/rcolor.png"),
  green: require("../../assets/card-assets/basic-m15/source-pack/data/magic-modules.mse-include/pinlines/744x1039/m15/colors/base/bright/gcolor.png"),
  gold: require("../../assets/card-assets/basic-m15/source-pack/data/magic-modules.mse-include/pinlines/744x1039/m15/colors/base/bright/mcolor.png"),
  artifact: require("../../assets/card-assets/basic-m15/source-pack/data/magic-modules.mse-include/pinlines/744x1039/m15/colors/base/bright/acolor.png"),
  land: require("../../assets/card-assets/basic-m15/source-pack/data/magic-modules.mse-include/pinlines/744x1039/m15/colors/base/bright/ccolor.png"),
  colorless: require("../../assets/card-assets/basic-m15/source-pack/data/magic-modules.mse-include/pinlines/744x1039/m15/colors/base/bright/ccolor.png"),
} satisfies Record<FrameIdentity, ImageSourcePropType>;

const MSE_M15_SECURITY_STAMP_BACKING_BLEND_SOURCES: Record<
  MseM15ColorBlendMode,
  Record<MseM15ColorBlendKey, ImageSourcePropType>
> = {
  multicolor: {
    wu: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/wu.png"),
    wb: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/wb.png"),
    ub: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/ub.png"),
    wub: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/wub.png"),
    wr: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/wr.png"),
    ur: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/ur.png"),
    wur: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/wur.png"),
    br: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/br.png"),
    wbr: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/wbr.png"),
    ubr: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/ubr.png"),
    wubr: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/wubr.png"),
    wg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/wg.png"),
    ug: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/ug.png"),
    wug: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/wug.png"),
    bg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/bg.png"),
    wbg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/wbg.png"),
    ubg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/ubg.png"),
    wubg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/wubg.png"),
    rg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/rg.png"),
    wrg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/wrg.png"),
    urg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/urg.png"),
    wurg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/wurg.png"),
    brg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/brg.png"),
    wbrg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/wbrg.png"),
    ubrg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/ubrg.png"),
    wubrg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/multicolor/wubrg.png"),
  },
  hybrid: {
    wu: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/wu.png"),
    wb: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/wb.png"),
    ub: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/ub.png"),
    wub: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/wub.png"),
    wr: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/wr.png"),
    ur: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/ur.png"),
    wur: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/wur.png"),
    br: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/br.png"),
    wbr: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/wbr.png"),
    ubr: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/ubr.png"),
    wubr: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/wubr.png"),
    wg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/wg.png"),
    ug: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/ug.png"),
    wug: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/wug.png"),
    bg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/bg.png"),
    wbg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/wbg.png"),
    ubg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/ubg.png"),
    wubg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/wubg.png"),
    rg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/rg.png"),
    wrg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/wrg.png"),
    urg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/urg.png"),
    wurg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/wurg.png"),
    brg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/brg.png"),
    wbrg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/wbrg.png"),
    ubrg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/ubrg.png"),
    wubrg: require("../../assets/card-assets/basic-m15/mse-renderer/stamps/security-backing/hybrid/wubrg.png"),
  },
};

const MSE_M15_TEXTLESS_PT_BOX_SOURCES = {
  white: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/pt/white.png"),
  blue: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/pt/blue.png"),
  black: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/pt/black.png"),
  red: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/pt/red.png"),
  green: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/pt/green.png"),
  gold: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/pt/gold.png"),
  artifact: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/pt/artifact.png"),
  land: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/pt/land.png"),
  colorless: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/pt/colorless.png"),
} satisfies Record<FrameIdentity, ImageSourcePropType>;

const MSE_M15_TEXTLESS_STAMP_SOURCES = {
  white: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/stamps/white.jpg"),
  blue: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/stamps/blue.jpg"),
  black: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/stamps/black.jpg"),
  red: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/stamps/red.jpg"),
  green: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/stamps/green.jpg"),
  gold: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/stamps/gold.jpg"),
  artifact: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/stamps/artifact.jpg"),
  land: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/stamps/land.jpg"),
  colorless: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/textless/stamps/colorless.jpg"),
} satisfies Record<FrameIdentity, ImageSourcePropType>;

export const MSE_M15_ARTIFACT_MAINFRAME_BLEND_MASK_SIZE = { width: 375, height: 523 } as const;

const MSE_M15_ARTIFACT_MAINFRAME_BLEND_MASK_SOURCE: ImageSourcePropType = require("../../assets/card-assets/basic-m15/source-pack/data/magic-modules.mse-include/cards/375 m15 simple/artifact_blend_card.png");

const MSE_M15_ARTIFACT_STANDARD_FRAME_GOLD_SOURCE: ImageSourcePropType = require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/gold.png");

const MSE_M15_ARTIFACT_STANDARD_FRAME_SINGLE_COLOR_SOURCES = {
  W: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/single/w.png"),
  U: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/single/u.png"),
  B: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/single/b.png"),
  R: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/single/r.png"),
  G: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/single/g.png"),
} satisfies Record<ManaColor, ImageSourcePropType>;

const MSE_M15_ARTIFACT_STANDARD_FRAME_BLEND_SOURCES = {
  multicolor: {
    wu: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/wu.png"),
    wb: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/wb.png"),
    ub: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/ub.png"),
    wub: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/wub.png"),
    wr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/wr.png"),
    ur: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/ur.png"),
    wur: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/wur.png"),
    br: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/br.png"),
    wbr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/wbr.png"),
    ubr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/ubr.png"),
    wubr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/wubr.png"),
    wg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/wg.png"),
    ug: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/ug.png"),
    wug: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/wug.png"),
    bg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/bg.png"),
    wbg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/wbg.png"),
    ubg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/ubg.png"),
    wubg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/wubg.png"),
    rg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/rg.png"),
    wrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/wrg.png"),
    urg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/urg.png"),
    wurg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/wurg.png"),
    brg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/brg.png"),
    wbrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/wbrg.png"),
    ubrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/ubrg.png"),
    wubrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/multicolor/wubrg.png"),
  },
  hybrid: {
    wu: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/wu.png"),
    wb: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/wb.png"),
    ub: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/ub.png"),
    wub: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/wub.png"),
    wr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/wr.png"),
    ur: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/ur.png"),
    wur: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/wur.png"),
    br: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/br.png"),
    wbr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/wbr.png"),
    ubr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/ubr.png"),
    wubr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/wubr.png"),
    wg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/wg.png"),
    ug: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/ug.png"),
    wug: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/wug.png"),
    bg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/bg.png"),
    wbg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/wbg.png"),
    ubg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/ubg.png"),
    wubg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/wubg.png"),
    rg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/rg.png"),
    wrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/wrg.png"),
    urg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/urg.png"),
    wurg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/wurg.png"),
    brg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/brg.png"),
    wbrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/wbrg.png"),
    ubrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/ubrg.png"),
    wubrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/artifact-composited/hybrid/wubrg.png"),
  },
} satisfies Record<MseM15ColorBlendMode, Record<MseM15ColorBlendKey, ImageSourcePropType>>;

export function getMseM15MainframeSource(
  frameIdentity: FrameIdentity,
  variant: MseM15MainframeVariant = "standard",
  colorBlend?: MseM15ColorBlend | null,
): ImageSourcePropType {
  if (variant === "standard" && colorBlend) {
    return MSE_M15_STANDARD_FRAME_BLEND_SOURCES[colorBlend.mode][colorBlend.key];
  }

  if (variant === "dfcBack" && colorBlend) {
    return MSE_M15_DFC_BACK_FRAME_BLEND_SOURCES[colorBlend.mode][colorBlend.key];
  }

  if (variant === "dfcNotched" && colorBlend) {
    return MSE_M15_DFC_NOTCHED_FRAME_BLEND_SOURCES[colorBlend.mode][colorBlend.key];
  }

  if (variant === "dfcNormal" && colorBlend) {
    return MSE_M15_DFC_NORMAL_FRAME_BLEND_SOURCES[colorBlend.mode][colorBlend.key];
  }

  return MSE_M15_RENDERER.mainframes[variant][frameIdentity];
}

export function getMseM15StandardColorMainframeSource(
  frameColors: ManaColor[],
  colorBlend?: MseM15ColorBlend | null,
): ImageSourcePropType | null {
  if (colorBlend) {
    return MSE_M15_STANDARD_FRAME_BLEND_SOURCES[colorBlend.mode][colorBlend.key];
  }

  const firstFrameColor = frameColors[0];

  if (!firstFrameColor) {
    return null;
  }

  return MSE_M15_RENDERER.mainframes.standard[MANA_COLOR_FRAME_IDENTITIES[firstFrameColor]];
}

function getMseM15StandardMainframeTextureSource(frameIdentity: FrameIdentity): ImageSourcePropType {
  switch (frameIdentity) {
    case "white":
      return require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard/white.jpg");
    case "blue":
      return require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard/blue.jpg");
    case "black":
      return require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard/black.jpg");
    case "red":
      return require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard/red.jpg");
    case "green":
      return require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard/green.jpg");
    case "gold":
      return require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard/gold.jpg");
    case "artifact":
      return require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard/artifact.jpg");
    case "land":
      return require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard/land.jpg");
    case "colorless":
      return require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard/colorless.jpg");
  }
}

export function getMseM15StandardColorMainframeTextureSource(
  frameColors: ManaColor[],
  colorBlend?: MseM15ColorBlend | null,
): ImageSourcePropType | null {
  if (colorBlend) {
    return MSE_M15_STANDARD_FRAME_BLEND_SOURCES[colorBlend.mode][colorBlend.key];
  }

  const firstFrameColor = frameColors[0];

  if (!firstFrameColor) {
    return null;
  }

  return getMseM15StandardMainframeTextureSource(MANA_COLOR_FRAME_IDENTITIES[firstFrameColor]);
}

export function getMseM15StandardArtifactColorMainframeSource(
  frameColors: ManaColor[],
  colorBlend?: MseM15ColorBlend | null,
): ImageSourcePropType | null {
  if (frameColors.length > 2) {
    return MSE_M15_ARTIFACT_STANDARD_FRAME_GOLD_SOURCE;
  }

  if (colorBlend) {
    return MSE_M15_ARTIFACT_STANDARD_FRAME_BLEND_SOURCES[colorBlend.mode][colorBlend.key];
  }

  const firstFrameColor = frameColors[0];

  if (!firstFrameColor) {
    return null;
  }

  return MSE_M15_ARTIFACT_STANDARD_FRAME_SINGLE_COLOR_SOURCES[firstFrameColor];
}

export function getMseM15ArtifactMainframeBlendMaskSource(): ImageSourcePropType {
  return MSE_M15_ARTIFACT_MAINFRAME_BLEND_MASK_SOURCE;
}

export function getMseM15BorderlessDarkTextboxFillSource(): ImageSourcePropType {
  return MSE_M15_BORDERLESS_DARK_TEXTBOX_FILL_SOURCE;
}

export function getMseM15BorderlessPinlineOnlyRestoreMaskSource(): ImageSourcePropType {
  return MSE_M15_BORDERLESS_PINLINE_ONLY_RESTORE_MASK_SOURCE;
}

export function getMseM15SubjectMaskFrameApprovalSource(): ImageSourcePropType {
  return MSE_M15_SUBJECT_MASK_FRAME_APPROVAL_SOURCE;
}

export function getMseM15FrameTreatmentSource(
  treatment: FrameTreatment,
  frameIdentity: FrameIdentity,
  stamped = false,
  _colorBlend?: MseM15ColorBlend | null,
): ImageSourcePropType | null {
  if (stamped) {
    return getMseM15StampedTreatmentFamilySource(treatment, frameIdentity) ??
      getMseM15TreatmentFamilySource(treatment, frameIdentity);
  }

  return getMseM15TreatmentFamilySource(treatment, frameIdentity);
}

export function getMseM15SecurityStampSource(): ImageSourcePropType {
  return MSE_M15_SECURITY_STAMP_SOURCE;
}

export function getMseM15GodzillaAliasSource(
  frameIdentity: FrameIdentity,
  _colorBlend?: MseM15ColorBlend | null,
): ImageSourcePropType {
  return MSE_M15_RENDERER.aliases.godzilla[frameIdentity];
}

export function getMseM15TypeLineTextureSource(
  frameIdentity: FrameIdentity,
): ImageSourcePropType {
  return MSE_M15_TYPELINE_TEXTURE_SOURCES[frameIdentity];
}

export function getMseM15FutureTextboxTextureSource(
  frameIdentity: FrameIdentity,
): ImageSourcePropType {
  return MSE_M15_FUTURE_TEXTBOX_TEXTURE_SOURCES[frameIdentity];
}

export function getMseM15FutureCardColorSource(color: ManaColor): ImageSourcePropType {
  return MSE_M15_FUTURE_CARD_COLOR_SOURCES[color];
}

export function getMseM15FutureCardMulticolorBlendMaskSource(): ImageSourcePropType {
  return MSE_M15_FUTURE_CARD_MULTICOLOR_BLEND_MASK_SOURCE;
}

export function getMseM15FutureTypeLineBlendMaskSource(
  hybrid: boolean,
): ImageSourcePropType {
  return hybrid
    ? MSE_M15_FUTURE_TYPELINE_HYBRID_BLEND_MASK_SOURCE
    : MSE_M15_FUTURE_TYPELINE_MULTICOLOR_BLEND_MASK_SOURCE;
}

export function getMseM15FutureTextboxBlendMaskSource(
  hybrid: boolean,
): ImageSourcePropType {
  return hybrid
    ? MSE_M15_FUTURE_TEXTBOX_HYBRID_BLEND_MASK_SOURCE
    : MSE_M15_FUTURE_TEXTBOX_MULTICOLOR_BLEND_MASK_SOURCE;
}

export function getMseM15SecurityStampBackingSource(
  frameIdentity: FrameIdentity,
  colorBlend?: MseM15ColorBlend | null,
): ImageSourcePropType {
  if (colorBlend) {
    return MSE_M15_SECURITY_STAMP_BACKING_BLEND_SOURCES[colorBlend.mode][colorBlend.key];
  }

  return MSE_M15_SECURITY_STAMP_BACKING_SOURCES[frameIdentity];
}

export function getMseM15SecurityStampPinlineBumpSource(): ImageSourcePropType {
  return MSE_M15_SECURITY_STAMP_PINLINE_BUMP_SOURCE;
}

export function getMseM15SecurityStampPinlineBumpColorSource(
  frameIdentity: FrameIdentity,
  forceGold = false,
): ImageSourcePropType {
  if (forceGold) {
    return MSE_M15_SECURITY_STAMP_PINLINE_BUMP_COLOR_SOURCES.gold;
  }

  return MSE_M15_SECURITY_STAMP_PINLINE_BUMP_COLOR_SOURCES[frameIdentity];
}

export function getMseM15StandardColorSecurityStampBackingSource(
  frameColors: ManaColor[],
  colorBlend?: MseM15ColorBlend | null,
): ImageSourcePropType | null {
  if (colorBlend) {
    return MSE_M15_SECURITY_STAMP_BACKING_BLEND_SOURCES[colorBlend.mode][colorBlend.key];
  }

  const firstFrameColor = frameColors[0];

  if (!firstFrameColor) {
    return null;
  }

  return MSE_M15_SECURITY_STAMP_BACKING_SOURCES[MANA_COLOR_FRAME_IDENTITIES[firstFrameColor]];
}

export function getMseM15ColorIndicatorSource(
  frameIdentity: FrameIdentity,
  colorBlend?: MseM15ColorBlend | null,
): ImageSourcePropType {
  if (colorBlend) {
    return MSE_M15_COLOR_INDICATOR_BLEND_SOURCES[colorBlend.mode][colorBlend.key];
  }

  return MSE_M15_COLOR_INDICATOR_SOURCES[frameIdentity];
}

export function getMseM15TypeFrameSource(
  type: "saga" | "planeswalker",
  frameIdentity: FrameIdentity,
  colorBlend?: MseM15ColorBlend | null,
): ImageSourcePropType {
  if (type === "saga" && colorBlend) {
    return MSE_M15_SAGA_FRAME_BLEND_SOURCES[colorBlend.mode][colorBlend.key];
  }

  return getMseM15TypeFrameFamilySource(type, frameIdentity);
}

export function getMseM15PtBoxSource(
  frameIdentity: FrameIdentity,
  colorBlend?: MseM15ColorBlend | null,
  treatment?: FrameTreatment,
): ImageSourcePropType {
  if (treatment === "textless") {
    return MSE_M15_TEXTLESS_PT_BOX_SOURCES[frameIdentity];
  }

  if (colorBlend) {
    return MSE_M15_PT_BLEND_SOURCES[colorBlend.mode][colorBlend.key];
  }

  return MSE_M15_RENDERER.ptBoxes[frameIdentity];
}

export function getMseM15TextlessStampSource(frameIdentity: FrameIdentity): ImageSourcePropType {
  return MSE_M15_TEXTLESS_STAMP_SOURCES[frameIdentity];
}

export function getMseM15OverlaySources(
  frameIdentity: FrameIdentity,
  frameEffects: FrameEffect[],
  frameColors: ManaColor[] = [],
  treatment: FrameTreatment = "standard",
  options: { usesGodzillaAlias?: boolean } = {},
): MseM15OverlayLayer[] {
  const layers: MseM15OverlayLayer[] = [];
  const isNyx = frameEffects.includes("nyx");
  const isBorderless = treatment === "borderless";
  const supportsLegendaryHeader =
    treatment === "standard" || treatment === "borderless" || treatment === "textless";

  // MSE layer order: trim effects at z330, border at z500, crown attachments at z800.
  if (isNyx) {
    layers.push(MSE_M15_RENDERER.overlays.nyx[frameIdentity]);
  }

  if (supportsLegendaryHeader && frameEffects.includes("legendary")) {
    if (!isBorderless) {
      layers.push(MSE_M15_RENDERER.borders.legendary);
    }

    layers.push(
      getLegendaryCrownLayer(
        MSE_M15_RENDERER.crowns[getMseM15LegendaryCrownFamily(treatment, isNyx, options)],
        frameIdentity,
        frameColors,
      ),
    );
  }

  return layers;
}

export function getMseM15SagaBookmarkSource(
  frameIdentity: FrameIdentity,
  colorBlend?: MseM15ColorBlend | null,
): ImageSourcePropType {
  if (colorBlend) {
    return MSE_M15_SAGA_BOOKMARK_BLEND_SOURCES[colorBlend.mode][colorBlend.key];
  }

  return MSE_M15_RENDERER.saga.bookmarks[frameIdentity];
}

export function getMseM15SagaPaperSource(): ImageSourcePropType {
  return MSE_M15_RENDERER.saga.paper;
}

export function getMseM15SagaLineSource(): ImageSourcePropType {
  return MSE_M15_RENDERER.saga.line;
}

export function getMseM15SagaStripeSource(): ImageSourcePropType {
  return MSE_M15_RENDERER.saga.stripe;
}

export function getMseM15SagaChapterSource(chapterIndex: number): ImageSourcePropType {
  const normalizedIndex = Math.max(0, Math.min(5, chapterIndex - 1));

  return MSE_M15_RENDERER.saga.chapters[normalizedIndex];
}

export function getMseM15SagaOverlaySources(
  frameIdentity: FrameIdentity,
  frameEffects: FrameEffect[],
  frameColors: ManaColor[] = [],
): MseM15OverlayLayer[] {
  const layers: MseM15OverlayLayer[] = [];
  const isNyx = frameEffects.includes("nyx");
  const isLegendary = frameEffects.includes("legendary");

  // MSE Saga layer order: Nyx trim at z330, border at z500, Saga crown at z840.
  if (isNyx) {
    layers.push(MSE_M15_RENDERER.saga.overlays.nyx[frameIdentity]);
  }

  layers.push(isLegendary ? MSE_M15_RENDERER.saga.borders.legendary : MSE_M15_RENDERER.saga.borders.standard);

  if (isLegendary) {
    layers.push(
      isNyx
        ? getLegendaryCrownLayer(MSE_M15_RENDERER.saga.crowns.nyx, frameIdentity, frameColors)
        : getLegendaryCrownLayer(MSE_M15_RENDERER.saga.crowns.standard, frameIdentity, frameColors),
    );
  }

  return layers;
}

function getLegendaryCrownLayer(
  crowns: CrownSourceSet,
  frameIdentity: FrameIdentity,
  frameColors: ManaColor[],
): MseM15OverlayLayer {
  if (frameColors.length > 2) {
    return crowns.gold;
  }

  if (frameColors.length >= 2) {
    return {
      kind: "gradient",
      sources: frameColors.map((color) => crowns[MANA_COLOR_FRAME_IDENTITIES[color]]),
    };
  }

  return crowns[frameIdentity];
}
