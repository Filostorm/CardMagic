import { ImageSourcePropType } from "react-native";

import { CardBackId } from "@/types/card";

export type CardBackOption = {
  id: CardBackId;
  label: string;
  description: string;
  source?: ImageSourcePropType;
  sourceScale?: number;
  sourceTranslateY?: number;
  palette: {
    outer: string;
    inner: string;
    panel: string;
    panelDeep: string;
    oval: string;
    ovalDeep: string;
    title: string;
    accent: string;
  };
};

export type CustomCardBackEntry = {
  id: CardBackId;
  label: string;
  description: string;
  uri: string;
  createdAt: string;
  prompt?: string;
};

export const DEFAULT_CARD_BACK_ID: CardBackId = "cardmagicProxy";

export const CARD_BACK_OPTIONS: CardBackOption[] = [
  {
    id: "cardmagicProxy",
    label: "CardMagic",
    description: "Brown spellbook back with proxy markings",
    source: require("../../assets/card-assets/card-backs/cardmagic-proxy-default.jpeg"),
    sourceScale: 1.1,
    palette: {
      outer: "#110d0a",
      inner: "#5a2f18",
      panel: "#9b5c29",
      panelDeep: "#3b1c12",
      oval: "#214d83",
      ovalDeep: "#102848",
      title: "#f4d58f",
      accent: "#d6482f",
    },
  },
  {
    id: "cardmagicMidnight",
    label: "Midnight",
    description: "Blue-black proof back for playtest decks",
    source: require("../../assets/card-assets/card-backs/cardmagic-proxy-midnight.jpeg"),
    palette: {
      outer: "#070b12",
      inner: "#172945",
      panel: "#2f5d8f",
      panelDeep: "#0d1625",
      oval: "#6847a5",
      ovalDeep: "#20183f",
      title: "#d6e7ff",
      accent: "#d85b47",
    },
  },
  {
    id: "cardmagicParchment",
    label: "Parchment",
    description: "Light proof back with printed proxy stamp",
    source: require("../../assets/card-assets/card-backs/cardmagic-proxy-parchment.jpeg"),
    palette: {
      outer: "#17120d",
      inner: "#80603c",
      panel: "#d5ae6c",
      panelDeep: "#5c3a20",
      oval: "#386b7c",
      ovalDeep: "#163642",
      title: "#fff2c8",
      accent: "#bd4031",
    },
  },
  {
    id: "cardmagicNeon",
    label: "Neon",
    description: "Cyber-neon proof back with luminous circuit trim",
    source: require("../../assets/card-assets/card-backs/cardmagic-proxy-neon.jpeg"),
    palette: {
      outer: "#02030a",
      inner: "#06192b",
      panel: "#0cc8ff",
      panelDeep: "#160021",
      oval: "#ff2fcf",
      ovalDeep: "#070712",
      title: "#d9fbff",
      accent: "#39ff7a",
    },
  },
  {
    id: "cardmagicNature",
    label: "Nature",
    description: "Forest proof back with moss, bark, and leaf-vein texture",
    source: require("../../assets/card-assets/card-backs/cardmagic-proxy-nature.jpeg"),
    palette: {
      outer: "#0d1008",
      inner: "#2f4420",
      panel: "#54733a",
      panelDeep: "#18250f",
      oval: "#446b2c",
      ovalDeep: "#17270f",
      title: "#ece0b7",
      accent: "#b78434",
    },
  },
  {
    id: "cardmagicDragon",
    label: "Dragon",
    description: "Draconic proof back with scale texture and embered trim",
    source: require("../../assets/card-assets/card-backs/cardmagic-proxy-dragon.jpeg"),
    palette: {
      outer: "#110606",
      inner: "#4c120d",
      panel: "#8a2d18",
      panelDeep: "#210807",
      oval: "#7f1d16",
      ovalDeep: "#260806",
      title: "#f0d49a",
      accent: "#c24a22",
    },
  },
  {
    id: "cardmagicCircuit",
    label: "Circuit",
    description: "PCB proof back with copper traces and status-light pips",
    source: require("../../assets/card-assets/card-backs/cardmagic-proxy-circuit.jpeg"),
    palette: {
      outer: "#03120c",
      inner: "#123b25",
      panel: "#1f6a3d",
      panelDeep: "#071b12",
      oval: "#2e7a4a",
      ovalDeep: "#0a2417",
      title: "#f1d38a",
      accent: "#d7942b",
    },
  },
  {
    id: "cardmagicArmor",
    label: "Armor",
    description: "Armored proof back with riveted steel and chainmail texture",
    source: require("../../assets/card-assets/card-backs/cardmagic-proxy-armor.jpeg"),
    palette: {
      outer: "#080a0c",
      inner: "#26313a",
      panel: "#6c7378",
      panelDeep: "#171c21",
      oval: "#54595d",
      ovalDeep: "#1c2024",
      title: "#eef1ef",
      accent: "#b58b38",
    },
  },
];

const CUSTOM_CARD_BACK_PALETTE = {
  outer: "#050403",
  inner: "#24201a",
  panel: "#6c5140",
  panelDeep: "#17120f",
  oval: "#293f57",
  ovalDeep: "#121d2b",
  title: "#f1e1ba",
  accent: "#c85a3c",
};

export function getCustomCardBackOption(entry: CustomCardBackEntry): CardBackOption {
  return {
    id: entry.id,
    label: entry.label,
    description: entry.description,
    source: { uri: entry.uri },
    palette: CUSTOM_CARD_BACK_PALETTE,
  };
}

export function getCardBackOptions(customBacks: CustomCardBackEntry[] = []) {
  return [
    ...CARD_BACK_OPTIONS,
    ...customBacks.map(getCustomCardBackOption),
  ];
}

export function getCardBackOption(id: CardBackId | undefined | null, customBacks: CustomCardBackEntry[] = []) {
  return getCardBackOptions(customBacks).find((option) => option.id === id) ?? CARD_BACK_OPTIONS[0];
}
