export type CardSection =
  | "frame"
  | "identity"
  | "art"
  | "typeLine"
  | "keywords"
  | "rules"
  | "aiPrompts"
  | "watermark"
  | "stats"
  | "printing";

export type CardRarity = "common" | "uncommon" | "rare" | "mythic";

export type CardBackId =
  | "cardmagicProxy"
  | "cardmagicMidnight"
  | "cardmagicParchment"
  | "cardmagicNeon"
  | "cardmagicNature"
  | "cardmagicDragon"
  | "cardmagicCircuit"
  | "cardmagicArmor"
  | `custom:${string}`;

export type ManaColor = "W" | "U" | "B" | "R" | "G";

export type FrameIdentity =
  | "white"
  | "blue"
  | "black"
  | "red"
  | "green"
  | "gold"
  | "artifact"
  | "land"
  | "colorless";

export type FrameSelection = "auto" | FrameIdentity;

export type FrameTreatment =
  | "standard"
  | "fullArt"
  | "extendedArt"
  | "borderless"
  | "promo"
  | "showcase"
  | "textless"
  | "retro"
  | "etchedFoil";

export type ShowcaseFrameId =
  | "eternalNight"
  | "scrolls"
  | "futureshifted"
  | "japaneseMysticalArchive"
  | "stainedGlass"
  | "mysticalArchive"
  | "dndRulebook"
  | "firstPlace"
  | "customShowcaseLab"
  | "stellarSights"
  | "posterStellarSights";

export type FrameEffect = "nyx" | "legendary";
export type CardTextColorPreset = "black" | "white";
export type FrameTextColorOverrides = Partial<Record<FrameTreatment, CardTextColorPreset>>;

export type TypeFrame =
  | "standard"
  | "token"
  | "saga"
  | "planeswalker"
  | "battle"
  | "dfc"
  | "adventure"
  | "split"
  | "fuse"
  | "aftermath";

export type DfcFace = "front" | "back";
export type DfcMode = "transform" | "modal" | "dayNight";
export type SplitCardLayout = "split" | "fuse" | "aftermath";

export type FrameCustomization = {
  tintColor: string;
  tintOpacity: number;
};

export type ArtTransform = {
  offsetX: number;
  offsetY: number;
  scale: number;
};

export type KeywordCategory =
  | "ability"
  | "action"
  | "coreAction"
  | "abilityWord"
  | "custom";

export type KeywordIcon =
  | "deathtouch"
  | "double-strike"
  | "first-strike"
  | "flying"
  | "haste"
  | "hexproof"
  | "indestructible"
  | "lifelink"
  | "menace"
  | "reach"
  | "trample"
  | "vigilance";

export type KeywordDefinition = {
  id: string;
  name: string;
  category: KeywordCategory;
  reminderText?: string;
  helpText?: string;
  icon?: KeywordIcon;
  arenaOnly?: boolean;
  custom?: boolean;
};

export type CardKeyword = KeywordDefinition & {
  showReminder?: boolean;
};

export type PlaneswalkerLoyaltyAbility = {
  id: string;
  cost: string;
  text: string;
};

export type SplitCardHalf = {
  name: string;
  manaCost: string;
  typeLine: string;
  rulesText: string;
  flavorText?: string;
  keywords?: CardKeyword[];
  frameSelection?: FrameSelection;
  frameColors?: ManaColor[];
};

export type SubjectMaskComponent = {
  concept: string;
  cutoutUrl: string;
  enabled: boolean;
};

export type CardDraft = {
  name: string;
  baseCardName?: string;
  manaCost: string;
  typeLine: string;
  rarity: CardRarity;
  rulesText: string;
  flavorText: string;
  keywords?: CardKeyword[];
  adventureName?: string;
  adventureManaCost?: string;
  adventureTypeLine?: string;
  adventureRulesText?: string;
  dfcMode?: DfcMode;
  dfcFace?: DfcFace;
  backName?: string;
  backBaseCardName?: string;
  backManaCost?: string;
  backTypeLine?: string;
  backRulesText?: string;
  backRulesTextColors?: FrameTextColorOverrides;
  backRulesTextColor?: CardTextColorPreset;
  backFlavorText?: string;
  backKeywords?: CardKeyword[];
  backPower?: string;
  backToughness?: string;
  defense?: string;
  startingLoyalty?: string;
  loyaltyAbilities?: PlaneswalkerLoyaltyAbility[];
  splitLayout?: SplitCardLayout;
  splitLeft?: SplitCardHalf;
  splitRight?: SplitCardHalf;
  splitFuseText?: string;
  power: string;
  toughness: string;
  artist: string;
  setCode: string;
  collectorNumber: string;
  setSize?: string;
  language?: string;
  copyrightLine?: string;
  cardBackId?: CardBackId;
  artUri?: string;
  artSubjectMaskUri?: string;
  artSubjectMaskDisabled?: boolean;
  artSubjectMaskComponents?: SubjectMaskComponent[];
  artTransform?: ArtTransform;
  backArtUri?: string;
  backArtSubjectMaskUri?: string;
  backArtSubjectMaskDisabled?: boolean;
  backArtSubjectMaskComponents?: SubjectMaskComponent[];
  backArtTransform?: ArtTransform;
  setSymbolPreset?: string;
  setSymbolId?: string;
  setSymbolUri?: string;
  setSymbolUsesRarityTreatment?: boolean;
  watermarkPreset?: string;
  watermarkUri?: string;
  watermarkOpacity?: number;
  watermarkScale?: number;
  frameSelection?: FrameSelection;
  frameColors?: ManaColor[];
  backFrameSelection?: FrameSelection;
  backFrameColors?: ManaColor[];
  backFrameTreatment?: FrameTreatment;
  backShowcaseFrame?: ShowcaseFrameId;
  frameTreatment?: FrameTreatment;
  showcaseFrame?: ShowcaseFrameId;
  typeFrame?: TypeFrame;
  frameCustomization?: FrameCustomization;
  rulesTextColors?: FrameTextColorOverrides;
  rulesTextColor?: CardTextColorPreset;
};
