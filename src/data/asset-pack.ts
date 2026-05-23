export const DEFAULT_ASSET_PACK = {
  id: "full-magic-pack",
  name: "Full Magic Pack",
  version: "local-mse-subset",
  includes: [
    "M15-style raster card frames",
    "mana symbol image glyphs",
    "power/toughness frame overlays",
    "Beleren and MPlantin font files",
    "rarity color treatments",
    "bring-your-own-art image slot",
  ],
  legalNote:
    "This app is configured for a local-only asset copy from the user-supplied Magic Set Editor pack. Do not redistribute the bundled assets unless you have distribution rights.",
};

export const ASSET_PACK_TEMPLATE = {
  id: "cardmagic-user-pack",
  name: "CardMagic User Asset Pack",
  version: "0.1.0",
  author: "Your name",
  license: "User supplied. Do not redistribute assets unless you have rights.",
  frames: {
    white: "frames/white.png",
    blue: "frames/blue.png",
    black: "frames/black.png",
    red: "frames/red.png",
    green: "frames/green.png",
    gold: "frames/gold.png",
    artifact: "frames/artifact.png",
    land: "frames/land.png",
    colorless: "frames/colorless.png",
  },
  symbols: {
    W: "symbols/w.svg",
    U: "symbols/u.svg",
    B: "symbols/b.svg",
    R: "symbols/r.svg",
    G: "symbols/g.svg",
    C: "symbols/c.svg",
    T: "symbols/tap.svg",
  },
  fonts: {
    title: "fonts/title.ttf",
    body: "fonts/body.ttf",
    symbols: "fonts/symbols.ttf",
  },
  printTreatments: {
    common: "print/common.png",
    uncommon: "print/uncommon.png",
    rare: "print/rare.png",
    mythic: "print/mythic.png",
  },
  requiredNotice:
    "This pack is for assets you own, created yourself, or have permission to use.",
};

export const ASSET_PACK_TEMPLATE_JSON = `${JSON.stringify(ASSET_PACK_TEMPLATE, null, 2)}\n`;
