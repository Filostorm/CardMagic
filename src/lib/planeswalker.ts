import { CardDraft, PlaneswalkerLoyaltyAbility } from "@/types/card";

export const DEFAULT_STARTING_LOYALTY = "4";

const DEFAULT_LOYALTY_ABILITIES: PlaneswalkerLoyaltyAbility[] = [
  {
    id: "loyalty-plus",
    cost: "+1",
    text: "Create a 1/1 green Saproling creature token.",
  },
  {
    id: "loyalty-minus",
    cost: "-2",
    text: "Draw a card. You may put a land card from your hand onto the battlefield.",
  },
  {
    id: "loyalty-ultimate",
    cost: "-7",
    text: "You get an emblem with \"Whenever a land enters under your control, draw a card.\"",
  },
];

export function createDefaultLoyaltyAbilities(): PlaneswalkerLoyaltyAbility[] {
  return DEFAULT_LOYALTY_ABILITIES.map((ability) => ({ ...ability }));
}

export function getStartingLoyalty(card: CardDraft): string {
  return card.startingLoyalty?.trim() || DEFAULT_STARTING_LOYALTY;
}

export function getLoyaltyAbilities(card: CardDraft): PlaneswalkerLoyaltyAbility[] {
  if (card.loyaltyAbilities && card.loyaltyAbilities.length > 0) {
    return card.loyaltyAbilities;
  }

  return createDefaultLoyaltyAbilities();
}

export function createBlankLoyaltyAbility(
  index: number,
): PlaneswalkerLoyaltyAbility {
  return {
    id: `loyalty-${Date.now()}-${index}`,
    cost: index === 0 ? "+1" : "-1",
    text: "",
  };
}
