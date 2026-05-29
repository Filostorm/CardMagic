import { ImageSourcePropType } from "react-native";

import { FrameIdentity, ShowcaseFrameId } from "@/types/card";

export type ShowcaseFrameSpec = {
  id: ShowcaseFrameId;
  label: string;
  cardCount: number;
  msePackage: string;
  designWidth: number;
  designHeight: number;
  artRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  artMask?: {
    source: ImageSourcePropType;
    coordinateSpace: "card" | "art";
    clipHeight?: number;
  };
  artOverlay?: {
    source: ImageSourcePropType;
    opacity: number;
  };
  textIsLight?: boolean;
  frameMask?: ImageSourcePropType;
  frameMasks?: ImageSourcePropType[];
  frameUnderlaySources?: Record<FrameIdentity, ImageSourcePropType>;
  frameSources: Record<FrameIdentity, ImageSourcePropType>;
  frameSourcesWithPt?: Record<FrameIdentity, ImageSourcePropType>;
  overlayMasks?: Array<{
    source: ImageSourcePropType;
    fill: string;
    opacity: number;
  }>;
  artFilter?: "grayscale";
  stampRimSources?: Record<FrameIdentity, ImageSourcePropType>;
  nonStampRimSources?: Record<FrameIdentity, ImageSourcePropType>;
  stampBorderMask?: ImageSourcePropType;
  securityStampSource?: ImageSourcePropType;
  twoColorFrameBlend?: "linear";
  securityStampRect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  ptOverlay?: {
    rect: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    sources: Partial<Record<FrameIdentity, ImageSourcePropType>> | ImageSourcePropType;
  };
  previewSource: ImageSourcePropType;
};

export const SHOWCASE_FRAME_ORDER: ShowcaseFrameId[] = [
  "eternalNight",
  "scrolls",
  "futureshifted",
  "stainedGlass",
  "mysticalArchive",
  "dndRulebook",
  "customShowcaseLab",
  "stellarSights",
];

const HIDDEN_SHOWCASE_FRAME_IDS = new Set<ShowcaseFrameId>(["customShowcaseLab"]);

export const VISIBLE_SHOWCASE_FRAME_ORDER: ShowcaseFrameId[] = SHOWCASE_FRAME_ORDER.filter(
  (showcaseFrame) => !HIDDEN_SHOWCASE_FRAME_IDS.has(showcaseFrame),
);

export const SHOWCASE_FRAME_LABELS: Record<ShowcaseFrameId, string> = {
  eternalNight: "Eternal Night",
  scrolls: "Scroll Showcase",
  futureshifted: "Futureshifted",
  japaneseMysticalArchive: "Japanese Mystical Archive",
  stainedGlass: "Stained Glass",
  mysticalArchive: "Mystical Archive",
  dndRulebook: "Dungeons & Dragons Rulebook",
  firstPlace: "First Place",
  customShowcaseLab: "Custom Showcase Lab",
  stellarSights: "Stellar Sights",
  posterStellarSights: "Poster Stellar Sights",
};

export const DEFAULT_SHOWCASE_FRAME: ShowcaseFrameId = "eternalNight";

const FUTURE_FRAMES = {
  white: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/wcard.jpg"),
  blue: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/ucard.jpg"),
  black: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/bcard.jpg"),
  red: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/rcard.jpg"),
  green: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/gcard.jpg"),
  gold: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/mcard.jpg"),
  artifact: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/acard.jpg"),
  land: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/clcard.jpg"),
  colorless: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/ccard.jpg"),
} satisfies Record<FrameIdentity, ImageSourcePropType>;

const FUTURE_PT_OVERLAYS = {
  white: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/wpt.png"),
  blue: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/upt.png"),
  black: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/bpt.png"),
  red: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/rpt.png"),
  green: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/gpt.png"),
  gold: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/mpt.png"),
  artifact: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/apt.png"),
  land: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/clpt.png"),
  colorless: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/cpt.png"),
} satisfies Record<FrameIdentity, ImageSourcePropType>;

const ETERNAL_NIGHT_FRAMES = {
  white: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/card/wcard.png"),
  blue: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/card/ucard.png"),
  black: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/card/bcard.png"),
  red: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/card/rcard.png"),
  green: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/card/gcard.png"),
  gold: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/card/mcard.png"),
  artifact: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/card/acard.png"),
  land: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/card/ccard.png"),
  colorless: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/card/ccard.png"),
} satisfies Record<FrameIdentity, ImageSourcePropType>;

const ETERNAL_NIGHT_STAMP_RIMS = {
  white: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/stamprim/wstamprim.png"),
  blue: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/stamprim/ustamprim.png"),
  black: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/stamprim/bstamprim.png"),
  red: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/stamprim/rstamprim.png"),
  green: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/stamprim/gstamprim.png"),
  gold: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/stamprim/mstamprim.png"),
  artifact: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/stamprim/astamprim.png"),
  land: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/stamprim/cstamprim.png"),
  colorless: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/stamprim/cstamprim.png"),
} satisfies Record<FrameIdentity, ImageSourcePropType>;

const ETERNAL_NIGHT_NON_STAMP_RIMS = {
  white: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/nonstamprim/wnonstamprim.png"),
  blue: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/nonstamprim/unonstamprim.png"),
  black: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/nonstamprim/bnonstamprim.png"),
  red: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/nonstamprim/rnonstamprim.png"),
  green: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/nonstamprim/gnonstamprim.png"),
  gold: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/nonstamprim/mnonstamprim.png"),
  artifact: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/nonstamprim/anonstamprim.png"),
  land: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/nonstamprim/cnonstamprim.png"),
  colorless: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/nonstamprim/cnonstamprim.png"),
} satisfies Record<FrameIdentity, ImageSourcePropType>;

const SCROLL_FRAMES = {
  white: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/card/wcard.png"),
  blue: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/card/ucard.png"),
  black: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/card/bcard.png"),
  red: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/card/rcard.png"),
  green: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/card/gcard.png"),
  gold: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/card/mcard.png"),
  artifact: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/card/acard.png"),
  land: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/card/ccard.png"),
  colorless: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/card/ccard.png"),
} satisfies Record<FrameIdentity, ImageSourcePropType>;

const SCROLL_STAMP_RIMS = {
  white: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/stamprim/wstamprim.png"),
  blue: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/stamprim/ustamprim.png"),
  black: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/stamprim/bstamprim.png"),
  red: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/stamprim/rstamprim.png"),
  green: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/stamprim/gstamprim.png"),
  gold: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/stamprim/mstamprim.png"),
  artifact: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/stamprim/astamprim.png"),
  land: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/stamprim/cstamprim.png"),
  colorless: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/stamprim/cstamprim.png"),
} satisfies Record<FrameIdentity, ImageSourcePropType>;

const SCROLL_NON_STAMP_RIMS = {
  white: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/nonstamprim/wnonstamprim.png"),
  blue: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/nonstamprim/unonstamprim.png"),
  black: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/nonstamprim/bnonstamprim.png"),
  red: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/nonstamprim/rnonstamprim.png"),
  green: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/nonstamprim/gnonstamprim.png"),
  gold: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/nonstamprim/mnonstamprim.png"),
  artifact: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/nonstamprim/anonstamprim.png"),
  land: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/nonstamprim/cnonstamprim.png"),
  colorless: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/nonstamprim/cnonstamprim.png"),
} satisfies Record<FrameIdentity, ImageSourcePropType>;

const JP_ARCHIVE_FRAMES = {
  white: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-strixhaven-jp.mse-style/card/wcard.png"),
  blue: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-strixhaven-jp.mse-style/card/ucard.png"),
  black: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-strixhaven-jp.mse-style/card/bcard.png"),
  red: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-strixhaven-jp.mse-style/card/rcard.png"),
  green: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-strixhaven-jp.mse-style/card/gcard.png"),
  gold: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-strixhaven-jp.mse-style/card/mcard.png"),
  artifact: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-strixhaven-jp.mse-style/card/acard.png"),
  land: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-strixhaven-jp.mse-style/card/ccard.png"),
  colorless: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-strixhaven-jp.mse-style/card/ccard.png"),
} satisfies Record<FrameIdentity, ImageSourcePropType>;

const STAINED_GLASS_FRAMES = {
  white: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-dominaria-stained-glass.mse-style/card/wcard.png"),
  blue: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-dominaria-stained-glass.mse-style/card/ucard.png"),
  black: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-dominaria-stained-glass.mse-style/card/bcard.png"),
  red: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-dominaria-stained-glass.mse-style/card/rcard.png"),
  green: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-dominaria-stained-glass.mse-style/card/gcard.png"),
  gold: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-dominaria-stained-glass.mse-style/card/mcard.png"),
  artifact: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-dominaria-stained-glass.mse-style/card/acard.png"),
  land: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-dominaria-stained-glass.mse-style/card/ccard.png"),
  colorless: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-dominaria-stained-glass.mse-style/card/ccard.png"),
} satisfies Record<FrameIdentity, ImageSourcePropType>;

const MYSTICAL_ARCHIVE_FRAMES = {
  white: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-strixhaven.mse-style/card/w.png"),
  blue: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-strixhaven.mse-style/card/u.png"),
  black: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-strixhaven.mse-style/card/b.png"),
  red: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-strixhaven.mse-style/card/r.png"),
  green: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-strixhaven.mse-style/card/g.png"),
  gold: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-strixhaven.mse-style/card/m.png"),
  artifact: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-strixhaven.mse-style/card/a.png"),
  land: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-strixhaven.mse-style/card/c.png"),
  colorless: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-strixhaven.mse-style/card/c.png"),
} satisfies Record<FrameIdentity, ImageSourcePropType>;

const DND_RULEBOOK_FRAMES = {
  white: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-monster-manual.mse-style/frame.png"),
  blue: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-monster-manual.mse-style/frame.png"),
  black: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-monster-manual.mse-style/frame.png"),
  red: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-monster-manual.mse-style/frame.png"),
  green: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-monster-manual.mse-style/frame.png"),
  gold: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-monster-manual.mse-style/frame.png"),
  artifact: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-monster-manual.mse-style/frame.png"),
  land: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-monster-manual.mse-style/frame.png"),
  colorless: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-monster-manual.mse-style/frame.png"),
} satisfies Record<FrameIdentity, ImageSourcePropType>;

const CUSTOM_SHOWCASE_LAB_FRAMES = {
  white: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/showcase-zendikar/masked/white.png"),
  blue: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/showcase-zendikar/masked/blue.png"),
  black: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/showcase-zendikar/masked/black.png"),
  red: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/showcase-zendikar/masked/red.png"),
  green: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/showcase-zendikar/masked/green.png"),
  gold: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/showcase-zendikar/masked/gold.png"),
  artifact: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/showcase-zendikar/masked/artifact.png"),
  land: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/showcase-zendikar/masked/land.png"),
  colorless: require("../../assets/card-assets/basic-m15/mse-renderer/treatments/showcase-zendikar/masked/colorless.png"),
} satisfies Record<FrameIdentity, ImageSourcePropType>;

const FIRST_PLACE_FRAME = require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-aetherdrift-first-place.mse-style/card.png");

const FIRST_PLACE_FRAMES = {
  white: FIRST_PLACE_FRAME,
  blue: FIRST_PLACE_FRAME,
  black: FIRST_PLACE_FRAME,
  red: FIRST_PLACE_FRAME,
  green: FIRST_PLACE_FRAME,
  gold: FIRST_PLACE_FRAME,
  artifact: FIRST_PLACE_FRAME,
  land: FIRST_PLACE_FRAME,
  colorless: FIRST_PLACE_FRAME,
} satisfies Record<FrameIdentity, ImageSourcePropType>;

const STELLAR_SIGHTS_FRAMES = {
  white: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights.mse-style/card/w.png"),
  blue: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights.mse-style/card/u.png"),
  black: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights.mse-style/card/b.png"),
  red: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights.mse-style/card/r.png"),
  green: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights.mse-style/card/g.png"),
  gold: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights.mse-style/card/m.png"),
  artifact: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights.mse-style/card/a.png"),
  land: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights.mse-style/card/c.png"),
  colorless: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights.mse-style/card/c.png"),
} satisfies Record<FrameIdentity, ImageSourcePropType>;

const POSTER_STELLAR_SIGHTS_FRAMES = {
  white: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights-poster.mse-style/card/w.png"),
  blue: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights-poster.mse-style/card/u.png"),
  black: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights-poster.mse-style/card/b.png"),
  red: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights-poster.mse-style/card/r.png"),
  green: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights-poster.mse-style/card/g.png"),
  gold: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights-poster.mse-style/card/m.png"),
  artifact: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights-poster.mse-style/card/a.png"),
  land: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights-poster.mse-style/card/c.png"),
  colorless: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights-poster.mse-style/card/c.png"),
} satisfies Record<FrameIdentity, ImageSourcePropType>;

export const SHOWCASE_FRAMES: Record<ShowcaseFrameId, ShowcaseFrameSpec> = {
  eternalNight: {
    id: "eternalNight",
    label: SHOWCASE_FRAME_LABELS.eternalNight,
    cardCount: 586,
    msePackage: "magic-m15-showcase-innistrad-double-feature.mse-style",
    designWidth: 744,
    designHeight: 1039,
    artRect: { x: 57, y: 118, width: 630, height: 459 },
    artFilter: "grayscale",
    textIsLight: true,
    frameMasks: [
      require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/border_mask.png"),
      require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/card_mask.png"),
    ],
    frameSources: ETERNAL_NIGHT_FRAMES,
    stampRimSources: ETERNAL_NIGHT_STAMP_RIMS,
    nonStampRimSources: ETERNAL_NIGHT_NON_STAMP_RIMS,
    stampBorderMask: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/border_stamp_mask.png"),
    ptOverlay: {
      rect: { x: 0, y: 0, width: 744, height: 1039 },
      sources: {
        white: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/pt/wpt.png"),
        blue: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/pt/upt.png"),
        black: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/pt/bpt.png"),
        red: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/pt/rpt.png"),
        green: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/pt/gpt.png"),
        gold: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/pt/mpt.png"),
        artifact: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/pt/apt.png"),
        land: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/pt/cpt.png"),
        colorless: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-innistrad-double-feature.mse-style/pt/cpt.png"),
      },
    },
    previewSource: ETERNAL_NIGHT_FRAMES.black,
  },
  scrolls: {
    id: "scrolls",
    label: SHOWCASE_FRAME_LABELS.scrolls,
    cardCount: 358,
    msePackage: "magic-m15-showcase-lotr-scroll.mse-style",
    designWidth: 646,
    designHeight: 902,
    artRect: { x: 49, y: 100, width: 548, height: 412 },
    artOverlay: {
      source: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/art_filter.png"),
      opacity: 0.8,
    },
    frameMasks: [
      require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/border_mask.png"),
      require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-lotr-scroll.mse-style/card_mask.png"),
    ],
    frameSources: SCROLL_FRAMES,
    stampRimSources: SCROLL_STAMP_RIMS,
    nonStampRimSources: SCROLL_NON_STAMP_RIMS,
    securityStampSource: require("../../assets/card-assets/basic-m15/source-pack/data/magic.mse-game/stamps/ub.png"),
    securityStampRect: { x: 169.5, y: 476, width: 36, height: 19.5 },
    previewSource: SCROLL_FRAMES.gold,
  },
  futureshifted: {
    id: "futureshifted",
    label: SHOWCASE_FRAME_LABELS.futureshifted,
    cardCount: 241,
    msePackage: "magic-future.mse-style",
    designWidth: 375,
    designHeight: 523,
    artRect: { x: 32, y: 44, width: 327, height: 310 },
    artMask: {
      source: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/mask_image.png"),
      coordinateSpace: "art",
    },
    frameMask: require("../../assets/card-assets/basic-m15/showcase-mse/magic-future.mse-style/bordermask.png"),
    frameUnderlaySources: FUTURE_FRAMES,
    frameSources: FUTURE_FRAMES,
    ptOverlay: {
      rect: { x: 285, y: 452, width: 70, height: 52 },
      sources: FUTURE_PT_OVERLAYS,
    },
    previewSource: FUTURE_FRAMES.gold,
  },
  japaneseMysticalArchive: {
    id: "japaneseMysticalArchive",
    label: SHOWCASE_FRAME_LABELS.japaneseMysticalArchive,
    cardCount: 203,
    msePackage: "magic-m15-showcase-strixhaven-jp.mse-style",
    designWidth: 375,
    designHeight: 523,
    artRect: { x: 0, y: 0, width: 375, height: 494 },
    frameMasks: [
      require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-strixhaven-jp.mse-style/border_mask_pt.png"),
      require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-strixhaven-jp.mse-style/frame_mask.png"),
    ],
    frameSources: JP_ARCHIVE_FRAMES,
    previewSource: JP_ARCHIVE_FRAMES.red,
  },
  stainedGlass: {
    id: "stainedGlass",
    label: SHOWCASE_FRAME_LABELS.stainedGlass,
    cardCount: 168,
    msePackage: "magic-m15-showcase-dominaria-stained-glass.mse-style",
    designWidth: 646,
    designHeight: 902,
    artRect: { x: 29, y: 102, width: 588, height: 398 },
    artMask: {
      source: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-dominaria-stained-glass.mse-style/image_mask.png"),
      coordinateSpace: "art",
    },
    textIsLight: true,
    frameMask: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-dominaria-stained-glass.mse-style/foil_mask.png"),
    frameSources: STAINED_GLASS_FRAMES,
    previewSource: STAINED_GLASS_FRAMES.gold,
  },
  mysticalArchive: {
    id: "mysticalArchive",
    label: SHOWCASE_FRAME_LABELS.mysticalArchive,
    cardCount: 146,
    msePackage: "magic-m15-showcase-strixhaven.mse-style",
    designWidth: 744,
    designHeight: 1039,
    artRect: { x: 0, y: 47, width: 744, height: 916 },
    artMask: {
      source: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-strixhaven.mse-style/image_mask.png"),
      coordinateSpace: "card",
    },
    frameMasks: [
      require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-strixhaven.mse-style/border_extended_mask.png"),
      require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-strixhaven.mse-style/card_mask.png"),
    ],
    frameSources: MYSTICAL_ARCHIVE_FRAMES,
    previewSource: MYSTICAL_ARCHIVE_FRAMES.white,
    textIsLight: true,
  },
  dndRulebook: {
    id: "dndRulebook",
    label: SHOWCASE_FRAME_LABELS.dndRulebook,
    cardCount: 135,
    msePackage: "magic-m15-showcase-monster-manual.mse-style",
    designWidth: 375,
    designHeight: 523,
    artRect: { x: 22, y: 56, width: 338, height: 240 },
    frameMasks: [
      require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-monster-manual.mse-style/border_mask.png"),
      require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-monster-manual.mse-style/frame_mask.png"),
    ],
    frameSources: DND_RULEBOOK_FRAMES,
    ptOverlay: {
      rect: { x: 289, y: 465, width: 65, height: 33 },
      sources: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-monster-manual.mse-style/pt.png"),
    },
    previewSource: DND_RULEBOOK_FRAMES.green,
  },
  customShowcaseLab: {
    id: "customShowcaseLab",
    label: SHOWCASE_FRAME_LABELS.customShowcaseLab,
    cardCount: 0,
    msePackage: "mse-renderer/treatments/showcase-zendikar",
    designWidth: 375,
    designHeight: 523,
    artRect: { x: 29, y: 60, width: 316, height: 231 },
    twoColorFrameBlend: "linear",
    frameSources: CUSTOM_SHOWCASE_LAB_FRAMES,
    previewSource: CUSTOM_SHOWCASE_LAB_FRAMES.gold,
  },
  firstPlace: {
    id: "firstPlace",
    label: SHOWCASE_FRAME_LABELS.firstPlace,
    cardCount: 127,
    msePackage: "magic-m15-showcase-aetherdrift-first-place.mse-style",
    designWidth: 744,
    designHeight: 1039,
    artRect: { x: 58, y: 118, width: 627, height: 459 },
    artMask: {
      source: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-aetherdrift-first-place.mse-style/image_mask.png"),
      coordinateSpace: "card",
    },
    textIsLight: true,
    frameMask: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-aetherdrift-first-place.mse-style/border_mask.png"),
    frameSources: FIRST_PLACE_FRAMES,
    ptOverlay: {
      rect: { x: 0, y: 0, width: 744, height: 1039 },
      sources: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-aetherdrift-first-place.mse-style/pt.png"),
    },
    previewSource: FIRST_PLACE_FRAME,
  },
  stellarSights: {
    id: "stellarSights",
    label: SHOWCASE_FRAME_LABELS.stellarSights,
    cardCount: 90,
    msePackage: "magic-m15-showcase-eternities-stellar-sights.mse-style",
    designWidth: 744,
    designHeight: 1039,
    artRect: { x: 0, y: 0, width: 744, height: 958 },
    artMask: {
      source: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights.mse-style/image_mask.png"),
      coordinateSpace: "card",
      clipHeight: 958,
    },
    textIsLight: true,
    twoColorFrameBlend: "linear",
    frameMasks: [
      require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights.mse-style/border_mask.png"),
      require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights.mse-style/card_mask.png"),
    ],
    overlayMasks: [
      {
        source: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights.mse-style/namebox.png"),
        fill: "#020406",
        opacity: 0.7,
      },
      {
        source: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights.mse-style/textbox.png"),
        fill: "#020406",
        opacity: 0.7,
      },
    ],
    stampBorderMask: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights.mse-style/stamp_border_mask.png"),
    frameSources: STELLAR_SIGHTS_FRAMES,
    previewSource: STELLAR_SIGHTS_FRAMES.blue,
  },
  posterStellarSights: {
    id: "posterStellarSights",
    label: SHOWCASE_FRAME_LABELS.posterStellarSights,
    cardCount: 90,
    msePackage: "magic-m15-showcase-eternities-stellar-sights-poster.mse-style",
    designWidth: 744,
    designHeight: 1039,
    artRect: { x: 0, y: 0, width: 744, height: 967 },
    artMask: {
      source: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights-poster.mse-style/image_mask.png"),
      coordinateSpace: "card",
    },
    textIsLight: true,
    frameMasks: [
      require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights-poster.mse-style/border_mask.png"),
      require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights-poster.mse-style/card_mask.png"),
    ],
    frameSources: POSTER_STELLAR_SIGHTS_FRAMES,
    ptOverlay: {
      rect: { x: 0, y: 0, width: 744, height: 1039 },
      sources: {
        white: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights-poster.mse-style/pt/w.png"),
        blue: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights-poster.mse-style/pt/u.png"),
        black: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights-poster.mse-style/pt/b.png"),
        red: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights-poster.mse-style/pt/r.png"),
        green: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights-poster.mse-style/pt/g.png"),
        gold: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights-poster.mse-style/pt/m.png"),
        artifact: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights-poster.mse-style/pt/a.png"),
        land: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights-poster.mse-style/pt/c.png"),
        colorless: require("../../assets/card-assets/basic-m15/showcase-mse/magic-m15-showcase-eternities-stellar-sights-poster.mse-style/pt/c.png"),
      },
    },
    previewSource: POSTER_STELLAR_SIGHTS_FRAMES.blue,
  },
};

export function getShowcaseFrameSpec(id: ShowcaseFrameId | undefined): ShowcaseFrameSpec {
  return SHOWCASE_FRAMES[id ?? DEFAULT_SHOWCASE_FRAME] ?? SHOWCASE_FRAMES[DEFAULT_SHOWCASE_FRAME];
}

export function getShowcaseFrameSource(
  id: ShowcaseFrameId | undefined,
  frameIdentity: FrameIdentity,
  hasPowerToughness = false,
): ImageSourcePropType {
  const spec = getShowcaseFrameSpec(id);

  if (hasPowerToughness) {
    return spec.frameSourcesWithPt?.[frameIdentity] ?? spec.frameSources[frameIdentity];
  }

  return spec.frameSources[frameIdentity];
}

export function getShowcaseFrameUnderlaySource(
  id: ShowcaseFrameId | undefined,
  frameIdentity: FrameIdentity,
): ImageSourcePropType | null {
  return getShowcaseFrameSpec(id).frameUnderlaySources?.[frameIdentity] ?? null;
}

export function getShowcasePtOverlaySource(
  id: ShowcaseFrameId | undefined,
  frameIdentity: FrameIdentity,
): ImageSourcePropType | null {
  const sources = getShowcaseFrameSpec(id).ptOverlay?.sources;

  if (!sources) {
    return null;
  }

  if (isImageSource(sources)) {
    return sources;
  }

  return sources[frameIdentity] ?? sources.gold ?? null;
}

function isImageSource(
  source: ImageSourcePropType | Partial<Record<FrameIdentity, ImageSourcePropType>>,
): source is ImageSourcePropType {
  return typeof source === "number" || Array.isArray(source) || "uri" in source;
}
