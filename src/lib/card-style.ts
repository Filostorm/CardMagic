import { ColorValue } from "react-native";

import {
  CardDraft,
  FrameEffect,
  FrameIdentity,
  FrameSelection,
  FrameTreatment,
  ManaColor,
} from "@/types/card";

type FrameStyle = {
  id: FrameIdentity;
  label: string;
  gradient: [ColorValue, ColorValue, ColorValue];
  titleBox: string;
  textBox: string;
  typeBox: string;
  statBox: string;
  border: string;
  pinline: string;
  ink: string;
  mutedInk: string;
  symbolFill: string;
  treatment: string;
};

const COLOR_NAMES: Record<ManaColor, FrameIdentity> = {
  W: "white",
  U: "blue",
  B: "black",
  R: "red",
  G: "green",
};

export const FRAME_COLOR_LABELS: Record<ManaColor, string> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
};

export const FRAME_MANA_COLORS: ManaColor[] = ["W", "U", "B", "R", "G"];
const COLOR_WHEEL = FRAME_MANA_COLORS;
const VARIABLE_MANA_ORDER = ["X", "Y", "Z"];
const HYBRID_PAIR_SYMBOLS: Record<string, string> = {
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
const COLOR_SET_ORDERS: Record<string, ManaColor[]> = {
  W: ["W"],
  U: ["U"],
  B: ["B"],
  R: ["R"],
  G: ["G"],
  WU: ["W", "U"],
  WB: ["W", "B"],
  UB: ["U", "B"],
  UR: ["U", "R"],
  BR: ["B", "R"],
  BG: ["B", "G"],
  RG: ["R", "G"],
  WR: ["R", "W"],
  WG: ["G", "W"],
  UG: ["G", "U"],
  WUB: ["W", "U", "B"],
  UBR: ["U", "B", "R"],
  BRG: ["B", "R", "G"],
  WRG: ["R", "G", "W"],
  WUG: ["G", "W", "U"],
  WBG: ["W", "B", "G"],
  WUR: ["U", "R", "W"],
  UBG: ["B", "G", "U"],
  WBR: ["R", "W", "B"],
  UGR: ["G", "U", "R"],
  WUBR: ["W", "U", "B", "R"],
  UBRG: ["U", "B", "R", "G"],
  WBRG: ["B", "R", "G", "W"],
  WURG: ["R", "G", "W", "U"],
  WUBG: ["G", "W", "U", "B"],
  WUBRG: ["W", "U", "B", "R", "G"],
};
const TYPE_WORD_PATTERN = /\s+[—–-]\s+/;

export const FRAME_SELECTION_LABELS: Record<FrameSelection, string> = {
  auto: "Auto from type and cost",
  white: "White",
  blue: "Blue",
  black: "Black",
  red: "Red",
  green: "Green",
  gold: "Multicolor",
  artifact: "Artifact",
  land: "Land",
  colorless: "Colorless",
};

export const FRAME_SELECTIONS: FrameSelection[] = [
  "auto",
  "white",
  "blue",
  "black",
  "red",
  "green",
  "gold",
  "artifact",
  "land",
  "colorless",
];

export const FRAME_TREATMENT_LABELS: Record<FrameTreatment, string> = {
  standard: "Standard",
  fullArt: "Full art",
  extendedArt: "Extended art",
  borderless: "Borderless art",
  transparentBorderless: "Transparent borderless",
  promo: "Promo art",
  showcase: "Showcase",
  textless: "Textless",
  retro: "Retro",
  etchedFoil: "Etched foil",
};

export const FRAME_TREATMENTS: FrameTreatment[] = [
  "standard",
  "fullArt",
  "extendedArt",
  "borderless",
  "transparentBorderless",
  "promo",
  "showcase",
  "textless",
  "retro",
  "etchedFoil",
];

export const FRAME_STYLES: Record<FrameIdentity, FrameStyle> = {
  white: {
    id: "white",
    label: "White frame",
    gradient: ["#efe4bb", "#fff9df", "#d8c48d"],
    titleBox: "#fff3c9",
    textBox: "#fff9e4",
    typeBox: "#f4e6b8",
    statBox: "#fbf0c6",
    border: "#2f2b22",
    pinline: "#b9a25f",
    ink: "#241f18",
    mutedInk: "#6b5b3f",
    symbolFill: "#f9f0d2",
    treatment: "Pearl paper",
  },
  blue: {
    id: "blue",
    label: "Blue frame",
    gradient: ["#a9cadc", "#d7eef7", "#608ea7"],
    titleBox: "#c8e5f0",
    textBox: "#e6f5fb",
    typeBox: "#beddea",
    statBox: "#d5edf5",
    border: "#172b35",
    pinline: "#497f98",
    ink: "#12242d",
    mutedInk: "#3e6474",
    symbolFill: "#d9eef6",
    treatment: "Lacquered paper",
  },
  black: {
    id: "black",
    label: "Black frame",
    gradient: ["#2a2a2c", "#68615d", "#171718"],
    titleBox: "#4d4a47",
    textBox: "#d9d1c6",
    typeBox: "#c9beb2",
    statBox: "#ddd2c4",
    border: "#0d0d0e",
    pinline: "#8f8478",
    ink: "#1c1714",
    mutedInk: "#4c4540",
    symbolFill: "#383737",
    treatment: "Soot varnish",
  },
  red: {
    id: "red",
    label: "Red frame",
    gradient: ["#9f3f2d", "#e4a167", "#6e241c"],
    titleBox: "#f0b16d",
    textBox: "#ffe2be",
    typeBox: "#d88952",
    statBox: "#f5c080",
    border: "#2e1713",
    pinline: "#b15335",
    ink: "#2b1712",
    mutedInk: "#71412e",
    symbolFill: "#efaa69",
    treatment: "Heat-set ink",
  },
  green: {
    id: "green",
    label: "Green frame",
    gradient: ["#587a43", "#c7d9a3", "#2f4b2d"],
    titleBox: "#cfe2a6",
    textBox: "#edf5d8",
    typeBox: "#b6cd8a",
    statBox: "#d3e4aa",
    border: "#152916",
    pinline: "#719252",
    ink: "#142313",
    mutedInk: "#4b653c",
    symbolFill: "#d4e8ae",
    treatment: "Organic fiber",
  },
  gold: {
    id: "gold",
    label: "Multicolor frame",
    gradient: ["#b78c34", "#f2d486", "#467d73"],
    titleBox: "#ead08a",
    textBox: "#fbefc6",
    typeBox: "#d9ba62",
    statBox: "#eed28b",
    border: "#2f2411",
    pinline: "#9d833b",
    ink: "#241a0f",
    mutedInk: "#6f5729",
    symbolFill: "#efd283",
    treatment: "Gold pinline",
  },
  artifact: {
    id: "artifact",
    label: "Artifact frame",
    gradient: ["#777a78", "#d2d4ce", "#4e5451"],
    titleBox: "#d7d8d0",
    textBox: "#f1f0ea",
    typeBox: "#c7cac4",
    statBox: "#d8d9d0",
    border: "#202421",
    pinline: "#8e938c",
    ink: "#1c211e",
    mutedInk: "#5b615c",
    symbolFill: "#d9dad4",
    treatment: "Brushed metal",
  },
  land: {
    id: "land",
    label: "Land frame",
    gradient: ["#5d5130", "#ccb06b", "#2f5134"],
    titleBox: "#d0b572",
    textBox: "#f1e5be",
    typeBox: "#c3a969",
    statBox: "#d8be78",
    border: "#211c12",
    pinline: "#8b783e",
    ink: "#241d10",
    mutedInk: "#675633",
    symbolFill: "#dbc17e",
    treatment: "Terrain wash",
  },
  colorless: {
    id: "colorless",
    label: "Colorless frame",
    gradient: ["#8b867a", "#dfd9cb", "#69645c"],
    titleBox: "#e4ddcf",
    textBox: "#f7f3ea",
    typeBox: "#d5cfc3",
    statBox: "#e1d9cc",
    border: "#28241f",
    pinline: "#9a9183",
    ink: "#211d18",
    mutedInk: "#645d53",
    symbolFill: "#e2dccf",
    treatment: "Neutral stock",
  },
};

export const RARITY_ACCENTS = {
  common: "#151515",
  uncommon: "#8b9295",
  rare: "#c79731",
  mythic: "#d95b28",
} as const;

export function parseManaCost(manaCost: string): string[] {
  const value = manaCost.trim().toUpperCase().replace(/[;,]+/g, " ");

  if (!value) {
    return [];
  }

  return Array.from(value.matchAll(/\{([^}]*)\}|[^\s{}]+/g))
    .flatMap((match) => parseManaChunk(match[1] ?? match[0]))
    .filter(Boolean);
}

export function formatManaCost(manaCost: string): string {
  return formatManaSymbols(parseManaCost(manaCost))
    .map((symbol) => `{${symbol}}`)
    .join("");
}

export function formatManaSymbols(symbols: string[]): string[] {
  const variableSymbols: string[] = [];
  const colorlessSymbols: Array<{ symbol: string; index: number }> = [];
  const coloredSymbols: Array<{ colors: ManaColor[]; symbol: string; typeRank: number; index: number }> = [];
  const otherSymbols: Array<{ symbol: string; index: number }> = [];
  let genericTotal = 0;
  let genericTokenCount = 0;

  symbols.forEach((symbol, index) => {
    const canonicalSymbol = normalizeManaSymbol(symbol);

    if (/^\d+$/.test(canonicalSymbol)) {
      genericTokenCount += 1;
      genericTotal += Number(canonicalSymbol);
      return;
    }

    if (VARIABLE_MANA_ORDER.includes(canonicalSymbol)) {
      variableSymbols.push(canonicalSymbol);
      return;
    }

    if (canonicalSymbol === "C" || canonicalSymbol === "S") {
      colorlessSymbols.push({ symbol: canonicalSymbol, index });
      return;
    }

    const colors = getSymbolColors(canonicalSymbol);

    if (colors.length > 0) {
      coloredSymbols.push({
        colors,
        symbol: canonicalSymbol,
        typeRank: getColoredSymbolTypeRank(canonicalSymbol),
        index,
      });
      return;
    }

    otherSymbols.push({ symbol: canonicalSymbol, index });
  });

  const colorOrder = getColorOrder(coloredSymbols.flatMap((entry) => entry.colors));
  const colorRank = new Map(colorOrder.map((color, index) => [color, index]));
  const formattedSymbols: string[] = [];

  formattedSymbols.push(
    ...variableSymbols.sort(
      (first, second) => VARIABLE_MANA_ORDER.indexOf(first) - VARIABLE_MANA_ORDER.indexOf(second),
    ),
  );

  const hasOnlyZeroGenericMana =
    genericTokenCount > 0 &&
    formattedSymbols.length === 0 &&
    colorlessSymbols.length === 0 &&
    coloredSymbols.length === 0 &&
    otherSymbols.length === 0;

  if (genericTotal > 0 || hasOnlyZeroGenericMana) {
    formattedSymbols.push(String(genericTotal));
  }

  formattedSymbols.push(
    ...colorlessSymbols
      .sort((first, second) => {
        if (first.symbol !== second.symbol) {
          return first.symbol === "C" ? -1 : 1;
        }

        return first.index - second.index;
      })
      .map((entry) => entry.symbol),
  );

  formattedSymbols.push(
    ...coloredSymbols
      .sort((first, second) => {
        const firstColorRank = Math.min(
          ...first.colors.map((color) => colorRank.get(color) ?? COLOR_WHEEL.indexOf(color)),
        );
        const secondColorRank = Math.min(
          ...second.colors.map((color) => colorRank.get(color) ?? COLOR_WHEEL.indexOf(color)),
        );

        if (firstColorRank !== secondColorRank) {
          return firstColorRank - secondColorRank;
        }

        if (first.typeRank !== second.typeRank) {
          return first.typeRank - second.typeRank;
        }

        return first.index - second.index;
      })
      .map((entry) => entry.symbol),
  );

  formattedSymbols.push(...otherSymbols.sort((first, second) => first.index - second.index).map((entry) => entry.symbol));

  return formattedSymbols;
}

export function getManaColors(manaCost: string): ManaColor[] {
  const colors = new Set<ManaColor>();

  for (const token of parseManaCost(manaCost)) {
    for (const color of ["W", "U", "B", "R", "G"] as ManaColor[]) {
      if (token.includes(color)) {
        colors.add(color);
      }
    }
  }

  return Array.from(colors);
}

export function getManualFrameColors(card: CardDraft): ManaColor[] {
  return normalizeFrameColors(card.frameColors ?? []);
}

export function getFrameColors(card: CardDraft): ManaColor[] {
  const manualColors = getManualFrameColors(card);

  if (manualColors.length > 0) {
    return manualColors;
  }

  return normalizeFrameColors(getManaColors(card.manaCost));
}

export function inferFrameIdentity(card: CardDraft): FrameIdentity {
  if (card.frameSelection && card.frameSelection !== "auto") {
    return card.frameSelection;
  }

  if (isArtifactFrameCard(card)) {
    return "artifact";
  }

  const manualColors = getManualFrameColors(card);

  if (manualColors.length > 1) {
    return "gold";
  }

  if (manualColors.length === 1) {
    return COLOR_NAMES[manualColors[0]];
  }

  return inferAutomaticFrameIdentity(card);
}

export function inferAutomaticFrameIdentity(card: CardDraft): FrameIdentity {
  const typeInfo = parseTypeLine(card.typeLine);
  const manaColors = getManaColors(card.manaCost);

  if (typeInfo.cardTypes.includes("Land")) {
    return "land";
  }

  if (typeInfo.cardTypes.includes("Artifact")) {
    return "artifact";
  }

  if (manaColors.length > 1) {
    return "gold";
  }

  if (manaColors.length === 1) {
    return COLOR_NAMES[manaColors[0]];
  }

  return "colorless";
}

export function inferFrameEffects(card: CardDraft): FrameEffect[] {
  const typeInfo = parseTypeLine(card.typeLine);
  const effects: FrameEffect[] = [];

  if (typeInfo.cardTypes.includes("Enchantment")) {
    effects.push("nyx");
  }

  if (typeInfo.supertypes.includes("Legendary") && !typeInfo.cardTypes.includes("Planeswalker")) {
    effects.push("legendary");
  }

  return effects;
}

export function inferFrameStyle(card: CardDraft): FrameStyle {
  if (card.frameSelection && card.frameSelection !== "auto") {
    return FRAME_STYLES[card.frameSelection];
  }

  if (isArtifactFrameCard(card)) {
    return FRAME_STYLES.artifact;
  }

  const manualColors = getManualFrameColors(card);

  if (manualColors.length > 1) {
    return buildMulticolorFrameStyle(manualColors);
  }

  if (manualColors.length === 1) {
    return FRAME_STYLES[COLOR_NAMES[manualColors[0]]];
  }

  const manaColors = normalizeFrameColors(getManaColors(card.manaCost));

  if (manaColors.length > 1) {
    return buildMulticolorFrameStyle(manaColors);
  }

  return FRAME_STYLES[inferFrameIdentity(card)];
}

export function isCreature(card: CardDraft): boolean {
  return card.typeLine.toLowerCase().includes("creature");
}

export function hasPowerToughnessBox(card: CardDraft): boolean {
  const typeInfo = parseTypeLine(card.typeLine);

  return typeInfo.cardTypes.includes("Creature") || typeInfo.subtypes.includes("Vehicle");
}

export function isArtifactFrameCard(card: CardDraft): boolean {
  const cardTypes = parseTypeLine(card.typeLine).cardTypes;

  return cardTypes.includes("Artifact") && !cardTypes.includes("Land");
}

export function normalizeManaInput(input: string): string {
  return formatManaCost(input);
}

function parseManaChunk(chunk: string): string[] {
  const normalized = chunk.trim().toUpperCase();

  if (!normalized) {
    return [];
  }

  if (normalized === "TAP" || normalized === "UNTAP") {
    return [normalized];
  }

  if (normalized === "COLORLESS" || normalized === "DIAMOND" || normalized === "◇") {
    return ["C"];
  }

  if (normalized.includes("/")) {
    return [normalized.replace(/\s+/g, "")];
  }

  if (/^\d+$/.test(normalized)) {
    return [normalized];
  }

  return normalized.match(/\d+|[A-Z]/g) ?? [];
}

function normalizeManaSymbol(symbol: string): string {
  const normalized = symbol.trim().toUpperCase();

  if (!normalized.includes("/")) {
    return normalized;
  }

  const parts = normalized.split("/").map((part) => part.trim()).filter(Boolean);
  const colors = parts.filter(isManaColor);
  const hasTwoBridge = parts.includes("2");
  const hasPhyrexian = parts.includes("P");

  if (hasTwoBridge && colors.length === 1) {
    return `2/${colors[0]}`;
  }

  if (hasPhyrexian && colors.length === 1) {
    return `${colors[0]}/P`;
  }

  if (colors.length === 2) {
    const pairSymbol = HYBRID_PAIR_SYMBOLS[colors.join("")];

    if (!pairSymbol) {
      return normalized;
    }

    return hasPhyrexian ? `${pairSymbol}/P` : pairSymbol;
  }

  return normalized;
}

function getSymbolColors(symbol: string): ManaColor[] {
  return COLOR_WHEEL.filter((color) => symbol.split("/").includes(color) || symbol === color);
}

function getColoredSymbolTypeRank(symbol: string): number {
  const parts = symbol.split("/");

  if (parts.includes("2")) {
    return 1;
  }

  if (parts.includes("P")) {
    return 2;
  }

  if (parts.length > 1) {
    return 3;
  }

  return 0;
}

function getColorOrder(colors: ManaColor[]): ManaColor[] {
  const uniqueColors = new Set(colors);
  const colorKey = COLOR_WHEEL.filter((color) => uniqueColors.has(color)).join("");

  return COLOR_SET_ORDERS[colorKey] ?? COLOR_WHEEL;
}

function isManaColor(value: string): value is ManaColor {
  return COLOR_WHEEL.includes(value as ManaColor);
}

function normalizeFrameColors(colors: ManaColor[]): ManaColor[] {
  const selectedColors = new Set(colors);
  const canonicalColors = COLOR_WHEEL.filter((color) => selectedColors.has(color));

  return getColorOrder(canonicalColors).filter((color) => selectedColors.has(color));
}

function buildMulticolorFrameStyle(colors: ManaColor[]): FrameStyle {
  const frames = colors.map((color) => FRAME_STYLES[COLOR_NAMES[color]]);
  const first = frames[0];
  const middle = frames[Math.floor(frames.length / 2)];
  const last = frames[frames.length - 1];
  const colorLabel = formatColorLabel(colors);

  return {
    ...FRAME_STYLES.gold,
    label: `${colorLabel} frame`,
    gradient: [first.gradient[0], middle.titleBox, last.gradient[2]],
    titleBox: blendFrameBox(first.titleBox, middle.titleBox),
    typeBox: blendFrameBox(middle.typeBox, last.typeBox),
    statBox: blendFrameBox(first.statBox, last.statBox),
    pinline: first.pinline,
    treatment: `${colorLabel} pinline`,
  };
}

function parseTypeLine(typeLine: string): {
  supertypes: string[];
  cardTypes: string[];
  subtypes: string[];
} {
  const [left, right = ""] = typeLine.trim().split(TYPE_WORD_PATTERN);
  const leftWords = left.split(/\s+/).filter(Boolean);
  const normalizedLeftWords = leftWords.map(normalizeTypeWord);
  const supertypes = normalizedLeftWords.filter((word) =>
    ["Basic", "Legendary", "Ongoing", "Snow", "World"].includes(word),
  );
  const cardTypes = normalizedLeftWords
    .filter((word) => !supertypes.includes(word));

  return {
    supertypes,
    cardTypes,
    subtypes: right.split(/\s+/).filter(Boolean).map(normalizeTypeWord),
  };
}

function normalizeTypeWord(word: string): string {
  const lowerWord = word.toLowerCase();

  return `${lowerWord.charAt(0).toUpperCase()}${lowerWord.slice(1)}`;
}

function formatColorLabel(colors: ManaColor[]): string {
  if (colors.length === 5) {
    return "Five-color";
  }

  return colors.map((color) => FRAME_COLOR_LABELS[color]).join("-");
}

function blendFrameBox(primary: string, secondary: string): string {
  const first = parseHexColor(primary);
  const second = parseHexColor(secondary);

  if (!first || !second) {
    return secondary;
  }

  const mixed = first.map((channel, index) =>
    Math.round(channel * 0.58 + second[index] * 0.42),
  );

  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function parseHexColor(color: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{6})$/i.exec(color);

  if (!match) {
    return null;
  }

  const value = match[1];

  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}
