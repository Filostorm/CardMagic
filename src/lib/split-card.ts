import { CardDraft, SplitCardHalf, SplitCardLayout } from "@/types/card";

const DEFAULT_SPLIT_LEFT: SplitCardHalf = {
  name: "Fire",
  manaCost: "{1}{R}",
  typeLine: "Instant",
  rulesText: "Fire deals 2 damage divided as you choose among one or two targets.",
  flavorText: "",
};

const DEFAULT_SPLIT_RIGHT: SplitCardHalf = {
  name: "Ice",
  manaCost: "{1}{U}",
  typeLine: "Instant",
  rulesText: "Tap target permanent.\nDraw a card.",
  flavorText: "",
};

const DEFAULT_AFTERMATH_LEFT: SplitCardHalf = {
  name: "Cut",
  manaCost: "{1}{R}",
  typeLine: "Sorcery",
  rulesText: "Cut deals 4 damage to target creature.",
  flavorText: "",
};

const DEFAULT_AFTERMATH_RIGHT: SplitCardHalf = {
  name: "Ribbons",
  manaCost: "{X}{B}{B}",
  typeLine: "Sorcery",
  rulesText: "Aftermath (Cast this spell only from your graveyard. Then exile it.)\nEach opponent loses X life.",
  flavorText: "",
};

const DEFAULT_FUSE_LEFT: SplitCardHalf = {
  name: "Wear",
  manaCost: "{1}{R}",
  typeLine: "Instant",
  rulesText: "Destroy target artifact.",
  flavorText: "",
};

const DEFAULT_FUSE_RIGHT: SplitCardHalf = {
  name: "Tear",
  manaCost: "{W}",
  typeLine: "Instant",
  rulesText: "Destroy target enchantment.",
  flavorText: "",
};

export const DEFAULT_FUSE_REMINDER_TEXT = "Fuse (You may cast one or both halves of this card from your hand.)";

export function isSplitTypeFrame(card: CardDraft): boolean {
  return card.typeFrame === "split" || card.typeFrame === "fuse" || card.typeFrame === "aftermath";
}

export function getSplitLayout(card: CardDraft): SplitCardLayout {
  if (card.typeFrame === "aftermath") {
    return "aftermath";
  }

  if (card.typeFrame === "fuse") {
    return "fuse";
  }

  return card.splitLayout ?? "split";
}

export function getDefaultSplitHalf(
  layout: SplitCardLayout,
  side: "left" | "right",
): SplitCardHalf {
  if (layout === "aftermath") {
    return side === "left" ? DEFAULT_AFTERMATH_LEFT : DEFAULT_AFTERMATH_RIGHT;
  }

  if (layout === "fuse") {
    return side === "left" ? DEFAULT_FUSE_LEFT : DEFAULT_FUSE_RIGHT;
  }

  return side === "left" ? DEFAULT_SPLIT_LEFT : DEFAULT_SPLIT_RIGHT;
}

export function getSplitHalf(card: CardDraft, side: "left" | "right"): SplitCardHalf {
  const layout = getSplitLayout(card);
  const defaults = getDefaultSplitHalf(layout, side);
  const half = side === "left" ? card.splitLeft : card.splitRight;

  return {
    ...defaults,
    ...half,
    flavorText: half?.flavorText ?? defaults.flavorText ?? "",
  };
}

export function getDefaultSplitPatch(
  layout: SplitCardLayout,
  card: CardDraft,
): Partial<CardDraft> {
  const left = card.splitLeft ?? getDefaultSplitHalf(layout, "left");
  const right = card.splitRight ?? getDefaultSplitHalf(layout, "right");

  return {
    splitLayout: layout,
    splitLeft: left,
    splitRight: right,
    splitFuseText: layout === "fuse" ? (card.splitFuseText || DEFAULT_FUSE_REMINDER_TEXT) : "",
    name: `${left.name} // ${right.name}`,
    manaCost: "",
    typeLine: `${left.typeLine} // ${right.typeLine}`,
    rulesText: "",
    flavorText: "",
    power: "",
    toughness: "",
  };
}

export function getSplitHalfPatch(
  card: CardDraft,
  side: "left" | "right",
  patch: Partial<SplitCardHalf>,
): Partial<CardDraft> {
  const current = getSplitHalf(card, side);
  const nextHalf = { ...current, ...patch };
  const otherHalf = getSplitHalf(card, side === "left" ? "right" : "left");
  const left = side === "left" ? nextHalf : otherHalf;
  const right = side === "right" ? nextHalf : otherHalf;
  const sidePatch = side === "left" ? { splitLeft: nextHalf } : { splitRight: nextHalf };

  return {
    ...sidePatch,
    name: `${left.name} // ${right.name}`,
    typeLine: `${left.typeLine} // ${right.typeLine}`,
  };
}

export function toSplitHalfCard(card: CardDraft, half: SplitCardHalf): CardDraft {
  return {
    ...card,
    name: half.name,
    manaCost: half.manaCost,
    typeLine: half.typeLine,
    rulesText: half.rulesText,
    flavorText: half.flavorText ?? "",
    keywords: half.keywords,
    frameSelection: half.frameSelection,
    frameColors: half.frameColors,
    power: "",
    toughness: "",
    typeFrame: "standard",
  };
}
