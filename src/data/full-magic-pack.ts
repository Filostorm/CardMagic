import { ImageSourcePropType } from "react-native";

import { DfcFace, DfcMode, FrameEffect, FrameIdentity, TypeFrame } from "@/types/card";

export type TokenFrameVariant = "textless" | "normal" | "tall";

export type ManaAssetKey =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12"
  | "13"
  | "14"
  | "15"
  | "16"
  | "17"
  | "18"
  | "19"
  | "20"
  | "21"
  | "22"
  | "23"
  | "24"
  | "25"
  | "26"
  | "27"
  | "28"
  | "29"
  | "30"
  | "99"
  | "100"
  | "X"
  | "Y"
  | "Z"
  | "W"
  | "U"
  | "B"
  | "R"
  | "G"
  | "C"
  | "T"
  | "Q"
  | "S"
  | "WU"
  | "WB"
  | "UB"
  | "UR"
  | "BR"
  | "BG"
  | "RG"
  | "RW"
  | "GW"
  | "GU"
  | "2W"
  | "2U"
  | "2B"
  | "2R"
  | "2G"
  | "WP"
  | "UP"
  | "BP"
  | "RP"
  | "GP";

export type HybridManaAssetKey = Extract<
  ManaAssetKey,
  "WU" | "WB" | "UB" | "UR" | "BR" | "BG" | "RG" | "RW" | "GW" | "GU"
>;

export const CARD_COORDINATES = {
  width: 375,
  height: 523,
  art: { x: 29, y: 60, width: 316, height: 231 },
  name: { x: 32, y: 29, width: 226, height: 24 },
  manaCost: { x: 266, y: 29, width: 80, height: 24 },
  typeLine: { x: 32, y: 296, width: 309, height: 22 },
  rulesText: { x: 38, y: 330, width: 295, height: 92 },
  rulesFlavorDivider: { x: 50, y: 426, width: 275, height: 2 },
  flavorText: { x: 38, y: 435, width: 295, height: 36 },
  textArea: { x: 38, y: 330, width: 295, height: 139 },
  ptBox: { x: 276, y: 466, width: 81, height: 42 },
  powerToughness: { x: 289, y: 470, width: 58, height: 25 },
  footer: { x: 24, y: 488, width: 326, height: 20 },
  setSymbol: { x: 321, y: 298, width: 22, height: 22 },
} as const;

export const FULL_MAGIC_PACK = {
  id: "full-magic-pack",
  name: "Full Magic Pack",
  version: "local-mse-subset",
  source: "Local Magic Set Editor asset subset",
  frames: {
    white: require("../../assets/card-assets/full-magic-pack/frames/white.jpg"),
    blue: require("../../assets/card-assets/full-magic-pack/frames/blue.jpg"),
    black: require("../../assets/card-assets/full-magic-pack/frames/black.jpg"),
    red: require("../../assets/card-assets/full-magic-pack/frames/red.jpg"),
    green: require("../../assets/card-assets/full-magic-pack/frames/green.jpg"),
    gold: require("../../assets/card-assets/full-magic-pack/frames/gold.jpg"),
    artifact: require("../../assets/card-assets/full-magic-pack/frames/artifact.jpg"),
    land: require("../../assets/card-assets/full-magic-pack/frames/land.jpg"),
    colorless: require("../../assets/card-assets/full-magic-pack/frames/colorless.jpg"),
  } satisfies Record<FrameIdentity, ImageSourcePropType>,
  ptBoxes: {
    white: require("../../assets/card-assets/full-magic-pack/pt/white.png"),
    blue: require("../../assets/card-assets/full-magic-pack/pt/blue.png"),
    black: require("../../assets/card-assets/full-magic-pack/pt/black.png"),
    red: require("../../assets/card-assets/full-magic-pack/pt/red.png"),
    green: require("../../assets/card-assets/full-magic-pack/pt/green.png"),
    gold: require("../../assets/card-assets/full-magic-pack/pt/gold.png"),
    artifact: require("../../assets/card-assets/full-magic-pack/pt/artifact.png"),
    land: require("../../assets/card-assets/full-magic-pack/pt/land.png"),
    colorless: require("../../assets/card-assets/full-magic-pack/pt/colorless.png"),
  } satisfies Record<FrameIdentity, ImageSourcePropType>,
  tokenFrames: {
    textless: {
      white: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/wcard.png"),
      blue: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/ucard.png"),
      black: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/bcard.png"),
      red: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/rcard.png"),
      green: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/gcard.png"),
      gold: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/mcard.png"),
      artifact: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/acard.png"),
      land: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/ccard.png"),
      colorless: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/ccard.png"),
    } satisfies Record<FrameIdentity, ImageSourcePropType>,
    normal: {
      white: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/wcard2.png"),
      blue: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/ucard2.png"),
      black: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/bcard2.png"),
      red: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/rcard2.png"),
      green: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/gcard2.png"),
      gold: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/mcard2.png"),
      artifact: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/acard2.png"),
      land: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/ccard2.png"),
      colorless: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/ccard2.png"),
    } satisfies Record<FrameIdentity, ImageSourcePropType>,
    tall: {
      white: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/wcard3.png"),
      blue: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/ucard3.png"),
      black: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/bcard3.png"),
      red: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/rcard3.png"),
      green: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/gcard3.png"),
      gold: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/mcard3.png"),
      artifact: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/acard3.png"),
      land: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/ccard3.png"),
      colorless: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-tokens.mse-style/m20/ccard3.png"),
    } satisfies Record<FrameIdentity, ImageSourcePropType>,
  } satisfies Record<TokenFrameVariant, Record<FrameIdentity, ImageSourcePropType>>,
  tokenPtBoxes: {
    white: require("../../assets/card-assets/basic-m15/type-frames/tokens/pt/white.png"),
    blue: require("../../assets/card-assets/basic-m15/type-frames/tokens/pt/blue.png"),
    black: require("../../assets/card-assets/basic-m15/type-frames/tokens/pt/black.png"),
    red: require("../../assets/card-assets/basic-m15/type-frames/tokens/pt/red.png"),
    green: require("../../assets/card-assets/basic-m15/type-frames/tokens/pt/green.png"),
    gold: require("../../assets/card-assets/basic-m15/type-frames/tokens/pt/gold.png"),
    artifact: require("../../assets/card-assets/basic-m15/type-frames/tokens/pt/artifact.png"),
    land: require("../../assets/card-assets/basic-m15/type-frames/tokens/pt/land.png"),
    colorless: require("../../assets/card-assets/basic-m15/type-frames/tokens/pt/colorless.png"),
  } satisfies Record<FrameIdentity, ImageSourcePropType>,
  battleFrames: {
    white: require("../../assets/card-assets/basic-m15/type-frames/battle/mse-front/wcard.jpg"),
    blue: require("../../assets/card-assets/basic-m15/type-frames/battle/mse-front/ucard.jpg"),
    black: require("../../assets/card-assets/basic-m15/type-frames/battle/mse-front/bcard.jpg"),
    red: require("../../assets/card-assets/basic-m15/type-frames/battle/mse-front/rcard.jpg"),
    green: require("../../assets/card-assets/basic-m15/type-frames/battle/mse-front/gcard.jpg"),
    gold: require("../../assets/card-assets/basic-m15/type-frames/battle/mse-front/mcard.jpg"),
    artifact: require("../../assets/card-assets/basic-m15/type-frames/battle/mse-front/acard.jpg"),
    land: require("../../assets/card-assets/basic-m15/type-frames/battle/mse-front/ccard.jpg"),
    colorless: require("../../assets/card-assets/basic-m15/type-frames/battle/mse-front/ccard.jpg"),
  } satisfies Record<FrameIdentity, ImageSourcePropType>,
  adventureFrames: {
    white: require("../../assets/card-assets/basic-m15/type-frames/adventure/mse-normal/wcard.png"),
    blue: require("../../assets/card-assets/basic-m15/type-frames/adventure/mse-normal/ucard.png"),
    black: require("../../assets/card-assets/basic-m15/type-frames/adventure/mse-normal/bcard.png"),
    red: require("../../assets/card-assets/basic-m15/type-frames/adventure/mse-normal/rcard.png"),
    green: require("../../assets/card-assets/basic-m15/type-frames/adventure/mse-normal/gcard.png"),
    gold: require("../../assets/card-assets/basic-m15/type-frames/adventure/mse-normal/mcard.png"),
    artifact: require("../../assets/card-assets/basic-m15/type-frames/adventure/mse-normal/acard.png"),
    land: require("../../assets/card-assets/basic-m15/type-frames/adventure/mse-normal/clcard.png"),
    colorless: require("../../assets/card-assets/basic-m15/type-frames/adventure/mse-normal/ccard.png"),
  } satisfies Record<FrameIdentity, ImageSourcePropType>,
  adventurePtBoxes: {
    white: require("../../assets/card-assets/basic-m15/type-frames/adventure/mse-normal/wpt.png"),
    blue: require("../../assets/card-assets/basic-m15/type-frames/adventure/mse-normal/upt.png"),
    black: require("../../assets/card-assets/basic-m15/type-frames/adventure/mse-normal/bpt.png"),
    red: require("../../assets/card-assets/basic-m15/type-frames/adventure/mse-normal/rpt.png"),
    green: require("../../assets/card-assets/basic-m15/type-frames/adventure/mse-normal/gpt.png"),
    gold: require("../../assets/card-assets/basic-m15/type-frames/adventure/mse-normal/mpt.png"),
    artifact: require("../../assets/card-assets/basic-m15/type-frames/adventure/mse-normal/apt.png"),
    land: require("../../assets/card-assets/basic-m15/type-frames/adventure/mse-normal/clpt.png"),
    colorless: require("../../assets/card-assets/basic-m15/type-frames/adventure/mse-normal/cpt.png"),
  } satisfies Record<FrameIdentity, ImageSourcePropType>,
  battleDefenseBoxes: {
    white: require("../../assets/card-assets/basic-m15/type-frames/battle/mse-front/battle_pt.png"),
    blue: require("../../assets/card-assets/basic-m15/type-frames/battle/mse-front/battle_pt.png"),
    black: require("../../assets/card-assets/basic-m15/type-frames/battle/mse-front/battle_pt.png"),
    red: require("../../assets/card-assets/basic-m15/type-frames/battle/mse-front/battle_pt.png"),
    green: require("../../assets/card-assets/basic-m15/type-frames/battle/mse-front/battle_pt.png"),
    gold: require("../../assets/card-assets/basic-m15/type-frames/battle/mse-front/battle_pt.png"),
    artifact: require("../../assets/card-assets/basic-m15/type-frames/battle/mse-front/battle_pt.png"),
    land: require("../../assets/card-assets/basic-m15/type-frames/battle/mse-front/battle_pt.png"),
    colorless: require("../../assets/card-assets/basic-m15/type-frames/battle/mse-front/battle_pt.png"),
  } satisfies Record<FrameIdentity, ImageSourcePropType>,
  battleTransformIcon: require("../../assets/card-assets/basic-m15/type-frames/battle/mse-front/mdficon.png"),
  battleBorderMask: require("../../assets/card-assets/basic-m15/type-frames/battle/border-mask.png"),
  battlePanelTextures: {
    typeBox: {
      white: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/typebar/white.png"),
      blue: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/typebar/blue.png"),
      black: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/typebar/black.png"),
      red: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/typebar/red.png"),
      green: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/typebar/green.png"),
      gold: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/typebar/gold.png"),
      artifact: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/typebar/artifact.png"),
      land: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/typebar/land.png"),
      colorless: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/typebar/colorless.png"),
    } satisfies Record<FrameIdentity, ImageSourcePropType>,
    textBox: {
      white: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/textbox-source/white.png"),
      blue: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/textbox-source/blue.png"),
      black: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/textbox-source/black.png"),
      red: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/textbox-source/red.png"),
      green: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/textbox-source/green.png"),
      gold: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/textbox-source/gold.png"),
      artifact: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/textbox-source/artifact.png"),
      land: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/textbox-source/land.png"),
      colorless: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/textbox-source/colorless.png"),
    } satisfies Record<FrameIdentity, ImageSourcePropType>,
  },
  battleTypeBoxFrames: {
    white: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/typebox-frame/white.png"),
    blue: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/typebox-frame/blue.png"),
    black: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/typebox-frame/black.png"),
    red: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/typebox-frame/red.png"),
    green: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/typebox-frame/green.png"),
    gold: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/typebox-frame/gold.png"),
    artifact: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/typebox-frame/artifact.png"),
    land: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/typebox-frame/land.png"),
    colorless: require("../../assets/card-assets/basic-m15/type-frames/battle/textures/typebox-frame/colorless.png"),
  } satisfies Record<FrameIdentity, ImageSourcePropType>,
  frameEffects: {
    nyx: {
      white: require("../../assets/card-assets/basic-m15/frame-effects/nyx/white.png"),
      blue: require("../../assets/card-assets/basic-m15/frame-effects/nyx/blue.png"),
      black: require("../../assets/card-assets/basic-m15/frame-effects/nyx/black.png"),
      red: require("../../assets/card-assets/basic-m15/frame-effects/nyx/red.png"),
      green: require("../../assets/card-assets/basic-m15/frame-effects/nyx/green.png"),
      gold: require("../../assets/card-assets/basic-m15/frame-effects/nyx/gold.png"),
      artifact: require("../../assets/card-assets/basic-m15/frame-effects/nyx/artifact.png"),
      land: require("../../assets/card-assets/basic-m15/frame-effects/nyx/land.png"),
      colorless: require("../../assets/card-assets/basic-m15/frame-effects/nyx/colorless.png"),
    } satisfies Record<FrameIdentity, ImageSourcePropType>,
    legendary: {
      white: require("../../assets/card-assets/basic-m15/frame-effects/legendary/white.png"),
      blue: require("../../assets/card-assets/basic-m15/frame-effects/legendary/blue.png"),
      black: require("../../assets/card-assets/basic-m15/frame-effects/legendary/black.png"),
      red: require("../../assets/card-assets/basic-m15/frame-effects/legendary/red.png"),
      green: require("../../assets/card-assets/basic-m15/frame-effects/legendary/green.png"),
      gold: require("../../assets/card-assets/basic-m15/frame-effects/legendary/gold.png"),
      artifact: require("../../assets/card-assets/basic-m15/frame-effects/legendary/artifact.png"),
      land: require("../../assets/card-assets/basic-m15/frame-effects/legendary/land.png"),
      colorless: require("../../assets/card-assets/basic-m15/frame-effects/legendary/colorless.png"),
    } satisfies Record<FrameIdentity, ImageSourcePropType>,
    nyxLegendary: {
      white: require("../../assets/card-assets/basic-m15/frame-effects/nyx-legendary/white.png"),
      blue: require("../../assets/card-assets/basic-m15/frame-effects/nyx-legendary/blue.png"),
      black: require("../../assets/card-assets/basic-m15/frame-effects/nyx-legendary/black.png"),
      red: require("../../assets/card-assets/basic-m15/frame-effects/nyx-legendary/red.png"),
      green: require("../../assets/card-assets/basic-m15/frame-effects/nyx-legendary/green.png"),
      gold: require("../../assets/card-assets/basic-m15/frame-effects/nyx-legendary/gold.png"),
      artifact: require("../../assets/card-assets/basic-m15/frame-effects/nyx-legendary/artifact.png"),
      land: require("../../assets/card-assets/basic-m15/frame-effects/nyx-legendary/land.png"),
      colorless: require("../../assets/card-assets/basic-m15/frame-effects/nyx-legendary/colorless.png"),
    } satisfies Record<FrameIdentity, ImageSourcePropType>,
  },
  symbols: {
    "0": require("../../assets/card-assets/full-magic-pack/symbols/0.png"),
    "1": require("../../assets/card-assets/full-magic-pack/symbols/1.png"),
    "2": require("../../assets/card-assets/full-magic-pack/symbols/2.png"),
    "3": require("../../assets/card-assets/full-magic-pack/symbols/3.png"),
    "4": require("../../assets/card-assets/full-magic-pack/symbols/4.png"),
    "5": require("../../assets/card-assets/full-magic-pack/symbols/5.png"),
    "6": require("../../assets/card-assets/full-magic-pack/symbols/6.png"),
    "7": require("../../assets/card-assets/full-magic-pack/symbols/7.png"),
    "8": require("../../assets/card-assets/full-magic-pack/symbols/8.png"),
    "9": require("../../assets/card-assets/full-magic-pack/symbols/9.png"),
    "10": require("../../assets/card-assets/full-magic-pack/symbols/10.png"),
    "11": require("../../assets/card-assets/full-magic-pack/symbols/11.png"),
    "12": require("../../assets/card-assets/full-magic-pack/symbols/12.png"),
    "13": require("../../assets/card-assets/full-magic-pack/symbols/13.png"),
    "14": require("../../assets/card-assets/full-magic-pack/symbols/14.png"),
    "15": require("../../assets/card-assets/full-magic-pack/symbols/15.png"),
    "16": require("../../assets/card-assets/full-magic-pack/symbols/16.png"),
    "17": require("../../assets/card-assets/full-magic-pack/symbols/17.png"),
    "18": require("../../assets/card-assets/full-magic-pack/symbols/18.png"),
    "19": require("../../assets/card-assets/full-magic-pack/symbols/19.png"),
    "20": require("../../assets/card-assets/full-magic-pack/symbols/20.png"),
    "21": require("../../assets/card-assets/full-magic-pack/symbols/21.png"),
    "22": require("../../assets/card-assets/full-magic-pack/symbols/22.png"),
    "23": require("../../assets/card-assets/full-magic-pack/symbols/23.png"),
    "24": require("../../assets/card-assets/full-magic-pack/symbols/24.png"),
    "25": require("../../assets/card-assets/full-magic-pack/symbols/25.png"),
    "26": require("../../assets/card-assets/full-magic-pack/symbols/26.png"),
    "27": require("../../assets/card-assets/full-magic-pack/symbols/27.png"),
    "28": require("../../assets/card-assets/full-magic-pack/symbols/28.png"),
    "29": require("../../assets/card-assets/full-magic-pack/symbols/29.png"),
    "30": require("../../assets/card-assets/full-magic-pack/symbols/30.png"),
    "99": require("../../assets/card-assets/full-magic-pack/symbols/99.png"),
    "100": require("../../assets/card-assets/full-magic-pack/symbols/100.png"),
    X: require("../../assets/card-assets/full-magic-pack/symbols/x.png"),
    Y: require("../../assets/card-assets/full-magic-pack/symbols/y.png"),
    Z: require("../../assets/card-assets/full-magic-pack/symbols/z.png"),
    W: require("../../assets/card-assets/full-magic-pack/symbols/w.png"),
    U: require("../../assets/card-assets/full-magic-pack/symbols/u.png"),
    B: require("../../assets/card-assets/full-magic-pack/symbols/b.png"),
    R: require("../../assets/card-assets/full-magic-pack/symbols/r.png"),
    G: require("../../assets/card-assets/full-magic-pack/symbols/g.png"),
    C: require("../../assets/card-assets/full-magic-pack/symbols/c.png"),
    T: require("../../assets/card-assets/full-magic-pack/symbols/t.png"),
    Q: require("../../assets/card-assets/full-magic-pack/symbols/q.png"),
    S: require("../../assets/card-assets/full-magic-pack/symbols/s.png"),
    WU: require("../../assets/card-assets/full-magic-pack/symbols/wu.png"),
    WB: require("../../assets/card-assets/full-magic-pack/symbols/wb.png"),
    UB: require("../../assets/card-assets/full-magic-pack/symbols/ub.png"),
    UR: require("../../assets/card-assets/full-magic-pack/symbols/ur.png"),
    BR: require("../../assets/card-assets/full-magic-pack/symbols/br.png"),
    BG: require("../../assets/card-assets/full-magic-pack/symbols/bg.png"),
    RG: require("../../assets/card-assets/full-magic-pack/symbols/rg.png"),
    RW: require("../../assets/card-assets/full-magic-pack/symbols/rw.png"),
    GW: require("../../assets/card-assets/full-magic-pack/symbols/gw.png"),
    GU: require("../../assets/card-assets/full-magic-pack/symbols/gu.png"),
    "2W": require("../../assets/card-assets/full-magic-pack/symbols/2w.png"),
    "2U": require("../../assets/card-assets/full-magic-pack/symbols/2u.png"),
    "2B": require("../../assets/card-assets/full-magic-pack/symbols/2b.png"),
    "2R": require("../../assets/card-assets/full-magic-pack/symbols/2r.png"),
    "2G": require("../../assets/card-assets/full-magic-pack/symbols/2g.png"),
    WP: require("../../assets/card-assets/full-magic-pack/symbols/wp.png"),
    UP: require("../../assets/card-assets/full-magic-pack/symbols/up.png"),
    BP: require("../../assets/card-assets/full-magic-pack/symbols/bp.png"),
    RP: require("../../assets/card-assets/full-magic-pack/symbols/rp.png"),
    GP: require("../../assets/card-assets/full-magic-pack/symbols/gp.png"),
  } satisfies Record<ManaAssetKey, ImageSourcePropType>,
  guildHybridSymbols: {
    WU: require("../../assets/card-assets/full-magic-pack/symbols/guild/wu.png"),
    WB: require("../../assets/card-assets/full-magic-pack/symbols/guild/wb.png"),
    UB: require("../../assets/card-assets/full-magic-pack/symbols/guild/ub.png"),
    UR: require("../../assets/card-assets/full-magic-pack/symbols/guild/ur.png"),
    BR: require("../../assets/card-assets/full-magic-pack/symbols/guild/br.png"),
    BG: require("../../assets/card-assets/full-magic-pack/symbols/guild/bg.png"),
    RG: require("../../assets/card-assets/full-magic-pack/symbols/guild/rg.png"),
    RW: require("../../assets/card-assets/full-magic-pack/symbols/guild/rw.png"),
    GW: require("../../assets/card-assets/full-magic-pack/symbols/guild/gw.png"),
    GU: require("../../assets/card-assets/full-magic-pack/symbols/guild/gu.png"),
  } satisfies Record<HybridManaAssetKey, ImageSourcePropType>,
  genericManaSymbol: require("../../assets/card-assets/full-magic-pack/symbols/generic.png"),
  retroSymbols: {
    W: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/W.png"),
    U: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/U.png"),
    B: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/B.png"),
    R: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/R.png"),
    G: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/G.png"),
    C: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/C.png"),
    X: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/X.png"),
    Y: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/Y.png"),
    Z: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/Z.png"),
    S: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/S.png"),
    T: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/T.png"),
    Q: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/Q.png"),
    WU: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/wu.png"),
    WB: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/wb.png"),
    UB: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/ub.png"),
    UR: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/ur.png"),
    BR: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/br.png"),
    BG: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/bg.png"),
    RG: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/rg.png"),
    RW: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/rw.png"),
    GW: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/gw.png"),
    GU: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/gu.png"),
    "2W": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/2W.png"),
    "2U": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/2U.png"),
    "2B": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/2B.png"),
    "2R": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/2R.png"),
    "2G": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/2G.png"),
    WP: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/WP.png"),
    UP: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/UP.png"),
    BP: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/BP.png"),
    RP: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/RP.png"),
    GP: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/GP.png"),
    "0": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/0.png"),
    "1": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/1.png"),
    "2": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/2.png"),
    "3": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/3.png"),
    "4": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/4.png"),
    "5": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/5.png"),
    "6": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/6.png"),
    "7": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/7.png"),
    "8": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/8.png"),
    "9": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/9.png"),
    "10": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/10.png"),
    "11": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/11.png"),
    "12": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/12.png"),
    "13": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/13.png"),
    "14": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/14.png"),
    "15": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/15.png"),
    "16": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/16.png"),
    "17": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/17.png"),
    "18": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/18.png"),
    "19": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/19.png"),
    "20": require("../../assets/card-assets/basic-m15/mse-renderer/treatments/retro/mana/20.png"),
  } satisfies Record<string, ImageSourcePropType>,
    artistArrowLight: require("../../assets/card-assets/basic-m15/source-pack/data/magic-booster.mse-style/artist_arrow_light.png"),
  flavorDivider: require("../../assets/card-assets/full-magic-pack/flavor-divider.png"),
  typeFrames: {
    token: require("../../assets/card-assets/basic-m15/type-frames/tokens/m20-normal/white.png"),
    saga: require("../../assets/card-assets/basic-m15/type-frames/saga.jpg"),
    planeswalker: require("../../assets/card-assets/basic-m15/type-frames/planeswalker.png"),
    battle: require("../../assets/card-assets/basic-m15/type-frames/battle/mse-front/mcard.jpg"),
    dfc: require("../../assets/card-assets/basic-m15/type-frames/dfc.jpg"),
    adventure: require("../../assets/card-assets/basic-m15/type-frames/adventure/mse-normal/mcard.png"),
    split: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/normal/mcard.png"),
    fuse: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/fuse_left/mfuse.png"),
    aftermath: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-aftermath.mse-style/card-sample.png"),
  } satisfies Record<Exclude<TypeFrame, "standard">, ImageSourcePropType>,
  typeFrameOverlays: {
    token: require("../../assets/card-assets/basic-m15/type-frames/tokens/m20-normal/white.png"),
    saga: require("../../assets/card-assets/basic-m15/type-frames/overlays/saga-overlay.png"),
    planeswalker: require("../../assets/card-assets/basic-m15/type-frames/overlays/planeswalker-overlay.png"),
    battle: require("../../assets/card-assets/basic-m15/type-frames/overlays/battle-overlay.png"),
    dfc: require("../../assets/card-assets/basic-m15/type-frames/overlays/dfc-overlay.png"),
    adventure: require("../../assets/card-assets/basic-m15/type-frames/overlays/adventure-overlay.png"),
    split: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/normal/mcard.png"),
    fuse: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/fuse_left/mfuse.png"),
    aftermath: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-aftermath.mse-style/card-sample.png"),
  } satisfies Record<Exclude<TypeFrame, "standard">, ImageSourcePropType>,
  splitFrames: {
    white: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/normal/wcard.png"),
    blue: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/normal/ucard.png"),
    black: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/normal/bcard.png"),
    red: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/normal/rcard.png"),
    green: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/normal/gcard.png"),
    gold: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/normal/mcard.png"),
    artifact: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/normal/acard.png"),
    land: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/normal/clcard.png"),
    colorless: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/normal/ccard.png"),
  } satisfies Record<FrameIdentity, ImageSourcePropType>,
  splitFuseFrames: {
    left: {
      white: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/fuse_left/wfuse.png"),
      blue: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/fuse_left/ufuse.png"),
      black: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/fuse_left/bfuse.png"),
      red: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/fuse_left/rfuse.png"),
      green: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/fuse_left/gfuse.png"),
      gold: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/fuse_left/mfuse.png"),
      artifact: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/fuse_left/afuse.png"),
      land: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/fuse_left/clfuse.png"),
      colorless: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/fuse_left/cfuse.png"),
    } satisfies Record<FrameIdentity, ImageSourcePropType>,
    right: {
      white: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/fuse_right/wfuse.png"),
      blue: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/fuse_right/ufuse.png"),
      black: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/fuse_right/bfuse.png"),
      red: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/fuse_right/rfuse.png"),
      green: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/fuse_right/gfuse.png"),
      gold: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/fuse_right/mfuse.png"),
      artifact: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/fuse_right/afuse.png"),
      land: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/fuse_right/clfuse.png"),
      colorless: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/fuse_right/cfuse.png"),
    } satisfies Record<FrameIdentity, ImageSourcePropType>,
  } satisfies Record<"left" | "right", Record<FrameIdentity, ImageSourcePropType>>,
  splitFuseBridges: {
    white: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/bridge/wbridge.png"),
    blue: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/bridge/ubridge.png"),
    black: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/bridge/bbridge.png"),
    red: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/bridge/rbridge.png"),
    green: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/bridge/gbridge.png"),
    gold: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/bridge/mbridge.png"),
    artifact: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/bridge/abridge.png"),
    land: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/bridge/clbridge.png"),
    colorless: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-split-fusable.mse-style/bridge/cbridge.png"),
  } satisfies Record<FrameIdentity, ImageSourcePropType>,
  aftermathFrames: {
    top: {
      white: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-aftermath.mse-style/wcard.png"),
      blue: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-aftermath.mse-style/ucard.png"),
      black: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-aftermath.mse-style/bcard.png"),
      red: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-aftermath.mse-style/rcard.png"),
      green: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-aftermath.mse-style/gcard.png"),
      gold: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-aftermath.mse-style/mcard.png"),
      artifact: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-aftermath.mse-style/acard.png"),
      land: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-aftermath.mse-style/clcard.jpg"),
      colorless: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-aftermath.mse-style/ccard.png"),
    } satisfies Record<FrameIdentity, ImageSourcePropType>,
    bottom: {
      white: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-aftermath.mse-style/wcard3.png"),
      blue: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-aftermath.mse-style/ucard3.png"),
      black: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-aftermath.mse-style/bcard3.png"),
      red: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-aftermath.mse-style/rcard3.png"),
      green: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-aftermath.mse-style/gcard3.png"),
      gold: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-aftermath.mse-style/mcard3.png"),
      artifact: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-aftermath.mse-style/acard3.png"),
      land: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-aftermath.mse-style/clcard3.jpg"),
      colorless: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-aftermath.mse-style/ccard3.png"),
    } satisfies Record<FrameIdentity, ImageSourcePropType>,
  },
  planeswalkerLoyalty: {
    start: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-planeswalker.mse-style/loyalty.png"),
    up: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-planeswalker.mse-style/loyaltyup.png"),
    down: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-planeswalker.mse-style/loyaltydown.png"),
    zero: require("../../assets/card-assets/basic-m15/source-pack/data/magic-m15-mainframe-planeswalker.mse-style/loyaltynaught.png"),
  } satisfies Record<"start" | "up" | "down" | "zero", ImageSourcePropType>,
  dfcSymbols: {
    transformFront: require("../../assets/card-assets/basic-m15/dfc-symbols/front-triangle.png"),
    transformBack: require("../../assets/card-assets/basic-m15/dfc-symbols/back-triangle.png"),
    day: require("../../assets/card-assets/basic-m15/dfc-symbols/day.png"),
    night: require("../../assets/card-assets/basic-m15/dfc-symbols/night.png"),
    modalFront: {
      artifact: require("../../assets/card-assets/basic-m15/dfc-symbols/modalfront/artifact.png"),
      black: require("../../assets/card-assets/basic-m15/dfc-symbols/modalfront/black.png"),
      blue: require("../../assets/card-assets/basic-m15/dfc-symbols/modalfront/blue.png"),
      colorless: require("../../assets/card-assets/basic-m15/dfc-symbols/modalfront/colorless.png"),
      green: require("../../assets/card-assets/basic-m15/dfc-symbols/modalfront/green.png"),
      multicolor: require("../../assets/card-assets/basic-m15/dfc-symbols/modalfront/multicolor.png"),
      red: require("../../assets/card-assets/basic-m15/dfc-symbols/modalfront/red.png"),
      white: require("../../assets/card-assets/basic-m15/dfc-symbols/modalfront/white.png"),
    },
    modalBack: {
      artifact: require("../../assets/card-assets/basic-m15/dfc-symbols/modalback/artifact.png"),
      black: require("../../assets/card-assets/basic-m15/dfc-symbols/modalback/black.png"),
      blue: require("../../assets/card-assets/basic-m15/dfc-symbols/modalback/blue.png"),
      colorless: require("../../assets/card-assets/basic-m15/dfc-symbols/modalback/colorless.png"),
      green: require("../../assets/card-assets/basic-m15/dfc-symbols/modalback/green.png"),
      multicolor: require("../../assets/card-assets/basic-m15/dfc-symbols/modalback/multicolor.png"),
      red: require("../../assets/card-assets/basic-m15/dfc-symbols/modalback/red.png"),
      white: require("../../assets/card-assets/basic-m15/dfc-symbols/modalback/white.png"),
    },
  },
  fonts: {
    BelerenBold: require("../../assets/card-assets/full-magic-pack/fonts/beleren-bold.ttf"),
    BelerenSmallCapsBold: require("../../assets/card-assets/full-magic-pack/fonts/beleren-small-caps-bold.ttf"),
    MagicMedieval: require("../../assets/card-assets/full-magic-pack/fonts/magic-medieval.ttf"),
    MatrixBold: require("../../assets/card-assets/full-magic-pack/fonts/matrix-bold.ttf"),
    MPlantin: require("../../assets/card-assets/full-magic-pack/fonts/mplantin.ttf"),
    MPlantinItalic: require("../../assets/card-assets/full-magic-pack/fonts/mplantin-italic.ttf"),
    RelayMedium: require("../../assets/card-assets/full-magic-pack/fonts/relay-medium.ttf"),
  },
  fontFamilies: {
    title: "BelerenBold",
    footer: "BelerenSmallCapsBold",
    footerCollector: "RelayMedium",
    footerArtist: "BelerenSmallCapsBold",
    footerLegal: "MatrixBold",
    retroTitle: "MagicMedieval",
    body: "MPlantin",
    italic: "MPlantinItalic",
    retroBody: "MPlantin",
    retroItalic: "MPlantinItalic",
    retroPowerToughness: "MPlantin",
  },
  legalNote:
    "Local-only copy from the user-supplied asset pack. Do not redistribute this bundle unless you have distribution rights.",
} as const;

export const TYPE_FRAME_LABELS: Record<TypeFrame, string> = {
  standard: "Mainframe",
  token: "Token",
  saga: "Saga",
  planeswalker: "Planeswalker",
  battle: "Battle",
  dfc: "DFC",
  adventure: "Adventure",
  split: "Split",
  fuse: "Fuse",
  aftermath: "Aftermath",
};

export const TYPE_FRAMES: TypeFrame[] = [
  "standard",
  "token",
  "saga",
  "planeswalker",
  "battle",
  "dfc",
  "adventure",
  "split",
  "fuse",
  "aftermath",
];

export const TYPE_FRAME_SPECS: Record<
  TypeFrame,
  {
    aspectRatio: number;
    label: string;
    orientation: "portrait" | "landscape";
    source: ImageSourcePropType;
  }
> = {
  standard: {
    aspectRatio: CARD_COORDINATES.width / CARD_COORDINATES.height,
    label: TYPE_FRAME_LABELS.standard,
    orientation: "portrait",
    source: FULL_MAGIC_PACK.frames.gold,
  },
  token: {
    aspectRatio: CARD_COORDINATES.width / CARD_COORDINATES.height,
    label: TYPE_FRAME_LABELS.token,
    orientation: "portrait",
    source: FULL_MAGIC_PACK.typeFrames.token,
  },
  saga: {
    aspectRatio: 375 / 523,
    label: TYPE_FRAME_LABELS.saga,
    orientation: "portrait",
    source: FULL_MAGIC_PACK.typeFrames.saga,
  },
  planeswalker: {
    aspectRatio: 750 / 1047,
    label: TYPE_FRAME_LABELS.planeswalker,
    orientation: "portrait",
    source: FULL_MAGIC_PACK.typeFrames.planeswalker,
  },
  battle: {
    aspectRatio: 375 / 523,
    label: TYPE_FRAME_LABELS.battle,
    orientation: "portrait",
    source: FULL_MAGIC_PACK.typeFrames.battle,
  },
  dfc: {
    aspectRatio: 375 / 523,
    label: TYPE_FRAME_LABELS.dfc,
    orientation: "portrait",
    source: FULL_MAGIC_PACK.typeFrames.dfc,
  },
  adventure: {
    aspectRatio: 375 / 523,
    label: TYPE_FRAME_LABELS.adventure,
    orientation: "portrait",
    source: FULL_MAGIC_PACK.typeFrames.adventure,
  },
  split: {
    aspectRatio: 523 / 375,
    label: TYPE_FRAME_LABELS.split,
    orientation: "landscape",
    source: FULL_MAGIC_PACK.typeFrames.split,
  },
  fuse: {
    aspectRatio: 523 / 375,
    label: TYPE_FRAME_LABELS.fuse,
    orientation: "landscape",
    source: FULL_MAGIC_PACK.typeFrames.fuse,
  },
  aftermath: {
    aspectRatio: 375 / 523,
    label: TYPE_FRAME_LABELS.aftermath,
    orientation: "portrait",
    source: FULL_MAGIC_PACK.typeFrames.aftermath,
  },
};

export function getTypeFrameSpec(typeFrame?: TypeFrame) {
  return TYPE_FRAME_SPECS[typeFrame ?? "standard"];
}

export function getTypeFrameOverlaySource(typeFrame?: TypeFrame): ImageSourcePropType {
  if (
    typeFrame &&
    typeFrame !== "standard" &&
    typeFrame in FULL_MAGIC_PACK.typeFrameOverlays
  ) {
    return FULL_MAGIC_PACK.typeFrameOverlays[typeFrame];
  }

  return getTypeFrameSpec(typeFrame).source;
}

type DfcModalSymbolColor = keyof typeof FULL_MAGIC_PACK.dfcSymbols.modalFront;

export function getDfcFaceSymbolSource({
  face,
  mode,
  frameIdentity,
}: {
  face: DfcFace;
  mode?: DfcMode;
  frameIdentity: FrameIdentity;
}): ImageSourcePropType {
  const dfcMode = mode ?? "transform";

  if (dfcMode === "dayNight") {
    return face === "front" ? FULL_MAGIC_PACK.dfcSymbols.day : FULL_MAGIC_PACK.dfcSymbols.night;
  }

  if (dfcMode === "modal") {
    const symbolColor = getDfcModalSymbolColor(frameIdentity);

    return face === "front"
      ? FULL_MAGIC_PACK.dfcSymbols.modalFront[symbolColor]
      : FULL_MAGIC_PACK.dfcSymbols.modalBack[symbolColor];
  }

  return face === "front"
    ? FULL_MAGIC_PACK.dfcSymbols.transformFront
    : FULL_MAGIC_PACK.dfcSymbols.transformBack;
}

function getDfcModalSymbolColor(frameIdentity: FrameIdentity): DfcModalSymbolColor {
  switch (frameIdentity) {
    case "white":
    case "blue":
    case "black":
    case "red":
    case "green":
    case "artifact":
    case "colorless":
      return frameIdentity;
    case "gold":
      return "multicolor";
    case "land":
    default:
      return "colorless";
  }
}

export function getTokenFrameSource(
  frameIdentity: FrameIdentity,
  variant: TokenFrameVariant = "normal",
): ImageSourcePropType {
  return FULL_MAGIC_PACK.tokenFrames[variant][frameIdentity];
}

export function getTokenPtBoxSource(frameIdentity: FrameIdentity): ImageSourcePropType {
  return FULL_MAGIC_PACK.tokenPtBoxes[frameIdentity];
}

export function getBattleFrameSource(frameIdentity: FrameIdentity): ImageSourcePropType {
  return FULL_MAGIC_PACK.battleFrames[frameIdentity];
}

export function getAdventureFrameSource(frameIdentity: FrameIdentity): ImageSourcePropType {
  return FULL_MAGIC_PACK.adventureFrames[frameIdentity];
}

export function getAdventurePtBoxSource(frameIdentity: FrameIdentity): ImageSourcePropType {
  return FULL_MAGIC_PACK.adventurePtBoxes[frameIdentity];
}

export function getBattleTypeBoxTextureSource(frameIdentity: FrameIdentity): ImageSourcePropType {
  return FULL_MAGIC_PACK.battlePanelTextures.typeBox[frameIdentity];
}

export function getBattleTextBoxTextureSource(frameIdentity: FrameIdentity): ImageSourcePropType {
  return FULL_MAGIC_PACK.battlePanelTextures.textBox[frameIdentity];
}

export function getBattleTypeBoxFrameSource(frameIdentity: FrameIdentity): ImageSourcePropType {
  return FULL_MAGIC_PACK.battleTypeBoxFrames[frameIdentity];
}

export function getBattleDefenseBoxSource(frameIdentity: FrameIdentity): ImageSourcePropType {
  return FULL_MAGIC_PACK.battleDefenseBoxes[frameIdentity];
}

export function getBattleTransformIconSource(): ImageSourcePropType {
  return FULL_MAGIC_PACK.battleTransformIcon;
}

export function getSplitFrameSource(frameIdentity: FrameIdentity): ImageSourcePropType {
  return FULL_MAGIC_PACK.splitFrames[frameIdentity];
}

export function getSplitFuseFrameSource(
  frameIdentity: FrameIdentity,
  side: "left" | "right",
): ImageSourcePropType {
  return FULL_MAGIC_PACK.splitFuseFrames[side][frameIdentity];
}

export function getSplitFuseBridgeSource(frameIdentity: FrameIdentity): ImageSourcePropType {
  return FULL_MAGIC_PACK.splitFuseBridges[frameIdentity];
}

export function getAftermathTopFrameSource(frameIdentity: FrameIdentity): ImageSourcePropType {
  return FULL_MAGIC_PACK.aftermathFrames.top[frameIdentity];
}

export function getAftermathBottomFrameSource(frameIdentity: FrameIdentity): ImageSourcePropType {
  return FULL_MAGIC_PACK.aftermathFrames.bottom[frameIdentity];
}

export function getFrameEffectOverlaySources(
  frameIdentity: FrameIdentity,
  frameEffects: FrameEffect[],
): ImageSourcePropType[] {
  const hasNyx = frameEffects.includes("nyx");
  const hasLegendary = frameEffects.includes("legendary");

  if (hasNyx && hasLegendary) {
    return [
      FULL_MAGIC_PACK.frameEffects.nyx[frameIdentity],
      FULL_MAGIC_PACK.frameEffects.legendary[frameIdentity],
    ];
  }

  if (hasNyx) {
    return [FULL_MAGIC_PACK.frameEffects.nyx[frameIdentity]];
  }

  if (hasLegendary) {
    return [FULL_MAGIC_PACK.frameEffects.legendary[frameIdentity]];
  }

  return [];
}

export function getPtBoxSource(frameIdentity: FrameIdentity): ImageSourcePropType {
  return FULL_MAGIC_PACK.ptBoxes[frameIdentity];
}

export function isManaAssetKey(value: string): value is ManaAssetKey {
  return value in FULL_MAGIC_PACK.symbols;
}

export function isHybridManaAssetKey(value: string): value is HybridManaAssetKey {
  return value in FULL_MAGIC_PACK.guildHybridSymbols;
}
