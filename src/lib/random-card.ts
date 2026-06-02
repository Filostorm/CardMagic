import { CardDraft, CardRarity, ManaColor } from "@/types/card";
import {
  DEFAULT_CARD_COPYRIGHT_LINE,
  DEFAULT_CARD_LANGUAGE,
  DEFAULT_CARD_SET_SIZE,
} from "@/lib/printing";
import { DEFAULT_BATTLE_SIEGE_REMINDER } from "@/lib/battle-card";

type SupportedCardKind =
  | "creature"
  | "artifactCreature"
  | "enchantmentCreature"
  | "instant"
  | "sorcery"
  | "kindredInstant"
  | "kindredSorcery"
  | "artifact"
  | "equipment"
  | "vehicle"
  | "enchantment"
  | "aura"
  | "saga"
  | "land"
  | "basicLand";

type Weighted<T> = {
  value: T;
  weight: number;
};

type GeneratedPlan = {
  kind: SupportedCardKind;
  rarity: CardRarity;
  colors: ManaColor[];
  manaValue: number;
  typeLine: string;
  subtypes: string[];
  legendary: boolean;
  rulesText: string;
  power: string;
  toughness: string;
};

type TokenSpecInput = {
  subtype: string;
  power: string;
  toughness: string;
  rulesText: string;
  artifact: boolean;
};

type TokenSpec = TokenSpecInput & {
  frameSelection: NonNullable<CardDraft["frameSelection"]>;
};

const COLORS: ManaColor[] = ["W", "U", "B", "R", "G"];

const TOKEN_FRAME_SELECTION_BY_COLOR: Record<ManaColor, NonNullable<CardDraft["frameSelection"]>> = {
  W: "white",
  U: "blue",
  B: "black",
  R: "red",
  G: "green",
};

const RARITY_WEIGHTS: Weighted<CardRarity>[] = [
  { value: "common", weight: 50 },
  { value: "uncommon", weight: 30 },
  { value: "rare", weight: 16 },
  { value: "mythic", weight: 4 },
];

const KIND_WEIGHTS: Weighted<SupportedCardKind>[] = [
  { value: "creature", weight: 32 },
  { value: "artifactCreature", weight: 7 },
  { value: "enchantmentCreature", weight: 5 },
  { value: "instant", weight: 12 },
  { value: "sorcery", weight: 11 },
  { value: "kindredInstant", weight: 2 },
  { value: "kindredSorcery", weight: 2 },
  { value: "artifact", weight: 6 },
  { value: "equipment", weight: 4 },
  { value: "vehicle", weight: 3 },
  { value: "enchantment", weight: 5 },
  { value: "aura", weight: 4 },
  { value: "saga", weight: 2 },
  { value: "land", weight: 4 },
  { value: "basicLand", weight: 1 },
];

const MANA_VALUE_WEIGHTS_BY_RARITY: Record<CardRarity, Weighted<number>[]> = {
  common: [
    { value: 1, weight: 10 },
    { value: 2, weight: 25 },
    { value: 3, weight: 27 },
    { value: 4, weight: 20 },
    { value: 5, weight: 12 },
    { value: 6, weight: 6 },
  ],
  uncommon: [
    { value: 1, weight: 8 },
    { value: 2, weight: 22 },
    { value: 3, weight: 26 },
    { value: 4, weight: 21 },
    { value: 5, weight: 14 },
    { value: 6, weight: 7 },
    { value: 7, weight: 2 },
  ],
  rare: [
    { value: 1, weight: 5 },
    { value: 2, weight: 17 },
    { value: 3, weight: 23 },
    { value: 4, weight: 23 },
    { value: 5, weight: 17 },
    { value: 6, weight: 10 },
    { value: 7, weight: 5 },
  ],
  mythic: [
    { value: 2, weight: 10 },
    { value: 3, weight: 17 },
    { value: 4, weight: 22 },
    { value: 5, weight: 21 },
    { value: 6, weight: 16 },
    { value: 7, weight: 9 },
    { value: 8, weight: 5 },
  ],
};

const BASIC_LAND_BY_COLOR: Record<ManaColor, string> = {
  W: "Plains",
  U: "Island",
  B: "Swamp",
  R: "Mountain",
  G: "Forest",
};

const LAND_MANA_WORD_BY_COLOR: Record<ManaColor, string> = {
  W: "white",
  U: "blue",
  B: "black",
  R: "red",
  G: "green",
};

const COLOR_WORDS: Record<ManaColor, string[]> = {
  W: ["Dawn", "Halo", "Sunspire", "Oath", "Marble", "Aegis"],
  U: ["Tide", "Mist", "Rune", "Glass", "Echo", "Moon"],
  B: ["Dusk", "Grave", "Hollow", "Ash", "Nocturne", "Mire"],
  R: ["Cinder", "Ember", "Furnace", "Thunder", "Spark", "Ruin"],
  G: ["Verdant", "Root", "Briar", "Elder", "Moss", "Wild"],
};

const COLOR_EPITHETS: Record<ManaColor, string[]> = {
  W: ["the Unbroken", "Shield of Dawn", "Vowkeeper", "Bright Marshal"],
  U: ["of the Silent Current", "Mindweaver", "the Far-Seer", "Mist Adept"],
  B: ["Grave Whisperer", "the Final Witness", "Mire Regent", "of the Last Toll"],
  R: ["Flame Herald", "Storm Reckoner", "the Uncaged", "Ash Duelist"],
  G: ["Rootspeaker", "the Wild-Bonded", "Oakheart", "of the Deep Grove"],
};

const PERSON_NAMES = [
  "Arel",
  "Brenna",
  "Cael",
  "Dovina",
  "Eron",
  "Fenn",
  "Ilyra",
  "Kavar",
  "Luma",
  "Niko",
  "Sorin",
  "Tavi",
  "Veyra",
  "Zara",
];

const CREATURE_TYPES_BY_COLOR: Record<ManaColor, string[]> = {
  W: ["Angel", "Cat", "Cleric", "Human", "Knight", "Soldier", "Spirit"],
  U: ["Bird", "Drake", "Faerie", "Merfolk", "Moonfolk", "Sphinx", "Wizard"],
  B: ["Assassin", "Bat", "Demon", "Rogue", "Skeleton", "Vampire", "Zombie"],
  R: ["Dragon", "Dwarf", "Elemental", "Goblin", "Minotaur", "Pirate", "Warrior"],
  G: ["Beast", "Druid", "Elf", "Hydra", "Scout", "Spider", "Wolf"],
};

const GENERIC_CREATURE_TYPES = [
  "Artificer",
  "Construct",
  "Golem",
  "Homunculus",
  "Scarecrow",
  "Shapeshifter",
  "Thopter",
];

const ROLE_TYPES = [
  "Advisor",
  "Artificer",
  "Bard",
  "Cleric",
  "Druid",
  "Knight",
  "Ranger",
  "Rogue",
  "Scout",
  "Warlock",
  "Warrior",
  "Wizard",
];

const ARTIFACT_TYPES = ["Clue", "Food", "Map", "Powerstone", "Treasure"];
const ENCHANTMENT_TYPES = ["Class", "Curse", "Room", "Shrine"];
const LAND_TYPES = ["Cave", "Desert", "Gate", "Lair", "Locus", "Mine", "Sphere", "Town"];
const KINDRED_TRIBES = ["Angel", "Dragon", "Elf", "Goblin", "Merfolk", "Rogue", "Spirit", "Zombie"];

const CREATURE_KEYWORDS_BY_COLOR: Record<ManaColor, string[]> = {
  W: ["First strike", "Flying", "Lifelink", "Vigilance"],
  U: ["Flying", "Prowess", "Ward {1}"],
  B: ["Deathtouch", "Lifelink", "Menace"],
  R: ["First strike", "Haste", "Menace", "Trample"],
  G: ["Reach", "Trample", "Vigilance", "Ward {1}"],
};

const FLAVOR_TEXTS = [
  "Every spell leaves a contour in the world.",
  "The oldest maps are written in weather.",
  "It remembers every hand that built it.",
  "A quiet answer can still split stone.",
  "The horizon folded, and something stepped through.",
  "No one argues with a prophecy that arrives early.",
  "Great power rarely announces which door it used.",
  "Some warnings arrive already sharpened.",
];

const ADVENTURE_NAMES_BY_COLOR: Record<ManaColor, string[]> = {
  W: ["Brave the Path", "Call for Aid", "Light the Way"],
  U: ["Slip Away", "Read the Clouds", "Borrow Time"],
  B: ["Bargain Below", "Claim the Lost", "Whisper Back"],
  R: ["Start a Riot", "Kindle Trouble", "Dash Ahead"],
  G: ["Root Road", "Seek the Grove", "Grow Tall"],
};

export function createRandomCard(previous?: CardDraft): CardDraft {
  const rarity = weightedPick(RARITY_WEIGHTS);
  const kind = pickKind(rarity);
  const colors = pickColors(kind, rarity);
  const manaValue = pickManaValue(kind, rarity, colors);
  const typeLine = buildTypeLine(kind, colors, rarity);
  const typeParts = parseGeneratedTypeLine(typeLine);
  const planWithoutRules = buildPlanShell({
    kind,
    rarity,
    colors,
    manaValue,
    typeLine,
    subtypes: typeParts.subtypes,
    legendary: typeParts.supertypes.includes("Legendary"),
  });
  const rulesText = buildRulesText(planWithoutRules);
  const stats = buildStats(planWithoutRules, rulesText);
  const plan = { ...planWithoutRules, rulesText, ...stats };
  const name = buildName(plan);
  const battleFields = previous?.typeFrame === "battle"
    ? buildBattleFields(colors, rarity)
    : undefined;
  const tokenFields = previous?.typeFrame === "token"
    ? buildTokenFields(colors, rarity)
    : undefined;
  const frontName = battleFields?.name ?? name;
  const adventureFields =
    previous?.typeFrame === "adventure"
      ? buildAdventureFields(colors, rarity)
      : {
          adventureName: previous?.adventureName,
          adventureManaCost: previous?.adventureManaCost,
          adventureTypeLine: previous?.adventureTypeLine,
          adventureRulesText: previous?.adventureRulesText,
        };
  const dfcFields =
    previous?.typeFrame === "dfc" || previous?.typeFrame === "battle"
      ? previous?.typeFrame === "battle"
        ? {
            dfcFace: previous?.dfcFace ?? "front",
            ...buildBattleBackFields(colors, rarity, frontName),
            backFrameTreatment: previous?.backFrameTreatment,
            backShowcaseFrame: previous?.backShowcaseFrame,
          }
        : {
            dfcFace: previous?.dfcFace,
            ...buildDfcBackFields(colors, rarity, frontName),
            backFrameTreatment: previous?.backFrameTreatment,
            backShowcaseFrame: previous?.backShowcaseFrame,
          }
      : {
          dfcFace: previous?.dfcFace,
          backName: previous?.backName,
          backManaCost: previous?.backManaCost,
          backTypeLine: previous?.backTypeLine,
          backRulesText: previous?.backRulesText,
          backFlavorText: previous?.backFlavorText,
          backPower: previous?.backPower,
          backToughness: previous?.backToughness,
          backArtUri: previous?.backArtUri,
          backArtTransform: previous?.backArtTransform,
          backFrameSelection: previous?.backFrameSelection,
          backFrameColors: previous?.backFrameColors,
          backFrameTreatment: previous?.backFrameTreatment,
          backShowcaseFrame: previous?.backShowcaseFrame,
        };
  const splitFields =
    previous?.typeFrame === "split" || previous?.typeFrame === "fuse" || previous?.typeFrame === "aftermath"
      ? {
          splitLayout: previous.splitLayout ?? previous.typeFrame,
          splitLeft: previous.splitLeft,
          splitRight: previous.splitRight,
          splitFuseText: previous.splitFuseText,
        }
      : {
          splitLayout: previous?.splitLayout,
          splitLeft: previous?.splitLeft,
          splitRight: previous?.splitRight,
          splitFuseText: previous?.splitFuseText,
        };
  const isSplitFrame = previous?.typeFrame === "split" || previous?.typeFrame === "fuse" || previous?.typeFrame === "aftermath";

  return {
    name: tokenFields?.name ?? frontName,
    manaCost: tokenFields?.manaCost ?? battleFields?.manaCost ?? buildManaCost(kind, colors, manaValue),
    typeLine: tokenFields?.typeLine ?? battleFields?.typeLine ?? typeLine,
    rarity,
    rulesText: useCardNameToken(tokenFields?.rulesText ?? battleFields?.rulesText ?? rulesText),
    flavorText: tokenFields || battleFields ? "" : shouldHaveFlavorText(rarity, rulesText) ? pick(FLAVOR_TEXTS) : "",
    ...adventureFields,
    ...dfcFields,
    ...splitFields,
    defense: battleFields?.defense ?? (previous?.typeFrame === "battle" ? previous?.defense : undefined),
    power: tokenFields?.power ?? (battleFields || isSplitFrame ? "" : plan.power),
    toughness: tokenFields?.toughness ?? (battleFields || isSplitFrame ? "" : plan.toughness),
    artist: previous?.artist?.trim().toLowerCase() === "local artist"
      ? "Unknown Artist"
      : previous?.artist || "Unknown Artist",
    setCode: previous?.setCode || "CMG",
    collectorNumber: previous?.collectorNumber || "001",
    setSize: previous?.setSize || DEFAULT_CARD_SET_SIZE,
    language: previous?.language || DEFAULT_CARD_LANGUAGE,
    copyrightLine: previous?.copyrightLine || DEFAULT_CARD_COPYRIGHT_LINE,
    setSymbolPreset: previous?.setSymbolPreset,
    setSymbolUri: previous?.setSymbolUri,
    setSymbolUsesRarityTreatment: previous?.setSymbolUsesRarityTreatment,
    artUri: previous?.artUri,
    artTransform: previous?.artTransform,
    frameSelection: tokenFields?.frameSelection ?? previous?.frameSelection,
    frameColors: tokenFields ? undefined : previous?.frameColors,
    frameTreatment: previous?.frameTreatment,
    backFrameTreatment: previous?.backFrameTreatment,
    backShowcaseFrame: previous?.backShowcaseFrame,
    typeFrame: previous?.typeFrame,
    frameCustomization: previous?.frameCustomization,
  };
}

function buildPlanShell(input: Omit<GeneratedPlan, "rulesText" | "power" | "toughness">): GeneratedPlan {
  return {
    ...input,
    rulesText: "",
    power: "",
    toughness: "",
  };
}

function pickKind(rarity: CardRarity): SupportedCardKind {
  if (rarity === "common") {
    return weightedPick(
      KIND_WEIGHTS.filter(
        (entry) =>
          !["saga", "vehicle", "kindredInstant", "kindredSorcery"].includes(entry.value),
      ),
    );
  }

  if (rarity === "mythic") {
    return weightedPick([
      ...KIND_WEIGHTS,
      { value: "creature", weight: 10 },
      { value: "enchantmentCreature", weight: 5 },
      { value: "saga", weight: 5 },
    ]);
  }

  return weightedPick(KIND_WEIGHTS);
}

function pickColors(kind: SupportedCardKind, rarity: CardRarity): ManaColor[] {
  if (kind === "basicLand") {
    return [pick(COLORS)];
  }

  if (kind === "land") {
    return chance(0.22) ? unique([pick(COLORS), pick(COLORS)]) : [pick(COLORS)];
  }

  if (["artifact", "equipment", "vehicle", "artifactCreature"].includes(kind) && chance(0.58)) {
    return [];
  }

  const maxColors = rarity === "common" ? 2 : rarity === "uncommon" ? 2 : 3;
  const colorCount = weightedPick([
    { value: 1, weight: 74 },
    { value: 2, weight: rarity === "common" ? 20 : 23 },
    { value: 3, weight: maxColors >= 3 ? 3 : 0 },
  ]);

  return shuffle(COLORS).slice(0, Math.min(colorCount, maxColors));
}

function pickManaValue(
  kind: SupportedCardKind,
  rarity: CardRarity,
  colors: ManaColor[],
): number {
  if (kind === "land" || kind === "basicLand") {
    return 0;
  }

  const rawValue = weightedPick(MANA_VALUE_WEIGHTS_BY_RARITY[rarity]);
  const minimum = Math.max(1, colors.length);
  const maximumByKind: Partial<Record<SupportedCardKind, number>> = {
    aura: 4,
    equipment: 4,
    instant: 5,
    kindredInstant: 5,
    vehicle: 5,
  };
  const maximum = maximumByKind[kind] ?? 8;

  return clamp(rawValue, minimum, maximum);
}

function buildTypeLine(
  kind: SupportedCardKind,
  colors: ManaColor[],
  rarity: CardRarity,
): string {
  if (kind === "basicLand") {
    return `Basic Land — ${BASIC_LAND_BY_COLOR[colors[0]]}`;
  }

  if (kind === "land") {
    return `Land — ${pick(LAND_TYPES)}`;
  }

  const legendary = shouldBeLegendary(kind, rarity);

  switch (kind) {
    case "creature":
      return joinTypeLine(
        [legendary ? "Legendary" : "", "Creature"],
        pickCreatureSubtypes(colors, rarity),
      );
    case "artifactCreature":
      return joinTypeLine(
        [legendary ? "Legendary" : "", "Artifact", "Creature"],
        pickCreatureSubtypes(colors, rarity, GENERIC_CREATURE_TYPES),
      );
    case "enchantmentCreature":
      return joinTypeLine(
        [legendary ? "Legendary" : "", "Enchantment", "Creature"],
        pickCreatureSubtypes(colors, rarity, ["Spirit", "God", "Nymph"]),
      );
    case "instant":
      return "Instant";
    case "sorcery":
      return "Sorcery";
    case "kindredInstant":
      return joinTypeLine(["Kindred", "Instant"], [pick(KINDRED_TRIBES)]);
    case "kindredSorcery":
      return joinTypeLine(["Kindred", "Sorcery"], [pick(KINDRED_TRIBES)]);
    case "artifact":
      return joinTypeLine([legendary ? "Legendary" : "", "Artifact"], [pick(ARTIFACT_TYPES)]);
    case "equipment":
      return joinTypeLine(["Artifact"], ["Equipment"]);
    case "vehicle":
      return joinTypeLine(["Artifact"], ["Vehicle"]);
    case "enchantment":
      return joinTypeLine([legendary ? "Legendary" : "", "Enchantment"], [
        pick(ENCHANTMENT_TYPES),
      ]);
    case "aura":
      return joinTypeLine(["Enchantment"], ["Aura"]);
    case "saga":
      return joinTypeLine([legendary ? "Legendary" : "", "Enchantment"], ["Saga"]);
  }
}

function shouldBeLegendary(kind: SupportedCardKind, rarity: CardRarity): boolean {
  if (rarity === "common") {
    return false;
  }

  if (!["creature", "artifactCreature", "enchantmentCreature", "artifact", "enchantment", "saga"].includes(kind)) {
    return false;
  }

  return chance(rarity === "mythic" ? 0.55 : rarity === "rare" ? 0.28 : 0.08);
}

function pickCreatureSubtypes(
  colors: ManaColor[],
  rarity: CardRarity,
  fallbackTypes: string[] = ROLE_TYPES,
): string[] {
  const colorPool = colors.flatMap((color) => CREATURE_TYPES_BY_COLOR[color]);
  const primaryPool = colorPool.length > 0 ? colorPool : fallbackTypes;
  const primaryType = pick(primaryPool);
  const wantsRole = chance(rarity === "common" ? 0.56 : 0.72);
  const secondaryType = wantsRole ? pick([...ROLE_TYPES, ...fallbackTypes]) : "";

  return unique([primaryType, secondaryType]).slice(0, rarity === "mythic" ? 3 : 2);
}

function joinTypeLine(typeWords: string[], subtypes: string[] = []): string {
  const typeText = typeWords.filter(Boolean).join(" ");

  if (subtypes.length === 0) {
    return typeText;
  }

  return `${typeText} — ${subtypes.join(" ")}`;
}

function parseGeneratedTypeLine(typeLine: string): {
  supertypes: string[];
  cardTypes: string[];
  subtypes: string[];
} {
  const [left, right = ""] = typeLine.split(/\s+[—-]\s+/);
  const words = left.split(/\s+/).filter(Boolean);
  const supertypes = words.filter((word) => ["Basic", "Legendary", "Snow", "Token"].includes(word));
  const cardTypes = words.filter((word) => !supertypes.includes(word));

  return {
    supertypes,
    cardTypes,
    subtypes: right.split(/\s+/).filter(Boolean),
  };
}

function buildManaCost(
  kind: SupportedCardKind,
  colors: ManaColor[],
  manaValue: number,
): string {
  if (kind === "land" || kind === "basicLand") {
    return "";
  }

  if (colors.length === 0) {
    return `{${manaValue}}`;
  }

  const coloredPipCount = Math.min(
    manaValue,
    colors.length + (manaValue >= 4 && chance(0.35) ? 1 : 0),
  );
  const pips = Array.from({ length: coloredPipCount }, (_, index) => colors[index % colors.length]);
  const genericCost = manaValue - pips.length;

  return [
    genericCost > 0 ? `{${genericCost}}` : "",
    ...pips.map((color) => `{${color}}`),
  ]
    .filter(Boolean)
    .join("");
}

function buildRulesText(plan: GeneratedPlan): string {
  switch (plan.kind) {
    case "basicLand":
      return "";
    case "land":
      return buildLandText(plan);
    case "instant":
    case "sorcery":
    case "kindredInstant":
    case "kindredSorcery":
      return buildSpellText(plan);
    case "artifact":
      return buildArtifactText(plan);
    case "equipment":
      return buildEquipmentText(plan);
    case "vehicle":
      return buildVehicleText(plan);
    case "enchantment":
      return buildEnchantmentText(plan);
    case "aura":
      return buildAuraText(plan);
    case "saga":
      return buildSagaText(plan);
    case "creature":
    case "artifactCreature":
    case "enchantmentCreature":
      return buildCreatureText(plan);
  }
}

function buildTokenFields(
  colors: ManaColor[],
  rarity: CardRarity,
): Pick<
  CardDraft,
  "name" | "manaCost" | "typeLine" | "rulesText" | "flavorText" | "power" | "toughness" | "frameSelection"
> {
  const wantsArtifact = colors.length === 0 || chance(0.18);
  const color = wantsArtifact ? undefined : colors[0] ?? pick(COLORS);
  const token = color ? pickTokenCreature(color, rarity) : pickArtifactToken(rarity);

  return {
    name: `${token.subtype} Token`,
    manaCost: "",
    typeLine: joinTypeLine(
      ["Token", token.artifact ? "Artifact" : "", "Creature"],
      [token.subtype],
    ),
    rulesText: token.rulesText,
    flavorText: "",
    power: token.power,
    toughness: token.toughness,
    frameSelection: token.frameSelection,
  };
}

function buildAdventureFields(
  colors: ManaColor[],
  rarity: CardRarity,
): Pick<
  CardDraft,
  "adventureName" | "adventureManaCost" | "adventureTypeLine" | "adventureRulesText"
> {
  const color = colors[0] ?? pick(COLORS);
  const spellKind: "instant" | "sorcery" = chance(0.42) ? "instant" : "sorcery";
  const manaValue = rarity === "common" ? randomInt(1, 2) : randomInt(1, 3);
  const adventureName = pick(ADVENTURE_NAMES_BY_COLOR[color]);
  const effect = useCardNameToken(pickSpellEffect(color, spellKind));

  return {
    adventureName,
    adventureManaCost: buildManaCost(spellKind, [color], manaValue),
    adventureTypeLine: `${capitalize(spellKind)} — Adventure`,
    adventureRulesText: effect,
  };
}

function buildBattleFields(
  colors: ManaColor[],
  rarity: CardRarity,
): Pick<CardDraft, "name" | "manaCost" | "typeLine" | "rulesText" | "defense"> {
  const color = colors[0] ?? pick(COLORS);
  const plane = pick([
    "Astra",
    "Belenon",
    "Cairnspire",
    "Eldara",
    "Karsus",
    "Loryn",
    "Mistral",
    "Nalara",
    "Tavernia",
    "Vannifar",
    "Zendikar",
  ]);
  const manaValue = rarity === "mythic" ? randomInt(4, 6) : randomInt(2, 5);
  const name = `Invasion of ${plane}`;
  const effect = pickBattleEffect(color);

  return {
    name,
    manaCost: buildManaCost("sorcery", colors.length > 0 ? colors : [color], manaValue),
    typeLine: "Battle — Siege",
    rulesText: `${DEFAULT_BATTLE_SIEGE_REMINDER}\nWhen NAME enters the battlefield, ${effect}`,
    defense: String(clamp(manaValue + randomInt(0, 2), 3, 7)),
  };
}

function buildBattleBackFields(
  colors: ManaColor[],
  rarity: CardRarity,
  frontName: string,
): Pick<
  CardDraft,
  | "backName"
  | "backManaCost"
  | "backTypeLine"
  | "backRulesText"
  | "backFlavorText"
  | "backPower"
  | "backToughness"
  | "backFrameColors"
> {
  const color = colors[0] ?? pick(COLORS);
  const planeName = frontName.replace(/^Invasion of\s+/i, "").trim() || "the Plane";
  const manaValue = rarity === "mythic" ? randomInt(5, 7) : randomInt(3, 5);
  const power = clamp(manaValue + randomInt(-1, 1), 2, 8);
  const toughness = clamp(power + randomInt(0, 2), 3, 9);
  const name = `${planeName} Reclaimed`;
  const keyword = pickCreatureKeyword([color]);

  return {
    backName: name,
    backManaCost: "",
    backTypeLine: `Creature — ${pickCreatureType(color)}`,
    backRulesText: unique([
      keyword,
      `When ${name} enters, ${pickBattleReward(color)}`,
    ]).join("\n"),
    backFlavorText: "",
    backPower: String(power),
    backToughness: String(toughness),
    backFrameColors: colors.length > 0 ? colors : [color],
  };
}

function buildDfcBackFields(
  colors: ManaColor[],
  rarity: CardRarity,
  frontName: string,
): Pick<
  CardDraft,
  | "backName"
  | "backManaCost"
  | "backTypeLine"
  | "backRulesText"
  | "backFlavorText"
  | "backPower"
  | "backToughness"
  | "backFrameColors"
> {
  const color = colors[1] ?? colors[0] ?? pick(COLORS);
  const manaValue = rarity === "mythic" ? randomInt(4, 7) : randomInt(3, 6);
  const power = clamp(manaValue + randomInt(-1, 1), 2, 8);
  const toughness = clamp(power + randomInt(-1, 2), 2, 9);
  const keyword = pickCreatureKeyword([color]);
  const name = `${frontName.split(",")[0]}, Unbound`;
  const rulesText = unique([
    keyword,
    pick([
      `Whenever NAME attacks, ${pickSpellEffect(color, "sorcery").replace(/^Target /, "target ")}`,
      "At the beginning of your end step, if NAME transformed this turn, draw a card.",
      "When NAME enters, return up to one target card from your graveyard to your hand.",
    ]),
  ].filter(Boolean)).join("\n");

  return {
    backName: name,
    backManaCost: buildManaCost("creature", [color], manaValue),
    backTypeLine: `Creature — ${pickCreatureType(color)}`,
    backRulesText: useCardNameToken(rulesText),
    backFlavorText: "",
    backPower: String(power),
    backToughness: String(toughness),
    backFrameColors: [color],
  };
}

function buildCreatureText(plan: GeneratedPlan): string {
  const lines: string[] = [];
  const keyword = pickCreatureKeyword(plan.colors);

  if (keyword && chance(plan.rarity === "common" ? 0.68 : 0.86)) {
    lines.push(keyword);
  }

  const trigger = pickCreatureTrigger(plan);

  if (trigger && (plan.rarity !== "common" || lines.length === 0 || chance(0.48))) {
    lines.push(trigger);
  }

  if (plan.legendary || plan.rarity === "rare" || plan.rarity === "mythic") {
    lines.push(pickRareCreatureAbility(plan));
  }

  return unique(lines).slice(0, plan.rarity === "common" ? 2 : 3).join("\n");
}

function buildSpellText(plan: GeneratedPlan): string {
  const effects = plan.colors.length > 1
    ? plan.colors.map((color) => pickSpellEffect(color, plan.kind)).slice(0, 2)
    : [pickSpellEffect(plan.colors[0] ?? pick(COLORS), plan.kind)];

  if (plan.rarity === "rare" || plan.rarity === "mythic") {
    effects.push(pick([
      "Draw a card.",
      "Create a tapped Treasure token.",
      "You may cast a spell with mana value 2 or less from your hand without paying its mana cost.",
      "Copy this spell. You may choose new targets for the copy.",
    ]));
  }

  const kindredLine =
    plan.kind === "kindredInstant" || plan.kind === "kindredSorcery"
      ? `If you control a ${plan.subtypes[0]}, ${conditionalizeEffect(
          pickSpellEffect(plan.colors[0] ?? "G", plan.kind),
        )}`
      : "";

  return unique([...effects, kindredLine].filter(Boolean)).slice(0, 3).join("\n");
}

function buildArtifactText(plan: GeneratedPlan): string {
  const activatedCost = plan.colors.length > 0 ? `{${plan.colors[0]}}` : "{2}";
  const effects = [
    "{T}: Add {C}.",
    `${activatedCost}, {T}, Sacrifice this artifact: Draw a card.`,
    "Whenever you cast your second spell each turn, put a charge counter on this artifact.",
    "Remove three charge counters from this artifact: Create a 3/3 colorless Golem artifact creature token.",
  ];

  return pick(plan.rarity === "common" ? effects.slice(0, 2) : effects);
}

function buildEquipmentText(plan: GeneratedPlan): string {
  const boost = plan.manaValue <= 2 ? "+1/+1" : chance(0.5) ? "+2/+0" : "+1/+2";
  const keyword = pickCreatureKeyword(plan.colors);
  const abilityText = keyword ? ` and has ${keyword.toLowerCase()}` : "";
  const equipCost = Math.max(1, Math.min(4, plan.manaValue));

  return `Equipped creature gets ${boost}${abilityText}.\nEquip {${equipCost}}`;
}

function buildVehicleText(plan: GeneratedPlan): string {
  const crewCost = clamp(Math.ceil(Number(plan.power || plan.manaValue) / 2), 1, 5);
  const attackTrigger = pick([
    "Whenever this Vehicle attacks, scry 1.",
    "Whenever this Vehicle attacks, create a tapped Treasure token.",
    "Whenever this Vehicle becomes crewed, target creature gets +1/+1 until end of turn.",
  ]);

  return `${attackTrigger}\nCrew ${crewCost}`;
}

function buildEnchantmentText(plan: GeneratedPlan): string {
  const color = plan.colors[0] ?? pick(COLORS);

  return pick([
    `Creatures you control get +1/+0 as long as you control a ${pickCreatureType(color)}.`,
    `At the beginning of your end step, if you gained life this turn, ${color === "W" ? "create a 1/1 white Soldier creature token." : "draw a card."}`,
    "Whenever you cast an enchantment spell, scry 1.",
    "The first spell you cast during each of your turns costs {1} less to cast.",
  ]);
}

function buildAuraText(plan: GeneratedPlan): string {
  const color = plan.colors[0] ?? pick(COLORS);
  const bonusByColor: Record<ManaColor, string> = {
    W: "+1/+2 and has vigilance",
    U: "+1/+1 and has flying",
    B: "+2/+0 and has menace",
    R: "+2/+0 and has haste",
    G: "+2/+2 and has trample",
  };

  return `Enchant creature\nEnchanted creature gets ${bonusByColor[color]}.`;
}

function buildSagaText(plan: GeneratedPlan): string {
  const color = plan.colors[0] ?? pick(COLORS);

  return [
    `I, II — ${pickSagaChapter(color)}`,
    `III — ${pickSagaFinale(color)}`,
  ].join("\n");
}

function buildLandText(plan: GeneratedPlan): string {
  const manaLine =
    plan.colors.length === 1
      ? `{T}: Add one mana of ${LAND_MANA_WORD_BY_COLOR[plan.colors[0]]}.`
      : `{T}: Add ${plan.colors.map((color) => `{${color}}`).join(" or ")}.`;
  const utility = pick([
    "{2}, {T}: Scry 1.",
    "{3}, {T}: Create a tapped Treasure token.",
    "{4}, {T}: Target creature gets +1/+1 until end of turn.",
    "{T}, Sacrifice this land: Draw a card.",
  ]);

  return chance(0.58) ? `${manaLine}\n${utility}` : manaLine;
}

function buildStats(plan: GeneratedPlan, rulesText: string): Pick<GeneratedPlan, "power" | "toughness"> {
  if (plan.kind === "vehicle") {
    const power = clamp(plan.manaValue + randomInt(1, 3), 2, 8);
    const toughness = clamp(power + randomInt(-1, 2), 2, 8);

    return { power: String(power), toughness: String(toughness) };
  }

  if (!["creature", "artifactCreature", "enchantmentCreature"].includes(plan.kind)) {
    return { power: "", toughness: "" };
  }

  const colorBias = getStatBias(plan.colors);
  const keywordTax = /(flying|lifelink|deathtouch|double strike)/i.test(rulesText) ? -1 : 0;
  const rarityBonus = plan.rarity === "rare" ? 1 : plan.rarity === "mythic" ? 2 : 0;
  const power = clamp(
    plan.manaValue + randomInt(-1, 1) + colorBias.power + keywordTax + rarityBonus,
    0,
    10,
  );
  const toughness = clamp(
    plan.manaValue + randomInt(-1, 2) + colorBias.toughness + rarityBonus,
    1,
    12,
  );

  return { power: String(power), toughness: String(toughness) };
}

function getStatBias(colors: ManaColor[]): { power: number; toughness: number } {
  if (colors.length === 0) {
    return { power: 0, toughness: 0 };
  }

  const totals = colors.reduce(
    (bias, color) => {
      const colorBias: Record<ManaColor, { power: number; toughness: number }> = {
        W: { power: -1, toughness: 1 },
        U: { power: -1, toughness: 0 },
        B: { power: 0, toughness: 0 },
        R: { power: 1, toughness: -1 },
        G: { power: 1, toughness: 1 },
      };

      return {
        power: bias.power + colorBias[color].power,
        toughness: bias.toughness + colorBias[color].toughness,
      };
    },
    { power: 0, toughness: 0 },
  );

  return {
    power: Math.round(totals.power / colors.length),
    toughness: Math.round(totals.toughness / colors.length),
  };
}

function buildName(plan: GeneratedPlan): string {
  if (plan.kind === "basicLand") {
    return plan.subtypes[0] || "Basic Land";
  }

  const primaryColor = plan.colors[0];
  const colorWord = primaryColor ? pick(COLOR_WORDS[primaryColor]) : pick(["Chrome", "Null", "Foundry", "Worn"]);

  if (plan.legendary) {
    const epithetColor = primaryColor ?? pick(COLORS);
    return `${pick(PERSON_NAMES)}, ${pick(COLOR_EPITHETS[epithetColor])}`;
  }

  if (plan.kind === "land") {
    return `${colorWord} ${pick(["Bastion", "Crossing", "Grotto", "Haven", "Sanctum", "Vault"])}`;
  }

  if (["instant", "kindredInstant"].includes(plan.kind)) {
    return `${colorWord} ${pick(["Intervention", "Rebuke", "Surge", "Veil", "Warning"])}`;
  }

  if (["sorcery", "kindredSorcery"].includes(plan.kind)) {
    return `${colorWord} ${pick(["Awakening", "Command", "Convergence", "Edict", "Rite"])}`;
  }

  if (plan.kind === "aura") {
    return `${colorWord} ${pick(["Mantle", "Mark", "Oath", "Shaping", "Vow"])}`;
  }

  if (plan.kind === "equipment") {
    return `${colorWord} ${pick(["Blade", "Harness", "Lantern", "Sigil", "Standard"])}`;
  }

  if (plan.kind === "vehicle") {
    return `${colorWord} ${pick(["Caravel", "Engine", "Skiff", "Runner", "Wagon"])}`;
  }

  const subtype = plan.subtypes[0] || pick(["Invoker", "Relic", "Sentinel", "Spellsmith"]);
  return `${colorWord} ${subtype}`;
}

function pickCreatureKeyword(colors: ManaColor[]): string {
  const pool = colors.length > 0
    ? colors.flatMap((color) => CREATURE_KEYWORDS_BY_COLOR[color])
    : ["Vigilance", "Menace", "Ward {1}"];

  return pick(pool);
}

function pickCreatureTrigger(plan: GeneratedPlan): string {
  const color = plan.colors[0] ?? pick(COLORS);
  const type = plan.subtypes[0] || "creature";
  const enterEffect: Record<ManaColor, string[]> = {
    W: ["create a 1/1 white Soldier creature token.", "you gain 3 life."],
    U: ["scry 2.", "return up to one target nonland permanent to its owner's hand."],
    B: ["each opponent loses 1 life and you gain 1 life.", "mill three cards."],
    R: ["it deals 1 damage to any target.", "create a tapped Treasure token."],
    G: ["put a +1/+1 counter on target creature.", "search your library for a basic land card, reveal it, put it into your hand, then shuffle."],
  };

  return pick([
    `When CARDNAME enters the battlefield, ${pick(enterEffect[color])}`,
    `Whenever CARDNAME attacks, ${pickAttackEffect(color)}`,
    `Whenever another ${type} enters the battlefield under your control, CARDNAME gets +1/+1 until end of turn.`,
  ]);
}

function pickAttackEffect(color: ManaColor): string {
  const effects: Record<ManaColor, string[]> = {
    W: ["tap target creature defending player controls.", "you gain 2 life."],
    U: ["draw a card, then discard a card.", "scry 1."],
    B: ["defending player loses 1 life.", "each opponent mills two cards."],
    R: ["CARDNAME deals 1 damage to defending player.", "exile the top card of your library. You may play it this turn."],
    G: ["put a +1/+1 counter on CARDNAME.", "create a tapped 1/1 green Saproling creature token."],
  };

  return pick(effects[color]);
}

function pickRareCreatureAbility(plan: GeneratedPlan): string {
  const color = plan.colors[0] ?? pick(COLORS);
  const abilities: Record<ManaColor, string[]> = {
    W: ["Other creatures you control get +1/+1.", "Whenever you gain life, put a +1/+1 counter on up to one target creature."],
    U: ["Whenever you draw your second card each turn, create a tapped 1/1 blue Bird creature token with flying.", "You may look at the top card of your library any time."],
    B: ["Whenever another creature dies, each opponent loses 1 life.", "At the beginning of your end step, return up to one target creature card with mana value 2 or less from your graveyard to your hand."],
    R: ["Whenever you cast a noncreature spell, CARDNAME deals 1 damage to each opponent.", "Creatures you control have haste."],
    G: ["Whenever one or more +1/+1 counters are put on CARDNAME, draw a card. This ability triggers only once each turn.", "Lands you control have \"{T}: Add one mana of any color.\""],
  };

  return pick(abilities[color]);
}

function pickSpellEffect(color: ManaColor, kind: SupportedCardKind): string {
  const instantSpeed = kind === "instant" || kind === "kindredInstant";
  const effects: Record<ManaColor, string[]> = {
    W: [
      "Exile target tapped creature.",
      "Creatures you control get +1/+1 until end of turn.",
      "Destroy target artifact or enchantment.",
    ],
    U: [
      instantSpeed ? "Counter target noncreature spell unless its controller pays {2}." : "Draw two cards, then discard a card.",
      "Return target nonland permanent to its owner's hand.",
      "Scry 2, then draw a card.",
    ],
    B: [
      "Destroy target creature.",
      "Target opponent discards a card.",
      "Return target creature card from your graveyard to your hand.",
    ],
    R: [
      "CARDNAME deals 3 damage to any target.",
      "Exile the top two cards of your library. You may play one of them this turn.",
      "Destroy target artifact.",
    ],
    G: [
      "Target creature you control fights target creature you don't control.",
      "Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
      "Put two +1/+1 counters on target creature.",
    ],
  };

  return pick(effects[color]);
}

function pickBattleEffect(color: ManaColor): string {
  const effects: Record<ManaColor, string[]> = {
    W: [
      "create two 1/1 white Soldier creature tokens.",
      "exile target tapped creature an opponent controls.",
    ],
    U: [
      "draw two cards, then discard a card.",
      "return up to one target nonland permanent to its owner's hand.",
    ],
    B: [
      "each opponent sacrifices a creature or planeswalker.",
      "return target creature card from your graveyard to your hand.",
    ],
    R: [
      "it deals 3 damage to any target.",
      "exile the top two cards of your library. You may play one of them this turn.",
    ],
    G: [
      "search your library for up to two basic land cards, put them onto the battlefield tapped, then shuffle.",
      "put two +1/+1 counters on target creature you control.",
    ],
  };

  return pick(effects[color]);
}

function pickBattleReward(color: ManaColor): string {
  const rewards: Record<ManaColor, string[]> = {
    W: ["creatures you control get +1/+1 until end of turn."],
    U: ["scry 2, then draw a card."],
    B: ["each opponent loses 2 life and you gain 2 life."],
    R: ["this creature deals 2 damage to any target."],
    G: ["put a +1/+1 counter on each creature you control."],
  };

  return pick(rewards[color]);
}

function pickSagaChapter(color: ManaColor): string {
  const chapters: Record<ManaColor, string[]> = {
    W: ["Create a 1/1 white Soldier creature token."],
    U: ["Scry 2, then draw a card."],
    B: ["Each opponent loses 2 life and you gain 2 life."],
    R: ["This Saga deals 2 damage to any target."],
    G: ["Search your library for a basic land card, reveal it, put it into your hand, then shuffle."],
  };

  return pick(chapters[color]);
}

function pickSagaFinale(color: ManaColor): string {
  const finales: Record<ManaColor, string[]> = {
    W: ["Creatures you control get +2/+2 and gain vigilance until end of turn."],
    U: ["Return up to two target nonland permanents to their owners' hands."],
    B: ["Return target creature card from your graveyard to the battlefield tapped."],
    R: ["Exile cards from the top of your library until you exile a nonland card. You may cast that card this turn."],
    G: ["Create a 4/4 green Beast creature token with trample."],
  };

  return pick(finales[color]);
}

function pickTokenCreature(
  color: ManaColor,
  rarity: CardRarity,
): TokenSpec {
  const tokenPool: Record<ManaColor, TokenSpecInput[]> = {
    W: [
      { subtype: "Soldier", power: "1", toughness: "1", rulesText: "Vigilance", artifact: false },
      { subtype: "Spirit", power: "1", toughness: "1", rulesText: "Flying", artifact: false },
      { subtype: "Knight", power: "2", toughness: "2", rulesText: "Vigilance", artifact: false },
    ],
    U: [
      { subtype: "Bird", power: "1", toughness: "1", rulesText: "Flying", artifact: false },
      { subtype: "Fish", power: "1", toughness: "1", rulesText: "", artifact: false },
      { subtype: "Wizard", power: "1", toughness: "2", rulesText: "Prowess", artifact: false },
    ],
    B: [
      { subtype: "Zombie", power: "2", toughness: "2", rulesText: "Decayed", artifact: false },
      { subtype: "Bat", power: "1", toughness: "1", rulesText: "Flying", artifact: false },
      { subtype: "Skeleton", power: "1", toughness: "1", rulesText: "Menace", artifact: false },
    ],
    R: [
      { subtype: "Goblin", power: "1", toughness: "1", rulesText: "Haste", artifact: false },
      { subtype: "Elemental", power: "3", toughness: "1", rulesText: "Trample, haste", artifact: false },
      { subtype: "Dragon", power: "4", toughness: "4", rulesText: "Flying", artifact: false },
    ],
    G: [
      { subtype: "Saproling", power: "1", toughness: "1", rulesText: "", artifact: false },
      { subtype: "Elf", power: "1", toughness: "1", rulesText: "{T}: Add {G}.", artifact: false },
      { subtype: "Beast", power: "3", toughness: "3", rulesText: "Trample", artifact: false },
    ],
  };
  const availableTokens = rarity === "common"
    ? tokenPool[color].filter((token) => Number(token.power) <= 2)
    : tokenPool[color];
  const token = pick(availableTokens.length > 0 ? availableTokens : tokenPool[color]);

  return {
    ...token,
    frameSelection: TOKEN_FRAME_SELECTION_BY_COLOR[color],
  };
}

function pickArtifactToken(
  rarity: CardRarity,
): TokenSpec {
  const token = pick([
    { subtype: "Servo", power: "1", toughness: "1", rulesText: "", artifact: true },
    { subtype: "Thopter", power: "1", toughness: "1", rulesText: "Flying", artifact: true },
    {
      subtype: "Golem",
      power: rarity === "common" ? "3" : "4",
      toughness: rarity === "common" ? "3" : "4",
      rulesText: "",
      artifact: true,
    },
  ]);

  return {
    ...token,
    frameSelection: "artifact",
  };
}

function pickCreatureType(color: ManaColor): string {
  return pick(CREATURE_TYPES_BY_COLOR[color]);
}

function shouldHaveFlavorText(rarity: CardRarity, rulesText: string): boolean {
  const lineCount = rulesText.split("\n").filter(Boolean).length;

  if (lineCount <= 1) {
    return true;
  }

  if (lineCount >= 3) {
    return false;
  }

  return chance(rarity === "common" ? 0.82 : rarity === "uncommon" ? 0.62 : 0.34);
}

function conditionalizeEffect(effect: string): string {
  if (effect.startsWith("CARDNAME")) {
    return effect;
  }

  return lowercaseFirst(effect);
}

function useCardNameToken(text: string): string {
  return text.replaceAll("CARDNAME", "NAME");
}

function lowercaseFirst(value: string): string {
  return `${value.charAt(0).toLowerCase()}${value.slice(1)}`;
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function weightedPick<T>(items: Weighted<T>[]): T {
  const availableItems = items.filter((item) => item.weight > 0);
  const totalWeight = availableItems.reduce((total, item) => total + item.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const item of availableItems) {
    roll -= item.weight;

    if (roll <= 0) {
      return item.value;
    }
  }

  return availableItems[availableItems.length - 1].value;
}

function pick<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items.filter(Boolean)));
}

function chance(probability: number): boolean {
  return Math.random() < probability;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
