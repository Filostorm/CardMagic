import { ImageSourcePropType } from "react-native";

import { FrameIdentity, ManaColor } from "@/types/card";

export type MseM15ColorBlendKey =
  | "wu"
  | "wb"
  | "ub"
  | "wub"
  | "wr"
  | "ur"
  | "wur"
  | "br"
  | "wbr"
  | "ubr"
  | "wubr"
  | "wg"
  | "ug"
  | "wug"
  | "bg"
  | "wbg"
  | "ubg"
  | "wubg"
  | "rg"
  | "wrg"
  | "urg"
  | "wurg"
  | "brg"
  | "wbrg"
  | "ubrg"
  | "wubrg";

export type MseM15ColorBlendMode = "multicolor" | "hybrid";

export type MseM15ColorBlend = {
  key: MseM15ColorBlendKey;
  mode: MseM15ColorBlendMode;
  mirrorX?: boolean;
};

type MseM15ColorBlendSources = Record<
  MseM15ColorBlendMode,
  Record<MseM15ColorBlendKey, ImageSourcePropType>
>;

export const MSE_M15_COLOR_INDICATOR_SOURCES = {
  white: require("../../assets/card-assets/basic-m15/mse-renderer/indicators/white.png"),
  blue: require("../../assets/card-assets/basic-m15/mse-renderer/indicators/blue.png"),
  black: require("../../assets/card-assets/basic-m15/mse-renderer/indicators/black.png"),
  red: require("../../assets/card-assets/basic-m15/mse-renderer/indicators/red.png"),
  green: require("../../assets/card-assets/basic-m15/mse-renderer/indicators/green.png"),
  gold: require("../../assets/card-assets/basic-m15/mse-renderer/indicators/gold.png"),
  artifact: require("../../assets/card-assets/basic-m15/mse-renderer/indicators/artifact.png"),
  land: require("../../assets/card-assets/basic-m15/mse-renderer/indicators/land.png"),
  colorless: require("../../assets/card-assets/basic-m15/mse-renderer/indicators/colorless.png"),
} satisfies Record<FrameIdentity, ImageSourcePropType>;

export const MSE_M15_COLOR_INDICATOR_BLEND_SOURCES = {
  multicolor: {
    wu: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/wu.png"),
    wb: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/wb.png"),
    ub: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/ub.png"),
    wub: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/wub.png"),
    wr: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/wr.png"),
    ur: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/ur.png"),
    wur: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/wur.png"),
    br: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/br.png"),
    wbr: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/wbr.png"),
    ubr: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/ubr.png"),
    wubr: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/wubr.png"),
    wg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/wg.png"),
    ug: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/ug.png"),
    wug: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/wug.png"),
    bg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/bg.png"),
    wbg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/wbg.png"),
    ubg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/ubg.png"),
    wubg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/wubg.png"),
    rg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/rg.png"),
    wrg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/wrg.png"),
    urg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/urg.png"),
    wurg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/wurg.png"),
    brg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/brg.png"),
    wbrg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/wbrg.png"),
    ubrg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/ubrg.png"),
    wubrg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/multicolor/wubrg.png"),
  },
  hybrid: {
    wu: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/wu.png"),
    wb: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/wb.png"),
    ub: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/ub.png"),
    wub: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/wub.png"),
    wr: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/wr.png"),
    ur: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/ur.png"),
    wur: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/wur.png"),
    br: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/br.png"),
    wbr: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/wbr.png"),
    ubr: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/ubr.png"),
    wubr: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/wubr.png"),
    wg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/wg.png"),
    ug: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/ug.png"),
    wug: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/wug.png"),
    bg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/bg.png"),
    wbg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/wbg.png"),
    ubg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/ubg.png"),
    wubg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/wubg.png"),
    rg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/rg.png"),
    wrg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/wrg.png"),
    urg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/urg.png"),
    wurg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/wurg.png"),
    brg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/brg.png"),
    wbrg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/wbrg.png"),
    ubrg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/ubrg.png"),
    wubrg: require("../../assets/card-assets/basic-m15/mse-renderer/indicators-composited/hybrid/wubrg.png"),
  },
} satisfies MseM15ColorBlendSources;

const MSE_M15_COLOR_BLEND_KEYS = new Set<string>([
  "wu",
  "wb",
  "ub",
  "wub",
  "wr",
  "ur",
  "wur",
  "br",
  "wbr",
  "ubr",
  "wubr",
  "wg",
  "ug",
  "wug",
  "bg",
  "wbg",
  "ubg",
  "wubg",
  "rg",
  "wrg",
  "urg",
  "wurg",
  "brg",
  "wbrg",
  "ubrg",
  "wubrg",
]);
const MSE_M15_COLOR_ORDER: ManaColor[] = ["W", "U", "B", "R", "G"];
const HYBRID_PAIR_FRAME_ORIENTATION: Record<string, { key: MseM15ColorBlendKey; mirrorX?: boolean }> = {
  "W/U": { key: "wu" },
  "W/B": { key: "wb" },
  "U/B": { key: "ub" },
  "U/R": { key: "ur" },
  "B/R": { key: "br" },
  "B/G": { key: "bg" },
  "R/G": { key: "rg" },
  "R/W": { key: "wr", mirrorX: true },
  "G/W": { key: "wg", mirrorX: true },
  "G/U": { key: "ug", mirrorX: true },
};
const MULTICOLOR_MIRRORED_PAIR_KEYS = new Set<MseM15ColorBlendKey>(["wr", "wg", "ug"]);
const CANONICAL_HYBRID_PAIR_SYMBOLS: Record<string, keyof typeof HYBRID_PAIR_FRAME_ORIENTATION> = {
  WU: "W/U",
  UW: "W/U",
  WB: "W/B",
  BW: "W/B",
  UB: "U/B",
  BU: "U/B",
  UR: "U/R",
  RU: "U/R",
  BR: "B/R",
  RB: "B/R",
  BG: "B/G",
  GB: "B/G",
  RG: "R/G",
  GR: "R/G",
  RW: "R/W",
  WR: "R/W",
  GW: "G/W",
  WG: "G/W",
  GU: "G/U",
  UG: "G/U",
};

export const MSE_M15_STANDARD_FRAME_BLEND_SOURCES = {
  multicolor: {
    wu: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/wu.png"),
    wb: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/wb.png"),
    ub: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/ub.png"),
    wub: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/wub.png"),
    wr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/wr.png"),
    ur: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/ur.png"),
    wur: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/wur.png"),
    br: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/br.png"),
    wbr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/wbr.png"),
    ubr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/ubr.png"),
    wubr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/wubr.png"),
    wg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/wg.png"),
    ug: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/ug.png"),
    wug: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/wug.png"),
    bg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/bg.png"),
    wbg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/wbg.png"),
    ubg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/ubg.png"),
    wubg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/wubg.png"),
    rg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/rg.png"),
    wrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/wrg.png"),
    urg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/urg.png"),
    wurg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/wurg.png"),
    brg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/brg.png"),
    wbrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/wbrg.png"),
    ubrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/ubrg.png"),
    wubrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/multicolor/wubrg.png"),
  },
  hybrid: {
    wu: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/wu.png"),
    wb: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/wb.png"),
    ub: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/ub.png"),
    wub: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/wub.png"),
    wr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/wr.png"),
    ur: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/ur.png"),
    wur: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/wur.png"),
    br: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/br.png"),
    wbr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/wbr.png"),
    ubr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/ubr.png"),
    wubr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/wubr.png"),
    wg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/wg.png"),
    ug: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/ug.png"),
    wug: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/wug.png"),
    bg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/bg.png"),
    wbg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/wbg.png"),
    ubg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/ubg.png"),
    wubg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/wubg.png"),
    rg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/rg.png"),
    wrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/wrg.png"),
    urg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/urg.png"),
    wurg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/wurg.png"),
    brg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/brg.png"),
    wbrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/wbrg.png"),
    ubrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/ubrg.png"),
    wubrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/standard-composited/hybrid/wubrg.png"),
  },
} satisfies MseM15ColorBlendSources;

export const MSE_M15_DFC_NOTCHED_FRAME_BLEND_SOURCES = {
  multicolor: {
    wu: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/wu.png"),
    wb: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/wb.png"),
    ub: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/ub.png"),
    wub: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/wub.png"),
    wr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/wr.png"),
    ur: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/ur.png"),
    wur: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/wur.png"),
    br: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/br.png"),
    wbr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/wbr.png"),
    ubr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/ubr.png"),
    wubr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/wubr.png"),
    wg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/wg.png"),
    ug: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/ug.png"),
    wug: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/wug.png"),
    bg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/bg.png"),
    wbg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/wbg.png"),
    ubg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/ubg.png"),
    wubg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/wubg.png"),
    rg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/rg.png"),
    wrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/wrg.png"),
    urg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/urg.png"),
    wurg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/wurg.png"),
    brg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/brg.png"),
    wbrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/wbrg.png"),
    ubrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/ubrg.png"),
    wubrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/multicolor/wubrg.png"),
  },
  hybrid: {
    wu: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/wu.png"),
    wb: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/wb.png"),
    ub: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/ub.png"),
    wub: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/wub.png"),
    wr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/wr.png"),
    ur: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/ur.png"),
    wur: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/wur.png"),
    br: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/br.png"),
    wbr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/wbr.png"),
    ubr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/ubr.png"),
    wubr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/wubr.png"),
    wg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/wg.png"),
    ug: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/ug.png"),
    wug: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/wug.png"),
    bg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/bg.png"),
    wbg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/wbg.png"),
    ubg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/ubg.png"),
    wubg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/wubg.png"),
    rg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/rg.png"),
    wrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/wrg.png"),
    urg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/urg.png"),
    wurg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/wurg.png"),
    brg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/brg.png"),
    wbrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/wbrg.png"),
    ubrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/ubrg.png"),
    wubrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-notched-composited/hybrid/wubrg.png"),
  },
} satisfies MseM15ColorBlendSources;

export const MSE_M15_DFC_NORMAL_FRAME_BLEND_SOURCES = {
  multicolor: {
    wu: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/wu.png"),
    wb: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/wb.png"),
    ub: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/ub.png"),
    wub: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/wub.png"),
    wr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/wr.png"),
    ur: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/ur.png"),
    wur: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/wur.png"),
    br: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/br.png"),
    wbr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/wbr.png"),
    ubr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/ubr.png"),
    wubr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/wubr.png"),
    wg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/wg.png"),
    ug: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/ug.png"),
    wug: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/wug.png"),
    bg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/bg.png"),
    wbg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/wbg.png"),
    ubg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/ubg.png"),
    wubg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/wubg.png"),
    rg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/rg.png"),
    wrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/wrg.png"),
    urg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/urg.png"),
    wurg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/wurg.png"),
    brg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/brg.png"),
    wbrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/wbrg.png"),
    ubrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/ubrg.png"),
    wubrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/multicolor/wubrg.png"),
  },
  hybrid: {
    wu: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/wu.png"),
    wb: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/wb.png"),
    ub: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/ub.png"),
    wub: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/wub.png"),
    wr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/wr.png"),
    ur: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/ur.png"),
    wur: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/wur.png"),
    br: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/br.png"),
    wbr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/wbr.png"),
    ubr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/ubr.png"),
    wubr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/wubr.png"),
    wg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/wg.png"),
    ug: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/ug.png"),
    wug: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/wug.png"),
    bg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/bg.png"),
    wbg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/wbg.png"),
    ubg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/ubg.png"),
    wubg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/wubg.png"),
    rg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/rg.png"),
    wrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/wrg.png"),
    urg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/urg.png"),
    wurg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/wurg.png"),
    brg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/brg.png"),
    wbrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/wbrg.png"),
    ubrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/ubrg.png"),
    wubrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-normal-composited/hybrid/wubrg.png"),
  },
} satisfies MseM15ColorBlendSources;

export const MSE_M15_SAGA_FRAME_BLEND_SOURCES = {
  multicolor: {
    wu: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/wu.png"),
    wb: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/wb.png"),
    ub: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/ub.png"),
    wub: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/wub.png"),
    wr: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/wr.png"),
    ur: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/ur.png"),
    wur: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/wur.png"),
    br: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/br.png"),
    wbr: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/wbr.png"),
    ubr: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/ubr.png"),
    wubr: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/wubr.png"),
    wg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/wg.png"),
    ug: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/ug.png"),
    wug: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/wug.png"),
    bg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/bg.png"),
    wbg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/wbg.png"),
    ubg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/ubg.png"),
    wubg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/wubg.png"),
    rg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/rg.png"),
    wrg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/wrg.png"),
    urg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/urg.png"),
    wurg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/wurg.png"),
    brg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/brg.png"),
    wbrg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/wbrg.png"),
    ubrg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/ubrg.png"),
    wubrg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/multicolor/wubrg.png"),
  },
  hybrid: {
    wu: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/wu.png"),
    wb: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/wb.png"),
    ub: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/ub.png"),
    wub: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/wub.png"),
    wr: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/wr.png"),
    ur: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/ur.png"),
    wur: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/wur.png"),
    br: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/br.png"),
    wbr: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/wbr.png"),
    ubr: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/ubr.png"),
    wubr: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/wubr.png"),
    wg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/wg.png"),
    ug: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/ug.png"),
    wug: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/wug.png"),
    bg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/bg.png"),
    wbg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/wbg.png"),
    ubg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/ubg.png"),
    wubg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/wubg.png"),
    rg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/rg.png"),
    wrg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/wrg.png"),
    urg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/urg.png"),
    wurg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/wurg.png"),
    brg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/brg.png"),
    wbrg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/wbrg.png"),
    ubrg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/ubrg.png"),
    wubrg: require("../../assets/card-assets/basic-m15/mse-renderer/typeframes/saga-composited/hybrid/wubrg.png"),
  },
} satisfies MseM15ColorBlendSources;

export const MSE_M15_PT_BLEND_SOURCES = {
  multicolor: {
    wu: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/wu.png"),
    wb: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/wb.png"),
    ub: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/ub.png"),
    wub: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/wub.png"),
    wr: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/wr.png"),
    ur: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/ur.png"),
    wur: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/wur.png"),
    br: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/br.png"),
    wbr: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/wbr.png"),
    ubr: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/ubr.png"),
    wubr: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/wubr.png"),
    wg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/wg.png"),
    ug: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/ug.png"),
    wug: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/wug.png"),
    bg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/bg.png"),
    wbg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/wbg.png"),
    ubg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/ubg.png"),
    wubg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/wubg.png"),
    rg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/rg.png"),
    wrg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/wrg.png"),
    urg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/urg.png"),
    wurg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/wurg.png"),
    brg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/brg.png"),
    wbrg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/wbrg.png"),
    ubrg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/ubrg.png"),
    wubrg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/multicolor/wubrg.png"),
  },
  hybrid: {
    wu: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/wu.png"),
    wb: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/wb.png"),
    ub: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/ub.png"),
    wub: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/wub.png"),
    wr: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/wr.png"),
    ur: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/ur.png"),
    wur: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/wur.png"),
    br: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/br.png"),
    wbr: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/wbr.png"),
    ubr: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/ubr.png"),
    wubr: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/wubr.png"),
    wg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/wg.png"),
    ug: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/ug.png"),
    wug: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/wug.png"),
    bg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/bg.png"),
    wbg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/wbg.png"),
    ubg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/ubg.png"),
    wubg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/wubg.png"),
    rg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/rg.png"),
    wrg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/wrg.png"),
    urg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/urg.png"),
    wurg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/wurg.png"),
    brg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/brg.png"),
    wbrg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/wbrg.png"),
    ubrg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/ubrg.png"),
    wubrg: require("../../assets/card-assets/basic-m15/mse-renderer/pt-composited/hybrid/wubrg.png"),
  },
} satisfies MseM15ColorBlendSources;

export const MSE_M15_DFC_BACK_FRAME_BLEND_SOURCES = {
  multicolor: {
    wu: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/wu.png"),
    wb: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/wb.png"),
    ub: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/ub.png"),
    wub: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/wub.png"),
    wr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/wr.png"),
    ur: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/ur.png"),
    wur: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/wur.png"),
    br: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/br.png"),
    wbr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/wbr.png"),
    ubr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/ubr.png"),
    wubr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/wubr.png"),
    wg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/wg.png"),
    ug: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/ug.png"),
    wug: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/wug.png"),
    bg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/bg.png"),
    wbg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/wbg.png"),
    ubg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/ubg.png"),
    wubg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/wubg.png"),
    rg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/rg.png"),
    wrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/wrg.png"),
    urg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/urg.png"),
    wurg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/wurg.png"),
    brg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/brg.png"),
    wbrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/wbrg.png"),
    ubrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/ubrg.png"),
    wubrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/multicolor/wubrg.png"),
  },
  hybrid: {
    wu: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/wu.png"),
    wb: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/wb.png"),
    ub: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/ub.png"),
    wub: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/wub.png"),
    wr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/wr.png"),
    ur: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/ur.png"),
    wur: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/wur.png"),
    br: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/br.png"),
    wbr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/wbr.png"),
    ubr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/ubr.png"),
    wubr: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/wubr.png"),
    wg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/wg.png"),
    ug: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/ug.png"),
    wug: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/wug.png"),
    bg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/bg.png"),
    wbg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/wbg.png"),
    ubg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/ubg.png"),
    wubg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/wubg.png"),
    rg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/rg.png"),
    wrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/wrg.png"),
    urg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/urg.png"),
    wurg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/wurg.png"),
    brg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/brg.png"),
    wbrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/wbrg.png"),
    ubrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/ubrg.png"),
    wubrg: require("../../assets/card-assets/basic-m15/mse-renderer/mainframes/dfc-back-composited/hybrid/wubrg.png"),
  },
} satisfies MseM15ColorBlendSources;

export const MSE_M15_SAGA_BOOKMARK_BLEND_SOURCES = {
  multicolor: {
    wu: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/wu.png"),
    wb: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/wb.png"),
    ub: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/ub.png"),
    wub: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/wub.png"),
    wr: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/wr.png"),
    ur: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/ur.png"),
    wur: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/wur.png"),
    br: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/br.png"),
    wbr: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/wbr.png"),
    ubr: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/ubr.png"),
    wubr: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/wubr.png"),
    wg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/wg.png"),
    ug: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/ug.png"),
    wug: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/wug.png"),
    bg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/bg.png"),
    wbg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/wbg.png"),
    ubg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/ubg.png"),
    wubg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/wubg.png"),
    rg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/rg.png"),
    wrg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/wrg.png"),
    urg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/urg.png"),
    wurg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/wurg.png"),
    brg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/brg.png"),
    wbrg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/wbrg.png"),
    ubrg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/ubrg.png"),
    wubrg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/multicolor/wubrg.png"),
  },
  hybrid: {
    wu: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/wu.png"),
    wb: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/wb.png"),
    ub: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/ub.png"),
    wub: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/wub.png"),
    wr: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/wr.png"),
    ur: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/ur.png"),
    wur: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/wur.png"),
    br: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/br.png"),
    wbr: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/wbr.png"),
    ubr: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/ubr.png"),
    wubr: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/wubr.png"),
    wg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/wg.png"),
    ug: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/ug.png"),
    wug: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/wug.png"),
    bg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/bg.png"),
    wbg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/wbg.png"),
    ubg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/ubg.png"),
    wubg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/wubg.png"),
    rg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/rg.png"),
    wrg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/wrg.png"),
    urg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/urg.png"),
    wurg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/wurg.png"),
    brg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/brg.png"),
    wbrg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/wbrg.png"),
    ubrg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/ubrg.png"),
    wubrg: require("../../assets/card-assets/basic-m15/mse-renderer/saga/bookmarks-composited/hybrid/wubrg.png"),
  },
} satisfies MseM15ColorBlendSources;

export function getMseM15ColorBlend(
  manaColors: ManaColor[],
  manaCost: string,
): MseM15ColorBlend | null {
  const key = getMseM15ColorBlendKey(manaColors);

  if (!key) {
    return null;
  }

  const hybridFrameOrientation =
    manaColors.length === 2 ? getHybridPairFrameOrientation(manaCost, manaColors) : null;

  if (hybridFrameOrientation) {
    return {
      mode: "hybrid",
      ...hybridFrameOrientation,
    };
  }

  return {
    key,
    mode: "multicolor",
    mirrorX: manaColors.length === 2 && MULTICOLOR_MIRRORED_PAIR_KEYS.has(key),
  };
}

function getMseM15ColorBlendKey(manaColors: ManaColor[]): MseM15ColorBlendKey | null {
  const key = MSE_M15_COLOR_ORDER
    .filter((color) => manaColors.includes(color))
    .join("")
    .toLowerCase();

  if (!MSE_M15_COLOR_BLEND_KEYS.has(key)) {
    return null;
  }

  return key as MseM15ColorBlendKey;
}

function getHybridPairFrameOrientation(
  manaCost: string,
  manaColors: ManaColor[],
): { key: MseM15ColorBlendKey; mirrorX?: boolean } | null {
  const colorSet = new Set(manaColors);

  for (const match of manaCost.matchAll(/\{?\s*([WUBRG])\s*\/\s*([WUBRG])(?:\s*\/\s*P)?\s*\}?/gi)) {
    const firstColor = match[1].toUpperCase() as ManaColor;
    const secondColor = match[2].toUpperCase() as ManaColor;

    if (!colorSet.has(firstColor) || !colorSet.has(secondColor)) {
      continue;
    }

    const pair = `${firstColor}${secondColor}`;
    const canonicalPair = CANONICAL_HYBRID_PAIR_SYMBOLS[pair];

    if (canonicalPair) {
      return HYBRID_PAIR_FRAME_ORIENTATION[canonicalPair];
    }
  }

  return null;
}
