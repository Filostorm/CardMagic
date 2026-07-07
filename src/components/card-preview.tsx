import { LinearGradient } from "expo-linear-gradient";
import { Pencil } from "lucide-react-native";
import { memo, type ComponentProps, useEffect, useMemo, useRef, useState } from "react";
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
import type { GestureResponderEvent } from "react-native";
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
  getMseM15BorderlessPinlineOnlyRestoreMaskSource,
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
  getMseM15StandardArtifactColorMainframeSource,
  getMseM15StandardColorSecurityStampBackingSource,
  getMseM15BorderlessDarkTextboxFillSource,
  getMseM15TypeLineTextureSource,
  getMseM15TypeFrameSource,
  MseM15OverlayLayer,
} from "@/data/mse-frame-renderer";
import {
  getMseM15ColorBlend,
  MseM15ColorBlend,
} from "@/data/mse-frame-blends";
import {
  FRAME_STYLES,
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
  toDfcFacePatch,
} from "@/lib/dfc";
import {
  adjustFlattenPending,
  compositeFlattenedMaskedArt,
  compositeFlattenedMaskedFrame,
} from "@/lib/export-flatten";
import { getDisplayRulesText, getKeywordRulesText } from "@/lib/keyword-text";
import { getLoyaltyAbilities, getStartingLoyalty } from "@/lib/planeswalker";
import { resolveRulesTextCardNameToken } from "@/lib/rules-text";
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
  createCardPreviewFrameModel,
  shouldRenderDfcFrontWithStandardTreatmentGeometry,
  shouldShowDfcColorIndicator,
  shouldUseMseM15ColorBlend,
  supportsFrameEffectOverlays,
} from "@/components/card-preview/card-preview-model";
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
  SubjectMaskSection,
  TypeFrame,
} from "@/types/card";
import {
  DEFAULT_SUBJECT_MASK_FIT_MODE,
  resolveSubjectMaskSections,
} from "@/lib/subject-mask-sections";

function getSvgMaskTypeProps(maskType: "alpha" | "luminance"): Partial<ComponentProps<typeof Mask>> {
  return Platform.OS === "web"
    ? ({ style: { maskType } } as Partial<ComponentProps<typeof Mask>>)
    : ({ maskType } as Partial<ComponentProps<typeof Mask>>);
}

type CardPreviewProps = {
  card: CardDraft;
  activeSection: CardSection | null;
  width: number;
  cornerRadius?: number;
  exportMode?: boolean;
  exportCaptureMode?: boolean;
  exportSetSymbolMode?: boolean;
  // Pre-flatten masked layers (borderless pinline, rarity set symbol) into plain
  // raster <img> via offscreen-canvas compositing, so the html2canvas export can
  // capture them faithfully. Web-only; the editor uses its live mask paths.
  exportFlattenMasks?: boolean;
  artGenerating?: boolean;
  artGenerationTrailSeed?: string;
  onArtImageSettled?: (uri: string) => void;
  footerOwnerName?: string;
  initialArtImageAspectRatio?: number | null;
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
  radius?: number;
};

function getDisplayArtistName(artist: string | undefined) {
  const trimmedArtist = artist?.trim();

  return !trimmedArtist || trimmedArtist.toLowerCase() === "local artist"
    ? "Unknown Artist"
    : trimmedArtist;
}

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
  centerRulesContent: boolean;
  rulesContentVerticalAlign?: "center" | "bottom";
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

const MSE_M15_TEXTBOX_FRAME_RECT: CoordinateRect = { x: 29, y: 327, width: 314, height: 154 };
const MSE_M15_FULL_ART_TEXTBOX_FRAME_RECT: CoordinateRect = { x: 24, y: 356, width: 327, height: 130 };

type FrameTreatmentLayout = {
  art: CoordinateRect;
  name: CoordinateRect;
  manaCost: CoordinateRect;
  typeLine: CoordinateRect;
  setSymbol: CoordinateRect;
  textArea: CoordinateRect;
  textBoxFrame: CoordinateRect;
  rulesFlavorDivider: CoordinateRect;
  ptBox: CoordinateRect;
  powerToughness: CoordinateRect;
  footer: CoordinateRect;
  showTypeLine: boolean;
  rulesContentVerticalAlign?: "center" | "bottom";
};

const DEFAULT_FRAME_TREATMENT_LAYOUT: FrameTreatmentLayout = {
  art: CARD_COORDINATES.art,
  name: CARD_COORDINATES.name,
  manaCost: CARD_COORDINATES.manaCost,
  typeLine: CARD_COORDINATES.typeLine,
  setSymbol: CARD_COORDINATES.setSymbol,
  textArea: CARD_COORDINATES.textArea,
  textBoxFrame: MSE_M15_TEXTBOX_FRAME_RECT,
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
    textBoxFrame: MSE_M15_FULL_ART_TEXTBOX_FRAME_RECT,
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
    textBoxFrame: { x: 40, y: 260, width: 299, height: 174 },
    rulesFlavorDivider: { x: 50, y: 427, width: 275, height: 2 },
    ptBox: { x: 271, y: 461, width: 81, height: 42 },
    powerToughness: { x: 284, y: 466, width: 60, height: 28 },
    footer: { x: 26, y: 477, width: 247, height: 28 },
  },
  borderless: {
    ...DEFAULT_FRAME_TREATMENT_LAYOUT,
    art: FRAME_TREATMENT_ART_RECTS.borderless,
    name: { x: 32, y: 30, width: 226, height: 23 },
    manaCost: { x: 263, y: 28, width: 83, height: 23 },
    typeLine: { x: 28, y: 296, width: 274, height: 20 },
    setSymbol: { x: 304, y: 297, width: 40, height: 22 },
    textArea: { x: 35, y: 327, width: 304, height: 154 },
    textBoxFrame: MSE_M15_TEXTBOX_FRAME_RECT,
    rulesFlavorDivider: { x: 50, y: 426, width: 275, height: 2 },
    ptBox: { x: 273, y: 466, width: 81, height: 42 },
    powerToughness: { x: 286, y: 471, width: 60, height: 28 },
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
    textBoxFrame: MSE_M15_TEXTBOX_FRAME_RECT,
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
    textBoxFrame: { x: 42, y: 330, width: 291, height: 0 },
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
    textBoxFrame: { x: 49, y: 320, width: 279, height: 141 },
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
    textBoxFrame: MSE_M15_TEXTBOX_FRAME_RECT,
    rulesFlavorDivider: { x: 50, y: 426, width: 275, height: 2 },
    ptBox: { x: 273, y: 466, width: 81, height: 42 },
    powerToughness: { x: 286, y: 469, width: 60, height: 28 },
    footer: { x: 24, y: 488, width: 326, height: 20 },
  },
};

const STELLAR_SIGHTS_TREATMENT_LAYOUT: FrameTreatmentLayout = {
  ...FRAME_TREATMENT_LAYOUTS.showcase,
  name: { x: 28, y: 317, width: 303, height: 30 },
  manaCost: { x: 250, y: 317, width: 96, height: 30 },
  typeLine: { x: 31, y: 351, width: 304, height: 22 },
  setSymbol: { x: 0, y: 0, width: 0, height: 0 },
  textArea: { x: 45, y: 373, width: 262, height: 105 },
  textBoxFrame: { x: 45, y: 373, width: 262, height: 105 },
  rulesFlavorDivider: { x: 50, y: 424, width: 275, height: 2 },
  footer: { x: 24, y: 488, width: 326, height: 24 },
  rulesContentVerticalAlign: "bottom",
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
const BORDERLESS_CARD_SKIN_ALIAS_RECT = { x: 45, y: 55, width: 285, height: 18 } as const;
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
  textBoxFrame: { x: 36, y: 328, width: 301, height: 138 },
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
const TYPE_LINE_COLOR_INDICATOR_SIZE = 14.5;
const TYPE_LINE_COLOR_INDICATOR_TEXT_GAP = 4;
const cardPreviewShadowStyle = {
  boxShadow: "0 16px 32px rgba(0, 0, 0, 0.26)",
};
const MSE_M15_TYPELINE_TEXTURE_SIZE = { width: 339, height: 464 };
const FUTURESHIFTED_TYPELINE_LAYER_RECT: CoordinateRect = { x: 18, y: 17, width: 339, height: 464 };
const MSE_M15_FUTURE_TEXTBOX_TEXTURE_SIZE = { width: 335, height: 152 };
const FUTURESHIFTED_TEXTBOX_LAYER_RECT: CoordinateRect = { x: 23, y: 320, width: 335, height: 152 };
const FUTURESHIFTED_TITLE_TERMINAL_DOT_RECT: CoordinateRect = { x: 348, y: 73, width: 7, height: 7 };
const SUBJECT_MASK_TITLE_PLATE_OUTSETS = {
  left: 28,
  top: 24,
  right: 24,
  bottom: 12,
  radius: 4,
} as const;
const SUBJECT_MASK_TYPE_PLATE_OUTSETS = {
  left: 11,
  top: 6,
  right: 13,
  bottom: 12,
  radius: 10,
} as const;
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

const SUBJECT_MASK_TEXT_INK = "#f8f2df";
const SUBJECT_MASK_TEXT_MUTED_INK = "rgba(248, 242, 223, 0.68)";

function getSubjectMaskTextShadow(scale: number) {
  return {
    textShadowColor: "rgba(0, 0, 0, 0.82)",
    textShadowOffset: { width: 0, height: 1 * scale },
    textShadowRadius: 1.6 * scale,
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
            {...getSvgMaskTypeProps("luminance")}
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

function TextlessBottomBarLayerImpl() {
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

function getTextlessTreatmentFrameBlendSources(
  frameColors: ManaColor[],
  colorBlend: MseM15ColorBlend | null,
): SplitFrameSources | null {
  if (!colorBlend || frameColors.length !== 2) {
    return null;
  }

  const [leftColor, rightColor] = frameColors;
  const leftSource = getMseM15FrameTreatmentSource(
    "textless",
    getFrameIdentityForManaColor(leftColor),
  );
  const rightSource = getMseM15FrameTreatmentSource(
    "textless",
    getFrameIdentityForManaColor(rightColor),
  );

  if (!leftSource || !rightSource) {
    return null;
  }

  return { left: leftSource, right: rightSource };
}

function getTwoColorShowcaseFrameBlendSources(
  showcaseFrame: Parameters<typeof getShowcaseFrameSource>[0],
  frameColors: ManaColor[],
  colorBlend: MseM15ColorBlend | null,
  hasPowerToughness: boolean,
  spec: ShowcaseFrameSpec | null,
): SplitFrameSources | null {
  if (spec?.twoColorFrameBlend !== "linear" || !colorBlend || frameColors.length !== 2) {
    return null;
  }

  const [leftColor, rightColor] = frameColors;

  return {
    left: getShowcaseFrameSource(
      showcaseFrame,
      getFrameIdentityForManaColor(leftColor),
      hasPowerToughness,
    ),
    right: getShowcaseFrameSource(
      showcaseFrame,
      getFrameIdentityForManaColor(rightColor),
      hasPowerToughness,
    ),
  };
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

function getTypeLineColorIndicatorSource({
  faceCard,
  typeFrame,
  frameIdentity,
  manualFrameColors,
  manaColors,
  colorBlend,
  showDfcColorIndicator,
}: {
  faceCard: CardDraft;
  typeFrame: TypeFrame;
  frameIdentity: FrameIdentity;
  manualFrameColors: ManaColor[];
  manaColors: ManaColor[];
  colorBlend: MseM15ColorBlend | null;
  showDfcColorIndicator: boolean;
}): ImageSourcePropType | null {
  if (typeFrame === "token" || showDfcColorIndicator || manaColors.length > 0) {
    return null;
  }

  if (manualFrameColors.length > 0) {
    return getMseM15ColorIndicatorSource(frameIdentity, colorBlend);
  }

  const selectedFrameIdentity = getColoredFrameIdentityForSelection(faceCard.frameSelection);

  return selectedFrameIdentity ? getMseM15ColorIndicatorSource(selectedFrameIdentity) : null;
}

function getColoredFrameIdentityForSelection(frameSelection: CardDraft["frameSelection"]): FrameIdentity | null {
  switch (frameSelection) {
    case "white":
    case "blue":
    case "black":
    case "red":
    case "green":
      return frameSelection;
    default:
      return null;
  }
}

function getTypeLineColorIndicatorReserve(hasColorIndicator: boolean): number {
  if (!hasColorIndicator) {
    return 0;
  }

  return TYPE_LINE_COLOR_INDICATOR_SIZE + TYPE_LINE_COLOR_INDICATOR_TEXT_GAP;
}

function getCardMagicFooterCopyrightLine(card: CardDraft, footerOwnerName?: string) {
  const ownerName = footerOwnerName?.trim();

  if (!ownerName) {
    return getModernCopyrightLine(card);
  }

  return `${ownerName} & ${new Date().getFullYear()} CardMagic`;
}

function ModernPrintingFooter({
  card,
  scale,
  hasPowerToughness = false,
  variant = "card",
  footerOwnerName,
}: {
  card: CardDraft;
  scale: number;
  hasPowerToughness?: boolean;
  variant?: "card" | "battle" | "token" | "futureshifted";
  footerOwnerName?: string;
}) {
  const isBattle = variant === "battle";
  const isFutureshifted = variant === "futureshifted";
  const footerInk = "#f6f0df";
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
  const copyrightLine = getCardMagicFooterCopyrightLine(card, footerOwnerName);
  const artistArrowSource = FULL_MAGIC_PACK.artistArrowLight;

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
    const artist = getDisplayArtistName(card.artist);
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
          {copyrightLine}
        </Text>
      </View>
    );
  }

  if (!isBattle) {
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
                source={artistArrowSource}
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
          {copyrightLine}
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
            source={artistArrowSource}
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
        {copyrightLine}
      </Text>
    </View>
  );
}

function RetroPrintingFooter({ card, scale, footerOwnerName }: { card: CardDraft; scale: number; footerOwnerName?: string }) {
  const artist = getDisplayArtistName(card.artist);
  const legalLine = `${getCardMagicFooterCopyrightLine(card, footerOwnerName)}  ${getModernCollectorLine(card)}`;

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

// Memoized so it skips re-rendering whenever its props are shallow-equal. The
// editor host (App) re-renders on every transient UI state change (menus, popups,
// account sync, etc.); without this boundary that re-renders the entire card
// canvas. Callers must pass stable `onSectionPress`/`onChange` for memo to hold.
export const CardPreview = memo(CardPreviewComponent);

function CardPreviewComponent({
  card,
  activeSection,
  width,
  cornerRadius = 18,
  exportMode = false,
  exportCaptureMode = false,
  exportSetSymbolMode = false,
  exportFlattenMasks = false,
  artGenerating = false,
  artGenerationTrailSeed,
  onArtImageSettled,
  footerOwnerName,
  initialArtImageAspectRatio,
  onSectionPress,
  onChange,
}: CardPreviewProps) {
  const frameModel = useMemo(() => createCardPreviewFrameModel(card), [card]);
  const {
    faceCard,
    frameIdentity,
    frameStyle,
    selectedTypeFrame,
    isBattleFrontFace,
    isDfcBack,
    frameTreatment,
    showcaseFrame,
    typeFrame,
    showcaseSpec,
    typeFrameSpec,
    showManaCost,
    manaSymbols,
    manaColors,
    frameColors,
    manualFrameColors,
    resolvedMseColorBlend,
    usesArtifactBaseFrame,
    shouldUseSubjectMaskAsPrimaryArt,
    mseColorBlend,
    mseAccentColorBlend,
    useGoldRegularFrame,
    regularFrameIdentity,
    regularMseColorBlend,
    regularFrameStyle,
  } = frameModel;
  const baseTreatmentLayout = typeFrame === "standard" ? FRAME_TREATMENT_LAYOUTS[frameTreatment] : null;
  const isFutureshiftedShowcase = showcaseSpec?.id === "futureshifted";
  const treatmentLayout = isFutureshiftedShowcase
    ? FUTURESHIFTED_TREATMENT_LAYOUT
    : showcaseSpec?.id === "stellarSights"
      ? STELLAR_SIGHTS_TREATMENT_LAYOUT
      : baseTreatmentLayout;
  const isRetroTreatment = typeFrame === "standard" && frameTreatment === "retro";
  const isBorderlessTreatment =
    typeFrame === "standard" && frameTreatment === "borderless";
  const baseCardName = faceCard.baseCardName?.trim() ?? "";
  const showsCardSkinAlias =
    baseCardName.length > 0 &&
    typeFrame === "standard" &&
    (frameTreatment === "standard" || frameTreatment === "borderless") &&
    !showcaseSpec &&
    !isRetroTreatment;
  const [isManaCostFocused, setIsManaCostFocused] = useState(false);
  const hasManaSymbols = manaSymbols.length > 0;
  const shouldReserveTitleManaCostSpace =
    showManaCost && (hasManaSymbols || isManaCostFocused);
  const artifactMainframeColorSource =
    typeFrame === "standard" &&
    (frameTreatment === "standard" || frameTreatment === "borderless") &&
    usesArtifactBaseFrame &&
    frameColors.length > 0
      ? getMseM15StandardArtifactColorMainframeSource(frameColors, mseAccentColorBlend)
      : null;
  const stampBackingColorBlend =
    typeFrame === "saga" ? null : getSecurityStampBackingColorBlend(frameColors, mseAccentColorBlend);
  const stampBackingFrameIdentity =
    typeFrame === "saga" ? "black" : getSecurityStampBackingFrameIdentity(regularFrameIdentity, frameColors);
  const artifactStampBackingSource =
    typeFrame === "standard" &&
    (frameTreatment === "standard" || frameTreatment === "borderless") &&
    usesArtifactBaseFrame &&
    frameColors.length <= 2 &&
    frameColors.length > 0
      ? getMseM15StandardColorSecurityStampBackingSource(frameColors, stampBackingColorBlend)
      : null;
  const borderlessGodzillaLandStampBackingSource =
    typeFrame === "standard" &&
    frameTreatment === "borderless" &&
    showsCardSkinAlias &&
    stampBackingFrameIdentity === "land"
      ? getMseM15SecurityStampBackingSource("colorless", null)
      : null;
  const standardStampBackingSource =
    typeFrame === "saga"
      ? getMseM15SecurityStampBackingSource("black", null)
      : borderlessGodzillaLandStampBackingSource ??
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
  const supportsLegendaryFrameEffect =
    typeFrame === "standard" &&
    (frameTreatment === "standard" || frameTreatment === "borderless" || frameTreatment === "textless");
  const frameEffects = supportsFrameEffectOverlays(typeFrame)
    ? inferredFrameEffects.filter(
        (effect) =>
          (effect !== "nyx" || supportsNyxFrameEffect) &&
          (effect !== "legendary" || supportsLegendaryFrameEffect),
      )
    : [];
  const frameEffectSources =
    typeFrame === "saga"
      ? getMseM15SagaOverlaySources(frameIdentity, frameEffects, frameColors)
      : getMseM15OverlaySources(frameIdentity, frameEffects, frameColors, frameTreatment, {
          usesGodzillaAlias: showsCardSkinAlias,
        });
  const usesBorderlessGodzillaLegendaryOverlay =
    showsCardSkinAlias &&
    frameTreatment === "borderless" &&
    frameEffects.includes("legendary");
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
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(initialArtImageAspectRatio ?? null);
  const hasShowcaseArtTreatment = Boolean(showcaseSpec?.artMask || showcaseSpec?.artFilter || showcaseSpec?.artOverlay);
  const suppressSecurityStamp = typeFrame === "token" || showcaseSpec?.id === "dndRulebook";
  const securityStamped = !suppressSecurityStamp && shouldShowSecurityStamp(card, faceCard, typeFrame);
  const showStampPinlineBump = false;
  const borderlessTreatmentFrameBlendSources =
    typeFrame === "standard" && frameTreatment === "borderless"
      ? getBorderlessTreatmentFrameBlendSources(frameColors, regularMseColorBlend, securityStamped)
      : null;
  const textlessTreatmentFrameBlendSources =
    typeFrame === "standard" && frameTreatment === "textless"
      ? getTextlessTreatmentFrameBlendSources(frameColors, resolvedMseColorBlend)
      : null;
  const treatmentFrameBlendSources =
    borderlessTreatmentFrameBlendSources ?? textlessTreatmentFrameBlendSources;
  const borderlessDarkTextboxFillSource =
    typeFrame === "standard" && frameTreatment === "borderless"
      ? getMseM15BorderlessDarkTextboxFillSource()
      : null;
  // Editor always renders the pinline-restore layer. In export it is rendered
  // only when a mask-aware (foreignObject) capture backend is in use, since the
  // layer relies on an SVG mask that html2canvas cannot rasterize.
  const borderlessPinlineOnlyRestoreMaskSource =
    typeFrame === "standard" &&
    frameTreatment === "borderless" &&
    (exportFlattenMasks || (!exportMode && !exportCaptureMode))
      ? getMseM15BorderlessPinlineOnlyRestoreMaskSource()
      : null;
  const treatmentFrameSource =
    typeFrame === "standard"
      ? treatmentFrameBlendSources
        ? null
        : showcaseSpec
        ? showcaseSpec.twoColorFrameBlend === "linear" && resolvedMseColorBlend && frameColors.length === 2
          ? null
          : getShowcaseFrameSource(showcaseFrame, frameIdentity, showPowerToughness)
        : getMseM15FrameTreatmentSource(
            frameTreatment,
            regularFrameIdentity,
            securityStamped,
            regularMseColorBlend,
          )
      : null;
  const borderlessPinlineRestoreSource =
    artifactMainframeColorSource ??
    treatmentFrameSource ??
    getMseM15MainframeSource(regularFrameIdentity, "standard", regularMseColorBlend);
  const borderlessPinlineRestoreSplitSources =
    artifactMainframeColorSource ? null : borderlessTreatmentFrameBlendSources;
  const showcaseFrameUnderlaySource =
    showcaseSpec ? getShowcaseFrameUnderlaySource(showcaseFrame, frameIdentity) : null;
  const showcaseFrameBlendSources = getTwoColorShowcaseFrameBlendSources(
    showcaseFrame,
    frameColors,
    resolvedMseColorBlend,
    showPowerToughness,
    showcaseSpec,
  );
  const hasExactTreatmentFrame = Boolean(
      treatmentFrameSource ||
      treatmentFrameBlendSources ||
      showcaseFrameBlendSources,
  );
  const showcasePtOverlaySource =
    showcaseSpec && showPowerToughness ? getShowcasePtOverlaySource(showcaseFrame, frameIdentity) : null;
  const showcasePtOverlayRect =
    showcaseSpec?.ptOverlay ? scaleShowcaseRect(showcaseSpec.ptOverlay.rect, showcaseSpec) : null;
  const showcasePowerToughnessTextRect =
    showcaseSpec?.powerToughnessTextRect
      ? scaleShowcaseRect(showcaseSpec.powerToughnessTextRect, showcaseSpec)
      : showcaseSpec?.id === "dndRulebook" && showcasePtOverlayRect
      ? {
          x: showcasePtOverlayRect.x + 6,
          y: showcasePtOverlayRect.y + 4,
          width: showcasePtOverlayRect.width - 12,
          height: showcasePtOverlayRect.height - 8,
        }
      : null;
  const treatmentFrameMirrorX = frameTreatment === "borderless" ? regularMseColorBlend?.mirrorX : undefined;
  const shouldRenderArtBehindTreatmentFrame =
    typeFrame === "token" ||
    isBorderlessTreatment ||
    showcaseSpec?.id === "dndRulebook" ||
    shouldUseSubjectMaskAsPrimaryArt;
  const showDfcColorIndicator = shouldShowDfcColorIndicator(selectedTypeFrame, card);
  const dfcColorIndicatorSource = showDfcColorIndicator
    ? getMseM15ColorIndicatorSource(frameIdentity, mseAccentColorBlend)
    : null;
  const displayedKeywordRulesText = resolveRulesTextCardNameToken(getKeywordRulesText(faceCard.keywords), faceCard.name);
  const displayedRulesText = resolveRulesTextCardNameToken(getDisplayRulesText(faceCard), faceCard.name);
  const displayedFlavorText = activeSection === "rules"
    ? faceCard.flavorText.replace(/\r\n?/g, "\n")
    : normalizeDisplayMultilineText(faceCard.flavorText);
  const tokenFrameVariant = typeFrame === "token" ? getTokenFrameVariant(displayedRulesText, displayedFlavorText) : "normal";
  const shouldRedrawStandardArtAperture =
    typeFrame === "standard" &&
    shouldRedrawStandardMaskedArtAperture(frameTreatment, faceCard) &&
    !showArtGenerating;
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
  const rawPowerToughnessRect =
    showcasePowerToughnessTextRect ?? treatmentLayout?.powerToughness ?? getPowerToughnessRect(typeFrame);
  const shouldCalibrateBorderlessExportText =
    typeFrame === "standard" && frameTreatment === "borderless";
  const powerToughnessRect =
    shouldCalibrateBorderlessExportText && !showcasePowerToughnessTextRect
      ? {
          ...rawPowerToughnessRect,
          y: rawPowerToughnessRect.y + (exportCaptureMode ? 1 : -1),
        }
      : rawPowerToughnessRect;
  const manaLayout = getManaCostLayout(
    manaSymbols.length,
    treatmentLayout?.manaCost,
    isFutureshiftedShowcase ? FUTURESHIFTED_MANA_SYMBOL_SIZE : isRetroTreatment ? 16 : 22,
    isFutureshiftedShowcase ? 1 : isRetroTreatment ? 0.5 : 1.5,
  );
  const defaultManaRect = treatmentLayout?.manaCost ?? CARD_COORDINATES.manaCost;
  const titleBaseRect = treatmentLayout?.name ?? getNameRect(typeFrame, card);
  const titleManaRect =
    shouldReserveTitleManaCostSpace && !isFutureshiftedShowcase && defaultManaRect.width > 0
      ? manaLayout.rect
      : { ...defaultManaRect, x: titleBaseRect.x + titleBaseRect.width + 8, width: 0 };
  const cardSkinAliasSource = showsCardSkinAlias && !usesBorderlessGodzillaLegendaryOverlay
    ? getMseM15GodzillaAliasSource(frameIdentity, mseColorBlend)
    : null;
  const cardSkinAliasRect = usesBorderlessGodzillaLegendaryOverlay
    ? BORDERLESS_CARD_SKIN_ALIAS_RECT
    : CARD_SKIN_ALIAS_RECT;
  const titleLayout = getTitleLayout(
    faceCard.name,
    showsCardSkinAlias ? "" : baseCardName,
    titleManaRect,
    titleBaseRect,
    isRetroTreatment ? 19.5 : frameTreatment === "etchedFoil" ? 16 : 18,
    isRetroTreatment ? FULL_MAGIC_PACK.fontFamilies.retroTitle : FULL_MAGIC_PACK.fontFamilies.title,
  );
  const textBoxFrameRect = getTextBoxFrameRect(typeFrame, treatmentLayout);
  const subjectMaskSectionRects = shouldUseSubjectMaskAsPrimaryArt
      ? getSubjectMaskSectionRects({
        artRect,
        titleRect: titleBaseRect,
        manaRect: defaultManaRect,
        typeLineRect,
        setSymbolRect,
        textBoxFrameRect,
      })
    : [];
  const activeSubjectMaskSections = new Set(resolveSubjectMaskSections(faceCard.artSubjectMaskSections));
  const subjectMaskFrameApprovalRects = shouldUseSubjectMaskAsPrimaryArt
    ? getSubjectMaskApprovalRects(subjectMaskSectionRects, activeSubjectMaskSections)
    : [];
  const subjectMaskArtBounds = shouldUseSubjectMaskAsPrimaryArt
    ? getSubjectMaskExpandedArtBounds(artRect, subjectMaskFrameApprovalRects)
    : artRect;
  const subjectMaskFitBounds =
    (faceCard.artSubjectMaskFitMode ?? DEFAULT_SUBJECT_MASK_FIT_MODE) === "artOpening"
      ? artRect
      : subjectMaskArtBounds;
  const subjectMaskOverlayBottomY =
    isBorderlessTreatment && !activeSubjectMaskSections.has("text")
      ? textBoxFrameRect.y
      : CARD_COORDINATES.height;
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
  const rulesCharsPerLine = Math.max(18, Math.floor(rulesLayout.rulesRect.width / 6.15));
  const compactRulesLineCount = rulesLayout.centerRulesContent
    ? estimateWrappedLineCount(
        displayedRulesText,
        rulesCharsPerLine,
      )
    : 0;
  const compactRulesContentHeight = compactRulesLineCount > 0
    ? compactRulesLineCount * rulesLayout.rulesLineHeight
    : 0;
  const compactRulesContentHeightScaled = compactRulesContentHeight * scale;
  const compactRulesVerticalInset = rulesLayout.centerRulesContent
    ? Math.max(0, (rulesLayout.rulesRect.height - compactRulesContentHeight) / 2) * scale
    : 0;
  const displayedRulesLineCount = rulesLayout.showRules
    ? estimateWrappedLineCount(
        displayedRulesText,
        rulesCharsPerLine,
      )
    : 0;
  const activeKeywordRulesLineCount =
    activeSection === "rules" && displayedKeywordRulesText.trim().length > 0
      ? estimateWrappedLineCount(displayedKeywordRulesText, rulesCharsPerLine)
      : 0;
  const displayedRulesContentHeight = displayedRulesLineCount > 0
    ? displayedRulesLineCount * rulesLayout.rulesLineHeight
    : 0;
  const displayedRulesContentHeightScaled = displayedRulesContentHeight * scale;
  const displayedRulesVerticalInset =
    Math.max(0, (rulesLayout.rulesRect.height - displayedRulesContentHeight) / 2) * scale;
  const rulesContentVerticalInset =
    rulesLayout.centerRulesContent
      ? compactRulesVerticalInset
      : rulesLayout.rulesContentVerticalAlign === "bottom"
        ? Math.max(0, rulesLayout.rulesRect.height - displayedRulesContentHeight - 1) * scale
        : displayedRulesVerticalInset;
  const rulesContentPaddingBottom =
    rulesLayout.centerRulesContent
      ? compactRulesVerticalInset
      : rulesLayout.rulesContentVerticalAlign === "bottom"
        ? 0
        : displayedRulesVerticalInset;
  const activeKeywordRulesHeightScaled = activeKeywordRulesLineCount * rulesLayout.rulesLineHeight * scale;
  const activeRulesInputTop = rulesContentVerticalInset + activeKeywordRulesHeightScaled;
  const activeRulesInputHeight = Math.max(
    rulesLayout.rulesLineHeight * scale,
    (rulesLayout.rulesRect.height * scale) - activeRulesInputTop - rulesContentPaddingBottom,
  );
  const displayedFlavorLineCount = rulesLayout.showFlavor
    ? estimateWrappedLineCount(
        displayedFlavorText,
        Math.max(18, Math.floor(rulesLayout.flavorRect.width / 6.15)),
      )
    : 0;
  const displayedFlavorContentHeight = displayedFlavorLineCount > 0
    ? displayedFlavorLineCount * rulesLayout.flavorLineHeight
    : 0;
  const displayedFlavorContentHeightScaled = displayedFlavorContentHeight * scale;
  const displayedFlavorVerticalInset = Math.max(
    0,
    (rulesLayout.flavorRect.height - displayedFlavorContentHeight) / 2,
  ) * scale;
  const rulesInlineHitBand = getInlineTextHitBand(
    rulesLayout.rulesRect.height * scale,
    rulesContentVerticalInset,
    rulesLayout.centerRulesContent ? compactRulesContentHeightScaled : displayedRulesContentHeightScaled,
    10 * scale,
  );
  const flavorInlineHitBand = getInlineTextHitBand(
    rulesLayout.flavorRect.height * scale,
    displayedFlavorVerticalInset,
    displayedFlavorContentHeightScaled,
    10 * scale,
  );
  // The textbox furniture ring would otherwise fall through to the frame
  // catch-all, so include it in the rules-sheet tap target.
  const rulesSheetHitRect = (() => {
    const base = textBoxFrameRect;
    const sideMargin = 20;
    const bottomMargin = 18;
    const left = Math.max(0, base.x - sideMargin);
    const right = Math.min(CARD_COORDINATES.width, base.x + base.width + sideMargin);
    return {
      x: left,
      y: base.y,
      width: right - left,
      height: Math.min(CARD_COORDINATES.height - base.y, base.height + bottomMargin),
    };
  })();
  const rulesSheetZoneRect = textBoxFrameRect;
  const handleRulesTextPress = (event: GestureResponderEvent) => {
    if (
      activeSection !== "rules" &&
      !isWithinInlineTextHitBand(event.nativeEvent.locationY, rulesInlineHitBand)
    ) {
      onSectionPress("rules", { openSheet: true });
      return;
    }

    onSectionPress("rules");
  };
  const handleFlavorTextPress = (event: GestureResponderEvent) => {
    if (
      activeSection !== "rules" &&
      !isWithinInlineTextHitBand(event.nativeEvent.locationY, flavorInlineHitBand)
    ) {
      onSectionPress("rules", { openSheet: true });
      return;
    }

    onSectionPress("rules");
  };
  useEffect(() => {
    let cancelled = false;

    if (!faceCard.artUri) {
      setImageAspectRatio(null);
      return;
    }

    if (typeof initialArtImageAspectRatio === "number" && initialArtImageAspectRatio > 0) {
      setImageAspectRatio(initialArtImageAspectRatio);
      return;
    }

    setImageAspectRatio(null);

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
  }, [faceCard.artUri, initialArtImageAspectRatio]);

  const artTransform = normalizeArtTransform(
    faceCard.artTransform ?? DEFAULT_ART_TRANSFORM,
    artRect,
    imageAspectRatio,
  );
  const adventureDefaults = getAdventureDefaults(faceCard);
  const displayedAdventureRulesText = resolveRulesTextCardNameToken(
    adventureDefaults.rulesText,
    adventureDefaults.name,
  );
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
  const resolvedRulesTextColor = getCardTextColorOverride(faceCard.rulesTextColors?.[frameTreatment]);
  const titleDefaultInk =
    treatmentLayout && treatmentHeaderInk
      ? treatmentHeaderInk
    : isDfcBack || (typeFrame === "token" && frameIdentity !== "white")
      ? "#f8f2df"
      : regularFrameStyle.ink;
  const titleInk = resolvedRulesTextColor ?? titleDefaultInk;
  const titleMutedInk = resolvedRulesTextColor
    ? getMutedInk(resolvedRulesTextColor)
    : treatmentLayout && treatmentHeaderInk
      ? getMutedInk(treatmentHeaderInk)
    : isDfcBack || (typeFrame === "token" && frameIdentity !== "white")
      ? "rgba(248, 242, 223, 0.62)"
      : regularFrameStyle.mutedInk;
  const typeLineDefaultInk =
    treatmentLayout && treatmentHeaderInk ? treatmentHeaderInk : isDfcBack ? "#f8f2df" : typeFrame === "token" ? "#171512" : regularFrameStyle.ink;
  const typeLineInk = resolvedRulesTextColor ?? typeLineDefaultInk;
  const typeLineMutedInk = resolvedRulesTextColor
    ? getMutedInk(resolvedRulesTextColor)
    : treatmentLayout && treatmentHeaderInk
      ? getMutedInk(treatmentHeaderInk)
    : isDfcBack
      ? "rgba(248, 242, 223, 0.62)"
      : regularFrameStyle.mutedInk;
  const subjectMaskTitleTextOverArt =
    shouldUseSubjectMaskAsPrimaryArt && activeSubjectMaskSections.has("title");
  const subjectMaskTypeLineTextOverArt =
    shouldUseSubjectMaskAsPrimaryArt && activeSubjectMaskSections.has("typeLine");
  const titleForegroundInk = subjectMaskTitleTextOverArt ? SUBJECT_MASK_TEXT_INK : titleInk;
  const titleForegroundMutedInk = subjectMaskTitleTextOverArt ? SUBJECT_MASK_TEXT_MUTED_INK : titleMutedInk;
  const typeLineForegroundInk = subjectMaskTypeLineTextOverArt ? SUBJECT_MASK_TEXT_INK : typeLineInk;
  const typeLineForegroundMutedInk = subjectMaskTypeLineTextOverArt ? SUBJECT_MASK_TEXT_MUTED_INK : typeLineMutedInk;
  const titleForegroundTextShadow = subjectMaskTitleTextOverArt
    ? getSubjectMaskTextShadow(scale)
    : isRetroTreatment
      ? getRetroTextShadow(scale)
      : {};
  const typeLineForegroundTextShadow = subjectMaskTypeLineTextOverArt
    ? getSubjectMaskTextShadow(scale)
    : isRetroTreatment
      ? getRetroTextShadow(scale)
      : {};
  const statInk =
    isFutureshiftedShowcase
      ? "#f8f2df"
      : showcaseSpec?.textIsLight
      ? "#f8f2df"
    : frameTreatment === "borderless"
      ? "#171512"
      : frameTreatment === "etchedFoil"
      ? "#f8f2df"
      : isRetroTreatment
      ? "#f8f2df"
      : isDfcBack
      ? "#f8f2df"
      : typeFrame === "token"
      ? "#171512"
      : regularFrameStyle.ink;
  const statMutedInk =
    isDfcBack || showcaseSpec?.textIsLight || frameTreatment === "borderless"
      ? "rgba(248, 242, 223, 0.62)"
      : regularFrameStyle.mutedInk;
  const bodyInk = treatmentLayout && treatmentBodyInk ? treatmentBodyInk : typeFrame === "token" ? "#171512" : regularFrameStyle.ink;
  const bodyMutedInk = treatmentLayout && treatmentBodyInk ? getMutedInk(treatmentBodyInk) : regularFrameStyle.mutedInk;
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
  const typeLineColorIndicatorSource = getTypeLineColorIndicatorSource({
    faceCard,
    typeFrame,
    frameIdentity,
    manualFrameColors,
    manaColors,
    colorBlend: mseAccentColorBlend,
    showDfcColorIndicator,
  });
  const typeLineColorIndicatorReserve = getTypeLineColorIndicatorReserve(Boolean(typeLineColorIndicatorSource));
  const typeLineBaseFontSize = isRetroTreatment ? 17 : typeFrame === "saga" ? 14.2 : 14;
  const typeLineFontSize = getTypeLineFontSize(
    faceCard.typeLine,
    typeLineRect.width -
      typeLineRightInset -
      typeLineColorIndicatorReserve -
      getTypeLineEditorReserve(activeSection === "typeLine", scale),
    frameTreatment === "etchedFoil" ? 13 : typeLineBaseFontSize,
  );
  const typeLineTextYOffset =
    Platform.OS === "ios" && typeFrame === "standard" && frameTreatment === "standard"
      ? -2.75 * scale
      : typeFrame === "token"
      ? 3 * scale
      : 0;
  const startArtTransform = useRef(artTransform);
  const initialPinchDistance = useRef<number | null>(null);
  const manaCostInputRef = useRef<TextInput>(null);
  const rawManaCostRenderRect =
    !hasManaSymbols && !isManaCostFocused
      ? { ...defaultManaRect, x: titleBaseRect.x + titleBaseRect.width + 8, width: 0 }
      : isFutureshiftedShowcase && !isManaCostFocused
      ? FUTURESHIFTED_MANA_COST_RECT
      : isManaCostFocused
      ? CARD_COORDINATES.manaCost
      : manaLayout.rect;
  const manaCostRenderRect =
    shouldCalibrateBorderlessExportText && !isManaCostFocused && !isFutureshiftedShowcase
      ? {
          ...rawManaCostRenderRect,
          y: rawManaCostRenderRect.y + (exportCaptureMode ? -2 : 0),
        }
      : rawManaCostRenderRect;
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
        manaSymbols={manaSymbols}
        exportMode={exportMode}
        imageAspectRatio={imageAspectRatio}
        isManaCostFocused={isManaCostFocused}
        setIsManaCostFocused={setIsManaCostFocused}
        updateFace={updateFace}
        onChange={onChange}
        onSectionPress={onSectionPress}
        artPanHandlers={artPanResponder.panHandlers}
        artTransform={artTransform}
        artGenerating={showArtGenerating}
        artGenerationTrailSeed={artGenerationTrailSeed}
        onArtImageSettled={onArtImageSettled}
        footerOwnerName={footerOwnerName}
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
        onChange={onChange}
        onSectionPress={onSectionPress}
        artPanHandlers={artPanResponder.panHandlers}
        artTransform={artTransform}
        artGenerating={showArtGenerating}
        artGenerationTrailSeed={artGenerationTrailSeed}
        onArtImageSettled={onArtImageSettled}
        footerOwnerName={footerOwnerName}
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
        artGenerating={showArtGenerating}
        artGenerationTrailSeed={artGenerationTrailSeed}
        onArtImageSettled={onArtImageSettled}
        footerOwnerName={footerOwnerName}
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
          {!faceCard.artUri && showArtGenerating ? (
            <GeneratingArtAnimation scale={battleScale} colors={frameColors} seed={artGenerationTrailSeed} />
          ) : faceCard.artUri ? (
            <TransformableArtImage
              uri={faceCard.artUri}
              artRect={BATTLE_COORDINATES.art}
              renderScale={battleScale}
              artTransform={artTransform}
              imageAspectRatio={imageAspectRatio}
              showGeneratingTrail={showArtGenerating}
              generatingTrailColors={frameColors}
              generatingTrailSeed={artGenerationTrailSeed}
              onLoad={onArtImageSettled}
              onError={onArtImageSettled}
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
          zIndex: 0,
          elevation: 0,
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
        exportFlattenMasks && showcaseSpec.artMask ? (
          <FlattenedShowcaseMaskedArt
            artUri={faceCard.artUri}
            artRect={artRect}
            artTransform={artTransform}
            imageAspectRatio={imageAspectRatio}
            spec={showcaseSpec}
          />
        ) : (
          <ShowcaseMaskedArt
            cacheKey={`showcase-art-${showcaseFrame}`}
            artUri={faceCard.artUri}
            artRect={artRect}
            artTransform={artTransform}
            imageAspectRatio={imageAspectRatio}
            spec={showcaseSpec}
          />
        )
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
          {!faceCard.artUri && showArtGenerating ? (
            <GeneratingArtAnimation scale={scale} colors={frameColors} seed={artGenerationTrailSeed} />
          ) : faceCard.artUri ? (
            <TransformableArtImage
              uri={faceCard.artUri}
              artRect={artRect}
              renderScale={scale}
              artTransform={artTransform}
              imageAspectRatio={imageAspectRatio}
              showGeneratingTrail={showArtGenerating}
              generatingTrailColors={frameColors}
              generatingTrailSeed={artGenerationTrailSeed}
              onLoad={onArtImageSettled}
              onError={onArtImageSettled}
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
          {!faceCard.artUri && showArtGenerating ? (
            shouldRenderArtBehindTreatmentFrame ? (
              <View pointerEvents="none" style={{ flex: 1 }} />
            ) : (
              <GeneratingArtAnimation scale={scale} colors={frameColors} seed={artGenerationTrailSeed} />
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
              showGeneratingTrail={showArtGenerating}
              generatingTrailColors={frameColors}
              generatingTrailSeed={artGenerationTrailSeed}
              onLoad={onArtImageSettled}
              onError={onArtImageSettled}
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
        showcaseSpec && showcaseFrameBlendSources ? (
          <>
            {exportFlattenMasks ? (
              <ShowcaseFlattenedFrameLayers
                cacheKey={`showcase-${showcaseFrame}-${resolvedMseColorBlend?.mode ?? "blend"}-${resolvedMseColorBlend?.key ?? frameColors.join("")}`}
                source={showcaseFrameBlendSources.left}
                splitSources={showcaseFrameBlendSources}
                spec={showcaseSpec}
                mirrorX={Boolean(resolvedMseColorBlend?.mirrorX)}
              />
            ) : (
              <ShowcaseFrameBlendImage
                cacheKey={`showcase-${showcaseFrame}-${resolvedMseColorBlend?.mode ?? "blend"}-${resolvedMseColorBlend?.key ?? frameColors.join("")}`}
                sources={showcaseFrameBlendSources}
                spec={showcaseSpec}
                mirrorX={Boolean(resolvedMseColorBlend?.mirrorX)}
              />
            )}
            <ShowcaseStampTreatmentBlendLayer
              cacheKey={`showcase-${showcaseFrame}-${resolvedMseColorBlend?.mode ?? "blend"}-${resolvedMseColorBlend?.key ?? frameColors.join("")}`}
              sources={showcaseFrameBlendSources}
              frameIdentity={frameIdentity}
              spec={showcaseSpec}
              stamped={securityStamped}
              mirrorX={Boolean(resolvedMseColorBlend?.mirrorX)}
            />
          </>
        ) : showcaseSpec && treatmentFrameSource ? (
          <>
            {exportFlattenMasks ? (
              <ShowcaseFlattenedFrameLayers
                cacheKey={`showcase-${showcaseFrame}`}
                source={treatmentFrameSource}
                spec={showcaseSpec}
              />
            ) : (
              <ShowcaseFrameImage
                cacheKey={`showcase-${showcaseFrame}`}
                source={treatmentFrameSource}
                spec={showcaseSpec}
              />
            )}
            <ShowcaseStampTreatmentLayer
              cacheKey={`showcase-${showcaseFrame}`}
              source={treatmentFrameSource}
              frameIdentity={frameIdentity}
              spec={showcaseSpec}
              stamped={securityStamped}
            />
          </>
        ) : (
          treatmentFrameBlendSources ? (
            <MseSplitFrameImage
              cacheKey={`mainframe-standard-${frameTreatment}-${regularMseColorBlend?.mode ?? "plain"}-${regularMseColorBlend?.key ?? frameColors.join("")}-${securityStamped ? "stamped" : "unstamped"}`}
              sources={treatmentFrameBlendSources}
              mirrorX={Boolean(regularMseColorBlend?.mirrorX ?? resolvedMseColorBlend?.mirrorX)}
              exportMode={exportMode}
            />
          ) : (
            <MseFrameImage
                cacheKey={`mainframe-standard-${frameTreatment}-${regularFrameIdentity}-${regularMainframeColorCacheKey}-${securityStamped ? "stamped" : "unstamped"}`}
                source={
                  treatmentFrameSource ??
                  artifactMainframeColorSource ??
                  getMseM15MainframeSource(regularFrameIdentity, "standard", regularMseColorBlend)
                }
                mirrorX={
                  treatmentFrameMirrorX ??
                  (!hasExactTreatmentFrame &&
                    (artifactMainframeColorSource
                      ? Boolean(mseAccentColorBlend?.mirrorX)
                      : Boolean(regularMseColorBlend?.mirrorX)))
                }
                exportMode={exportMode}
              />
          )
        )
      ) : null}

      {borderlessDarkTextboxFillSource ? (
        <>
          {exportMode ? (
            <DirectFrameImage source={borderlessDarkTextboxFillSource} resizeMode="stretch" />
          ) : (
            <StableFrameImage
              cacheKey={`mainframe-standard-${frameTreatment}-dark-textbox-fill`}
              source={borderlessDarkTextboxFillSource}
              resizeMode="stretch"
            />
          )}
          {borderlessPinlineOnlyRestoreMaskSource ? (
            exportFlattenMasks ? (
              <FlattenedMaskedFrameLayer
                source={borderlessPinlineRestoreSource}
                splitSources={borderlessPinlineRestoreSplitSources}
                maskSource={borderlessPinlineOnlyRestoreMaskSource}
                mirrorX={Boolean(treatmentFrameMirrorX)}
              />
            ) : (
              <MsePinlineOnlyRestoreLayer
                cacheKey={`mainframe-standard-${frameTreatment}-${regularMseColorBlend?.mode ?? "plain"}-${regularMseColorBlend?.key ?? regularFrameIdentity}-${securityStamped ? "stamped" : "unstamped"}-pinline-only`}
                source={borderlessPinlineRestoreSource}
                splitSources={borderlessPinlineRestoreSplitSources}
                maskSource={borderlessPinlineOnlyRestoreMaskSource}
                mirrorX={Boolean(treatmentFrameMirrorX)}
              />
            )
          ) : null}
        </>
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

      {shouldRedrawStandardArtAperture && faceCard.artUri ? (
        <View
          pointerEvents="none"
          style={{
            ...rectStyle(artRect),
            overflow: "hidden",
          }}
        >
          <TransformableArtImage
            uri={faceCard.artUri}
            artRect={artRect}
            renderScale={scale}
            artTransform={artTransform}
            imageAspectRatio={imageAspectRatio}
            fitRect={subjectMaskFitBounds}
            showGeneratingTrail={showArtGenerating}
            generatingTrailColors={frameColors}
            generatingTrailSeed={artGenerationTrailSeed}
            onLoad={onArtImageSettled}
            onError={onArtImageSettled}
          />
        </View>
      ) : null}

      {typeFrame === "saga" ? (
        <>
          <MseFrameImage
            cacheKey="typeframe-saga"
            source={getTypeFrameFrameSource(typeFrame, frameIdentity, mseColorBlend, card)}
            mirrorX={mseColorBlend?.mirrorX}
            exportMode={exportMode}
          />
          <SagaArtSlot
            artRect={artRect}
            artTransform={artTransform}
            faceCard={faceCard}
            scale={scale}
            imageAspectRatio={imageAspectRatio}
            active={activeSection === "art"}
            generating={showArtGenerating}
            generationTrailSeed={artGenerationTrailSeed}
            onArtImageSettled={onArtImageSettled}
            zone={zone}
            onSectionPress={onSectionPress}
            panHandlers={artPanResponder.panHandlers}
          />
        </>
      ) : null}

      {typeFrame === "saga" ? <SagaPaperLayer /> : null}

      {typeFrame !== "standard" && typeFrame !== "saga" ? (
        <StableFrameImage
          cacheKey={
            typeFrame === "token"
              ? `typeframe-token-${frameIdentity}-${tokenFrameVariant}`
              : `typeframe-${typeFrame}`
          }
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

      {shouldUseSubjectMaskAsPrimaryArt && !showArtGenerating ? (
        <SubjectMaskArtOverlay
          faceCard={faceCard}
          artRect={artRect}
          artBounds={subjectMaskFitBounds}
          artTransform={artTransform}
          imageAspectRatio={imageAspectRatio}
          overlayBottomY={subjectMaskOverlayBottomY}
          approvalRects={subjectMaskFrameApprovalRects}
          hardApprovalEdges={!isBorderlessTreatment}
          occludeSoftMaskEdges={isBorderlessTreatment}
          cacheKey={`foreground-subject-mask-${frameTreatment}-${faceCard.artSubjectMaskUri ?? "none"}`}
        />
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => onSectionPress("identity")}
        style={{
          ...rectStyle(titleLayout.rect),
          justifyContent: "center",
          overflow: "hidden",
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
              color: titleForegroundInk,
              fontFamily: isRetroTreatment
                ? FULL_MAGIC_PACK.fontFamilies.retroTitle
                : FULL_MAGIC_PACK.fontFamilies.title,
              fontSize: titleLayout.fontSize * scale,
              lineHeight: titleLayout.lineHeight * scale,
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              textAlign: typeFrame === "token" ? "center" : "left",
              ...EXPORT_TITLE_KERNING_FIX,
              ...titleForegroundTextShadow,
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
            autoCapitalize="words"
            onFocus={() => onSectionPress("identity")}
            placeholder="Untitled"
            placeholderTextColor={titleForegroundMutedInk}
            numberOfLines={1}
            style={{
              color: titleForegroundInk,
              fontFamily: isRetroTreatment
                ? FULL_MAGIC_PACK.fontFamilies.retroTitle
              : FULL_MAGIC_PACK.fontFamilies.title,
              ...getWebSafeEditableTextMetrics(
                titleLayout.fontSize * scale,
                titleLayout.lineHeight * scale,
              ),
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              flexShrink: 1,
              height: titleLayout.lineHeight * scale,
              textAlign: typeFrame === "token" ? "center" : "left",
              ...TITLE_KERNING_FIX,
              ...titleForegroundTextShadow,
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
              color: titleForegroundInk,
              opacity: 0.86,
              fontFamily: isRetroTreatment
                ? FULL_MAGIC_PACK.fontFamilies.retroTitle
                : FULL_MAGIC_PACK.fontFamilies.title,
              fontSize: titleLayout.baseNameFontSize * scale,
              lineHeight: titleLayout.baseNameLineHeight * scale,
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              textAlign: typeFrame === "token" ? "center" : "left",
              ...TITLE_KERNING_FIX,
              ...titleForegroundTextShadow,
              includeFontPadding: false,
            }}
          >
            {baseCardName}
          </Text>
        ) : null}
      </Pressable>

      {cardSkinAliasSource || showsCardSkinAlias ? (
        <>
          {cardSkinAliasSource ? (
            <StableFrameImage
              cacheKey={`godzilla-alias-${frameIdentity}-${mseColorBlend?.mode ?? "single"}-${mseColorBlend?.key ?? "none"}`}
              source={cardSkinAliasSource}
              resizeMode="stretch"
              containerStyle={{ zIndex: 4 }}
            />
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit base card name"
            onPress={() => onSectionPress("identity", { openSheet: true })}
            style={{
              ...rectStyle(cardSkinAliasRect),
              alignItems: "center",
              justifyContent: usesBorderlessGodzillaLegendaryOverlay ? "flex-end" : "center",
              paddingBottom: usesBorderlessGodzillaLegendaryOverlay ? 1 * scale : 0,
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
                fontSize: (usesBorderlessGodzillaLegendaryOverlay ? 10 : 12) * scale,
                fontWeight: "400",
                lineHeight: (usesBorderlessGodzillaLegendaryOverlay ? 12 : 14) * scale,
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
            placeholderTextColor={titleForegroundMutedInk}
            numberOfLines={1}
            autoCapitalize="characters"
            style={{
              width: "100%",
              color: titleForegroundInk,
              fontFamily: FULL_MAGIC_PACK.fontFamilies.title,
              ...getWebSafeEditableTextMetrics(
                getManaCostEditorFontSize(faceCard.manaCost, defaultManaRect.width) * scale,
                17 * scale,
              ),
              padding: 0,
              textAlign: "right",
              backgroundColor: "transparent",
              ...titleForegroundTextShadow,
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
              ink={typeLineForegroundInk}
              onPress={() => onSectionPress("typeLine", { openSheet: true })}
            />
          ) : null}
          {typeLineColorIndicatorSource ? (
            <View
              pointerEvents="none"
              style={{
                alignItems: "center",
                justifyContent: "center",
                marginRight: TYPE_LINE_COLOR_INDICATOR_TEXT_GAP * scale,
              }}
            >
              <Image
                accessibilityIgnoresInvertColors
                source={typeLineColorIndicatorSource}
                resizeMode="contain"
                style={{
                  width: TYPE_LINE_COLOR_INDICATOR_SIZE * scale,
                  height: TYPE_LINE_COLOR_INDICATOR_SIZE * scale,
                }}
              />
            </View>
          ) : null}
          {exportMode ? (
            <Text
              accessibilityLabel="Type line"
              numberOfLines={1}
              selectable={false}
              style={{
                color: typeLineForegroundInk,
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
                ...typeLineForegroundTextShadow,
              }}
            >
              {faceCard.typeLine || "Card Type"}
            </Text>
          ) : (
            <TextInput
              accessibilityLabel="Type line"
              value={faceCard.typeLine}
              onChangeText={updateTypeLine}
              autoCapitalize="words"
              onChange={updateTypeLineCursor}
              onFocus={() => onSectionPress("typeLine")}
              onPressIn={() => onSectionPress("typeLine")}
              onSelectionChange={updateTypeLineCursor}
              placeholder="Card Type"
              placeholderTextColor={typeLineForegroundMutedInk}
              numberOfLines={1}
              style={{
                color: typeLineForegroundInk,
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
                ...typeLineForegroundTextShadow,
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
                value={displayedAdventureRulesText}
                color={frameStyle.ink}
                fontFamily={FULL_MAGIC_PACK.fontFamilies.body}
                italicFontFamily={FULL_MAGIC_PACK.fontFamilies.italic}
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
            ...rectStyle(rulesSheetHitRect),
            ...showcaseEditableHitPriority,
            // z0 (rendered after the frame catch-all) keeps this above the frame
            // ring but below later interactive zones (power/toughness, inline
            // rules text) so they stay tappable.
            zIndex: 0,
            elevation: 0,
          }}
        />
      ) : null}

      {typeFrame !== "saga" && !isTextlessTreatment && rulesLayout.showRules ? (
        <Pressable
          accessibilityRole="button"
          onPress={handleRulesTextPress}
          style={{
            ...rectStyle(rulesLayout.rulesRect),
            justifyContent: "center",
            ...showcaseEditableHitPriority,
            zIndex: 3,
            elevation: 3,
          }}
        >
          {activeSection === "rules" ? (
            <>
              {displayedKeywordRulesText.trim().length > 0 ? (
                <View
                  pointerEvents="none"
                  style={{
                    width: "100%",
                    height: activeKeywordRulesHeightScaled,
                    position: "absolute",
                    top: rulesContentVerticalInset,
                    left: 0,
                    overflow: "hidden",
                  }}
                >
                  <InlineSymbolText
                    value={displayedKeywordRulesText}
                    color={rulesTextInk}
                    fontFamily={isRetroTreatment ? FULL_MAGIC_PACK.fontFamilies.retroBody : FULL_MAGIC_PACK.fontFamilies.body}
                    italicFontFamily={isRetroTreatment ? FULL_MAGIC_PACK.fontFamilies.retroItalic : FULL_MAGIC_PACK.fontFamilies.italic}
                    fontSize={rulesLayout.rulesFontSize * scale}
                    lineHeight={rulesLayout.rulesLineHeight * scale}
                    symbolSize={rulesLayout.rulesFontSize * scale * 1.18}
                    symbolVariant={isRetroTreatment ? "retro" : "modern"}
                    textAlign={rulesLayout.centerRulesContent ? "center" : "left"}
                  />
                </View>
              ) : null}
              <TextInput
                accessibilityLabel="Rules text"
                value={faceCard.rulesText}
                onChangeText={(rulesText) => updateFace({ rulesText })}
                onFocus={() => onSectionPress("rules")}
                placeholder={displayedKeywordRulesText.trim().length > 0 ? "" : "Rules text"}
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
                  height: activeRulesInputHeight,
                  position: "absolute",
                  top: activeRulesInputTop,
                  left: 0,
                  paddingTop: 0,
                  paddingBottom: rulesContentPaddingBottom,
                  paddingHorizontal: 0,
                  overflow: "hidden",
                  backgroundColor: "transparent",
                  textAlign: rulesLayout.centerRulesContent ? "center" : "left",
                  textAlignVertical: "top",
                }}
              />
            </>
          ) : (
            <View
              pointerEvents="none"
              style={{
                width: "100%",
                height: Math.max(
                  rulesLayout.rulesLineHeight * scale,
                  rulesLayout.centerRulesContent
                    ? compactRulesContentHeightScaled
                    : displayedRulesContentHeightScaled,
                ),
                position: "absolute",
                top: rulesContentVerticalInset,
                left: 0,
                justifyContent: "center",
              }}
            >
              <InlineSymbolText
                value={displayedRulesText}
                color={rulesTextInk}
                fontFamily={isRetroTreatment ? FULL_MAGIC_PACK.fontFamilies.retroBody : FULL_MAGIC_PACK.fontFamilies.body}
                italicFontFamily={isRetroTreatment ? FULL_MAGIC_PACK.fontFamilies.retroItalic : FULL_MAGIC_PACK.fontFamilies.italic}
                fontSize={rulesLayout.rulesFontSize * scale}
                lineHeight={rulesLayout.rulesLineHeight * scale}
                symbolSize={rulesLayout.rulesFontSize * scale * 1.18}
                symbolVariant={isRetroTreatment ? "retro" : "modern"}
                textAlign={rulesLayout.centerRulesContent ? "center" : "left"}
              />
            </View>
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
            zIndex: 3,
            elevation: 3,
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
          onPress={handleFlavorTextPress}
          style={{
            ...rectStyle(rulesLayout.flavorRect),
            justifyContent: activeSection === "rules" ? "flex-start" : "center",
            ...showcaseEditableHitPriority,
            zIndex: 3,
            elevation: 3,
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
            <View
              pointerEvents="none"
              style={{
                width: "100%",
                height: Math.max(rulesLayout.flavorLineHeight * scale, displayedFlavorContentHeightScaled),
                position: "absolute",
                top: displayedFlavorVerticalInset,
                left: 0,
                justifyContent: "center",
              }}
            >
              <InlineSymbolText
                value={displayedFlavorText}
                color={rulesTextInk}
                fontFamily={isRetroTreatment ? FULL_MAGIC_PACK.fontFamilies.retroItalic : FULL_MAGIC_PACK.fontFamilies.italic}
                fontSize={rulesLayout.flavorFontSize * scale}
                lineHeight={rulesLayout.flavorLineHeight * scale}
                symbolSize={rulesLayout.flavorFontSize * scale * 1.18}
                symbolVariant={isRetroTreatment ? "retro" : "modern"}
              />
            </View>
          )}
        </Pressable>
      ) : null}

      {typeFrame !== "saga" && !isTextlessTreatment && activeSection === "rules" ? (
        <View
          pointerEvents="none"
          style={{
            ...rectStyle(rulesSheetZoneRect),
            zIndex: 31,
            elevation: 31,
            ...zone("rules", 3),
          }}
        />
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
            usesRarityTreatment={card.setSymbolUsesRarityTreatment}
            rarity={card.rarity}
            size={getSetSymbolMarkSize(20 * scale, card)}
            exportMode={exportMode || exportSetSymbolMode}
            exportFlattenMasks={exportFlattenMasks}
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
          <RetroPrintingFooter card={card} scale={scale} footerOwnerName={footerOwnerName} />
        ) : (
          <ModernPrintingFooter
            card={card}
            scale={scale}
            hasPowerToughness={showPowerToughness}
            variant={isFutureshiftedShowcase ? "futureshifted" : typeFrame === "token" ? "token" : "card"}
            footerOwnerName={footerOwnerName}
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
  artGenerating,
  artGenerationTrailSeed,
  onArtImageSettled,
  footerOwnerName,
  onSectionPress,
  zone,
}: {
  card: CardDraft;
  width: number;
  cornerRadius: number;
  scale: number;
  exportMode: boolean;
  artGenerating: boolean;
  artGenerationTrailSeed?: string;
  onArtImageSettled?: (uri: string) => void;
  footerOwnerName?: string;
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
          exportMode={exportMode}
          artGenerating={artGenerating}
          generationTrailSeed={artGenerationTrailSeed}
          onArtImageSettled={onArtImageSettled}
          onSectionPress={onSectionPress}
          zone={zone}
        />
      ) : (
        <ClassicSplitPreview
          card={card}
          leftHalf={leftHalf}
          rightHalf={rightHalf}
          scale={scale}
          exportMode={exportMode}
          artGenerating={artGenerating}
          generationTrailSeed={artGenerationTrailSeed}
          onArtImageSettled={onArtImageSettled}
          footerOwnerName={footerOwnerName}
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
  exportMode,
  artGenerating,
  generationTrailSeed,
  onArtImageSettled,
  footerOwnerName,
  onSectionPress,
  zone,
}: {
  card: CardDraft;
  leftHalf: SplitCardHalf;
  rightHalf: SplitCardHalf;
  scale: number;
  exportMode: boolean;
  artGenerating: boolean;
  generationTrailSeed?: string;
  onArtImageSettled?: (uri: string) => void;
  footerOwnerName?: string;
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
        exportMode={exportMode}
        artGenerating={artGenerating}
        generationTrailSeed={generationTrailSeed}
        onArtImageSettled={onArtImageSettled}
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
        exportMode={exportMode}
        artGenerating={artGenerating}
        generationTrailSeed={generationTrailSeed}
        onArtImageSettled={onArtImageSettled}
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
        footerOwnerName={footerOwnerName}
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
  exportMode,
  artGenerating,
  generationTrailSeed,
  onArtImageSettled,
  onSectionPress,
  zone,
}: {
  card: CardDraft;
  half: SplitCardHalf;
  side: "left" | "right";
  fuse: boolean;
  rect: CoordinateRect;
  scale: number;
  exportMode: boolean;
  artGenerating: boolean;
  generationTrailSeed?: string;
  onArtImageSettled?: (uri: string) => void;
  onSectionPress: SectionPressHandler;
  zone: (section: CardSection, radius?: number) => Record<string, unknown>;
}) {
  const halfCard = toSplitHalfCard(card, half);
  const frameIdentity = inferFrameIdentity(halfCard);
  const frameStyle = inferFrameStyle(halfCard);
  const displayedRulesText = resolveRulesTextCardNameToken(getDisplayRulesText(halfCard), half.name);
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
          artGenerating={artGenerating}
          generationTrailSeed={generationTrailSeed}
          onArtImageSettled={onArtImageSettled}
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
            usesRarityTreatment={card.setSymbolUsesRarityTreatment}
            rarity={card.rarity}
            size={getSetSymbolMarkSize(16 * scale, card)}
            exportMode={exportMode}
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
            italicFontFamily={FULL_MAGIC_PACK.fontFamilies.italic}
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
  artGenerating,
  generationTrailSeed,
  onArtImageSettled,
  onSectionPress,
  zone,
}: {
  card: CardDraft;
  half: SplitCardHalf;
  frameIdentity: FrameIdentity;
  scale: number;
  artGenerating: boolean;
  generationTrailSeed?: string;
  onArtImageSettled?: (uri: string) => void;
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
      {!card.artUri && artGenerating ? (
        <GeneratingArtAnimation scale={scale} colors={getFrameColors(card)} seed={generationTrailSeed} />
      ) : card.artUri ? (
        <>
          <Image
            accessibilityIgnoresInvertColors
            source={{ uri: card.artUri }}
            resizeMode="cover"
            onLoad={() => card.artUri && onArtImageSettled?.(card.artUri)}
            onError={() => card.artUri && onArtImageSettled?.(card.artUri)}
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
          {artGenerating ? (
            <View pointerEvents="none" style={{ position: "absolute", inset: 0 }}>
              <GeneratingArtAnimation
                scale={scale}
                colors={getFrameColors(card)}
                seed={generationTrailSeed}
                label="Loading art"
              />
            </View>
          ) : null}
        </>
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
          italicFontFamily={FULL_MAGIC_PACK.fontFamilies.italic}
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
  footerOwnerName,
  onSectionPress,
  zone,
}: {
  card: CardDraft;
  scale: number;
  footerOwnerName?: string;
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
        text={getCardMagicFooterCopyrightLine(card, footerOwnerName)}
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
  exportMode,
  artGenerating,
  generationTrailSeed,
  onArtImageSettled,
  onSectionPress,
  zone,
}: {
  card: CardDraft;
  leftHalf: SplitCardHalf;
  rightHalf: SplitCardHalf;
  scale: number;
  exportMode: boolean;
  artGenerating: boolean;
  generationTrailSeed?: string;
  onArtImageSettled?: (uri: string) => void;
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
  const displayedTopRulesText = resolveRulesTextCardNameToken(getDisplayRulesText(topCard), leftHalf.name);
  const displayedBottomRulesText = resolveRulesTextCardNameToken(getDisplayRulesText(bottomCard), rightHalf.name);
  const topRulesMetrics = getAftermathTopRulesMetrics(displayedTopRulesText);
  const bottomRulesMetrics = getSplitHalfRulesMetrics(
    displayedBottomRulesText,
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
        artGenerating={artGenerating}
        generationTrailSeed={generationTrailSeed}
        onArtImageSettled={onArtImageSettled}
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
          usesRarityTreatment={card.setSymbolUsesRarityTreatment}
          rarity={card.rarity}
          size={getSetSymbolMarkSize(20 * scale, card)}
          exportMode={exportMode}
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
          value={displayedTopRulesText}
          color={topFrameStyle.ink}
          fontFamily={FULL_MAGIC_PACK.fontFamilies.body}
          italicFontFamily={FULL_MAGIC_PACK.fontFamilies.italic}
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
        artGenerating={artGenerating}
        generationTrailSeed={generationTrailSeed}
        onArtImageSettled={onArtImageSettled}
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
              value={displayedBottomRulesText}
              color={bottomFrameStyle.ink}
              fontFamily={FULL_MAGIC_PACK.fontFamilies.body}
              italicFontFamily={FULL_MAGIC_PACK.fontFamilies.italic}
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
  artGenerating,
  generationTrailSeed,
  onArtImageSettled,
  zone,
  label,
  onPress,
}: {
  rect: CoordinateRect;
  frameIdentity: FrameIdentity;
  card: CardDraft;
  scale: number;
  artGenerating: boolean;
  generationTrailSeed?: string;
  onArtImageSettled?: (uri: string) => void;
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
      {!card.artUri && artGenerating ? (
        <GeneratingArtAnimation scale={scale} colors={getFrameColors(card)} seed={generationTrailSeed} />
      ) : card.artUri ? (
        <>
          <Image
            accessibilityIgnoresInvertColors
            source={{ uri: card.artUri }}
            resizeMode="cover"
            onLoad={() => card.artUri && onArtImageSettled?.(card.artUri)}
            onError={() => card.artUri && onArtImageSettled?.(card.artUri)}
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
          {artGenerating ? (
            <View pointerEvents="none" style={{ position: "absolute", inset: 0 }}>
              <GeneratingArtAnimation
                scale={scale}
                colors={getFrameColors(card)}
                seed={generationTrailSeed}
                label="Loading art"
              />
            </View>
          ) : null}
        </>
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
  const baseFlavorFontSize = baseRulesFontSize;
  const baseFlavorLineHeight = baseRulesLineHeight;
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
  const sharedTextScale = Math.min(rulesScale, flavorScale);

  return {
    rulesFontSize: baseRulesFontSize * sharedTextScale,
    rulesLineHeight: baseRulesLineHeight * sharedTextScale,
    flavorFontSize: baseFlavorFontSize * sharedTextScale,
    flavorLineHeight: baseFlavorLineHeight * sharedTextScale,
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
  onChange,
  onSectionPress,
  artPanHandlers,
  artTransform,
  artGenerating,
  artGenerationTrailSeed,
  onArtImageSettled,
  footerOwnerName,
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
  onChange: (patch: Partial<CardDraft>) => void;
  onSectionPress: SectionPressHandler;
  artPanHandlers: ReturnType<typeof PanResponder.create>["panHandlers"];
  artTransform: ArtTransform;
  artGenerating: boolean;
  artGenerationTrailSeed?: string;
  onArtImageSettled?: (uri: string) => void;
  footerOwnerName?: string;
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
        {!faceCard.artUri && artGenerating ? (
          <GeneratingArtAnimation scale={scale} colors={getFrameColors(faceCard)} seed={artGenerationTrailSeed} />
        ) : faceCard.artUri ? (
          <TransformableArtImage
            uri={faceCard.artUri}
            artRect={PLANESWALKER_COORDINATES.art}
            renderScale={scale}
            artTransform={artTransform}
            imageAspectRatio={imageAspectRatio}
            showGeneratingTrail={artGenerating}
            generatingTrailColors={getFrameColors(faceCard)}
            generatingTrailSeed={artGenerationTrailSeed}
            onLoad={onArtImageSettled}
            onError={onArtImageSettled}
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
          usesRarityTreatment={card.setSymbolUsesRarityTreatment}
          rarity={card.rarity}
          size={getSetSymbolMarkSize(38 * scale, card)}
          exportMode={exportMode}
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
                  italicFontFamily={FULL_MAGIC_PACK.fontFamilies.italic}
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
        <ModernPrintingFooter card={card} scale={scale * 2} footerOwnerName={footerOwnerName} />
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
  manaSymbols,
  exportMode,
  imageAspectRatio,
  isManaCostFocused,
  setIsManaCostFocused,
  updateFace,
  onChange,
  onSectionPress,
  artPanHandlers,
  artTransform,
  artGenerating,
  artGenerationTrailSeed,
  onArtImageSettled,
  footerOwnerName,
  zone,
}: {
  card: CardDraft;
  faceCard: CardDraft;
  activeSection: CardSection | null;
  width: number;
  cornerRadius: number;
  scale: number;
  frameIdentity: ReturnType<typeof inferFrameIdentity>;
  manaSymbols: string[];
  exportMode: boolean;
  imageAspectRatio?: number | null;
  isManaCostFocused: boolean;
  setIsManaCostFocused: (focused: boolean) => void;
  updateFace: (patch: Partial<CardDraft>) => void;
  onChange: (patch: Partial<CardDraft>) => void;
  onSectionPress: SectionPressHandler;
  artPanHandlers: ReturnType<typeof PanResponder.create>["panHandlers"];
  artTransform: ArtTransform;
  artGenerating: boolean;
  artGenerationTrailSeed?: string;
  onArtImageSettled?: (uri: string) => void;
  footerOwnerName?: string;
  zone: (section: CardSection, radius?: number) => Record<string, unknown>;
}) {
  const defenseValue = card.defense?.trim() || "3";
  const displayedFlavorText = normalizeDisplayMultilineText(faceCard.flavorText);
  const hasFlavor = displayedFlavorText.trim().length > 0;
  const displayedRulesText = resolveRulesTextCardNameToken(getDisplayRulesText(faceCard), faceCard.name);
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
        {!faceCard.artUri && artGenerating ? (
          <GeneratingArtAnimation scale={scale} colors={getFrameColors(faceCard)} seed={artGenerationTrailSeed} />
        ) : faceCard.artUri ? (
          <TransformableArtImage
            uri={faceCard.artUri}
            artRect={BATTLE_COORDINATES.art}
            renderScale={scale}
            artTransform={artTransform}
            imageAspectRatio={imageAspectRatio}
            showGeneratingTrail={artGenerating}
            generatingTrailColors={getFrameColors(faceCard)}
            generatingTrailSeed={artGenerationTrailSeed}
            onLoad={onArtImageSettled}
            onError={onArtImageSettled}
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
              usesRarityTreatment={card.setSymbolUsesRarityTreatment}
              rarity={card.rarity}
              size={getSetSymbolMarkSize(20 * scale, card)}
              exportMode={exportMode}
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
                        rulesFontSize * scale,
                        rulesLineHeight * scale,
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
                  italicFontFamily={FULL_MAGIC_PACK.fontFamilies.italic}
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
                      fontSize={rulesFontSize * scale}
                      lineHeight={rulesLineHeight * scale}
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
        <ModernPrintingFooter card={card} scale={scale} variant="battle" footerOwnerName={footerOwnerName} />
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
  generationTrailSeed,
  onArtImageSettled,
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
  generationTrailSeed?: string;
  onArtImageSettled?: (uri: string) => void;
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
      {!faceCard.artUri && generating ? (
        <GeneratingArtAnimation scale={scale} colors={getFrameColors(faceCard)} seed={generationTrailSeed} />
      ) : faceCard.artUri ? (
        <TransformableArtImage
          uri={faceCard.artUri}
          artRect={artRect}
          renderScale={scale}
          artTransform={artTransform}
          imageAspectRatio={imageAspectRatio}
          showGeneratingTrail={generating}
          generatingTrailColors={getFrameColors(faceCard)}
          generatingTrailSeed={generationTrailSeed}
          onLoad={onArtImageSettled}
          onError={onArtImageSettled}
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
                    italicFontFamily={FULL_MAGIC_PACK.fontFamilies.italic}
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
  italicFontFamily = fontFamily,
  fontSize,
  lineHeight,
  symbolSize,
}: {
  value: string;
  color: string;
  fontFamily: string;
  italicFontFamily?: string;
  fontSize: number;
  lineHeight: number;
  symbolSize: number;
}) {
  if (INLINE_MANA_SYMBOL_PATTERN.test(value) || INLINE_PARENTHETICAL_TEXT_PATTERN.test(value)) {
    return (
      <InlineSymbolText
        value={value}
        color={color}
        fontFamily={fontFamily}
        italicFontFamily={italicFontFamily}
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
  italicFontFamily = fontFamily,
  fontSize,
  lineHeight,
  symbolSize,
  symbolVariant = "modern",
  textAlign = "left",
}: {
  value: string;
  color: string;
  fontFamily: string;
  italicFontFamily?: string;
  fontSize: number;
  lineHeight: number;
  symbolSize: number;
  symbolVariant?: "modern" | "retro";
  textAlign?: "left" | "center";
}) {
  if (!INLINE_MANA_SYMBOL_PATTERN.test(value) && !INLINE_PARENTHETICAL_TEXT_PATTERN.test(value) && !value.includes("\n")) {
    return (
      <Text
        selectable={false}
        style={{
          width: "100%",
          color,
          fontFamily,
          fontSize,
          lineHeight,
          includeFontPadding: false,
          textAlign,
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
        justifyContent: textAlign === "center" ? "center" : "flex-start",
        width: "100%",
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
              fontFamily: token.italic ? italicFontFamily : fontFamily,
              fontSize,
              lineHeight,
              includeFontPadding: false,
              textAlign,
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
const INLINE_PARENTHETICAL_TEXT_PATTERN = /\([^)]*\)/;

function tokenizeInlineSymbols(value: string): Array<
  | { type: "text"; value: string; italic?: boolean }
  | { type: "symbol"; value: string }
  | { type: "newline"; value: string; blank?: boolean }
> {
  const tokens: Array<
    | { type: "text"; value: string; italic?: boolean }
    | { type: "symbol"; value: string }
    | { type: "newline"; value: string; blank?: boolean }
  > = [];
  const pattern = /(\{[^}]+\}|\([^)]*\)|\n)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value)) !== null) {
    if (match.index > cursor) {
      pushTextTokens(tokens, value.slice(cursor, match.index));
    }

    const rawToken = match[0];

    if (rawToken === "\n") {
      tokens.push({ type: "newline", value: rawToken, blank: tokens[tokens.length - 1]?.type === "newline" });
    } else if (rawToken.startsWith("(") && rawToken.endsWith(")")) {
      pushTextTokens(tokens, rawToken, true);
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
    | { type: "text"; value: string; italic?: boolean }
    | { type: "symbol"; value: string }
    | { type: "newline"; value: string; blank?: boolean }
  >,
  text: string,
  italic = false,
) {
  const parts = text.match(/\S+\s*|\s+/g) ?? [];

  for (const part of parts) {
    tokens.push({ type: "text", value: part, italic });
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

  if (
    cacheKey.includes("dark-textbox-fill") ||
    cacheKey.includes("transparent-textbox") ||
    cacheKey.includes("pinline-only")
  ) {
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

function StableFrameImageImpl({
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

function DirectFrameImageImpl({
  source,
  resizeMode = "stretch",
}: {
  source: ImageSourcePropType;
  resizeMode?: StableFrameImageResizeMode;
}) {
  return (
    <Image
      accessibilityIgnoresInvertColors
      source={source}
      resizeMode={resizeMode}
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
  );
}

function readBlobUriAsDataUri(uri: string): Promise<string> {
  return fetch(uri)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Image fetch failed with ${response.status}.`);
      }

      return response.blob();
    })
    .then((blob) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        typeof reader.result === "string"
          ? resolve(reader.result)
          : reject(new Error("Image blob could not be converted to a data URI."));
      };
      reader.onerror = () => {
        reject(reader.error ?? new Error("Image blob could not be read."));
      };
      reader.readAsDataURL(blob);
    }));
}

function useSvgCompatibleArtUri(uri?: string | null) {
  const [resolvedUri, setResolvedUri] = useState(uri ?? null);

  useEffect(() => {
    let cancelled = false;
    setResolvedUri(uri ?? null);

    if (
      Platform.OS !== "web" ||
      !uri ||
      !uri.startsWith("blob:") ||
      typeof fetch !== "function" ||
      typeof FileReader === "undefined"
    ) {
      return () => {
        cancelled = true;
      };
    }

    readBlobUriAsDataUri(uri)
      .then((dataUri) => {
        if (!cancelled) {
          setResolvedUri(dataUri);
        }
      })
      .catch((error) => {
        console.warn("Unable to stabilize uploaded art URI for preview rendering.", error);
      });

    return () => {
      cancelled = true;
    };
  }, [uri]);

  return resolvedUri;
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
  const resolvedArtUri = useSvgCompatibleArtUri(artUri);

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
      : maskRect.y + maskRect.height;
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
        {resolvedArtUri ? (
          <G transform={artTransformSvg}>
            <SvgImage
              href={{ uri: resolvedArtUri } as never}
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

function FlattenedShowcaseMaskedArt({
  artUri,
  artRect,
  artTransform,
  imageAspectRatio,
  spec,
}: {
  artUri?: string;
  artRect: CoordinateRect;
  artTransform: ArtTransform;
  imageAspectRatio?: number | null;
  spec: ShowcaseFrameSpec;
}) {
  const [uri, setUri] = useState<string | null>(null);
  const maskUri = spec.artMask ? getImageSourceUri(spec.artMask.source) : null;
  const overlayUri = spec.artOverlay ? getImageSourceUri(spec.artOverlay.source) : null;
  const maskRect =
    spec.artMask?.coordinateSpace === "card"
      ? { x: 0, y: 0, width: CARD_COORDINATES.width, height: CARD_COORDINATES.height }
      : artRect;

  useEffect(() => {
    if (Platform.OS !== "web" || !maskUri || typeof document === "undefined") {
      return;
    }

    let cancelled = false;
    let settled = false;
    adjustFlattenPending(1);
    const release = () => {
      if (!settled) {
        settled = true;
        adjustFlattenPending(-1);
      }
    };

    compositeFlattenedMaskedArt({
      artUri: artUri ?? null,
      maskUri,
      overlayUri,
      overlayOpacity: spec.artOverlay?.opacity ?? 1,
      artRect,
      maskRect,
      artTransform,
      imageAspectRatio,
      grayscale: spec.artFilter === "grayscale",
    })
      .then((result) => {
        if (!cancelled) {
          setUri(result);
        }
      })
      .catch((error) => {
        console.warn("[CardMagic export] flatten showcase art failed.", error);
      })
      .finally(release);

    return () => {
      cancelled = true;
      release();
    };
  }, [
    artUri,
    maskUri,
    overlayUri,
    spec.artOverlay?.opacity,
    spec.artFilter,
    artRect.x,
    artRect.y,
    artRect.width,
    artRect.height,
    maskRect.x,
    maskRect.y,
    maskRect.width,
    maskRect.height,
    artTransform.offsetX,
    artTransform.offsetY,
    artTransform.scale,
    imageAspectRatio,
  ]);

  if (!uri) {
    return null;
  }

  return (
    <Image
      accessibilityIgnoresInvertColors
      source={{ uri }}
      resizeMode="stretch"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}
    />
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

function ShowcaseStampTreatmentBlendLayer({
  sources,
  frameIdentity,
  spec,
  cacheKey,
  stamped,
  mirrorX = false,
}: {
  sources: SplitFrameSources;
  frameIdentity: FrameIdentity;
  spec: ShowcaseFrameSpec | null;
  cacheKey: string;
  stamped: boolean;
  mirrorX?: boolean;
}) {
  const rimSource = stamped
    ? spec?.stampRimSources?.[frameIdentity]
    : spec?.nonStampRimSources?.[frameIdentity];

  if (!spec || (!rimSource && (!stamped || !spec.stampBorderMask))) {
    return null;
  }

  const stampBorderMaskId = `${cacheKey}-stamp-border-mask`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const blendGradientId = getSvgBlendGradientId(`${cacheKey}-stamp`);
  const blendMaskId = getSvgBlendMaskId(`${cacheKey}-stamp`);

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
            <SvgLinearGradient
              id={blendGradientId}
              x1={mirrorX ? "1" : "0"}
              y1="0"
              x2={mirrorX ? "0" : "1"}
              y2="0"
            >
              <Stop offset="0" stopColor="#ffffff" stopOpacity="0" />
              <Stop offset="0.4" stopColor="#ffffff" stopOpacity="0" />
              <Stop offset="0.6" stopColor="#ffffff" stopOpacity="1" />
              <Stop offset="1" stopColor="#ffffff" stopOpacity="1" />
            </SvgLinearGradient>
            <Mask
              id={blendMaskId}
              x="0"
              y="0"
              width={spec.designWidth}
              height={spec.designHeight}
              maskUnits="userSpaceOnUse"
            >
              <Rect
                x="0"
                y="0"
                width={spec.designWidth}
                height={spec.designHeight}
                fill={`url(#${blendGradientId})`}
              />
            </Mask>
          </Defs>
          <G mask={`url(#${stampBorderMaskId})`}>
            <SvgImage
              href={sources.left as never}
              x={0}
              y={0}
              width={spec.designWidth}
              height={spec.designHeight}
              preserveAspectRatio="none"
            />
            <SvgImage
              href={sources.right as never}
              x={0}
              y={0}
              width={spec.designWidth}
              height={spec.designHeight}
              preserveAspectRatio="none"
              mask={`url(#${blendMaskId})`}
            />
          </G>
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

function ShowcaseFrameImageImpl({
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

function ShowcaseFrameBlendImageImpl({
  sources,
  spec,
  cacheKey,
  mirrorX = false,
}: {
  sources: SplitFrameSources;
  spec: ShowcaseFrameSpec | null;
  cacheKey: string;
  mirrorX?: boolean;
}) {
  const frameMasks = spec?.frameMasks ?? (spec?.frameMask ? [spec.frameMask] : []);

  if (!spec || frameMasks.length === 0) {
    return (
      <ShowcaseLinearBlendImage
        cacheKey={cacheKey}
        sources={sources}
        designWidth={CARD_COORDINATES.width}
        designHeight={CARD_COORDINATES.height}
        mirrorX={mirrorX}
      />
    );
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
        <SvgLinearGradient
          id={getSvgBlendGradientId(cacheKey)}
          x1={mirrorX ? "1" : "0"}
          y1="0"
          x2={mirrorX ? "0" : "1"}
          y2="0"
        >
          <Stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <Stop offset="0.4" stopColor="#ffffff" stopOpacity="0" />
          <Stop offset="0.6" stopColor="#ffffff" stopOpacity="1" />
          <Stop offset="1" stopColor="#ffffff" stopOpacity="1" />
        </SvgLinearGradient>
        <Mask
          id={getSvgBlendMaskId(cacheKey)}
          x="0"
          y="0"
          width={spec.designWidth}
          height={spec.designHeight}
          maskUnits="userSpaceOnUse"
        >
          <Rect
            x="0"
            y="0"
            width={spec.designWidth}
            height={spec.designHeight}
            fill={`url(#${getSvgBlendGradientId(cacheKey)})`}
          />
        </Mask>
      </Defs>
      {frameMasks.map((_, index) => (
        <G key={`${cacheKey}-frame-blend-layer-${index}`} mask={`url(#${getSvgMaskId(cacheKey, index)})`}>
          <SvgImage
            href={sources.left as never}
            x="0"
            y="0"
            width={spec.designWidth}
            height={spec.designHeight}
            preserveAspectRatio="none"
          />
          <SvgImage
            href={sources.right as never}
            x="0"
            y="0"
            width={spec.designWidth}
            height={spec.designHeight}
            preserveAspectRatio="none"
            mask={`url(#${getSvgBlendMaskId(cacheKey)})`}
          />
        </G>
      ))}
    </Svg>
  );
}

function ShowcaseFlattenedFrameLayers({
  source,
  splitSources,
  spec,
  cacheKey,
  mirrorX = false,
}: {
  source: ImageSourcePropType;
  splitSources?: SplitFrameSources | null;
  spec: ShowcaseFrameSpec | null;
  cacheKey: string;
  mirrorX?: boolean;
}) {
  const frameMasks = spec?.frameMasks ?? (spec?.frameMask ? [spec.frameMask] : []);

  if (!spec || frameMasks.length === 0) {
    return splitSources ? (
      <MseSplitFrameImage
        cacheKey={cacheKey}
        sources={splitSources}
        mirrorX={mirrorX}
        exportMode
      />
    ) : (
      <DirectFrameImage source={source} resizeMode="stretch" />
    );
  }

  return (
    <>
      {frameMasks.map((frameMask, index) => (
        <FlattenedMaskedFrameLayer
          key={`${cacheKey}-flattened-showcase-${index}`}
          source={source}
          splitSources={splitSources}
          maskSource={frameMask}
          mirrorX={mirrorX}
        />
      ))}
    </>
  );
}

function ShowcaseLinearBlendImage({
  sources,
  designWidth,
  designHeight,
  cacheKey,
  mirrorX = false,
  maskId,
}: {
  sources: SplitFrameSources;
  designWidth: number;
  designHeight: number;
  cacheKey: string;
  mirrorX?: boolean;
  maskId?: string;
}) {
  const blendGradientId = getSvgBlendGradientId(cacheKey);
  const blendMaskId = getSvgBlendMaskId(cacheKey);

  return (
    <Svg
      pointerEvents="none"
      width="100%"
      height="100%"
      viewBox={`0 0 ${designWidth} ${designHeight}`}
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
        <SvgLinearGradient
          id={blendGradientId}
          x1={mirrorX ? "1" : "0"}
          y1="0"
          x2={mirrorX ? "0" : "1"}
          y2="0"
        >
          <Stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <Stop offset="0.4" stopColor="#ffffff" stopOpacity="0" />
          <Stop offset="0.6" stopColor="#ffffff" stopOpacity="1" />
          <Stop offset="1" stopColor="#ffffff" stopOpacity="1" />
        </SvgLinearGradient>
        <Mask
          id={blendMaskId}
          x="0"
          y="0"
          width={designWidth}
          height={designHeight}
          maskUnits="userSpaceOnUse"
        >
          <Rect x="0" y="0" width={designWidth} height={designHeight} fill={`url(#${blendGradientId})`} />
        </Mask>
      </Defs>
      <SvgImage
        href={sources.left as never}
        x="0"
        y="0"
        width={designWidth}
        height={designHeight}
        preserveAspectRatio="none"
        mask={maskId ? `url(#${maskId})` : undefined}
      />
      <SvgImage
        href={sources.right as never}
        x="0"
        y="0"
        width={designWidth}
        height={designHeight}
        preserveAspectRatio="none"
        mask={maskId ? `url(#${maskId}) url(#${blendMaskId})` : `url(#${blendMaskId})`}
      />
    </Svg>
  );
}

function getSvgMaskId(cacheKey: string, index: number): string {
  return `${cacheKey}-mask-${index}`.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function getSvgBlendGradientId(cacheKey: string): string {
  return `${cacheKey}-blend-gradient`.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function getSvgBlendMaskId(cacheKey: string): string {
  return `${cacheKey}-blend-mask`.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function MseFrameImageImpl({
  source,
  cacheKey,
  mirrorX = false,
  exportMode = false,
}: {
  source: ImageSourcePropType;
  cacheKey: string;
  mirrorX?: boolean;
  exportMode?: boolean;
}) {
  if (Platform.OS === "web" && exportMode) {
    return (
      <View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            width: "100%",
            height: "100%",
          },
          optionalTransformStyle(mirrorX ? [{ scaleX: -1 }] : null),
        ]}
      >
        <DirectFrameImage source={source} resizeMode="stretch" />
      </View>
    );
  }

  return <StableFrameImage cacheKey={cacheKey} source={source} mirrorX={mirrorX} resizeMode="stretch" />;
}

function getImageSourceUri(source: ImageSourcePropType): string | null {
  if (source && typeof source === "object" && "uri" in source && typeof source.uri === "string") {
    return source.uri;
  }

  const resolveAssetSource = (Image as typeof Image & {
    resolveAssetSource?: (source: ImageSourcePropType) => { uri?: string } | null;
  }).resolveAssetSource;

  return resolveAssetSource?.(source)?.uri ?? null;
}

function FlattenedMaskedFrameLayer({
  source,
  splitSources,
  maskSource,
  mirrorX,
}: {
  source: ImageSourcePropType;
  splitSources?: SplitFrameSources | null;
  maskSource: ImageSourcePropType;
  mirrorX: boolean;
}) {
  const [uri, setUri] = useState<string | null>(null);
  const sourceUri = getImageSourceUri(source);
  const leftUri = splitSources ? getImageSourceUri(splitSources.left) : null;
  const rightUri = splitSources ? getImageSourceUri(splitSources.right) : null;
  const maskUri = getImageSourceUri(maskSource);

  useEffect(() => {
    if (Platform.OS !== "web" || !maskUri || typeof document === "undefined") {
      return;
    }
    let cancelled = false;
    let settled = false;
    adjustFlattenPending(1);
    const release = () => {
      if (!settled) {
        settled = true;
        adjustFlattenPending(-1);
      }
    };
    compositeFlattenedMaskedFrame({ sourceUri, leftUri, rightUri, maskUri, mirrorX })
      .then((result) => {
        if (!cancelled) {
          setUri(result);
        }
      })
      .catch((error) => {
        console.warn("[CardMagic export] flatten composite failed.", error);
      })
      .finally(release);
    return () => {
      cancelled = true;
      release();
    };
  }, [sourceUri, leftUri, rightUri, maskUri, mirrorX]);

  if (!uri) {
    return null;
  }

  return (
    <Image
      accessibilityIgnoresInvertColors
      source={{ uri }}
      resizeMode="stretch"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}
    />
  );
}

function MsePinlineOnlyRestoreLayer({
  source,
  splitSources,
  maskSource,
  cacheKey,
  mirrorX = false,
}: {
  source: ImageSourcePropType;
  splitSources?: SplitFrameSources | null;
  maskSource: ImageSourcePropType;
  cacheKey: string;
  mirrorX?: boolean;
}) {
  // SVG mask path, used by the editor and by native export (react-native-view-shot
  // rasterizes react-native-svg fine). Web export instead pre-flattens via
  // FlattenedMaskedFrameLayer, since html2canvas cannot rasterize masks.
  const maskId = `${cacheKey}-mask`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const gradientId = `${cacheKey}-split-gradient`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const rightMaskId = `${cacheKey}-right-mask`.replace(/[^a-zA-Z0-9_-]/g, "-");
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
        <Mask
          id={maskId}
          x="0"
          y="0"
          width={CARD_COORDINATES.width}
          height={CARD_COORDINATES.height}
          maskUnits="userSpaceOnUse"
          {...getSvgMaskTypeProps("luminance")}
        >
          <SvgImage
            href={maskSource as never}
            x="0"
            y="0"
            width={CARD_COORDINATES.width}
            height={CARD_COORDINATES.height}
            preserveAspectRatio="none"
          />
        </Mask>
        {splitSources ? (
          <>
            <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="black" stopOpacity="0" />
              <Stop offset="0.34" stopColor="black" stopOpacity="0" />
              <Stop offset="0.66" stopColor="white" stopOpacity="1" />
              <Stop offset="1" stopColor="white" stopOpacity="1" />
            </SvgLinearGradient>
            <Mask
              id={rightMaskId}
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
          </>
        ) : null}
      </Defs>
      {splitSources ? (
        <>
          <SvgImage
            href={splitSources.left as never}
            x="0"
            y="0"
            width={CARD_COORDINATES.width}
            height={CARD_COORDINATES.height}
            preserveAspectRatio="none"
            mask={`url(#${maskId})`}
            transform={imageTransform}
          />
          <G mask={`url(#${maskId})`}>
            <SvgImage
              href={splitSources.right as never}
              x="0"
              y="0"
              width={CARD_COORDINATES.width}
              height={CARD_COORDINATES.height}
              preserveAspectRatio="none"
              mask={`url(#${rightMaskId})`}
              transform={imageTransform}
              opacity={0.96}
            />
          </G>
        </>
      ) : (
        <SvgImage
          href={source as never}
          x="0"
          y="0"
          width={CARD_COORDINATES.width}
          height={CARD_COORDINATES.height}
          preserveAspectRatio="none"
          mask={`url(#${maskId})`}
          transform={imageTransform}
        />
      )}
    </Svg>
  );
}

function MseSplitFrameImageImpl({
  sources,
  cacheKey,
  mirrorX = false,
  exportMode = false,
}: {
  sources: SplitFrameSources;
  cacheKey: string;
  mirrorX?: boolean;
  exportMode?: boolean;
}) {
  if (Platform.OS === "web" && exportMode) {
    return (
      <>
        <MseFrameImage
          cacheKey={`${cacheKey}-left-export`}
          source={sources.left}
          mirrorX={mirrorX}
          exportMode
        />
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
            opacity: 0.96,
            WebkitMaskImage: "linear-gradient(90deg, transparent 0%, transparent 34%, #000 66%, #000 100%)",
            maskImage: "linear-gradient(90deg, transparent 0%, transparent 34%, #000 66%, #000 100%)",
          } as unknown as ViewStyle}
        >
          <MseFrameImage
            cacheKey={`${cacheKey}-right-export`}
            source={sources.right}
            mirrorX={mirrorX}
            exportMode
          />
        </View>
      </>
    );
  }

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

function MseTextureLayerImpl({
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

function FutureFrameBlendTextureLayerImpl({
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

function FutureFrameMulticolorUnderlayImpl({
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

function SubjectMaskArtOverlay({
  faceCard,
  artRect,
  artBounds,
  artTransform,
  imageAspectRatio,
  overlayBottomY,
  approvalMaskSource,
  approvalRects,
  hardApprovalEdges = false,
  occludeSoftMaskEdges = false,
  cacheKey,
}: {
  faceCard: CardDraft;
  artRect: CoordinateRect;
  artBounds?: CoordinateRect;
  artTransform: ArtTransform;
  imageAspectRatio?: number | null;
  overlayBottomY: number;
  approvalMaskSource?: ImageSourcePropType | null;
  approvalRects?: CoordinateRect[];
  // When set, snap the approval mask's soft (feathered) alpha to a hard 0/1 edge
  // so the subject shows at full opacity within the approved region instead of
  // fading. Used for non-borderless frames; borderless keeps the soft fade.
  hardApprovalEdges?: boolean;
  // Draw a hard-alpha subject underlay below the normal soft mask. This keeps
  // borderless mask edges soft while fully occluding frame pinlines underneath.
  occludeSoftMaskEdges?: boolean;
  cacheKey: string;
}) {
  const resolvedArtUri = useSvgCompatibleArtUri(faceCard.artUri);

  if (!faceCard.artUri || !faceCard.artSubjectMaskUri) {
    return null;
  }

  const maskId = `${cacheKey}-alpha-mask`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const hardMaskId = `${cacheKey}-hard-alpha-mask`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const hardMaskThresholdId = `${cacheKey}-hard-alpha-threshold`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const approvalMaskId = `${cacheKey}-approval-mask`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const approvalThresholdId = `${cacheKey}-approval-threshold`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const clipId = `${cacheKey}-subject-overlay-clip`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const normalizedApprovalRects = (approvalRects ?? []).filter(
    (rect) => rect.width > 0 && rect.height > 0,
  );
  const hasApprovalMask = Boolean(approvalMaskSource || normalizedApprovalRects.length > 0);
  if (!hasApprovalMask) {
    return null;
  }

  const fitBounds = artBounds ?? artRect;
  const fittedLayout = getCoverFittedImageLayout(fitBounds.width, fitBounds.height, imageAspectRatio);
  const artX = fitBounds.x + fittedLayout.left;
  const artY = fitBounds.y + fittedLayout.top;
  const transformedArtRect = getTransformedCoverImageRect(
    { x: artX, y: artY, width: fittedLayout.width, height: fittedLayout.height },
    artTransform,
  );

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
        <Mask
          id={maskId}
          x="0"
          y="0"
          width={CARD_COORDINATES.width}
          height={CARD_COORDINATES.height}
          maskUnits="userSpaceOnUse"
          {...getSvgMaskTypeProps("alpha")}
	        >
	          <SvgImage
	            href={{ uri: faceCard.artSubjectMaskUri } as never}
	            x={transformedArtRect.x}
	            y={transformedArtRect.y}
	            width={transformedArtRect.width}
	            height={transformedArtRect.height}
	            preserveAspectRatio="none"
	          />
	        </Mask>
        {occludeSoftMaskEdges ? (
          <>
            <Filter id={hardMaskThresholdId} x="0" y="0" width="100%" height="100%">
              <FeColorMatrix
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -6.5"
              />
            </Filter>
            <Mask
              id={hardMaskId}
              x="0"
              y="0"
              width={CARD_COORDINATES.width}
              height={CARD_COORDINATES.height}
              maskUnits="userSpaceOnUse"
              {...getSvgMaskTypeProps("alpha")}
            >
              <SvgImage
                href={{ uri: faceCard.artSubjectMaskUri } as never}
                x={transformedArtRect.x}
                y={transformedArtRect.y}
                width={transformedArtRect.width}
                height={transformedArtRect.height}
                preserveAspectRatio="none"
                filter={`url(#${hardMaskThresholdId})`}
              />
            </Mask>
          </>
        ) : null}
        {hasApprovalMask ? (
          <>
            {approvalMaskSource && hardApprovalEdges ? (
              // Snap the approval alpha to a near-binary 0/1 edge: alpha' =
              // clamp(20*alpha - 9.5), so soft feather collapses to a hard cut at
              // ~50%. Removes the partial-transparency bleed on framed cards.
              <Filter id={approvalThresholdId} x="0" y="0" width="100%" height="100%">
                <FeColorMatrix
                  type="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9.5"
                />
              </Filter>
            ) : null}
            <Mask
              id={approvalMaskId}
              x="0"
              y="0"
              width={CARD_COORDINATES.width}
              height={CARD_COORDINATES.height}
              maskUnits="userSpaceOnUse"
              {...getSvgMaskTypeProps("alpha")}
            >
              {approvalMaskSource ? (
                <SvgImage
                  href={approvalMaskSource as never}
                  x="0"
                  y="0"
                  width={CARD_COORDINATES.width}
                  height={CARD_COORDINATES.height}
                  preserveAspectRatio="none"
                  filter={hardApprovalEdges ? `url(#${approvalThresholdId})` : undefined}
                />
              ) : null}
              {normalizedApprovalRects.map((rect, index) => (
                <Rect
                  key={`subject-approval-${index}`}
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                  rx={rect.radius ?? 3}
                  ry={rect.radius ?? 3}
                  fill="#ffffff"
                />
              ))}
            </Mask>
          </>
        ) : null}
        <ClipPath id={clipId}>
          <Rect
            x="0"
            y="0"
            width={CARD_COORDINATES.width}
            height={overlayBottomY}
          />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clipId})`}>
        <G mask={hasApprovalMask ? `url(#${approvalMaskId})` : undefined}>
          {occludeSoftMaskEdges ? (
            <G mask={`url(#${hardMaskId})`}>
              {resolvedArtUri ? (
                <SvgImage
                  href={{ uri: resolvedArtUri } as never}
                  x={transformedArtRect.x}
                  y={transformedArtRect.y}
                  width={transformedArtRect.width}
                  height={transformedArtRect.height}
                  preserveAspectRatio="none"
                />
              ) : null}
            </G>
          ) : null}
          <G mask={`url(#${maskId})`}>
            {resolvedArtUri ? (
              <SvgImage
                href={{ uri: resolvedArtUri } as never}
                x={transformedArtRect.x}
                y={transformedArtRect.y}
                width={transformedArtRect.width}
                height={transformedArtRect.height}
                preserveAspectRatio="none"
              />
            ) : null}
          </G>
        </G>
      </G>
    </Svg>
  );
}

export type SubjectMaskSectionRect = {
  id: SubjectMaskSection;
  label: string;
  approvalRects: CoordinateRect[];
  guideRects: CoordinateRect[];
  rect: CoordinateRect;
};

function getSubjectMaskSectionRects({
  artRect,
  titleRect,
  manaRect,
  typeLineRect,
  setSymbolRect,
  textBoxFrameRect,
}: {
  artRect: CoordinateRect;
  titleRect: CoordinateRect;
  manaRect: CoordinateRect;
  typeLineRect: CoordinateRect;
  setSymbolRect: CoordinateRect;
  textBoxFrameRect: CoordinateRect;
}): SubjectMaskSectionRect[] {
  const titleRects = filterRenderableRects([
    expandRectToPlateEnvelope(
      unionNonEmptyRects([titleRect, manaRect]),
      SUBJECT_MASK_TITLE_PLATE_OUTSETS,
    ),
  ]);
  const typeLineRects = filterRenderableRects([
    expandRectToPlateEnvelope(
      unionNonEmptyRects([typeLineRect, setSymbolRect]),
      SUBJECT_MASK_TYPE_PLATE_OUTSETS,
    ),
  ]);
  const textRects = filterRenderableRects([
    textBoxFrameRect,
  ]);
  const typeLineGuideRects = filterRenderableRects(
    typeLineRects.map((rect) => clampRectBottom(rect, textBoxFrameRect.y - 1)),
  );
  const titleMaskRect = unionNonEmptyRects(titleRects);
  const typeLineMaskRect = unionNonEmptyRects(typeLineRects);
  const textMaskRect = unionNonEmptyRects(textRects);
  const frameEnvelopeBottom = Math.max(
    artRect.y + artRect.height,
    titleMaskRect ? titleMaskRect.y + titleMaskRect.height : 0,
    typeLineMaskRect ? typeLineMaskRect.y + typeLineMaskRect.height : 0,
  );
  const frameEnvelope: CoordinateRect = {
    x: 18,
    y: 18,
    width: CARD_COORDINATES.width - 36,
    height: Math.max(0, Math.min(CARD_COORDINATES.height - 18, frameEnvelopeBottom) - 18),
  };
  const frameRects = subtractRects(
    frameEnvelope,
    filterRenderableRects([
      artRect,
      titleMaskRect,
      typeLineMaskRect,
      textMaskRect,
    ]),
  );

  const sections: Array<SubjectMaskSectionRect | null> = [
    createSubjectMaskSectionRect("frame", "Frame", frameRects),
    createSubjectMaskSectionRect("title", "Title", titleRects),
    createSubjectMaskSectionRect(
      "typeLine",
      "Type",
      typeLineRects,
      typeLineGuideRects.length > 0 ? typeLineGuideRects : typeLineRects,
    ),
    createSubjectMaskSectionRect("text", "Text", textRects),
  ];

  return sections.filter(
    (section): section is SubjectMaskSectionRect =>
      Boolean(section && section.rect.width > 0 && section.rect.height > 0),
  );
}

function getSubjectMaskApprovalRects(
  sectionRects: SubjectMaskSectionRect[],
  activeSections: Set<SubjectMaskSection>,
): CoordinateRect[] {
  return sectionRects
    .filter((section) => activeSections.has(section.id))
    .flatMap((section) => section.approvalRects);
}

function getSubjectMaskExpandedArtBounds(
  artRect: CoordinateRect,
  approvalRects: CoordinateRect[],
): CoordinateRect {
  return unionNonEmptyRects([artRect, ...approvalRects]) ?? artRect;
}

function unionNonEmptyRects(rects: CoordinateRect[]): CoordinateRect | null {
  const nonEmptyRects = rects.filter((rect) => rect.width > 0 && rect.height > 0);

  if (nonEmptyRects.length === 0) {
    return null;
  }

  const left = Math.min(...nonEmptyRects.map((rect) => rect.x));
  const top = Math.min(...nonEmptyRects.map((rect) => rect.y));
  const right = Math.max(...nonEmptyRects.map((rect) => rect.x + rect.width));
  const bottom = Math.max(...nonEmptyRects.map((rect) => rect.y + rect.height));

  return { x: left, y: top, width: right - left, height: bottom - top };
}

function expandRectToPlateEnvelope(
  rect: CoordinateRect | null,
  outsets: { left: number; top: number; right: number; bottom: number; radius?: number },
): CoordinateRect | null {
  if (!rect) {
    return null;
  }

  const left = Math.max(0, rect.x - outsets.left);
  const top = Math.max(0, rect.y - outsets.top);
  const right = Math.min(CARD_COORDINATES.width, rect.x + rect.width + outsets.right);
  const bottom = Math.min(CARD_COORDINATES.height, rect.y + rect.height + outsets.bottom);

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
    radius: outsets.radius,
  };
}

function clampRectBottom(rect: CoordinateRect, maxBottom: number): CoordinateRect | null {
  const bottom = Math.min(rect.y + rect.height, maxBottom);

  if (bottom <= rect.y) {
    return null;
  }

  return {
    ...rect,
    height: bottom - rect.y,
  };
}

function createSubjectMaskSectionRect(
  id: SubjectMaskSection,
  label: string,
  approvalRects: CoordinateRect[],
  guideRects = approvalRects,
): SubjectMaskSectionRect | null {
  const normalizedApprovalRects = filterRenderableRects(approvalRects);
  const normalizedGuideRects = filterRenderableRects(guideRects);
  const rect = unionNonEmptyRects(normalizedGuideRects);

  if (!rect) {
    return null;
  }

  return {
    id,
    label,
    approvalRects: normalizedApprovalRects,
    guideRects: normalizedGuideRects,
    rect,
  };
}

function filterRenderableRects(rects: Array<CoordinateRect | null | undefined>): CoordinateRect[] {
  return rects
    .map((rect) => rect ? clampRectToCard(rect) : null)
    .filter(
      (rect): rect is CoordinateRect =>
        Boolean(rect && Number.isFinite(rect.x) && Number.isFinite(rect.y) && rect.width >= 1 && rect.height >= 1),
    );
}

function clampRectToCard(rect: CoordinateRect): CoordinateRect | null {
  const left = clamp(rect.x, 0, CARD_COORDINATES.width);
  const top = clamp(rect.y, 0, CARD_COORDINATES.height);
  const right = clamp(rect.x + rect.width, 0, CARD_COORDINATES.width);
  const bottom = clamp(rect.y + rect.height, 0, CARD_COORDINATES.height);

  if (right <= left || bottom <= top) {
    return null;
  }

  return { x: left, y: top, width: right - left, height: bottom - top, radius: rect.radius };
}

function subtractRects(baseRect: CoordinateRect, cutterRects: CoordinateRect[]): CoordinateRect[] {
  const base = clampRectToCard(baseRect);

  if (!base) {
    return [];
  }

  return cutterRects.reduce(
    (pieces, cutter) => pieces.flatMap((piece) => subtractRect(piece, cutter)),
    [base],
  );
}

function subtractRect(baseRect: CoordinateRect, cutterRect: CoordinateRect): CoordinateRect[] {
  const intersection = intersectRects(baseRect, cutterRect);

  if (!intersection) {
    return [baseRect];
  }

  const baseRight = baseRect.x + baseRect.width;
  const baseBottom = baseRect.y + baseRect.height;
  const intersectionRight = intersection.x + intersection.width;
  const intersectionBottom = intersection.y + intersection.height;

  return filterRenderableRects([
    rectFromEdges(baseRect.x, baseRect.y, baseRight, intersection.y),
    rectFromEdges(baseRect.x, intersectionBottom, baseRight, baseBottom),
    rectFromEdges(baseRect.x, intersection.y, intersection.x, intersectionBottom),
    rectFromEdges(intersectionRight, intersection.y, baseRight, intersectionBottom),
  ]);
}

function intersectRects(firstRect: CoordinateRect, secondRect: CoordinateRect): CoordinateRect | null {
  const left = Math.max(firstRect.x, secondRect.x);
  const top = Math.max(firstRect.y, secondRect.y);
  const right = Math.min(firstRect.x + firstRect.width, secondRect.x + secondRect.width);
  const bottom = Math.min(firstRect.y + firstRect.height, secondRect.y + secondRect.height);

  return rectFromEdges(left, top, right, bottom);
}

function rectFromEdges(left: number, top: number, right: number, bottom: number): CoordinateRect | null {
  if (right <= left || bottom <= top) {
    return null;
  }

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}

function getTransformedCoverImageRect(rect: CoordinateRect, transform: ArtTransform): CoordinateRect {
  const width = rect.width * transform.scale;
  const height = rect.height * transform.scale;

  return {
    x: rect.x + (rect.width - width) / 2 + transform.offsetX,
    y: rect.y + (rect.height - height) / 2 + transform.offsetY,
    width,
    height,
  };
}

function shouldDrawTreatmentArtOverFrame(treatment: FrameTreatment): boolean {
  return treatment === "retro";
}

function shouldRedrawStandardMaskedArtAperture(treatment: FrameTreatment, faceCard: CardDraft): boolean {
  return (
    treatment === "standard" &&
    Boolean(faceCard.artUri) &&
    Boolean(faceCard.artSubjectMaskUri) &&
    faceCard.artSubjectMaskDisabled !== true
  );
}

function getSetSymbolMarkSize(baseSize: number, card: CardDraft): number {
  const visualBaseSize = baseSize * 0.9;
  return card.setSymbolUri && card.setSymbolUsesRarityTreatment ? visualBaseSize * 1.32 : visualBaseSize;
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
  const treatment = isDfcBack ? card.backFrameTreatment ?? "standard" : card.frameTreatment ?? "standard";
  const typeFrame =
    isBattleBackFace || isDfcBack || (selectedTypeFrame === "dfc" && shouldRenderDfcFrontWithStandardTreatmentGeometry(treatment))
      ? "standard"
      : selectedTypeFrame;
  const showcaseFrame = isDfcBack
    ? card.backShowcaseFrame ?? DEFAULT_SHOWCASE_FRAME
    : card.showcaseFrame ?? DEFAULT_SHOWCASE_FRAME;
  const showcaseSpec =
    typeFrame === "standard" && treatment === "showcase"
      ? getShowcaseFrameSpec(showcaseFrame)
      : null;

  return getArtRect(typeFrame, treatment, showcaseSpec);
}

export function getSubjectMaskSectionRectsForCard(card: CardDraft): SubjectMaskSectionRect[] {
  const selectedTypeFrame = card.typeFrame ?? "standard";
  const isBattleBackFace = selectedTypeFrame === "battle" && isDfcBackFace(card);
  const isBattleFrontFace = selectedTypeFrame === "battle" && !isBattleBackFace;
  const isDfcBack = selectedTypeFrame === "dfc" && isDfcBackFace(card);
  const treatment = isDfcBack ? card.backFrameTreatment ?? "standard" : card.frameTreatment ?? "standard";
  const typeFrame =
    isBattleBackFace || isDfcBack || (selectedTypeFrame === "dfc" && shouldRenderDfcFrontWithStandardTreatmentGeometry(treatment))
      ? "standard"
      : selectedTypeFrame;
  const showcaseFrame = isDfcBack
    ? card.backShowcaseFrame ?? DEFAULT_SHOWCASE_FRAME
    : card.showcaseFrame ?? DEFAULT_SHOWCASE_FRAME;
  const showcaseSpec =
    typeFrame === "standard" && treatment === "showcase"
      ? getShowcaseFrameSpec(showcaseFrame)
      : null;
  const artRect = isBattleFrontFace ? BATTLE_COORDINATES.art : getArtRect(typeFrame, treatment, showcaseSpec);
  const baseTreatmentLayout = typeFrame === "standard" ? FRAME_TREATMENT_LAYOUTS[treatment] : null;
  const treatmentLayout =
    typeFrame === "standard" && showcaseSpec?.id === "futureshifted"
      ? FUTURESHIFTED_TREATMENT_LAYOUT
      : typeFrame === "standard" && showcaseSpec?.id === "stellarSights"
        ? STELLAR_SIGHTS_TREATMENT_LAYOUT
        : baseTreatmentLayout;
  const showDfcColorIndicator = shouldShowDfcColorIndicator(typeFrame, card);
  const typeLineRect =
    typeFrame === "token"
      ? getTokenTypeLineRect(getTokenFrameVariant(card.rulesText, card.flavorText))
      : getTypeLineRect(typeFrame, showDfcColorIndicator);
  const setSymbolRect =
    typeFrame === "token"
      ? getTokenSetSymbolRect(getTokenFrameVariant(card.rulesText, card.flavorText))
      : getSetSymbolRect(typeFrame);

  return getSubjectMaskSectionRects({
    artRect,
    titleRect: treatmentLayout?.name ?? getNameRect(typeFrame, card),
    manaRect: treatmentLayout?.manaCost ?? CARD_COORDINATES.manaCost,
    typeLineRect: treatmentLayout?.typeLine ?? typeLineRect,
    setSymbolRect: treatmentLayout?.setSymbol ?? setSymbolRect,
    textBoxFrameRect: getTextBoxFrameRect(typeFrame, treatmentLayout),
  });
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

  if (treatment === "etchedFoil") {
    return "#f8f2df";
  }

  if (treatment === "borderless") {
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

function getTextBoxFrameRect(
  typeFrame: TypeFrame,
  treatmentLayout?: FrameTreatmentLayout | null,
): CoordinateRect {
  return treatmentLayout?.textBoxFrame ?? getTextAreaRect(typeFrame);
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

function getInlineTextHitBand(
  containerHeight: number,
  contentTopInset: number,
  contentHeight: number,
  padding: number,
): { top: number; height: number } {
  const fallbackHeight = Math.min(containerHeight, 28);
  const hitContentHeight = contentHeight > 0 ? contentHeight : fallbackHeight;
  const rawTop = contentTopInset - padding;
  const rawBottom = contentTopInset + hitContentHeight + padding;
  const top = clamp(rawTop, 0, containerHeight);
  const minBottom = Math.min(containerHeight, top + fallbackHeight);
  const bottom = clamp(rawBottom, minBottom, containerHeight);

  return {
    top,
    height: Math.max(1, bottom - top),
  };
}

function isWithinInlineTextHitBand(
  locationY: number | undefined,
  band: { top: number; height: number },
): boolean {
  if (typeof locationY !== "number") {
    return true;
  }

  return locationY >= band.top && locationY <= band.top + band.height;
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
  manaColors: ManaColor[],
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
  fontFamily: string = FULL_MAGIC_PACK.fontFamilies.title,
): TitleLayout {
  const titleGap = 4;
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
    measureSingleLineTextWidth(name || "Untitled", titleBaseFontSize, fontFamily),
    hasBaseCardName ? measureSingleLineTextWidth(baseCardName, baseNameBaseFontSize, fontFamily) : 0,
  );
  const fitScale = clamp(availableWidth / Math.max(1, textWidth), 0.24, 1);
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
  const availableWidth = Math.max(1, width - 1);
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

  return Math.max(0, symbolOverlap + 1);
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
      return width + fontSize * 0.82;
    }

    if ("ilI1.,'|".includes(character)) {
      return width + fontSize * 0.28;
    }

    if (character === character.toUpperCase() && character !== character.toLowerCase()) {
      return width + fontSize * 0.62;
    }

    return width + fontSize * 0.52;
  }, 0);
}

function measureSingleLineTextWidth(text: string, fontSize: number, fontFamily: string): number {
  const normalizedText = text.trim();
  const estimatedWidth = estimateSingleLineTextWidth(normalizedText, fontSize);

  if (Platform.OS !== "web" || typeof document === "undefined") {
    return estimatedWidth;
  }

  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      return estimatedWidth;
    }

    context.font = `700 ${fontSize}px ${fontFamily}`;
    return Math.max(estimatedWidth * 0.82, context.measureText(normalizedText).width * 1.025);
  } catch {
    return estimatedWidth;
  }
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
      : footer.y - 7;
  const areaHeight = Math.max(64, Math.min(textArea.y + textArea.height, bottomLimit) - textArea.y);
  const areaRect = { ...textArea, height: areaHeight };
  const hasRules = card.rulesText.trim().length > 0;
  const hasFlavor = card.flavorText.trim().length > 0;
  const showDivider = hasRules && hasFlavor;
  const baseRulesFontSize = useRetroTypography ? 14 : 12.8;
  const baseRulesLineHeight = useRetroTypography ? 16.8 : 16.2;
  const baseFlavorFontSize = baseRulesFontSize;
  const baseFlavorLineHeight = baseRulesLineHeight;
  const charsPerLine = Math.max(18, Math.floor(textArea.width / 6.15));
  const rulesLineCount = estimateWrappedLineCount(card.rulesText, charsPerLine);
  const flavorLineCount = estimateWrappedLineCount(card.flavorText, charsPerLine);
  const neededRulesHeight = Math.max(1, rulesLineCount) * baseRulesLineHeight + 2;
  const neededFlavorHeight = Math.max(1, flavorLineCount) * baseFlavorLineHeight + 2;
  const keywordRulesText = getKeywordRulesText(card.keywords);
  const isKeywordOnlyRulesText =
    keywordRulesText.trim().length > 0 && keywordRulesText.trim() === card.rulesText.trim();

  if (showDivider) {
    const dividerHeight = 2;
    const dividerGap = 7;
    const usableHeight = Math.max(48, areaHeight - dividerHeight - dividerGap * 2);
    const minRulesHeight = baseRulesLineHeight + 2;
    const minFlavorHeight = baseFlavorLineHeight + 2;
    let rulesHeight: number;
    let flavorHeight: number;

    if (neededRulesHeight + neededFlavorHeight <= usableHeight) {
      const surplusHeight = usableHeight - neededRulesHeight - neededFlavorHeight;
      const totalLineCount = Math.max(1, rulesLineCount + flavorLineCount);
      rulesHeight = Math.max(
        minRulesHeight,
        neededRulesHeight + surplusHeight * (rulesLineCount / totalLineCount),
      );
      flavorHeight = Math.max(minFlavorHeight, usableHeight - rulesHeight);
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
    const sharedTextScale = Math.min(rulesScale, flavorScale);

    return {
      showRules: true,
      showFlavor: true,
      showDivider: true,
      centerRulesContent: false,
      rulesContentVerticalAlign: treatmentLayout?.rulesContentVerticalAlign,
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
      rulesFontSize: baseRulesFontSize * sharedTextScale,
      rulesLineHeight: baseRulesLineHeight * sharedTextScale,
      flavorFontSize: baseFlavorFontSize * sharedTextScale,
      flavorLineHeight: baseFlavorLineHeight * sharedTextScale,
    };
  }

  const neededHeight = hasFlavor ? neededFlavorHeight : neededRulesHeight;
  const showFlavor = hasFlavor && !hasRules;
  const showRules = hasRules || !showFlavor;
  const shouldCenterCompactRulesBlock =
    showRules && hasRules && !hasFlavor && (rulesLineCount <= 1 || isKeywordOnlyRulesText);
  const singleHeight = areaHeight;
  const singleY = areaRect.y;
  const singleScale = getTextScale(neededHeight, singleHeight);
  const hiddenRect = { ...areaRect, y: singleY, height: singleHeight };

  return {
    showRules,
    showFlavor,
    showDivider: false,
    centerRulesContent: shouldCenterCompactRulesBlock,
    rulesContentVerticalAlign: treatmentLayout?.rulesContentVerticalAlign,
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
  fitRect,
  showGeneratingTrail = false,
  generatingTrailColors = [],
  generatingTrailSeed,
  onLoad,
  onError,
}: {
  uri: string;
  artRect: CoordinateRect;
  renderScale: number;
  artTransform: ArtTransform;
  imageAspectRatio?: number | null;
  fitRect?: CoordinateRect;
  showGeneratingTrail?: boolean;
  generatingTrailColors?: ManaColor[];
  generatingTrailSeed?: string;
  onLoad?: (uri: string) => void;
  onError?: (uri: string) => void;
}) {
  const resolvedUri = useSvgCompatibleArtUri(uri) ?? uri;
  const resolvedFitRect = fitRect ?? artRect;
  const fittedLayout = getCoverFittedImageLayout(
    resolvedFitRect.width * renderScale,
    resolvedFitRect.height * renderScale,
    imageAspectRatio,
  );

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: (resolvedFitRect.x - artRect.x) * renderScale + fittedLayout.left,
        top: (resolvedFitRect.y - artRect.y) * renderScale + fittedLayout.top,
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
        source={{ uri: resolvedUri }}
        onLoad={() => onLoad?.(uri)}
        onError={() => onError?.(uri)}
        resizeMode={fittedLayout.resizeMode}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
      {showGeneratingTrail ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          }}
        >
          <GeneratingArtAnimation
            scale={renderScale}
            colors={generatingTrailColors}
            seed={generatingTrailSeed}
            label="Loading art"
          />
        </View>
      ) : null}
    </View>
  );
}

function GeneratingArtAnimation({
  scale,
  colors,
  seed,
  label = "Generating art, please wait",
}: {
  scale: number;
  colors: ManaColor[];
  seed?: string;
  label?: string;
}) {
  const drift = useRef(new Animated.Value(0)).current;
  const flicker = useRef(new Animated.Value(0)).current;
  const fallbackSeedRef = useRef(`trail-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const colorKey = colors.join("");
  const trailSeed = `${seed ?? fallbackSeedRef.current}-${colorKey || "C"}`;
  const { palette, pixels, originPath } = useMemo(() => {
    const smokePalette = getGeneratingSmokePalette(colors);
    const smokeOriginPath = createGeneratingSmokeOriginPath(`${trailSeed}-origin`);

    return {
      palette: smokePalette,
      pixels: createGeneratingPixelSmokeTrail(trailSeed, smokePalette, smokeOriginPath),
      originPath: smokeOriginPath,
    };
  }, [colorKey, trailSeed]);

  useEffect(() => {
    drift.setValue(0);
    flicker.setValue(0);

    const driftLoop = Animated.loop(
      Animated.timing(drift, {
        toValue: 1,
        duration: 5600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      { iterations: -1, resetBeforeIteration: true },
    );
    const flickerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, {
          toValue: 1,
          duration: 680,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(flicker, {
          toValue: 0,
          duration: 920,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1, resetBeforeIteration: true },
    );

    driftLoop.start();
    flickerLoop.start();

    return () => {
      driftLoop.stop();
      flickerLoop.stop();
    };
  }, [drift, flicker, trailSeed]);

  return (
    <View pointerEvents="none" style={{ flex: 1, overflow: "hidden", backgroundColor: "#050608" }}>
      <LinearGradient
        colors={["#050608", rgba(palette[0], 0.18), "rgba(8,10,14,0.9)", rgba(palette[1], 0.16)]}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", inset: 0 }}
      />
      <Animated.View
        style={{
          position: "absolute",
          left: "50%",
          top: "56%",
          width: Math.max(4, 7 * scale),
          height: Math.max(4, 7 * scale),
          marginLeft: Math.max(-2, -3.5 * scale),
          marginTop: Math.max(-2, -3.5 * scale),
          borderRadius: Math.max(2, 3.5 * scale),
          backgroundColor: rgba(palette[0], 0.52),
          opacity: flicker.interpolate({
            inputRange: [0, 1],
            outputRange: [0.35, 0.82],
          }),
          transform: [
            {
              translateX: drift.interpolate({
                inputRange: GENERATING_SMOKE_ORIGIN_INPUT_RANGE,
                outputRange: originPath.x.map((offset) => offset * scale),
              }),
            },
            {
              translateY: drift.interpolate({
                inputRange: GENERATING_SMOKE_ORIGIN_INPUT_RANGE,
                outputRange: originPath.y.map((offset) => offset * scale),
              }),
            },
            {
              scale: flicker.interpolate({
                inputRange: [0, 1],
                outputRange: [0.84, 1.16],
              }),
            },
          ],
        }}
      />
      <View
        style={{
          position: "absolute",
          inset: 0,
        }}
      >
        {pixels.map((particle, index) => {
          const color = palette[particle.colorIndex % palette.length];
          const pixelSize = Math.max(2, particle.size * scale);

          return (
            <Animated.View
              key={`generating-pixel-smoke-${index}`}
              style={{
                position: "absolute",
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: pixelSize,
                height: pixelSize,
                borderRadius: Math.max(0, Math.round(scale)),
                backgroundColor: color,
                opacity: drift.interpolate({
                  inputRange: particle.opacityInputRange,
                  outputRange: [0, particle.opacity, 0],
                }),
                transform: [
                  {
                    translateX: drift.interpolate({
                      inputRange: particle.motionInputRange,
                      outputRange: [0, particle.wobbleX * scale, particle.wobbleX * scale * 1.35],
                    }),
                  },
                  {
                    translateY: drift.interpolate({
                      inputRange: particle.motionInputRange,
                      outputRange: [0, -particle.rise * scale * 0.68, -particle.rise * scale],
                    }),
                  },
                  {
                    scale: drift.interpolate({
                      inputRange: particle.motionInputRange,
                      outputRange: [particle.scale * 0.76, particle.scale, particle.scale * 1.16],
                    }),
                  },
                ],
              }}
            />
          );
        })}
      </View>
      <Animated.View
        style={{
          position: "absolute",
          left: "50%",
          top: "56%",
          width: Math.max(10, 18 * scale),
          height: Math.max(10, 18 * scale),
          marginLeft: Math.max(-5, -9 * scale),
          marginTop: Math.max(-5, -9 * scale),
          opacity: 0.22,
          transform: [
            {
              translateX: drift.interpolate({
                inputRange: GENERATING_SMOKE_ORIGIN_INPUT_RANGE,
                outputRange: originPath.x.map((offset) => offset * scale),
              }),
            },
            {
              translateY: drift.interpolate({
                inputRange: GENERATING_SMOKE_ORIGIN_INPUT_RANGE,
                outputRange: originPath.y.map((offset) => offset * scale),
              }),
            },
          ],
        }}
      >
        <LinearGradient
          colors={[rgba(palette[0], 0.42), "rgba(255,255,255,0)"]}
          style={{ flex: 1, borderRadius: Math.max(5, 9 * scale) }}
        />
      </Animated.View>
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
        {label}
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

const GENERATING_SMOKE_ORIGIN_SEGMENT_COUNT = 14;
const GENERATING_SMOKE_ORIGIN_INPUT_RANGE = Array.from(
  { length: GENERATING_SMOKE_ORIGIN_SEGMENT_COUNT + 1 },
  (_, index) => index / GENERATING_SMOKE_ORIGIN_SEGMENT_COUNT,
);

type GeneratingPixelSmokeParticle = {
  x: number;
  y: number;
  size: number;
  opacity: number;
  rise: number;
  wobbleX: number;
  scale: number;
  colorIndex: number;
  motionInputRange: [number, number, number];
  opacityInputRange: [number, number, number];
};

function createGeneratingPixelSmokeTrail(
  seedKey: string,
  palette: string[],
  originPath: { x: number[]; y: number[] },
): GeneratingPixelSmokeParticle[] {
  const random = createSeededRandom(seedKey);

  return Array.from({ length: 128 }, (_, index) => {
    const emissionProgress = (index / 128) * 0.9;
    const densityBand = (index % 4) / 3;
    const sourceOffset = sampleGeneratingSmokeOriginPath(originPath, emissionProgress);
    const sourceX = 50 + sourceOffset.x / 3.75;
    const sourceY = 56 + sourceOffset.y / 5.23;
    const scatter = 1.8 + densityBand * 4.2;
    const start = emissionProgress;
    const middle = Math.min(start + 0.08 + random() * 0.035, 0.98);
    const end = Math.min(middle + 0.11 + random() * 0.055, 1);
    const size = 2 + Math.floor(random() * 4);

    return {
      x: clamp(sourceX + (random() - 0.5) * scatter, 5, 95),
      y: clamp(sourceY + (random() - 0.5) * scatter, 12, 86),
      size,
      opacity: 0.26 + random() * 0.54,
      rise: 30 + random() * 52,
      wobbleX: (random() - 0.5) * (9 + densityBand * 16),
      scale: 0.82 + random() * 0.62,
      colorIndex: Math.floor(random() * palette.length),
      motionInputRange: [start, middle, end],
      opacityInputRange: [start, start + (middle - start) * 0.45, end],
    };
  });
}

function createGeneratingSmokeOriginPath(seedKey: string): { x: number[]; y: number[] } {
  const random = createSeededRandom(seedKey);
  const x: number[] = [];
  const y: number[] = [];
  const startAngle = random() * Math.PI * 2;

  GENERATING_SMOKE_ORIGIN_INPUT_RANGE.forEach((_, index) => {
    const isClosingPoint = index === GENERATING_SMOKE_ORIGIN_INPUT_RANGE.length - 1;
    const pathIndex = isClosingPoint ? 0 : index;
    const angle =
      startAngle +
      (pathIndex / GENERATING_SMOKE_ORIGIN_SEGMENT_COUNT) * Math.PI * 2 +
      (isClosingPoint ? 0 : (random() - 0.5) * 0.22);
    const radiusX = 108 + random() * 42;
    const radiusY = 58 + random() * 34;

    x.push(Math.round(Math.cos(angle) * radiusX));
    y.push(Math.round(Math.sin(angle) * radiusY));
  });

  x[x.length - 1] = x[0] ?? 0;
  y[y.length - 1] = y[0] ?? 0;

  return { x, y };
}

function sampleGeneratingSmokeOriginPath(originPath: { x: number[]; y: number[] }, progress: number): { x: number; y: number } {
  const clampedProgress = clamp(progress, 0, 1);
  const nextIndex = GENERATING_SMOKE_ORIGIN_INPUT_RANGE.findIndex((stop) => stop >= clampedProgress);

  if (nextIndex <= 0) {
    return { x: originPath.x[0] ?? 0, y: originPath.y[0] ?? 0 };
  }

  const previousIndex = nextIndex - 1;
  const previousStop = GENERATING_SMOKE_ORIGIN_INPUT_RANGE[previousIndex] ?? 0;
  const nextStop = GENERATING_SMOKE_ORIGIN_INPUT_RANGE[nextIndex] ?? 1;
  const segmentProgress = nextStop === previousStop ? 0 : (clampedProgress - previousStop) / (nextStop - previousStop);
  const previousX = originPath.x[previousIndex] ?? 0;
  const nextX = originPath.x[nextIndex] ?? previousX;
  const previousY = originPath.y[previousIndex] ?? 0;
  const nextY = originPath.y[nextIndex] ?? previousY;

  return {
    x: previousX + (nextX - previousX) * segmentProgress,
    y: previousY + (nextY - previousY) * segmentProgress,
  };
}

function createSeededRandom(seedKey: string): () => number {
  let seed = 2166136261;

  for (let index = 0; index < seedKey.length; index += 1) {
    seed ^= seedKey.charCodeAt(index);
    seed = Math.imul(seed, 16777619);
  }

  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

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

// Memoized frame-bitmap leaf layers. These are pure functions of their (source,
// scalar, cacheKey) props and never read the mutating `card` object, so wrapping
// them in React.memo lets them bail out of re-render when only card *text*
// changes — the editor's most frequent update. Declarations above are hoisted,
// so referencing them here is safe; call sites resolve to these memoized values.
const StableFrameImage = memo(StableFrameImageImpl);
const DirectFrameImage = memo(DirectFrameImageImpl);
const MseFrameImage = memo(MseFrameImageImpl);
const MseSplitFrameImage = memo(MseSplitFrameImageImpl);
const ShowcaseFrameImage = memo(ShowcaseFrameImageImpl);
const ShowcaseFrameBlendImage = memo(ShowcaseFrameBlendImageImpl);
const MseTextureLayer = memo(MseTextureLayerImpl);
const FutureFrameBlendTextureLayer = memo(FutureFrameBlendTextureLayerImpl);
const FutureFrameMulticolorUnderlay = memo(FutureFrameMulticolorUnderlayImpl);
const TextlessBottomBarLayer = memo(TextlessBottomBarLayerImpl);
