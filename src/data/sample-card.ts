import { CardDraft } from "@/types/card";
import {
  DEFAULT_CARD_COPYRIGHT_LINE,
  DEFAULT_CARD_LANGUAGE,
  DEFAULT_CARD_SET_SIZE,
} from "@/lib/printing";

export const INITIAL_CARD: CardDraft = {
  name: "Verdant Spellsmith",
  manaCost: "{2}{G}{U}",
  typeLine: "Creature - Human Artificer",
  rarity: "rare",
  rulesText:
    "When Verdant Spellsmith enters, create a tapped Powerstone token.\nWhenever you cast your second spell each turn, draw a card.",
  flavorText: "The best inventions grow into their own answers.",
  adventureName: "Root Road",
  adventureManaCost: "{1}{G}",
  adventureTypeLine: "Sorcery — Adventure",
  adventureRulesText: "Search your library for a basic land card, reveal it, put it into your hand, then shuffle.",
  defense: "3",
  power: "2",
  toughness: "4",
  artist: "Unknown Artist",
  setCode: "CMG",
  collectorNumber: "001",
  setSize: DEFAULT_CARD_SET_SIZE,
  language: DEFAULT_CARD_LANGUAGE,
  copyrightLine: DEFAULT_CARD_COPYRIGHT_LINE,
  watermarkOpacity: 0.16,
  watermarkScale: 1,
};
