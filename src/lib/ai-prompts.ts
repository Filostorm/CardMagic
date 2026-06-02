import { getFrameColors, inferFrameIdentity } from "@/lib/card-style";
import { getEditableCardFace } from "@/lib/dfc";
import { getLoyaltyAbilities, getStartingLoyalty } from "@/lib/planeswalker";
import { getSplitHalf, isSplitTypeFrame, toSplitHalfCard } from "@/lib/split-card";
import { CardDraft, CardKeyword, FrameIdentity, KeywordDefinition, ManaColor } from "@/types/card";

export type AiPromptId =
  | "cardArt"
  | "subjectMask"
  | "setSymbol"
  | "watermark"
  | "cardFromArt"
  | "artFromTextColor"
  | "randomCard";

export type AiPromptOption = {
  id: AiPromptId;
  label: string;
  intent: string;
  prompt: string;
};

export type ArtGeneratorPromptOptions = {
  variationSeed?: number;
  styleId?: ArtGeneratorStyleId;
};

export const ART_GENERATOR_STYLE_PRESETS = [
  {
    id: "wash",
    label: "Wash",
    profile: "transparent watercolor wash, pale paper grain, minimal background, soft lost-and-found edges",
  },
  {
    id: "oil",
    label: "Oil",
    profile: "classical oil-painted realism, sculpted anatomy, controlled brush texture, museum-painting finish",
  },
  {
    id: "gothic",
    label: "Gothic",
    profile: "gothic chiaroscuro illustration, near-black negative space, hard rim light, sparse cathedral geometry",
  },
  {
    id: "vista",
    label: "Vista",
    profile: "epic matte-painting landscape, tiny subject against vast simple shapes, clean atmospheric perspective",
  },
  {
    id: "poster",
    label: "Poster",
    profile: "graphic action poster, diagonal silhouette, flat shadow masses, limited motion debris",
  },
  {
    id: "storybook",
    label: "Storybook",
    profile: "illuminated storybook plate, decorative contour shapes, clean ornamental rhythm inside the scene",
  },
  {
    id: "symbolic",
    label: "Symbolic",
    profile: "surreal symbolic tableau, isolated props, quiet dream staging, uncluttered negative space",
  },
  {
    id: "specimen",
    label: "Specimen",
    profile: "natural history creature plate, side-lit anatomy, specimen clarity, plain habitat backdrop",
  },
  {
    id: "cinematic",
    label: "Cinematic",
    profile: "heroic cinematic key art, bold central silhouette, polished surfaces, simple radial light structure",
  },
  {
    id: "fresco",
    label: "Fresco",
    profile: "ancient fresco or mural, flattened perspective, mineral pigments, sculptural iconography",
  },
  {
    id: "battle",
    label: "Battle",
    profile: "battlefield concept art, one decisive gesture, broad smoke planes, very few readable props",
  },
  {
    id: "arcane",
    label: "Arcane",
    profile: "arcane diagram realism, precise instruments, clean desk or wall geometry, controlled glow",
  },
  {
    id: "ethereal",
    label: "Ethereal",
    profile: "ethereal enchantment vignette, translucent subject layers, soft gradients, open airy background",
  },
  {
    id: "brutalist",
    label: "Brutalist",
    profile: "brutalist dark fantasy, heavy simple forms, abrasive material texture, sparse smoky void",
  },
  {
    id: "biolume",
    label: "Biolume",
    profile: "bioluminescent nature study, organic silhouette, black-green depth, selective glowing accents only",
  },
  {
    id: "retro",
    label: "Retro",
    profile: "retro paperback cover, bold central staging, screenprint-like color blocks, visible brush edges",
  },
] as const;

export type ArtGeneratorPresetStyleId = (typeof ART_GENERATOR_STYLE_PRESETS)[number]["id"];
export type ArtGeneratorStyleId = "random" | ArtGeneratorPresetStyleId;

export const ART_GENERATOR_STYLE_OPTIONS = [
  { id: "random", label: "Random" },
  ...ART_GENERATOR_STYLE_PRESETS.map(({ id, label }) => ({ id, label })),
] as const satisfies ReadonlyArray<{ id: ArtGeneratorStyleId; label: string }>;

const EXPLICIT_VISUAL_STYLE_PATTERN =
  /\b(?:style|anime|manga|cartoon|cel[- ]?shaded|comic|graphic novel|pixel art|8[- ]?bit|16[- ]?bit|low poly|3d|rendered|photoreal|photo[- ]?real|realistic|oil painting|watercolor|gouache|ink|sketch|line art|charcoal|pastel|stained glass|woodcut|cut paper|clay|miniature|storybook|children'?s book|noir|cyberpunk|steampunk|art deco|retro|vintage|chibi)\b/i;
const SCENE_CUE_PATTERN =
  /\b(?:in|inside|within|at|among|amid|beneath|under|above|near|beside|before|overlooking|through|across)\s+(?:a|an|the)?\s*(?:forest|woods|jungle|swamp|marsh|bog|graveyard|crypt|cathedral|temple|city|street|alley|library|tower|castle|fortress|battlefield|mountain|canyon|desert|plains|farm|field|ocean|sea|reef|cave|cavern|ruin|workshop|laboratory|arena|village|garden|grove|sky|cloud|volcano|lava|snow|ice|island|ship|bridge|underworld|void|space|wasteland)\b/i;
const PALETTE_CUE_PATTERN =
  /\b(?:palette|color palette|monochrome|pastel|neon|muted|desaturated|saturated|high contrast|low contrast|sepia|grayscale|black and white|iridescent|rainbow|prismatic)\b/i;
const LIGHTING_CUE_PATTERN =
  /\b(?:lighting|lit|backlit|rim light|rim-lit|moonlight|sunlight|firelight|candlelight|spotlight|god-rays|volumetric|chiaroscuro|glow|glowing|bioluminescent|dawn|dusk|sunset|sunrise|noon|night)\b/i;

const DEFAULT_ENVIRONMENT_VARIATIONS = [
  "one simple architectural shape framing the subject",
  "a clean horizon line with broad atmospheric depth",
  "two or three large foreground shapes leading toward the subject",
  "a restrained reflective surface beneath the focal point",
  "a single symbolic prop near the subject",
  "large quiet background masses with minimal small detail",
  "a clear doorway, arch, or natural opening behind the subject",
  "a simplified terrain plane with one readable landmark",
  "a broad silhouette of distant architecture or trees",
  "negative space around the head, face, weapon, or spell effect",
  "a sparse environmental vignette with no crowding",
  "clean depth separation between foreground, subject, and background",
];

const DEFAULT_PALETTE_VARIATIONS = [
  "subtle complementary accent color at the focal point",
  "warm foreground against cooler distant atmosphere",
  "cool shadows with restrained warm highlights",
  "limited high-value highlight reserved for the face or spell effect",
  "desaturated background with saturated subject accents",
  "metallic and mineral secondary tones",
  "deep shadow masses balanced by luminous edge accents",
  "earthy neutrals supporting one vivid magical color",
  "smoky midtones with sharp chroma at the focal point",
  "pearlescent highlights on important surfaces",
  "weathered texture colors instead of flat primary hues",
  "tonal gradient from dark foreground to bright subject silhouette",
  "rich darks, controlled midtones, and selective bright accents",
  "color temperature shift between foreground and background",
  "subtle iridescence only in magical materials",
  "aged parchment and mineral undertones in secondary surfaces",
];

const DEFAULT_LIGHTING_VARIATIONS = [
  "single strong key light with readable cast shadows",
  "rim light separating the silhouette from the background",
  "volumetric shafts crossing behind the subject",
  "low-angle light creating heroic scale",
  "storm flash frozen at the peak of action",
  "soft bounce light from reflective ground",
  "glowing magical source integrated into the action",
  "backlit haze producing a clear silhouette",
  "spotlit subject with painterly falloff",
  "high-contrast chiaroscuro with controlled shadow detail",
  "dusty atmospheric light separating depth planes",
  "reflected colored light from nearby magic or terrain",
  "dappled light pattern across the foreground",
  "cool ambient light with one warm focal flare",
  "warm ambient light with one cool magical highlight",
  "light spilling from an unseen opening behind the subject",
];

const DEFAULT_TRADING_CARD_ART_PROFILES = ART_GENERATOR_STYLE_PRESETS.map((style) => style.profile);

const COLOR_LABELS: Record<ManaColor, string> = {
  W: "white",
  U: "blue",
  B: "black",
  R: "red",
  G: "green",
};

type ArtStyleCodexEntry = {
  theme: string;
  environment: string;
  palette: string;
  lighting: string;
};

type ArtStyleCodexPool = {
  theme: string[];
  environment: string[];
  palette: string[];
  lighting: string[];
};

const MONO_COLOR_ART_STYLE_CODEX: Record<ManaColor, ArtStyleCodexPool> = {
  W: {
    theme: [
      "order, light, sanctity",
      "communal courage and protective magic",
      "ritual law, disciplined formations, sacred architecture",
      "healing, dawn, oaths, and ceremonial restraint",
      "farmstead defense, civic duty, and radiant conviction",
      "angelic grace, banners, marble, and clean moral clarity",
    ],
    environment: [
      "sunlit marble plains, cathedral ruins, ordered farmland, alpine peaks",
      "white-stone ramparts overlooking golden fields",
      "quiet monastery courtyard with banners and polished armor",
      "alabaster bridge crossing a bright defensive moat",
      "mountain chapel above cloudline with wind-carved statues",
      "sun-washed village square prepared for a last defense",
      "ceremonial hall with columns, mosaics, and radiant windows",
      "high meadow shrine ringed by wheat, lilies, and standing stones",
    ],
    palette: [
      "ivory, warm gold, soft sky blue, alabaster, pale wheat, accents of polished silver",
      "cream, pearl, banner red, muted blue, sunlit brass",
      "chalk white, honey gold, pale lavender shadow, clean silver",
      "warm parchment, dove gray, white marble, sunrise peach",
      "alabaster, wheat, soft moss, clear blue sky, gold leaf",
      "porcelain white, champagne, pale rose, bright steel highlights",
    ],
    lighting: [
      "golden hour, volumetric god-rays through clouds, halation around the subject",
      "clean morning light with soft radiant bloom",
      "high noon clarity with crisp shadows and bright edges",
      "cathedral-window beams with dust motes and warm highlights",
      "backlit dawn glow creating a protective aura",
      "sunbreak after storm, luminous clouds, gentle rim light",
    ],
  },
  U: {
    theme: [
      "intellect, water, sky, illusion",
      "study, manipulation, reflection, and suspended motion",
      "ancient secrets, impossible geometry, and controlled magic",
      "tides, mirrors, storms, and lucid dreams",
      "scholarly precision, levitation, and arcane calculation",
      "cold patience, hidden knowledge, and aerial grace",
    ],
    environment: [
      "rain-slick spires, moonlit ocean, floating libraries, glacial caverns",
      "tower observatory suspended above a stormy sea",
      "submerged archive with drifting scrolls and glass domes",
      "mirror maze of water channels and blue stone",
      "ice cavern cut by luminous runes and frozen waterfalls",
      "cloud city docks with airships and suspended bridges",
      "quiet study where books orbit in slow magical currents",
      "tidal cave opening onto moonlit waves and distant stars",
    ],
    palette: [
      "deep sapphire, teal, silver, ice white, midnight indigo, accents of pearl",
      "storm blue, pale cyan, polished silver, rain gray",
      "ultramarine, seafoam, black-blue shadow, white glass",
      "indigo, turquoise, opal, fog gray, cold violet",
      "frost white, glacial blue, deep navy, mercury highlights",
      "blue-black ink, pearl, wet stone, cyan magical accents",
    ],
    lighting: [
      "cool moonlight, bioluminescent glow, refracted light through water or glass",
      "light scattered through rain and mist",
      "underwater caustics rippling across stone",
      "cold arcane glow from runes and floating diagrams",
      "soft lightning behind clouds with blue edge light",
      "dim library light with one luminous spell focus",
    ],
  },
  B: {
    theme: [
      "death, ambition, decay",
      "forbidden bargains, grave magic, hunger, and corruption",
      "necromancy, aristocratic cruelty, and moral rot",
      "swamp survival, parasites, bones, and ruthless power",
      "shadowed ritual, blood price, and private obsession",
      "ruin, poison, haunted memory, and sharpened ambition",
    ],
    environment: [
      "foggy graveyard, oily swamp, gothic crypt, ash-choked battlefield",
      "catacomb vault with wet stone and broken sarcophagi",
      "black-water marsh under dead trees and hanging moss",
      "decaying throne room lit by guttering candles",
      "bone-strewn battlefield where fog clings to armor",
      "plague alley with ravens, iron grates, and sickly vapors",
      "sunken mausoleum with roots piercing the ceiling",
      "ritual chamber marked by blood, salt, and old coins",
    ],
    palette: [
      "bone white, deep violet, oxidized iron, sickly chartreuse, smoky charcoal, blood red accent",
      "lamp black, bruise purple, tarnished gold, corpse gray",
      "wet umber, swamp green, clotted red, pale bone",
      "charcoal, black plum, old ivory, rusted iron",
      "inky black, cold blue shadow, poison green, dried blood",
      "smoke gray, funeral violet, ash white, dark bronze",
    ],
    lighting: [
      "low-key candlelight, sickly green miasma glow, deep shadow with single rim light",
      "thin moonlight through fog with harsh underlighting",
      "green swamp-fire reflected from below",
      "single occult lantern against near-black shadow",
      "candle clusters creating hard, theatrical shadows",
      "cold rim light on bone and wet metal",
    ],
  },
  R: {
    theme: [
      "passion, fire, mountains, freedom",
      "impulse, battle frenzy, celebration, and explosive magic",
      "rebellion, speed, thunder, and volcanic force",
      "reckless invention, sparks, metal, and sudden motion",
      "rage, courage, desert heat, and hard-won freedom",
      "wild emotion, drums, banners, and shattering impact",
    ],
    environment: [
      "volcanic crag, lava field, burning village, jagged peaks at sunset",
      "storm-battered canyon with red dust and lightning",
      "forge yard under a shower of sparks",
      "desert mesa with racing clouds and cracked earth",
      "festival street lit by torches and red banners",
      "battlefield ridge with smoke, drums, and flying embers",
      "goblin-built scaffold around a roaring furnace",
      "mountain pass collapsing into molten stone",
    ],
    palette: [
      "ember orange, crimson, molten gold, ash gray, soot black, white-hot accents",
      "scarlet, copper, hot yellow, smoke gray, charcoal",
      "rust red, canyon ochre, sun-baked tan, iron black",
      "lava orange, dark burgundy, brass, dusty rose",
      "burnt sienna, flame yellow, volcanic black, pale sparks",
      "red clay, raw umber, bright forge gold, ashen blue shadow",
    ],
    lighting: [
      "firelight from below, lava glow, sparks and embers, dust-filled sun",
      "hard sunset glare through airborne dust",
      "white-hot forge light with dark surrounding silhouettes",
      "lightning flash freezing fast action",
      "torchlight streaks and motion-blurred embers",
      "low-angle molten glow with extreme warm highlights",
    ],
  },
  G: {
    theme: [
      "nature, growth, beasts, instinct",
      "ancient roots, predation, renewal, and primal harmony",
      "wild strength, seasons, overgrowth, and living memory",
      "beast kinship, territorial power, and natural law",
      "verdant magic, spores, bark, bone, and patient growth",
      "untamed wilderness, canopy depth, and instinctive motion",
    ],
    environment: [
      "ancient forest, mossy ruin, jungle canopy, sunlit glade, root-tangled cavern",
      "towering redwood cathedral with shafts of green light",
      "overgrown temple swallowed by vines and flowers",
      "mossy ravine with a hidden waterfall",
      "root bridge crossing a luminous forest stream",
      "prehistoric jungle clearing with enormous leaves",
      "fungal grove glowing softly under fallen logs",
      "stone circle surrounded by antlers, feathers, and ivy",
    ],
    palette: [
      "deep moss green, amber, loam brown, dappled sunlight gold, emerald, accents of bone and bark",
      "fern green, dark bark, warm amber, cream bone",
      "olive, jade, mushroom tan, wet stone gray, leaf gold",
      "deep forest green, ochre, clay, pale sunlight",
      "emerald, moss, walnut brown, wildflower yellow",
      "lichen gray, pine green, rich soil, soft sky blue",
    ],
    lighting: [
      "god-rays through canopy, dappled forest light, soft humid haze",
      "warm light filtered through leaves and pollen",
      "misty morning forest light with luminous edges",
      "low sun behind branches creating layered silhouettes",
      "soft bioluminescent glow from fungi and insects",
      "storm-cleared woodland light with wet reflective bark",
    ],
  },
};

const TWO_COLOR_ART_STYLE_CODEX: Record<string, ArtStyleCodexPool> = {
  WU: {
    theme: ["law, sky, architecture, controlled intellect", "ritual order shaped by illusion and air"],
    environment: ["sky citadels and cloud-marble courts", "rain-washed senate balcony above a bright harbor"],
    palette: ["ivory, sapphire, pearl, soft sky blue, gold trim", "white marble, cobalt, pale cyan, polished silver"],
    lighting: ["clean ordered daylight with controlled atmospheric haze", "cool skylight with soft gold reflected from stone"],
  },
  UB: {
    theme: ["secrecy, thought, water, shadow", "memory theft, hidden passages, and reflected lies"],
    environment: ["shadowed canals and secret libraries", "subterranean archive behind a waterfall"],
    palette: ["midnight indigo, deep violet, silver, wet black, muted teal", "ink blue, black glass, violet, cold silver"],
    lighting: ["cold moonlight, deep occlusion shadow, narrow rim light", "thin blue light through water with heavy shadow"],
  },
  BR: {
    theme: ["spectacle, violence, indulgence, fire", "reckless ambition, blood price, and ecstatic ruin"],
    environment: ["burning ruins and blood-cult arenas", "smoke-filled carnival stage built over a charnel pit"],
    palette: ["crimson, soot black, bone, ember orange, tarnished metal", "blood red, pitch black, hot gold, corpse white"],
    lighting: ["hot firelight against pitch dark with sparks and smoke", "underlit flame and harsh red rim light"],
  },
  RG: {
    theme: ["wilderness, rage, ruin, instinct", "earth-shaking momentum, beast packs, and broken cities"],
    environment: ["wild canyons and overgrown ruins", "collapsed avenue reclaimed by roots and red dust"],
    palette: ["rust, moss, ember, loam brown, sun-baked stone", "moss green, clay red, amber, bark brown"],
    lighting: ["harsh sun through dust with warm bounce light", "stormy sunset cutting through dust and leaves"],
  },
  GW: {
    theme: ["community, nature, sanctity, growth", "sacred ecology, shared defense, and blossoming order"],
    environment: ["sunlit grove temples and blossoming sanctuaries", "living cathedral grown from trees and white stone"],
    palette: ["emerald, ivory, warm gold, bark brown, fresh leaf green", "leaf green, alabaster, wheat gold, soft brown"],
    lighting: ["soft warm daylight, leaf-filtered glow, gentle halation", "golden canopy light with clean radiant edges"],
  },
  WB: {
    theme: ["faith, debt, wealth, death", "sanctified corruption, contracts, and ancestral authority"],
    environment: ["gilded crypts and decadent cathedrals", "marble bank-vault chapel lined with ancestor masks"],
    palette: ["gold, black, bone marble, ivory, muted violet", "cream, obsidian, antique gold, candle amber"],
    lighting: ["cold light through stained glass with hard shadow", "candlelit gold glints against deep chapel shadow"],
  },
  UR: {
    theme: ["invention, impulse, storms, experiment", "reckless theory, lightning, and explosive discovery"],
    environment: ["storm-lit workshops and lightning towers", "copper laboratory suspended in a thundercloud"],
    palette: ["electric blue, magenta, copper, white-hot arc light, smoky gray", "cobalt, vermilion, brass, violet sparks"],
    lighting: ["crackling arc-light, lightning flashes, glowing machinery", "blue-white electrical bloom with hot copper reflections"],
  },
  BG: {
    theme: ["decay, survival, rot, renewal", "fungal inheritance, predation, and life from death"],
    environment: ["fungal undercity and rotting tombs", "root-choked ossuary with glowing spores"],
    palette: ["rot green, deep violet, bone, black earth, sickly yellow-green", "moss black, mushroom tan, violet shadow, bone"],
    lighting: ["sickly bioluminescence and humid underground shadow", "green spore-glow through heavy wet darkness"],
  },
  RW: {
    theme: ["courage, zeal, combat, sunlight", "military devotion, speed, and righteous impact"],
    environment: ["sunburst battlements and fortress-temples", "training yard before a burning-gold war gate"],
    palette: ["crimson, gold, ivory, polished steel, banner red", "white stone, scarlet cloth, brass, hot sunlight"],
    lighting: ["hard noon sun, radiant highlights, dust and banners in motion", "low golden war light with red reflected highlights"],
  },
  GU: {
    theme: ["adaptation, water, growth, biomancy", "hybrid life, research gardens, and tidal evolution"],
    environment: ["bioluminescent reefs and grafted gardens", "glasshouse lagoon full of experimental vines"],
    palette: ["jade, aqua, pearl, deep sea blue, luminous green", "teal, emerald, pearl white, deep kelp shadow"],
    lighting: ["underwater shimmer, caustic light, soft organic glow", "green-blue laboratory glow mixed with water caustics"],
  },
};

const THREE_COLOR_ART_STYLE_CODEX: Record<string, ArtStyleCodexPool> = {
  WUB: {
    theme: ["courtly intrigue, law, memory, and death", "controlled hierarchy, secrets, and sacred authority"],
    environment: ["moonlit marble palace with crypt doors below", "cathedral archive built over black canals"],
    palette: ["ivory, midnight blue, black marble, silver, muted gold", "pearl, indigo, bone, charcoal, cold violet"],
    lighting: ["cold stained-glass light falling into deep shadow", "moonlight and candlelight separated into hard planes"],
  },
  UBR: {
    theme: ["forbidden invention, ambition, storms, and spectacle", "volatile secrets, fire, shadow, and impossible machinery"],
    environment: ["lightning laboratory above a black-water furnace", "smoke-choked tower full of mirrors and copper coils"],
    palette: ["electric blue, crimson, black, copper, violet smoke", "indigo, ember orange, soot, magenta, tarnished brass"],
    lighting: ["arc-light flashes against red furnace glow", "blue lightning rim light with hot underlighting"],
  },
  BRG: {
    theme: ["predation, rage, rot, and volcanic life", "savage renewal, blood, fungus, and broken stone"],
    environment: ["lava canyon overtaken by toxic jungle", "bone-strewn ravine with fungal trees and embers"],
    palette: ["crimson, rot green, black earth, ember gold, bone", "moss, blood red, ash gray, loam brown, molten orange"],
    lighting: ["lava glow through spore haze", "smoky sunset with green bioluminescent undergrowth"],
  },
  RGW: {
    theme: ["wild heroism, community, sunlight, and beasts", "clan defense, fertile land, and sacred fire"],
    environment: ["sunlit canyon grove around a fortress shrine", "farmstead temple at the edge of a wild forest"],
    palette: ["emerald, crimson, ivory, warm gold, clay", "moss green, banner red, wheat, bark, polished steel"],
    lighting: ["golden outdoor light with dust and leaf shimmer", "hard sun softened by canopy and banners"],
  },
  GWU: {
    theme: ["harmony, knowledge, sky, and living order", "scholarly ecology, calm magic, and sanctified growth"],
    environment: ["floating garden-library in a cloudlit grove", "marble aqueduct threaded through giant trees"],
    palette: ["ivory, jade, sapphire, pearl, soft gold", "leaf green, sky blue, alabaster, teal, warm wheat"],
    lighting: ["clean daylight filtered through leaves and water", "soft blue-white glow with warm canopy highlights"],
  },
  WBG: {
    theme: ["ritual growth, ancestral duty, decay, and sanctity", "life-death cycles, grave gardens, and solemn vows"],
    environment: ["gilded mausoleum swallowed by roots and blossoms", "sunlit grave-grove with white stone markers"],
    palette: ["ivory, moss, black, antique gold, bone", "deep green, cream, funeral violet, loam, pale sunlight"],
    lighting: ["warm daylight over cool crypt shadow", "candlelight and forest glow interlaced"],
  },
  URW: {
    theme: ["martial invention, lightning discipline, and radiant speed", "tactical brilliance, fire, sky, and civic courage"],
    environment: ["storm-lit fortress workshop with banners", "sunny battlement lined with copper lightning rods"],
    palette: ["sapphire, crimson, ivory, brass, white-hot blue", "sky blue, banner red, pearl, copper, gold"],
    lighting: ["clean sun interrupted by electric arc flashes", "blue-white lightning over warm fortress light"],
  },
  BGU: {
    theme: ["mutating secrets, rot, water, and hidden knowledge", "adaptive darkness, deep biology, and patient intellect"],
    environment: ["submerged fungal archive under black water", "glowing swamp laboratory inside twisted roots"],
    palette: ["teal, violet, rot green, black, pearl", "deep blue, moss, bone, ink black, luminous aqua"],
    lighting: ["bioluminescent green-blue glow in wet darkness", "moonlit water caustics through spore haze"],
  },
  RWB: {
    theme: ["zeal, blood debt, sacrifice, and burning authority", "militant faith, ambition, fire, and judgment"],
    environment: ["war cathedral burning behind black banners", "gilded arena chapel under smoke and sunlight"],
    palette: ["crimson, ivory, black, gold, bone", "scarlet, obsidian, champagne, ash, dried blood"],
    lighting: ["firelight and stained-glass beams crossing hard shadow", "hot rim light on armor against black smoke"],
  },
  GUR: {
    theme: ["wild experiment, storm, growth, and elemental impulse", "adaptive wilderness, invention, speed, and living lightning"],
    environment: ["jungle laboratory struck by a magical storm", "bioluminescent canyon river under red thunderclouds"],
    palette: ["jade, electric blue, ember orange, copper, moss", "teal, leaf green, crimson, storm gray, pearl"],
    lighting: ["lightning through humid jungle haze", "blue-green organic glow with hot red highlights"],
  },
};

const FRAME_IDENTITY_LABELS: Record<FrameIdentity, string> = {
  white: "white",
  blue: "blue",
  black: "black",
  red: "red",
  green: "green",
  gold: "multicolor",
  artifact: "artifact",
  land: "land",
  colorless: "colorless",
};

export function buildAiPromptOptions(card: CardDraft): AiPromptOption[] {
  const faceCard = getEditableCardFace(card);
  const cardContext = buildCardContext(card);
  const visualContext = buildVisualContext(faceCard);
  const rulesContext = buildRulesContext(card);

  return [
    {
      id: "cardArt",
      label: "Card Art",
      intent: "Image prompt",
      prompt: buildCardArtPrompt(faceCard, cardContext, visualContext),
    },
    {
      id: "setSymbol",
      label: "Set Symbol",
      intent: "Transparent icon prompt",
      prompt: buildSetSymbolPrompt(faceCard, cardContext),
    },
    {
      id: "watermark",
      label: "Watermark",
      intent: "Transparent emblem prompt",
      prompt: buildWatermarkPrompt(faceCard, cardContext),
    },
    {
      id: "cardFromArt",
      label: "Card From Art",
      intent: "Vision-to-card prompt",
      prompt: buildCardFromArtPrompt(cardContext),
    },
    {
      id: "artFromTextColor",
      label: "Art From Text",
      intent: "Rules and color prompt",
      prompt: buildArtFromTextColorPrompt(faceCard, rulesContext, visualContext),
    },
    {
      id: "randomCard",
      label: "Random Card",
      intent: "Card-design prompt",
      prompt: buildRandomCardPrompt(card),
    },
  ];
}

export function getDefaultArtGeneratorRequest(card: CardDraft): string {
  const faceCard = getEditableCardFace(card);
  const name = faceCard.name.trim();
  const colorIdentity = describeColorIdentity(faceCard);
  const typeTags = getIllustrationTypeTags(faceCard.typeLine);
  const requestParts = [
    name || null,
    `${colorIdentity} color identity`,
    typeTags || faceCard.typeLine.trim() || null,
  ].filter(Boolean);

  if (requestParts.length > 0) {
    return requestParts.join(", ");
  }

  return "a dramatic original fantasy subject";
}

export function buildRulesTextFixerPrompt(
  card: CardDraft,
  customKeywordDefinitions: KeywordDefinition[] = [],
): string {
  const faceCard = getEditableCardFace(card);
  const activeKeywords = faceCard.keywords ?? [];
  const customKeywordContext = buildKeywordDefinitionContext(customKeywordDefinitions);
  const activeKeywordContext = buildCardKeywordContext(activeKeywords);

  return [
    "Rewrite the card's rules text into current official Magic: The Gathering Oracle-style templating.",
    "",
    "Output contract:",
    '- Return only valid JSON with this exact shape: {"rulesText":"..."}',
    "- Do not include Markdown, commentary, alternatives, balance notes, or flavor text.",
    "- Preserve paragraph breaks when they represent separate abilities.",
    "- Keep mana symbols in brace notation, for example {T}, {2}, {G}, {W/U}, and {C}.",
    "- Use an em dash in type-line style constructions only when it is rules-correct; otherwise use normal punctuation.",
    "- Do not invent new mechanics, costs, targets, durations, zones, or restrictions unless the source text is not rules-functional without a missing selector or timing permission. When a repair is necessary, choose the smallest Oracle-style repair that preserves the apparent intent.",
    "- Keep the card's mechanical intent and controller/owner semantics intact whenever the source text is already rules-functional.",
    "- Validate rules semantics, not just vocabulary. If a sentence is grammatically clean but not a legal Magic instruction, rewrite it into the closest legal Oracle-style instruction.",
    "- Enforce current in-game zone terminology. In rules text, 'deck' must be 'library', 'discard pile' must be 'graveyard', 'removed from the game' must be 'exile', and 'play area' must be 'battlefield' when referring to zones.",
    "- Hidden-zone permissions need an object selector. Do not allow 'cast/play a card from your library' or 'cast/play a spell from your library' with no revealed, searched, exiled, top-card, or otherwise defined object.",
    "- For library casting permissions with no selector, prefer top-card templating: 'You may cast the top card of your library ...' or 'You may play lands and cast spells from the top of your library ...' as appropriate.",
    "- Use 'cast' for spells and 'play' when the permission can include lands. Lands are played, not cast. Spells are cast, not played, unless using the broader modern phrase 'play that card'.",
    "- If an effect lets a player use a card from a hidden zone for a limited window, use established exile-then-play templating: 'Exile the top card of your library. You may play that card this turn.'",
    "- If an effect searches a library, include reveal only when needed, include the destination, and end with 'Then shuffle.'",
    "- Do not accept casual tabletop wording as official just because the intent is understandable.",
    "- Use 'this creature', 'this permanent', or the card name according to current templating conventions.",
    "- Use 'enters', 'dies', 'exile', 'create', 'draw a card', 'put a +1/+1 counter on', and 'until end of turn' style Oracle wording.",
    "- Example correction: 'You may cast a spell from your deck without paying its mana cost.' becomes 'You may cast the top card of your library without paying its mana cost.'",
    "- Example correction: 'Play a card from your deck this turn.' becomes 'Exile the top card of your library. You may play that card this turn.'",
    "- If the source text is already official-looking, make only minimal copyediting changes.",
    "",
    "Custom keyword and ability glossary:",
    customKeywordContext,
    "",
    "Active keyword abilities rendered elsewhere on this card:",
    activeKeywordContext,
    "",
    "Custom mechanic handling:",
    "- Treat every custom glossary entry as canonical for this CardMagic project.",
    "- Preserve custom keyword names exactly, including capitalization.",
    "- If the source rules text explicitly uses a custom keyword or ability word, keep it and template only the surrounding rules.",
    "- If reminder text is shown in the source text, retain it only when it is already present or needed to disambiguate a custom mechanic.",
    "- Do not duplicate active keyword abilities that are already rendered outside the rules text unless the source rules text explicitly contains them.",
    "",
    "Card context:",
    `- Name: ${faceCard.name || "Untitled"}`,
    `- Mana cost: ${faceCard.manaCost || "none"}`,
    `- Type line: ${faceCard.typeLine || "none"}`,
    `- Color identity: ${describeColorIdentity(faceCard)}`,
    `- Frame type: ${faceCard.typeFrame ?? "standard"}`,
    faceCard.typeFrame === "battle" ? `- Defense: ${faceCard.defense || "none"}` : null,
    faceCard.typeFrame === "planeswalker" ? `- Starting loyalty: ${getStartingLoyalty(faceCard)}` : null,
    "",
    "Source rules text:",
    faceCard.rulesText || "",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

export function buildArtGeneratorPrompt(
  card: CardDraft,
  userRequest: string,
  options: ArtGeneratorPromptOptions = {},
): string {
  const faceCard = getEditableCardFace(card);
  const request = userRequest.trim() || getDefaultArtGeneratorRequest(card);
  const cardContext = buildArtGeneratorCardContext(card);
  const variationSeed = options.variationSeed ?? 0;
  const artCodex = getArtStyleCodex(faceCard, variationSeed);
  const variedCodex = applyArtPromptVariations(artCodex, request, variationSeed);
  const selectedStyle = ART_GENERATOR_STYLE_PRESETS.find((style) => style.id === options.styleId);
  const artProfile = selectedStyle?.profile ?? pickSeeded(DEFAULT_TRADING_CARD_ART_PROFILES, variationSeed, 53);
  const artProfileLabel = selectedStyle?.label ?? "Random";
  const actionDirection = getSpellActionDirection(faceCard);
  const styleInstruction = EXPLICIT_VISUAL_STYLE_PATTERN.test(request)
    ? [
        "Style handling:",
        "- The user request names a visual style, so preserve that style instead of forcing the randomized fantasy trading-card art profile.",
        "- Keep the color-identity environment, palette, lighting, and trading-card composition discipline.",
        "- Make the requested style visually explicit through medium, edge quality, value structure, and surface treatment.",
      ].join("\n")
    : [
        "Default style:",
        `- Picker: ${artProfileLabel}.`,
        `- Profile: ${artProfile}.`,
        "- Follow the profile strongly; do not average it into generic digital fantasy art.",
        "- Painterly fantasy illustration with visible brushwork, cinematic staging, and selective high-detail materials.",
        "- Original worldbuilding only; do not copy official characters, set logos, mana symbols, or existing card art.",
      ].join("\n");

  return [
    "Create one original card-art image for a custom fantasy trading card.",
    "",
    `User request: ${request}`,
    "",
    "Color identity codex:",
    `- Identity: ${artCodex.identityLabel}.`,
    `- Theme: ${artCodex.theme}.`,
    `- Environment: ${variedCodex.environment}.`,
    `- Palette: ${variedCodex.palette}.`,
    `- Lighting: ${variedCodex.lighting}.`,
    "",
    styleInstruction,
    "",
    "Composition constraints:",
    "- Use card-art composition with a clear focal subject and readable silhouette.",
    "- Keep the background clean: broad simple value shapes, limited props, limited particles, no noisy texture fields.",
    "- Prioritize one main subject, one secondary environmental cue, and one clear light source.",
    "- Preserve negative space around the subject; avoid crowded scenes, busy foliage, excessive rubble, swarms, confetti, or visual clutter.",
    "- Use detail hierarchy: sharpest detail on the face, hands, weapon, creature head, or spell focal point; softer and simpler background.",
    "- No text, no borders, no card frame, no UI, no logos, no watermarks.",
    actionDirection ? `- Spell depiction: ${actionDirection}.` : "",
    "",
    cardContext,
  ].join("\n");
}

function buildCardArtPrompt(card: CardDraft, cardContext: string, visualContext: string): string {
  return [
    "Create an original vertical fantasy trading-card illustration for this custom card.",
    "",
    cardContext,
    "",
    visualContext,
    "",
    "Art direction:",
    `- Main subject: ${card.name || "an original character, creature, object, or spell moment"}.`,
    `- Mood: ${inferMood(card)}.`,
    "- Composition: readable at small card-art size, strong silhouette, clear focal point, cinematic lighting, painterly realism.",
    "- Keep the background clean: broad simple shapes, limited props, limited particles, and no noisy texture fields.",
    "- Use detail hierarchy: crisp focal subject, softer simplified background, clear negative space.",
    "- Camera: medium-wide card illustration crop with enough negative space for a title bar and type line outside the image.",
    "- Exclusions: no text, no card frame, no mana symbols, no logos, no signatures, no watermark, no UI, no existing copyrighted characters.",
  ].join("\n");
}

function applyArtPromptVariations(
  artCodex: ArtStyleCodexEntry & { identityLabel: string },
  request: string,
  variationSeed: number,
): ArtStyleCodexEntry & { identityLabel: string } {
  const hasSceneCue = SCENE_CUE_PATTERN.test(request);
  const hasPaletteCue = PALETTE_CUE_PATTERN.test(request);
  const hasLightingCue = LIGHTING_CUE_PATTERN.test(request);

  return {
    ...artCodex,
    environment: hasSceneCue
      ? artCodex.environment
      : `${artCodex.environment}; ${pickSeeded(DEFAULT_ENVIRONMENT_VARIATIONS, variationSeed, 11)}`,
    palette: hasPaletteCue
      ? artCodex.palette
      : `${artCodex.palette}; ${pickSeeded(DEFAULT_PALETTE_VARIATIONS, variationSeed, 23)}`,
    lighting: hasLightingCue
      ? artCodex.lighting
      : `${artCodex.lighting}; ${pickSeeded(DEFAULT_LIGHTING_VARIATIONS, variationSeed, 37)}`,
  };
}

function pickSeeded(values: string[], seed: number, salt: number): string {
  const x = Math.sin(seed * 1000 + salt * 9999) * 10000;
  const normalized = x - Math.floor(x);

  return values[Math.floor(normalized * values.length)] ?? values[0];
}

function buildArtGeneratorCardContext(card: CardDraft): string {
  if (isSplitTypeFrame(card)) {
    const left = getSplitHalf(card, "left");
    const right = getSplitHalf(card, "right");

    return [
      "Current split-card visual context:",
      `- Layout: ${card.splitLayout ?? card.typeFrame ?? "split"}`,
      buildSplitHalfVisualContext("Left half", toSplitHalfCard(card, left)),
      buildSplitHalfVisualContext("Right half", toSplitHalfCard(card, right)),
    ].join("\n");
  }

  const faceCard = getEditableCardFace(card);
  const lines = [
    "Current card visual context:",
    `- Name: ${faceCard.name || "Untitled"}`,
    `- Type line: ${faceCard.typeLine || "none"}`,
    `- Color identity: ${describeColorIdentity(faceCard)}`,
  ];
  const illustrationTags = getIllustrationTypeTags(faceCard.typeLine);
  const spellActionDirection = getSpellActionDirection(faceCard);

  if (illustrationTags) {
    lines.push(`- Illustration type cues: ${illustrationTags}`);
  }

  if (spellActionDirection) {
    lines.push(`- Spell depiction: ${spellActionDirection}`);
  }

  if (faceCard.typeFrame === "planeswalker") {
    lines.push("- Frame role: planeswalker character art");
  }

  if (faceCard.typeFrame === "battle") {
    lines.push("- Frame role: battle scene or protected location art");
  }

  return lines.join("\n");
}

function buildSplitHalfVisualContext(label: string, card: CardDraft): string {
  const spellActionDirection = getSpellActionDirection(card);

  return [
    `- ${label} name: ${card.name || "Untitled"}`,
    `- ${label} type line: ${card.typeLine || "none"}`,
    `- ${label} colors: ${describeColorIdentity(card)}`,
    `- ${label} illustration cues: ${getIllustrationTypeTags(card.typeLine) || "none"}`,
    spellActionDirection ? `- ${label} spell depiction: ${spellActionDirection}` : "",
  ].join("\n");
}

function getIllustrationTypeTags(typeLine: string): string {
  const normalized = typeLine.replace(/—/g, "-").replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "";
  }

  const [typesText, subtypesText = ""] = normalized.split(/\s+-\s+/, 2);
  const typeWords = typesText
    .split(" ")
    .filter((word) => !["Legendary", "Basic", "Snow", "World", "Ongoing"].includes(word));
  const subtypeWords = subtypesText
    .split(/\s+/)
    .filter(Boolean);
  const hasCreatureType = typeWords.includes("Creature");
  const hasInstantOrSorcery = typeWords.includes("Instant") || typeWords.includes("Sorcery");

  if (hasInstantOrSorcery) {
    return subtypeWords.length > 0
      ? `${subtypeWords.join(" ")} spell effect or caster performing a spell`
      : "spell effect or caster performing a spell";
  }

  if (hasCreatureType && subtypeWords.length > 0) {
    return `${subtypeWords.join(" ")} creature`;
  }

  if (subtypeWords.length > 0) {
    return subtypeWords.join(" ");
  }

  return typeWords.join(" ");
}

function getSpellActionDirection(card: CardDraft): string {
  const normalized = card.typeLine.replace(/—/g, "-").replace(/\s+/g, " ").trim();
  const [typesText] = normalized.split(/\s+-\s+/, 1);
  const typeWords = typesText.split(" ").filter(Boolean);

  if (typeWords.includes("Instant") || typeWords.includes("Sorcery")) {
    const name = card.name.trim();

    return name
      ? `depict ${name} as a visible magical effect or a spellcaster actively casting it`
      : "depict a visible magical effect or a spellcaster actively casting it";
  }

  return "";
}

function getArtStyleCodex(
  card: CardDraft,
  variationSeed = 0,
): ArtStyleCodexEntry & { identityLabel: string } {
  const colors = getFrameColors(card);
  const uniqueColors = colors.filter((color, index) => colors.indexOf(color) === index);

  if (uniqueColors.length === 1) {
    const color = uniqueColors[0];
    return {
      identityLabel: getColorIdentityLabel(uniqueColors),
      ...selectArtStyleCodexEntry(MONO_COLOR_ART_STYLE_CODEX[color], variationSeed),
    };
  }

  if (uniqueColors.length === 2) {
    const orderedKey = getTwoColorCodexKey(uniqueColors);
    const codex = TWO_COLOR_ART_STYLE_CODEX[orderedKey];

    if (codex) {
      return {
        identityLabel: getColorIdentityLabel(orderedKey.split("") as ManaColor[]),
        ...selectArtStyleCodexEntry(codex, variationSeed),
      };
    }
  }

  if (uniqueColors.length === 3) {
    const orderedKey = getThreeColorCodexKey(uniqueColors);
    const codex = THREE_COLOR_ART_STYLE_CODEX[orderedKey];

    if (codex) {
      return {
        identityLabel: getColorIdentityLabel(orderedKey.split("") as ManaColor[]),
        ...selectArtStyleCodexEntry(codex, variationSeed),
      };
    }
  }

  if (uniqueColors.length > 2) {
    const entries = uniqueColors.map((color, index) =>
      selectArtStyleCodexEntry(MONO_COLOR_ART_STYLE_CODEX[color], variationSeed, index * 101),
    );

    return {
      identityLabel: getColorIdentityLabel(uniqueColors),
      theme: entries.map((entry) => entry.theme).join("; "),
      environment: `a hybrid fantasy plane blending ${entries.map((entry) => entry.environment.split(",")[0]).join(", ")}`,
      palette: entries.map((entry) => entry.palette.split(",").slice(0, 3).join(", ")).join("; "),
      lighting: entries.map((entry) => entry.lighting.split(",")[0]).join("; "),
    };
  }

  const frameIdentity = inferFrameIdentity(card);

  if (frameIdentity === "artifact") {
    return {
      identityLabel: "artifact or colorless",
      theme: "craft, machinery, relics, constructs, ancient technology",
      environment: "forges, arcane workshops, buried vaults, metallic ruins",
      palette: "brushed silver, warm brass, tarnished bronze, ivory parchment, blue-white glints",
      lighting: "hard specular highlights, forge glow, reflected metal light",
    };
  }

  if (frameIdentity === "land") {
    return {
      identityLabel: "land",
      theme: "place, atmosphere, mana, terrain, history",
      environment: "wide establishing landscape with distinctive terrain and architectural memory",
      palette: "natural earth tones keyed to the terrain, atmospheric blues, warm horizon accents",
      lighting: "broad environmental light, strong depth haze, readable foreground-to-background planes",
    };
  }

  return {
    identityLabel: "colorless",
    theme: "mystery, neutrality, ancient power, cosmic scale",
    environment: "monolithic ruins, starlit wastes, impossible stone architecture, dusty voidscape",
    palette: "stone gray, bone, muted gold, black, pale blue-white magical accents",
    lighting: "cold directional light, long shadows, restrained magical rim light",
  };
}

function selectArtStyleCodexEntry(
  pool: ArtStyleCodexPool,
  variationSeed: number,
  saltOffset = 0,
): ArtStyleCodexEntry {
  return {
    theme: pickSeeded(pool.theme, variationSeed, 101 + saltOffset),
    environment: pickSeeded(pool.environment, variationSeed, 211 + saltOffset),
    palette: pickSeeded(pool.palette, variationSeed, 307 + saltOffset),
    lighting: pickSeeded(pool.lighting, variationSeed, 401 + saltOffset),
  };
}

function getColorIdentityLabel(colors: ManaColor[]) {
  return colors.map((color) => COLOR_LABELS[color]).join(", ");
}

function getTwoColorCodexKey(colors: ManaColor[]) {
  const colorSet = new Set(colors);
  const pairOrder = ["WU", "UB", "BR", "RG", "GW", "WB", "UR", "BG", "RW", "GU"];

  return pairOrder.find((pair) => colorSet.has(pair[0] as ManaColor) && colorSet.has(pair[1] as ManaColor)) ?? colors.join("");
}

function getThreeColorCodexKey(colors: ManaColor[]) {
  const colorSet = new Set(colors);
  const tripleOrder = ["WUB", "UBR", "BRG", "RGW", "GWU", "WBG", "URW", "BGU", "RWB", "GUR"];

  return (
    tripleOrder.find((triple) =>
      triple.split("").every((color) => colorSet.has(color as ManaColor)),
    ) ?? colors.join("")
  );
}

function buildSetSymbolPrompt(card: CardDraft, cardContext: string): string {
  return buildSetSymbolPromptFromContext(card, cardContext, card.name || card.typeLine || "the current set concept");
}

export function buildSetSymbolGeneratorPrompt(card: CardDraft, request: string): string {
  const faceCard = getEditableCardFace(card);
  const normalizedRequest = request.trim() || faceCard.name || faceCard.typeLine || "an original set symbol";

  return buildGeneratedSetSymbolPrompt(normalizedRequest);
}

export function buildCardBackGeneratorPrompt({
  request,
  mode,
}: {
  request: string;
  mode: "reskin" | "custom";
}): string {
  const normalizedRequest = request.trim();
  const concept =
    normalizedRequest ||
    (mode === "reskin"
      ? "a premium alternate reskin of the default CardMagic brown spellbook card back"
      : "an original premium custom CardMagic card back");

  const structureRule =
    mode === "reskin"
      ? "- Use the attached default CardMagic card back as the image base. Preserve its rectangular border structure, corner rivets, inner frame, central vertical oval, five small colored pips, large PROXY headline, smaller Playtest Copy text, and bottom CardMagic nameplate; restyle only the materials, color palette, texture treatment, lighting, and ornamentation requested by the user."
      : "- Create a new custom CardMagic proxy card back. The border and layout may be custom, but the result must still read as a premium CardMagic proxy card back.";

  return [
    "Create one production-ready portrait trading-card back image for CardMagic.",
    "",
    `User card-back concept: ${concept}.`,
    `Generation mode: ${mode === "reskin" ? "reskin the default CardMagic card back" : "fully custom CardMagic card back"}.`,
    "",
    "Default composition:",
    "- Use a straight-on orthographic card-back view on a portrait canvas.",
    "- Use the CardMagic proxy-back visual grammar: distressed rectangular border, large central vertical oval, five small colored pips arranged like a quincunx, large PROXY headline, smaller Playtest Copy text, and bottom CardMagic nameplate.",
    structureRule,
    "",
    "Text requirements:",
    "- Include readable text exactly: PROXY, Playtest Copy, and CardMagic.",
    "- Do not include any other readable words, labels, serial numbers, signatures, watermarks, QR codes, pseudo-logos, or microtext.",
    "",
    "Image requirements:",
    "- 1024 x 1536 portrait image.",
    "- Full card back centered with a small black bleed or margin around it.",
    "- No perspective tilt, no drop shadow, no table, no hands, no packaging, no scene background.",
    "- Avoid any official Magic: The Gathering logos, mana symbols, copyrighted card-back branding, or copied iconography.",
    "- Keep edges clean enough for use as a mobile app card-back asset.",
  ].join("\n");
}

function buildSetSymbolPromptFromContext(card: CardDraft, cardContext: string, request: string): string {
  return [
    "Design a small expansion set symbol for a custom trading-card set.",
    "",
    cardContext,
    "",
    `User symbol concept: ${request}.`,
    `Visual theme: ${card.name || card.typeLine || request}.`,
    "",
    "Output requirements:",
    "- Transparent background.",
    "- Single centered black alpha-mask silhouette with clean vector-like edges.",
    "- Make the silhouette similar in visual complexity to Magic-style expansion symbols: simple outer contour, one or two negative-space cuts at most.",
    "- Recognizable at 16-24 px tall when printed on a card type line.",
    "- Balanced inside a square icon box with even optical padding.",
    "- No letters unless the set concept explicitly requires them.",
    "- No official game logos, mana symbols, trademarks, or copied iconography.",
    "- No gradients, no full-color rendering, no texture, no drop shadow, no bevel, no border box.",
    "- Simple enough to recolor cleanly for common, uncommon, rare, and mythic treatments.",
  ].join("\n");
}

function buildGeneratedSetSymbolPrompt(request: string): string {
  return [
    "Create one production-ready expansion set symbol as a transparent PNG alpha mask.",
    "",
    `Symbol concept: ${request}.`,
    "",
    "Primary goal:",
    "- Make a small, flat, iconic set mark, not an illustration.",
    "- The app will recolor this mask for common black, uncommon silver, rare gold, and mythic orange rarity treatments.",
    "- The generated PNG itself must not contain rarity color, metallic color, gold, silver, orange, tan, gradients, or colored pixels.",
    "- Optimize for legibility at 16-24 px tall on a trading-card type line.",
    "",
    "Canvas and mask requirements:",
    "- 1024 x 1024 transparent canvas.",
    "- Alpha outside the glyph must be fully transparent.",
    "- Glyph pixels must be solid black (#000000) only, with hard, clean edges.",
    "- Use alpha shape information only: black opaque glyph, transparent outside. No baked-in color styling.",
    "- Center the glyph and make the opaque silhouette fill about 88% of the canvas with tight optical padding.",
    "- Use a filled vector-logo silhouette, not thin line art.",
    "- Prefer one contiguous emblem; use no more than three filled shapes.",
    "- Use no more than two transparent internal cutouts.",
    "- Use thick readable forms and avoid hairline strokes.",
    "",
    "Style target:",
    "- Similar complexity to a Magic-style expansion symbol: compact, collectible, stamp-like, and readable when tiny.",
    "- A simple outer contour with one memorable internal notch, gap, or cutout is ideal.",
    "- If the concept is an object, reduce it to its most recognizable silhouette.",
    "- Make a fresh symbol for this request; do not repeat a generic star, shield, crest, or previous composition.",
    "",
    "Reference example from this app, for style only. Do not copy this geometry:",
    "- Existing preset: Rift.",
    "- Outer silhouette SVG path: M18 23 77 9 56 42 84 45 21 91 43 55 15 53 18 23Z",
    "- Detail path: M30 30 67 20 48 48 66 49 33 75 47 52 27 50 30 30Z",
    "- Match its production qualities: compact black vector-mask silhouette, sharp readable contour, low detail count, large clear negative space, and strong visibility at tiny size.",
    "",
    "Do not include:",
    "- No background color, border box, circle badge, card frame, paper texture, or scene.",
    "- No colored symbol. Do not render the symbol as gold, bronze, silver, orange, yellow, red, blue, green, or multicolor.",
    "- No gradients, shadows, bevels, highlights, metallic rendering, brush texture, or 3D depth.",
    "- No text, letters, numbers, mana symbols, official game logos, trademarks, or copied iconography.",
    "- No extra variants, no multiple icons, no mockup sheet, no labels.",
    "",
    "Return only the final single centered black transparent-background glyph.",
  ].filter(Boolean).join("\n");
}

function buildWatermarkPrompt(card: CardDraft, cardContext: string): string {
  return [
    "Design a transparent card textbox watermark emblem for this custom card or set.",
    "",
    cardContext,
    "",
    "Output requirements:",
    "- Transparent background.",
    "- Single emblem, centered, broad enough to sit behind rules text.",
    "- Low-detail silhouette that remains legible at low opacity.",
    "- No text, no border, no frame, no official game symbols, no faction logos from existing IP.",
    "- Use soft internal negative space so the watermark does not obscure rules text.",
    `- Visual theme: ${card.name || card.typeLine || "the current custom-card concept"}.`,
  ].join("\n");
}

function buildCardFromArtPrompt(cardContext: string): string {
  return [
    "Analyze the attached artwork and design an original, balanced custom trading card from it.",
    "",
    "Use the image as the primary source of color identity, creature type, card type, mechanics, mood, and rarity.",
    "Do not copy an existing real card. Do not reference copyrighted characters or official set lore unless explicitly present in the input.",
    "",
    "Current editor context:",
    cardContext,
    "",
    buildCardJsonOutputInstructions(),
  ].join("\n");
}

function buildArtFromTextColorPrompt(card: CardDraft, rulesContext: string, visualContext: string): string {
  return [
    "Create original card artwork from this card's rules text, color identity, and type line.",
    "",
    rulesContext,
    "",
    visualContext,
    "",
    "Art direction:",
    `- Subject should visually explain the mechanical hook of the card: ${summarizeRulesHook(card)}.`,
    "- Show a clear action, object, spell effect, or environment that matches the card colors.",
    "- Use a painterly fantasy trading-card illustration style with strong lighting and a readable silhouette.",
    "- Keep the background clean: broad simple shapes, limited props, limited particles, and no noisy texture fields.",
    "- Use detail hierarchy: crisp focal subject, softer simplified background, clear negative space.",
    "- Exclusions: no text, no card frame, no mana symbols, no logos, no signatures, no UI, no existing copyrighted characters.",
  ].join("\n");
}

function buildRandomCardPrompt(card: CardDraft): string {
  const colorInstruction = describeColorIdentity(getEditableCardFace(card));

  return [
    "Generate one original, balanced custom trading card for a modern fantasy trading-card game.",
    "",
    "Design constraints:",
    `- Preferred color identity: ${colorInstruction}.`,
    "- Prefer clean, printable rules text and current templating language.",
    "- In rules text, use the literal token NAME whenever the card refers to itself. Do not write the generated card name in its own rules text.",
    "- Avoid silver-border joke mechanics unless requested.",
    "- Do not copy any existing card, character, faction logo, or official set concept.",
    "",
    buildCardJsonOutputInstructions(),
  ].join("\n");
}

function buildCardContext(card: CardDraft): string {
  if (isSplitTypeFrame(card)) {
    const left = getSplitHalf(card, "left");
    const right = getSplitHalf(card, "right");

    return [
      "Current split-card context:",
      `- Layout: ${card.splitLayout ?? card.typeFrame ?? "split"}`,
      buildSplitHalfContext("Left half", toSplitHalfCard(card, left)),
      buildSplitHalfContext("Right half", toSplitHalfCard(card, right)),
      `- Fuse/aftermath reminder: ${card.splitFuseText || "none"}`,
      `- Rarity: ${card.rarity}`,
      `- Set code: ${card.setCode || "none"}`,
    ].join("\n");
  }

  const faceCard = getEditableCardFace(card);
  const lines = [
    "Current card context:",
    `- Name: ${faceCard.name || "Untitled"}`,
    `- Base card name / skin alias: ${faceCard.baseCardName || "none"}`,
    `- Mana cost: ${faceCard.manaCost || "none"}`,
    `- Type line: ${faceCard.typeLine || "none"}`,
    `- Color identity: ${describeColorIdentity(faceCard)}`,
    `- Rarity: ${faceCard.rarity}`,
    `- Rules text: ${compactText(faceCard.rulesText) || "none"}`,
    `- Flavor text: ${compactText(faceCard.flavorText) || "none"}`,
    `- Power/Toughness: ${faceCard.power || "-"} / ${faceCard.toughness || "-"}`,
    `- Set code: ${faceCard.setCode || "none"}`,
  ];

  if (faceCard.typeFrame === "planeswalker") {
    lines.push(`- Starting loyalty: ${getStartingLoyalty(faceCard)}`);
    lines.push(
      `- Loyalty abilities: ${getLoyaltyAbilities(faceCard)
        .map((ability) => `${ability.cost}: ${compactText(ability.text)}`)
        .join(" | ") || "none"}`,
    );
  }

  if (faceCard.typeFrame === "battle") {
    lines.push(`- Defense: ${faceCard.defense || "none"}`);
  }

  return lines.join("\n");
}

function buildSplitHalfContext(label: string, card: CardDraft): string {
  return [
    `- ${label} name: ${card.name || "Untitled"}`,
    `- ${label} mana cost: ${card.manaCost || "none"}`,
    `- ${label} type line: ${card.typeLine || "none"}`,
    `- ${label} rules text: ${compactText(card.rulesText) || "none"}`,
    `- ${label} colors: ${describeColorIdentity(card)}`,
  ].join("\n");
}

function buildVisualContext(card: CardDraft): string {
  return [
    "Visual context:",
    `- Color palette: ${describeColorPalette(card)}.`,
    `- Card type cues: ${card.typeLine || "unspecified"}.`,
    `- Mechanical cues: ${summarizeRulesHook(card)}.`,
  ].join("\n");
}

function buildRulesContext(card: CardDraft): string {
  return [
    "Rules and color context:",
    `- Name: ${card.name || "Untitled"}`,
    `- Mana cost: ${card.manaCost || "none"}`,
    `- Type line: ${card.typeLine || "none"}`,
    `- Color identity: ${describeColorIdentity(card)}`,
    `- Rules text: ${compactText(card.rulesText) || "none"}`,
    `- Flavor text: ${compactText(card.flavorText) || "none"}`,
  ].join("\n");
}

function buildKeywordDefinitionContext(definitions: KeywordDefinition[]): string {
  if (definitions.length === 0) {
    return "None.";
  }

  return definitions
    .map((definition) => {
      const helpText = compactText(definition.reminderText || definition.helpText);
      const kind = definition.custom ? "custom" : definition.category;

      return `- ${definition.name} (${kind}): ${helpText || "No reminder text supplied."}`;
    })
    .join("\n");
}

function buildCardKeywordContext(keywords: CardKeyword[]): string {
  if (keywords.length === 0) {
    return "None.";
  }

  return keywords
    .map((keyword) => {
      const helpText = compactText(keyword.reminderText || keyword.helpText);
      const reminderVisibility = keyword.showReminder === false ? "reminder hidden" : "reminder visible";

      return `- ${keyword.name} (${reminderVisibility}): ${helpText || "No reminder text supplied."}`;
    })
    .join("\n");
}

function buildCardJsonOutputInstructions(): string {
  return [
    "Return only valid JSON with this shape:",
    "Important rules-text templating: when the card refers to itself, write NAME exactly. Example: \"Whenever NAME attacks, draw a card.\"",
    "{",
    '  "name": "Card Name",',
    '  "manaCost": "{2}{G}",',
    '  "typeLine": "Creature — Beast",',
    '  "rarity": "common | uncommon | rare | mythic",',
    '  "rulesText": "Rules text using printable card templating.",',
    '  "flavorText": "Optional flavor text.",',
    '  "power": "3",',
    '  "toughness": "3",',
    '  "startingLoyalty": "",',
    '  "defense": "",',
    '  "frameColors": ["G"],',
    '  "artDirection": "One-sentence art prompt for the generated card."',
    "}",
  ].join("\n");
}

function describeColorIdentity(card: CardDraft): string {
  const colors = getFrameColors(card);

  if (colors.length > 0) {
    return colors.map((color) => COLOR_LABELS[color]).join(", ");
  }

  return FRAME_IDENTITY_LABELS[inferFrameIdentity(card)];
}

function describeColorPalette(card: CardDraft): string {
  const colors = getFrameColors(card);

  if (colors.length === 0) {
    const frameIdentity = inferFrameIdentity(card);

    if (frameIdentity === "artifact") {
      return "cool metal, enamel, parchment neutrals, and restrained accent light";
    }

    if (frameIdentity === "land") {
      return "environmental natural light, terrain colors, and atmospheric depth";
    }

    return "neutral colorless light, stone, metal, dust, and restrained magical contrast";
  }

  const colorPalettes: Record<ManaColor, string> = {
    W: "ivory light, gold, sunlit stone, disciplined shapes",
    U: "deep blue, cyan glow, mist, water, glass, arcane geometry",
    B: "black, violet shadow, bone, smoke, decay, occult contrast",
    R: "red, ember orange, volcanic light, sparks, motion, impact",
    G: "green, moss, bark, natural light, growth, living texture",
  };

  return colors.map((color) => colorPalettes[color]).join("; ");
}

function inferMood(card: CardDraft): string {
  const text = `${card.name} ${card.typeLine} ${card.rulesText} ${card.flavorText}`.toLowerCase();

  if (text.includes("destroy") || text.includes("damage") || text.includes("sacrifice")) {
    return "violent, urgent, high-contrast";
  }

  if (text.includes("draw") || text.includes("scry") || text.includes("search")) {
    return "mysterious, intelligent, contemplative";
  }

  if (text.includes("create") || text.includes("token") || text.includes("counter")) {
    return "generative, magical, energetic";
  }

  if (text.includes("land") || text.includes("mana")) {
    return "expansive, elemental, atmospheric";
  }

  return "evocative, dramatic, and readable";
}

function summarizeRulesHook(card: CardDraft): string {
  const rulesText = compactText(card.rulesText);

  if (rulesText) {
    return rulesText.length > 180 ? `${rulesText.slice(0, 177)}...` : rulesText;
  }

  return card.typeLine || card.name || "the card's color identity and type";
}

function compactText(value?: string): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}
