import { LinearGradient } from "expo-linear-gradient";
import { Pencil } from "lucide-react-native";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageStyle,
  ImageSourcePropType,
  PanResponder,
  Platform,
  Pressable,
  StyleProp,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import Svg, {
  ClipPath,
  Defs,
  FeColorMatrix,
  Filter,
  G,
  Image as SvgImage,
  LinearGradient as SvgLinearGradient,
  Mask,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

import { ManaSymbol } from "@/components/mana-symbol";
import {
  CARD_COORDINATES,
  FULL_MAGIC_PACK,
  getAftermathBottomFrameSource,
  getAftermathTopFrameSource,
  getAdventureFrameSource,
  getAdventurePtBoxSource,
  getBattleDefenseBoxSource,
  getBattleFrameSource,
  getBattleTransformIconSource,
  getDfcFaceSymbolSource,
  getSplitFuseBridgeSource,
  getSplitFuseFrameSource,
  getSplitFrameSource,
  getTokenFrameSource,
  getTokenPtBoxSource,
  getTypeFrameOverlaySource,
  getTypeFrameSpec,
} from "@/data/full-magic-pack";
import type { TokenFrameVariant } from "@/data/full-magic-pack";
import {
  getMseM15ColorIndicatorSource,
  getMseM15FrameTreatmentSource,
  getMseM15FutureCardColorSource,
  getMseM15FutureCardMulticolorBlendMaskSource,
  getMseM15FutureTextboxBlendMaskSource,
  getMseM15FutureTextboxTextureSource,
  getMseM15FutureTypeLineBlendMaskSource,
  getMseM15GodzillaAliasSource,
  getMseM15ArtifactMainframeBlendMaskSource,
  getMseM15MainframeSource,
  getMseM15OverlaySources,
  getMseM15PtBoxSource,
  getMseM15SagaBookmarkSource,
  getMseM15SagaChapterSource,
  getMseM15SagaLineSource,
  getMseM15SagaOverlaySources,
  getMseM15SagaPaperSource,
  getMseM15SagaStripeSource,
  getMseM15SecurityStampBackingSource,
  getMseM15SecurityStampPinlineBumpColorSource,
  getMseM15SecurityStampPinlineBumpSource,
  getMseM15SecurityStampSource,
  getMseM15StandardColorMainframeSource,
  getMseM15StandardColorMainframeTextureSource,
  getMseM15StandardColorSecurityStampBackingSource,
  getMseM15TypeLineTextureSource,
  getMseM15TypeFrameSource,
  MSE_M15_ARTIFACT_MAINFRAME_BLEND_MASK_SIZE,
  MseM15OverlayLayer,
} from "@/data/mse-frame-renderer";
import {
  getMseM15ColorBlend,
  MseM15ColorBlend,
} from "@/data/mse-frame-blends";
import {
  FRAME_STYLES,
  getManaColors,
  getFrameColors,
  getManualFrameColors,
  hasPowerToughnessBox,
  inferFrameEffects,
  inferFrameIdentity,
  inferFrameStyle,
  normalizeManaInput,
  parseManaCost,
} from "@/lib/card-style";
import {
  getEditableCardFace,
  getDfcMode,
  getNextDfcFacePatch,
  isDfcBackFace,
  shouldShowDfcFaceManaCost,
  toDfcFacePatch,
} from "@/lib/dfc";
import { getDisplayRulesText } from "@/lib/keyword-text";
import { getLoyaltyAbilities, getStartingLoyalty } from "@/lib/planeswalker";
import {
  getModernArtistLine,
  getModernCollectorLine,
  getModernCopyrightLine,
  getModernSetLanguageLine,
} from "@/lib/printing";
import {
  DEFAULT_FUSE_REMINDER_TEXT,
  getSplitHalf,
  getSplitLayout,
  isSplitTypeFrame,
  toSplitHalfCard,
} from "@/lib/split-card";
import { normalizeSagaChapterBreaks } from "@/lib/saga-text";
import {
  getTypeLineAutocompleteSuggestions,
  TypeLineAutocompleteSuggestion,
} from "@/lib/type-line-autocomplete";
import { getTypeLineChangePatch, normalizeTypeLineInput } from "@/lib/type-frame-inference";
import { SetSymbolMark, WatermarkSymbolMark } from "@/components/set-symbol";
import {
  DEFAULT_SHOWCASE_FRAME,
  getShowcaseFrameUnderlaySource,
  getShowcaseFrameSource,
  getShowcaseFrameSpec,
  getShowcasePtOverlaySource,
  ShowcaseFrameSpec,
} from "@/data/showcase-frames";
import {
  ArtTransform,
  CardDraft,
  CardSection,
  CardTextColorPreset,
  DfcFace,
  DfcMode,
  FrameIdentity,
  FrameTreatment,
  ManaColor,
  SplitCardHalf,
  TypeFrame,
} from "@/types/card";

type CardPreviewProps = {
  card: CardDraft;
  activeSection: CardSection | null;
  width: number;
  cornerRadius?: number;
  exportMode?: boolean;
  artGenerating?: boolean;
  onSectionPress: SectionPressHandler;
  onChange: (patch: Partial<CardDraft>) => void;
};

type SectionPressOptions = {
  openSheet?: boolean;
};

type SectionPressHandler = (section: CardSection, options?: SectionPressOptions) => void;

type CoordinateRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type SplitFrameSources = {
  left: ImageSourcePropType;
  right: ImageSourcePropType;
};

type ManaCostLayout = {
  rect: CoordinateRect;
  symbolSize: number;
  gap: number;
};

type TitleLayout = {
  rect: CoordinateRect;
  fontSize: number;
  lineHeight: number;
  baseNameFontSize: number;
  baseNameLineHeight: number;
};

type RulesFlavorLayout = {
  showRules: boolean;
  showFlavor: boolean;
  showDivider: boolean;
  rulesRect: CoordinateRect;
  flavorRect: CoordinateRect;
  dividerRect: CoordinateRect;
  rulesFontSize: number;
  rulesLineHeight: number;
  flavorFontSize: number;
  flavorLineHeight: number;
};

type AdventureSpellLayout = {
  nameRect: CoordinateRect;
  manaCostRect: CoordinateRect;
  typeLineRect: CoordinateRect;
  rulesRect: CoordinateRect;
};

type SagaChapterEntry = {
  chapters: number[];
  text: string;
};

type SagaTextLayout = {
  reminderText: string;
  entries: SagaChapterEntry[];
};

const DEFAULT_ART_TRANSFORM: ArtTransform = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
};

const FRAME_TREATMENT_ART_RECTS: Record<FrameTreatment, CoordinateRect> = {
  standard: CARD_COORDINATES.art,
  fullArt: { x: 23, y: 59, width: 328, height: 423 },
  extendedArt: { x: 32, y: 62, width: 311, height: 376 },
  borderless: { x: 0, y: 0, width: 375, height: 523 },
  promo: { x: 24, y: 52, width: 327, height: 422 },
  showcase: { x: 0, y: 0, width: 375, height: 523 },
  textless: { x: 29, y: 59, width: 316, height: 424 },
  retro: { x: 45, y: 51, width: 286, height: 233 },
  etchedFoil: { x: 29, y: 59, width: 316, height: 231 },
};

type FrameTreatmentLayout = {
  art: CoordinateRect;
  name: CoordinateRect;
  manaCost: CoordinateRect;
  typeLine: CoordinateRect;
  setSymbol: CoordinateRect;
  textArea: CoordinateRect;
  rulesFlavorDivider: CoordinateRect;
  ptBox: CoordinateRect;
  powerToughness: CoordinateRect;
  footer: CoordinateRect;
  showTypeLine: boolean;
};

const DEFAULT_FRAME_TREATMENT_LAYOUT: FrameTreatmentLayout = {
  art: CARD_COORDINATES.art,
  name: CARD_COORDINATES.name,
  manaCost: CARD_COORDINATES.manaCost,
  typeLine: CARD_COORDINATES.typeLine,
  setSymbol: CARD_COORDINATES.setSymbol,
  textArea: CARD_COORDINATES.textArea,
  rulesFlavorDivider: CARD_COORDINATES.rulesFlavorDivider,
  ptBox: CARD_COORDINATES.ptBox,
  powerToughness: CARD_COORDINATES.powerToughness,
  footer: CARD_COORDINATES.footer,
  showTypeLine: true,
};

const FRAME_TREATMENT_LAYOUTS: Record<FrameTreatment, FrameTreatmentLayout> = {
  standard: DEFAULT_FRAME_TREATMENT_LAYOUT,
  fullArt: {
    ...DEFAULT_FRAME_TREATMENT_LAYOUT,
    art: FRAME_TREATMENT_ART_RECTS.fullArt,
    name: { x: 32, y: 30, width: 226, height: 23 },
    manaCost: { x: 263, y: 29, width: 83, height: 23 },
    typeLine: { x: 32, y: 329, width: 270, height: 20 },
    setSymbol: { x: 304, y: 329, width: 40, height: 22 },
    textArea: { x: 35, y: 359, width: 304, height: 122 },
    rulesFlavorDivider: { x: 50, y: 426, width: 275, height: 2 },
    ptBox: { x: 273, y: 466, width: 81, height: 42 },
    powerToughness: { x: 286, y: 469, width: 60, height: 28 },
    footer: { x: 24, y: 488, width: 326, height: 20 },
  },
  extendedArt: {
    ...DEFAULT_FRAME_TREATMENT_LAYOUT,
    art: FRAME_TREATMENT_ART_RECTS.extendedArt,
    name: { x: 32, y: 30, width: 226, height: 23 },
    manaCost: { x: 263, y: 31, width: 80, height: 23 },
    typeLine: { x: 33, y: 447, width: 268, height: 18 },
    setSymbol: { x: 304, y: 445, width: 40, height: 20 },
    textArea: { x: 40, y: 260, width: 299, height: 174 },
    rulesFlavorDivider: { x: 50, y: 427, width: 275, height: 2 },
    ptBox: { x: 271, y: 461, width: 81, height: 42 },
    powerToughness: { x: 284, y: 466, width: 60, height: 28 },
    footer: { x: 26, y: 477, width: 247, height: 28 },
  },
  borderless: {
    ...DEFAULT_FRAME_TREATMENT_LAYOUT,
    art: FRAME_TREATMENT_ART_RECTS.borderless,
    name: { x: 32, y: 30, width: 226, height: 23 },
    manaCost: { x: 263, y: 29, width: 83, height: 23 },
    typeLine: { x: 28, y: 296, width: 274, height: 20 },
    setSymbol: { x: 304, y: 297, width: 40, height: 22 },
    textArea: { x: 35, y: 327, width: 304, height: 154 },
    rulesFlavorDivider: { x: 50, y: 426, width: 275, height: 2 },
    ptBox: { x: 273, y: 466, width: 81, height: 42 },
    powerToughness: { x: 286, y: 469, width: 60, height: 28 },
    footer: { x: 24, y: 488, width: 326, height: 20 },
  },
  promo: {
    ...DEFAULT_FRAME_TREATMENT_LAYOUT,
    art: FRAME_TREATMENT_ART_RECTS.promo,
  },
  showcase: {
    ...DEFAULT_FRAME_TREATMENT_LAYOUT,
    art: FRAME_TREATMENT_ART_RECTS.showcase,
    name: { x: 32, y: 30, width: 226, height: 23 },
    manaCost: { x: 263, y: 29, width: 83, height: 23 },
    typeLine: { x: 28, y: 296, width: 274, height: 20 },
    setSymbol: { x: 304, y: 297, width: 40, height: 22 },
    textArea: { x: 35, y: 327, width: 304, height: 154 },
    rulesFlavorDivider: { x: 50, y: 426, width: 275, height: 2 },
    ptBox: { x: 273, y: 466, width: 81, height: 42 },
    powerToughness: { x: 286, y: 469, width: 60, height: 28 },
    footer: { x: 24, y: 488, width: 326, height: 20 },
  },
  textless: {
    ...DEFAULT_FRAME_TREATMENT_LAYOUT,
    art: FRAME_TREATMENT_ART_RECTS.textless,
    name: { x: 32, y: 31, width: 226, height: 23 },
    manaCost: { x: 263, y: 29, width: 83, height: 23 },
    typeLine: { x: 32, y: 296, width: 0, height: 0 },
    setSymbol: { x: 0, y: 0, width: 0, height: 0 },
    textArea: { x: 42, y: 330, width: 291, height: 0 },
    rulesFlavorDivider: { x: 50, y: 426, width: 275, height: 0 },
    ptBox: { x: 284, y: 452, width: 70, height: 39 },
    powerToughness: { x: 294, y: 458, width: 48, height: 25 },
    footer: { x: 24, y: 487, width: 326, height: 22 },
    showTypeLine: false,
  },
  retro: {
    ...DEFAULT_FRAME_TREATMENT_LAYOUT,
    art: FRAME_TREATMENT_ART_RECTS.retro,
    name: { x: 42, y: 21, width: 280, height: 26 },
    manaCost: { x: 272, y: 22, width: 69, height: 24 },
    typeLine: { x: 39, y: 289, width: 270, height: 24 },
    setSymbol: { x: 308, y: 290, width: 34, height: 22 },
    textArea: { x: 49, y: 320, width: 279, height: 141 },
    rulesFlavorDivider: { x: 61, y: 389, width: 252, height: 2 },
    ptBox: { x: 295, y: 470, width: 47, height: 27 },
    powerToughness: { x: 295, y: 470, width: 47, height: 27 },
    footer: { x: 40, y: 470, width: 297, height: 28 },
  },
  etchedFoil: {
    ...DEFAULT_FRAME_TREATMENT_LAYOUT,
    art: FRAME_TREATMENT_ART_RECTS.etchedFoil,
    name: { x: 32, y: 30, width: 226, height: 23 },
    manaCost: { x: 263, y: 29, width: 83, height: 23 },
    typeLine: { x: 28, y: 296, width: 310, height: 20 },
    setSymbol: { x: 300, y: 297, width: 44, height: 22 },
    textArea: { x: 29, y: 327, width: 314, height: 154 },
    rulesFlavorDivider: { x: 50, y: 426, width: 275, height: 2 },
    ptBox: { x: 273, y: 466, width: 81, height: 42 },
    powerToughness: { x: 286, y: 469, width: 60, height: 28 },
    footer: { x: 24, y: 488, width: 326, height: 20 },
  },
};

const STELLAR_SIGHTS_TREATMENT_LAYOUT: FrameTreatmentLayout = {
  ...FRAME_TREATMENT_LAYOUTS.showcase,
  name: { x: 28, y: 304, width: 303, height: 30 },
  manaCost: { x: 250, y: 304, width: 96, height: 30 },
  typeLine: { x: 31, y: 344, width: 304, height: 22 },
  setSymbol: { x: 0, y: 0, width: 0, height: 0 },
  textArea: { x: 31, y: 381, width: 304, height: 82 },
  rulesFlavorDivider: { x: 50, y: 424, width: 275, height: 2 },
  footer: { x: 24, y: 474, width: 326, height: 24 },
};

const BATTLE_COORDINATES = {
  width: 375,
  height: 523,
  art: { x: 50, y: 36, width: 165, height: 388 },
  manaCost: { x: 21, y: 40, width: 23, height: 86 },
  name: { x: 22, y: 62, width: 23, height: 360 },
  transformIcon: { x: 17, y: 434, width: 31, height: 31 },
  typeLine: { x: 218, y: 153, width: 20, height: 303 },
  setSymbol: { x: 220, y: 36, width: 22, height: 44 },
  rulesPanel: { x: 240, y: 53, width: 110, height: 405 },
  defense: { x: 325, y: 15, width: 39, height: 39 },
  footer: { x: 24, y: 487, width: 324, height: 22 },
} as const;

const PLANESWALKER_COORDINATES = {
  width: 750,
  height: 1047,
  art: { x: 58, y: 104, width: 634, height: 476 },
  name: { x: 76, y: 37, width: 456, height: 44 },
  manaCost: { x: 548, y: 37, width: 155, height: 44 },
  typeLine: { x: 65, y: 599, width: 556, height: 40 },
  setSymbol: { x: 635, y: 600, width: 42, height: 42 },
  loyaltyArea: { x: 88, y: 660, width: 606, height: 286 },
  loyaltyCost: { x: 41, width: 92, height: 66 },
  loyaltyText: { x: 141, width: 530 },
  startingLoyalty: { x: 571, y: 939, width: 105, height: 67 },
  footer: { x: 62, y: 984, width: 550, height: 42 },
} as const;

const SPLIT_HALF_COORDINATES = {
  width: 241,
  height: 345,
  name: { x: 17, y: 13, width: 153, height: 20 },
  manaCost: { x: 170, y: 14, width: 55, height: 18 },
  art: { x: 18, y: 35, width: 205, height: 150 },
  typeLine: { x: 16, y: 197, width: 179, height: 15 },
  setSymbol: { x: 197, y: 198, width: 31, height: 14 },
  rulesText: { x: 14, y: 220, width: 211, height: 120 },
  flavorText: { x: 20, y: 306, width: 199, height: 31 },
} as const;

const SPLIT_CARD_COORDINATES = {
  width: 523,
  height: 375,
} as const;

const SPLIT_CARD_LAYOUT = {
  left: { x: 31, y: 14, width: 241, height: 345 },
  right: { x: 272, y: 14, width: 241, height: 345 },
} as const;

const SPLIT_FUSE_COORDINATES = {
  reminder: { x: 40, y: 338, width: 464, height: 19 },
  bridge: { x: 265, y: 335, width: 13, height: 24 },
} as const;

const AFTERMATH_COORDINATES = {
  topHeight: 285,
  bottomY: 285,
  bottomHeight: 238,
  topName: { x: 32, y: 30, width: 218, height: 23 },
  topManaCost: { x: 250, y: 29, width: 96, height: 23 },
  topArt: { x: 29, y: 59, width: 317, height: 117 },
  topTypeLine: { x: 30, y: 185, width: 267, height: 20 },
  topSetSymbol: { x: 300, y: 183, width: 44, height: 22 },
  topRulesText: { x: 28, y: 214, width: 317, height: 65 },
  bottomArt: { x: 205, y: 10, width: 109, height: 184 },
  bottomName: { x: 10, y: 33, width: 202, height: 21 },
  bottomTypeLine: { x: 11, y: 177, width: 198, height: 15 },
  bottomRulesText: { x: 11, y: 208, width: 182, height: 140 },
  bottomSlot: { x: 0, y: 285, width: 375, height: 238 },
} as const;

const CARD_SKIN_ALIAS_RECT = { x: 54, y: 58, width: 268, height: 17 } as const;
const FUTURESHIFTED_NAME_RECT: CoordinateRect = { x: 73, y: 28, width: 269, height: 26 };
const FUTURESHIFTED_MANA_COST_RECT: CoordinateRect = { x: 4, y: 39, width: 82, height: 254 };
const FUTURESHIFTED_TYPE_SYMBOL_RECT: CoordinateRect = { x: 19, y: 18, width: 30, height: 30 };
const FUTURESHIFTED_MANA_SYMBOL_SIZE = 31;
const FUTURESHIFTED_MANA_SLOT_ORIGINS = [
  { x: 39, y: 30 },
  { x: 24, y: 65 },
  { x: 20, y: 104 },
  { x: 20, y: 143 },
  { x: 30, y: 181 },
  { x: 50, y: 220 },
] as const;

const FUTURESHIFTED_TREATMENT_LAYOUT: FrameTreatmentLayout = {
  ...DEFAULT_FRAME_TREATMENT_LAYOUT,
  art: { x: 32, y: 44, width: 327, height: 310 },
  name: FUTURESHIFTED_NAME_RECT,
  manaCost: FUTURESHIFTED_MANA_COST_RECT,
  typeLine: { x: 49, y: 298, width: 279, height: 20 },
  setSymbol: { x: 331, y: 303, width: 22, height: 22 },
  textArea: { x: 36, y: 328, width: 301, height: 138 },
  rulesFlavorDivider: { x: 50, y: 426, width: 275, height: 2 },
  ptBox: { x: 285, y: 452, width: 70, height: 52 },
  powerToughness: { x: 287, y: 469, width: 60, height: 28 },
  footer: { x: 24, y: 488, width: 326, height: 20 },
  showTypeLine: true,
};

const FUTURE_MANA_SYMBOL_SOURCES: Record<string, ImageSourcePropType> = {
  W: require("../../assets/card-assets/basic-m15/mana-future/mana_w.png"),
  U: require("../../assets/card-assets/basic-m15/mana-future/mana_u.png"),
  B: require("../../assets/card-assets/basic-m15/mana-future/mana_b.png"),
  R: require("../../assets/card-assets/basic-m15/mana-future/mana_r.png"),
  G: require("../../assets/card-assets/basic-m15/mana-future/mana_g.png"),
  C: require("../../assets/card-assets/basic-m15/mana-future/mana_c.png"),
  S: require("../../assets/card-assets/basic-m15/mana-future/mana_s.png"),
  P: require("../../assets/card-assets/basic-m15/mana-future/mana_p.png"),
  K: require("../../assets/card-assets/basic-m15/mana-future/mana_k.png"),
  T: require("../../assets/card-assets/basic-m15/mana-future/mana_t.png"),
  TAP: require("../../assets/card-assets/basic-m15/mana-future/mana_t.png"),
  Q: require("../../assets/card-assets/basic-m15/mana-future/mana_q.png"),
  UNTAP: require("../../assets/card-assets/basic-m15/mana-future/mana_q.png"),
  CHAOS: require("../../assets/card-assets/basic-m15/mana-future/mana_chaos.png"),
  I: require("../../assets/card-assets/basic-m15/mana-future/mana_infinite.png"),
  "∞": require("../../assets/card-assets/basic-m15/mana-future/mana_infinite.png"),
  "1/2": require("../../assets/card-assets/basic-m15/mana-future/mana_1_half.png"),
  "W/U": require("../../assets/card-assets/basic-m15/mana-future/mana_wu.png"),
  "U/W": require("../../assets/card-assets/basic-m15/mana-future/mana_wu.png"),
  "W/B": require("../../assets/card-assets/basic-m15/mana-future/mana_wb.png"),
  "B/W": require("../../assets/card-assets/basic-m15/mana-future/mana_wb.png"),
  "U/B": require("../../assets/card-assets/basic-m15/mana-future/mana_ub.png"),
  "B/U": require("../../assets/card-assets/basic-m15/mana-future/mana_ub.png"),
  "U/R": require("../../assets/card-assets/basic-m15/mana-future/mana_ur.png"),
  "R/U": require("../../assets/card-assets/basic-m15/mana-future/mana_ur.png"),
  "B/R": require("../../assets/card-assets/basic-m15/mana-future/mana_br.png"),
  "R/B": require("../../assets/card-assets/basic-m15/mana-future/mana_br.png"),
  "B/G": require("../../assets/card-assets/basic-m15/mana-future/mana_bg.png"),
  "G/B": require("../../assets/card-assets/basic-m15/mana-future/mana_bg.png"),
  "R/G": require("../../assets/card-assets/basic-m15/mana-future/mana_rg.png"),
  "G/R": require("../../assets/card-assets/basic-m15/mana-future/mana_rg.png"),
  "R/W": require("../../assets/card-assets/basic-m15/mana-future/mana_rw.png"),
  "W/R": require("../../assets/card-assets/basic-m15/mana-future/mana_rw.png"),
  "G/W": require("../../assets/card-assets/basic-m15/mana-future/mana_gw.png"),
  "W/G": require("../../assets/card-assets/basic-m15/mana-future/mana_gw.png"),
  "G/U": require("../../assets/card-assets/basic-m15/mana-future/mana_gu.png"),
  "U/G": require("../../assets/card-assets/basic-m15/mana-future/mana_gu.png"),
  "P/W": require("../../assets/card-assets/basic-m15/mana-future/mana_pw.png"),
  "W/P": require("../../assets/card-assets/basic-m15/mana-future/mana_pw.png"),
  "P/U": require("../../assets/card-assets/basic-m15/mana-future/mana_pu.png"),
  "U/P": require("../../assets/card-assets/basic-m15/mana-future/mana_pu.png"),
  "P/B": require("../../assets/card-assets/basic-m15/mana-future/mana_pb.png"),
  "B/P": require("../../assets/card-assets/basic-m15/mana-future/mana_pb.png"),
  "P/R": require("../../assets/card-assets/basic-m15/mana-future/mana_pr.png"),
  "R/P": require("../../assets/card-assets/basic-m15/mana-future/mana_pr.png"),
  "P/G": require("../../assets/card-assets/basic-m15/mana-future/mana_pg.png"),
  "G/P": require("../../assets/card-assets/basic-m15/mana-future/mana_pg.png"),
};

const FUTURE_NUMERIC_HYBRID_SOURCES: Record<ManaColor, ImageSourcePropType> = {
  W: require("../../assets/card-assets/basic-m15/mana-future/mana_nw.png"),
  U: require("../../assets/card-assets/basic-m15/mana-future/mana_nu.png"),
  B: require("../../assets/card-assets/basic-m15/mana-future/mana_nb.png"),
  R: require("../../assets/card-assets/basic-m15/mana-future/mana_nr.png"),
  G: require("../../assets/card-assets/basic-m15/mana-future/mana_ng.png"),
};

const FUTURE_GENERIC_MANA_SOURCES: Partial<Record<FrameIdentity, ImageSourcePropType>> = {
  white: require("../../assets/card-assets/basic-m15/mana-future/mana_circle_w.png"),
  blue: require("../../assets/card-assets/basic-m15/mana-future/mana_circle_u.png"),
  black: require("../../assets/card-assets/basic-m15/mana-future/mana_circle_b.png"),
  red: require("../../assets/card-assets/basic-m15/mana-future/mana_circle_r.png"),
  green: require("../../assets/card-assets/basic-m15/mana-future/mana_circle_g.png"),
};

const FUTURE_GENERIC_MANA_SOURCE = require("../../assets/card-assets/basic-m15/mana-future/mana_circle.png");
const FUTURE_ARTIST_PAINTBRUSH_SOURCES = {
  black: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future-common.mse-include/paintbrush_black.png"),
  white: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future-common.mse-include/paintbrush_white.png"),
} satisfies Record<"black" | "white", ImageSourcePropType>;

const FUTURE_TYPE_SYMBOL_SOURCES = {
  artifact: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-future.mse-style/symbols/artifact.png"),
  creature: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-future.mse-style/symbols/creature.png"),
  enchantment: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-future.mse-style/symbols/enchantment.png"),
  fortress: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-future.mse-style/symbols/fortress.png"),
  instant: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-future.mse-style/symbols/instant.png"),
  land: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-future.mse-style/symbols/land.png"),
  multitype: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-future.mse-style/symbols/multitype.png"),
  planeswalker: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-future.mse-style/symbols/planeswalker.png"),
  sorcery: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-future.mse-style/symbols/sorcery.png"),
} satisfies Record<FutureTypeSymbolKey, ImageSourcePropType>;

type FutureTypeSymbolKey =
  | "artifact"
  | "creature"
  | "enchantment"
  | "fortress"
  | "instant"
  | "land"
  | "multitype"
  | "planeswalker"
  | "sorcery";

type SecurityStampCoordinateSystem = "portrait" | "futurePortrait" | "planeswalker" | "splitLandscape";

const SECURITY_STAMP_RECTS: Record<
  SecurityStampCoordinateSystem,
  { backing: CoordinateRect; foil: CoordinateRect; backingRotation?: string }
> = {
  portrait: {
    // MSE stamp backing: left 159, top 471, width 56, height 26.
    backing: { x: 159, y: 471, width: 56, height: 26 },
    // The bundled foil image is already an oval sticker asset, so keep its native 46:26 aspect.
    foil: { x: 164, y: 472, width: 46, height: 26 },
  },
  futurePortrait: {
    // MSE Future Sight stamp: left 165, top 474, width 46, height 26.
    backing: { x: 160, y: 473, width: 56, height: 26 },
    foil: { x: 165, y: 474, width: 46, height: 26 },
  },
  planeswalker: {
    // Planeswalker templates are 2x the normal M15 coordinate space.
    backing: { x: 318, y: 942, width: 112, height: 52 },
    foil: { x: 330, y: 944, width: 92, height: 52 },
  },
  splitLandscape: {
    // MSE landscape stamp backing: left 52, top 159, width 56, height 26.
    backing: { x: 52, y: 159, width: 56, height: 26 },
    foil: { x: 57, y: 159, width: 46, height: 26 },
    backingRotation: "-90deg",
  },
};
const SECURITY_STAMP_PINLINE_BUMP_SOURCE_SIZE = { width: 372, height: 519.5 } as const;
const SECURITY_STAMP_PINLINE_BUMP_PLANESWALKER_SOURCE_SIZE = { width: 744, height: 1039 } as const;
const SECURITY_STAMP_PINLINE_BUMP_INSET = {
  left: 10.5,
  top: 0.5,
  right: 8.5,
  bottom: -14.5,
} as const;

const TYPE_FRAME_SECTION_RECTS: Partial<
  Record<
    TypeFrame,
    {
      art: CoordinateRect;
      textArea: CoordinateRect;
      typeLine: CoordinateRect;
      rulesFlavorDivider: CoordinateRect;
      setSymbol: CoordinateRect;
    }
  >
> = {
  token: {
    art: { x: 0, y: 0, width: 375, height: 523 },
    textArea: { x: 29, y: 388, width: 315, height: 94 },
    typeLine: { x: 32, y: 356, width: 267, height: 20 },
    rulesFlavorDivider: { x: 50, y: 420, width: 275, height: 2 },
    setSymbol: { x: 300, y: 358, width: 44, height: 22 },
  },
  saga: {
    art: { x: 188, y: 59, width: 157, height: 379 },
    textArea: { x: 30, y: 60, width: 153, height: 378 },
    typeLine: { x: 33, y: 444, width: 287, height: 20 },
    rulesFlavorDivider: { x: 30, y: 155, width: 156, height: 3 },
    setSymbol: { x: 320, y: 445, width: 22, height: 21 },
  },
  planeswalker: {
    art: PLANESWALKER_COORDINATES.art,
    textArea: PLANESWALKER_COORDINATES.loyaltyArea,
    typeLine: PLANESWALKER_COORDINATES.typeLine,
    rulesFlavorDivider: { x: 141, y: 755, width: 530, height: 2 },
    setSymbol: PLANESWALKER_COORDINATES.setSymbol,
  },
  adventure: {
    art: { x: 29, y: 59, width: 316, height: 231 },
    textArea: { x: 200, y: 328, width: 143, height: 153 },
    typeLine: { x: 32, y: 296, width: 280, height: 20 },
    rulesFlavorDivider: { x: 207, y: 410, width: 128, height: 2 },
    setSymbol: { x: 315, y: 297, width: 28, height: 22 },
  },
};

const ADVENTURE_SPELL_LAYOUT: AdventureSpellLayout = {
  nameRect: { x: 32, y: 328, width: 103, height: 20 },
  manaCostRect: { x: 135, y: 328, width: 45, height: 20 },
  typeLineRect: { x: 32, y: 352, width: 155, height: 20 },
  rulesRect: { x: 29, y: 375, width: 157, height: 106 },
};

const SAGA_COORDINATES = {
  paper: { x: 28, y: 58, width: 160, height: 380 },
  bookmark: { x: 15, y: 60, width: 27, height: 372 },
  chapterIcon: { x: 14, width: 30, height: 34 },
  reminderText: { x: 45, y: 60, width: 138, height: 95 },
  chapterText: { x: 45, width: 138 },
  line: { x: 30, width: 156, height: 3 },
  reminderDividerY: 155,
  chapterDividers: [248, 342],
  chapterIconY: [185, 279, 373, 600, 600, 600],
  chapterBoxes: [
    { y: 155, height: 94 },
    { y: 249, height: 94 },
    { y: 343, height: 94 },
  ],
} as const;

const DEFAULT_SAGA_REMINDER =
  "(As this Saga enters and after your draw step, add a lore counter. Sacrifice after III.)";
const SAGA_CHAPTER_PREFIX_PATTERN =
  /^((?:VI|IV|III|II|V|I)(?:\s*(?:,|-|–|—|\s)\s*(?:VI|IV|III|II|V|I))*)\s*[—–-]/i;
const SAGA_CHAPTER_TOKEN_PATTERN = /\b(?:VI|IV|III|II|V|I)\b/g;
const POWER_TOUGHNESS_TEXT_OFFSET_Y = -4;
const DFC_COLOR_INDICATOR_RECT: CoordinateRect = { x: 31, y: 301, width: 17, height: 17 };
const cardPreviewShadowStyle = {
  boxShadow: "0 16px 32px rgba(0, 0, 0, 0.26)",
};
const MSE_M15_TYPELINE_TEXTURE_SIZE = { width: 339, height: 464 };
const FUTURESHIFTED_TYPELINE_LAYER_RECT: CoordinateRect = { x: 18, y: 17, width: 339, height: 464 };
const MSE_M15_FUTURE_TEXTBOX_TEXTURE_SIZE = { width: 335, height: 152 };
const FUTURESHIFTED_TEXTBOX_LAYER_RECT: CoordinateRect = { x: 23, y: 320, width: 335, height: 152 };
const FUTURESHIFTED_TITLE_TERMINAL_DOT_RECT: CoordinateRect = { x: 348, y: 73, width: 7, height: 7 };
const TITLE_KERNING_FIX = {
  letterSpacing: 0,
  // Beleren's V kerning pairs render too tight in RN Web TextInput.
  fontKerning: "none",
  fontFeatureSettings: "'kern' 0",
} as const;
const EXPORT_TITLE_KERNING_FIX =
  Platform.OS === "web"
    ? ({
        letterSpacing: 0,
        fontKerning: "normal",
        fontFeatureSettings: "'kern' 1",
        wordSpacing: "-0.08em",
      } as const)
    : TITLE_KERNING_FIX;
function getExportTitleText(title: string) {
  return (title || "Untitled").replace(/\bV(?=[a-z])/g, "V\u200A");
}

function getWebSafeEditableTextMetrics(fontSize: number, lineHeight: number) {
  return { fontSize, lineHeight };
}

function optionalTransformStyle(transform: NonNullable<ViewStyle["transform"]> | false | null | undefined) {
  return transform && transform.length > 0 ? { transform } : null;
}

function getRetroTextShadow(scale: number) {
  return {
    textShadowColor: "rgba(0, 0, 0, 0.95)",
    textShadowOffset: { width: 1 * scale, height: 1 * scale },
    textShadowRadius: 0,
  } as const;
}

function SecurityStampLayer({
  card,
  faceCard,
  typeFrame,
  frameIdentity,
  colorBlend = null,
  coordinateSystem,
  visible,
  showPinlineBump = true,
  backingSource,
  backingOverlaySource,
  foilSource,
  foilRect,
}: {
  card: CardDraft;
  faceCard: CardDraft;
  typeFrame: TypeFrame;
  frameIdentity: FrameIdentity;
  colorBlend?: MseM15ColorBlend | null;
  coordinateSystem: SecurityStampCoordinateSystem;
  visible?: boolean;
  showPinlineBump?: boolean;
  backingSource?: ImageSourcePropType | null;
  backingOverlaySource?: ImageSourcePropType | null;
  foilSource?: ImageSourcePropType;
  foilRect?: CoordinateRect;
}) {
  if (!(visible ?? shouldShowSecurityStamp(card, faceCard, typeFrame))) {
    return null;
  }

  const layout = SECURITY_STAMP_RECTS[coordinateSystem];
  const resolvedFoilRect = foilRect ?? layout.foil;
  const resolvedBackingSource = backingSource ?? getMseM15SecurityStampBackingSource(frameIdentity, colorBlend);
  const stampPinlineUsesGold = frameIdentity === "gold" || getFrameColors(faceCard).length > 2;
  const pinlineBumpLayout = showPinlineBump
    ? getSecurityStampPinlineBumpLayout(coordinateSystem, layout.backing)
    : null;
  const backingTransformStyle = optionalTransformStyle(
    layout.backingRotation ? [{ rotate: layout.backingRotation }] : null,
  );

  return (
    <>
      <SecurityStampBackingLayer
        source={resolvedBackingSource}
        coordinateSystem={coordinateSystem}
        rect={layout.backing}
        zIndex={20}
        transformStyle={backingTransformStyle}
      />
      {backingOverlaySource ? (
        <SecurityStampBackingLayer
          source={backingOverlaySource}
          coordinateSystem={coordinateSystem}
          rect={layout.backing}
          zIndex={21}
          transformStyle={backingTransformStyle}
        />
      ) : null}
      <Image
        accessibilityIgnoresInvertColors
        source={foilSource ?? getMseM15SecurityStampSource()}
        resizeMode="stretch"
        style={{
          ...securityStampRectStyle(coordinateSystem, resolvedFoilRect),
          zIndex: 22,
        }}
      />
      {pinlineBumpLayout ? (
        <MaskedSecurityStampPinlineBump
          coordinateSystem={coordinateSystem}
          rect={pinlineBumpLayout.pinlineRect}
          maskSource={getMseM15SecurityStampPinlineBumpSource()}
          colorSource={getMseM15SecurityStampPinlineBumpColorSource(frameIdentity, stampPinlineUsesGold)}
          sourceSize={pinlineBumpLayout.sourceSize}
          zIndex={23}
        />
      ) : null}
    </>
  );
}

function MaskedSecurityStampPinlineBump({
  coordinateSystem,
  rect,
  maskSource,
  colorSource,
  sourceSize,
  zIndex,
}: {
  coordinateSystem: SecurityStampCoordinateSystem;
  rect: CoordinateRect;
  maskSource: ImageSourcePropType;
  colorSource: ImageSourcePropType;
  sourceSize: Pick<CoordinateRect, "width" | "height">;
  zIndex: number;
}) {
  const maskId = `security-stamp-pinline-bump-${coordinateSystem}`.replace(/[^a-zA-Z0-9_-]/g, "-");

  return (
    <View
      pointerEvents="none"
      style={{
        ...securityStampRectStyle(coordinateSystem, rect),
        zIndex,
        overflow: "hidden",
      } as ViewStyle}
    >
      <Svg
        pointerEvents="none"
        width="100%"
        height="100%"
        viewBox={`${rect.x} ${rect.y} ${rect.width} ${rect.height}`}
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        }}
      >
        <Defs>
          <Mask
            id={maskId}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            maskUnits="userSpaceOnUse"
            maskType="luminance"
          >
            <SvgImage
              href={maskSource as never}
              x="0"
              y="0"
              width={sourceSize.width}
              height={sourceSize.height}
              preserveAspectRatio="none"
            />
          </Mask>
        </Defs>
        <SvgImage
          href={colorSource as never}
          x="0"
          y="0"
          width={sourceSize.width}
          height={sourceSize.height}
          preserveAspectRatio="none"
          mask={`url(#${maskId})`}
        />
      </Svg>
    </View>
  );
}

function SecurityStampBackingLayer({
  source,
  coordinateSystem,
  rect,
  zIndex,
  transformStyle,
}: {
  source: ImageSourcePropType;
  coordinateSystem: SecurityStampCoordinateSystem;
  rect: CoordinateRect;
  zIndex: number;
  transformStyle?: StyleProp<ViewStyle>;
}) {
  const baseStyle = {
    ...securityStampRectStyle(coordinateSystem, rect),
    zIndex,
  };

  return (
    <Image
      accessibilityIgnoresInvertColors
      source={source}
      resizeMode="stretch"
      style={[baseStyle as ImageStyle, transformStyle as StyleProp<ImageStyle>]}
    />
  );
}

function getSecurityStampPinlineBumpLayout(
  coordinateSystem: SecurityStampCoordinateSystem,
  backingRect: CoordinateRect,
) {
  if (coordinateSystem === "splitLandscape") {
    return null;
  }

  const scale = coordinateSystem === "planeswalker" ? 2 : 1;
  const pinlineRect = expandCoordinateRect(
    backingRect,
    SECURITY_STAMP_PINLINE_BUMP_INSET.left * scale,
    SECURITY_STAMP_PINLINE_BUMP_INSET.top * scale,
    SECURITY_STAMP_PINLINE_BUMP_INSET.right * scale,
    SECURITY_STAMP_PINLINE_BUMP_INSET.bottom * scale,
  );

  return {
    pinlineRect,
    sourceSize:
      coordinateSystem === "planeswalker"
        ? SECURITY_STAMP_PINLINE_BUMP_PLANESWALKER_SOURCE_SIZE
        : SECURITY_STAMP_PINLINE_BUMP_SOURCE_SIZE,
  };
}

function securityStampRectStyle(
  coordinateSystem: SecurityStampCoordinateSystem,
  rect: CoordinateRect,
) {
  if (coordinateSystem === "planeswalker") {
    return planeswalkerRectStyle(rect);
  }

  if (coordinateSystem === "splitLandscape") {
    return splitCardRectStyle(rect);
  }

  return rectStyle(rect);
}

function TextlessBottomBarLayer() {
  return (
    <Svg
      pointerEvents="none"
      width="100%"
      height="100%"
      viewBox={`0 0 ${CARD_COORDINATES.width} ${CARD_COORDINATES.height}`}
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      }}
    >
      <Path
        fill="#030303"
        d="M0 455 C7 479 21 492 43 492 H157 C163 482 174 478 187.5 478 C201 478 212 482 218 492 H332 C354 492 368 479 375 455 V523 H0 Z"
      />
    </Svg>
  );
}

function shouldShowSecurityStamp(
  card: CardDraft,
  faceCard: CardDraft,
  typeFrame: TypeFrame,
): boolean {
  if (typeFrame === "token") {
    return false;
  }

  if ((card.typeFrame === "dfc" || card.typeFrame === "battle") && isDfcBackFace(card)) {
    return false;
  }

  if (card.frameTreatment === "retro" || faceCard.frameTreatment === "retro") {
    return false;
  }

  return isCardSecurityStamped(card) || isCardSecurityStamped(faceCard);
}

function getSplitSecurityStampFrameIdentity(
  card: CardDraft,
  leftHalf: SplitCardHalf,
  rightHalf: SplitCardHalf,
): FrameIdentity {
  const leftFrameIdentity = inferFrameIdentity(toSplitHalfCard(card, leftHalf));
  const rightFrameIdentity = inferFrameIdentity(toSplitHalfCard(card, rightHalf));

  return leftFrameIdentity === rightFrameIdentity ? leftFrameIdentity : "gold";
}

function getSecurityStampMseColorBlend(
  card: CardDraft,
  frameColors: ManaColor[],
): MseM15ColorBlend | null {
  if (!shouldUseMseM15ColorBlend(card, frameColors)) {
    return null;
  }

  return getMseM15ColorBlend(frameColors, getManualFrameColors(card).length > 0 ? "" : card.manaCost);
}

function getSecurityStampBackingColorBlend(
  frameColors: ManaColor[],
  colorBlend: MseM15ColorBlend | null,
): MseM15ColorBlend | null {
  if (frameColors.length > 2) {
    return null;
  }

  if (frameColors.length === 2 && colorBlend) {
    return { ...colorBlend, mode: "hybrid" };
  }

  return colorBlend;
}

function getSecurityStampBackingFrameIdentity(
  frameIdentity: FrameIdentity,
  frameColors: ManaColor[],
): FrameIdentity {
  return frameColors.length > 2 ? "gold" : frameIdentity;
}

function getBorderlessTreatmentFrameBlendSources(
  frameColors: ManaColor[],
  colorBlend: MseM15ColorBlend | null,
  stamped: boolean,
): SplitFrameSources | null {
  if (!colorBlend || frameColors.length !== 2) {
    return null;
  }

  const [leftColor, rightColor] = frameColors;
  const leftSource = getMseM15FrameTreatmentSource(
    "borderless",
    getFrameIdentityForManaColor(leftColor),
    stamped,
  );
  const rightSource = getMseM15FrameTreatmentSource(
    "borderless",
    getFrameIdentityForManaColor(rightColor),
    stamped,
  );

  if (!leftSource || !rightSource) {
    return null;
  }

  return { left: leftSource, right: rightSource };
}

function getSecurityStampBackingConfig(
  card: CardDraft,
  frameIdentity: FrameIdentity,
): {
  frameIdentity: FrameIdentity;
  colorBlend: MseM15ColorBlend | null;
  backingSource: ImageSourcePropType;
} {
  const frameColors = getFrameColors(card);
  const colorBlend = getSecurityStampBackingColorBlend(
    frameColors,
    getSecurityStampMseColorBlend(card, frameColors),
  );
  const backingFrameIdentity = getSecurityStampBackingFrameIdentity(frameIdentity, frameColors);

  return {
    frameIdentity: backingFrameIdentity,
    colorBlend,
    backingSource: getMseM15SecurityStampBackingSource(backingFrameIdentity, colorBlend),
  };
}

function getSplitSecurityStampBackingConfig(
  card: CardDraft,
  leftHalf: SplitCardHalf,
  rightHalf: SplitCardHalf,
): {
  frameIdentity: FrameIdentity;
  colorBlend: MseM15ColorBlend | null;
  backingSource: ImageSourcePropType;
} {
  const leftCard = toSplitHalfCard(card, leftHalf);
  const rightCard = toSplitHalfCard(card, rightHalf);
  const frameColors = [...getFrameColors(leftCard), ...getFrameColors(rightCard)].filter(
    (color, index, colors) => colors.indexOf(color) === index,
  );
  const colorBlend =
    frameColors.length > 1
      ? getMseM15ColorBlend(frameColors, `${leftHalf.manaCost} ${rightHalf.manaCost}`)
      : null;
  const stampColorBlend = getSecurityStampBackingColorBlend(frameColors, colorBlend);
  const stampFrameIdentity = getSecurityStampBackingFrameIdentity(
    getSplitSecurityStampFrameIdentity(card, leftHalf, rightHalf),
    frameColors,
  );

  return {
    frameIdentity: stampFrameIdentity,
    colorBlend: stampColorBlend,
    backingSource: getMseM15SecurityStampBackingSource(stampFrameIdentity, stampColorBlend),
  };
}

function FutureTitleTerminalDot({ color, scale }: { color: string; scale: number }) {
  return (
    <View
      pointerEvents="none"
      style={{
        ...rectStyle(FUTURESHIFTED_TITLE_TERMINAL_DOT_RECT),
        borderRadius: 999,
        backgroundColor: color,
        borderWidth: 0.65 * scale,
        borderColor: "rgba(39, 29, 10, 0.72)",
        shadowColor: "#000000",
        shadowOpacity: 0.28,
        shadowRadius: 0.8 * scale,
        shadowOffset: { width: 0, height: 0.35 * scale },
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 1.1 * scale,
          left: 1.3 * scale,
          width: 2.4 * scale,
          height: 1.6 * scale,
          borderRadius: 999,
          backgroundColor: "rgba(255, 255, 255, 0.36)",
        }}
      />
    </View>
  );
}

function getFuturePinlineBlendColors(
  frameColors: ManaColor[],
  frameIdentity: FrameIdentity,
): [ManaColor, ManaColor] | null {
  if (frameIdentity !== "gold" || frameColors.length < 2) {
    return null;
  }

  const uniqueColors = frameColors.filter((color, index) => frameColors.indexOf(color) === index);

  if (uniqueColors.length < 2) {
    return null;
  }

  return [uniqueColors[0], uniqueColors[uniqueColors.length - 1]];
}

function hasHybridManaSymbols(manaCost: string): boolean {
  return parseManaCost(manaCost).some((symbol) => symbol.includes("/"));
}

function getFutureTitleTerminalDotColor(
  frameIdentity: FrameIdentity,
  blendColors: [ManaColor, ManaColor] | null,
): string {
  if (blendColors) {
    return FRAME_STYLES[getFrameIdentityForManaColor(blendColors[1])].pinline;
  }

  return FRAME_STYLES[frameIdentity].pinline;
}

function getFrameIdentityForManaColor(color: ManaColor): FrameIdentity {
  switch (color) {
    case "W":
      return "white";
    case "U":
      return "blue";
    case "B":
      return "black";
    case "R":
      return "red";
    case "G":
      return "green";
  }
}

function ModernPrintingFooter({
  card,
  scale,
  hasPowerToughness = false,
  variant = "card",
}: {
  card: CardDraft;
  scale: number;
  hasPowerToughness?: boolean;
  variant?: "card" | "battle" | "token" | "futureshifted";
}) {
  const isBattle = variant === "battle";
  const isToken = variant === "token";
  const isFutureshifted = variant === "futureshifted";
  const footerInk = isToken ? "#171512" : "#f6f0df";
  const collectorFontSize = (isBattle ? 8.6 : 8.2) * scale;
  const collectorLineHeight = (isBattle ? 9.4 : 8.8) * scale;
  const detailFontSize = (isBattle ? 7.6 : 7.25) * scale;
  const detailLineHeight = (isBattle ? 8.3 : 7.8) * scale;
  const legalFontSize = (isBattle ? 5.9 : 10.1) * scale;
  const legalLineHeight = (isBattle ? 6.5 : 10.35) * scale;
  const leftColumnWidth = (isBattle ? 170 : 160) * scale;
  const arrowWidth = (isBattle ? 8 : 7.5) * scale;
  const arrowHeight = (isBattle ? 4.8 : 4.5) * scale;
  const collectorFontFamily = FULL_MAGIC_PACK.fontFamilies.footerCollector;
  const artistFontFamily = FULL_MAGIC_PACK.fontFamilies.footerArtist;
  const legalFontFamily = FULL_MAGIC_PACK.fontFamilies.footerLegal;

  if (isFutureshifted) {
    const futureFrameIdentity = inferFrameIdentity(card);
    const usesDarkFutureFooterInk = futureFrameIdentity === "artifact";
    const futureFooterInk = usesDarkFutureFooterInk ? "#171512" : "#f6f0df";
    const paintbrushSource = usesDarkFutureFooterInk
      ? FUTURE_ARTIST_PAINTBRUSH_SOURCES.black
      : FUTURE_ARTIST_PAINTBRUSH_SOURCES.white;
    const rightBound = hasPowerToughness ? 275 : 338;
    const setCodeWidth = 40 * scale;
    const artistTop = 475 - FUTURESHIFTED_TREATMENT_LAYOUT.footer.y;
    const copyrightTop = 488 - FUTURESHIFTED_TREATMENT_LAYOUT.footer.y;
    const artist = card.artist?.trim() || "Local Artist";
    const artistTextWidth = Math.max(58, Math.min(170, artist.length * 5.6)) * scale;
    const artistRight = (rightBound - FUTURESHIFTED_TREATMENT_LAYOUT.footer.x) * scale;
    const paintbrushWidth = 40 * scale;
    const paintbrushLeft = artistRight - artistTextWidth - paintbrushWidth;
    const legalWidth = (rightBound - 30) * scale;

    return (
      <View
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      >
        <Text
          selectable
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.65}
          style={{
            position: "absolute",
            left: 0,
            top: 10 * scale,
            width: setCodeWidth,
            color: futureFooterInk,
            fontFamily: FULL_MAGIC_PACK.fontFamilies.footerCollector,
            fontSize: 7.2 * scale,
            lineHeight: 8 * scale,
            textAlign: "left",
          }}
        >
          {getModernCollectorLine(card)}
        </Text>
        <View
          style={{
            position: "absolute",
            left: Math.max(0, paintbrushLeft),
            top: artistTop * scale,
            width: Math.max(0, artistRight - Math.max(0, paintbrushLeft)),
            height: 16 * scale,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            minWidth: 0,
          }}
        >
          <Image
            accessibilityIgnoresInvertColors
            source={paintbrushSource}
            resizeMode="stretch"
            style={{
              width: paintbrushWidth,
              height: 15 * scale,
              marginRight: 0,
              opacity: 0.95,
            }}
          />
          <Text
            selectable
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.55}
            style={{
              color: futureFooterInk,
              flexShrink: 1,
              fontFamily: FULL_MAGIC_PACK.fontFamilies.footerArtist,
              fontSize: 10 * scale,
              lineHeight: 16 * scale,
              textAlign: "right",
            }}
          >
            {artist}
          </Text>
        </View>
        <Text
          selectable
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.55}
          style={{
            position: "absolute",
            left: 6 * scale,
            top: copyrightTop * scale,
            width: legalWidth,
            color: futureFooterInk,
            fontFamily: FULL_MAGIC_PACK.fontFamilies.body,
            fontSize: 7 * scale,
            lineHeight: 12 * scale,
            textAlign: "right",
          }}
        >
          {getModernCopyrightLine(card)}
        </Text>
      </View>
    );
  }

  if (!isBattle && !isToken) {
    return (
      <View
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      >
        <View
          style={{
            position: "absolute",
            left: 0,
            top: 1.5 * scale,
            width: leftColumnWidth,
            minWidth: 0,
          }}
        >
          <Text
            selectable
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
            style={{
              color: footerInk,
              fontFamily: collectorFontFamily,
              fontSize: collectorFontSize,
              lineHeight: collectorLineHeight,
              textTransform: "uppercase",
            }}
          >
            {getModernCollectorLine(card)}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", minWidth: 0 }}>
            <Text
              selectable
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              style={{
                color: footerInk,
                fontFamily: collectorFontFamily,
                fontSize: detailFontSize,
                lineHeight: detailLineHeight,
                textTransform: "uppercase",
              }}
            >
              {getModernSetLanguageLine(card)}
            </Text>
            <Image
              accessibilityIgnoresInvertColors
              source={FULL_MAGIC_PACK.artistArrowLight}
              resizeMode="contain"
              style={{
                width: arrowWidth,
                height: arrowHeight,
                marginLeft: 2.3 * scale,
                marginRight: 1.8 * scale,
                opacity: 0.95,
              }}
            />
            <Text
              selectable
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.55}
              style={{
                color: footerInk,
                flex: 1,
                fontFamily: artistFontFamily,
                fontSize: detailFontSize,
                lineHeight: detailLineHeight,
                textTransform: "uppercase",
              }}
            >
              {getModernArtistLine(card)}
            </Text>
          </View>
        </View>
        <Text
          selectable
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          style={{
            position: "absolute",
            right: 0,
            bottom: (hasPowerToughness ? -3.8 : 3.2) * scale,
            width: 204 * scale,
            color: footerInk,
            fontFamily: legalFontFamily,
            fontSize: legalFontSize,
            lineHeight: legalLineHeight,
            opacity: 0.9,
            textAlign: "right",
          }}
        >
          {getModernCopyrightLine(card)}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        flexDirection: "row",
        alignItems: isBattle ? "flex-end" : "center",
        gap: 4 * scale,
        paddingTop: 0.5 * scale,
        paddingBottom: isBattle ? 1.2 * scale : 0,
      }}
    >
      <View style={{ width: leftColumnWidth, minWidth: 0 }}>
        <Text
          selectable
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.65}
          style={{
            color: footerInk,
            fontFamily: collectorFontFamily,
            fontSize: collectorFontSize,
            lineHeight: collectorLineHeight,
            textTransform: "uppercase",
          }}
        >
          {getModernCollectorLine(card)}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", minWidth: 0 }}>
          <Text
            selectable
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            style={{
              color: footerInk,
              fontFamily: collectorFontFamily,
              fontSize: detailFontSize,
              lineHeight: detailLineHeight,
              textTransform: "uppercase",
            }}
          >
            {getModernSetLanguageLine(card)}
          </Text>
          <Image
            accessibilityIgnoresInvertColors
            source={FULL_MAGIC_PACK.artistArrowLight}
            resizeMode="contain"
            style={{
              width: arrowWidth,
              height: arrowHeight,
              marginLeft: 2.3 * scale,
              marginRight: 1.8 * scale,
              opacity: 0.95,
            }}
          />
          <Text
            selectable
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.55}
            style={{
              color: footerInk,
              flex: 1,
              fontFamily: artistFontFamily,
              fontSize: detailFontSize,
              lineHeight: detailLineHeight,
              textTransform: "uppercase",
            }}
          >
            {getModernArtistLine(card)}
          </Text>
        </View>
      </View>
      <Text
        selectable
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.42}
        style={{
          color: footerInk,
          flex: 1,
          fontFamily: legalFontFamily,
          fontSize: legalFontSize,
          lineHeight: legalLineHeight,
          opacity: 0.9,
          paddingBottom: isBattle ? 1.6 * scale : 0.15 * scale,
          textAlign: "right",
        }}
      >
        {getModernCopyrightLine(card)}
      </Text>
    </View>
  );
}

function RetroPrintingFooter({ card, scale }: { card: CardDraft; scale: number }) {
  const artist = card.artist?.trim() || "Local Artist";
  const legalLine = `${getModernCopyrightLine(card)}  ${getModernCollectorLine(card)}`;

  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 1.5 * scale,
      }}
    >
      <Text
        selectable
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.65}
        style={{
          color: "#f8f2df",
          fontFamily: FULL_MAGIC_PACK.fontFamilies.retroTitle,
          fontSize: 11.5 * scale,
          lineHeight: 13.5 * scale,
          textAlign: "center",
          ...(getRetroTextShadow(scale)),
        }}
      >
        {`Illus. ${artist}`}
      </Text>
      <Text
        selectable
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.55}
        style={{
          color: "#f8f2df",
          fontFamily: FULL_MAGIC_PACK.fontFamilies.retroBody,
          fontSize: 6.5 * scale,
          lineHeight: 7.5 * scale,
          opacity: 0.95,
          textAlign: "center",
          ...(getRetroTextShadow(scale)),
        }}
      >
        {legalLine}
      </Text>
    </View>
  );
}

export function CardPreview({
  card,
  activeSection,
  width,
  cornerRadius = 18,
  exportMode = false,
  artGenerating = false,
  onSectionPress,
  onChange,
}: CardPreviewProps) {
  const faceCard = getEditableCardFace(card);
  const frameIdentity = inferFrameIdentity(faceCard);
  const frameStyle = inferFrameStyle(faceCard);
  const selectedTypeFrame = card.typeFrame ?? "standard";
  const isBattleBackFace = selectedTypeFrame === "battle" && isDfcBackFace(card);
  const isBattleFrontFace = selectedTypeFrame === "battle" && !isBattleBackFace;
  const isDfcCardFace = selectedTypeFrame === "dfc";
  const isDfcBack = isDfcCardFace && isDfcBackFace(card);
  const frameTreatment = isDfcBack ? card.backFrameTreatment ?? "standard" : card.frameTreatment ?? "standard";
  const showcaseFrame = isDfcBack
    ? card.backShowcaseFrame ?? DEFAULT_SHOWCASE_FRAME
    : card.showcaseFrame ?? DEFAULT_SHOWCASE_FRAME;
  const typeFrame = isBattleBackFace || isDfcBack ? "standard" : selectedTypeFrame;
  const baseTreatmentLayout = typeFrame === "standard" ? FRAME_TREATMENT_LAYOUTS[frameTreatment] : null;
  const showcaseSpec =
    typeFrame === "standard" && frameTreatment === "showcase"
      ? getShowcaseFrameSpec(showcaseFrame)
      : null;
  const isFutureshiftedShowcase = showcaseSpec?.id === "futureshifted";
  const treatmentLayout = isFutureshiftedShowcase
    ? FUTURESHIFTED_TREATMENT_LAYOUT
    : showcaseSpec?.id === "stellarSights"
      ? STELLAR_SIGHTS_TREATMENT_LAYOUT
      : baseTreatmentLayout;
  const isRetroTreatment = typeFrame === "standard" && frameTreatment === "retro";
  const isBorderlessTreatment = typeFrame === "standard" && frameTreatment === "borderless";
  const typeFrameSpec = getTypeFrameSpec(typeFrame);
  const showManaCost = shouldShowDfcFaceManaCost(card);
  const manaSymbols = showManaCost ? parseManaCost(faceCard.manaCost) : [];
  const manaColors = getManaColors(faceCard.manaCost);
  const frameColors = getFrameColors(faceCard);
  const manualFrameColors = getManualFrameColors(faceCard);
  const resolvedMseColorBlend = shouldUseMseM15ColorBlend(faceCard, frameColors)
    ? getMseM15ColorBlend(frameColors, manualFrameColors.length > 0 ? "" : faceCard.manaCost)
    : null;
  const usesArtifactBaseFrame = frameIdentity === "artifact";
  const mseColorBlend = usesArtifactBaseFrame ? null : resolvedMseColorBlend;
  const mseAccentColorBlend = resolvedMseColorBlend;
  const useGoldRegularFrame =
    typeFrame === "standard" &&
    (frameTreatment === "standard" || frameTreatment === "borderless") &&
    frameColors.length > 2;
  const regularFrameIdentity = useGoldRegularFrame ? "gold" : frameIdentity;
  const regularMseColorBlend = useGoldRegularFrame ? null : mseColorBlend;
  const regularFrameStyle = useGoldRegularFrame ? FRAME_STYLES.gold : frameStyle;
  const artifactMainframeColorSource =
    typeFrame === "standard" &&
    frameTreatment === "standard" &&
    usesArtifactBaseFrame &&
    frameColors.length > 0
      ? getMseM15StandardColorMainframeSource(frameColors, mseAccentColorBlend)
      : null;
  const artifactMainframeColorTextureSource =
    typeFrame === "standard" &&
    frameTreatment === "standard" &&
    usesArtifactBaseFrame &&
    frameColors.length > 0
      ? getMseM15StandardColorMainframeTextureSource(frameColors, mseAccentColorBlend)
      : null;
  const showMseArtifactMainframeBlend = artifactMainframeColorSource !== null;
  const stampBackingColorBlend = getSecurityStampBackingColorBlend(frameColors, mseAccentColorBlend);
  const stampBackingFrameIdentity = getSecurityStampBackingFrameIdentity(regularFrameIdentity, frameColors);
  const artifactStampBackingSource =
    typeFrame === "standard" &&
    (frameTreatment === "standard" || frameTreatment === "borderless") &&
    usesArtifactBaseFrame &&
    frameColors.length <= 2 &&
    frameColors.length > 0
      ? getMseM15StandardColorSecurityStampBackingSource(frameColors, stampBackingColorBlend)
      : null;
  const standardStampBackingSource =
    artifactStampBackingSource ??
    getMseM15SecurityStampBackingSource(stampBackingFrameIdentity, stampBackingColorBlend);
  const mainframeColorCacheKey = artifactMainframeColorSource
    ? `artifact-${mseAccentColorBlend?.mode ?? "single"}-${mseAccentColorBlend?.key ?? frameColors.join("")}`
    : `${mseColorBlend?.mode ?? "plain"}-${mseColorBlend?.key ?? "none"}`;
  const regularMainframeColorCacheKey = useGoldRegularFrame
    ? "plain-gold"
    : mainframeColorCacheKey;
  const inferredFrameEffects = inferFrameEffects(faceCard);
  const supportsNyxFrameEffect = typeFrame === "standard" && frameTreatment === "standard";
  const frameEffects = supportsFrameEffectOverlays(typeFrame)
    ? supportsNyxFrameEffect
      ? inferredFrameEffects
      : inferredFrameEffects.filter((effect) => effect !== "nyx")
    : [];
  const frameEffectSources =
    typeFrame === "saga"
      ? getMseM15SagaOverlaySources(frameIdentity, frameEffects, frameColors)
      : getMseM15OverlaySources(frameIdentity, frameEffects, frameColors, frameTreatment);
  const showPowerToughness =
    typeFrame === "saga" || typeFrame === "planeswalker"
      ? false
      : hasPowerToughnessBox(faceCard);
  const backFacePowerToughnessText = getBackFacePowerToughnessText(card, showPowerToughness);
  const scale =
    typeFrame === "planeswalker"
      ? width / PLANESWALKER_COORDINATES.width
      : width / CARD_COORDINATES.width;
  const battleScale = width / BATTLE_COORDINATES.width;
  const artRect = isBattleFrontFace ? BATTLE_COORDINATES.art : getArtRect(typeFrame, frameTreatment, showcaseSpec);
  const artInteractionScale = isBattleFrontFace ? battleScale : scale;
  const showArtGenerating = artGenerating && !exportMode;
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const hasShowcaseArtTreatment = Boolean(showcaseSpec?.artMask || showcaseSpec?.artFilter || showcaseSpec?.artOverlay);
  const suppressSecurityStamp = showcaseSpec?.id === "dndRulebook";
  const securityStamped = !suppressSecurityStamp && shouldShowSecurityStamp(card, faceCard, typeFrame);
  const showStampPinlineBump = false;
  const borderlessTreatmentFrameBlendSources =
    typeFrame === "standard" && frameTreatment === "borderless"
      ? getBorderlessTreatmentFrameBlendSources(frameColors, regularMseColorBlend, securityStamped)
      : null;
  const treatmentFrameSource =
    typeFrame === "standard"
      ? borderlessTreatmentFrameBlendSources
        ? null
        : showcaseSpec
        ? getShowcaseFrameSource(showcaseFrame, frameIdentity, showPowerToughness)
        : getMseM15FrameTreatmentSource(
            frameTreatment,
            regularFrameIdentity,
            securityStamped,
            regularMseColorBlend,
          )
      : null;
  const showcaseFrameUnderlaySource =
    showcaseSpec ? getShowcaseFrameUnderlaySource(showcaseFrame, frameIdentity) : null;
  const hasExactTreatmentFrame = Boolean(treatmentFrameSource || borderlessTreatmentFrameBlendSources);
  const showcasePtOverlaySource =
    showcaseSpec && showPowerToughness ? getShowcasePtOverlaySource(showcaseFrame, frameIdentity) : null;
  const showcasePtOverlayRect =
    showcaseSpec?.ptOverlay ? scaleShowcaseRect(showcaseSpec.ptOverlay.rect, showcaseSpec) : null;
  const showcasePowerToughnessTextRect =
    showcaseSpec?.id === "dndRulebook" && showcasePtOverlayRect
      ? {
          x: showcasePtOverlayRect.x + 6,
          y: showcasePtOverlayRect.y + 4,
          width: showcasePtOverlayRect.width - 12,
          height: showcasePtOverlayRect.height - 8,
        }
      : null;
  const treatmentFrameMirrorX = frameTreatment === "borderless" ? regularMseColorBlend?.mirrorX : undefined;
  const shouldRenderArtBehindTreatmentFrame = isBorderlessTreatment || showcaseSpec?.id === "dndRulebook";
  const showDfcColorIndicator = shouldShowDfcColorIndicator(selectedTypeFrame, card);
  const dfcColorIndicatorSource = showDfcColorIndicator
    ? getMseM15ColorIndicatorSource(frameIdentity, mseAccentColorBlend)
    : null;
  const displayedRulesText = getDisplayRulesText(faceCard);
  const displayedFlavorText = activeSection === "rules"
    ? faceCard.flavorText.replace(/\r\n?/g, "\n")
    : normalizeDisplayMultilineText(faceCard.flavorText);
  const tokenFrameVariant = typeFrame === "token" ? getTokenFrameVariant(displayedRulesText, displayedFlavorText) : "normal";
  const rawTypeLineRect =
    treatmentLayout
      ? treatmentLayout.typeLine
      : typeFrame === "token"
      ? getTokenTypeLineRect(tokenFrameVariant)
      : getTypeLineRect(typeFrame, showDfcColorIndicator);
  const typeLineRect = showDfcColorIndicator
    ? insetTypeLineRectForDfcColorIndicator(rawTypeLineRect)
    : rawTypeLineRect;
  const setSymbolRect =
    treatmentLayout
      ? treatmentLayout.setSymbol
      : typeFrame === "token" ? getTokenSetSymbolRect(tokenFrameVariant) : getSetSymbolRect(typeFrame);
  const ptBoxRect = treatmentLayout?.ptBox ?? getPtBoxRect(typeFrame);
  const powerToughnessRect =
    showcasePowerToughnessTextRect ?? treatmentLayout?.powerToughness ?? getPowerToughnessRect(typeFrame);
  const manaLayout = getManaCostLayout(
    manaSymbols.length,
    treatmentLayout?.manaCost,
    isFutureshiftedShowcase ? FUTURESHIFTED_MANA_SYMBOL_SIZE : isRetroTreatment ? 16 : 22,
    isFutureshiftedShowcase ? 1 : isRetroTreatment ? 0.5 : 1.5,
  );
  const defaultManaRect = treatmentLayout?.manaCost ?? CARD_COORDINATES.manaCost;
  const titleBaseRect = treatmentLayout?.name ?? getNameRect(typeFrame, card);
  const titleManaRect =
    showManaCost && !isFutureshiftedShowcase && defaultManaRect.width > 0
      ? manaLayout.rect
      : { ...defaultManaRect, x: titleBaseRect.x + titleBaseRect.width + 8, width: 0 };
  const baseCardName = faceCard.baseCardName?.trim() ?? "";
  const showsCardSkinAlias =
    baseCardName.length > 0 &&
    typeFrame === "standard" &&
    (frameTreatment === "standard" || frameTreatment === "borderless") &&
    !showcaseSpec &&
    !isRetroTreatment;
  const cardSkinAliasSource = showsCardSkinAlias
    ? getMseM15GodzillaAliasSource(frameIdentity, mseColorBlend)
    : null;
  const titleLayout = getTitleLayout(
    faceCard.name,
    showsCardSkinAlias ? "" : baseCardName,
    titleManaRect,
    titleBaseRect,
    isRetroTreatment ? 19.5 : frameTreatment === "etchedFoil" ? 16 : 18,
  );
  const sagaTextLayout = typeFrame === "saga" ? parseSagaText(displayedRulesText) : null;
  const futureTypeSymbolSource = isFutureshiftedShowcase
    ? getFutureTypeSymbolSource(faceCard.typeLine)
    : null;
  const sagaBookmarkColors =
    faceCard.frameSelection && faceCard.frameSelection !== "auto" && manualFrameColors.length === 0
      ? []
      : frameColors;
  const sagaBookmarkIdentities = getSagaBookmarkIdentities(sagaBookmarkColors, frameIdentity);
  const sagaBookmarkColorBlend =
    typeFrame === "saga" && sagaBookmarkColors.length === 2 ? mseColorBlend : null;
  const shouldShowSagaStripe =
    typeFrame === "saga" && (sagaBookmarkIdentities.length > 1 || Boolean(sagaBookmarkColorBlend));
  const treatmentBodyUsesLargerTypography = isRetroTreatment || frameTreatment === "etchedFoil";
  const rulesLayout = getRulesFlavorLayout(
    { ...faceCard, rulesText: displayedRulesText, flavorText: displayedFlavorText },
    showPowerToughness,
    typeFrame,
    Boolean(backFacePowerToughnessText),
    treatmentLayout,
    treatmentBodyUsesLargerTypography,
  );
  useEffect(() => {
    let cancelled = false;
    setImageAspectRatio(null);

    if (!faceCard.artUri) {
      return;
    }

    Image.getSize(
      faceCard.artUri,
      (imageWidth, imageHeight) => {
        if (!cancelled && imageWidth > 0 && imageHeight > 0) {
          setImageAspectRatio(imageWidth / imageHeight);
        }
      },
      () => {
        if (!cancelled) {
          setImageAspectRatio(null);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [faceCard.artUri]);

  const artTransform = normalizeArtTransform(
    faceCard.artTransform ?? DEFAULT_ART_TRANSFORM,
    artRect,
    imageAspectRatio,
  );
  const adventureDefaults = getAdventureDefaults(faceCard);
  const adventureManaSymbols = parseManaCost(adventureDefaults.manaCost);
  const showcaseHeaderInk = isFutureshiftedShowcase
    ? "#f8f2df"
    : showcaseSpec
    ? (showcaseSpec.textIsLight ? "#f8f2df" : "#171512")
    : null;
  const showcaseBodyInk = isFutureshiftedShowcase
    ? "#171512"
    : showcaseSpec
    ? (showcaseSpec.textIsLight ? "#f8f2df" : "#171512")
    : null;
  const treatmentHeaderInk = showcaseHeaderInk ?? getTreatmentHeaderInk(frameTreatment, frameIdentity);
  const treatmentBodyInk = showcaseBodyInk ?? getTreatmentBodyInk(frameTreatment);
  const titleInk =
    treatmentLayout && treatmentHeaderInk
      ? treatmentHeaderInk
    : isDfcBack || (typeFrame === "token" && frameIdentity !== "white")
      ? "#f8f2df"
      : regularFrameStyle.ink;
  const titleMutedInk =
    treatmentLayout && treatmentHeaderInk
      ? getMutedInk(treatmentHeaderInk)
    : isDfcBack || (typeFrame === "token" && frameIdentity !== "white")
      ? "rgba(248, 242, 223, 0.62)"
      : regularFrameStyle.mutedInk;
  const typeLineInk = treatmentLayout && treatmentHeaderInk ? treatmentHeaderInk : isDfcBack ? "#f8f2df" : typeFrame === "token" ? "#171512" : regularFrameStyle.ink;
  const typeLineMutedInk = treatmentLayout && treatmentHeaderInk ? getMutedInk(treatmentHeaderInk) : isDfcBack ? "rgba(248, 242, 223, 0.62)" : regularFrameStyle.mutedInk;
  const statInk =
    isFutureshiftedShowcase
      ? "#f8f2df"
      : frameTreatment === "etchedFoil"
      ? "#f8f2df"
      : isRetroTreatment
      ? "#f8f2df"
      : isDfcBack
      ? "#f8f2df"
      : typeFrame === "token"
      ? "#171512"
      : regularFrameStyle.ink;
  const statMutedInk = isDfcBack ? "rgba(248, 242, 223, 0.62)" : regularFrameStyle.mutedInk;
  const bodyInk = treatmentLayout && treatmentBodyInk ? treatmentBodyInk : typeFrame === "token" ? "#171512" : regularFrameStyle.ink;
  const bodyMutedInk = treatmentLayout && treatmentBodyInk ? getMutedInk(treatmentBodyInk) : regularFrameStyle.mutedInk;
  const resolvedRulesTextColor = getCardTextColorOverride(faceCard.rulesTextColor);
  const rulesTextInk = resolvedRulesTextColor ?? bodyInk;
  const rulesTextMutedInk = resolvedRulesTextColor
    ? getMutedInk(resolvedRulesTextColor)
    : bodyMutedInk;
  const isTextlessTreatment = typeFrame === "standard" && frameTreatment === "textless";
  const showSetSymbolField = !isTextlessTreatment;
  const showTypeLineField = typeFrame !== "standard" || treatmentLayout?.showTypeLine !== false;
  const typeLineTextureSource =
    typeFrame === "standard" && showTypeLineField && isFutureshiftedShowcase
      ? getMseM15TypeLineTextureSource(frameIdentity)
      : null;
  const futureTextboxTextureSource = isFutureshiftedShowcase
    ? getMseM15FutureTextboxTextureSource(frameIdentity)
    : null;
  const futurePinlineColors = isFutureshiftedShowcase
    ? getFuturePinlineBlendColors(frameColors, frameIdentity)
    : null;
  const futureUsesHybridBlend = hasHybridManaSymbols(faceCard.manaCost);
  const futureHybridBlendColors =
    futurePinlineColors && futureUsesHybridBlend ? futurePinlineColors : null;
  const futureTextureBlendColors = futureHybridBlendColors;
  const typeLineRightInset = getTypeLineSetSymbolInset(typeLineRect, setSymbolRect);
  const typeLineBaseFontSize = isRetroTreatment ? 17 : typeFrame === "saga" ? 14.2 : 14;
  const typeLineFontSize = getTypeLineFontSize(
    faceCard.typeLine,
    typeLineRect.width -
      typeLineRightInset -
      getTypeLineEditorReserve(activeSection === "typeLine", scale),
    frameTreatment === "etchedFoil" ? 13 : typeLineBaseFontSize,
  );
  const typeLineTextYOffset =
    Platform.OS === "ios" && typeFrame === "standard" && frameTreatment === "standard"
      ? -2.75 * scale
      : 0;
  const hasBodyText =
    displayedRulesText.trim().length > 0 || displayedFlavorText.trim().length > 0;
  const startArtTransform = useRef(artTransform);
  const initialPinchDistance = useRef<number | null>(null);
  const manaCostInputRef = useRef<TextInput>(null);
  const [isManaCostFocused, setIsManaCostFocused] = useState(false);
  const manaCostRenderRect =
    isFutureshiftedShowcase && !isManaCostFocused
      ? FUTURESHIFTED_MANA_COST_RECT
      : isManaCostFocused
      ? CARD_COORDINATES.manaCost
      : manaLayout.rect;
  const [typeLineCursorIndex, setTypeLineCursorIndex] = useState(faceCard.typeLine.length);
  const typeLineAutocompleteSuggestions = getTypeLineAutocompleteSuggestions(
    faceCard.typeLine,
    typeLineCursorIndex,
  );
  const showTypeLineAutocomplete =
    activeSection === "typeLine" && typeLineAutocompleteSuggestions.length > 0;
  const updateTypeLineCursor = (event: unknown) => {
    const selectionStart = getTextInputSelectionStart(event);

    if (selectionStart !== null) {
      setTypeLineCursorIndex(selectionStart);
    }
  };
  const updateFace = (patch: Partial<CardDraft>) => {
    onChange(toDfcFacePatch(card, patch));
  };
  const updateTypeLine = (typeLine: string) => {
    onChange(getTypeLineChangePatch(card, typeLine));
  };

  const updateArtTransform = (nextTransform: ArtTransform) => {
    updateFace({ artTransform: normalizeArtTransform(nextTransform, artRect, imageAspectRatio) });
  };

  const artPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Boolean(faceCard.artUri) &&
          (Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3),
        onPanResponderGrant: (event) => {
          onSectionPress("art");
          startArtTransform.current = artTransform;
          initialPinchDistance.current = getTouchDistance(event.nativeEvent.touches);
        },
        onPanResponderMove: (event, gestureState) => {
          if (!faceCard.artUri) {
            return;
          }

          const touchDistance = getTouchDistance(event.nativeEvent.touches);

          if (touchDistance && initialPinchDistance.current) {
            updateArtTransform({
              ...startArtTransform.current,
              scale: startArtTransform.current.scale * (touchDistance / initialPinchDistance.current),
            });
            return;
          }

          updateArtTransform({
            ...startArtTransform.current,
            offsetX: startArtTransform.current.offsetX + gestureState.dx / artInteractionScale,
            offsetY: startArtTransform.current.offsetY + gestureState.dy / artInteractionScale,
          });
        },
        onPanResponderRelease: () => {
          initialPinchDistance.current = null;
        },
        onPanResponderTerminate: () => {
          initialPinchDistance.current = null;
        },
      }),
    [artInteractionScale, artTransform, faceCard.artUri, isBattleFrontFace, onSectionPress],
  );

  const zone = (section: CardSection, radius = 4) => ({
    borderColor: activeSection === section ? "#1d9bf0" : "transparent",
    borderWidth: activeSection === section ? 2 : 0,
    borderRadius: radius,
    borderCurve: "continuous" as const,
  });
  const futureOverlayHitPriority = isFutureshiftedShowcase
    ? {
        zIndex: 12,
        elevation: 12,
      }
    : null;
  const showcaseEditableHitPriority = showcaseSpec
    ? {
        zIndex: 20,
        elevation: 20,
      }
    : null;

  if (isBattleFrontFace) {
    return (
      <BattleFrontPreview
        card={card}
        faceCard={faceCard}
        activeSection={activeSection}
        width={width}
        cornerRadius={cornerRadius}
        scale={battleScale}
        frameIdentity={frameIdentity}
        frameStyle={frameStyle}
        manaSymbols={manaSymbols}
        manaColors={manaColors}
        exportMode={exportMode}
        imageAspectRatio={imageAspectRatio}
        isManaCostFocused={isManaCostFocused}
        setIsManaCostFocused={setIsManaCostFocused}
        updateFace={updateFace}
        updateArtTransform={updateArtTransform}
        onChange={onChange}
        onSectionPress={onSectionPress}
        artPanHandlers={artPanResponder.panHandlers}
        artTransform={artTransform}
        artGenerating={showArtGenerating}
        zone={zone}
      />
    );
  }

  if (typeFrame === "planeswalker") {
    return (
      <PlaneswalkerPreview
        card={card}
        faceCard={faceCard}
        activeSection={activeSection}
        width={width}
        cornerRadius={cornerRadius}
        scale={scale}
        frameIdentity={frameIdentity}
        frameStyle={frameStyle}
        manaSymbols={manaSymbols}
        showManaCost={showManaCost}
        exportMode={exportMode}
        imageAspectRatio={imageAspectRatio}
        isManaCostFocused={isManaCostFocused}
        setIsManaCostFocused={setIsManaCostFocused}
        updateFace={updateFace}
        updateArtTransform={updateArtTransform}
        onChange={onChange}
        onSectionPress={onSectionPress}
        artPanHandlers={artPanResponder.panHandlers}
        artTransform={artTransform}
        artGenerating={showArtGenerating}
        zone={zone}
      />
    );
  }

  if (isSplitTypeFrame(card)) {
    return (
      <SplitCardPreview
        card={card}
        width={width}
        cornerRadius={cornerRadius}
        scale={width / SPLIT_CARD_COORDINATES.width}
        exportMode={exportMode}
        onSectionPress={onSectionPress}
        zone={zone}
      />
    );
  }

  if (typeFrameSpec.orientation === "landscape") {
    const battleScale = width / BATTLE_COORDINATES.width;

    return (
      <View
        onPointerDown={() => onSectionPress("typeLine")}
        onTouchStart={() => onSectionPress("typeLine")}
        style={{
          width,
          aspectRatio: typeFrameSpec.aspectRatio,
          borderRadius: cornerRadius,
          borderCurve: "continuous",
          overflow: "hidden",
          backgroundColor: "#111111",
          ...(exportMode ? null : cardPreviewShadowStyle),
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit card frame"
          onPress={() => onSectionPress("frame")}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            width: "100%",
            height: "100%",
            ...zone("frame", 18),
          }}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={faceCard.artUri ? "Edit card art" : "Select card art"}
          onPress={() => onSectionPress("art", { openSheet: true })}
          {...artPanResponder.panHandlers}
          style={{
            ...battleRectStyle(BATTLE_COORDINATES.art),
            zIndex: 3,
            overflow: "hidden",
            backgroundColor: "#242823",
            ...zone("art", 18),
          }}
        >
          {showArtGenerating ? (
            <GeneratingArtAnimation scale={battleScale} colors={frameColors} />
          ) : faceCard.artUri ? (
            <TransformableArtImage
              uri={faceCard.artUri}
              artRect={BATTLE_COORDINATES.art}
              renderScale={battleScale}
              artTransform={artTransform}
              imageAspectRatio={imageAspectRatio}
            />
          ) : (
            <LinearGradient
              colors={["#24332f", "#78915e", "#d4bf86"]}
              style={{
                flex: 1,
                justifyContent: "flex-end",
                padding: 26 * battleScale,
              }}
            >
              <View
                style={{
                  height: "42%",
                  borderTopLeftRadius: 999,
                  borderTopRightRadius: 999,
                  backgroundColor: "rgba(255, 244, 205, 0.32)",
                }}
              />
            </LinearGradient>
          )}
        </Pressable>

        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <Image
            accessibilityIgnoresInvertColors
            source={
              typeFrame === "token"
                ? getTokenFrameSource(frameIdentity, tokenFrameVariant)
                : getTypeFrameOverlaySource(typeFrame)
            }
            resizeMode="contain"
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        </View>

      </View>
    );
  }

  return (
    <View
      style={{
        width,
        aspectRatio: typeFrameSpec.aspectRatio,
        borderRadius: cornerRadius,
        borderCurve: "continuous",
        overflow: "hidden",
        backgroundColor: "#111111",
        ...(exportMode ? null : cardPreviewShadowStyle),
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit card frame"
        onPress={() => onSectionPress("frame")}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          ...zone("frame", 18),
        }}
      />

      {typeFrame === "standard" && showcaseFrameUnderlaySource ? (
        isFutureshiftedShowcase && futureHybridBlendColors ? (
          <FutureFrameMulticolorUnderlay
            cacheKey={`showcase-underlay-${showcaseFrame}-${futureHybridBlendColors.join("")}`}
            baseSource={showcaseFrameUnderlaySource}
            blendMaskSource={getMseM15FutureCardMulticolorBlendMaskSource()}
            colors={futureHybridBlendColors}
          />
        ) : (
          <StableFrameImage
            cacheKey={`showcase-underlay-${showcaseFrame}`}
            source={showcaseFrameUnderlaySource}
            resizeMode="stretch"
          />
        )
      ) : null}

      {typeFrame !== "saga" && hasShowcaseArtTreatment && showcaseSpec && !showArtGenerating ? (
        <ShowcaseMaskedArt
          cacheKey={`showcase-art-${showcaseFrame}`}
          artUri={faceCard.artUri}
          artRect={artRect}
          artTransform={artTransform}
          imageAspectRatio={imageAspectRatio}
          spec={showcaseSpec}
        />
      ) : null}

      {typeFrame !== "saga" && shouldRenderArtBehindTreatmentFrame ? (
        <View
          pointerEvents="none"
          style={{
            ...rectStyle(artRect),
            overflow: "hidden",
            backgroundColor: "#242823",
          }}
        >
          {showArtGenerating ? (
            <GeneratingArtAnimation scale={scale} colors={frameColors} />
          ) : faceCard.artUri ? (
            <TransformableArtImage
              uri={faceCard.artUri}
              artRect={artRect}
              renderScale={scale}
              artTransform={artTransform}
              imageAspectRatio={imageAspectRatio}
            />
          ) : (
            <LinearGradient
              colors={["#24332f", "#78915e", "#d4bf86"]}
              style={{
                flex: 1,
                justifyContent: "flex-end",
                padding: 14 * scale,
              }}
            >
              <View
                style={{
                  height: "42%",
                  borderTopLeftRadius: 999,
                  borderTopRightRadius: 999,
                  backgroundColor: "rgba(255, 244, 205, 0.32)",
                }}
              />
            </LinearGradient>
          )}
        </View>
      ) : null}

      {typeFrame !== "saga" ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={faceCard.artUri ? "Edit card art" : "Select card art"}
          onPress={() => onSectionPress("art", { openSheet: true })}
          {...artPanResponder.panHandlers}
          style={{
            ...rectStyle(artRect),
            zIndex: shouldRenderArtBehindTreatmentFrame ? 0 : 4,
            elevation: shouldRenderArtBehindTreatmentFrame ? 0 : 4,
            overflow: "hidden",
            backgroundColor:
              hasShowcaseArtTreatment || shouldRenderArtBehindTreatmentFrame
                ? "rgba(255, 255, 255, 0.001)"
                : "#242823",
            ...zone("art", 2),
          }}
        >
          {showArtGenerating ? (
            shouldRenderArtBehindTreatmentFrame ? (
              <View pointerEvents="none" style={{ flex: 1 }} />
            ) : (
              <GeneratingArtAnimation scale={scale} colors={frameColors} />
            )
          ) : hasShowcaseArtTreatment || shouldRenderArtBehindTreatmentFrame ? (
            <View pointerEvents="none" style={{ flex: 1 }} />
          ) : faceCard.artUri ? (
            <TransformableArtImage
              uri={faceCard.artUri}
              artRect={artRect}
              renderScale={scale}
              artTransform={artTransform}
              imageAspectRatio={imageAspectRatio}
            />
          ) : (
            <LinearGradient
              colors={["#24332f", "#78915e", "#d4bf86"]}
              style={{
                flex: 1,
                justifyContent: "flex-end",
                padding: 14 * scale,
              }}
            >
              <View
                style={{
                  height: "42%",
                  borderTopLeftRadius: 999,
                  borderTopRightRadius: 999,
                  backgroundColor: "rgba(255, 244, 205, 0.32)",
                }}
              />
            </LinearGradient>
          )}
        </Pressable>
      ) : null}

      {showcaseSpec?.overlayMasks ? (
        <ShowcaseOverlayMaskLayers
          cacheKey={`showcase-overlays-${showcaseFrame}`}
          spec={showcaseSpec}
        />
      ) : null}

      {typeFrame === "standard" ? (
        showcaseSpec && treatmentFrameSource ? (
          <>
            <ShowcaseFrameImage
              cacheKey={`showcase-${showcaseFrame}`}
              source={treatmentFrameSource}
              spec={showcaseSpec}
            />
            <ShowcaseStampTreatmentLayer
              cacheKey={`showcase-${showcaseFrame}`}
              source={treatmentFrameSource}
              frameIdentity={frameIdentity}
              spec={showcaseSpec}
              stamped={securityStamped}
            />
          </>
        ) : (
          borderlessTreatmentFrameBlendSources ? (
            <MseSplitFrameImage
              cacheKey={`mainframe-standard-${frameTreatment}-${regularMseColorBlend?.mode ?? "plain"}-${regularMseColorBlend?.key ?? frameColors.join("")}-${securityStamped ? "stamped" : "unstamped"}`}
              sources={borderlessTreatmentFrameBlendSources}
              mirrorX={Boolean(regularMseColorBlend?.mirrorX)}
            />
          ) : (
            <MseFrameImage
              cacheKey={`mainframe-standard-${frameTreatment}-${regularFrameIdentity}-${regularMainframeColorCacheKey}-${securityStamped ? "stamped" : "unstamped"}`}
              source={
                treatmentFrameSource ??
                (artifactMainframeColorSource ? getMseM15MainframeSource("artifact", "standard") : null) ??
                getMseM15MainframeSource(regularFrameIdentity, "standard", regularMseColorBlend)
              }
              mirrorX={
                treatmentFrameMirrorX ??
                (!artifactMainframeColorSource && !hasExactTreatmentFrame && Boolean(regularMseColorBlend?.mirrorX))
              }
            />
          )
        )
      ) : null}

      {showMseArtifactMainframeBlend ? (
        <MseArtifactMainframeBlendOverlay
          cacheKey={`artifact-mainframe-blend-mask-${mseAccentColorBlend?.mode ?? "single"}-${mseAccentColorBlend?.key ?? frameColors.join("")}`}
          colorSource={artifactMainframeColorTextureSource ?? artifactMainframeColorSource}
          mirrorX={Boolean(mseAccentColorBlend?.mirrorX)}
        />
      ) : null}

      {futureTypeSymbolSource ? (
        <Image
          accessibilityIgnoresInvertColors
          source={futureTypeSymbolSource}
          resizeMode="contain"
          style={rectStyle(FUTURESHIFTED_TYPE_SYMBOL_RECT)}
        />
      ) : null}

      {typeFrame === "standard" && shouldDrawTreatmentArtOverFrame(frameTreatment) ? (
        <FrameTreatmentArtOverlay
          treatment={frameTreatment}
          faceCard={faceCard}
          artTransform={artTransform}
          scale={scale}
        />
      ) : null}

      {typeFrame === "saga" ? (
        <>
          <MseFrameImage
            cacheKey="typeframe-saga"
            source={getTypeFrameFrameSource(typeFrame, frameIdentity, mseColorBlend, card)}
            mirrorX={mseColorBlend?.mirrorX}
          />
          <SagaArtSlot
            artRect={artRect}
            artTransform={artTransform}
            faceCard={faceCard}
            scale={scale}
            imageAspectRatio={imageAspectRatio}
            active={activeSection === "art"}
            generating={showArtGenerating}
            zone={zone}
            onSectionPress={onSectionPress}
            panHandlers={artPanResponder.panHandlers}
          />
        </>
      ) : null}

      {typeFrame === "saga" ? <SagaPaperLayer /> : null}

      {typeFrame !== "standard" && typeFrame !== "saga" ? (
        <StableFrameImage
          cacheKey={`typeframe-${typeFrame}`}
          source={getTypeFrameFrameSource(typeFrame, frameIdentity, mseColorBlend, card, tokenFrameVariant)}
          resizeMode="contain"
          mirrorX={false}
        />
      ) : null}

      {isTextlessTreatment ? (
        <View
          pointerEvents="none"
          style={{
            zIndex: 12,
          }}
        >
          <TextlessBottomBarLayer />
        </View>
      ) : null}

      {card.frameCustomization && card.frameCustomization.tintOpacity > 0 ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: card.frameCustomization.tintColor,
            opacity: Math.max(0, Math.min(0.55, card.frameCustomization.tintOpacity)),
          }}
        />
      ) : null}

      {frameEffectSources.map((layer, index) => (
        <MseOverlayLayerView key={`frame-effect-${index}`} cacheKey={`frame-effect-${index}`} layer={layer} />
      ))}

      <WatermarkLayer
        card={card}
        rect={getWatermarkRect(typeFrame, rulesLayout)}
        scale={scale}
      />

      {activeSection === "watermark" ? (
        <View
          pointerEvents="none"
          style={{
            ...rectStyle(getWatermarkRect(typeFrame, rulesLayout)),
            ...zone("watermark", 3),
          }}
        />
      ) : null}

      {typeFrame === "saga" ? (
        <SagaFrameFurniture
          entries={sagaTextLayout?.entries ?? []}
          frameIdentities={sagaBookmarkIdentities}
          colorBlend={sagaBookmarkColorBlend}
          showStripe={shouldShowSagaStripe}
        />
      ) : null}

      {selectedTypeFrame === "dfc" || selectedTypeFrame === "battle" ? (
        <DfcFaceSymbolButton
          face={isDfcBackFace(card) ? "back" : "front"}
          mode={selectedTypeFrame === "dfc" ? getDfcMode(card) : "transform"}
          frameIdentity={regularFrameIdentity}
          scale={scale}
          onPress={() => onChange(getNextDfcFacePatch(card))}
        />
      ) : null}

      {activeSection === "art" ? (
        <View
          pointerEvents="none"
          style={{
            ...rectStyle(artRect),
            ...zone("art", 2),
          }}
        />
      ) : null}

      {futureTextboxTextureSource ? (
        futureTextureBlendColors ? (
          <FutureFrameBlendTextureLayer
            cacheKey={`mse-future-textbox-texture-${futureTextureBlendColors.join("")}-${futureUsesHybridBlend ? "hybrid" : "multi"}`}
            colors={futureTextureBlendColors}
            hybrid={futureUsesHybridBlend}
            texture="textbox"
            scale={scale}
          />
        ) : (
          <MseTextureLayer
            cacheKey={`mse-future-textbox-texture-${frameIdentity}`}
            source={futureTextboxTextureSource}
            sourceSize={MSE_M15_FUTURE_TEXTBOX_TEXTURE_SIZE}
            targetRect={FUTURESHIFTED_TEXTBOX_LAYER_RECT}
            scale={scale}
          />
        )
      ) : null}

      {typeLineTextureSource ? (
        futureTextureBlendColors ? (
          <FutureFrameBlendTextureLayer
            cacheKey={`mse-future-title-type-texture-${futureTextureBlendColors.join("")}-${futureUsesHybridBlend ? "hybrid" : "multi"}`}
            colors={futureTextureBlendColors}
            hybrid={futureUsesHybridBlend}
            texture="typeline"
            scale={scale}
          />
        ) : (
          <MseTextureLayer
            cacheKey={`mse-future-title-type-texture-${frameIdentity}`}
            source={typeLineTextureSource}
            sourceSize={MSE_M15_TYPELINE_TEXTURE_SIZE}
            targetRect={FUTURESHIFTED_TYPELINE_LAYER_RECT}
            scale={scale}
          />
        )
      ) : null}
      {isFutureshiftedShowcase ? (
        <FutureTitleTerminalDot
          color={getFutureTitleTerminalDotColor(frameIdentity, futureHybridBlendColors)}
          scale={scale}
        />
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => onSectionPress("identity")}
        style={{
          ...rectStyle(titleLayout.rect),
          justifyContent: "center",
          ...(showcaseEditableHitPriority ?? futureOverlayHitPriority),
          ...zone("identity"),
        }}
      >
        {exportMode ? (
          <Text
            accessibilityLabel="Card name"
            numberOfLines={1}
            selectable={false}
            style={{
              color: titleInk,
              fontFamily: isRetroTreatment
                ? FULL_MAGIC_PACK.fontFamilies.retroTitle
                : FULL_MAGIC_PACK.fontFamilies.title,
              fontSize: titleLayout.fontSize * scale,
              lineHeight: titleLayout.lineHeight * scale,
              ...EXPORT_TITLE_KERNING_FIX,
              ...(isRetroTreatment ? getRetroTextShadow(scale) : {}),
              includeFontPadding: false,
            }}
          >
            {getExportTitleText(faceCard.name)}
          </Text>
        ) : (
          <TextInput
            accessibilityLabel="Card name"
            value={faceCard.name}
            onChangeText={(name) => updateFace({ name })}
            onFocus={() => onSectionPress("identity")}
            placeholder="Untitled"
            placeholderTextColor={titleMutedInk}
            numberOfLines={1}
            style={{
              color: titleInk,
              fontFamily: isRetroTreatment
                ? FULL_MAGIC_PACK.fontFamilies.retroTitle
              : FULL_MAGIC_PACK.fontFamilies.title,
              ...getWebSafeEditableTextMetrics(
                titleLayout.fontSize * scale,
                titleLayout.lineHeight * scale,
              ),
              height: titleLayout.lineHeight * scale,
              ...TITLE_KERNING_FIX,
              ...(isRetroTreatment ? getRetroTextShadow(scale) : {}),
              includeFontPadding: false,
              padding: 0,
              backgroundColor: "transparent",
            }}
          />
        )}
        {baseCardName && !showsCardSkinAlias ? (
          <Text
            numberOfLines={1}
            selectable={false}
            style={{
              color: titleInk,
              opacity: 0.86,
              fontFamily: isRetroTreatment
                ? FULL_MAGIC_PACK.fontFamilies.retroTitle
                : FULL_MAGIC_PACK.fontFamilies.title,
              fontSize: titleLayout.baseNameFontSize * scale,
              lineHeight: titleLayout.baseNameLineHeight * scale,
              ...TITLE_KERNING_FIX,
              ...(isRetroTreatment ? getRetroTextShadow(scale) : {}),
              includeFontPadding: false,
            }}
          >
            {baseCardName}
          </Text>
        ) : null}
      </Pressable>

      {cardSkinAliasSource ? (
        <>
          <StableFrameImage
            cacheKey={`godzilla-alias-${frameIdentity}-${mseColorBlend?.mode ?? "single"}-${mseColorBlend?.key ?? "none"}`}
            source={cardSkinAliasSource}
            resizeMode="stretch"
            containerStyle={{ zIndex: 4 }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit base card name"
            onPress={() => onSectionPress("identity", { openSheet: true })}
            style={{
              ...rectStyle(CARD_SKIN_ALIAS_RECT),
              alignItems: "center",
              justifyContent: "center",
              zIndex: 8,
              ...zone("identity"),
            }}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
              selectable={false}
              style={{
                width: "100%",
                color: "#ffffff",
                fontFamily: FULL_MAGIC_PACK.fontFamilies.italic,
                fontSize: 12 * scale,
                fontWeight: "400",
                lineHeight: 14 * scale,
                includeFontPadding: false,
                textAlign: "center",
              }}
            >
              {baseCardName}
            </Text>
          </Pressable>
        </>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit mana cost"
        onPress={() => onSectionPress("identity", { openSheet: true })}
        style={{
          ...rectStyle(manaCostRenderRect),
          alignItems: "flex-end",
          justifyContent: isFutureshiftedShowcase && !isManaCostFocused ? "flex-start" : "center",
          ...(showcaseEditableHitPriority ?? futureOverlayHitPriority),
          ...zone("identity"),
        }}
      >
        {showManaCost && isManaCostFocused ? (
          <TextInput
            ref={manaCostInputRef}
            accessibilityLabel="Mana cost"
            value={faceCard.manaCost}
            autoFocus
            onChangeText={(manaCost) => updateFace({ manaCost })}
            onFocus={() => {
              setIsManaCostFocused(true);
              onSectionPress("identity");
            }}
            onBlur={() => {
              setIsManaCostFocused(false);
              updateFace({ manaCost: normalizeManaInput(faceCard.manaCost) });
            }}
            placeholder="{G}"
            placeholderTextColor={frameStyle.mutedInk}
            numberOfLines={1}
            autoCapitalize="characters"
            style={{
              width: "100%",
              color: titleInk,
              fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
              ...getWebSafeEditableTextMetrics(
                getManaCostEditorFontSize(faceCard.manaCost, defaultManaRect.width) * scale,
                17 * scale,
              ),
              padding: 0,
              textAlign: "right",
              backgroundColor: "transparent",
            }}
          />
        ) : showManaCost && isFutureshiftedShowcase ? (
          <FutureManaCostSymbols
            symbols={manaSymbols}
            frameIdentity={frameIdentity}
            size={FUTURESHIFTED_MANA_SYMBOL_SIZE * scale}
            scale={scale}
          />
        ) : showManaCost ? (
          <View
            pointerEvents="none"
            style={{
              flexDirection: "row",
              flexWrap: "nowrap",
              justifyContent: "flex-end",
              gap: manaLayout.gap * scale,
            }}
          >
            {manaSymbols.map((symbol, index) => (
              <ManaSymbol
                key={`${symbol}-${index}`}
                value={symbol}
                size={manaLayout.symbolSize * scale}
                variant={isRetroTreatment ? "retro" : "modern"}
              />
            ))}
          </View>
        ) : null}
      </Pressable>

      {dfcColorIndicatorSource ? (
        <FrameColorIndicatorDot
          source={dfcColorIndicatorSource}
          scale={scale}
        />
      ) : null}

      {showTypeLineField ? (
        <View
          onPointerDown={() => onSectionPress("typeLine")}
          onTouchStart={() => onSectionPress("typeLine")}
          style={{
            ...rectStyle(typeLineRect),
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            overflow: "visible",
            paddingRight: typeLineRightInset * scale,
            zIndex: showTypeLineAutocomplete
              ? 30
              : showcaseEditableHitPriority?.zIndex ?? futureOverlayHitPriority?.zIndex,
            elevation: showTypeLineAutocomplete
              ? 30
              : showcaseEditableHitPriority?.elevation ?? futureOverlayHitPriority?.elevation,
            ...zone("typeLine"),
          }}
        >
          {activeSection === "typeLine" ? (
            <TypeLineEditorButton
              scale={scale}
              ink={typeLineInk}
              onPress={() => onSectionPress("typeLine", { openSheet: true })}
            />
          ) : null}
          {exportMode ? (
            <Text
              accessibilityLabel="Type line"
              numberOfLines={1}
              selectable={false}
              style={{
                color: typeLineInk,
                flex: 1,
                flexShrink: 1,
                fontFamily: isRetroTreatment
                  ? FULL_MAGIC_PACK.fontFamilies.retroBody
                  : FULL_MAGIC_PACK.fontFamilies.title,
                fontSize: typeLineFontSize * scale,
                lineHeight: typeLineRect.height * scale,
                includeFontPadding: false,
                minWidth: 0,
                ...optionalTransformStyle(typeLineTextYOffset ? [{ translateY: typeLineTextYOffset }] : null),
                ...(isRetroTreatment ? getRetroTextShadow(scale) : {}),
              }}
            >
              {faceCard.typeLine || "Card Type"}
            </Text>
          ) : (
            <TextInput
              accessibilityLabel="Type line"
              value={faceCard.typeLine}
              onChangeText={updateTypeLine}
              onChange={updateTypeLineCursor}
              onFocus={() => onSectionPress("typeLine")}
              onPressIn={() => onSectionPress("typeLine")}
              onSelectionChange={updateTypeLineCursor}
              placeholder="Card Type"
              placeholderTextColor={typeLineMutedInk}
              numberOfLines={1}
              style={{
                color: typeLineInk,
                flex: 1,
                flexShrink: 1,
                fontFamily: isRetroTreatment
                  ? FULL_MAGIC_PACK.fontFamilies.retroBody
                  : FULL_MAGIC_PACK.fontFamilies.title,
                ...getWebSafeEditableTextMetrics(
                  typeLineFontSize * scale,
                  typeLineRect.height * scale,
                ),
                height: "100%",
                includeFontPadding: false,
                minWidth: 0,
                padding: 0,
                backgroundColor: "transparent",
                textAlignVertical: "center",
                ...optionalTransformStyle(typeLineTextYOffset ? [{ translateY: typeLineTextYOffset }] : null),
                ...(isRetroTreatment ? getRetroTextShadow(scale) : {}),
              }}
            />
          )}
          {showTypeLineAutocomplete ? (
            <TypeLineAutocompleteMenu
              suggestions={typeLineAutocompleteSuggestions}
              scale={scale}
              onSelect={(suggestion) => updateTypeLine(suggestion.replacement)}
            />
          ) : null}
        </View>
      ) : null}

      {typeFrame === "adventure" ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit adventure spell"
            onPress={() => onSectionPress("rules")}
            style={{
              ...rectStyle({
                x: ADVENTURE_SPELL_LAYOUT.nameRect.x,
                y: ADVENTURE_SPELL_LAYOUT.nameRect.y,
                width:
                  ADVENTURE_SPELL_LAYOUT.manaCostRect.x +
                  ADVENTURE_SPELL_LAYOUT.manaCostRect.width -
                  ADVENTURE_SPELL_LAYOUT.nameRect.x,
                height:
                  ADVENTURE_SPELL_LAYOUT.typeLineRect.y +
                  ADVENTURE_SPELL_LAYOUT.typeLineRect.height -
                  ADVENTURE_SPELL_LAYOUT.nameRect.y,
              }),
              ...zone("rules", 3),
            }}
          />
          <View
            pointerEvents="box-none"
            style={{
              ...rectStyle(ADVENTURE_SPELL_LAYOUT.nameRect),
              justifyContent: "center",
            }}
          >
            {activeSection === "rules" ? (
              <TextInput
                accessibilityLabel="Adventure name"
                value={adventureDefaults.name}
                onChangeText={(adventureName) => onChange({ adventureName })}
                onFocus={() => onSectionPress("rules")}
                placeholder="Adventure"
                placeholderTextColor={frameStyle.mutedInk}
                numberOfLines={1}
                style={{
                  color: frameStyle.ink,
                  fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
                  ...getWebSafeEditableTextMetrics(12 * scale, 15 * scale),
                  ...TITLE_KERNING_FIX,
                  padding: 0,
                  backgroundColor: "transparent",
                }}
              />
            ) : (
              <Text
                selectable={false}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.62}
                style={{
                  color: frameStyle.ink,
                  fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
                  fontSize: 12 * scale,
                  lineHeight: 15 * scale,
                  ...TITLE_KERNING_FIX,
                }}
              >
                {adventureDefaults.name}
              </Text>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit adventure mana cost"
            onPress={() => onSectionPress("rules")}
            style={{
              ...rectStyle(ADVENTURE_SPELL_LAYOUT.manaCostRect),
              alignItems: "flex-end",
              justifyContent: "center",
              ...zone("rules", 3),
            }}
          >
            {activeSection === "rules" ? (
              <TextInput
                accessibilityLabel="Adventure mana cost"
                value={adventureDefaults.manaCost}
                onChangeText={(adventureManaCost) => onChange({ adventureManaCost })}
                onFocus={() => onSectionPress("rules")}
                onBlur={() =>
                  onChange({ adventureManaCost: normalizeManaInput(adventureDefaults.manaCost) })
                }
                placeholder="{G}"
                placeholderTextColor={frameStyle.mutedInk}
                numberOfLines={1}
                autoCapitalize="characters"
                style={{
                  width: "100%",
                  color: frameStyle.ink,
                  fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
                  ...getWebSafeEditableTextMetrics(11.5 * scale, 14 * scale),
                  padding: 0,
                  textAlign: "right",
                  backgroundColor: "transparent",
                }}
              />
            ) : (
              <View
                pointerEvents="none"
                style={{
                  flexDirection: "row",
                  flexWrap: "nowrap",
                  justifyContent: "flex-end",
                  gap: 1 * scale,
                }}
              >
                {adventureManaSymbols.map((symbol, index) => (
                  <ManaSymbol
                    key={`adventure-${symbol}-${index}`}
                    value={symbol}
                    size={14 * scale}
                  />
                ))}
              </View>
            )}
          </Pressable>
          <View
            pointerEvents="box-none"
            style={{
              ...rectStyle(ADVENTURE_SPELL_LAYOUT.typeLineRect),
              justifyContent: "center",
            }}
          >
            {activeSection === "rules" ? (
              <TextInput
                accessibilityLabel="Adventure type line"
                value={adventureDefaults.typeLine}
                onChangeText={(adventureTypeLine) =>
                  onChange({ adventureTypeLine: normalizeTypeLineInput(adventureTypeLine) })
                }
                onFocus={() => onSectionPress("rules")}
                placeholder="Instant — Adventure"
                placeholderTextColor={frameStyle.mutedInk}
                numberOfLines={1}
                style={{
                  color: frameStyle.ink,
                  fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
                  ...getWebSafeEditableTextMetrics(11 * scale, 14 * scale),
                  padding: 0,
                  backgroundColor: "transparent",
                }}
              />
            ) : (
              <Text
                selectable={false}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
                style={{
                  color: frameStyle.ink,
                  fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
                  fontSize: 11 * scale,
                  lineHeight: 14 * scale,
                }}
              >
                {adventureDefaults.typeLine}
              </Text>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit adventure rules text"
            onPress={() => onSectionPress("rules")}
            style={{
              ...rectStyle(ADVENTURE_SPELL_LAYOUT.rulesRect),
              justifyContent: "center",
              ...zone("rules", 4),
            }}
          >
            {activeSection === "rules" ? (
              <TextInput
                accessibilityLabel="Adventure rules text"
                value={adventureDefaults.rulesText}
                onChangeText={(adventureRulesText) => onChange({ adventureRulesText })}
                onFocus={() => onSectionPress("rules")}
                placeholder="Adventure rules"
                placeholderTextColor={frameStyle.mutedInk}
                multiline
                blurOnSubmit={false}
                submitBehavior="newline"
                scrollEnabled={false}
                style={{
                  color: frameStyle.ink,
                  fontFamily: FULL_MAGIC_PACK.fontFamilies.body,
                  ...getWebSafeEditableTextMetrics(12 * scale, 14.4 * scale),
                  width: "100%",
                  padding: 0,
                  overflow: "hidden",
                  backgroundColor: "transparent",
                  textAlignVertical: "center",
                }}
              />
            ) : (
              <InlineSymbolText
                value={adventureDefaults.rulesText}
                color={frameStyle.ink}
                fontFamily={FULL_MAGIC_PACK.fontFamilies.body}
                fontSize={12 * scale}
                lineHeight={14.4 * scale}
                symbolSize={13.5 * scale}
              />
            )}
          </Pressable>
        </>
      ) : null}

      {typeFrame === "saga" && sagaTextLayout ? (
        <SagaRulesPanel
          active={activeSection === "rules"}
          faceCard={faceCard}
          layout={sagaTextLayout}
          scale={scale}
          updateFace={updateFace}
          onSectionPress={onSectionPress}
          zone={zone}
        />
      ) : null}

      {typeFrame !== "saga" ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open rules editor"
          onPress={() => onSectionPress("rules", { openSheet: true })}
          style={{
            ...rectStyle(treatmentLayout?.textArea ?? getTextAreaRect(typeFrame)),
            ...showcaseEditableHitPriority,
            ...zone("rules", 3),
          }}
        />
      ) : null}

      {typeFrame !== "saga" && !isTextlessTreatment && rulesLayout.showRules ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onSectionPress("rules")}
          style={{
            ...rectStyle(rulesLayout.rulesRect),
            justifyContent: activeSection === "rules" ? "flex-start" : "center",
            ...showcaseEditableHitPriority,
            ...zone("rules", 3),
          }}
        >
          {activeSection === "rules" ? (
            <TextInput
              accessibilityLabel="Rules text"
              value={faceCard.rulesText}
              onChangeText={(rulesText) => updateFace({ rulesText })}
              onFocus={() => onSectionPress("rules")}
              placeholder="Rules text"
              placeholderTextColor={rulesTextMutedInk}
              multiline
              blurOnSubmit={false}
              submitBehavior="newline"
              scrollEnabled={false}
              style={{
                color: rulesTextInk,
                fontFamily: isRetroTreatment ? FULL_MAGIC_PACK.fontFamilies.retroBody : FULL_MAGIC_PACK.fontFamilies.body,
                ...getWebSafeEditableTextMetrics(
                  rulesLayout.rulesFontSize * scale,
                  rulesLayout.rulesLineHeight * scale,
                ),
                width: "100%",
                height: "100%",
                padding: 0,
                overflow: "hidden",
                backgroundColor: "transparent",
                textAlignVertical: "top",
              }}
            />
          ) : (
            <InlineSymbolText
              value={displayedRulesText}
              color={rulesTextInk}
              fontFamily={isRetroTreatment ? FULL_MAGIC_PACK.fontFamilies.retroBody : FULL_MAGIC_PACK.fontFamilies.body}
              fontSize={rulesLayout.rulesFontSize * scale}
              lineHeight={rulesLayout.rulesLineHeight * scale}
              symbolSize={rulesLayout.rulesFontSize * scale * 1.18}
              symbolVariant={isRetroTreatment ? "retro" : "modern"}
            />
          )}
        </Pressable>
      ) : null}

      {typeFrame !== "saga" && !isTextlessTreatment && rulesLayout.showDivider ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open rules editor"
          onPress={() => onSectionPress("rules", { openSheet: true })}
          style={{
            ...rectStyle(rulesLayout.dividerRect),
            justifyContent: "center",
            ...showcaseEditableHitPriority,
          }}
        >
          <Image
            accessibilityIgnoresInvertColors
            source={FULL_MAGIC_PACK.flavorDivider}
            resizeMode="stretch"
            style={{
              width: "100%",
              height: "100%",
              opacity: 0.68,
            }}
          />
        </Pressable>
      ) : null}

      {typeFrame !== "saga" && !isTextlessTreatment && rulesLayout.showFlavor ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onSectionPress("rules")}
          style={{
            ...rectStyle(rulesLayout.flavorRect),
            justifyContent: activeSection === "rules" ? "flex-start" : "center",
            ...showcaseEditableHitPriority,
            ...zone("rules", 3),
          }}
        >
          {activeSection === "rules" ? (
            <TextInput
              accessibilityLabel="Flavor text"
              value={faceCard.flavorText}
              onChangeText={(flavorText) => updateFace({ flavorText })}
              onFocus={() => onSectionPress("rules")}
              placeholder="Flavor text"
              placeholderTextColor={rulesTextMutedInk}
              multiline
              blurOnSubmit={false}
              submitBehavior="newline"
              scrollEnabled={false}
              style={{
                color: rulesTextInk,
                fontFamily: isRetroTreatment ? FULL_MAGIC_PACK.fontFamilies.retroItalic : FULL_MAGIC_PACK.fontFamilies.italic,
                ...getWebSafeEditableTextMetrics(
                  rulesLayout.flavorFontSize * scale,
                  rulesLayout.flavorLineHeight * scale,
                ),
                width: "100%",
                height: "100%",
                padding: 0,
                overflow: "hidden",
                backgroundColor: "transparent",
                textAlignVertical: "top",
              }}
            />
          ) : (
            <InlineSymbolText
              value={displayedFlavorText}
              color={rulesTextInk}
              fontFamily={isRetroTreatment ? FULL_MAGIC_PACK.fontFamilies.retroItalic : FULL_MAGIC_PACK.fontFamilies.italic}
              fontSize={rulesLayout.flavorFontSize * scale}
              lineHeight={rulesLayout.flavorLineHeight * scale}
              symbolSize={rulesLayout.flavorFontSize * scale * 1.18}
              symbolVariant={isRetroTreatment ? "retro" : "modern"}
            />
          )}
        </Pressable>
      ) : null}

      {backFacePowerToughnessText ? (
        <View
          pointerEvents="none"
          style={{
            ...rectStyle(getBackFacePowerToughnessRect(typeFrame)),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            selectable={false}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            style={{
              width: "100%",
              color: "#777d84",
              fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
              fontSize: 14.2 * scale,
              lineHeight: 16 * scale,
              textAlign: "right",
            }}
          >
            {backFacePowerToughnessText}
          </Text>
        </View>
      ) : null}

      {showSetSymbolField ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit set symbol"
          onPress={() => onSectionPress("printing")}
          hitSlop={12}
          style={{
            ...rectStyle(setSymbolRect),
            alignItems: "center",
            justifyContent: "center",
            ...showcaseEditableHitPriority,
            ...zone("printing", 2),
          }}
        >
          <SetSymbolMark
            presetId={card.setSymbolPreset}
            imageUri={card.setSymbolUri}
            rarity={card.rarity}
            size={20 * scale}
          />
        </Pressable>
      ) : null}

      {typeFrame === "dfc" && getDfcMode(card) === "modal" ? (
        <ModalDfcHintBar card={card} scale={scale} />
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => onSectionPress("printing")}
        style={{
          ...rectStyle(treatmentLayout?.footer ?? CARD_COORDINATES.footer),
          justifyContent: "center",
          ...showcaseEditableHitPriority,
          ...zone("printing", 3),
        }}
      >
        {isRetroTreatment ? (
          <RetroPrintingFooter card={card} scale={scale} />
        ) : (
          <ModernPrintingFooter
            card={card}
            scale={scale}
            hasPowerToughness={showPowerToughness}
            variant={isFutureshiftedShowcase ? "futureshifted" : typeFrame === "token" ? "token" : "card"}
          />
        )}
      </Pressable>

      {!isFutureshiftedShowcase && !suppressSecurityStamp ? (
        <SecurityStampLayer
          card={card}
          faceCard={faceCard}
          typeFrame={typeFrame}
          frameIdentity={stampBackingFrameIdentity}
          colorBlend={stampBackingColorBlend}
          coordinateSystem="portrait"
          visible={securityStamped}
          showPinlineBump={showStampPinlineBump}
          backingSource={standardStampBackingSource}
          foilSource={showcaseSpec?.securityStampSource}
          foilRect={showcaseSpec?.securityStampRect}
        />
      ) : null}

      {showPowerToughness ? (
        <>
          {!isRetroTreatment && showcasePtOverlaySource && showcasePtOverlayRect ? (
            <Image
              accessibilityIgnoresInvertColors
              source={showcasePtOverlaySource}
              resizeMode="stretch"
              style={rectStyle(showcasePtOverlayRect)}
            />
          ) : !isRetroTreatment ? (
            <Image
              accessibilityIgnoresInvertColors
              source={
                typeFrame === "token"
                  ? getTokenPtBoxSource(frameIdentity)
                  : typeFrame === "adventure"
                  ? getAdventurePtBoxSource(frameIdentity)
                  : getMseM15PtBoxSource(regularFrameIdentity, regularMseColorBlend, frameTreatment)
              }
              resizeMode="stretch"
              style={{
                ...rectStyle(ptBoxRect),
                zIndex: isTextlessTreatment ? 18 : undefined,
                ...optionalTransformStyle(
                  typeFrame !== "dfc" &&
                    typeFrame !== "adventure" &&
                    regularMseColorBlend?.mirrorX
                    ? [{ scaleX: -1 }]
                    : null,
                ),
              }}
            />
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => onSectionPress("stats")}
            style={{
              ...rectStyle(powerToughnessRect),
              alignItems: "center",
              justifyContent: "center",
              zIndex: showcaseEditableHitPriority?.zIndex ?? (isTextlessTreatment ? 19 : undefined),
              elevation: showcaseEditableHitPriority?.elevation,
              ...zone("stats", 4),
            }}
          >
            {exportMode ? (
              <Text
                accessibilityLabel="Power toughness"
                numberOfLines={1}
                selectable={false}
                style={{
                  width: "100%",
                  height: "100%",
                  color: statInk,
                  fontFamily: isRetroTreatment
                    ? FULL_MAGIC_PACK.fontFamilies.retroPowerToughness
                    : FULL_MAGIC_PACK.fontFamilies.title,
                  fontWeight: isRetroTreatment ? "700" : undefined,
                  ...getWebSafeEditableTextMetrics(
                    (isRetroTreatment ? 17 : frameTreatment === "etchedFoil" ? 16 : 20) * scale,
                    powerToughnessRect.height * scale,
                  ),
                  textAlign: isRetroTreatment ? "right" : "center",
                  includeFontPadding: false,
                  textShadowColor: isRetroTreatment ? "rgba(0, 0, 0, 0.9)" : undefined,
                  textShadowOffset: isRetroTreatment ? { width: 1 * scale, height: 1 * scale } : undefined,
                  textShadowRadius: isRetroTreatment ? 0 : undefined,
                }}
              >
                {`${faceCard.power || ""}/${faceCard.toughness || ""}`}
              </Text>
            ) : (
              <TextInput
                accessibilityLabel="Power toughness"
                value={`${faceCard.power || ""}/${faceCard.toughness || ""}`}
                onChangeText={(stats) => {
                  const [power = "", toughness = ""] = stats.split("/");
                  updateFace({ power: power.trim(), toughness: toughness.trim() });
                }}
                onFocus={() => onSectionPress("stats")}
                placeholder="0/0"
                placeholderTextColor={statMutedInk}
                numberOfLines={1}
                style={{
                  width: "100%",
                  color: statInk,
                  fontFamily: isRetroTreatment
                    ? FULL_MAGIC_PACK.fontFamilies.retroPowerToughness
                    : FULL_MAGIC_PACK.fontFamilies.title,
                  fontWeight: isRetroTreatment ? "700" : undefined,
                  ...getWebSafeEditableTextMetrics(
                    (isRetroTreatment ? 17 : frameTreatment === "etchedFoil" ? 16 : 20) * scale,
                    powerToughnessRect.height * scale,
                  ),
                  textAlign: isRetroTreatment ? "right" : "center",
                  textAlignVertical: "center",
                  height: "100%",
                  padding: 0,
                  backgroundColor: "transparent",
                  textShadowColor: isRetroTreatment ? "rgba(0, 0, 0, 0.9)" : undefined,
                  textShadowOffset: isRetroTreatment ? { width: 1 * scale, height: 1 * scale } : undefined,
                  textShadowRadius: isRetroTreatment ? 0 : undefined,
                }}
              />
            )}
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

function SplitCardPreview({
  card,
  width,
  cornerRadius,
  scale,
  exportMode,
  onSectionPress,
  zone,
}: {
  card: CardDraft;
  width: number;
  cornerRadius: number;
  scale: number;
  exportMode: boolean;
  onSectionPress: SectionPressHandler;
  zone: (section: CardSection, radius?: number) => Record<string, unknown>;
}) {
  const layout = getSplitLayout(card);
  const leftHalf = getSplitHalf(card, "left");
  const rightHalf = getSplitHalf(card, "right");

  return (
    <View
      style={{
        width,
        aspectRatio: SPLIT_CARD_COORDINATES.width / SPLIT_CARD_COORDINATES.height,
        borderRadius: cornerRadius,
        borderCurve: "continuous",
        overflow: "hidden",
        backgroundColor: "#090908",
        ...(exportMode ? null : cardPreviewShadowStyle),
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit split card frame"
        onPress={() => onSectionPress("frame")}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          ...zone("frame", 18),
        }}
      />

      {layout === "aftermath" ? (
        <AftermathSplitPreview
          card={card}
          leftHalf={leftHalf}
          rightHalf={rightHalf}
          scale={scale}
          onSectionPress={onSectionPress}
          zone={zone}
        />
      ) : (
        <ClassicSplitPreview
          card={card}
          leftHalf={leftHalf}
          rightHalf={rightHalf}
          scale={scale}
          onSectionPress={onSectionPress}
          zone={zone}
        />
      )}
    </View>
  );
}

function ClassicSplitPreview({
  card,
  leftHalf,
  rightHalf,
  scale,
  onSectionPress,
  zone,
}: {
  card: CardDraft;
  leftHalf: SplitCardHalf;
  rightHalf: SplitCardHalf;
  scale: number;
  onSectionPress: SectionPressHandler;
  zone: (section: CardSection, radius?: number) => Record<string, unknown>;
}) {
  const layout = getSplitLayout(card);
  const showFuse = layout === "fuse";
  const stampBackingConfig = getSplitSecurityStampBackingConfig(card, leftHalf, rightHalf);

  return (
    <>
      <ClassicSplitHalfSlot
        card={card}
        half={leftHalf}
        side="left"
        fuse={showFuse}
        rect={SPLIT_CARD_LAYOUT.left}
        scale={scale}
        onSectionPress={onSectionPress}
        zone={zone}
      />
      <ClassicSplitHalfSlot
        card={card}
        half={rightHalf}
        side="right"
        fuse={showFuse}
        rect={SPLIT_CARD_LAYOUT.right}
        scale={scale}
        onSectionPress={onSectionPress}
        zone={zone}
      />
      {showFuse ? (
        <FuseReminderStrip
          card={card}
          leftHalf={leftHalf}
          rightHalf={rightHalf}
          scale={scale}
          onSectionPress={onSectionPress}
          zone={zone}
        />
      ) : null}
      <SplitPrintingFooter
        card={card}
        scale={scale}
        onSectionPress={onSectionPress}
        zone={zone}
      />
      <SecurityStampLayer
        card={card}
        faceCard={card}
        typeFrame={showFuse ? "fuse" : "split"}
        frameIdentity={stampBackingConfig.frameIdentity}
        colorBlend={stampBackingConfig.colorBlend}
        coordinateSystem="splitLandscape"
        backingSource={stampBackingConfig.backingSource}
      />
    </>
  );
}

function ClassicSplitHalfSlot({
  card,
  half,
  side,
  fuse,
  rect,
  scale,
  onSectionPress,
  zone,
}: {
  card: CardDraft;
  half: SplitCardHalf;
  side: "left" | "right";
  fuse: boolean;
  rect: CoordinateRect;
  scale: number;
  onSectionPress: SectionPressHandler;
  zone: (section: CardSection, radius?: number) => Record<string, unknown>;
}) {
  const halfCard = toSplitHalfCard(card, half);
  const frameIdentity = inferFrameIdentity(halfCard);
  const frameStyle = inferFrameStyle(halfCard);
  const displayedRulesText = getDisplayRulesText(halfCard);
  const displayedFlavorText = normalizeDisplayMultilineText(half.flavorText ?? "");
  const manaSymbols = parseManaCost(half.manaCost);
  const hasFlavorText = displayedFlavorText.trim().length > 0;
  const rulesRect = getClassicSplitRulesTextRect(fuse, hasFlavorText);
  const flavorRect = getClassicSplitFlavorTextRect(fuse);
  const typeLineTextYOffset = fuse ? -3 * scale : 0;
  const rulesMetrics = getSplitHalfRulesMetrics(
    displayedRulesText,
    displayedFlavorText,
    rulesRect.height,
    flavorRect.height,
  );

  return (
    <View
      pointerEvents="box-none"
      style={{
        ...splitCardRectStyle(rect),
        overflow: "hidden",
      }}
    >
      <View style={{ width: "100%", height: "100%", backgroundColor: "#0f1114" }}>
        <StableFrameImage
          cacheKey={`split-${side}-base`}
          source={getSplitFrameSource(frameIdentity)}
          resizeMode="stretch"
        />
        <ClassicSplitArtSlot
          card={card}
          half={half}
          frameIdentity={frameIdentity}
          scale={scale}
          onSectionPress={onSectionPress}
          zone={zone}
        />
        {fuse ? (
          <StableFrameImage
            cacheKey={`split-${side}-fuse`}
            source={getSplitFuseFrameSource(frameIdentity, side)}
            resizeMode="stretch"
          />
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${half.name || "split half"} name and cost`}
          onPress={() => onSectionPress("identity", { openSheet: true })}
          style={{
            ...splitHalfRectStyle({
              x: SPLIT_HALF_COORDINATES.name.x,
              y: SPLIT_HALF_COORDINATES.name.y,
              width:
                SPLIT_HALF_COORDINATES.manaCost.x +
                SPLIT_HALF_COORDINATES.manaCost.width -
                SPLIT_HALF_COORDINATES.name.x,
              height: SPLIT_HALF_COORDINATES.name.height,
            }),
            flexDirection: "row",
            alignItems: "flex-start",
            ...zone("identity", 3),
          }}
        >
          <Text
            selectable={false}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.62}
            style={{
              flex: 1,
              color: frameStyle.ink,
              fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
              fontSize: 15 * scale,
              lineHeight: 17 * scale,
              ...TITLE_KERNING_FIX,
            }}
          >
            {half.name || "Untitled"}
          </Text>
          <ManaCostSymbols
            symbols={manaSymbols}
            size={17 * scale}
            gap={1 * scale}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${half.name || "split half"} type line`}
          onPress={() => onSectionPress("typeLine", { openSheet: true })}
          style={{
            ...splitHalfRectStyle(SPLIT_HALF_COORDINATES.typeLine),
            justifyContent: "flex-start",
            ...zone("typeLine", 3),
          }}
        >
          <Text
            selectable={false}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.64}
            style={{
              color: frameStyle.ink,
              fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
              fontSize: 10.2 * scale,
              lineHeight: 10.2 * scale,
              ...optionalTransformStyle(typeLineTextYOffset ? [{ translateY: typeLineTextYOffset }] : null),
            }}
          >
            {half.typeLine || "Instant"}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${half.name || "split half"} set symbol`}
          onPress={() => onSectionPress("printing", { openSheet: true })}
          hitSlop={6}
          style={{
            ...splitHalfRectStyle(SPLIT_HALF_COORDINATES.setSymbol),
            alignItems: "center",
            justifyContent: "center",
            ...zone("printing", 2),
          }}
        >
          <SetSymbolMark
            presetId={card.setSymbolPreset}
            imageUri={card.setSymbolUri}
            rarity={card.rarity}
            size={16 * scale}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${half.name || "split half"} rules text`}
          onPress={() => onSectionPress("rules", { openSheet: true })}
          style={{
            ...splitHalfRectStyle(rulesRect),
            justifyContent: "center",
            overflow: "hidden",
            paddingLeft: 6 * scale,
            paddingRight: 4 * scale,
            ...zone("rules", 3),
          }}
        >
          <InlineSymbolText
            value={displayedRulesText}
            color={frameStyle.ink}
            fontFamily={FULL_MAGIC_PACK.fontFamilies.body}
            fontSize={rulesMetrics.rulesFontSize * scale}
            lineHeight={rulesMetrics.rulesLineHeight * scale}
            symbolSize={rulesMetrics.rulesFontSize * scale * 1.15}
          />
        </Pressable>

        {hasFlavorText ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${half.name || "split half"} flavor text`}
            onPress={() => onSectionPress("rules", { openSheet: true })}
            style={{
              ...splitHalfRectStyle(flavorRect),
              justifyContent: "center",
              overflow: "hidden",
              paddingLeft: 4 * scale,
              paddingRight: 4 * scale,
              ...zone("rules", 3),
            }}
          >
            <Text
              selectable={false}
              style={{
                color: frameStyle.ink,
                fontFamily: FULL_MAGIC_PACK.fontFamilies.italic,
                fontSize: rulesMetrics.flavorFontSize * scale,
                lineHeight: rulesMetrics.flavorLineHeight * scale,
              }}
            >
              {displayedFlavorText}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function ClassicSplitArtSlot({
  card,
  half,
  frameIdentity,
  scale,
  onSectionPress,
  zone,
}: {
  card: CardDraft;
  half: SplitCardHalf;
  frameIdentity: FrameIdentity;
  scale: number;
  onSectionPress: SectionPressHandler;
  zone: (section: CardSection, radius?: number) => Record<string, unknown>;
}) {
  const labelStem = half.name?.trim() || "split half";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={card.artUri ? `Change ${labelStem} art` : `Select ${labelStem} art`}
      onPress={() => onSectionPress("art", { openSheet: true })}
      style={{
        ...splitHalfRectStyle(SPLIT_HALF_COORDINATES.art),
        overflow: "hidden",
        backgroundColor: "#242823",
        ...zone("art", 2),
      }}
    >
      {card.artUri ? (
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: card.artUri }}
          resizeMode="cover"
          style={{
            width: "100%",
            height: "100%",
            transform: [
              { translateX: (card.artTransform?.offsetX ?? 0) * scale },
              { translateY: (card.artTransform?.offsetY ?? 0) * scale },
              { scale: card.artTransform?.scale ?? 1 },
            ],
          }}
        />
      ) : (
        <SplitHalfArtPlaceholder frameIdentity={frameIdentity} />
      )}
    </Pressable>
  );
}

function FuseReminderStrip({
  card,
  leftHalf,
  rightHalf,
  scale,
  onSectionPress,
  zone,
}: {
  card: CardDraft;
  leftHalf: SplitCardHalf;
  rightHalf: SplitCardHalf;
  scale: number;
  onSectionPress: SectionPressHandler;
  zone: (section: CardSection, radius?: number) => Record<string, unknown>;
}) {
  const leftFrame = inferFrameIdentity(toSplitHalfCard(card, leftHalf));
  const rightFrame = inferFrameIdentity(toSplitHalfCard(card, rightHalf));
  const bridgeFrame = leftFrame === rightFrame ? leftFrame : "gold";
  const reminderText = card.splitFuseText?.trim() || DEFAULT_FUSE_REMINDER_TEXT;

  return (
    <>
      <SplitFuseBridge leftFrame={leftFrame} rightFrame={rightFrame} bridgeFrame={bridgeFrame} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit fuse reminder text"
        onPress={() => onSectionPress("rules", { openSheet: true })}
        style={{
          ...splitCardRectStyle(SPLIT_FUSE_COORDINATES.reminder),
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 2 * scale,
          zIndex: 3,
          ...zone("rules", 2),
        }}
      >
        <InlineSymbolText
          value={reminderText}
          color="#1a1612"
          fontFamily={FULL_MAGIC_PACK.fontFamilies.body}
          fontSize={12 * scale}
          lineHeight={14 * scale}
          symbolSize={13 * scale}
        />
      </Pressable>
    </>
  );
}

function SplitFuseBridge({
  leftFrame,
  rightFrame,
  bridgeFrame,
}: {
  leftFrame: FrameIdentity;
  rightFrame: FrameIdentity;
  bridgeFrame: FrameIdentity;
}) {
  const bridgeStyle = {
    ...splitCardRectStyle(SPLIT_FUSE_COORDINATES.bridge),
    zIndex: 1,
  };

  if (leftFrame === rightFrame) {
    return (
      <StableFrameImage
        cacheKey={`split-fuse-bridge-${bridgeFrame}`}
        source={getSplitFuseBridgeSource(bridgeFrame)}
        resizeMode="stretch"
        containerStyle={bridgeStyle}
      />
    );
  }

  return (
    <View pointerEvents="none" style={bridgeStyle}>
      <View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: "50%",
          overflow: "hidden",
        }}
      >
        <StableFrameImage
          cacheKey={`split-fuse-bridge-left-${leftFrame}`}
          source={getSplitFuseBridgeSource(leftFrame)}
          resizeMode="stretch"
          imageStyle={{ width: "200%", height: "100%" }}
        />
      </View>
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "50%",
          overflow: "hidden",
        }}
      >
        <StableFrameImage
          cacheKey={`split-fuse-bridge-right-${rightFrame}`}
          source={getSplitFuseBridgeSource(rightFrame)}
          resizeMode="stretch"
          imageStyle={{
            position: "absolute",
            right: 0,
            width: "200%",
            height: "100%",
          }}
        />
      </View>
    </View>
  );
}

function SplitPrintingFooter({
  card,
  scale,
  onSectionPress,
  zone,
}: {
  card: CardDraft;
  scale: number;
  onSectionPress: SectionPressHandler;
  zone: (section: CardSection, radius?: number) => Record<string, unknown>;
}) {
  return (
    <>
      <RotatedSplitText
        rect={{ x: 22, y: 24, width: 26, height: 7 }}
        scale={scale}
        text={getModernCollectorLine(card)}
        fontSize={7 * scale}
        fontFamily={FULL_MAGIC_PACK.fontFamilies.footerCollector}
        weight="800"
        onPress={() => onSectionPress("printing", { openSheet: true })}
        zone={zone}
      />
      <RotatedSplitText
        rect={{ x: 22, y: 54, width: 140, height: 7 }}
        scale={scale}
        text={getModernArtistLine(card)}
        fontSize={7.5 * scale}
        fontFamily={FULL_MAGIC_PACK.fontFamilies.footerArtist}
        onPress={() => onSectionPress("printing", { openSheet: true })}
        zone={zone}
      />
      <RotatedSplitText
        rect={{ x: 32, y: 214, width: 140, height: 7 }}
        scale={scale}
        text={getModernCopyrightLine(card)}
        fontSize={7.25 * scale}
        fontFamily={FULL_MAGIC_PACK.fontFamilies.footerLegal}
        align="flex-end"
        onPress={() => onSectionPress("printing", { openSheet: true })}
        zone={zone}
      />
    </>
  );
}

function RotatedSplitText({
  rect,
  scale,
  text,
  fontSize,
  fontFamily,
  weight,
  align = "flex-start",
  onPress,
  zone,
}: {
  rect: CoordinateRect;
  scale: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  weight?: "400" | "700" | "800";
  align?: "flex-start" | "flex-end";
  onPress: () => void;
  zone: (section: CardSection, radius?: number) => Record<string, unknown>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Edit split card printing"
      onPress={onPress}
      style={{
        position: "absolute",
        left: rect.x * scale,
        top: rect.y * scale,
        width: rect.height * scale,
        height: rect.width * scale,
        justifyContent: "center",
        ...zone("printing", 1),
      }}
    >
      <View
        style={{
          position: "absolute",
          left: ((rect.height - rect.width) / 2) * scale,
          top: ((rect.width - rect.height) / 2) * scale,
          width: rect.width * scale,
          height: rect.height * scale,
          justifyContent: "center",
          transform: [{ rotate: "270deg" }],
        }}
      >
        <Text
          selectable={false}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.45}
          style={{
            color: "#f6f0df",
            fontFamily,
            fontSize,
            fontWeight: weight,
            lineHeight: rect.height * scale,
            textAlign: align === "flex-end" ? "right" : "left",
            textTransform: "uppercase",
          }}
        >
          {text}
        </Text>
      </View>
    </Pressable>
  );
}

function AftermathSplitPreview({
  card,
  leftHalf,
  rightHalf,
  scale,
  onSectionPress,
  zone,
}: {
  card: CardDraft;
  leftHalf: SplitCardHalf;
  rightHalf: SplitCardHalf;
  scale: number;
  onSectionPress: SectionPressHandler;
  zone: (section: CardSection, radius?: number) => Record<string, unknown>;
}) {
  const topCard = toSplitHalfCard(card, leftHalf);
  const bottomCard = toSplitHalfCard(card, rightHalf);
  const topFrameIdentity = inferFrameIdentity(topCard);
  const bottomFrameIdentity = inferFrameIdentity(bottomCard);
  const topFrameStyle = inferFrameStyle(topCard);
  const bottomFrameStyle = inferFrameStyle(bottomCard);
  const stampBackingConfig = getSplitSecurityStampBackingConfig(card, leftHalf, rightHalf);
  const topManaSymbols = parseManaCost(leftHalf.manaCost);
  const bottomManaSymbols = parseManaCost(rightHalf.manaCost);
  const topRulesMetrics = getAftermathTopRulesMetrics(getDisplayRulesText(topCard));
  const bottomRulesMetrics = getSplitHalfRulesMetrics(
    getDisplayRulesText(bottomCard),
    normalizeDisplayMultilineText(rightHalf.flavorText ?? ""),
    AFTERMATH_COORDINATES.bottomRulesText.height,
    0,
  );

  return (
    <>
      <View pointerEvents="none" style={rectStyle({ x: 0, y: 0, width: 375, height: AFTERMATH_COORDINATES.topHeight })}>
        <StableFrameImage
          cacheKey="aftermath-top-frame"
          source={getAftermathTopFrameSource(topFrameIdentity)}
          resizeMode="stretch"
        />
      </View>
      <AftermathArtSlot
        rect={AFTERMATH_COORDINATES.topArt}
        frameIdentity={topFrameIdentity}
        card={card}
        scale={scale}
        zone={zone}
        label={card.artUri ? "Change aftermath upright half art" : "Select aftermath upright half art"}
        onPress={() => onSectionPress("art", { openSheet: true })}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit aftermath upright half name and cost"
        onPress={() => onSectionPress("identity", { openSheet: true })}
        style={{
          ...rectStyle({
            x: AFTERMATH_COORDINATES.topName.x,
            y: AFTERMATH_COORDINATES.topName.y,
            width:
              AFTERMATH_COORDINATES.topManaCost.x +
              AFTERMATH_COORDINATES.topManaCost.width -
              AFTERMATH_COORDINATES.topName.x,
            height: AFTERMATH_COORDINATES.topName.height,
          }),
          flexDirection: "row",
          alignItems: "center",
          ...zone("identity", 4),
        }}
      >
        <Text
          selectable={false}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.62}
          style={{
            flex: 1,
            color: topFrameStyle.ink,
            fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
            fontSize: 15 * scale,
            lineHeight: 18 * scale,
            ...TITLE_KERNING_FIX,
          }}
        >
          {leftHalf.name || "Untitled"}
        </Text>
        <ManaCostSymbols symbols={topManaSymbols} size={18 * scale} gap={1.5 * scale} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit aftermath upright half type line"
        onPress={() => onSectionPress("typeLine", { openSheet: true })}
        style={{
          ...rectStyle(AFTERMATH_COORDINATES.topTypeLine),
          justifyContent: "center",
          ...zone("typeLine", 4),
        }}
      >
        <Text
          selectable={false}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.66}
          style={{
            color: topFrameStyle.ink,
            fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
            fontSize: 13 * scale,
            lineHeight: 15.6 * scale,
          }}
        >
          {leftHalf.typeLine || "Sorcery"}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit aftermath upright half set symbol"
        onPress={() => onSectionPress("printing", { openSheet: true })}
        style={{
          ...rectStyle(AFTERMATH_COORDINATES.topSetSymbol),
          alignItems: "center",
          justifyContent: "center",
          ...zone("printing", 3),
        }}
      >
        <SetSymbolMark
          presetId={card.setSymbolPreset}
          imageUri={card.setSymbolUri}
          rarity={card.rarity}
          size={20 * scale}
        />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit aftermath upright half rules text"
        onPress={() => onSectionPress("rules", { openSheet: true })}
        style={{
          ...rectStyle(AFTERMATH_COORDINATES.topRulesText),
          justifyContent: "center",
          overflow: "hidden",
          paddingLeft: 6 * scale,
          paddingRight: 4 * scale,
          ...zone("rules", 3),
        }}
      >
        <InlineSymbolText
          value={getDisplayRulesText(topCard)}
          color={topFrameStyle.ink}
          fontFamily={FULL_MAGIC_PACK.fontFamilies.body}
          fontSize={topRulesMetrics.fontSize * scale}
          lineHeight={topRulesMetrics.lineHeight * scale}
          symbolSize={topRulesMetrics.fontSize * scale * 1.15}
        />
      </Pressable>

      <View
        pointerEvents="none"
        style={rectStyle(AFTERMATH_COORDINATES.bottomSlot)}
      >
        <StableFrameImage
          cacheKey="aftermath-bottom-frame"
          source={getAftermathBottomFrameSource(bottomFrameIdentity)}
          resizeMode="stretch"
        />
      </View>
      <AftermathArtSlot
        rect={{
          x: AFTERMATH_COORDINATES.bottomArt.x,
          y: AFTERMATH_COORDINATES.bottomY + AFTERMATH_COORDINATES.bottomArt.y,
          width: AFTERMATH_COORDINATES.bottomArt.width,
          height: AFTERMATH_COORDINATES.bottomArt.height,
        }}
        frameIdentity={bottomFrameIdentity}
        card={card}
        scale={scale}
        zone={zone}
        label={card.artUri ? "Change aftermath lower half art" : "Select aftermath lower half art"}
        onPress={() => onSectionPress("art", { openSheet: true })}
      />

      <RotatedSplitSlot rect={AFTERMATH_COORDINATES.bottomSlot} scale={scale} rotation="90deg">
        <View style={{ width: "100%", height: "100%" }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit aftermath half name and cost"
            onPress={() => onSectionPress("identity", { openSheet: true })}
            style={{
              ...aftermathBottomRectStyle(AFTERMATH_COORDINATES.bottomName),
              flexDirection: "row",
              alignItems: "center",
              ...zone("identity", 3),
            }}
          >
            <Text
              selectable={false}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.62}
              style={{
                flex: 1,
                color: bottomFrameStyle.ink,
                fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
                fontSize: 15 * scale,
                lineHeight: 17.5 * scale,
                ...TITLE_KERNING_FIX,
              }}
            >
              {rightHalf.name || "Aftermath"}
            </Text>
            <ManaCostSymbols symbols={bottomManaSymbols} size={17 * scale} gap={1 * scale} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit aftermath half type line"
            onPress={() => onSectionPress("typeLine", { openSheet: true })}
            style={{
              ...aftermathBottomRectStyle(AFTERMATH_COORDINATES.bottomTypeLine),
              justifyContent: "center",
              ...zone("typeLine", 3),
            }}
          >
            <Text
              selectable={false}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.66}
              style={{
                color: bottomFrameStyle.ink,
                fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
                fontSize: 13 * scale,
                lineHeight: 15.2 * scale,
              }}
            >
              {rightHalf.typeLine || "Sorcery"}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit aftermath half rules text"
            onPress={() => onSectionPress("rules", { openSheet: true })}
            style={{
              ...aftermathBottomRectStyle(AFTERMATH_COORDINATES.bottomRulesText),
              justifyContent: "center",
              overflow: "hidden",
              paddingLeft: 6 * scale,
              paddingRight: 4 * scale,
              ...zone("rules", 3),
            }}
          >
            <InlineSymbolText
              value={getDisplayRulesText(bottomCard)}
              color={bottomFrameStyle.ink}
              fontFamily={FULL_MAGIC_PACK.fontFamilies.body}
              fontSize={bottomRulesMetrics.rulesFontSize * scale}
              lineHeight={bottomRulesMetrics.rulesLineHeight * scale}
              symbolSize={bottomRulesMetrics.rulesFontSize * scale * 1.15}
            />
          </Pressable>
        </View>
      </RotatedSplitSlot>
      <SecurityStampLayer
        card={card}
        faceCard={card}
        typeFrame="aftermath"
        frameIdentity={stampBackingConfig.frameIdentity}
        colorBlend={stampBackingConfig.colorBlend}
        coordinateSystem="portrait"
        backingSource={stampBackingConfig.backingSource}
      />
    </>
  );
}

function AftermathArtSlot({
  rect,
  frameIdentity,
  card,
  scale,
  zone,
  label,
  onPress,
}: {
  rect: CoordinateRect;
  frameIdentity: FrameIdentity;
  card: CardDraft;
  scale: number;
  zone: (section: CardSection, radius?: number) => Record<string, unknown>;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        ...rectStyle(rect),
        overflow: "hidden",
        backgroundColor: "#242823",
        ...zone("art", 2),
      }}
    >
      {card.artUri ? (
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: card.artUri }}
          resizeMode="cover"
          style={{
            width: "100%",
            height: "100%",
            transform: [
              { translateX: (card.artTransform?.offsetX ?? 0) * scale },
              { translateY: (card.artTransform?.offsetY ?? 0) * scale },
              { scale: card.artTransform?.scale ?? 1 },
            ],
          }}
        />
      ) : (
        <LinearGradient
          colors={getSplitArtGradient(frameIdentity)}
          style={{ width: "100%", height: "100%" }}
        />
      )}
    </Pressable>
  );
}

function SplitHalfArtPlaceholder({ frameIdentity }: { frameIdentity: FrameIdentity }) {
  return (
    <View style={{ width: "100%", height: "100%" }}>
      <LinearGradient
        colors={getSplitArtGradient(frameIdentity)}
        style={{
          width: "100%",
          height: "100%",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            height: "38%",
            backgroundColor: "rgba(255, 244, 205, 0.28)",
          }}
        />
      </LinearGradient>
    </View>
  );
}

function ManaCostSymbols({
  symbols,
  size,
  gap,
}: {
  symbols: string[];
  size: number;
  gap: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        flexDirection: "row",
        flexShrink: 0,
        justifyContent: "flex-end",
        gap,
      }}
    >
      {symbols.map((symbol, index) => (
        <ManaSymbol
          key={`split-mana-${symbol}-${index}`}
          value={symbol}
          size={size}
        />
      ))}
    </View>
  );
}

function FutureManaCostSymbols({
  symbols,
  frameIdentity,
  size,
  scale,
}: {
  symbols: string[];
  frameIdentity: FrameIdentity;
  size: number;
  scale: number;
}) {
  const slotLayout =
    symbols.length <= FUTURESHIFTED_MANA_SLOT_ORIGINS.length
      ? FUTURESHIFTED_MANA_SLOT_ORIGINS.slice(0, symbols.length).map((slot) => ({
          x: slot.x * scale,
          y: slot.y * scale,
          size,
        }))
      : getOverflowFutureManaSlotLayout(symbols.length, scale);

  return (
    <View
      pointerEvents="none"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      {symbols.map((symbol, index) => {
        const slot = slotLayout[index];

        return (
          <View
            key={`future-mana-slot-${symbol}-${index}`}
            pointerEvents="none"
            style={{
              position: "absolute",
              left: slot.x,
              top: slot.y,
              width: slot.size,
              height: slot.size,
            }}
          >
            <FutureManaSymbol
              value={symbol}
              frameIdentity={frameIdentity}
              size={slot.size}
            />
          </View>
        );
      })}
    </View>
  );
}

function getOverflowFutureManaSlotLayout(symbolCount: number, scale: number) {
  const symbolSize = Math.max(
    20 * scale,
    Math.min(
      FUTURESHIFTED_MANA_SYMBOL_SIZE * scale,
      ((FUTURESHIFTED_MANA_COST_RECT.height - 40) * scale) / symbolCount,
    ),
  );
  const gap = Math.max(1 * scale, (symbolSize * 0.08));
  const totalHeight = symbolCount * symbolSize + (symbolCount - 1) * gap;
  const startY = Math.max(20 * scale, ((FUTURESHIFTED_MANA_COST_RECT.height * scale) - totalHeight) / 2);
  const centerX = 44 * scale;

  return Array.from({ length: symbolCount }, (_, index) => ({
    x: centerX - symbolSize / 2,
    y: startY + index * (symbolSize + gap),
    size: symbolSize,
  }));
}

function FutureManaSymbol({
  value,
  frameIdentity,
  size,
}: {
  value: string;
  frameIdentity: FrameIdentity;
  size: number;
}) {
  const renderInfo = getFutureManaSymbolRenderInfo(value, frameIdentity);

  if (!renderInfo) {
    return <ManaSymbol value={value} size={size} />;
  }

  if (!renderInfo.label) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        source={renderInfo.source}
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        accessibilityIgnoresInvertColors
        source={renderInfo.source}
        resizeMode="contain"
        style={{
          position: "absolute",
          width: size,
          height: size,
        }}
      />
      <Text
        selectable={false}
        adjustsFontSizeToFit
        numberOfLines={1}
        minimumFontScale={0.45}
        style={{
          color: "#111111",
          fontFamily: FULL_MAGIC_PACK.fontFamilies.body,
          fontSize: getFutureManaLabelFontSize(renderInfo.label, size),
          fontWeight: "900",
          lineHeight: size * 0.72,
          includeFontPadding: false,
          textAlign: "center",
          width: size * 0.72,
        }}
      >
        {renderInfo.label}
      </Text>
    </View>
  );
}

function getFutureManaSymbolRenderInfo(
  value: string,
  frameIdentity: FrameIdentity,
): { source: ImageSourcePropType; label?: string } | null {
  const normalized = normalizeFutureManaSymbol(value);
  const numericHybridMatch = normalized.match(/^([XYZ0-9]+)\/([WUBRG])$/) ??
    normalized.match(/^([WUBRG])\/([XYZ0-9]+)$/);

  if (numericHybridMatch) {
    const first = numericHybridMatch[1];
    const second = numericHybridMatch[2];
    const color = (isFutureManaColor(first) ? first : second) as ManaColor;
    const label = isFutureManaColor(first) ? second : first;

    return {
      source: FUTURE_NUMERIC_HYBRID_SOURCES[color],
      label,
    };
  }

  if (/^\d+$/.test(normalized) || ["X", "Y", "Z"].includes(normalized)) {
    return {
      source: FUTURE_GENERIC_MANA_SOURCES[frameIdentity] ?? FUTURE_GENERIC_MANA_SOURCE,
      label: normalized,
    };
  }

  const source = FUTURE_MANA_SYMBOL_SOURCES[normalized];

  return source ? { source } : null;
}

function normalizeFutureManaSymbol(value: string): string {
  const normalized = value.trim().toUpperCase();

  if (normalized === "COLORLESS" || normalized === "DIAMOND" || normalized === "◇") {
    return "C";
  }

  if (normalized === "TAP") {
    return "T";
  }

  if (normalized === "UNTAP") {
    return "Q";
  }

  if (normalized === "INFINITE") {
    return "I";
  }

  return normalized.replace(/\s+/g, "");
}

function isFutureManaColor(value: string): value is ManaColor {
  return value === "W" || value === "U" || value === "B" || value === "R" || value === "G";
}

function getFutureManaLabelFontSize(label: string, size: number): number {
  if (label.length >= 3) {
    return size * 0.34;
  }

  if (label.length === 2) {
    return size * 0.43;
  }

  return size * 0.56;
}

function getFutureTypeSymbolSource(typeLine: string): ImageSourcePropType | null {
  const typeWords = getFutureTypeWords(typeLine);

  if (typeWords.length > 1) {
    return FUTURE_TYPE_SYMBOL_SOURCES.multitype;
  }

  const symbolKey = getFutureTypeSymbolKey(typeWords[0]);

  return symbolKey ? FUTURE_TYPE_SYMBOL_SOURCES[symbolKey] : null;
}

function getFutureTypeWords(typeLine: string): string[] {
  const [left = ""] = typeLine.split(/[—–-]/);
  const normalizedWords = left
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());
  const cardTypeWords = normalizedWords.filter(
    (word) => !["basic", "legendary", "ongoing", "snow", "world"].includes(word),
  );

  return cardTypeWords.filter((word) =>
    ["artifact", "creature", "enchantment", "fortress", "instant", "land", "planeswalker", "sorcery"].includes(word),
  );
}

function getFutureTypeSymbolKey(typeWord: string | undefined): FutureTypeSymbolKey | null {
  switch (typeWord) {
    case "artifact":
    case "creature":
    case "enchantment":
    case "fortress":
    case "instant":
    case "land":
    case "planeswalker":
    case "sorcery":
      return typeWord;
    default:
      return null;
  }
}

function RotatedSplitSlot({
  rect,
  scale,
  rotation = "-90deg",
  children,
}: {
  rect: CoordinateRect;
  scale: number;
  rotation?: "-90deg" | "90deg";
  children: React.ReactNode;
}) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        ...rectStyle(rect),
        overflow: "hidden",
      }}
    >
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: ((rect.width - rect.height) / 2) * scale,
          top: ((rect.height - rect.width) / 2) * scale,
          width: rect.height * scale,
          height: rect.width * scale,
          transform: [{ rotate: rotation }],
        }}
      >
        {children}
      </View>
    </View>
  );
}

function splitHalfRectStyle(rect: CoordinateRect) {
  return {
    position: "absolute" as const,
    left: percent(rect.x / SPLIT_HALF_COORDINATES.width),
    top: percent(rect.y / SPLIT_HALF_COORDINATES.height),
    width: percent(rect.width / SPLIT_HALF_COORDINATES.width),
    height: percent(rect.height / SPLIT_HALF_COORDINATES.height),
  };
}

function splitCardRectStyle(rect: CoordinateRect) {
  return {
    position: "absolute" as const,
    left: percent(rect.x / SPLIT_CARD_COORDINATES.width),
    top: percent(rect.y / SPLIT_CARD_COORDINATES.height),
    width: percent(rect.width / SPLIT_CARD_COORDINATES.width),
    height: percent(rect.height / SPLIT_CARD_COORDINATES.height),
  };
}

function getClassicSplitRulesTextRect(fuse: boolean, hasFlavorText: boolean): CoordinateRect {
  const height = fuse ? 100 : SPLIT_HALF_COORDINATES.rulesText.height;

  if (!hasFlavorText) {
    return {
      ...SPLIT_HALF_COORDINATES.rulesText,
      height,
    };
  }

  return {
    ...SPLIT_HALF_COORDINATES.rulesText,
    height: fuse ? 68 : 82,
  };
}

function getClassicSplitFlavorTextRect(fuse: boolean): CoordinateRect {
  if (fuse) {
    return {
      ...SPLIT_HALF_COORDINATES.flavorText,
      y: 291,
      height: 25,
    };
  }

  return SPLIT_HALF_COORDINATES.flavorText;
}

function aftermathBottomRectStyle(rect: CoordinateRect) {
  return {
    position: "absolute" as const,
    left: percent(rect.x / AFTERMATH_COORDINATES.bottomHeight),
    top: percent(rect.y / CARD_COORDINATES.width),
    width: percent(rect.width / AFTERMATH_COORDINATES.bottomHeight),
    height: percent(rect.height / CARD_COORDINATES.width),
  };
}

function getSplitHalfRulesMetrics(
  rulesText: string,
  flavorText: string,
  rulesHeight: number = SPLIT_HALF_COORDINATES.rulesText.height,
  flavorHeight: number = SPLIT_HALF_COORDINATES.flavorText.height,
): {
  rulesFontSize: number;
  rulesLineHeight: number;
  flavorFontSize: number;
  flavorLineHeight: number;
} {
  const baseRulesFontSize = 12.7;
  const baseRulesLineHeight = 15.2;
  const baseFlavorFontSize = 12;
  const baseFlavorLineHeight = 14.4;
  const rulesLineCount = estimateWrappedLineCount(rulesText, 31);
  const flavorLineCount = estimateWrappedLineCount(flavorText, 33);
  const rulesScale = getTextScale(
    Math.max(1, rulesLineCount) * baseRulesLineHeight,
    Math.max(1, rulesHeight - 2),
  );
  const flavorScale = getTextScale(
    Math.max(1, flavorLineCount) * baseFlavorLineHeight,
    Math.max(1, flavorHeight - 2),
  );

  return {
    rulesFontSize: baseRulesFontSize * rulesScale,
    rulesLineHeight: baseRulesLineHeight * rulesScale,
    flavorFontSize: baseFlavorFontSize * flavorScale,
    flavorLineHeight: baseFlavorLineHeight * flavorScale,
  };
}

function getAftermathTopRulesMetrics(rulesText: string): {
  fontSize: number;
  lineHeight: number;
} {
  const baseFontSize = 14;
  const baseLineHeight = 16.8;
  const lineCount = estimateWrappedLineCount(rulesText, 43);
  const scale = getTextScale(lineCount * baseLineHeight, AFTERMATH_COORDINATES.topRulesText.height);

  return {
    fontSize: baseFontSize * scale,
    lineHeight: baseLineHeight * scale,
  };
}

function getSplitArtGradient(frameIdentity: FrameIdentity): [string, string, string] {
  switch (frameIdentity) {
    case "white":
      return ["#d9d0a8", "#f2e8c2", "#8a7753"];
    case "blue":
      return ["#16495d", "#8ab5c9", "#d2e6ec"];
    case "black":
      return ["#181719", "#58504b", "#b7a89c"];
    case "red":
      return ["#5f2119", "#bf6040", "#f1b06d"];
    case "green":
      return ["#1f4424", "#739b5a", "#d0d894"];
    case "artifact":
      return ["#4b4d4b", "#a6aaa4", "#e0dfd4"];
    case "land":
      return ["#42361f", "#a8894e", "#557347"];
    case "colorless":
      return ["#625f58", "#bdb7aa", "#eee8dc"];
    case "gold":
    default:
      return ["#735c24", "#d5aa4a", "#5c8a7c"];
  }
}

function PlaneswalkerPreview({
  card,
  faceCard,
  activeSection,
  width,
  cornerRadius,
  scale,
  frameIdentity,
  frameStyle,
  manaSymbols,
  showManaCost,
  exportMode,
  imageAspectRatio,
  isManaCostFocused,
  setIsManaCostFocused,
  updateFace,
  updateArtTransform,
  onChange,
  onSectionPress,
  artPanHandlers,
  artTransform,
  artGenerating,
  zone,
}: {
  card: CardDraft;
  faceCard: CardDraft;
  activeSection: CardSection | null;
  width: number;
  cornerRadius: number;
  scale: number;
  frameIdentity: ReturnType<typeof inferFrameIdentity>;
  frameStyle: ReturnType<typeof inferFrameStyle>;
  manaSymbols: string[];
  showManaCost: boolean;
  exportMode: boolean;
  imageAspectRatio?: number | null;
  isManaCostFocused: boolean;
  setIsManaCostFocused: (focused: boolean) => void;
  updateFace: (patch: Partial<CardDraft>) => void;
  updateArtTransform: (nextTransform: ArtTransform) => void;
  onChange: (patch: Partial<CardDraft>) => void;
  onSectionPress: SectionPressHandler;
  artPanHandlers: ReturnType<typeof PanResponder.create>["panHandlers"];
  artTransform: ArtTransform;
  artGenerating: boolean;
  zone: (section: CardSection, radius?: number) => Record<string, unknown>;
}) {
  const abilities = getLoyaltyAbilities(faceCard);
  const rows = getPlaneswalkerAbilityRows(abilities.length);
  const manaLayout = getPlaneswalkerManaCostLayout(manaSymbols.length);
  const baseCardName = faceCard.baseCardName?.trim() ?? "";
  const titleLayout = getTitleLayout(
    faceCard.name,
    baseCardName,
    manaLayout.rect,
    PLANESWALKER_COORDINATES.name,
    36,
  );
  const startingLoyalty = getStartingLoyalty(faceCard);
  const [typeLineCursorIndex, setTypeLineCursorIndex] = useState(faceCard.typeLine.length);
  const typeLineAutocompleteSuggestions = getTypeLineAutocompleteSuggestions(
    faceCard.typeLine,
    typeLineCursorIndex,
  );
  const showTypeLineAutocomplete =
    activeSection === "typeLine" && typeLineAutocompleteSuggestions.length > 0;
  const updateTypeLineCursor = (event: unknown) => {
    const selectionStart = getTextInputSelectionStart(event);

    if (selectionStart !== null) {
      setTypeLineCursorIndex(selectionStart);
    }
  };
  const updateTypeLine = (typeLine: string) => {
    onChange(getTypeLineChangePatch(card, typeLine));
  };
  const stampBackingConfig = getSecurityStampBackingConfig(faceCard, frameIdentity);

  return (
    <View
      style={{
        width,
        aspectRatio: PLANESWALKER_COORDINATES.width / PLANESWALKER_COORDINATES.height,
        borderRadius: cornerRadius,
        borderCurve: "continuous",
        overflow: "hidden",
        backgroundColor: "#090908",
        ...(exportMode ? null : cardPreviewShadowStyle),
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit card frame"
        onPress={() => onSectionPress("frame")}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          ...zone("frame", 18),
        }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={faceCard.artUri ? "Edit planeswalker art" : "Select planeswalker art"}
        onPress={() => onSectionPress("art", { openSheet: true })}
        {...artPanHandlers}
        style={{
          ...planeswalkerRectStyle(PLANESWALKER_COORDINATES.art),
          overflow: "hidden",
          backgroundColor: "#20251f",
          ...zone("art", 7),
        }}
      >
        {artGenerating ? (
          <GeneratingArtAnimation scale={scale} colors={getFrameColors(faceCard)} />
        ) : faceCard.artUri ? (
          <TransformableArtImage
            uri={faceCard.artUri}
            artRect={PLANESWALKER_COORDINATES.art}
            renderScale={scale}
            artTransform={artTransform}
            imageAspectRatio={imageAspectRatio}
          />
        ) : (
          <LinearGradient
            colors={["#24332f", "#78915e", "#d4bf86"]}
            style={{
              flex: 1,
              justifyContent: "flex-end",
              padding: 44 * scale,
            }}
          >
            <View
              style={{
                height: "42%",
                borderTopLeftRadius: 999,
                borderTopRightRadius: 999,
                backgroundColor: "rgba(255, 244, 205, 0.32)",
              }}
            />
          </LinearGradient>
        )}
      </Pressable>

      <View
        pointerEvents="none"
        style={{
          ...planeswalkerRectStyle({
            x: 89,
            y: 656,
            width: 606,
            height: 296,
          }),
          borderRadius: 12,
          borderCurve: "continuous",
          backgroundColor: "#f5edd4",
        }}
      />

      <StableFrameImage
        cacheKey="typeframe-planeswalker"
        source={getMseM15TypeFrameSource("planeswalker", frameIdentity)}
        resizeMode="contain"
      />

      {card.frameCustomization && card.frameCustomization.tintOpacity > 0 ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: card.frameCustomization.tintColor,
            opacity: Math.max(0, Math.min(0.45, card.frameCustomization.tintOpacity)),
          }}
        />
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => onSectionPress("identity")}
        style={{
          ...planeswalkerRectStyle(titleLayout.rect),
          justifyContent: "center",
          ...zone("identity", 4),
        }}
      >
        <TextInput
          accessibilityLabel="Planeswalker name"
          value={faceCard.name}
          onChangeText={(name) => updateFace({ name })}
          onFocus={() => onSectionPress("identity")}
          placeholder="Untitled"
          placeholderTextColor={frameStyle.mutedInk}
          numberOfLines={1}
          style={{
            color: frameStyle.ink,
            fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
            ...getWebSafeEditableTextMetrics(
              titleLayout.fontSize * scale,
              titleLayout.lineHeight * scale,
            ),
            height: titleLayout.lineHeight * scale,
            ...TITLE_KERNING_FIX,
            includeFontPadding: false,
            padding: 0,
            backgroundColor: "transparent",
          }}
        />
        {baseCardName ? (
          <Text
            numberOfLines={1}
            selectable={false}
            style={{
              color: frameStyle.ink,
              opacity: 0.86,
              fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
              fontSize: titleLayout.baseNameFontSize * scale,
              lineHeight: titleLayout.baseNameLineHeight * scale,
              ...TITLE_KERNING_FIX,
              includeFontPadding: false,
            }}
          >
            {baseCardName}
          </Text>
        ) : null}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit planeswalker mana cost"
        onPress={() => onSectionPress("identity", { openSheet: true })}
        style={{
          ...planeswalkerRectStyle(
            isManaCostFocused ? PLANESWALKER_COORDINATES.manaCost : manaLayout.rect,
          ),
          alignItems: "flex-end",
          justifyContent: "center",
          ...zone("identity", 4),
        }}
      >
        {showManaCost && isManaCostFocused ? (
          <TextInput
            accessibilityLabel="Planeswalker mana cost"
            value={faceCard.manaCost}
            autoFocus
            onChangeText={(manaCost) => updateFace({ manaCost })}
            onFocus={() => {
              setIsManaCostFocused(true);
              onSectionPress("identity");
            }}
            onBlur={() => {
              setIsManaCostFocused(false);
              updateFace({ manaCost: normalizeManaInput(faceCard.manaCost) });
            }}
            placeholder="{3}{G}"
            placeholderTextColor={frameStyle.mutedInk}
            numberOfLines={1}
            autoCapitalize="characters"
            style={{
              width: "100%",
              color: frameStyle.ink,
              fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
              ...getWebSafeEditableTextMetrics(
                getManaCostEditorFontSize(
                  faceCard.manaCost,
                  PLANESWALKER_COORDINATES.manaCost.width,
                  26,
                ) * scale,
                34 * scale,
              ),
              padding: 0,
              textAlign: "right",
              backgroundColor: "transparent",
            }}
          />
        ) : showManaCost ? (
          <View
            pointerEvents="none"
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: manaLayout.gap * scale,
            }}
          >
            {manaSymbols.map((symbol, index) => (
              <ManaSymbol
                key={`planeswalker-${symbol}-${index}`}
                value={symbol}
                size={manaLayout.symbolSize * scale}
              />
            ))}
          </View>
        ) : null}
      </Pressable>

      <View
        style={{
          ...planeswalkerRectStyle(PLANESWALKER_COORDINATES.typeLine),
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          overflow: "visible",
          zIndex: showTypeLineAutocomplete ? 30 : undefined,
          ...zone("typeLine", 4),
        }}
      >
        {activeSection === "typeLine" ? (
          <TypeLineEditorButton
            scale={scale}
            ink={frameStyle.ink}
            onPress={() => onSectionPress("typeLine", { openSheet: true })}
          />
        ) : null}
        <TextInput
          accessibilityLabel="Planeswalker type line"
          value={faceCard.typeLine}
          onChangeText={updateTypeLine}
          onChange={updateTypeLineCursor}
          onFocus={() => onSectionPress("typeLine")}
          onPressIn={() => onSectionPress("typeLine")}
          onSelectionChange={updateTypeLineCursor}
          placeholder="Legendary Planeswalker"
          placeholderTextColor={frameStyle.mutedInk}
          numberOfLines={1}
          style={{
            color: frameStyle.ink,
            flex: 1,
            fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
            ...getWebSafeEditableTextMetrics(
              28 * scale,
              PLANESWALKER_COORDINATES.typeLine.height * scale,
            ),
            height: "100%",
            padding: 0,
            backgroundColor: "transparent",
            textAlignVertical: "center",
          }}
        />
        {showTypeLineAutocomplete ? (
          <TypeLineAutocompleteMenu
            suggestions={typeLineAutocompleteSuggestions}
            scale={scale}
            onSelect={(suggestion) => updateTypeLine(suggestion.replacement)}
          />
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit set symbol"
        onPress={() => onSectionPress("printing")}
        hitSlop={10}
        style={{
          ...planeswalkerRectStyle(PLANESWALKER_COORDINATES.setSymbol),
          alignItems: "center",
          justifyContent: "center",
          ...zone("printing", 3),
          zIndex: 3,
        }}
      >
        <SetSymbolMark
          presetId={card.setSymbolPreset}
          imageUri={card.setSymbolUri}
          rarity={card.rarity}
          size={38 * scale}
        />
      </Pressable>

      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {rows.map((row, index) => {
          const ability = abilities[index];
          const metrics = getPlaneswalkerAbilityTextMetrics(ability.text, row.text.height);

          return (
            <View
              key={ability.id}
              pointerEvents="box-none"
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
            >
              {index > 0 ? (
                <View
                  pointerEvents="none"
                  style={{
                    ...planeswalkerRectStyle({
                      x: PLANESWALKER_COORDINATES.loyaltyText.x,
                      y: row.row.y - 3,
                      width: PLANESWALKER_COORDINATES.loyaltyText.width,
                      height: 1.5,
                    }),
                    backgroundColor: "rgba(44, 38, 28, 0.24)",
                  }}
                />
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Edit loyalty cost ${index + 1}`}
                onPress={() => onSectionPress("stats", { openSheet: true })}
                style={{
                  ...planeswalkerRectStyle(row.cost),
                  alignItems: "center",
                  justifyContent: "center",
                  ...zone("stats", 6),
                  zIndex: 4,
                }}
              >
                <Image
                  accessibilityIgnoresInvertColors
                  source={getPlaneswalkerLoyaltyCostSource(ability.cost)}
                  resizeMode="contain"
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                  }}
                />
                <Text
                  selectable={false}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.68}
                  style={{
                    width: "76%",
                    color: "#ffffff",
                    fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
                    fontSize: 28 * scale,
                    lineHeight: 32 * scale,
                    textAlign: "center",
                  }}
                >
                  {ability.cost || "0"}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Edit loyalty ability ${index + 1}`}
                onPress={() => onSectionPress("stats", { openSheet: true })}
                style={{
                  ...planeswalkerRectStyle(row.text),
                  justifyContent: "center",
                  ...zone("stats", 3),
                  zIndex: 4,
                }}
              >
                <InlineSymbolText
                  value={ability.text}
                  color={frameStyle.ink}
                  fontFamily={FULL_MAGIC_PACK.fontFamilies.body}
                  fontSize={metrics.fontSize * scale}
                  lineHeight={metrics.lineHeight * scale}
                  symbolSize={metrics.fontSize * scale * 1.12}
                />
              </Pressable>
            </View>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit starting loyalty"
        onPress={() => onSectionPress("stats", { openSheet: true })}
        style={{
          ...planeswalkerRectStyle(PLANESWALKER_COORDINATES.startingLoyalty),
          alignItems: "center",
          justifyContent: "center",
          ...zone("stats", 8),
          zIndex: 4,
        }}
      >
        <Image
          accessibilityIgnoresInvertColors
          source={FULL_MAGIC_PACK.planeswalkerLoyalty.start}
          resizeMode="contain"
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
        />
        <Text
          selectable={false}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.68}
          style={{
            width: "66%",
            color: "#ffffff",
            fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
            fontSize: 34 * scale,
            lineHeight: 38 * scale,
            textAlign: "center",
          }}
        >
          {startingLoyalty}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => onSectionPress("printing")}
        style={{
          ...planeswalkerRectStyle(PLANESWALKER_COORDINATES.footer),
          justifyContent: "center",
          ...zone("printing", 3),
        }}
      >
        <ModernPrintingFooter card={card} scale={scale * 2} />
      </Pressable>
      <SecurityStampLayer
        card={card}
        faceCard={faceCard}
        typeFrame="planeswalker"
        frameIdentity={stampBackingConfig.frameIdentity}
        colorBlend={stampBackingConfig.colorBlend}
        coordinateSystem="planeswalker"
        backingSource={stampBackingConfig.backingSource}
      />
    </View>
  );
}

function DfcFaceSymbolButton({
  face,
  mode,
  frameIdentity,
  scale,
  onPress,
  battle = false,
}: {
  face: DfcFace;
  mode: DfcMode;
  frameIdentity: FrameIdentity;
  scale: number;
  onPress: () => void;
  battle?: boolean;
}) {
  const source = getDfcFaceSymbolSource({ face, mode, frameIdentity });
  const rect = battle
    ? BATTLE_COORDINATES.transformIcon
    : getDfcFaceSymbolRect(face, mode);
  const style = battle ? battleRectStyle(rect) : rectStyle(rect);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Show ${face === "front" ? "back" : "front"} face`}
      onPress={onPress}
      hitSlop={8}
      style={{
        ...style,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 3,
      }}
    >
      <Image
        accessibilityIgnoresInvertColors
        source={source}
        resizeMode="contain"
        style={{
          width: rect.width * scale,
          height: rect.height * scale,
        }}
      />
    </Pressable>
  );
}

function FrameColorIndicatorDot({
  source,
  scale,
}: {
  source: ImageSourcePropType;
  scale: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        ...rectStyle(DFC_COLOR_INDICATOR_RECT),
        alignItems: "center",
        justifyContent: "center",
        zIndex: 4,
      }}
    >
      <Image
        accessibilityIgnoresInvertColors
        source={source}
        resizeMode="contain"
        style={{
          width: DFC_COLOR_INDICATOR_RECT.width * scale,
          height: DFC_COLOR_INDICATOR_RECT.height * scale,
        }}
      />
    </View>
  );
}

function getDfcFaceSymbolRect(face: DfcFace, mode: DfcMode): CoordinateRect {
  if (face === "back" && mode === "transform") {
    return { x: 319, y: 19, width: 43, height: 43 };
  }

  return { x: 13, y: 19, width: 43, height: 43 };
}

function ModalDfcHintBar({ card, scale }: { card: CardDraft; scale: number }) {
  const isFrontFace = !isDfcBackFace(card);
  const oppositeFace = isDfcBackFace(card) ? "front" : "back";
  const oppositeFaceCard = getEditableCardFace({ ...card, dfcFace: oppositeFace });
  const oppositeFrameIdentity = inferFrameIdentity(oppositeFaceCard);
  const symbolSource = getDfcFaceSymbolSource({
    face: oppositeFace,
    mode: "modal",
    frameIdentity: oppositeFrameIdentity,
  });
  const summary = [
    oppositeFaceCard.name || (oppositeFace === "front" ? "Front face" : "Back face"),
    oppositeFaceCard.typeLine || "Card face",
    oppositeFaceCard.manaCost,
  ].filter(Boolean).join(" · ");

  return (
    <View
      pointerEvents="none"
      style={{
        ...rectStyle({ x: 31, y: 474, width: 258, height: 15 }),
        borderRadius: 3,
        borderCurve: "continuous",
        backgroundColor: isFrontFace ? "rgba(26, 22, 19, 0.78)" : "rgba(242, 231, 197, 0.82)",
        flexDirection: "row",
        alignItems: "center",
        gap: 3 * scale,
        paddingHorizontal: 4 * scale,
      }}
    >
      <Image
        accessibilityIgnoresInvertColors
        source={symbolSource}
        resizeMode="contain"
        style={{ width: 11 * scale, height: 11 * scale }}
      />
      <Text
        selectable={false}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.62}
        style={{
          flex: 1,
          color: isFrontFace ? "#f8f2df" : "#17140f",
          fontFamily: FULL_MAGIC_PACK.fontFamilies.body,
          fontSize: 7.5 * scale,
          lineHeight: 9 * scale,
          fontWeight: "800",
        }}
      >
        {summary}
      </Text>
    </View>
  );
}

function BattleFrontPreview({
  card,
  faceCard,
  activeSection,
  width,
  cornerRadius,
  scale,
  frameIdentity,
  frameStyle,
  manaSymbols,
  manaColors,
  exportMode,
  imageAspectRatio,
  isManaCostFocused,
  setIsManaCostFocused,
  updateFace,
  updateArtTransform,
  onChange,
  onSectionPress,
  artPanHandlers,
  artTransform,
  artGenerating,
  zone,
}: {
  card: CardDraft;
  faceCard: CardDraft;
  activeSection: CardSection | null;
  width: number;
  cornerRadius: number;
  scale: number;
  frameIdentity: ReturnType<typeof inferFrameIdentity>;
  frameStyle: ReturnType<typeof inferFrameStyle>;
  manaSymbols: string[];
  manaColors: ManaColor[];
  exportMode: boolean;
  imageAspectRatio?: number | null;
  isManaCostFocused: boolean;
  setIsManaCostFocused: (focused: boolean) => void;
  updateFace: (patch: Partial<CardDraft>) => void;
  updateArtTransform: (nextTransform: ArtTransform) => void;
  onChange: (patch: Partial<CardDraft>) => void;
  onSectionPress: SectionPressHandler;
  artPanHandlers: ReturnType<typeof PanResponder.create>["panHandlers"];
  artTransform: ArtTransform;
  artGenerating: boolean;
  zone: (section: CardSection, radius?: number) => Record<string, unknown>;
}) {
  const defenseValue = card.defense?.trim() || "3";
  const displayedFlavorText = normalizeDisplayMultilineText(faceCard.flavorText);
  const hasFlavor = displayedFlavorText.trim().length > 0;
  const displayedRulesText = getDisplayRulesText(faceCard);
  const rulesFontSize = getBattleRulesFontSize(displayedRulesText, displayedFlavorText);
  const rulesLineHeight = rulesFontSize * 1.2;
  const battleInk = "#171512";
  const baseCardName = faceCard.baseCardName?.trim() ?? "";
  const [typeLineCursorIndex, setTypeLineCursorIndex] = useState(faceCard.typeLine.length);
  const typeLineAutocompleteSuggestions = getTypeLineAutocompleteSuggestions(
    faceCard.typeLine,
    typeLineCursorIndex,
  );
  const showTypeLineAutocomplete =
    activeSection === "typeLine" && typeLineAutocompleteSuggestions.length > 0;
  const updateTypeLineCursor = (event: unknown) => {
    const selectionStart = getTextInputSelectionStart(event);

    if (selectionStart !== null) {
      setTypeLineCursorIndex(selectionStart);
    }
  };
  const updateTypeLine = (typeLine: string) => {
    onChange(getTypeLineChangePatch(card, typeLine));
  };
  const stampBackingConfig = getSecurityStampBackingConfig(faceCard, frameIdentity);

  return (
    <View
      style={{
        width,
        aspectRatio: BATTLE_COORDINATES.width / BATTLE_COORDINATES.height,
        borderRadius: cornerRadius,
        borderCurve: "continuous",
        overflow: "hidden",
        backgroundColor: "#090908",
        ...(exportMode ? null : cardPreviewShadowStyle),
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit card frame"
        onPress={() => onSectionPress("frame")}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          ...zone("frame", 18),
        }}
      />

      <StableFrameImage
        cacheKey="battle-frame"
        source={getBattleFrameSource(frameIdentity)}
        resizeMode="contain"
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={faceCard.artUri ? "Edit battle art" : "Select battle art"}
        onPress={() => onSectionPress("art", { openSheet: true })}
        {...artPanHandlers}
        style={{
          ...battleRectStyle(BATTLE_COORDINATES.art),
          overflow: "hidden",
          backgroundColor: "#20251f",
          ...zone("art", 6),
        }}
      >
        {artGenerating ? (
          <GeneratingArtAnimation scale={scale} colors={getFrameColors(faceCard)} />
        ) : faceCard.artUri ? (
          <TransformableArtImage
            uri={faceCard.artUri}
            artRect={BATTLE_COORDINATES.art}
            renderScale={scale}
            artTransform={artTransform}
            imageAspectRatio={imageAspectRatio}
          />
        ) : (
          <LinearGradient
            colors={["#24332f", "#78915e", "#d4bf86"]}
            style={{
              flex: 1,
              justifyContent: "flex-end",
              padding: 18 * scale,
            }}
          >
            <View
              style={{
                height: "42%",
                borderTopLeftRadius: 999,
                borderTopRightRadius: 999,
                backgroundColor: "rgba(255, 244, 205, 0.32)",
              }}
            />
          </LinearGradient>
        )}
      </Pressable>

      {card.frameCustomization && card.frameCustomization.tintOpacity > 0 ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: card.frameCustomization.tintColor,
            opacity: Math.max(0, Math.min(0.45, card.frameCustomization.tintOpacity)),
          }}
        />
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => onSectionPress("identity")}
        style={{
          ...battleRectStyle(BATTLE_COORDINATES.name),
          ...zone("identity", 4),
        }}
      >
        <BattleRotatedInner rect={BATTLE_COORDINATES.name} scale={scale}>
          <TextInput
            accessibilityLabel="Battle name"
            value={faceCard.name}
            onChangeText={(name) => updateFace({ name })}
            onFocus={() => onSectionPress("identity")}
            placeholder="Invasion of..."
            placeholderTextColor="#5d6358"
            numberOfLines={1}
            style={{
              color: battleInk,
              fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
              ...getWebSafeEditableTextMetrics(
                getBattleNameFontSize(faceCard.name, baseCardName) * scale,
                (baseCardName ? 15 : 22) * scale,
              ),
              height: (baseCardName ? 15 : 22) * scale,
              ...TITLE_KERNING_FIX,
              includeFontPadding: false,
              padding: 0,
              backgroundColor: "transparent",
            }}
          />
          {baseCardName ? (
            <Text
              numberOfLines={1}
              selectable={false}
              style={{
                color: battleInk,
                opacity: 0.86,
                fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
                fontSize: 8.5 * scale,
                lineHeight: 9.8 * scale,
                ...TITLE_KERNING_FIX,
                includeFontPadding: false,
              }}
            >
              {baseCardName}
            </Text>
          ) : null}
        </BattleRotatedInner>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit battle mana cost"
        onPress={() => onSectionPress("identity", { openSheet: true })}
        style={{
          ...battleRectStyle(BATTLE_COORDINATES.manaCost),
          ...zone("identity", 4),
        }}
      >
        <BattleRotatedInner rect={BATTLE_COORDINATES.manaCost} scale={scale}>
          {isManaCostFocused ? (
            <TextInput
              accessibilityLabel="Battle mana cost"
              value={faceCard.manaCost}
              autoFocus
              onChangeText={(manaCost) => updateFace({ manaCost })}
              onFocus={() => {
                setIsManaCostFocused(true);
                onSectionPress("identity");
              }}
              onBlur={() => {
                setIsManaCostFocused(false);
                updateFace({ manaCost: normalizeManaInput(faceCard.manaCost) });
              }}
              placeholder="{3}{G}"
              placeholderTextColor="#5d6358"
              numberOfLines={1}
              autoCapitalize="characters"
              style={{
                width: "100%",
                color: battleInk,
                fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
                ...getWebSafeEditableTextMetrics(15 * scale, 20 * scale),
                padding: 0,
                textAlign: "right",
                backgroundColor: "transparent",
              }}
            />
          ) : (
            <View
              pointerEvents="none"
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 2.2 * scale,
                paddingRight: 1 * scale,
              }}
            >
              {manaSymbols.map((symbol, index) => (
                <ManaSymbol
                  key={`battle-${symbol}-${index}`}
                  value={symbol}
                  size={18 * scale}
                />
              ))}
            </View>
          )}
        </BattleRotatedInner>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Show back face"
        onPress={() => onChange(getNextDfcFacePatch(card))}
        style={{
          ...battleRectStyle(BATTLE_COORDINATES.transformIcon),
          ...zone("frame", 3),
        }}
      >
        <Image
          accessibilityIgnoresInvertColors
          source={getBattleTransformIconSource()}
          resizeMode="contain"
          style={{ width: "100%", height: "100%" }}
        />
      </Pressable>

      <View
        onPointerDown={() => onSectionPress("typeLine")}
        onTouchStart={() => onSectionPress("typeLine")}
        style={{
          ...battleRectStyle(BATTLE_COORDINATES.typeLine),
          overflow: "visible",
          zIndex: showTypeLineAutocomplete ? 30 : undefined,
          ...zone("typeLine", 4),
        }}
      >
        <BattleRotatedInner rect={BATTLE_COORDINATES.typeLine} scale={scale}>
          <TextInput
            accessibilityLabel="Battle type line"
            value={faceCard.typeLine}
            onChangeText={updateTypeLine}
            onChange={updateTypeLineCursor}
            onFocus={() => onSectionPress("typeLine")}
            onSelectionChange={updateTypeLineCursor}
            placeholder="Battle — Siege"
            placeholderTextColor="#5d6358"
            numberOfLines={1}
            style={{
              color: battleInk,
              fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
              ...getWebSafeEditableTextMetrics(13 * scale, 20 * scale),
              width: "100%",
              height: "100%",
              padding: 0,
              backgroundColor: "transparent",
              textAlignVertical: "center",
            }}
          />
          {showTypeLineAutocomplete ? (
            <TypeLineAutocompleteMenu
              suggestions={typeLineAutocompleteSuggestions}
              scale={scale}
              onSelect={(suggestion) => updateTypeLine(suggestion.replacement)}
            />
          ) : null}
        </BattleRotatedInner>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit set symbol"
        onPress={() => onSectionPress("printing")}
        hitSlop={10}
        style={{
          ...battleRectStyle(BATTLE_COORDINATES.setSymbol),
          alignItems: "center",
          justifyContent: "center",
          ...zone("printing", 3),
          zIndex: 3,
        }}
      >
        <BattleRotatedInner rect={BATTLE_COORDINATES.setSymbol} scale={scale}>
          <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
            <SetSymbolMark
              presetId={card.setSymbolPreset}
              imageUri={card.setSymbolUri}
              rarity={card.rarity}
              size={20 * scale}
            />
          </View>
        </BattleRotatedInner>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit battle rules text"
        onPress={() => onSectionPress("rules")}
        style={{
          ...battleRectStyle(BATTLE_COORDINATES.rulesPanel),
          overflow: "hidden",
          ...(activeSection === "rules" ? zone("rules", 10) : {}),
        }}
      >
        <BattleRotatedInner rect={BATTLE_COORDINATES.rulesPanel} scale={scale}>
          <View
            style={{
              flex: 1,
              paddingHorizontal: 6 * scale,
              paddingVertical: 5 * scale,
              justifyContent: "center",
            }}
          >
            {activeSection === "rules" ? (
              <>
                <TextInput
                  accessibilityLabel="Battle rules text"
                  value={faceCard.rulesText}
                  onChangeText={(rulesText) => updateFace({ rulesText })}
                  onFocus={() => onSectionPress("rules")}
                  placeholder="When this battle enters..."
                  placeholderTextColor="#5d6358"
                  multiline
                  blurOnSubmit={false}
                  submitBehavior="newline"
                  scrollEnabled={false}
                  style={{
                    flex: 1,
                    color: battleInk,
                    fontFamily: FULL_MAGIC_PACK.fontFamilies.body,
                    ...getWebSafeEditableTextMetrics(
                      rulesFontSize * scale,
                      rulesLineHeight * scale,
                    ),
                    padding: 0,
                    overflow: "hidden",
                    backgroundColor: "transparent",
                    textAlignVertical: "center",
                  }}
                />
                {hasFlavor ? (
                  <TextInput
                    accessibilityLabel="Battle flavor text"
                    value={faceCard.flavorText}
                    onChangeText={(flavorText) => updateFace({ flavorText })}
                    onFocus={() => onSectionPress("rules")}
                    placeholder="Flavor text"
                    placeholderTextColor="#5d6358"
                    multiline
                    blurOnSubmit={false}
                    submitBehavior="newline"
                    scrollEnabled={false}
                    style={{
                      minHeight: 20 * scale,
                      color: battleInk,
                      fontFamily: FULL_MAGIC_PACK.fontFamilies.italic,
                      ...getWebSafeEditableTextMetrics(
                        Math.max(9.5, rulesFontSize - 1.5) * scale,
                        Math.max(12, rulesLineHeight - 1.5) * scale,
                      ),
                      padding: 0,
                      overflow: "hidden",
                      backgroundColor: "transparent",
                      textAlignVertical: "center",
                    }}
                  />
                ) : null}
              </>
            ) : (
              <>
                <InlineSymbolText
                  value={displayedRulesText}
                  color={battleInk}
                  fontFamily={FULL_MAGIC_PACK.fontFamilies.body}
                  fontSize={rulesFontSize * scale}
                  lineHeight={rulesLineHeight * scale}
                  symbolSize={rulesFontSize * scale * 1.16}
                />
                {hasFlavor ? (
                  <>
                    <View
                      style={{
                        height: 1,
                        marginVertical: 4 * scale,
                        backgroundColor: "rgba(57, 58, 46, 0.38)",
                      }}
                    />
                    <InlineSymbolText
                      value={displayedFlavorText}
                      color={battleInk}
                      fontFamily={FULL_MAGIC_PACK.fontFamilies.italic}
                      fontSize={Math.max(9.5, rulesFontSize - 1.5) * scale}
                      lineHeight={Math.max(12, rulesLineHeight - 1.5) * scale}
                      symbolSize={rulesFontSize * scale}
                    />
                  </>
                ) : null}
              </>
            )}
          </View>
        </BattleRotatedInner>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit battle defense"
        onPress={() => onSectionPress("stats")}
        style={{
          ...battleRectStyle(BATTLE_COORDINATES.defense),
          alignItems: "center",
          justifyContent: "center",
          ...zone("stats", 5),
          zIndex: 3,
        }}
      >
        <BattleDefenseBox
          value={defenseValue}
          active={activeSection === "stats"}
          frameIdentity={frameIdentity}
          scale={scale}
          onChange={(defense) => onChange({ defense })}
          onFocus={() => onSectionPress("stats")}
        />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => onSectionPress("printing")}
        style={{
          ...battleRectStyle(BATTLE_COORDINATES.footer),
          justifyContent: "center",
          ...zone("printing", 3),
        }}
      >
        <ModernPrintingFooter card={card} scale={scale} variant="battle" />
      </Pressable>
      <SecurityStampLayer
        card={card}
        faceCard={faceCard}
        typeFrame="battle"
        frameIdentity={stampBackingConfig.frameIdentity}
        colorBlend={stampBackingConfig.colorBlend}
        coordinateSystem="portrait"
        backingSource={stampBackingConfig.backingSource}
      />
    </View>
  );
}

function BattleRotatedSlot({
  rect,
  scale,
  style,
  children,
}: {
  rect: CoordinateRect;
  scale: number;
  style?: Record<string, unknown>;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        ...battleRectStyle(rect),
        overflow: "hidden",
        borderRadius: 10,
        borderCurve: "continuous",
        borderWidth: 2,
        ...style,
      }}
    >
      <BattleRotatedInner rect={rect} scale={scale}>
        {children}
      </BattleRotatedInner>
    </View>
  );
}

function BattleRotatedInner({
  rect,
  scale,
  children,
}: {
  rect: CoordinateRect;
  scale: number;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        position: "absolute",
        left: ((rect.width - rect.height) / 2) * scale,
        top: ((rect.height - rect.width) / 2) * scale,
        width: rect.height * scale,
        height: rect.width * scale,
        transform: [{ rotate: "-90deg" }],
      }}
    >
      {children}
    </View>
  );
}

function BattleDefenseBox({
  value,
  active,
  frameIdentity,
  scale,
  onChange,
  onFocus,
}: {
  value: string;
  active: boolean;
  frameIdentity: ReturnType<typeof inferFrameIdentity>;
  scale: number;
  onChange: (value: string) => void;
  onFocus: () => void;
}) {
  return (
    <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
      <Image
        accessibilityIgnoresInvertColors
        source={getBattleDefenseBoxSource(frameIdentity)}
        resizeMode="stretch"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />
      {active ? (
        <TextInput
          accessibilityLabel="Defense"
          value={value}
          onChangeText={onChange}
          onFocus={onFocus}
          keyboardType="number-pad"
          maxLength={2}
          style={{
            width: "66%",
            color: "#f8f3e4",
            fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
            ...getWebSafeEditableTextMetrics(20 * scale, 24 * scale),
            textAlign: "center",
            padding: 0,
            backgroundColor: "transparent",
            textShadowColor: "rgba(0, 0, 0, 0.5)",
            textShadowOffset: { width: 0, height: 1 * scale },
            textShadowRadius: 1 * scale,
          }}
        />
      ) : (
        <Text
          selectable={false}
          style={{
            color: "#f8f3e4",
            fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
            fontSize: 20 * scale,
            lineHeight: 24 * scale,
            textShadowColor: "rgba(0, 0, 0, 0.5)",
            textShadowOffset: { width: 0, height: 1 * scale },
            textShadowRadius: 1 * scale,
          }}
        >
          {value}
        </Text>
      )}
    </View>
  );
}

function SagaArtSlot({
  artRect,
  artTransform,
  faceCard,
  scale,
  imageAspectRatio,
  active,
  generating,
  zone,
  onSectionPress,
  panHandlers,
}: {
  artRect: CoordinateRect;
  artTransform: ArtTransform;
  faceCard: CardDraft;
  scale: number;
  imageAspectRatio?: number | null;
  active: boolean;
  generating: boolean;
  zone: (section: CardSection, radius?: number) => Record<string, unknown>;
  onSectionPress: SectionPressHandler;
  panHandlers: ReturnType<typeof PanResponder.create>["panHandlers"];
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={faceCard.artUri ? "Edit Saga art" : "Select Saga art"}
      onPress={() => onSectionPress("art", { openSheet: true })}
      {...panHandlers}
      style={{
        ...rectStyle(artRect),
        overflow: "hidden",
        backgroundColor: "#171717",
        ...(active ? zone("art", 1) : {}),
      }}
    >
      {generating ? (
        <GeneratingArtAnimation scale={scale} colors={getFrameColors(faceCard)} />
      ) : faceCard.artUri ? (
        <TransformableArtImage
          uri={faceCard.artUri}
          artRect={artRect}
          renderScale={scale}
          artTransform={artTransform}
          imageAspectRatio={imageAspectRatio}
        />
      ) : (
        <LinearGradient
          colors={["#201618", "#4d2931", "#b89d5f"]}
          style={{
            flex: 1,
            justifyContent: "flex-end",
            padding: 14 * scale,
          }}
        >
          <View
            style={{
              height: "45%",
              backgroundColor: "rgba(245, 229, 180, 0.24)",
            }}
          />
        </LinearGradient>
      )}
    </Pressable>
  );
}

function SagaPaperLayer() {
  return (
    <View pointerEvents="none" style={rectStyle(SAGA_COORDINATES.paper)}>
      <Image
        accessibilityIgnoresInvertColors
        source={getMseM15SagaPaperSource()}
        resizeMode="stretch"
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
}

function SagaFrameFurniture({
  entries,
  frameIdentities,
  colorBlend,
  showStripe,
}: {
  entries: SagaChapterEntry[];
  frameIdentities: FrameIdentity[];
  colorBlend: MseM15ColorBlend | null;
  showStripe: boolean;
}) {
  const visualLayout = getSagaVisualLayout(entries);

  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}>
      {visualLayout.dividerYs.map((dividerY) => (
        <Image
          key={`saga-divider-${dividerY}`}
          accessibilityIgnoresInvertColors
          source={getMseM15SagaLineSource()}
          resizeMode="stretch"
          style={rectStyle({
            x: SAGA_COORDINATES.line.x,
            y: dividerY,
            width: SAGA_COORDINATES.line.width,
            height: SAGA_COORDINATES.line.height,
          })}
        />
      ))}
      <SagaBookmarkLayer frameIdentities={frameIdentities} colorBlend={colorBlend} showStripe={showStripe} />
      {visualLayout.chapterMarks.map((mark) => (
        <Image
          key={`saga-chapter-${mark.chapter}-${mark.y}`}
          accessibilityIgnoresInvertColors
          source={getMseM15SagaChapterSource(mark.chapter)}
          resizeMode="stretch"
          style={rectStyle({
            x: SAGA_COORDINATES.chapterIcon.x,
            y: mark.y,
            width: SAGA_COORDINATES.chapterIcon.width,
            height: SAGA_COORDINATES.chapterIcon.height,
          })}
        />
      ))}
    </View>
  );
}

function SagaBookmarkLayer({
  frameIdentities,
  colorBlend,
  showStripe,
}: {
  frameIdentities: FrameIdentity[];
  colorBlend: MseM15ColorBlend | null;
  showStripe: boolean;
}) {
  const identities = frameIdentities.length > 0 ? frameIdentities.slice(0, 3) : (["gold"] as FrameIdentity[]);

  if (colorBlend) {
    return (
      <>
        <Image
            accessibilityIgnoresInvertColors
            source={getMseM15SagaBookmarkSource("gold", colorBlend)}
            resizeMode="stretch"
            style={{
              ...rectStyle(SAGA_COORDINATES.bookmark),
              ...optionalTransformStyle(colorBlend.mirrorX ? [{ scaleX: -1 }] : null),
            }}
          />
        <View
          pointerEvents="none"
          style={{
            ...rectStyle(SAGA_COORDINATES.bookmark),
            backgroundColor: "rgba(0, 0, 0, 0.16)",
          }}
        />
        {showStripe ? (
          <Image
            accessibilityIgnoresInvertColors
            source={getMseM15SagaStripeSource()}
            resizeMode="stretch"
            style={rectStyle(SAGA_COORDINATES.bookmark)}
          />
        ) : null}
      </>
    );
  }

  if (identities.length === 1) {
    return (
      <>
        <Image
          accessibilityIgnoresInvertColors
          source={getMseM15SagaBookmarkSource(identities[0])}
          resizeMode="stretch"
          style={rectStyle(SAGA_COORDINATES.bookmark)}
        />
        {showStripe ? (
          <Image
            accessibilityIgnoresInvertColors
            source={getMseM15SagaStripeSource()}
            resizeMode="stretch"
            style={rectStyle(SAGA_COORDINATES.bookmark)}
          />
        ) : null}
      </>
    );
  }

  return (
    <View
      pointerEvents="none"
      style={{
        ...rectStyle(SAGA_COORDINATES.bookmark),
        flexDirection: "row",
        overflow: "hidden",
      }}
    >
      {identities.map((identity, index) => (
        <View
          key={`saga-bookmark-${identity}-${index}`}
          style={{
            width: `${100 / identities.length}%`,
            height: "100%",
            overflow: "hidden",
          }}
        >
          <Image
            accessibilityIgnoresInvertColors
            source={getMseM15SagaBookmarkSource(identity)}
            resizeMode="stretch"
            style={{
              position: "absolute",
              top: 0,
              left: `${-index * 100}%`,
              width: `${identities.length * 100}%`,
              height: "100%",
            }}
          />
        </View>
      ))}
      {showStripe ? (
        <Image
          accessibilityIgnoresInvertColors
          source={getMseM15SagaStripeSource()}
          resizeMode="stretch"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        />
      ) : null}
    </View>
  );
}

function SagaRulesPanel({
  active,
  faceCard,
  layout,
  scale,
  updateFace,
  onSectionPress,
  zone,
}: {
  active: boolean;
  faceCard: CardDraft;
  layout: SagaTextLayout;
  scale: number;
  updateFace: (patch: Partial<CardDraft>) => void;
  onSectionPress: SectionPressHandler;
  zone: (section: CardSection, radius?: number) => Record<string, unknown>;
}) {
  const visualLayout = getSagaVisualLayout(layout.entries);
  const textAreaRect = TYPE_FRAME_SECTION_RECTS.saga?.textArea ?? CARD_COORDINATES.textArea;
  const chapterEditorText = getSagaEditableChapterText(layout.entries);
  const editableChapterText = active
    ? getSagaEditableChapterTextFromRules(faceCard.rulesText, layout.reminderText, chapterEditorText)
    : chapterEditorText;

  return (
    <View pointerEvents="box-none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit Saga chapter text"
        onPress={() => onSectionPress("rules")}
        style={{
          ...rectStyle(textAreaRect),
          ...zone("rules", 3),
        }}
      >
        {active ? (
          <TextInput
            accessibilityLabel="Saga rules text"
            value={editableChapterText}
            onChangeText={(rulesText) =>
              updateFace({
                rulesText: mergeSagaReminderAndChapterText(
                  layout.reminderText,
                  normalizeSagaChapterBreaks(rulesText),
                ),
              })
            }
            onFocus={() => onSectionPress("rules")}
            placeholder={"I —\nII —\nIII —"}
            placeholderTextColor="rgba(24, 24, 20, 0.48)"
            multiline
            autoFocus
            blurOnSubmit={false}
            submitBehavior="newline"
            scrollEnabled={false}
            style={{
              position: "absolute",
              left: percent((SAGA_COORDINATES.chapterText.x - textAreaRect.x) / textAreaRect.width),
              top: percent((SAGA_COORDINATES.reminderDividerY - textAreaRect.y) / textAreaRect.height),
              width: percent(SAGA_COORDINATES.chapterText.width / textAreaRect.width),
              height: percent((437 - SAGA_COORDINATES.reminderDividerY) / textAreaRect.height),
              color: "#12120f",
              fontFamily: FULL_MAGIC_PACK.fontFamilies.body,
              ...getWebSafeEditableTextMetrics(12.8 * scale, 15.6 * scale),
              padding: 0,
              paddingTop: 3 * scale,
              paddingBottom: 3 * scale,
              overflow: "hidden",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              textAlignVertical: "top",
            }}
          />
        ) : null}
      </Pressable>
      <View pointerEvents="none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}>
        <View
          style={{
            ...rectStyle(SAGA_COORDINATES.reminderText),
            justifyContent: "center",
          }}
        >
          <Text
            selectable={false}
            style={{
              color: "#11110e",
              fontFamily: FULL_MAGIC_PACK.fontFamilies.italic,
              fontSize: getSagaReminderFontSize(layout.reminderText) * scale,
              lineHeight: getSagaReminderLineHeight(layout.reminderText) * scale,
            }}
          >
            {layout.reminderText}
          </Text>
        </View>
        {!active ? (
          <>
            {visualLayout.boxes.map((box, index) => {
              const entry = layout.entries[index];

              if (!entry) {
                return null;
              }

              const metrics = getSagaEntryTextMetrics(entry.text, box.height);
              return (
                <View
                  key={`saga-entry-${index}`}
                  pointerEvents="none"
                  style={{
                    ...rectStyle({
                      x: SAGA_COORDINATES.chapterText.x,
                      y: box.y,
                      width: SAGA_COORDINATES.chapterText.width,
                      height: box.height,
                    }),
                    justifyContent: "center",
                    overflow: "hidden",
                    paddingBottom: 3 * scale,
                    paddingTop: 3 * scale,
                  }}
                >
                  <SagaTextContent
                    value={entry.text}
                    color="#11110e"
                    fontFamily={FULL_MAGIC_PACK.fontFamilies.body}
                    fontSize={metrics.fontSize * scale}
                    lineHeight={metrics.lineHeight * scale}
                    symbolSize={metrics.fontSize * scale * 1.14}
                  />
                </View>
              );
            })}
          </>
        ) : null}
      </View>
    </View>
  );
}

function WatermarkLayer({
  card,
  rect,
  scale,
  coordinateSystem = "card",
}: {
  card: CardDraft;
  rect: CoordinateRect;
  scale: number;
  coordinateSystem?: "card" | "battle";
}) {
  const hasWatermark = Boolean(card.watermarkUri || card.watermarkPreset);

  if (!hasWatermark) {
    return null;
  }

  const opacity = clamp(card.watermarkOpacity ?? 0.16, 0.04, 0.34);
  const watermarkScale = clamp(card.watermarkScale ?? 1, 0.62, 1.6);
  const size = Math.min(rect.width * 0.72, rect.height * 0.95) * scale * watermarkScale;
  const absoluteStyle = coordinateSystem === "battle" ? battleRectStyle(rect) : rectStyle(rect);

  return (
    <View
      pointerEvents="none"
      style={{
        ...absoluteStyle,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        opacity,
      }}
    >
      {card.watermarkUri ? (
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: card.watermarkUri }}
          resizeMode="contain"
          style={{ width: size, height: size }}
        />
      ) : (
        <WatermarkSymbolMark presetId={card.watermarkPreset} size={size} />
      )}
    </View>
  );
}

function SagaTextContent({
  value,
  color,
  fontFamily,
  fontSize,
  lineHeight,
  symbolSize,
}: {
  value: string;
  color: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  symbolSize: number;
}) {
  if (/\{[^}]+\}/.test(value)) {
    return (
      <InlineSymbolText
        value={value}
        color={color}
        fontFamily={fontFamily}
        fontSize={fontSize}
        lineHeight={lineHeight}
        symbolSize={symbolSize}
      />
    );
  }

  return (
    <Text
      selectable={false}
      style={{
        width: "100%",
        color,
        fontFamily,
        fontSize,
        lineHeight,
      }}
    >
      {value}
    </Text>
  );
}

function InlineSymbolText({
  value,
  color,
  fontFamily,
  fontSize,
  lineHeight,
  symbolSize,
  symbolVariant = "modern",
}: {
  value: string;
  color: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  symbolSize: number;
  symbolVariant?: "modern" | "retro";
}) {
  if (!INLINE_MANA_SYMBOL_PATTERN.test(value) && !value.includes("\n")) {
    return (
      <Text
        selectable={false}
        style={{
          color,
          fontFamily,
          fontSize,
          lineHeight,
          textAlign: "left",
        }}
      >
        {value}
      </Text>
    );
  }

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      {tokenizeInlineSymbols(value).map((token, index) => {
        if (token.type === "newline") {
          return (
            <View
              key={`line-${index}`}
              style={{ width: "100%", height: token.blank ? lineHeight * 0.45 : 0 }}
            />
          );
        }

        if (token.type === "symbol") {
          return (
            <View
              key={`symbol-${token.value}-${index}`}
              style={{
                width: symbolSize,
                height: lineHeight,
                alignItems: "center",
                justifyContent: "center",
                marginHorizontal: fontSize * 0.06,
              }}
            >
              <ManaSymbol value={token.value} size={symbolSize} variant={symbolVariant} />
            </View>
          );
        }

        return (
          <Text
            key={`text-${index}`}
            selectable={false}
            style={{
              color,
              fontFamily,
              fontSize,
              lineHeight,
            }}
          >
            {token.value}
          </Text>
        );
      })}
    </View>
  );
}

const INLINE_MANA_SYMBOL_PATTERN = /\{[^}]+\}/;

function tokenizeInlineSymbols(value: string): Array<
  | { type: "text"; value: string }
  | { type: "symbol"; value: string }
  | { type: "newline"; value: string; blank?: boolean }
> {
  const tokens: Array<
    | { type: "text"; value: string }
    | { type: "symbol"; value: string }
    | { type: "newline"; value: string; blank?: boolean }
  > = [];
  const pattern = /(\{[^}]+\}|\n)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value)) !== null) {
    if (match.index > cursor) {
      pushTextTokens(tokens, value.slice(cursor, match.index));
    }

    const rawToken = match[0];

    if (rawToken === "\n") {
      tokens.push({ type: "newline", value: rawToken, blank: tokens[tokens.length - 1]?.type === "newline" });
    } else {
      const symbol = rawToken.slice(1, -1).trim();
      tokens.push(symbol ? { type: "symbol", value: symbol } : { type: "text", value: rawToken });
    }

    cursor = match.index + rawToken.length;
  }

  if (cursor < value.length) {
    pushTextTokens(tokens, value.slice(cursor));
  }

  return tokens;
}

function pushTextTokens(
  tokens: Array<
    | { type: "text"; value: string }
    | { type: "symbol"; value: string }
    | { type: "newline"; value: string; blank?: boolean }
  >,
  text: string,
) {
  const parts = text.match(/\S+\s*|\s+/g) ?? [];

  for (const part of parts) {
    tokens.push({ type: "text", value: part });
  }
}

function TypeLineAutocompleteMenu({
  suggestions,
  scale,
  onSelect,
}: {
  suggestions: TypeLineAutocompleteSuggestion[];
  scale: number;
  onSelect: (suggestion: TypeLineAutocompleteSuggestion) => void;
}) {
  return (
    <View
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        width: Math.max(150, 188 * scale),
        marginTop: 4 * scale,
        borderRadius: 7,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: "rgba(28, 31, 36, 0.28)",
        backgroundColor: "#fff8e5",
        boxShadow: "0 8px 18px rgba(0, 0, 0, 0.24)",
        overflow: "hidden",
        zIndex: 70,
      }}
    >
      {suggestions.map((suggestion) => (
        <Pressable
          key={`${suggestion.category}-${suggestion.value}`}
          accessibilityRole="button"
          accessibilityLabel={`Autocomplete ${suggestion.value}`}
          onPressIn={() => onSelect(suggestion)}
          onPress={() => onSelect(suggestion)}
          style={{
            minHeight: Math.max(28, 30 * scale),
            paddingHorizontal: 8 * scale,
            alignItems: "center",
            flexDirection: "row",
            gap: 8 * scale,
          }}
        >
          <Text
            selectable={false}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            style={{
              flex: 1,
              color: "#181b20",
              fontSize: Math.max(11, 12 * scale),
              lineHeight: Math.max(13, 14 * scale),
              fontWeight: "900",
            }}
          >
            {suggestion.value}
          </Text>
          <Text
            selectable={false}
            numberOfLines={1}
            style={{
              color: "rgba(24, 27, 32, 0.62)",
              fontSize: Math.max(8, 9 * scale),
              fontWeight: "800",
              textTransform: "uppercase",
            }}
          >
            {getAutocompleteCategoryLabel(suggestion)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function getAutocompleteCategoryLabel(suggestion: TypeLineAutocompleteSuggestion): string {
  switch (suggestion.category) {
    case "supertype":
      return "Super";
    case "cardType":
      return "Type";
    case "subtype":
    default:
      return suggestion.detail ?? "Subtype";
  }
}

function TypeLineEditorButton({
  scale,
  ink,
  onPress,
}: {
  scale: number;
  ink: string;
  onPress: () => void;
}) {
  const buttonSize = Math.max(16, 18 * scale);
  const iconSize = Math.max(10, 12 * scale);

  return (
    <View
      style={{
        position: "relative",
        width: buttonSize,
        height: buttonSize,
        marginRight: 3 * scale,
        zIndex: 2,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open type editor"
        hitSlop={4}
        onPress={onPress}
        style={{
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: "rgba(20, 22, 24, 0.42)",
          backgroundColor: "rgba(255, 250, 234, 0.9)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Pencil size={iconSize} color={ink} strokeWidth={2.8} />
      </Pressable>
    </View>
  );
}

function getTextInputSelectionStart(event: unknown): number | null {
  const nativeSelectionStart = (
    event as {
      nativeEvent?: { selection?: { start?: unknown } };
    }
  ).nativeEvent?.selection?.start;

  if (typeof nativeSelectionStart === "number") {
    return nativeSelectionStart;
  }

  const targetSelectionStart = (
    event as {
      target?: { selectionStart?: unknown };
      currentTarget?: { selectionStart?: unknown };
    }
  ).target?.selectionStart;

  if (typeof targetSelectionStart === "number") {
    return targetSelectionStart;
  }

  const currentTargetSelectionStart = (
    event as {
      currentTarget?: { selectionStart?: unknown };
    }
  ).currentTarget?.selectionStart;

  return typeof currentTargetSelectionStart === "number" ? currentTargetSelectionStart : null;
}

type StableFrameImageResizeMode = "stretch" | "contain" | "cover";
const STABLE_FRAME_SOURCE_CACHE_LIMIT = 96;
const STABLE_FRAME_SLOT_CACHE_LIMIT = 48;
const stableFrameSourceCache = new Map<string, ImageSourcePropType>();
const stableFrameSlotCache = new Map<string, ImageSourcePropType>();

function setBoundedStableFrameCacheEntry(
  cache: Map<string, ImageSourcePropType>,
  key: string,
  source: ImageSourcePropType,
  limit: number,
) {
  if (cache.has(key)) {
    cache.delete(key);
  }

  cache.set(key, source);

  while (cache.size > limit) {
    const oldestKey = cache.keys().next().value;

    if (typeof oldestKey !== "string") {
      break;
    }

    cache.delete(oldestKey);
  }
}

function getStableFrameSourceKey(source: ImageSourcePropType): string {
  if (Array.isArray(source)) {
    return source.map(getStableFrameSourceKey).join(",");
  }

  if (typeof source === "number") {
    return String(source);
  }

  if (source && typeof source === "object" && "uri" in source && source.uri) {
    return source.uri;
  }

  return JSON.stringify(source);
}

function getStableFrameCacheKey(cacheKey: string, source: ImageSourcePropType): string {
  return `${cacheKey}:${getStableFrameSourceKey(source)}`;
}

function rememberStableFrameSource(cacheKey: string, source: ImageSourcePropType) {
  setBoundedStableFrameCacheEntry(
    stableFrameSourceCache,
    getStableFrameCacheKey(cacheKey, source),
    source,
    STABLE_FRAME_SOURCE_CACHE_LIMIT,
  );
}

function rememberStableFrameSlot(cacheKey: string, source: ImageSourcePropType) {
  setBoundedStableFrameCacheEntry(stableFrameSlotCache, cacheKey, source, STABLE_FRAME_SLOT_CACHE_LIMIT);
}

function getStableFrameFallbackCacheKeys(cacheKey: string, fill: boolean): string[] {
  if (!fill) {
    return [];
  }

  if (cacheKey.startsWith("showcase-underlay-")) {
    return ["showcase-underlay"];
  }

  if (cacheKey.startsWith("mainframe-standard-")) {
    return ["mainframe-standard"];
  }

  if (cacheKey.startsWith("showcase-")) {
    return ["showcase", "mainframe-standard"];
  }

  if (cacheKey.startsWith("typeframe-")) {
    return ["typeframe"];
  }

  if (cacheKey.startsWith("split-fuse-bridge-")) {
    return ["split-fuse-bridge"];
  }

  if (cacheKey.startsWith("split-")) {
    return ["split-frame"];
  }

  if (cacheKey.startsWith("aftermath-")) {
    return ["aftermath-frame"];
  }

  if (cacheKey.startsWith("godzilla-alias-")) {
    return ["godzilla-alias"];
  }

  return [];
}

function getStableFrameFallbackSource(cacheKey: string, fill: boolean): ImageSourcePropType | null {
  for (const fallbackKey of getStableFrameFallbackCacheKeys(cacheKey, fill)) {
    const fallbackSource = stableFrameSlotCache.get(fallbackKey);

    if (fallbackSource) {
      return fallbackSource;
    }
  }

  return null;
}

function getStableFrameInitialSource(
  cacheKey: string,
  sourceCacheKey: string,
  source: ImageSourcePropType,
  fill: boolean,
): ImageSourcePropType {
  return (
    stableFrameSourceCache.get(sourceCacheKey) ??
    stableFrameSlotCache.get(cacheKey) ??
    getStableFrameFallbackSource(cacheKey, fill) ??
    source
  );
}

function StableFrameImage({
  source,
  cacheKey = "default-frame",
  fill = true,
  containerStyle,
  imageStyle,
  mirrorX = false,
  resizeMode = "stretch",
}: {
  source: ImageSourcePropType;
  cacheKey?: string;
  fill?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  mirrorX?: boolean;
  resizeMode?: StableFrameImageResizeMode;
}) {
  const sourceCacheKey = getStableFrameCacheKey(cacheKey, source);
  const [visibleSource, setVisibleSource] = useState(() =>
    getStableFrameInitialSource(cacheKey, sourceCacheKey, source, fill),
  );
  const [pendingSource, setPendingSource] = useState<ImageSourcePropType | null>(null);
  const hasPendingSource = pendingSource !== null && pendingSource !== visibleSource;

  useEffect(() => {
    const cachedSource = stableFrameSourceCache.get(sourceCacheKey);

    if (cachedSource) {
      setVisibleSource(cachedSource);
      setPendingSource(null);
    } else if (source !== visibleSource) {
      setPendingSource(source);
    } else {
      setPendingSource(null);
    }
  }, [source, sourceCacheKey, visibleSource]);

  const rememberLoadedSource = (loadedSource: ImageSourcePropType) => {
    rememberStableFrameSource(cacheKey, loadedSource);
    rememberStableFrameSlot(cacheKey, loadedSource);

    for (const fallbackKey of getStableFrameFallbackCacheKeys(cacheKey, fill)) {
      rememberStableFrameSlot(fallbackKey, loadedSource);
    }
  };
  const handleVisibleImageError = () => {
    const fallbackSource = getStableFrameFallbackSource(cacheKey, fill);

    if (fallbackSource && fallbackSource !== visibleSource) {
      setVisibleSource(fallbackSource);
      setPendingSource(source);
    }
  };
  const fillViewStyle: ViewStyle | undefined = fill
    ? {
        position: "absolute" as const,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }
    : undefined;
  const fillImageStyle: ImageStyle | undefined = fill
    ? {
        position: "absolute" as const,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }
    : undefined;

  return (
    <View
      pointerEvents="none"
      style={[fillViewStyle, optionalTransformStyle(mirrorX ? [{ scaleX: -1 }] : null), containerStyle]}
    >
      <Image
        accessibilityIgnoresInvertColors
        source={visibleSource}
        resizeMode={resizeMode}
        onLoad={() => rememberLoadedSource(visibleSource)}
        onError={handleVisibleImageError}
        style={[fillImageStyle, imageStyle]}
      />
      {hasPendingSource ? (
        <Image
          accessibilityIgnoresInvertColors
          source={pendingSource}
          resizeMode={resizeMode}
          onLoad={() => {
            rememberLoadedSource(pendingSource);
            setVisibleSource(pendingSource);
            setPendingSource(null);
          }}
          onError={() => setPendingSource(null)}
          style={[fillImageStyle, imageStyle, { opacity: 0.001 }]}
        />
      ) : null}
    </View>
  );
}

function ShowcaseMaskedArt({
  artUri,
  artRect,
  artTransform,
  imageAspectRatio,
  spec,
  cacheKey,
}: {
  artUri?: string;
  artRect: CoordinateRect;
  artTransform: ArtTransform;
  imageAspectRatio?: number | null;
  spec: ShowcaseFrameSpec;
  cacheKey: string;
}) {
  if (!spec.artMask && !spec.artFilter && !spec.artOverlay) {
    return null;
  }

  const maskId = `${cacheKey}-mask`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const clipId = `${cacheKey}-clip`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const gradientId = `${cacheKey}-placeholder`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const filterId = `${cacheKey}-art-filter`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const grayscaleFilter = spec.artFilter === "grayscale" ? `url(#${filterId})` : undefined;
  const maskRect =
    spec.artMask?.coordinateSpace === "card"
      ? { x: 0, y: 0, width: CARD_COORDINATES.width, height: CARD_COORDINATES.height }
      : artRect;
  const maskBoundsHeight =
    spec.artMask?.coordinateSpace === "card" && spec.artMask.clipHeight
      ? (spec.artMask.clipHeight / spec.designHeight) * CARD_COORDINATES.height
      : maskRect.height;
  const centerX = artRect.x + artRect.width / 2;
  const centerY = artRect.y + artRect.height / 2;
  const fittedLayout = getCoverFittedImageLayout(
    artRect.width,
    artRect.height,
    imageAspectRatio,
  );
  const artTransformSvg = [
    `translate(${artTransform.offsetX} ${artTransform.offsetY})`,
    `translate(${centerX} ${centerY})`,
    `scale(${artTransform.scale})`,
    `translate(${-centerX} ${-centerY})`,
  ].join(" ");

  return (
    <Svg
      pointerEvents="none"
      width="100%"
      height="100%"
      viewBox={`0 0 ${CARD_COORDINATES.width} ${CARD_COORDINATES.height}`}
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <Defs>
        {spec.artMask ? (
          <Mask
            id={maskId}
            x="0"
            y="0"
            width={CARD_COORDINATES.width}
            height={maskBoundsHeight}
            maskUnits="userSpaceOnUse"
          >
            <SvgImage
              href={spec.artMask.source as never}
              x={maskRect.x}
              y={maskRect.y}
              width={maskRect.width}
              height={maskRect.height}
              preserveAspectRatio="none"
            />
          </Mask>
        ) : (
          <ClipPath id={clipId}>
            <Rect
              x={artRect.x}
              y={artRect.y}
              width={artRect.width}
              height={artRect.height}
            />
          </ClipPath>
        )}
        <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#24332f" />
          <Stop offset="0.55" stopColor="#78915e" />
          <Stop offset="1" stopColor="#d4bf86" />
        </SvgLinearGradient>
        {spec.artFilter === "grayscale" ? (
          <Filter
            id={filterId}
            x="0"
            y="0"
            width={CARD_COORDINATES.width}
            height={CARD_COORDINATES.height}
            filterUnits="userSpaceOnUse"
          >
            <FeColorMatrix
              type="matrix"
              values={[
                0.2126, 0.7152, 0.0722, 0, 0,
                0.2126, 0.7152, 0.0722, 0, 0,
                0.2126, 0.7152, 0.0722, 0, 0,
                0, 0, 0, 1, 0,
              ]}
            />
          </Filter>
        ) : null}
      </Defs>
      <G
        mask={spec.artMask ? `url(#${maskId})` : undefined}
        clipPath={spec.artMask ? undefined : `url(#${clipId})`}
        filter={grayscaleFilter}
      >
        {artUri ? (
          <G transform={artTransformSvg}>
            <SvgImage
              href={{ uri: artUri } as never}
              x={artRect.x + fittedLayout.left}
              y={artRect.y + fittedLayout.top}
              width={fittedLayout.width}
              height={fittedLayout.height}
              preserveAspectRatio="none"
            />
          </G>
        ) : (
          <Rect
            x={artRect.x}
            y={artRect.y}
            width={artRect.width}
            height={artRect.height}
            fill={`url(#${gradientId})`}
          />
        )}
        {spec.artOverlay ? (
          <SvgImage
            href={spec.artOverlay.source as never}
            x={0}
            y={0}
            width={CARD_COORDINATES.width}
            height={CARD_COORDINATES.height}
            opacity={spec.artOverlay.opacity}
            preserveAspectRatio="none"
          />
        ) : null}
      </G>
    </Svg>
  );
}

function ShowcaseStampTreatmentLayer({
  source,
  frameIdentity,
  spec,
  cacheKey,
  stamped,
}: {
  source: ImageSourcePropType;
  frameIdentity: FrameIdentity;
  spec: ShowcaseFrameSpec | null;
  cacheKey: string;
  stamped: boolean;
}) {
  const rimSource = stamped
    ? spec?.stampRimSources?.[frameIdentity]
    : spec?.nonStampRimSources?.[frameIdentity];

  if (!spec || (!rimSource && (!stamped || !spec.stampBorderMask))) {
    return null;
  }

  const stampBorderMaskId = `${cacheKey}-stamp-border-mask`.replace(/[^a-zA-Z0-9_-]/g, "-");

  return (
    <>
      {stamped && spec.stampBorderMask ? (
        <Svg
          pointerEvents="none"
          width="100%"
          height="100%"
          viewBox={`0 0 ${spec.designWidth} ${spec.designHeight}`}
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          }}
        >
          <Defs>
            <Mask
              id={stampBorderMaskId}
              x="0"
              y="0"
              width={spec.designWidth}
              height={spec.designHeight}
              maskUnits="userSpaceOnUse"
            >
              <SvgImage
                href={spec.stampBorderMask as never}
                x={0}
                y={0}
                width={spec.designWidth}
                height={spec.designHeight}
                preserveAspectRatio="none"
              />
            </Mask>
          </Defs>
          <SvgImage
            href={source as never}
            x={0}
            y={0}
            width={spec.designWidth}
            height={spec.designHeight}
            preserveAspectRatio="none"
            mask={`url(#${stampBorderMaskId})`}
          />
        </Svg>
      ) : null}
      {rimSource ? (
        <StableFrameImage
          cacheKey={`${cacheKey}-stamp-rim-${frameIdentity}-${stamped ? "stamped" : "unstamped"}`}
          source={rimSource}
          resizeMode="stretch"
        />
      ) : null}
    </>
  );
}

function ShowcaseOverlayMaskLayers({
  spec,
  cacheKey,
}: {
  spec: ShowcaseFrameSpec;
  cacheKey: string;
}) {
  if (!spec.overlayMasks?.length) {
    return null;
  }

  return (
    <Svg
      pointerEvents="none"
      width="100%"
      height="100%"
      viewBox={`0 0 ${spec.designWidth} ${spec.designHeight}`}
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <Defs>
        {spec.overlayMasks.map((overlayMask, index) => {
          const maskId = `${cacheKey}-overlay-mask-${index}`.replace(/[^a-zA-Z0-9_-]/g, "-");

          return (
            <Mask
              key={maskId}
              id={maskId}
              x="0"
              y="0"
              width={spec.designWidth}
              height={spec.designHeight}
              maskUnits="userSpaceOnUse"
            >
              <SvgImage
                href={overlayMask.source as never}
                x={0}
                y={0}
                width={spec.designWidth}
                height={spec.designHeight}
                preserveAspectRatio="none"
              />
            </Mask>
          );
        })}
      </Defs>
      {spec.overlayMasks.map((overlayMask, index) => (
        <Rect
          key={`${cacheKey}-overlay-${index}`}
          x={0}
          y={0}
          width={spec.designWidth}
          height={spec.designHeight}
          fill={overlayMask.fill}
          opacity={overlayMask.opacity}
          mask={`url(#${`${cacheKey}-overlay-mask-${index}`.replace(/[^a-zA-Z0-9_-]/g, "-")})`}
        />
      ))}
    </Svg>
  );
}

function ShowcaseFrameImage({
  source,
  spec,
  cacheKey,
}: {
  source: ImageSourcePropType;
  spec: ShowcaseFrameSpec | null;
  cacheKey: string;
}) {
  const frameMasks = spec?.frameMasks ?? (spec?.frameMask ? [spec.frameMask] : []);

  if (!spec || frameMasks.length === 0) {
    return <StableFrameImage cacheKey={cacheKey} source={source} resizeMode="stretch" />;
  }

  return (
    <Svg
      pointerEvents="none"
      width="100%"
      height="100%"
      viewBox={`0 0 ${spec.designWidth} ${spec.designHeight}`}
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <Defs>
        {frameMasks.map((frameMask, index) => {
          const maskId = getSvgMaskId(cacheKey, index);

          return (
            <Mask
              key={maskId}
              id={maskId}
              x="0"
              y="0"
              width={spec.designWidth}
              height={spec.designHeight}
              maskUnits="userSpaceOnUse"
            >
              <SvgImage
                href={frameMask as never}
                x="0"
                y="0"
                width={spec.designWidth}
                height={spec.designHeight}
                preserveAspectRatio="none"
              />
            </Mask>
          );
        })}
      </Defs>
      {frameMasks.map((_, index) => (
        <SvgImage
          key={`${cacheKey}-frame-layer-${index}`}
          href={source as never}
          x="0"
          y="0"
          width={spec.designWidth}
          height={spec.designHeight}
          preserveAspectRatio="none"
          mask={`url(#${getSvgMaskId(cacheKey, index)})`}
        />
      ))}
    </Svg>
  );
}

function getSvgMaskId(cacheKey: string, index: number): string {
  return `${cacheKey}-mask-${index}`.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function MseFrameImage({
  source,
  cacheKey,
  mirrorX = false,
}: {
  source: ImageSourcePropType;
  cacheKey: string;
  mirrorX?: boolean;
}) {
  return <StableFrameImage cacheKey={cacheKey} source={source} mirrorX={mirrorX} resizeMode="stretch" />;
}

function MseSplitFrameImage({
  sources,
  cacheKey,
  mirrorX = false,
}: {
  sources: SplitFrameSources;
  cacheKey: string;
  mirrorX?: boolean;
}) {
  const maskId = `${cacheKey}-right-frame-blend-mask`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const gradientId = `${cacheKey}-right-frame-blend-gradient`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const imageTransform = mirrorX ? `translate(${CARD_COORDINATES.width} 0) scale(-1 1)` : undefined;

  return (
    <Svg
      pointerEvents="none"
      width="100%"
      height="100%"
      viewBox={`0 0 ${CARD_COORDINATES.width} ${CARD_COORDINATES.height}`}
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <Defs>
        <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="black" stopOpacity="0" />
          <Stop offset="0.34" stopColor="black" stopOpacity="0" />
          <Stop offset="0.66" stopColor="white" stopOpacity="1" />
          <Stop offset="1" stopColor="white" stopOpacity="1" />
        </SvgLinearGradient>
        <Mask
          id={maskId}
          x="0"
          y="0"
          width={CARD_COORDINATES.width}
          height={CARD_COORDINATES.height}
          maskUnits="userSpaceOnUse"
        >
          <Rect
            x="0"
            y="0"
            width={CARD_COORDINATES.width}
            height={CARD_COORDINATES.height}
            fill={`url(#${gradientId})`}
          />
        </Mask>
      </Defs>
      <SvgImage
        href={sources.left as never}
        x="0"
        y="0"
        width={CARD_COORDINATES.width}
        height={CARD_COORDINATES.height}
        preserveAspectRatio="none"
        transform={imageTransform}
      />
      <SvgImage
        href={sources.right as never}
        x="0"
        y="0"
        width={CARD_COORDINATES.width}
        height={CARD_COORDINATES.height}
        preserveAspectRatio="none"
        mask={`url(#${maskId})`}
        transform={imageTransform}
      />
    </Svg>
  );
}

function MseArtifactMainframeBlendOverlay({
  colorSource,
  cacheKey,
  mirrorX = false,
}: {
  colorSource: ImageSourcePropType;
  cacheKey: string;
  mirrorX?: boolean;
}) {
  const sourceSize = MSE_M15_ARTIFACT_MAINFRAME_BLEND_MASK_SIZE;
  const maskSource = getMseM15ArtifactMainframeBlendMaskSource();
  const maskId = `${cacheKey}-artifact-mainframe-mask`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const imageTransform = mirrorX ? `translate(${sourceSize.width} 0) scale(-1 1)` : undefined;

  return (
    <Svg
      pointerEvents="none"
      width="100%"
      height="100%"
      viewBox={`0 0 ${sourceSize.width} ${sourceSize.height}`}
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <Defs>
        <Mask
          id={maskId}
          x="0"
          y="0"
          width={sourceSize.width}
          height={sourceSize.height}
          maskUnits="userSpaceOnUse"
          maskType="luminance"
        >
          <SvgImage
            href={maskSource as never}
            x="0"
            y="0"
            width={sourceSize.width}
            height={sourceSize.height}
            preserveAspectRatio="none"
          />
        </Mask>
      </Defs>
      <G mask={`url(#${maskId})`} transform={imageTransform}>
        <SvgImage
          href={colorSource as never}
          x="0"
          y="0"
          width={sourceSize.width}
          height={sourceSize.height}
          preserveAspectRatio="none"
        />
      </G>
    </Svg>
  );
}

function MseTextureLayer({
  source,
  sourceSize,
  targetRect,
  scale,
  cacheKey,
}: {
  source: ImageSourcePropType;
  sourceSize: { width: number; height: number };
  targetRect: CoordinateRect;
  scale: number;
  cacheKey: string;
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        ...rectStyle(targetRect),
        overflow: "hidden",
      }}
    >
      <StableFrameImage
        cacheKey={cacheKey}
        source={source}
        fill={false}
        resizeMode="stretch"
        containerStyle={{ width: sourceSize.width * scale, height: sourceSize.height * scale }}
        imageStyle={{ width: sourceSize.width * scale, height: sourceSize.height * scale }}
      />
    </View>
  );
}

function FutureFrameBlendTextureLayer({
  colors,
  hybrid,
  texture,
  scale,
  cacheKey,
}: {
  colors: [ManaColor, ManaColor];
  hybrid: boolean;
  texture: "typeline" | "textbox";
  scale: number;
  cacheKey: string;
}) {
  const [leadingColor, trailingColor] = colors;
  const sourceSize = texture === "typeline"
    ? MSE_M15_TYPELINE_TEXTURE_SIZE
    : MSE_M15_FUTURE_TEXTBOX_TEXTURE_SIZE;
  const targetRect = texture === "typeline"
    ? FUTURESHIFTED_TYPELINE_LAYER_RECT
    : FUTURESHIFTED_TEXTBOX_LAYER_RECT;
  const leadingSource = texture === "typeline"
    ? getMseM15TypeLineTextureSource(getFrameIdentityForManaColor(leadingColor))
    : getMseM15FutureTextboxTextureSource(getFrameIdentityForManaColor(leadingColor));
  const trailingSource = texture === "typeline"
    ? getMseM15TypeLineTextureSource(getFrameIdentityForManaColor(trailingColor))
    : getMseM15FutureTextboxTextureSource(getFrameIdentityForManaColor(trailingColor));
  const blendMaskSource = texture === "typeline"
    ? getMseM15FutureTypeLineBlendMaskSource(hybrid)
    : getMseM15FutureTextboxBlendMaskSource(hybrid);
  const blendMaskId = `${cacheKey}-mask`.replace(/[^a-zA-Z0-9_-]/g, "-");

  return (
    <View
      pointerEvents="none"
      style={{
        ...rectStyle(targetRect),
        overflow: "hidden",
      }}
    >
      <Svg
        width={sourceSize.width * scale}
        height={sourceSize.height * scale}
        viewBox={`0 0 ${sourceSize.width} ${sourceSize.height}`}
        preserveAspectRatio="none"
      >
        <Defs>
          <Mask
            id={blendMaskId}
            x="0"
            y="0"
            width={sourceSize.width}
            height={sourceSize.height}
            maskUnits="userSpaceOnUse"
          >
            <SvgImage
              href={blendMaskSource as never}
              x="0"
              y="0"
              width={sourceSize.width}
              height={sourceSize.height}
              preserveAspectRatio="none"
            />
          </Mask>
        </Defs>
        <SvgImage
          href={leadingSource as never}
          x="0"
          y="0"
          width={sourceSize.width}
          height={sourceSize.height}
          preserveAspectRatio="none"
        />
        <SvgImage
          href={trailingSource as never}
          x="0"
          y="0"
          width={sourceSize.width}
          height={sourceSize.height}
          preserveAspectRatio="none"
          mask={`url(#${blendMaskId})`}
        />
      </Svg>
    </View>
  );
}

function FutureFrameMulticolorUnderlay({
  baseSource,
  blendMaskSource,
  colors,
  cacheKey,
}: {
  baseSource: ImageSourcePropType;
  blendMaskSource: ImageSourcePropType;
  colors: [ManaColor, ManaColor];
  cacheKey: string;
}) {
  const colorFadeGradientId = `${cacheKey}-color-fade`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const colorFadeMaskId = `${cacheKey}-color-fade-mask`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const goldDetailMaskId = `${cacheKey}-gold-detail-mask`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const [leadingColor, trailingColor] = colors;
  const leadingSource = getMseM15FutureCardColorSource(leadingColor);
  const trailingSource = getMseM15FutureCardColorSource(trailingColor);

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${CARD_COORDINATES.width} ${CARD_COORDINATES.height}`}
        preserveAspectRatio="none"
      >
        <Defs>
          <SvgLinearGradient id={colorFadeGradientId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <Stop offset="0.44" stopColor="#ffffff" stopOpacity="0.08" />
            <Stop offset="0.56" stopColor="#ffffff" stopOpacity="0.92" />
            <Stop offset="1" stopColor="#ffffff" stopOpacity="1" />
          </SvgLinearGradient>
          <Mask
            id={colorFadeMaskId}
            x="0"
            y="0"
            width={CARD_COORDINATES.width}
            height={CARD_COORDINATES.height}
            maskUnits="userSpaceOnUse"
          >
            <Rect
              x="0"
              y="0"
              width={CARD_COORDINATES.width}
              height={CARD_COORDINATES.height}
              fill={`url(#${colorFadeGradientId})`}
            />
          </Mask>
          <Mask
            id={goldDetailMaskId}
            x="0"
            y="0"
            width={CARD_COORDINATES.width}
            height={CARD_COORDINATES.height}
            maskUnits="userSpaceOnUse"
          >
            <SvgImage
              href={blendMaskSource as never}
              x="0"
              y="0"
              width={CARD_COORDINATES.width}
              height={CARD_COORDINATES.height}
              preserveAspectRatio="none"
            />
          </Mask>
        </Defs>
        <SvgImage
          href={leadingSource as never}
          x="0"
          y="0"
          width={CARD_COORDINATES.width}
          height={CARD_COORDINATES.height}
          preserveAspectRatio="none"
        />
        <SvgImage
          href={trailingSource as never}
          x="0"
          y="0"
          width={CARD_COORDINATES.width}
          height={CARD_COORDINATES.height}
          preserveAspectRatio="none"
          mask={`url(#${colorFadeMaskId})`}
        />
        <SvgImage
          href={baseSource as never}
          x="0"
          y="0"
          width={CARD_COORDINATES.width}
          height={CARD_COORDINATES.height}
          preserveAspectRatio="none"
          mask={`url(#${goldDetailMaskId})`}
        />
      </Svg>
    </View>
  );
}

function MseOverlayLayerView({ cacheKey, layer }: { cacheKey: string; layer: MseM15OverlayLayer }) {
  const gradientStrips = isGradientOverlayLayer(layer) ? buildGradientOverlayStrips(layer.sources) : [];

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      {isGradientOverlayLayer(layer) ? (
        <>
          {gradientStrips.map((strip, index) => (
            <OverlayStripImage
              key={`gradient-strip-${index}`}
              cacheKey={`${cacheKey}-gradient-${strip.stripIndex}`}
              source={strip.source}
              stripIndex={strip.stripIndex}
              stripCount={GRADIENT_OVERLAY_STRIP_COUNT}
              opacity={strip.opacity}
            />
          ))}
        </>
      ) : isSplitOverlayLayer(layer) ? (
        <>
          <View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: "50%",
              overflow: "hidden",
            }}
          >
            <StableFrameImage
              cacheKey={`${cacheKey}-split-left`}
              source={layer.left}
              resizeMode="contain"
              imageStyle={{
                width: "200%",
                height: "100%",
              }}
            />
          </View>
          <View
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: "50%",
              overflow: "hidden",
            }}
          >
            <StableFrameImage
              cacheKey={`${cacheKey}-split-right`}
              source={layer.right}
              resizeMode="contain"
              imageStyle={{
                position: "absolute",
                right: 0,
                width: "200%",
                height: "100%",
              }}
            />
          </View>
        </>
      ) : (
        <StableFrameImage
          cacheKey={`${cacheKey}-single`}
          source={layer}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

function isSplitOverlayLayer(layer: MseM15OverlayLayer): layer is Extract<MseM15OverlayLayer, { kind: "split" }> {
  return typeof layer === "object" && layer !== null && "kind" in layer && layer.kind === "split";
}

function isGradientOverlayLayer(layer: MseM15OverlayLayer): layer is Extract<MseM15OverlayLayer, { kind: "gradient" }> {
  return typeof layer === "object" && layer !== null && "kind" in layer && layer.kind === "gradient";
}

const GRADIENT_OVERLAY_STRIP_COUNT = 48;
const GRADIENT_OVERLAY_TRANSITION_FRACTION = 0.2;

function buildGradientOverlayStrips(sources: ImageSourcePropType[]) {
  const uniqueSources = sources.filter(Boolean);

  if (uniqueSources.length <= 1) {
    return uniqueSources.map((source) => ({ source, stripIndex: 0, opacity: 1 }));
  }

  return Array.from({ length: GRADIENT_OVERLAY_STRIP_COUNT }, (_, index) => {
    const position = (index + 0.5) / GRADIENT_OVERLAY_STRIP_COUNT;
    const scaledPosition = position * (uniqueSources.length - 1);
    const sourceIndex = Math.min(Math.floor(scaledPosition), uniqueSources.length - 2);
    const localMix = scaledPosition - sourceIndex;
    const transitionStart = 0.5 - GRADIENT_OVERLAY_TRANSITION_FRACTION / 2;
    const transitionEnd = 0.5 + GRADIENT_OVERLAY_TRANSITION_FRACTION / 2;

    if (localMix <= transitionStart) {
      return [{ source: uniqueSources[sourceIndex], stripIndex: index, opacity: 1 }];
    }

    if (localMix >= transitionEnd) {
      return [{ source: uniqueSources[sourceIndex + 1], stripIndex: index, opacity: 1 }];
    }

    return [
      { source: uniqueSources[sourceIndex], stripIndex: index, opacity: 1 },
      {
        source: uniqueSources[sourceIndex + 1],
        stripIndex: index,
        opacity: (localMix - transitionStart) / GRADIENT_OVERLAY_TRANSITION_FRACTION,
      },
    ];
  }).flat();
}

function OverlayStripImage({
  cacheKey,
  source,
  stripIndex,
  stripCount,
  opacity,
}: {
  cacheKey: string;
  source: ImageSourcePropType;
  stripIndex: number;
  stripCount: number;
  opacity: number;
}) {
  const stripWidth = 100 / stripCount;

  return (
    <StableFrameImage
      cacheKey={cacheKey}
      source={source}
      resizeMode="stretch"
      fill={false}
      containerStyle={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: `${stripIndex * stripWidth}%`,
        width: `${stripWidth + 0.12}%`,
        overflow: "hidden",
        opacity,
      }}
      imageStyle={{
        position: "absolute",
        top: 0,
        left: `${-stripIndex * 100}%`,
        width: `${stripCount * 100}%`,
        height: "100%",
      }}
    />
  );
}

function getTypeFrameFrameSource(
  typeFrame: TypeFrame,
  frameIdentity: FrameIdentity,
  colorBlend?: MseM15ColorBlend | null,
  card?: CardDraft,
  tokenFrameVariant: TokenFrameVariant = "normal",
): ImageSourcePropType {
  if (typeFrame === "saga") {
    return getMseM15TypeFrameSource("saga", frameIdentity, colorBlend);
  }

  if (typeFrame === "token") {
    return getTokenFrameSource(frameIdentity, tokenFrameVariant);
  }

  if (typeFrame === "dfc") {
    const variant =
      card && isDfcBackFace(card) && getDfcMode(card) !== "modal"
        ? "dfcBack"
        : card && !isDfcBackFace(card) && getDfcMode(card) === "transform"
        ? "dfcNotched"
        : "dfcNormal";

    return getMseM15MainframeSource(frameIdentity, variant, colorBlend);
  }

  if (typeFrame === "adventure") {
    return getAdventureFrameSource(frameIdentity);
  }

  if (typeFrame === "planeswalker") {
    return getMseM15TypeFrameSource("planeswalker", frameIdentity);
  }

  return getTypeFrameOverlaySource(typeFrame);
}

function FrameTreatmentArtOverlay({
  treatment,
  faceCard,
  artTransform,
  scale,
}: {
  treatment: FrameTreatment;
  faceCard: CardDraft;
  artTransform: ArtTransform;
  scale: number;
}) {
  const rect = FRAME_TREATMENT_ART_RECTS[treatment];

  return (
    <View pointerEvents="none" style={{ ...rectStyle(rect), overflow: "hidden" }}>
      {faceCard.artUri ? (
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: faceCard.artUri }}
          resizeMode="cover"
          style={{
            width: "100%",
            height: "100%",
            transform: [
              { translateX: artTransform.offsetX * scale },
              { translateY: artTransform.offsetY * scale },
              { scale: artTransform.scale },
            ],
          }}
        />
      ) : (
        <LinearGradient
          colors={["#24332f", "#78915e", "#d4bf86"]}
          style={{
            flex: 1,
            justifyContent: "flex-end",
            padding: 14 * scale,
          }}
        >
          <View
            style={{
              height: "42%",
              borderTopLeftRadius: 999,
              borderTopRightRadius: 999,
              backgroundColor: "rgba(255, 244, 205, 0.32)",
            }}
          />
        </LinearGradient>
      )}
    </View>
  );
}

function shouldDrawTreatmentArtOverFrame(treatment: FrameTreatment): boolean {
  return treatment === "retro";
}

function supportsFrameEffectOverlays(typeFrame: TypeFrame): boolean {
  return (
    typeFrame === "standard" ||
    typeFrame === "token" ||
    typeFrame === "dfc" ||
    typeFrame === "adventure"
  );
}

function shouldUseMseM15ColorBlend(card: CardDraft, frameColors: ManaColor[]): boolean {
  if (getManualFrameColors(card).length > 0) {
    return frameColors.length > 1;
  }

  return (!card.frameSelection || card.frameSelection === "auto") && frameColors.length > 1;
}

function shouldShowDfcColorIndicator(typeFrame: TypeFrame, card: CardDraft): boolean {
  return typeFrame === "dfc" && isDfcBackFace(card) && getDfcMode(card) !== "modal";
}

function getTreatmentArtRect(treatment: FrameTreatment): CoordinateRect {
  return FRAME_TREATMENT_ART_RECTS[treatment] ?? CARD_COORDINATES.art;
}

function getArtRect(
  typeFrame: TypeFrame,
  treatment: FrameTreatment,
  showcaseSpec?: ShowcaseFrameSpec | null,
): CoordinateRect {
  if (typeFrame === "standard" && treatment === "showcase" && showcaseSpec) {
    return scaleShowcaseRect(showcaseSpec.artRect, showcaseSpec);
  }

  return TYPE_FRAME_SECTION_RECTS[typeFrame]?.art ?? getTreatmentArtRect(treatment);
}

export function getVisibleArtRectForCard(card: CardDraft): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const selectedTypeFrame = card.typeFrame ?? "standard";
  const isBattleBackFace = selectedTypeFrame === "battle" && isDfcBackFace(card);
  const isBattleFrontFace = selectedTypeFrame === "battle" && !isBattleBackFace;

  if (isBattleFrontFace) {
    return BATTLE_COORDINATES.art;
  }

  if (selectedTypeFrame === "split" || selectedTypeFrame === "fuse") {
    return SPLIT_HALF_COORDINATES.art;
  }

  if (selectedTypeFrame === "aftermath") {
    return AFTERMATH_COORDINATES.topArt;
  }

  const isDfcBack = selectedTypeFrame === "dfc" && isDfcBackFace(card);
  const typeFrame = isBattleBackFace || isDfcBack ? "standard" : selectedTypeFrame;
  const treatment = isDfcBack ? card.backFrameTreatment ?? "standard" : card.frameTreatment ?? "standard";
  const showcaseFrame = isDfcBack
    ? card.backShowcaseFrame ?? DEFAULT_SHOWCASE_FRAME
    : card.showcaseFrame ?? DEFAULT_SHOWCASE_FRAME;
  const showcaseSpec =
    typeFrame === "standard" && treatment === "showcase"
      ? getShowcaseFrameSpec(showcaseFrame)
      : null;

  return getArtRect(typeFrame, treatment, showcaseSpec);
}

export function getVisibleArtAspectRatioForCard(card: CardDraft) {
  const rect = getVisibleArtRectForCard(card);

  return rect.width / rect.height;
}

function scaleShowcaseRect(
  rect: CoordinateRect,
  spec: Pick<ShowcaseFrameSpec, "designWidth" | "designHeight">,
): CoordinateRect {
  const scaleX = CARD_COORDINATES.width / spec.designWidth;
  const scaleY = CARD_COORDINATES.height / spec.designHeight;

  return {
    x: rect.x * scaleX,
    y: rect.y * scaleY,
    width: rect.width * scaleX,
    height: rect.height * scaleY,
  };
}

function getTreatmentHeaderInk(treatment: FrameTreatment, frameIdentity: FrameIdentity): string | null {
  if (treatment === "retro") {
    return "#f8f2df";
  }

  if (treatment === "borderless" || treatment === "etchedFoil") {
    return "#f8f2df";
  }

  if (treatment === "fullArt" || treatment === "showcase") {
    return frameIdentity === "white" || frameIdentity === "artifact" ? "#15120f" : "#f7f0dc";
  }

  if (treatment === "extendedArt" || treatment === "textless") {
    return "#15120f";
  }

  return null;
}

function getTreatmentBodyInk(treatment: FrameTreatment): string | null {
  if (treatment === "retro") {
    return "#050505";
  }

  if (treatment === "borderless") {
    return "#f8f2df";
  }

  if (treatment === "fullArt" || treatment === "extendedArt" || treatment === "showcase" || treatment === "etchedFoil") {
    return "#f8f2df";
  }

  return null;
}

function getCardTextColorOverride(preset?: CardTextColorPreset): string | null {
  switch (preset) {
    case "black":
      return "#171512";
    case "white":
      return "#f8f2df";
    default:
      return null;
  }
}

function isCardSecurityStamped(card: CardDraft): boolean {
  return card.rarity === "rare" || card.rarity === "mythic" || card.frameTreatment === "promo";
}

function getMutedInk(ink: string): string {
  return ink === "#15120f" ? "rgba(21, 18, 15, 0.52)" : "rgba(248, 242, 223, 0.64)";
}

function getTextAreaRect(typeFrame: TypeFrame): CoordinateRect {
  return TYPE_FRAME_SECTION_RECTS[typeFrame]?.textArea ?? CARD_COORDINATES.textArea;
}

function getWatermarkRect(typeFrame: TypeFrame, rulesLayout: RulesFlavorLayout): CoordinateRect {
  if (typeFrame === "saga") {
    return {
      x: SAGA_COORDINATES.chapterText.x,
      y: SAGA_COORDINATES.reminderDividerY,
      width: SAGA_COORDINATES.chapterText.width,
      height: 437 - SAGA_COORDINATES.reminderDividerY,
    };
  }

  if (rulesLayout.showDivider) {
    const top = rulesLayout.rulesRect.y;
    const bottom = rulesLayout.flavorRect.y + rulesLayout.flavorRect.height;

    return {
      ...rulesLayout.rulesRect,
      y: top,
      height: bottom - top,
    };
  }

  if (rulesLayout.showFlavor) {
    return rulesLayout.flavorRect;
  }

  return rulesLayout.rulesRect;
}

function getTypeLineRect(typeFrame: TypeFrame, showColorIndicator = false): CoordinateRect {
  const rect = TYPE_FRAME_SECTION_RECTS[typeFrame]?.typeLine ?? CARD_COORDINATES.typeLine;

  if (showColorIndicator) {
    return insetTypeLineRectForDfcColorIndicator(rect);
  }

  return rect;
}

function insetTypeLineRectForDfcColorIndicator(rect: CoordinateRect): CoordinateRect {
  const colorIndicatorRight = DFC_COLOR_INDICATOR_RECT.x + DFC_COLOR_INDICATOR_RECT.width;
  const leadingInset = Math.max(0, colorIndicatorRight + 5 - rect.x);

  return {
    ...rect,
    x: rect.x + leadingInset,
    width: Math.max(0, rect.width - leadingInset),
  };
}

function getTokenFrameVariant(rulesText: string, flavorText: string): TokenFrameVariant {
  return rulesText.trim().length > 0 || flavorText.trim().length > 0 ? "normal" : "textless";
}

function getTokenTypeLineRect(variant: TokenFrameVariant): CoordinateRect {
  if (variant === "textless") {
    return { x: 32, y: 430, width: 267, height: 20 };
  }

  return TYPE_FRAME_SECTION_RECTS.token?.typeLine ?? CARD_COORDINATES.typeLine;
}

function getTokenSetSymbolRect(variant: TokenFrameVariant): CoordinateRect {
  if (variant === "textless") {
    return { x: 300, y: 432, width: 44, height: 22 };
  }

  return TYPE_FRAME_SECTION_RECTS.token?.setSymbol ?? CARD_COORDINATES.setSymbol;
}

function getNameRect(typeFrame: TypeFrame, card?: CardDraft): CoordinateRect {
  if (typeFrame === "dfc") {
    if (card && isDfcBackFace(card) && getDfcMode(card) === "transform") {
      return { ...CARD_COORDINATES.name, x: 32, width: 279 };
    }

    return { ...CARD_COORDINATES.name, x: 58, width: 251 };
  }

  if (typeFrame === "token") {
    return { ...CARD_COORDINATES.name, x: 30, y: 26, width: 315, height: 28 };
  }

  return CARD_COORDINATES.name;
}

function getRulesFlavorDividerRect(typeFrame: TypeFrame): CoordinateRect {
  return TYPE_FRAME_SECTION_RECTS[typeFrame]?.rulesFlavorDivider ?? CARD_COORDINATES.rulesFlavorDivider;
}

function getSetSymbolRect(typeFrame: TypeFrame): CoordinateRect {
  return TYPE_FRAME_SECTION_RECTS[typeFrame]?.setSymbol ?? CARD_COORDINATES.setSymbol;
}

function getPtBoxRect(typeFrame: TypeFrame): CoordinateRect {
  if (typeFrame === "token") {
    return { x: 273, y: 466, width: 81, height: 42 };
  }

  if (typeFrame === "adventure") {
    return { x: 286, y: 469, width: 60, height: 28 };
  }

  return CARD_COORDINATES.ptBox;
}

function getPowerToughnessRect(typeFrame: TypeFrame): CoordinateRect {
  const ptBox = getPtBoxRect(typeFrame);

  if (typeFrame === "token") {
    return { x: 286, y: 469, width: 60, height: 28 };
  }

  if (typeFrame === "adventure") {
    return { x: 295, y: ptBox.y + 3, width: 42, height: 20 };
  }

  return {
    ...CARD_COORDINATES.powerToughness,
    y:
      ptBox.y +
      (ptBox.height - CARD_COORDINATES.powerToughness.height) / 2 +
      POWER_TOUGHNESS_TEXT_OFFSET_Y,
  };
}

function getBackFacePowerToughnessRect(typeFrame: TypeFrame): CoordinateRect {
  const ptBox = getPtBoxRect(typeFrame);

  return {
    x: ptBox.x + 28,
    y: ptBox.y - 21,
    width: 42,
    height: 16,
  };
}

function getBackFacePowerToughnessText(
  card: CardDraft,
  frontHasPowerToughnessBox: boolean,
): string | null {
  if ((card.typeFrame ?? "standard") !== "dfc") {
    return null;
  }

  if (isDfcBackFace(card) || getDfcMode(card) === "modal" || !frontHasPowerToughnessBox) {
    return null;
  }

  const backFace = getEditableCardFace({ ...card, dfcFace: "back" });

  if (!hasPowerToughnessBox(backFace)) {
    return null;
  }

  const backPower = backFace.power.trim();
  const backToughness = backFace.toughness.trim();

  if (!backPower || !backToughness) {
    return null;
  }

  return `${backPower}/${backToughness}`;
}

function getAdventureDefaults(card: CardDraft): {
  name: string;
  manaCost: string;
  typeLine: string;
  rulesText: string;
} {
  return {
    name: card.adventureName?.trim() || "Swift Errand",
    manaCost: card.adventureManaCost?.trim() || "{1}{G}",
    typeLine: card.adventureTypeLine?.trim() || "Sorcery — Adventure",
    rulesText:
      card.adventureRulesText?.trim() ||
      "Create a 1/1 green Elf creature token.",
  };
}

function parseSagaText(rulesText: string): SagaTextLayout {
  const lines = rulesText
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd());
  let rawReminderText = DEFAULT_SAGA_REMINDER;

  if (lines[0]?.trim().startsWith("(")) {
    rawReminderText = lines.shift()?.trim() ?? DEFAULT_SAGA_REMINDER;
  }

  const entries: SagaChapterEntry[] = [];

  for (const line of lines) {
    const normalizedLine = line.trim();
    const match = SAGA_CHAPTER_PREFIX_PATTERN.exec(normalizedLine);

    if (match) {
      entries.push({
        chapters: parseSagaChapterList(match[1]),
        text: normalizedLine.slice(match[0].length).trim(),
      });
      continue;
    }

    const previousEntry = entries[entries.length - 1];

    if (previousEntry) {
      previousEntry.text = previousEntry.text ? `${previousEntry.text}\n${normalizedLine}` : normalizedLine;
    } else {
      entries.push({
        chapters: [1],
        text: normalizedLine,
      });
    }
  }

  if (entries.length === 0) {
    const defaultEntries = [
      { chapters: [1], text: "" },
      { chapters: [2], text: "" },
      { chapters: [3], text: "" },
    ];

    return {
      reminderText: getSagaReminderText(rawReminderText, getLastSagaChapter(defaultEntries)),
      entries: defaultEntries,
    };
  }

  const meaningfulEntries = getMeaningfulSagaEntries(entries);
  const displayedEntries = getDisplaySagaEntries(entries);

  return {
    reminderText: getSagaReminderText(rawReminderText, getLastSagaChapter(meaningfulEntries)),
    entries: displayedEntries,
  };
}

function parseSagaChapterList(value: string): number[] {
  const chapters = value
    .toUpperCase()
    .match(SAGA_CHAPTER_TOKEN_PATTERN)
    ?.map(romanToSagaChapter)
    .filter((chapter): chapter is number => chapter >= 1 && chapter <= 6) ?? [];
  const uniqueChapters = chapters.filter(
    (chapter, index) => chapters.indexOf(chapter) === index,
  );

  return uniqueChapters.length > 0 ? uniqueChapters : [1];
}

function getDisplaySagaEntries(entries: SagaChapterEntry[]): SagaChapterEntry[] {
  return getMeaningfulSagaEntries(entries).slice(0, 6);
}

function getMeaningfulSagaEntries(entries: SagaChapterEntry[]): SagaChapterEntry[] {
  const nonEmptyEntries = entries.filter((entry) => entry.text.trim().length > 0);

  return nonEmptyEntries.length > 0 ? nonEmptyEntries : entries;
}

function getSagaEditableChapterText(entries: SagaChapterEntry[]): string {
  return entries
    .map((entry) => `${entry.chapters.map(sagaChapterToRoman).join(", ")} — ${entry.text}`.trimEnd())
    .join("\n");
}

function getSagaEditableChapterTextFromRules(
  rulesText: string,
  reminderText: string,
  fallbackText: string,
): string {
  const normalizedRulesText = rulesText.replace(/\r\n?/g, "\n");

  if (!normalizedRulesText) {
    return fallbackText;
  }

  const lines = normalizedRulesText.split("\n");
  const firstLine = lines[0]?.trim();

  if (firstLine && firstLine === reminderText.trim()) {
    return lines.slice(1).join("\n");
  }

  if (firstLine?.startsWith("(")) {
    return ensureSagaChapterPrefix(lines.slice(1).join("\n"), fallbackText);
  }

  return ensureSagaChapterPrefix(normalizedRulesText, fallbackText);
}

function ensureSagaChapterPrefix(chapterText: string, fallbackText: string): string {
  const normalizedChapterText = chapterText.replace(/\r\n?/g, "\n");
  const trimmedChapterText = normalizedChapterText.trim();

  if (!trimmedChapterText) {
    return fallbackText;
  }

  if (SAGA_CHAPTER_PREFIX_PATTERN.test(trimmedChapterText)) {
    return normalizedChapterText;
  }

  return `I — ${normalizedChapterText}`;
}

function mergeSagaReminderAndChapterText(reminderText: string, chapterText: string): string {
  const trimmedReminder = reminderText.trim() || DEFAULT_SAGA_REMINDER;
  const normalizedChapterText = chapterText.replace(/\r\n?/g, "\n");
  const nextLayout = parseSagaText(`${trimmedReminder}\n${normalizedChapterText}`);
  const nextReminderText = getSagaReminderText(trimmedReminder, getLastSagaChapter(nextLayout.entries));

  return normalizedChapterText.length > 0 ? `${nextReminderText}\n${normalizedChapterText}` : nextReminderText;
}

function getLastSagaChapter(entries: SagaChapterEntry[]): number {
  return Math.max(3, ...entries.flatMap((entry) => entry.chapters));
}

function getSagaReminderText(reminderText: string, lastChapter: number): string {
  const chapter = sagaChapterToRoman(lastChapter);
  const source = reminderText.trim() || DEFAULT_SAGA_REMINDER;
  const sacrificePattern = /Sacrifice after\s+[IVXLC]+\s*\.?/i;

  if (sacrificePattern.test(source)) {
    return source.replace(sacrificePattern, `Sacrifice after ${chapter}.`);
  }

  if (source.startsWith("(") && source.endsWith(")")) {
    const reminderBody = source.slice(1, -1).trim();
    const separator = reminderBody.endsWith(".") ? " " : ". ";

    return `(${reminderBody}${separator}Sacrifice after ${chapter}.)`;
  }

  const separator = source.endsWith(".") ? " " : ". ";

  return `${source}${separator}Sacrifice after ${chapter}.`;
}

function sagaChapterToRoman(chapter: number): string {
  switch (chapter) {
    case 1:
      return "I";
    case 2:
      return "II";
    case 3:
      return "III";
    case 4:
      return "IV";
    case 5:
      return "V";
    case 6:
      return "VI";
    default:
      return chapter > 6 ? "VI" : "I";
  }
}

function romanToSagaChapter(value: string): number {
  switch (value.toUpperCase()) {
    case "I":
      return 1;
    case "II":
      return 2;
    case "III":
      return 3;
    case "IV":
      return 4;
    case "V":
      return 5;
    case "VI":
      return 6;
    default:
      return 0;
  }
}

function getSagaVisualLayout(entries: SagaChapterEntry[]): {
  boxes: Array<{ y: number; height: number }>;
  chapterMarks: Array<{ chapter: number; y: number }>;
  dividerYs: number[];
} {
  const entryCount = clamp(entries.length || 3, 1, 6);
  const boxes = getSagaTextBoxes(entries, entryCount);
  const dividerYs = [SAGA_COORDINATES.reminderDividerY, ...boxes.slice(1).map((box) => box.y)];
  const chapterMarks = entries.slice(0, entryCount).flatMap((entry, entryIndex) => {
    const box = boxes[entryIndex] ?? boxes[0];
    const iconGap = 6;
    const iconHeight = SAGA_COORDINATES.chapterIcon.height;
    const marks = entry.chapters.slice(0, 3);
    const totalHeight = marks.length * iconHeight + Math.max(0, marks.length - 1) * iconGap;
    const sectionCenterY = box.y + box.height / 2;
    const startY = sectionCenterY - totalHeight / 2;

    return marks.map((chapter, chapterIndex) => ({
      chapter,
      y: Math.round(startY + chapterIndex * (iconHeight + iconGap)),
    }));
  });

  return { boxes, chapterMarks, dividerYs };
}

function getSagaTextBoxes(
  entries: SagaChapterEntry[],
  entryCount: number,
): Array<{ y: number; height: number }> {
  const textTop = SAGA_COORDINATES.reminderDividerY;
  const textBottom = 437;
  const availableHeight = textBottom - textTop;
  const minHeight = entryCount >= 6 ? 34 : entryCount >= 5 ? 40 : entryCount >= 4 ? 48 : 62;
  const desiredHeights = Array.from({ length: entryCount }, (_, index) => {
    const text = entries[index]?.text ?? "";
    const lineCount = estimateWrappedLineCount(text, 24);

    return Math.max(minHeight, lineCount * 15.4 + 8);
  });
  const minTotal = minHeight * entryCount;
  const flexibleHeight = Math.max(0, availableHeight - minTotal);
  const desiredFlexibleTotal = desiredHeights.reduce(
    (total, height) => total + Math.max(0, height - minHeight),
    0,
  );
  const baseHeights =
    desiredFlexibleTotal > flexibleHeight
      ? desiredHeights.map(
          (height) =>
            minHeight + Math.max(0, height - minHeight) * (flexibleHeight / desiredFlexibleTotal),
        )
      : desiredHeights.map(
          (height) =>
            height +
            (availableHeight - desiredHeights.reduce((total, desiredHeight) => total + desiredHeight, 0)) /
              entryCount,
        );
  let cursorY = textTop;

  return baseHeights.map((height, index) => {
    const roundedHeight =
      index === entryCount - 1 ? textBottom - cursorY : Math.round(Math.max(minHeight, height));
    const box = { y: cursorY, height: roundedHeight };

    cursorY += roundedHeight;

    return box;
  });
}

function getSagaBookmarkIdentities(
  manaColors: ReturnType<typeof getManaColors>,
  fallbackIdentity: FrameIdentity,
): FrameIdentity[] {
  const colorToFrameIdentity = {
    W: "white",
    U: "blue",
    B: "black",
    R: "red",
    G: "green",
  } satisfies Record<string, FrameIdentity>;

  if (manaColors.length === 1 || manaColors.length === 2) {
    return manaColors
      .map((color) => colorToFrameIdentity[color])
      .filter((identity, index, identities) => identities.indexOf(identity) === index);
  }

  if (manaColors.length > 2) {
    return ["gold"];
  }

  return [fallbackIdentity];
}

function getSagaReminderFontSize(text: string): number {
  const lines = estimateWrappedLineCount(text, 27);

  if (lines >= 5) {
    return 11.4;
  }

  if (lines >= 4) {
    return 12.3;
  }

  return 12.9;
}

function getSagaReminderLineHeight(text: string): number {
  return getSagaReminderFontSize(text) * 1.14;
}

function getSagaEntryTextMetrics(text: string, height: number): {
  fontSize: number;
  lineHeight: number;
} {
  const baseFontSize = 13;
  const baseLineHeight = 15.9;
  const lineCount = estimateWrappedLineCount(text, 24);
  const neededHeight = lineCount * baseLineHeight + 6;
  const textScale = getTextScale(neededHeight, Math.max(25, height - 6));
  const fontSize = baseFontSize * textScale;

  return {
    fontSize,
    lineHeight: baseLineHeight * textScale,
  };
}

function rectStyle(rect: CoordinateRect) {
  return {
    position: "absolute" as const,
    left: percent(rect.x / CARD_COORDINATES.width),
    top: percent(rect.y / CARD_COORDINATES.height),
    width: percent(rect.width / CARD_COORDINATES.width),
    height: percent(rect.height / CARD_COORDINATES.height),
  };
}

function expandCoordinateRect(
  rect: CoordinateRect,
  left: number,
  top: number,
  right: number,
  bottom: number,
): CoordinateRect {
  return {
    x: rect.x - left,
    y: rect.y - top,
    width: rect.width + left + right,
    height: rect.height + top + bottom,
  };
}

function battleRectStyle(rect: CoordinateRect) {
  return {
    position: "absolute" as const,
    left: percent(rect.x / BATTLE_COORDINATES.width),
    top: percent(rect.y / BATTLE_COORDINATES.height),
    width: percent(rect.width / BATTLE_COORDINATES.width),
    height: percent(rect.height / BATTLE_COORDINATES.height),
  };
}

function planeswalkerRectStyle(rect: CoordinateRect) {
  return {
    position: "absolute" as const,
    left: percent(rect.x / PLANESWALKER_COORDINATES.width),
    top: percent(rect.y / PLANESWALKER_COORDINATES.height),
    width: percent(rect.width / PLANESWALKER_COORDINATES.width),
    height: percent(rect.height / PLANESWALKER_COORDINATES.height),
  };
}

function getManaCostLayout(
  symbolCount: number,
  defaultRect: CoordinateRect = CARD_COORDINATES.manaCost,
  symbolSize = 22,
  gap = 1.5,
): ManaCostLayout {
  if (symbolCount <= 0) {
    return {
      rect: { ...defaultRect },
      symbolSize,
      gap,
    };
  }

  const rightEdge = defaultRect.x + defaultRect.width;
  const width = symbolCount * symbolSize + (symbolCount - 1) * gap;

  return {
    rect: {
      ...defaultRect,
      x: rightEdge - width,
      width,
    },
    symbolSize,
    gap,
  };
}

function getPlaneswalkerManaCostLayout(symbolCount: number): ManaCostLayout {
  const defaultRect = PLANESWALKER_COORDINATES.manaCost;
  const gap = 3;

  if (symbolCount <= 0) {
    return {
      rect: { ...defaultRect },
      symbolSize: 44,
      gap,
    };
  }

  const rightEdge = defaultRect.x + defaultRect.width;
  const symbolSize = 44;
  const width = symbolCount * symbolSize + (symbolCount - 1) * gap;

  return {
    rect: {
      ...defaultRect,
      x: rightEdge - width,
      width,
    },
    symbolSize,
    gap,
  };
}

function getPlaneswalkerAbilityRows(count: number): Array<{
  row: CoordinateRect;
  cost: CoordinateRect;
  text: CoordinateRect;
}> {
  const rowCount = Math.max(1, count);
  const gap = rowCount >= 4 ? 3 : 6;
  const rowHeight =
    (PLANESWALKER_COORDINATES.loyaltyArea.height - gap * (rowCount - 1)) / rowCount;

  return Array.from({ length: count }, (_, index) => {
    const y =
      PLANESWALKER_COORDINATES.loyaltyArea.y +
      index * (rowHeight + gap);
    const row = {
      x: PLANESWALKER_COORDINATES.loyaltyArea.x,
      y,
      width: PLANESWALKER_COORDINATES.loyaltyArea.width,
      height: rowHeight,
    };
    const costHeight = Math.max(
      26,
      Math.min(PLANESWALKER_COORDINATES.loyaltyCost.height, rowHeight - 8),
    );
    const cost = {
      x: PLANESWALKER_COORDINATES.loyaltyCost.x,
      y: y + Math.max(0, (rowHeight - costHeight) / 2),
      width: PLANESWALKER_COORDINATES.loyaltyCost.width,
      height: costHeight,
    };
    const text = {
      x: PLANESWALKER_COORDINATES.loyaltyText.x,
      y: y + 8,
      width: PLANESWALKER_COORDINATES.loyaltyText.width,
      height: Math.max(28, rowHeight - 16),
    };

    return { row, cost, text };
  });
}

function getPlaneswalkerAbilityTextMetrics(text: string, height: number): {
  fontSize: number;
  lineHeight: number;
} {
  const baseFontSize = 25;
  const baseLineHeight = 31;
  const lineCount = estimateWrappedLineCount(text || "Loyalty ability", 48);
  const neededHeight = lineCount * baseLineHeight + 6;
  const textScale = getTextScale(neededHeight, Math.max(26, height - 6));
  const fontSize = baseFontSize * textScale;

  return {
    fontSize,
    lineHeight: baseLineHeight * textScale,
  };
}

function getPlaneswalkerLoyaltyCostSource(cost: string): ImageSourcePropType {
  const normalizedCost = cost.trim();

  if (normalizedCost.startsWith("+")) {
    return FULL_MAGIC_PACK.planeswalkerLoyalty.up;
  }

  if (normalizedCost.startsWith("-") || normalizedCost.startsWith("−")) {
    return FULL_MAGIC_PACK.planeswalkerLoyalty.down;
  }

  return FULL_MAGIC_PACK.planeswalkerLoyalty.zero;
}

function getTitleLayout(
  name: string,
  baseCardName: string,
  manaRect: CoordinateRect,
  baseRect: CoordinateRect = CARD_COORDINATES.name,
  baseFontSize = 18,
): TitleLayout {
  const titleGap = 8;
  const width = clamp(manaRect.x - baseRect.x - titleGap, 24, baseRect.width);
  const rect = {
    ...baseRect,
    width,
  };
  const availableWidth = Math.max(1, rect.width - 2);
  const hasBaseCardName = baseCardName.trim().length > 0;
  const titleBaseFontSize = hasBaseCardName ? baseFontSize * 0.74 : baseFontSize;
  const baseNameBaseFontSize = hasBaseCardName ? baseFontSize * 0.47 : 0;
  const textWidth = Math.max(
    estimateSingleLineTextWidth(name || "Untitled", titleBaseFontSize),
    hasBaseCardName ? estimateSingleLineTextWidth(baseCardName, baseNameBaseFontSize) : 0,
  );
  const fitScale = clamp(availableWidth / textWidth, 0.3, 1);
  const fontSize = titleBaseFontSize * fitScale;
  const baseNameFontSize = baseNameBaseFontSize * fitScale;

  return {
    rect,
    fontSize,
    lineHeight: hasBaseCardName
      ? clamp(fontSize * 1.05, baseFontSize * 0.45, baseFontSize * 0.78)
      : clamp(fontSize * 1.16, baseFontSize * 0.53, baseFontSize * 1.17),
    baseNameFontSize,
    baseNameLineHeight: hasBaseCardName
      ? clamp(baseNameFontSize * 1.12, baseFontSize * 0.3, baseFontSize * 0.52)
      : 0,
  };
}

function getManaCostEditorFontSize(manaCost: string, width: number, baseFontSize = 13): number {
  const availableWidth = Math.max(1, width - 2);
  const textWidth = estimateSingleLineTextWidth(manaCost || "{G}", baseFontSize);
  return baseFontSize * clamp(availableWidth / textWidth, 0.62, 1);
}

function getTypeLineFontSize(typeLine: string, width: number, baseFontSize = 14): number {
  const availableWidth = Math.max(1, width - 3);
  const textWidth = estimateSingleLineTextWidth(typeLine || "Card Type", baseFontSize);

  return baseFontSize * clamp(availableWidth / textWidth, 0.58, 1);
}

function getTypeLineEditorReserve(isEditing: boolean, scale: number): number {
  if (!isEditing) {
    return 0;
  }

  const buttonWidth = Math.max(16, 18 * scale) / Math.max(scale, 0.001);
  return buttonWidth + 3;
}

function getTypeLineSetSymbolInset(typeLineRect: CoordinateRect, setSymbolRect: CoordinateRect): number {
  const typeBottom = typeLineRect.y + typeLineRect.height;
  const symbolBottom = setSymbolRect.y + setSymbolRect.height;
  const verticallyOverlaps = typeLineRect.y < symbolBottom && typeBottom > setSymbolRect.y;

  if (!verticallyOverlaps) {
    return 0;
  }

  const typeRight = typeLineRect.x + typeLineRect.width;
  const symbolOverlap = typeRight - setSymbolRect.x;

  return Math.max(0, symbolOverlap + 5);
}

function getBattleNameFontSize(name: string, baseCardName = ""): number {
  const baseFontSize = baseCardName.trim() ? 12.5 : 16;
  const textWidth = estimateSingleLineTextWidth(name || "Invasion", baseFontSize);
  return baseFontSize * clamp(350 / textWidth, 0.68, 1);
}

function getBattleRulesFontSize(rulesText: string, flavorText: string): number {
  const lineCount = estimateWrappedLineCount(rulesText, 48) + estimateWrappedLineCount(flavorText, 52);

  if (lineCount >= 8) {
    return 10.5;
  }

  if (lineCount >= 6) {
    return 12;
  }

  return 14;
}

function estimateSingleLineTextWidth(text: string, fontSize: number): number {
  return text.trim().split("").reduce((width, character) => {
    if (character === " ") {
      return width + fontSize * 0.28;
    }

    if ("MW@#%&".includes(character)) {
      return width + fontSize * 0.8;
    }

    if ("ilI1.,'|".includes(character)) {
      return width + fontSize * 0.28;
    }

    if (character === character.toUpperCase() && character !== character.toLowerCase()) {
      return width + fontSize * 0.62;
    }

    return width + fontSize * 0.5;
  }, 0);
}

function getRulesFlavorLayout(
  card: CardDraft,
  showPowerToughness: boolean,
  typeFrame: TypeFrame,
  reserveBackFacePowerToughness = false,
  treatmentLayout?: FrameTreatmentLayout | null,
  useRetroTypography = false,
): RulesFlavorLayout {
  const textArea = treatmentLayout?.textArea ?? getTextAreaRect(typeFrame);
  const dividerRect = treatmentLayout?.rulesFlavorDivider ?? getRulesFlavorDividerRect(typeFrame);
  const ptBox = treatmentLayout?.ptBox ?? getPtBoxRect(typeFrame);
  const footer = treatmentLayout?.footer ?? CARD_COORDINATES.footer;
  const reservedBottomInset = reserveBackFacePowerToughness ? 18 : 0;
  const bottomLimit = typeFrame === "saga"
    ? textArea.y + textArea.height
    : showPowerToughness
      ? ptBox.y + 4 - reservedBottomInset
      : footer.y - 18;
  const areaHeight = Math.max(64, Math.min(textArea.y + textArea.height, bottomLimit) - textArea.y);
  const areaRect = { ...textArea, height: areaHeight };
  const hasRules = card.rulesText.trim().length > 0;
  const hasFlavor = card.flavorText.trim().length > 0;
  const showDivider = hasRules && hasFlavor;
  const baseRulesFontSize = useRetroTypography ? 14 : 12.8;
  const baseRulesLineHeight = useRetroTypography ? 16.8 : 16.2;
  const baseFlavorFontSize = useRetroTypography ? 14 : 12.4;
  const baseFlavorLineHeight = useRetroTypography ? 16.8 : 15.8;
  const charsPerLine = Math.max(18, Math.floor(textArea.width / 6.15));
  const rulesLineCount = estimateWrappedLineCount(card.rulesText, charsPerLine);
  const flavorLineCount = estimateWrappedLineCount(card.flavorText, charsPerLine);
  const neededRulesHeight = Math.max(1, rulesLineCount) * baseRulesLineHeight + 2;
  const neededFlavorHeight = Math.max(1, flavorLineCount) * baseFlavorLineHeight + 2;

  if (showDivider) {
    const dividerHeight = 2;
    const dividerGap = 7;
    const usableHeight = Math.max(48, areaHeight - dividerHeight - dividerGap * 2);
    const minRulesHeight = baseRulesLineHeight + 2;
    const minFlavorHeight = baseFlavorLineHeight + 2;
    let rulesHeight: number;
    let flavorHeight: number;

    if (neededRulesHeight + neededFlavorHeight <= usableHeight) {
      rulesHeight = Math.max(minRulesHeight, neededRulesHeight);
      flavorHeight = Math.max(minFlavorHeight, neededFlavorHeight);
    } else {
      const ratio = neededRulesHeight / (neededRulesHeight + neededFlavorHeight);
      rulesHeight = clamp(
        usableHeight * ratio,
        minRulesHeight,
        usableHeight - minFlavorHeight,
      );
      flavorHeight = usableHeight - rulesHeight;
    }

    const usedHeight = rulesHeight + dividerGap + dividerHeight + dividerGap + flavorHeight;
    const y = areaRect.y + Math.max(0, (areaHeight - usedHeight) / 2);
    const dividerY = y + rulesHeight + dividerGap;
    const rulesScale = getTextScale(neededRulesHeight, rulesHeight);
    const flavorScale = getTextScale(neededFlavorHeight, flavorHeight);

    return {
      showRules: true,
      showFlavor: true,
      showDivider: true,
      rulesRect: { ...areaRect, y, height: rulesHeight },
      flavorRect: {
        ...areaRect,
        y: dividerY + dividerHeight + dividerGap,
        height: flavorHeight,
      },
      dividerRect: {
        x: dividerRect.x,
        y: dividerY,
        width: dividerRect.width,
        height: dividerHeight,
      },
      rulesFontSize: baseRulesFontSize * rulesScale,
      rulesLineHeight: baseRulesLineHeight * rulesScale,
      flavorFontSize: baseFlavorFontSize * flavorScale,
      flavorLineHeight: baseFlavorLineHeight * flavorScale,
    };
  }

  const singleLineHeight = hasFlavor ? baseFlavorLineHeight : baseRulesLineHeight;
  const neededHeight = hasFlavor ? neededFlavorHeight : neededRulesHeight;
  const showFlavor = hasFlavor && !hasRules;
  const showRules = hasRules || !showFlavor;
  const singleMinHeight = singleLineHeight + 2;
  const singleHeight = clamp(
    Math.max(neededHeight, singleMinHeight),
    singleMinHeight,
    areaHeight,
  );
  const singleY = areaRect.y + Math.max(0, (areaHeight - singleHeight) / 2);
  const singleScale = getTextScale(neededHeight, singleHeight);
  const hiddenRect = { ...areaRect, y: singleY, height: singleHeight };

  return {
    showRules,
    showFlavor,
    showDivider: false,
    rulesRect: showRules ? { ...areaRect, y: singleY, height: singleHeight } : hiddenRect,
    flavorRect: showFlavor ? { ...areaRect, y: singleY, height: singleHeight } : hiddenRect,
    dividerRect: { ...dividerRect, y: singleY + singleHeight },
    rulesFontSize: baseRulesFontSize * singleScale,
    rulesLineHeight: baseRulesLineHeight * singleScale,
    flavorFontSize: baseFlavorFontSize * singleScale,
    flavorLineHeight: baseFlavorLineHeight * singleScale,
  };
}

function estimateWrappedLineCount(text: string, charsPerLine: number): number {
  const normalizedText = text.replace(/\r\n?/g, "\n").replace(/[ \t]+$/gm, "");
  const trimmed = normalizedText.trim();

  if (!trimmed) {
    return 1;
  }

  return normalizedText.trim().split(/\n/).reduce((lineCount, line) => {
    const normalizedLength = line.trim().replace(/\s+/g, " ").length;
    if (normalizedLength === 0) {
      return lineCount + 0.45;
    }

    return lineCount + Math.max(1, Math.ceil(normalizedLength / charsPerLine));
  }, 0);
}

function normalizeDisplayMultilineText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n+$/g, "");
}

function getTextScale(neededHeight: number, availableHeight: number): number {
  if (neededHeight <= availableHeight) {
    return 1;
  }

  return clamp(availableHeight / neededHeight, 0.56, 1);
}

function normalizeArtTransform(
  transform: ArtTransform,
  artBounds: CoordinateRect = CARD_COORDINATES.art,
  imageAspectRatio?: number | null,
): ArtTransform {
  const nextScale = clamp(transform.scale, 1, 3);
  const viewportAspectRatio = artBounds.width / artBounds.height;
  const coverWidth =
    imageAspectRatio && imageAspectRatio > viewportAspectRatio
      ? artBounds.height * imageAspectRatio
      : artBounds.width;
  const coverHeight =
    imageAspectRatio && imageAspectRatio < viewportAspectRatio
      ? artBounds.width / imageAspectRatio
      : artBounds.height;
  const maxOffsetX = Math.max(0, (coverWidth * nextScale - artBounds.width) / 2);
  const maxOffsetY = Math.max(0, (coverHeight * nextScale - artBounds.height) / 2);

  return {
    scale: nextScale,
    offsetX: clamp(transform.offsetX, -maxOffsetX, maxOffsetX),
    offsetY: clamp(transform.offsetY, -maxOffsetY, maxOffsetY),
  };
}

function getCoverFittedImageLayout(
  viewportWidth: number,
  viewportHeight: number,
  imageAspectRatio?: number | null,
) {
  if (!imageAspectRatio) {
    return {
      width: viewportWidth,
      height: viewportHeight,
      left: 0,
      top: 0,
      resizeMode: "cover" as const,
    };
  }

  const viewportAspectRatio = viewportWidth / viewportHeight;
  const coverWidth =
    imageAspectRatio > viewportAspectRatio ? viewportHeight * imageAspectRatio : viewportWidth;
  const coverHeight =
    imageAspectRatio < viewportAspectRatio ? viewportWidth / imageAspectRatio : viewportHeight;

  return {
    width: coverWidth,
    height: coverHeight,
    left: (viewportWidth - coverWidth) / 2,
    top: (viewportHeight - coverHeight) / 2,
    resizeMode: "stretch" as const,
  };
}

function TransformableArtImage({
  uri,
  artRect,
  renderScale,
  artTransform,
  imageAspectRatio,
}: {
  uri: string;
  artRect: CoordinateRect;
  renderScale: number;
  artTransform: ArtTransform;
  imageAspectRatio?: number | null;
}) {
  const fittedLayout = getCoverFittedImageLayout(
    artRect.width * renderScale,
    artRect.height * renderScale,
    imageAspectRatio,
  );

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: fittedLayout.left,
        top: fittedLayout.top,
        width: fittedLayout.width,
        height: fittedLayout.height,
        transform: [
          { translateX: artTransform.offsetX * renderScale },
          { translateY: artTransform.offsetY * renderScale },
          { scale: artTransform.scale },
        ],
      }}
    >
      <Image
        accessibilityIgnoresInvertColors
        source={{ uri }}
        resizeMode={fittedLayout.resizeMode}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </View>
  );
}

function GeneratingArtAnimation({ scale, colors }: { scale: number; colors: ManaColor[] }) {
  const drift = useRef(new Animated.Value(0)).current;
  const swirl = useRef(new Animated.Value(0)).current;
  const palette = useMemo(() => getGeneratingSmokePalette(colors), [colors]);

  useEffect(() => {
    const driftLoop = Animated.loop(
      Animated.timing(drift, {
        toValue: 1,
        duration: 5400,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    );
    const swirlLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(swirl, {
          toValue: 1,
          duration: 3600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(swirl, {
          toValue: 0,
          duration: 2900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );

    driftLoop.start();
    swirlLoop.start();

    return () => {
      driftLoop.stop();
      swirlLoop.stop();
    };
  }, [drift, swirl]);

  const plumeOpacity = swirl.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.28, 0.66, 0.34],
  });
  const plumeScale = swirl.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.08],
  });

  return (
    <View pointerEvents="none" style={{ flex: 1, overflow: "hidden", backgroundColor: "#07080b" }}>
      <LinearGradient
        colors={["#06070a", rgba(palette[0], 0.22), rgba(palette[1], 0.18), "#111018"]}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", inset: 0 }}
      />
      <Animated.View
        style={{
          position: "absolute",
          left: "18%",
          top: "17%",
          width: "64%",
          height: "54%",
          borderRadius: 999,
          backgroundColor: rgba(palette[0], 0.12),
          opacity: plumeOpacity,
          transform: [{ scale: plumeScale }],
        }}
      />
      {GENERATING_SMOKE_PARTICLES.map((particle, index) => {
        const color = palette[(index + particle.colorOffset) % palette.length];

        return (
          <Animated.View
            key={`generating-smoke-${index}`}
            style={{
              position: "absolute",
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}%`,
              height: `${particle.size}%`,
              borderRadius: 999,
              opacity: swirl.interpolate({
                inputRange: [0, 0.45, 1],
                outputRange: [particle.opacity * 0.52, particle.opacity, particle.opacity * 0.62],
              }),
              transform: [
                {
                  translateX: drift.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [
                      -particle.driftX * scale,
                      particle.driftX * scale,
                      -particle.driftX * 0.45 * scale,
                    ],
                  }),
                },
                {
                  translateY: swirl.interpolate({
                    inputRange: [0, 1],
                    outputRange: [particle.driftY * scale, -particle.driftY * scale],
                  }),
                },
                {
                  scale: drift.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.92, particle.scale, 1.04],
                  }),
                },
              ],
            }}
          >
            <LinearGradient
              colors={[rgba(color, 0.42), rgba(color, 0.2), rgba(color, 0)]}
              start={{ x: 0.32, y: 0.22 }}
              end={{ x: 0.82, y: 0.88 }}
              style={{ flex: 1, borderRadius: 999 }}
            />
          </Animated.View>
        );
      })}
      <Animated.View
        style={{
          position: "absolute",
          left: "12%",
          top: "64%",
          width: "76%",
          height: "16%",
          borderRadius: 999,
          backgroundColor: rgba(palette[1], 0.1),
          opacity: plumeOpacity,
          transform: [
            {
              translateX: drift.interpolate({
                inputRange: [0, 1],
                outputRange: [-18 * scale, 18 * scale],
              }),
            },
            { scaleX: plumeScale },
          ],
        }}
      />
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "28%" }}>
        <LinearGradient
          colors={["rgba(7,8,11,0)", "rgba(7,8,11,0.82)"]}
          style={{ flex: 1 }}
        />
      </View>
      <Text
        selectable={false}
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          position: "absolute",
          left: 8 * scale,
          right: 8 * scale,
          bottom: 8 * scale,
          color: "rgba(255, 255, 255, 0.94)",
          fontSize: Math.max(8, 11 * scale),
          lineHeight: Math.max(10, 13 * scale),
          fontWeight: "900",
          textAlign: "center",
          letterSpacing: 0,
        }}
      >
        Generating art
      </Text>
    </View>
  );
}

const GENERATING_SMOKE_COLORS: Record<ManaColor | "C", string> = {
  W: "#fff1bd",
  U: "#55c8ff",
  B: "#9270c7",
  R: "#ff6852",
  G: "#5be38f",
  C: "#cfd5cf",
};

const GENERATING_SMOKE_PARTICLES = [
  { x: 6, y: 70, size: 19, opacity: 0.44, driftX: 16, driftY: 12, scale: 1.14, colorOffset: 0 },
  { x: 14, y: 61, size: 16, opacity: 0.5, driftX: 20, driftY: 18, scale: 1.2, colorOffset: 1 },
  { x: 23, y: 54, size: 22, opacity: 0.42, driftX: 14, driftY: 22, scale: 1.08, colorOffset: 2 },
  { x: 32, y: 45, size: 14, opacity: 0.48, driftX: 22, driftY: 13, scale: 1.22, colorOffset: 0 },
  { x: 42, y: 38, size: 24, opacity: 0.36, driftX: 17, driftY: 19, scale: 1.12, colorOffset: 1 },
  { x: 55, y: 31, size: 17, opacity: 0.46, driftX: 24, driftY: 15, scale: 1.18, colorOffset: 2 },
  { x: 67, y: 24, size: 23, opacity: 0.34, driftX: 18, driftY: 21, scale: 1.1, colorOffset: 0 },
  { x: 78, y: 18, size: 15, opacity: 0.44, driftX: 21, driftY: 12, scale: 1.24, colorOffset: 1 },
  { x: 84, y: 34, size: 20, opacity: 0.32, driftX: 13, driftY: 18, scale: 1.16, colorOffset: 2 },
  { x: 63, y: 49, size: 13, opacity: 0.42, driftX: 19, driftY: 11, scale: 1.28, colorOffset: 0 },
  { x: 48, y: 58, size: 18, opacity: 0.36, driftX: 15, driftY: 20, scale: 1.12, colorOffset: 1 },
  { x: 30, y: 70, size: 12, opacity: 0.4, driftX: 23, driftY: 14, scale: 1.2, colorOffset: 2 },
  { x: 10, y: 34, size: 11, opacity: 0.34, driftX: 12, driftY: 16, scale: 1.18, colorOffset: 1 },
  { x: 22, y: 24, size: 15, opacity: 0.3, driftX: 18, driftY: 10, scale: 1.1, colorOffset: 0 },
  { x: 74, y: 63, size: 14, opacity: 0.34, driftX: 20, driftY: 17, scale: 1.22, colorOffset: 2 },
  { x: 88, y: 72, size: 18, opacity: 0.28, driftX: 14, driftY: 13, scale: 1.16, colorOffset: 1 },
];

function getGeneratingSmokePalette(colors: ManaColor[]) {
  const uniqueColors = colors.filter((color, index) => colors.indexOf(color) === index);
  const palette = uniqueColors.length > 0 ? uniqueColors : (["C"] as const);

  const smokeColors = palette.map((color) => GENERATING_SMOKE_COLORS[color]);

  return smokeColors.length === 1 ? [smokeColors[0], smokeColors[0]] : smokeColors;
}

function rgba(hex: string, opacity: number): string {
  const clean = hex.replace("#", "");
  const red = parseInt(clean.slice(0, 2), 16);
  const green = parseInt(clean.slice(2, 4), 16);
  const blue = parseInt(clean.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function getTouchDistance(touches?: ArrayLike<{ pageX: number; pageY: number }>): number | null {
  if (!touches || touches.length < 2) {
    return null;
  }

  const firstTouch = touches[0];
  const secondTouch = touches[1];
  const dx = firstTouch.pageX - secondTouch.pageX;
  const dy = firstTouch.pageY - secondTouch.pageY;

  return Math.sqrt(dx * dx + dy * dy);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function percent(value: number): `${number}%` {
  return `${value * 100}%`;
}
