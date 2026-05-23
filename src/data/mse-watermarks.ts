import { ImageSourcePropType } from "react-native";

export type MseWatermarkCategory =
  | "mana"
  | "ravnica"
  | "tarkir"
  | "strixhaven"
  | "faction";

export type MseWatermarkPreset = {
  id: string;
  label: string;
  category: MseWatermarkCategory;
  source: ImageSourcePropType;
};

export const MSE_WATERMARK_CATEGORY_LABELS: Record<MseWatermarkCategory, string> = {
  mana: "Mana",
  ravnica: "Ravnica Guilds",
  tarkir: "Tarkir",
  strixhaven: "Strixhaven",
  faction: "Factions",
};

export const MSE_WATERMARK_PRESETS: MseWatermarkPreset[] = [
  {
    id: "mse-watermark-w",
    label: "White",
    category: "mana",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/w.png"),
  },
  {
    id: "mse-watermark-u",
    label: "Blue",
    category: "mana",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/u.png"),
  },
  {
    id: "mse-watermark-b",
    label: "Black",
    category: "mana",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/b.png"),
  },
  {
    id: "mse-watermark-r",
    label: "Red",
    category: "mana",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/r.png"),
  },
  {
    id: "mse-watermark-g",
    label: "Green",
    category: "mana",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/g.png"),
  },
  {
    id: "mse-watermark-c",
    label: "Colorless",
    category: "mana",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/c.png"),
  },
  {
    id: "mse-watermark-azorius",
    label: "Azorius",
    category: "ravnica",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/azorius.png"),
  },
  {
    id: "mse-watermark-boros",
    label: "Boros",
    category: "ravnica",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/boros.png"),
  },
  {
    id: "mse-watermark-dimir",
    label: "Dimir",
    category: "ravnica",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/dimir.png"),
  },
  {
    id: "mse-watermark-golgari",
    label: "Golgari",
    category: "ravnica",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/golgari.png"),
  },
  {
    id: "mse-watermark-gruul",
    label: "Gruul",
    category: "ravnica",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/gruul.png"),
  },
  {
    id: "mse-watermark-izzet",
    label: "Izzet",
    category: "ravnica",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/izzet.png"),
  },
  {
    id: "mse-watermark-orzhov",
    label: "Orzhov",
    category: "ravnica",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/orzhov.png"),
  },
  {
    id: "mse-watermark-rakdos",
    label: "Rakdos",
    category: "ravnica",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/rakdos.png"),
  },
  {
    id: "mse-watermark-selesnya",
    label: "Selesnya",
    category: "ravnica",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/selesnya.png"),
  },
  {
    id: "mse-watermark-simic",
    label: "Simic",
    category: "ravnica",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/simic.png"),
  },
  {
    id: "mse-watermark-abzan",
    label: "Abzan",
    category: "tarkir",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/abzan.png"),
  },
  {
    id: "mse-watermark-jeskai",
    label: "Jeskai",
    category: "tarkir",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/jeskai.png"),
  },
  {
    id: "mse-watermark-mardu",
    label: "Mardu",
    category: "tarkir",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/mardu.png"),
  },
  {
    id: "mse-watermark-sultai",
    label: "Sultai",
    category: "tarkir",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/sultai.png"),
  },
  {
    id: "mse-watermark-temur",
    label: "Temur",
    category: "tarkir",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/temur.png"),
  },
  {
    id: "mse-watermark-atarka",
    label: "Atarka",
    category: "tarkir",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/atarka.png"),
  },
  {
    id: "mse-watermark-dromoka",
    label: "Dromoka",
    category: "tarkir",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/dromoka.png"),
  },
  {
    id: "mse-watermark-kolaghan",
    label: "Kolaghan",
    category: "tarkir",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/kolaghan.png"),
  },
  {
    id: "mse-watermark-ojutai",
    label: "Ojutai",
    category: "tarkir",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/ojutai.png"),
  },
  {
    id: "mse-watermark-silumgar",
    label: "Silumgar",
    category: "tarkir",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/silumgar.png"),
  },
  {
    id: "mse-watermark-lorehold",
    label: "Lorehold",
    category: "strixhaven",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/lorehold.png"),
  },
  {
    id: "mse-watermark-prismari",
    label: "Prismari",
    category: "strixhaven",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/prismari.png"),
  },
  {
    id: "mse-watermark-quandrix",
    label: "Quandrix",
    category: "strixhaven",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/quandrix.png"),
  },
  {
    id: "mse-watermark-silverquill",
    label: "Silverquill",
    category: "strixhaven",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/silverquill.png"),
  },
  {
    id: "mse-watermark-witherbloom",
    label: "Witherbloom",
    category: "strixhaven",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/witherbloom.png"),
  },
  {
    id: "mse-watermark-mirrodin",
    label: "Mirrodin",
    category: "faction",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/mirrodin.png"),
  },
  {
    id: "mse-watermark-phyrexia",
    label: "Phyrexia",
    category: "faction",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/phyrexia.png"),
  },
  {
    id: "mse-watermark-planeswalker",
    label: "Planeswalker",
    category: "faction",
    source: require("../../assets/card-assets/basic-m15/watermarks/mse/planeswalker.png"),
  },
];

export function getMseWatermarkPreset(id?: string): MseWatermarkPreset | undefined {
  return MSE_WATERMARK_PRESETS.find((preset) => preset.id === id);
}
