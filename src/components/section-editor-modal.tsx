import { Check, ChevronDown, ChevronRight, ImagePlus, ListPlus, Pencil, Share2, Sparkles, Trash2, X } from "lucide-react-native";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  TextInputSelectionChangeEventData,
  NativeSyntheticEvent,
  View,
} from "react-native";

import { CardBackPicker } from "@/components/card-back-picker";
import { CustomCardBackEntry } from "@/data/card-backs";
import { EditorField } from "@/components/editor-field";
import { ManaCostControl } from "@/components/mana-cost-control";
import { ManaSymbol } from "@/components/mana-symbol";
import { SET_SYMBOL_PRESETS, SetSymbolMark, WatermarkSymbolMark } from "@/components/set-symbol";
import {
  TYPE_FRAME_LABELS,
  TYPE_FRAME_SPECS,
  TYPE_FRAMES,
  getDfcFaceSymbolSource,
} from "@/data/full-magic-pack";
import {
  DEFAULT_SHOWCASE_FRAME,
  SHOWCASE_FRAME_ORDER,
  SHOWCASE_FRAMES,
  VISIBLE_SHOWCASE_FRAME_ORDER,
} from "@/data/showcase-frames";
import {
  getMseM15FrameTreatmentSource,
  getMseM15MainframeSource,
} from "@/data/mse-frame-renderer";
import type { CardDatabaseEntry, CardDatabaseMetadata } from "@/data/card-database";
import {
  KEYWORD_CATEGORY_LABELS,
  KEYWORD_CATEGORY_TABS,
  MTG_ABILITY_WORDS,
  MTG_CORE_ACTIONS,
  MTG_KEYWORD_ABILITIES,
  MTG_KEYWORD_ACTIONS,
  normalizeKeywordId,
} from "@/data/mtg-keywords";
import {
  MSE_WATERMARK_CATEGORY_LABELS,
  MSE_WATERMARK_PRESETS,
  MseWatermarkCategory,
} from "@/data/mse-watermarks";
import {
  FRAME_SELECTION_LABELS,
  FRAME_SELECTIONS,
  FRAME_COLOR_LABELS,
  FRAME_MANA_COLORS,
  FRAME_TREATMENT_LABELS,
  getManualFrameColors,
  inferFrameIdentity,
  normalizeManaInput,
} from "@/lib/card-style";
import { AiPromptId, buildAiPromptOptions } from "@/lib/ai-prompts";
import { DEFAULT_BATTLE_SIEGE_REMINDER } from "@/lib/battle-card";
import {
  getDfcFaceLabel,
  getDfcMode,
  getDefaultDfcBackPatch,
  getEditableCardFace,
  getNextDfcFacePatch,
  isDfcBackFace,
  isTransformingTypeFrame,
  shouldShowDfcFaceManaCost,
  toDfcFacePatch,
} from "@/lib/dfc";
import {
  DEFAULT_CARD_COPYRIGHT_LINE,
  DEFAULT_CARD_LANGUAGE,
} from "@/lib/printing";
import {
  createBlankLoyaltyAbility,
  createDefaultLoyaltyAbilities,
  getLoyaltyAbilities,
  getStartingLoyalty,
} from "@/lib/planeswalker";
import {
  DEFAULT_FUSE_REMINDER_TEXT,
  getDefaultSplitPatch,
  getSplitHalf,
  getSplitHalfPatch,
  getSplitLayout,
  isSplitTypeFrame,
  toSplitHalfCard,
} from "@/lib/split-card";
import { normalizeSagaChapterBreaks } from "@/lib/saga-text";
import {
  filterCompatibleSubtypeText,
  getTypeLineAutocompleteSuggestions,
  TypeLineAutocompleteSuggestion,
} from "@/lib/type-line-autocomplete";
import { getTypeLineChangePatch, normalizeTypeLineInput } from "@/lib/type-frame-inference";
import {
  CardKeyword,
  CardBackId,
  CardDraft,
  CardTextColorPreset,
  KeywordCategory,
  KeywordDefinition,
  CardRarity,
  CardSection,
  DfcMode,
  FrameTreatment,
  FrameSelection,
  ManaColor,
  PlaneswalkerLoyaltyAbility,
  SplitCardHalf,
  SplitCardLayout,
  TypeFrame,
} from "@/types/card";
import { formatKeywordLine } from "@/lib/keyword-text";

const VISIBLE_TYPE_FRAMES: readonly TypeFrame[] = TYPE_FRAMES.filter(
  (typeFrame) =>
    typeFrame !== "split" &&
    typeFrame !== "fuse" &&
    typeFrame !== "adventure" &&
    typeFrame !== "battle" &&
    typeFrame !== "aftermath",
);

const SECTION_TITLES: Record<CardSection, string> = {
  frame: "Frame",
  identity: "Name and Cost",
  art: "Card Art",
  typeLine: "Type Line",
  keywords: "Keywords",
  rules: "Rules Text",
  aiPrompts: "AI Prompts",
  watermark: "Watermark",
  stats: "Power and Toughness",
  printing: "Printing",
};

type CardDatabaseModule = typeof import("@/data/card-database");

function loadCardDatabaseModule(): Promise<CardDatabaseModule> {
  return import("@/data/card-database");
}

const RARITIES: CardRarity[] = ["common", "uncommon", "rare", "mythic"];
const STANDARD_FRAME_TREATMENTS: FrameTreatment[] = [
  "standard",
  "borderless",
  "showcase",
  "textless",
  "retro",
  "etchedFoil",
];
const BORDERLESS_TREATMENT_PREVIEW_SOURCE = require("../../assets/card-assets/basic-m15/mse-renderer/treatments/borderless/mask-frame.png");
const STANDARD_RULES_TEXT_SYMBOLS = [
  "T",
  "Q",
  "W",
  "U",
  "B",
  "R",
  "G",
  "C",
  "S",
  "1",
  "X",
] as const;
const HYBRID_RULES_TEXT_SYMBOLS = [
  "W/U",
  "W/B",
  "U/B",
  "U/R",
  "B/R",
  "B/G",
  "R/G",
  "R/W",
  "G/W",
  "G/U",
  "2/W",
  "2/U",
  "2/B",
  "2/R",
  "2/G",
] as const;
type RulesTextSymbolMode = "standard" | "hybrid";
const KEYWORD_ICON_SOURCES: Record<string, ImageSourcePropType> = {
  "deathtouch": require("../../assets/card-assets/keyword-icons-black/deathtouch.png"),
  "double-strike": require("../../assets/card-assets/keyword-icons-black/double-strike.png"),
  "first-strike": require("../../assets/card-assets/keyword-icons-black/first-strike.png"),
  "flying": require("../../assets/card-assets/keyword-icons-black/flying.png"),
  "haste": require("../../assets/card-assets/keyword-icons-black/haste.png"),
  "hexproof": require("../../assets/card-assets/keyword-icons-black/hexproof.png"),
  "indestructible": require("../../assets/card-assets/keyword-icons-black/indestructible.png"),
  "lifelink": require("../../assets/card-assets/keyword-icons-black/lifelink.png"),
  "menace": require("../../assets/card-assets/keyword-icons-black/menace.png"),
  "reach": require("../../assets/card-assets/keyword-icons-black/reach.png"),
  "trample": require("../../assets/card-assets/keyword-icons-black/trample.png"),
  "vigilance": require("../../assets/card-assets/keyword-icons-black/vigilance.png"),
};
const TYPE_LINE_SUPERTYPE_PRESETS = [
  "Legendary",
  "Token",
  "Basic",
  "Snow",
  "World",
  "Ongoing",
] as const;
const CARD_TYPE_PRESETS = [
  "Creature",
  "Instant",
  "Sorcery",
  "Kindred",
  "Artifact",
  "Enchantment",
  "Land",
  "Planeswalker",
  "Battle",
] as const;
const SAGA_CHAPTER_LABELS = ["I", "II", "III", "IV", "V", "VI"] as const;
const SAGA_CHAPTER_PREFIX_PATTERN =
  /^((?:VI|IV|III|II|V|I)(?:\s*(?:,|-|–|—|\s)\s*(?:VI|IV|III|II|V|I))*)\s*[—–-]/i;
const SAGA_CHAPTER_TOKEN_PATTERN = /\b(?:VI|IV|III|II|V|I)\b/g;
const DFC_MODES: DfcMode[] = ["transform", "modal", "dayNight"];
const DFC_MODE_LABELS: Record<DfcMode, string> = {
  transform: "Transform",
  modal: "Modal",
  dayNight: "Day/Night",
};
const SHOW_RULES_TEXT_AI_FIXER = true;
const RULES_TEXT_COLOR_OPTIONS: Array<{
  value?: CardTextColorPreset;
  label: string;
  ink: string;
  swatch: string;
}> = [
  { value: undefined, label: "Default", ink: "#1f2530", swatch: "#d8dbe2" },
  { value: "black", label: "Black", ink: "#1f2530", swatch: "#151820" },
  { value: "white", label: "White", ink: "#f7f1df", swatch: "#f7f1df" },
];

type SectionEditorModalProps = {
  card: CardDraft;
  section: CardSection | null;
  setCardBackId?: CardBackId;
  cardBackOverrideId?: CardBackId;
  setSymbolDefaults?: Pick<CardDraft, "setSymbolPreset" | "setSymbolId" | "setSymbolUri" | "setSymbolUsesRarityTreatment">;
  customCardBacks?: CustomCardBackEntry[];
  generatedSetSymbols?: GeneratedSetSymbolEntry[];
  customKeywordDefinitions?: KeywordDefinition[];
  rulesTextAiFixer?: RulesTextAiFixerControls;
  onClose: () => void;
  onChange: (patch: Partial<CardDraft>) => void;
  onEditArt: () => void;
  onPickArt: () => void;
  onPickSetSymbol: () => void;
  onGenerateSetSymbol: () => void;
  onGenerateCardBack?: () => void;
  onPickCustomCardBack?: () => void;
  onChangeSetDefaultCardBack?: (cardBackId: CardBackId) => void;
  onChangeSetDefaultSymbol?: (
    patch: Pick<CardDraft, "setSymbolPreset" | "setSymbolId" | "setSymbolUri" | "setSymbolUsesRarityTreatment">,
  ) => void;
  onPickWatermark: () => void;
};

export type GeneratedSetSymbolEntry = {
  id: string;
  label: string;
  uri: string;
  createdAt: string;
};

type RulesTextAiFixerControls = {
  busy: boolean;
  error: string | null;
  suggestion: {
    original: string;
    corrected: string;
  } | null;
  onFixRulesText: () => void;
  onApplySuggestion: () => void;
  onDismissSuggestion: () => void;
};

export function SectionEditorModal({
  card,
  section,
  setCardBackId,
  cardBackOverrideId,
  setSymbolDefaults,
  customCardBacks = [],
  generatedSetSymbols = [],
  customKeywordDefinitions = [],
  rulesTextAiFixer,
  onClose,
  onChange,
  onEditArt,
  onPickArt,
  onPickSetSymbol,
  onGenerateSetSymbol,
  onGenerateCardBack,
  onPickCustomCardBack,
  onChangeSetDefaultCardBack,
  onChangeSetDefaultSymbol,
  onPickWatermark,
}: SectionEditorModalProps) {
  const visible = section !== null;
  const faceCard = getEditableCardFace(card);
  const showFaceManaCost = shouldShowDfcFaceManaCost(card);
  const splitFrame = isSplitTypeFrame(card);
  const updateFace = (patch: Partial<CardDraft>) => onChange(toDfcFacePatch(card, patch));
  const sectionTitle =
    splitFrame && (section === "frame" || section === "identity" || section === "rules" || section === "stats")
      ? "Split Halves"
      : section === "stats" && card.typeFrame === "battle" && !isDfcBackFace(card)
      ? "Defense"
      : section === "stats" && card.typeFrame === "planeswalker"
        ? "Loyalty"
      : section
        ? SECTION_TITLES[section]
        : "Editor";

  if (!visible) {
    return null;
  }

  const closeWithNormalization = () => {
    if (section === "identity" && showFaceManaCost && !splitFrame) {
      updateFace({ manaCost: normalizeManaInput(faceCard.manaCost) });
    }

    onClose();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 20,
        justifyContent: "flex-end",
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss editor"
        onPress={closeWithNormalization}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: "rgba(15, 18, 24, 0.38)",
        }}
      />

      <View
          style={{
            width: "100%",
            maxHeight: "86%",
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          borderCurve: "continuous",
          overflow: "hidden",
          backgroundColor: "#f4f5f7",
          boxShadow: "0 -18px 40px rgba(0, 0, 0, 0.2)",
        }}
      >
        <View
          style={{
            minHeight: 62,
            paddingHorizontal: 18,
            paddingTop: 10,
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: "#d8dbe2",
            backgroundColor: "#ffffff",
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Text
            selectable
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              flex: 1,
              color: "#11151c",
              fontSize: 20,
              fontWeight: "900",
            }}
          >
            {sectionTitle}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close editor"
            onPress={closeWithNormalization}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#eef0f4",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} color="#222733" strokeWidth={2.4} />
          </Pressable>
        </View>

        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
          style={{ maxHeight: 620 }}
          contentContainerStyle={{ padding: 18, paddingBottom: 28, gap: 16 }}
        >
          {isTransformingTypeFrame(card) && section !== "frame" && section !== "printing" ? (
            <DfcFaceToggle card={card} onChange={onChange} />
          ) : null}

          {section === "frame" ? (
            splitFrame ? (
              <SplitCardEditor card={card} onChange={onChange} />
            ) : (
              <FrameEditor card={card} onChange={onChange} />
            )
          ) : null}

          {section === "identity" ? (
            splitFrame ? (
              <SplitCardEditor card={card} onChange={onChange} />
            ) : (
            <>
              <EditorField
                label="Card name"
                value={faceCard.name}
                onChangeText={(name) => updateFace({ name })}
                autoCapitalize="words"
              />
              <BaseCardNameAutocompleteField
                value={faceCard.baseCardName ?? ""}
                onChangeText={(baseCardName) => updateFace({ baseCardName })}
                onSelectPatch={(patch) => updateFace(patch)}
              />
              {showFaceManaCost ? (
                <>
                  <EditorField
                    label="Mana cost"
                    value={faceCard.manaCost}
                    onChangeText={(manaCost) => updateFace({ manaCost })}
                    onBlur={() => updateFace({ manaCost: normalizeManaInput(faceCard.manaCost) })}
                  />
                  <ManaCostControl
                    value={faceCard.manaCost}
                    onChange={(manaCost) => updateFace({ manaCost })}
                  />
                </>
              ) : (
                <View
                  style={{
                    minHeight: 44,
                    borderRadius: 9,
                    borderCurve: "continuous",
                    borderWidth: 1,
                    borderColor: "#d4d8e0",
                    backgroundColor: "#ffffff",
                    justifyContent: "center",
                    paddingHorizontal: 12,
                  }}
                >
                  <Text selectable style={{ color: "#626b78", fontSize: 13, fontWeight: "800" }}>
                    Nonmodal back faces use the front face mana cost for mana value.
                  </Text>
                </View>
              )}
            </>
            )
          ) : null}

          {section === "art" ? (
            <View style={{ gap: 14 }}>
              {faceCard.artUri ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Edit image position"
                  onPress={onEditArt}
                  style={{
                    minHeight: 48,
                    borderRadius: 9,
                    borderCurve: "continuous",
                    borderWidth: 1,
                    borderColor: "#cfd4dd",
                    backgroundColor: "#ffffff",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 10,
                    paddingHorizontal: 14,
                  }}
                >
                  <Pencil size={18} color="#151820" strokeWidth={2.4} />
                  <Text selectable={false} style={{ color: "#151820", fontSize: 15, fontWeight: "800" }}>
                    Edit image
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Pick an image"
                  onPress={onPickArt}
                  style={{
                    minHeight: 54,
                    borderRadius: 9,
                    borderCurve: "continuous",
                    backgroundColor: "#151820",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 10,
                    paddingHorizontal: 14,
                  }}
                >
                  <ImagePlus size={20} color="#ffffff" strokeWidth={2.3} />
                  <Text selectable={false} style={{ color: "#ffffff", fontSize: 16, fontWeight: "800" }}>
                    {isTransformingTypeFrame(card)
                      ? `Pick ${getDfcFaceLabel(card).toLowerCase()} image`
                      : "Pick image"}
                  </Text>
                </Pressable>
              )}
              <EditorField
                label="Artist credit"
                value={card.artist}
                onChangeText={(artist) => onChange({ artist })}
              />
            </View>
          ) : null}

          {section === "typeLine" ? (
            <View style={{ gap: 18 }}>
              <TypeLineComposer
                card={card}
                onChange={onChange}
              />
              {splitFrame ? (
                <SplitCardEditor
                  card={card}
                  customKeywordDefinitions={customKeywordDefinitions}
                  onChange={onChange}
                />
              ) : null}
            </View>
          ) : null}

          {section === "keywords" ? (
            <KeywordEditor
              keywords={faceCard.keywords ?? []}
              customDefinitions={customKeywordDefinitions}
              onChangeKeywords={(keywords) => updateFace({ keywords })}
            />
          ) : null}

          {section === "rules" ? (
            <View style={{ gap: 18 }}>
              {card.typeFrame === "saga" ? (
                <SagaRulesEditor
                  card={card}
                  customKeywordDefinitions={customKeywordDefinitions}
                  onChange={onChange}
                />
              ) : card.typeFrame === "planeswalker" ? (
                <PlaneswalkerLoyaltyEditor
                  card={card}
                  customKeywordDefinitions={customKeywordDefinitions}
                  onChange={onChange}
                />
              ) : card.typeFrame === "adventure" ? (
                <AdventureRulesEditor
                  card={card}
                  customKeywordDefinitions={customKeywordDefinitions}
                  onChange={onChange}
                />
              ) : splitFrame ? (
                <SplitCardEditor
                  card={card}
                  customKeywordDefinitions={customKeywordDefinitions}
                  onChange={onChange}
                />
              ) : (
                <>
                  <RulesTextColorPicker
                    value={faceCard.rulesTextColors?.[faceCard.frameTreatment ?? "standard"]}
                    onChange={(rulesTextColor) =>
                      updateFace({
                        rulesTextColors: getNextFrameTextColorOverrides(
                          faceCard.rulesTextColors,
                          faceCard.frameTreatment ?? "standard",
                          rulesTextColor,
                        ),
                        rulesTextColor: undefined,
                      })
                    }
                  />
                  <RichTextEditor
                    label="Rules text"
                    value={faceCard.rulesText}
                    onChangeText={(rulesText) => updateFace({ rulesText })}
                    autocompleteDefinitions={customKeywordDefinitions}
                    keywords={faceCard.keywords ?? []}
                    onChangeKeywords={(keywords) => updateFace({ keywords })}
                    showSymbolPalette
                  />
                  {SHOW_RULES_TEXT_AI_FIXER && rulesTextAiFixer ? (
                    <RulesTextAiFixerButton controls={rulesTextAiFixer} />
                  ) : null}
                  <RichTextEditor
                    label="Flavor text"
                    value={faceCard.flavorText}
                    onChangeText={(flavorText) => updateFace({ flavorText })}
                  />
                </>
              )}

              {card.typeFrame !== "saga" && card.typeFrame !== "planeswalker" && !splitFrame ? (
                <View style={{ gap: 8 }}>
                  <Text
                    selectable
                    style={{
                      color: "#5f6470",
                      fontSize: 12,
                      fontWeight: "800",
                      textTransform: "uppercase",
                    }}
                  >
                    {card.typeFrame === "battle" && !isDfcBackFace(card) ? "Defense" : "Stats"}
                  </Text>
                  {card.typeFrame === "battle" && !isDfcBackFace(card) ? (
                    <EditorField
                      compact
                      label="Defense"
                      value={card.defense ?? "3"}
                      onChangeText={(defense) => onChange({ defense })}
                    />
                  ) : (
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <EditorField
                        compact
                        label="Power"
                        value={faceCard.power}
                        onChangeText={(power) => updateFace({ power })}
                      />
                      <EditorField
                        compact
                        label="Toughness"
                        value={faceCard.toughness}
                        onChangeText={(toughness) => updateFace({ toughness })}
                      />
                    </View>
                  )}
                </View>
              ) : null}

              <View style={{ height: 1, backgroundColor: "#d8dbe2" }} />

              <WatermarkEditor
                card={card}
                onChange={onChange}
                onPickWatermark={onPickWatermark}
              />
            </View>
          ) : null}

          {section === "aiPrompts" ? (
            <AiPromptEditor card={card} />
          ) : null}

          {section === "stats" ? (
            card.typeFrame === "planeswalker" ? (
              <PlaneswalkerLoyaltyEditor
                card={card}
                customKeywordDefinitions={customKeywordDefinitions}
                onChange={onChange}
              />
            ) : splitFrame ? (
              <SplitCardEditor
                card={card}
                customKeywordDefinitions={customKeywordDefinitions}
                onChange={onChange}
              />
            ) : card.typeFrame === "battle" && !isDfcBackFace(card) ? (
              <EditorField
                compact
                label="Defense"
                value={card.defense ?? "3"}
                onChangeText={(defense) => onChange({ defense })}
              />
            ) : (
              <View style={{ flexDirection: "row", gap: 12 }}>
                <EditorField
                  compact
                  label="Power"
                  value={faceCard.power}
                  onChangeText={(power) => updateFace({ power })}
                />
                <EditorField
                  compact
                  label="Toughness"
                  value={faceCard.toughness}
                  onChangeText={(toughness) => updateFace({ toughness })}
                />
              </View>
            )
          ) : null}

          {section === "watermark" ? (
            <WatermarkEditor
              card={card}
              onChange={onChange}
              onPickWatermark={onPickWatermark}
            />
          ) : null}

          {section === "printing" ? (
            <>
              <CardBackPicker
                value={cardBackOverrideId}
                effectiveValue={cardBackOverrideId ?? setCardBackId}
                setDefaultValue={setCardBackId}
                customBacks={customCardBacks}
                includeSetDefault
                onChangeSetDefault={onChangeSetDefaultCardBack}
                onGenerateCardBack={onGenerateCardBack}
                onPickCustomCardBack={onPickCustomCardBack}
                onChange={(cardBackId) => onChange({ cardBackId })}
              />
              <View style={{ gap: 8 }}>
                <Text
                  selectable
                  style={{
                    color: "#5f6470",
                    fontSize: 12,
                    fontWeight: "800",
                    textTransform: "uppercase",
                  }}
                >
                  Rarity
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {RARITIES.map((rarity) => {
                    const selected = card.rarity === rarity;

                    return (
                      <Pressable
                        key={rarity}
                        accessibilityRole="button"
                        onPress={() => onChange({ rarity })}
                        style={{
                          minHeight: 40,
                          borderRadius: 8,
                          borderCurve: "continuous",
                          borderWidth: 1,
                          borderColor: selected ? "#151820" : "#d4d8e0",
                          backgroundColor: selected ? "#151820" : "#ffffff",
                          alignItems: "center",
                          justifyContent: "center",
                          paddingHorizontal: 12,
                        }}
                      >
                        <Text
                          selectable={false}
                          style={{
                            color: selected ? "#ffffff" : "#1f2530",
                            fontWeight: "800",
                            textTransform: "capitalize",
                          }}
                        >
                          {rarity}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <SetSymbolEditor
                card={card}
                setSymbolDefaults={setSymbolDefaults}
                generatedSetSymbols={generatedSetSymbols}
                onChange={onChange}
                onChangeSetDefaultSymbol={onChangeSetDefaultSymbol}
                onPickSetSymbol={onPickSetSymbol}
                onGenerateSetSymbol={onGenerateSetSymbol}
              />
              <View style={{ flexDirection: "row", gap: 12 }}>
                <EditorField
                  compact
                  label="Set"
                  value={card.setCode}
                  onChangeText={(setCode) => onChange({ setCode: setCode.toUpperCase() })}
                />
                <EditorField
                  compact
                  label="Number"
                  value={card.collectorNumber}
                  onChangeText={(collectorNumber) => onChange({ collectorNumber })}
                />
              </View>
              <EditorField
                label="Language"
                value={card.language ?? DEFAULT_CARD_LANGUAGE}
                onChangeText={(language) => onChange({ language: language.toUpperCase() })}
              />
              <EditorField
                label="Artist credit"
                value={card.artist}
                onChangeText={(artist) => onChange({ artist })}
              />
              <EditorField
                label="Legal line"
                value={card.copyrightLine ?? DEFAULT_CARD_COPYRIGHT_LINE}
                onChangeText={(copyrightLine) => onChange({ copyrightLine })}
              />
            </>
          ) : null}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function getNextFrameTextColorOverrides(
  current: Partial<Record<FrameTreatment, CardTextColorPreset>> | undefined,
  treatment: FrameTreatment,
  color: CardTextColorPreset | undefined,
): Partial<Record<FrameTreatment, CardTextColorPreset>> | undefined {
  const next = { ...(current ?? {}) };

  if (color) {
    next[treatment] = color;
  } else {
    delete next[treatment];
  }

  return Object.keys(next).length > 0 ? next : undefined;
}

function RulesTextColorPicker({
  value,
  onChange,
}: {
  value?: CardTextColorPreset;
  onChange: (value: CardTextColorPreset | undefined) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text
        selectable
        style={{
          color: "#5f6470",
          fontSize: 12,
          fontWeight: "800",
          textTransform: "uppercase",
        }}
      >
        Card text color
      </Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {RULES_TEXT_COLOR_OPTIONS.map((option) => {
          const selected = value === option.value;

          return (
            <Pressable
              key={option.label}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Set card text color to ${option.label.toLowerCase()}`}
              onPress={() => onChange(option.value)}
              style={{
                flex: 1,
                minHeight: 40,
                borderRadius: 8,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: selected ? "#151820" : "#d4d8e0",
                backgroundColor: selected ? "#151820" : "#ffffff",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                paddingHorizontal: 10,
              }}
            >
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: selected ? "rgba(255, 255, 255, 0.55)" : "#a8b0bc",
                  backgroundColor: option.swatch,
                  overflow: "hidden",
                }}
              />
              <Text
                selectable={false}
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{
                  color: selected ? "#ffffff" : option.ink,
                  fontSize: 13,
                  fontWeight: "900",
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function RulesTextAiFixerButton({ controls }: { controls: RulesTextAiFixerControls }) {
  const unchanged = controls.suggestion?.original === controls.suggestion?.corrected;

  return (
    <View style={{ gap: 10 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Check rules text wording with AI"
        disabled={controls.busy}
        onPress={controls.onFixRulesText}
        style={{
          alignSelf: "flex-start",
          minHeight: 40,
          borderRadius: 20,
          borderCurve: "continuous",
          backgroundColor: controls.busy ? "#4b5565" : "#151820",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          paddingHorizontal: 14,
          opacity: controls.busy ? 0.78 : 1,
        }}
      >
        <Sparkles size={16} color="#ffffff" strokeWidth={2.5} />
        <Text selectable={false} style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>
          {controls.busy ? "Checking wording..." : "Check official wording"}
        </Text>
      </Pressable>

      {controls.suggestion ? (
        <View
          style={{
            borderRadius: 10,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: unchanged ? "#cfd6df" : "#b7ddc8",
            backgroundColor: unchanged ? "#f7f8fb" : "#f3fbf6",
            padding: 10,
            gap: 10,
          }}
        >
          <Text selectable={false} style={{ color: "#1f2530", fontSize: 12, fontWeight: "900", textTransform: "uppercase" }}>
            {unchanged ? "No wording changes suggested" : "Suggested wording changes"}
          </Text>
          <InlineRulesTextDiff original={controls.suggestion.original} corrected={controls.suggestion.corrected} />
          {!unchanged ? (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Apply suggested rules text wording"
                onPress={controls.onApplySuggestion}
                style={{
                  flex: 1,
                  minHeight: 40,
                  borderRadius: 20,
                  borderCurve: "continuous",
                  backgroundColor: "#126b3a",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8,
                  paddingHorizontal: 12,
                }}
              >
                <Check size={16} color="#ffffff" strokeWidth={2.6} />
                <Text selectable={false} style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>
                  Apply
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dismiss suggested rules text wording"
                onPress={controls.onDismissSuggestion}
                style={{
                  flex: 1,
                  minHeight: 40,
                  borderRadius: 20,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: "#d4d8e0",
                  backgroundColor: "#ffffff",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 12,
                }}
              >
                <Text selectable={false} style={{ color: "#1f2530", fontSize: 13, fontWeight: "900" }}>
                  Keep mine
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss rules text wording result"
              onPress={controls.onDismissSuggestion}
              style={{
                minHeight: 38,
                borderRadius: 19,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: "#d4d8e0",
                backgroundColor: "#ffffff",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 12,
              }}
            >
              <Text selectable={false} style={{ color: "#1f2530", fontSize: 13, fontWeight: "900" }}>
                Done
              </Text>
            </Pressable>
          )}
        </View>
      ) : null}

      {controls.error ? (
        <Text selectable style={{ color: "#a52735", fontSize: 12, lineHeight: 16, fontWeight: "800" }}>
          {controls.error}
        </Text>
      ) : null}
    </View>
  );
}

type RulesTextDiffToken = {
  value: string;
  kind: "same" | "added" | "removed";
};

function InlineRulesTextDiff({ original, corrected }: { original: string; corrected: string }) {
  const tokens = useMemo(() => buildRulesTextDiffTokens(original, corrected), [corrected, original]);

  return (
    <Text selectable style={{ color: "#1f2530", fontSize: 13, lineHeight: 20, fontWeight: "800" }}>
      {tokens.map((token, index) => {
        if (token.kind === "same") {
          return token.value;
        }

        const removed = token.kind === "removed";

        return (
          <Text
            key={`${token.kind}-${index}-${token.value}`}
            selectable
            style={{
              color: removed ? "#9f1d1d" : "#116b36",
              backgroundColor: removed ? "#fde8e8" : "#def7e9",
              textDecorationLine: removed ? "line-through" : "none",
              fontWeight: "900",
            }}
          >
            {token.value}
          </Text>
        );
      })}
    </Text>
  );
}

function buildRulesTextDiffTokens(original: string, corrected: string): RulesTextDiffToken[] {
  const oldTokens = tokenizeRulesTextForDiff(original);
  const newTokens = tokenizeRulesTextForDiff(corrected);
  const oldLength = oldTokens.length;
  const newLength = newTokens.length;
  const table = Array.from({ length: oldLength + 1 }, () => Array<number>(newLength + 1).fill(0));

  for (let oldIndex = oldLength - 1; oldIndex >= 0; oldIndex -= 1) {
    for (let newIndex = newLength - 1; newIndex >= 0; newIndex -= 1) {
      table[oldIndex][newIndex] =
        oldTokens[oldIndex] === newTokens[newIndex]
          ? table[oldIndex + 1][newIndex + 1] + 1
          : Math.max(table[oldIndex + 1][newIndex], table[oldIndex][newIndex + 1]);
    }
  }

  const tokens: RulesTextDiffToken[] = [];
  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < oldLength && newIndex < newLength) {
    if (oldTokens[oldIndex] === newTokens[newIndex]) {
      tokens.push({ value: oldTokens[oldIndex], kind: "same" });
      oldIndex += 1;
      newIndex += 1;
    } else if (table[oldIndex + 1][newIndex] >= table[oldIndex][newIndex + 1]) {
      tokens.push({ value: oldTokens[oldIndex], kind: "removed" });
      oldIndex += 1;
    } else {
      tokens.push({ value: newTokens[newIndex], kind: "added" });
      newIndex += 1;
    }
  }

  while (oldIndex < oldLength) {
    tokens.push({ value: oldTokens[oldIndex], kind: "removed" });
    oldIndex += 1;
  }

  while (newIndex < newLength) {
    tokens.push({ value: newTokens[newIndex], kind: "added" });
    newIndex += 1;
  }

  return mergeAdjacentRulesTextDiffTokens(tokens);
}

function tokenizeRulesTextForDiff(value: string) {
  return value.match(/\s+|[^\s]+/g) ?? [];
}

function mergeAdjacentRulesTextDiffTokens(tokens: RulesTextDiffToken[]) {
  return tokens.reduce<RulesTextDiffToken[]>((merged, token) => {
    const previous = merged[merged.length - 1];

    if (previous?.kind === token.kind) {
      previous.value += token.value;
    } else {
      merged.push({ ...token });
    }

    return merged;
  }, []);
}

function BaseCardNameAutocompleteField({
  value,
  onChangeText,
  onSelectPatch,
}: {
  value: string;
  onChangeText: (value: string) => void;
  onSelectPatch: (patch: Partial<CardDraft>) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [databaseModule, setDatabaseModule] = useState<CardDatabaseModule | null>(null);
  const [databaseLoading, setDatabaseLoading] = useState(false);
  const shouldLoadDatabase = menuOpen || value.trim().length >= 2;
  const suggestions = useMemo(
    () => (databaseModule ? databaseModule.searchCardDatabase(value, 8) : []),
    [databaseModule, value],
  );
  const metadata: CardDatabaseMetadata | null = databaseModule ? databaseModule.getCardDatabaseMetadata() : null;
  const showSuggestions = menuOpen && suggestions.length > 0;
  const updateText = (baseCardName: string) => {
    onChangeText(baseCardName);
    setMenuOpen(baseCardName.trim().length >= 2);
  };

  useEffect(() => {
    if (!shouldLoadDatabase || databaseModule) {
      return undefined;
    }

    let cancelled = false;

    setDatabaseLoading(true);
    loadCardDatabaseModule()
      .then((module) => {
        if (!cancelled) {
          setDatabaseModule(module);
        }
      })
      .catch((error) => {
        console.warn("Card database autocomplete unavailable.", error);
      })
      .finally(() => {
        if (!cancelled) {
          setDatabaseLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [databaseModule, shouldLoadDatabase]);

  return (
    <View
      style={{
        gap: 6,
        position: "relative",
        zIndex: showSuggestions ? 100 : 1,
        elevation: showSuggestions ? 100 : 0,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <Text
          selectable
          style={{
            color: "#5f6470",
            fontSize: 12,
            fontWeight: "800",
            textTransform: "uppercase",
          }}
        >
          Base card name
        </Text>
        <Text
          selectable
          numberOfLines={1}
          style={{
            flexShrink: 1,
            color: "#7a818d",
            fontSize: 11,
            fontWeight: "800",
          }}
        >
          {metadata
            ? `${metadata.cardCount.toLocaleString("en-US")} Oracle cards`
            : databaseLoading
              ? "Loading Oracle cards"
              : "Oracle lookup"}
        </Text>
      </View>
      <View style={{ position: "relative", zIndex: showSuggestions ? 100 : undefined }}>
        <TextInput
          value={value}
          onChangeText={updateText}
          onFocus={() => setMenuOpen(value.trim().length >= 2)}
          onBlur={() => {
            if (Platform.OS !== "ios") {
              setTimeout(() => setMenuOpen(false), 140);
            }
          }}
          autoCapitalize="words"
          autoCorrect={false}
          blurOnSubmit={false}
          numberOfLines={1}
          placeholder="Search a real card to skin"
          placeholderTextColor="#8a909b"
          style={{
            minHeight: 44,
            borderRadius: 8,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: "#d8dbe2",
            backgroundColor: "#ffffff",
            color: "#151820",
            fontSize: 16,
            overflow: "visible",
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        />
        {showSuggestions ? (
          <CardDatabaseAutocompleteMenu
            suggestions={suggestions}
            onSelect={(entry) => {
              if (databaseModule) {
                onSelectPatch(databaseModule.buildCardPatchFromDatabaseEntry(entry));
              }
              setMenuOpen(false);
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

function CardDatabaseAutocompleteMenu({
  suggestions,
  onSelect,
}: {
  suggestions: CardDatabaseEntry[];
  onSelect: (entry: CardDatabaseEntry) => void;
}) {
  return (
    <View
      style={{
        position: "absolute",
        top: 48,
        left: 0,
        right: 0,
        borderRadius: 10,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: "#d8dbe2",
        backgroundColor: "#ffffff",
        boxShadow: "0 12px 26px rgba(0, 0, 0, 0.18)",
        overflow: "hidden",
        elevation: 100,
        zIndex: 120,
      }}
    >
      {suggestions.map((entry) => (
        <Pressable
          key={entry.id}
          accessibilityRole="button"
          accessibilityLabel={`Use ${entry.name} as the base card`}
          onPressIn={() => onSelect(entry)}
          onPress={() => onSelect(entry)}
          style={{
            minHeight: 48,
            justifyContent: "center",
            paddingHorizontal: 12,
            paddingVertical: 7,
            gap: 2,
          }}
        >
          <Text
            selectable={false}
            numberOfLines={1}
            style={{
              color: "#151820",
              fontSize: 15,
              fontWeight: "900",
            }}
          >
            {entry.name}
          </Text>
          <Text
            selectable={false}
            numberOfLines={1}
            style={{
              color: "#6b7280",
              fontSize: 12,
              fontWeight: "800",
            }}
          >
            {getCardDatabaseSuggestionDetail(entry)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function getCardDatabaseSuggestionDetail(entry: CardDatabaseEntry): string {
  const typeLine = entry.faces[0]?.typeLine || entry.typeLine || "Card";
  const layout = entry.layout
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return `${layout} · ${typeLine}`;
}

function AiPromptEditor({ card }: { card: CardDraft }) {
  const prompts = useMemo(() => buildAiPromptOptions(card), [card]);
  const [activePromptId, setActivePromptId] = useState<AiPromptId>("cardArt");
  const activePrompt = prompts.find((prompt) => prompt.id === activePromptId) ?? prompts[0];

  useEffect(() => {
    if (!prompts.some((prompt) => prompt.id === activePromptId)) {
      setActivePromptId(prompts[0].id);
    }
  }, [activePromptId, prompts]);

  const sharePrompt = async () => {
    await Share.share({ message: activePrompt.prompt });
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {prompts.map((prompt) => {
          const selected = activePrompt.id === prompt.id;

          return (
            <Pressable
              key={prompt.id}
              accessibilityRole="button"
              accessibilityLabel={`Show ${prompt.label} prompt`}
              onPress={() => setActivePromptId(prompt.id)}
              style={{
                minHeight: 48,
                minWidth: 134,
                flexGrow: 1,
                borderRadius: 9,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: selected ? "#151820" : "#d4d8e0",
                backgroundColor: selected ? "#151820" : "#ffffff",
                justifyContent: "center",
                paddingHorizontal: 12,
                paddingVertical: 8,
                gap: 2,
              }}
            >
              <Text
                selectable={false}
                style={{
                  color: selected ? "#ffffff" : "#151820",
                  fontSize: 14,
                  fontWeight: "900",
                }}
              >
                {prompt.label}
              </Text>
              <Text
                selectable={false}
                numberOfLines={1}
                style={{
                  color: selected ? "rgba(255,255,255,0.68)" : "#68707d",
                  fontSize: 11.5,
                  fontWeight: "800",
                }}
              >
                {prompt.intent}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Share generated prompt"
        onPress={sharePrompt}
        style={{
          minHeight: 46,
          borderRadius: 9,
          borderCurve: "continuous",
          backgroundColor: "#151820",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 10,
          paddingHorizontal: 14,
        }}
      >
        <Share2 size={18} color="#ffffff" strokeWidth={2.4} />
        <Text selectable={false} style={{ color: "#ffffff", fontSize: 15, fontWeight: "900" }}>
          Share prompt
        </Text>
      </Pressable>

      <TextInput
        multiline
        editable={false}
        value={activePrompt.prompt}
        selectTextOnFocus
        textAlignVertical="top"
        style={{
          minHeight: 330,
          borderRadius: 10,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: "#cfd4dd",
          backgroundColor: "#ffffff",
          color: "#171b22",
          fontSize: 13,
          lineHeight: 18,
          fontWeight: "600",
          padding: 12,
        }}
      />
    </View>
  );
}

function DfcFaceToggle({
  card,
  onChange,
}: {
  card: CardDraft;
  onChange: (patch: Partial<CardDraft>) => void;
}) {
  const activeFace = isDfcBackFace(card) ? "back" : "front";

  const setFace = (face: "front" | "back") => {
    if (face === activeFace) {
      return;
    }

    if (face === "front") {
      onChange({ dfcFace: "front" });
      return;
    }

    onChange(getNextDfcFacePatch(card));
  };

  return (
    <View style={{ gap: 8 }}>
      <Text
        selectable
        style={{
          color: "#5f6470",
          fontSize: 12,
          fontWeight: "800",
          textTransform: "uppercase",
        }}
      >
        {card.typeFrame === "battle" ? "Battle faces" : "DFC face"}
      </Text>
      <View
        style={{
          minHeight: 42,
          borderRadius: 10,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: "#d4d8e0",
          backgroundColor: "#ffffff",
          flexDirection: "row",
          padding: 4,
          gap: 4,
        }}
      >
        {(["front", "back"] as const).map((face) => {
          const selected = activeFace === face;
          const faceCard = getEditableCardFace({ ...card, dfcFace: face });
          const faceFrameIdentity = inferFrameIdentity(faceCard);
          const symbolSource = getDfcFaceSymbolSource({
            face,
            mode: card.typeFrame === "dfc" ? getDfcMode(card) : "transform",
            frameIdentity: faceFrameIdentity,
          });

          return (
            <Pressable
              key={face}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${face} face`}
              onPress={() => setFace(face)}
              style={{
                flex: 1,
                borderRadius: 7,
                borderCurve: "continuous",
                backgroundColor: selected ? "#151820" : "transparent",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 7,
                paddingHorizontal: 12,
              }}
            >
              <Image
                accessibilityIgnoresInvertColors
                source={symbolSource}
                resizeMode="contain"
                style={{ width: 24, height: 24 }}
              />
              <Text
                selectable={false}
                style={{
                  color: selected ? "#ffffff" : "#1f2530",
                  fontSize: 14,
                  fontWeight: "900",
                  textTransform: "capitalize",
                }}
              >
                {face}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SetSymbolEditor({
  card,
  setSymbolDefaults,
  generatedSetSymbols,
  onChange,
  onChangeSetDefaultSymbol,
  onPickSetSymbol,
  onGenerateSetSymbol,
}: {
  card: CardDraft;
  setSymbolDefaults?: Pick<CardDraft, "setSymbolPreset" | "setSymbolId" | "setSymbolUri" | "setSymbolUsesRarityTreatment">;
  generatedSetSymbols: GeneratedSetSymbolEntry[];
  onChange: (patch: Partial<CardDraft>) => void;
  onChangeSetDefaultSymbol?: (
    patch: Pick<CardDraft, "setSymbolPreset" | "setSymbolId" | "setSymbolUri" | "setSymbolUsesRarityTreatment">,
  ) => void;
  onPickSetSymbol: () => void;
  onGenerateSetSymbol: () => void;
}) {
  const activePreset = card.setSymbolPreset ?? SET_SYMBOL_PRESETS[0].id;
  const activeCustomSymbol = generatedSetSymbols.find((symbol) => symbol.uri === card.setSymbolUri);
  const applySymbolPatch = onChangeSetDefaultSymbol ?? onChange;
  const customSymbolLabel = card.setSymbolUsesRarityTreatment
    ? activeCustomSymbol?.label ?? "Custom symbol"
    : card.setSymbolUri
      ? "Custom uploaded image"
      : "Preset icon";
  const hasSetSymbolDefault = Boolean(
    setSymbolDefaults?.setSymbolPreset ||
      setSymbolDefaults?.setSymbolUri ||
      typeof setSymbolDefaults?.setSymbolUsesRarityTreatment === "boolean",
  );

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 8,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: "#d4d8e0",
            backgroundColor: "#ffffff",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SetSymbolMark
            presetId={activePreset}
            imageUri={card.setSymbolUri}
            usesRarityTreatment={card.setSymbolUsesRarityTreatment}
            rarity={card.rarity}
            size={card.setSymbolUri && card.setSymbolUsesRarityTreatment ? 32 : 28}
          />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text
            selectable
            style={{
              color: "#5f6470",
              fontSize: 12,
              fontWeight: "800",
              textTransform: "uppercase",
            }}
          >
            Set Symbol
          </Text>
          <Text selectable style={{ color: "#1f2530", fontSize: 14, fontWeight: "800" }}>
            {customSymbolLabel}
          </Text>
          {hasSetSymbolDefault ? (
            <Text selectable={false} style={{ color: "#68707d", fontSize: 11, fontWeight: "800" }}>
              Using set default
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Generate set symbol"
          onPress={onGenerateSetSymbol}
          style={{
            flexGrow: 1,
            flexBasis: 168,
            minHeight: 46,
            borderRadius: 8,
            borderCurve: "continuous",
            backgroundColor: "#0b7180",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 9,
            paddingHorizontal: 12,
          }}
        >
          <Sparkles size={18} color="#ffffff" strokeWidth={2.3} />
          <Text
            selectable={false}
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ color: "#ffffff", fontSize: 14, fontWeight: "800" }}
          >
            Generate symbol
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Upload custom set symbol"
          onPress={onPickSetSymbol}
          style={{
            flexGrow: 1,
            flexBasis: 168,
            minHeight: 46,
            borderRadius: 8,
            borderCurve: "continuous",
            backgroundColor: "#151820",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 9,
            paddingHorizontal: 12,
          }}
        >
          <ImagePlus size={18} color="#ffffff" strokeWidth={2.3} />
          <Text
            selectable={false}
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ color: "#ffffff", fontSize: 14, fontWeight: "800" }}
          >
            Upload symbol
          </Text>
        </Pressable>
      </View>

      {card.setSymbolUri && !card.setSymbolUsesRarityTreatment ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => applySymbolPatch({ setSymbolUri: undefined, setSymbolUsesRarityTreatment: undefined })}
          style={{
            minHeight: 40,
            borderRadius: 8,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: "#d4d8e0",
            backgroundColor: "#ffffff",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 12,
          }}
        >
          <Text selectable={false} style={{ color: "#1f2530", fontWeight: "800" }}>
            Use preset icons
          </Text>
        </Pressable>
      ) : null}

      {generatedSetSymbols.length > 0 ? (
        <View style={{ gap: 8 }}>
          <Text
            selectable
            style={{
              color: "#5f6470",
              fontSize: 12,
              fontWeight: "800",
              textTransform: "uppercase",
            }}
          >
            Custom icons
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {generatedSetSymbols.map((symbol) => {
              const selected =
                (card.setSymbolId && card.setSymbolId === symbol.id) ||
                (!card.setSymbolId && card.setSymbolUri === symbol.uri && card.setSymbolUsesRarityTreatment);

              return (
                <Pressable
                  key={symbol.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Choose custom ${symbol.label} set symbol`}
                  onPress={() =>
                    applySymbolPatch({
                      setSymbolUri: symbol.uri,
                      setSymbolId: symbol.id,
                      setSymbolUsesRarityTreatment: true,
                    })
                  }
                  style={{
                    width: 58,
                    minHeight: 54,
                    borderRadius: 8,
                    borderCurve: "continuous",
                    borderWidth: 1,
                    borderColor: selected ? "#151820" : "#d4d8e0",
                    backgroundColor: selected ? "#151820" : "#ffffff",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 6,
                  }}
                >
                  <SetSymbolMark imageUri={symbol.uri} usesRarityTreatment rarity={card.rarity} size={28} />
                  <Text
                    selectable={false}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                    style={{
                      color: selected ? "#ffffff" : "#1f2530",
                      fontSize: 10,
                      lineHeight: 12,
                      fontWeight: "800",
                    }}
                  >
                    {symbol.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={{ gap: 8 }}>
        <Text
          selectable
          style={{
            color: "#5f6470",
            fontSize: 12,
            fontWeight: "800",
            textTransform: "uppercase",
          }}
        >
          Preset icons
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            flexDirection: "row",
            gap: 8,
            paddingRight: 2,
          }}
        >
          {chunkArray(SET_SYMBOL_PRESETS, 2).map((presetColumn, columnIndex) => (
            <View key={`preset-column-${columnIndex}`} style={{ gap: 8 }}>
              {presetColumn.map((preset) => {
                const selected = !card.setSymbolUri && activePreset === preset.id;

                return (
                  <Pressable
                    key={preset.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Choose ${preset.label} set symbol`}
                    onPress={() =>
                      applySymbolPatch({
                        setSymbolPreset: preset.id,
                        setSymbolId: undefined,
                        setSymbolUri: undefined,
                        setSymbolUsesRarityTreatment: undefined,
                      })
                    }
                    style={{
                      width: 58,
                      minHeight: 54,
                      borderRadius: 8,
                      borderCurve: "continuous",
                      borderWidth: 1,
                      borderColor: selected ? "#151820" : "#d4d8e0",
                      backgroundColor: selected ? "#151820" : "#ffffff",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 6,
                    }}
                  >
                    <SetSymbolMark presetId={preset.id} rarity={card.rarity} size={24} />
                    <Text
                      selectable={false}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                      style={{
                        color: selected ? "#ffffff" : "#1f2530",
                        fontSize: 10,
                        lineHeight: 12,
                        fontWeight: "800",
                      }}
                    >
                      {preset.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function WatermarkEditor({
  card,
  onChange,
  onPickWatermark,
}: {
  card: CardDraft;
  onChange: (patch: Partial<CardDraft>) => void;
  onPickWatermark: () => void;
}) {
  const enabled = Boolean(card.watermarkUri || card.watermarkPreset);
  const activePreset = card.watermarkPreset ?? MSE_WATERMARK_PRESETS[0].id;
  const opacity = card.watermarkOpacity ?? 0.16;
  const scale = card.watermarkScale ?? 1;
  const [activeCategory, setActiveCategory] = useState<MseWatermarkCategory>("ravnica");
  const visiblePresets = MSE_WATERMARK_PRESETS.filter(
    (preset) => preset.category === activeCategory,
  );

  const selectPreset = (watermarkPreset: string) => {
    onChange({
      watermarkPreset,
      watermarkUri: undefined,
      watermarkOpacity: opacity,
      watermarkScale: scale,
    });
  };

  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 10,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: "#d4d8e0",
            backgroundColor: "#f1eddf",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {card.watermarkUri ? (
            <Image
              accessibilityIgnoresInvertColors
              source={{ uri: card.watermarkUri }}
              resizeMode="contain"
              style={{ width: 54, height: 54, opacity }}
            />
          ) : enabled ? (
            <View style={{ opacity }}>
              <WatermarkSymbolMark presetId={activePreset} size={54} />
            </View>
          ) : (
            <Text selectable={false} style={{ color: "#757b86", fontSize: 12, fontWeight: "900" }}>
              None
            </Text>
          )}
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text
            selectable
            style={{
              color: "#5f6470",
              fontSize: 12,
              fontWeight: "800",
              textTransform: "uppercase",
            }}
          >
            Rules Box Watermark
          </Text>
          <Text selectable style={{ color: "#1f2530", fontSize: 14, fontWeight: "800" }}>
            {card.watermarkUri ? "Custom uploaded image" : enabled ? "MSE preset mark" : "Hidden"}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Disable watermark"
          onPress={() =>
            onChange({
              watermarkPreset: undefined,
              watermarkUri: undefined,
            })
          }
          style={{
            minHeight: 42,
            borderRadius: 8,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: !enabled ? "#151820" : "#d4d8e0",
            backgroundColor: !enabled ? "#151820" : "#ffffff",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 12,
          }}
        >
          <Text selectable={false} style={{ color: !enabled ? "#ffffff" : "#1f2530", fontWeight: "900" }}>
            None
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Upload custom watermark"
          onPress={onPickWatermark}
          style={{
            minHeight: 42,
            borderRadius: 8,
            borderCurve: "continuous",
            backgroundColor: "#151820",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 9,
            paddingHorizontal: 13,
          }}
        >
          <ImagePlus size={17} color="#ffffff" strokeWidth={2.3} />
          <Text selectable={false} style={{ color: "#ffffff", fontWeight: "900" }}>
            Upload
          </Text>
        </Pressable>
      </View>

      <View style={{ gap: 8 }}>
        <Text
          selectable
          style={{
            color: "#5f6470",
            fontSize: 12,
            fontWeight: "800",
            textTransform: "uppercase",
          }}
        >
          MSE watermark bank
        </Text>
        <ScrollView
          horizontal
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 4 }}
        >
          {Object.entries(MSE_WATERMARK_CATEGORY_LABELS).map(([category, label]) => {
            const selected = activeCategory === category;

            return (
              <Pressable
                key={`watermark-category-${category}`}
                accessibilityRole="button"
                accessibilityLabel={`Show ${label} watermarks`}
                onPress={() => setActiveCategory(category as MseWatermarkCategory)}
                style={{
                  minHeight: 38,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: selected ? "#151820" : "#d4d8e0",
                  backgroundColor: selected ? "#151820" : "#ffffff",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 13,
                }}
              >
                <Text
                  selectable={false}
                  style={{
                    color: selected ? "#ffffff" : "#1f2530",
                    fontSize: 13,
                    fontWeight: "900",
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {visiblePresets.map((preset) => {
            const selected = !card.watermarkUri && card.watermarkPreset === preset.id;

            return (
              <Pressable
                key={`watermark-${preset.id}`}
                accessibilityRole="button"
                accessibilityLabel={`Choose ${preset.label} watermark`}
                onPress={() => selectPreset(preset.id)}
                style={{
                  width: 62,
                  minHeight: 62,
                  borderRadius: 8,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: selected ? "#151820" : "#d4d8e0",
                  backgroundColor: selected ? "#151820" : "#ffffff",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 6,
                  gap: 3,
                }}
              >
                <View style={{ opacity: selected ? 0.92 : 0.62 }}>
                  <WatermarkSymbolMark
                    presetId={preset.id}
                    color={selected ? "#ffffff" : "#222222"}
                    size={30}
                  />
                </View>
                <Text
                  selectable={false}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.68}
                  style={{
                    color: selected ? "#ffffff" : "#1f2530",
                    fontSize: 10,
                    lineHeight: 12,
                    fontWeight: "800",
                  }}
                >
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text
          selectable
          style={{
            color: "#5f6470",
            fontSize: 12,
            fontWeight: "800",
            textTransform: "uppercase",
          }}
        >
          Opacity
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {[
            ["Subtle", 0.1],
            ["Normal", 0.16],
            ["Strong", 0.24],
          ].map(([label, value]) => {
            const selected = Math.abs(opacity - Number(value)) < 0.01;

            return (
              <Pressable
                key={`watermark-opacity-${label}`}
                accessibilityRole="button"
                accessibilityLabel={`Set watermark opacity to ${label}`}
                onPress={() => onChange({ watermarkOpacity: Number(value) })}
                style={{
                  minHeight: 38,
                  borderRadius: 8,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: selected ? "#151820" : "#d4d8e0",
                  backgroundColor: selected ? "#151820" : "#ffffff",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 12,
                }}
              >
                <Text selectable={false} style={{ color: selected ? "#ffffff" : "#1f2530", fontWeight: "900" }}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text
          selectable
          style={{
            color: "#5f6470",
            fontSize: 12,
            fontWeight: "800",
            textTransform: "uppercase",
          }}
        >
          Scale
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {[
            ["Small", 0.82],
            ["Normal", 1],
            ["Large", 1.22],
          ].map(([label, value]) => {
            const selected = Math.abs(scale - Number(value)) < 0.01;

            return (
              <Pressable
                key={`watermark-scale-${label}`}
                accessibilityRole="button"
                accessibilityLabel={`Set watermark scale to ${label}`}
                onPress={() => onChange({ watermarkScale: Number(value) })}
                style={{
                  minHeight: 38,
                  borderRadius: 8,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: selected ? "#151820" : "#d4d8e0",
                  backgroundColor: selected ? "#151820" : "#ffffff",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 12,
                }}
              >
                <Text selectable={false} style={{ color: selected ? "#ffffff" : "#1f2530", fontWeight: "900" }}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export function KeywordEditor({
  keywords,
  customDefinitions = [],
  onChangeKeywords,
}: {
  keywords: CardKeyword[];
  customDefinitions?: KeywordDefinition[];
  onChangeKeywords: (keywords: CardKeyword[]) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<KeywordCategory>("ability");
  const [query, setQuery] = useState("");
  const [showArenaKeywords, setShowArenaKeywords] = useState(false);
  const selectedIds = useMemo(
    () => new Set(keywords.map((keyword) => keyword.id)),
    [keywords],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const catalog = normalizedQuery
    ? getSearchKeywordCatalog(customDefinitions, showArenaKeywords)
    : getKeywordCatalog(activeCategory, customDefinitions, showArenaKeywords);
  const filteredCatalog = useMemo(
    () =>
      catalog.filter((keyword) => {
        if (!normalizedQuery) {
          return true;
        }

        return matchesKeywordQuery(keyword, normalizedQuery);
      }),
    [catalog, normalizedQuery],
  );

  const removeKeyword = (keywordId: string) => {
    onChangeKeywords(keywords.filter((keyword) => keyword.id !== keywordId));
  };

  const updateKeyword = (keywordId: string, patch: Partial<CardKeyword>) => {
    onChangeKeywords(
      keywords.map((keyword) =>
        keyword.id === keywordId ? { ...keyword, ...patch } : keyword,
      ),
    );
  };

  const toggleDefinition = (definition: KeywordDefinition) => {
    if (selectedIds.has(definition.id)) {
      removeKeyword(definition.id);
      return;
    }

    onChangeKeywords([...keywords, { ...definition, showReminder: false }]);
  };

  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 8 }}>
        <Text
          selectable
          style={{
            color: "#5f6470",
            fontSize: 12,
            fontWeight: "800",
            textTransform: "uppercase",
          }}
        >
          Selected keywords
        </Text>
        {keywords.length > 0 ? (
          <View style={{ gap: 8 }}>
            {keywords.map((keyword) => (
              <View
                key={keyword.id}
                style={{
                  borderRadius: 9,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: "#d8dbe2",
                  backgroundColor: "#ffffff",
                  padding: 10,
                  gap: 9,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <KeywordIconMark definition={keyword} size={22} />
                      <Text
                        selectable
                        style={{
                          color: "#151820",
                          flexShrink: 1,
                          fontSize: 15,
                          lineHeight: 18,
                          fontWeight: "900",
                        }}
                      >
                        {formatKeywordLine(keyword) || keyword.name}
                      </Text>
                    </View>
                    <Text
                      selectable
                      style={{
                        color: "#68707d",
                        fontSize: 12,
                        fontWeight: "800",
                      }}
                    >
                      {KEYWORD_CATEGORY_LABELS[keyword.category]}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${keyword.name}`}
                    onPress={() => removeKeyword(keyword.id)}
                    style={{
                      minHeight: 36,
                      borderRadius: 8,
                      borderCurve: "continuous",
                      borderWidth: 1,
                      borderColor: "#d4d8e0",
                      backgroundColor: "#f7f8fb",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 11,
                    }}
                  >
                    <Text selectable={false} style={{ color: "#1f2530", fontSize: 13, fontWeight: "900" }}>
                      Remove
                    </Text>
                  </Pressable>
                </View>

                {keyword.reminderText ? (
                  <Pressable
                    accessibilityRole="switch"
                    accessibilityState={{ checked: Boolean(keyword.showReminder) }}
                    onPress={() =>
                      updateKeyword(keyword.id, {
                        showReminder: !keyword.showReminder,
                      })
                    }
                    style={{
                      alignSelf: "flex-start",
                      minHeight: 34,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: keyword.showReminder ? "#151820" : "#d4d8e0",
                      backgroundColor: keyword.showReminder ? "#151820" : "#ffffff",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 12,
                    }}
                  >
                    <Text
                      selectable={false}
                      style={{
                        color: keyword.showReminder ? "#ffffff" : "#1f2530",
                        fontSize: 12,
                        fontWeight: "900",
                      }}
                    >
                      {keyword.showReminder ? "Reminder shown" : "Reminder hidden"}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        ) : (
          <View
            style={{
              minHeight: 44,
              borderRadius: 8,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: "#d8dbe2",
              backgroundColor: "#ffffff",
              justifyContent: "center",
              paddingHorizontal: 12,
            }}
          >
            <Text selectable style={{ color: "#68707d", fontSize: 14, fontWeight: "700" }}>
              No keywords selected
            </Text>
          </View>
        )}
      </View>

      <View style={{ gap: 8 }}>
        <Text
          selectable
          style={{
            color: "#5f6470",
            fontSize: 12,
            fontWeight: "800",
            textTransform: "uppercase",
          }}
        >
          Keyword catalog
        </Text>
        <KeywordCategoryTabs
          activeCategory={activeCategory}
          customDefinitionCount={customDefinitions.length}
          showArenaKeywords={showArenaKeywords}
          onChangeShowArenaKeywords={setShowArenaKeywords}
          onChangeCategory={setActiveCategory}
        />
      </View>

      <View style={{ gap: 12 }}>
        <EditorField
          label="Search"
          value={query}
          onChangeText={setQuery}
        />
        <KeywordDefinitionGrid
          definitions={filteredCatalog}
          selectedIds={selectedIds}
          onToggleDefinition={toggleDefinition}
        />
      </View>
    </View>
  );
}

export function KeywordLibraryPanel({
  customDefinitions,
  onAddCustomDefinition,
}: {
  customDefinitions: KeywordDefinition[];
  onAddCustomDefinition: (definition: KeywordDefinition) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<KeywordCategory>("ability");
  const [query, setQuery] = useState("");
  const [showArenaKeywords, setShowArenaKeywords] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customReminderText, setCustomReminderText] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const catalog = normalizedQuery
    ? getSearchKeywordCatalog(customDefinitions, showArenaKeywords)
    : getKeywordCatalog(activeCategory, customDefinitions, showArenaKeywords);
  const filteredCatalog = useMemo(
    () =>
      catalog.filter((keyword) => {
        if (!normalizedQuery) {
          return true;
        }

        return matchesKeywordQuery(keyword, normalizedQuery);
      }),
    [catalog, normalizedQuery],
  );

  const addCustomDefinition = () => {
    const name = customName.trim();
    const reminderText = customReminderText.trim();

    if (!name) {
      return;
    }

    onAddCustomDefinition({
      id: getAvailableCustomDefinitionId(name, customDefinitions),
      name,
      category: "custom",
      custom: true,
      reminderText: reminderText || undefined,
    });
    setCustomName("");
    setCustomReminderText("");
    setActiveCategory("custom");
  };

  return (
    <View style={{ gap: 16 }}>
      <KeywordCategoryTabs
        activeCategory={activeCategory}
        customDefinitionCount={customDefinitions.length}
        showArenaKeywords={showArenaKeywords}
        onChangeShowArenaKeywords={setShowArenaKeywords}
        onChangeCategory={setActiveCategory}
      />

      {activeCategory === "custom" ? (
        <View style={{ gap: 12 }}>
          <EditorField
            label="New keyword or ability"
            value={customName}
            onChangeText={setCustomName}
          />
          <EditorField
            label="Reminder text"
            value={customReminderText}
            onChangeText={setCustomReminderText}
            multiline
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add custom keyword"
            onPress={addCustomDefinition}
            style={{
              minHeight: 46,
              borderRadius: 8,
              borderCurve: "continuous",
              backgroundColor: customName.trim() ? "#151820" : "#c8ccd5",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 14,
            }}
          >
            <Text selectable={false} style={{ color: "#ffffff", fontSize: 15, fontWeight: "900" }}>
              Add to library
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={{ gap: 12 }}>
        <EditorField
          label="Search library"
          value={query}
          onChangeText={setQuery}
        />
        <KeywordLibraryGrid definitions={filteredCatalog} />
      </View>
    </View>
  );
}

function KeywordCategoryTabs({
  activeCategory,
  customDefinitionCount,
  showArenaKeywords,
  onChangeShowArenaKeywords,
  onChangeCategory,
}: {
  activeCategory: KeywordCategory;
  customDefinitionCount: number;
  showArenaKeywords: boolean;
  onChangeShowArenaKeywords: (showArenaKeywords: boolean) => void;
  onChangeCategory: (category: KeywordCategory) => void;
}) {
  const counts = getKeywordCategoryCounts(customDefinitionCount, showArenaKeywords);

  return (
    <View style={{ gap: 8 }}>
      <Text
        selectable
        style={{
          color: "#68707d",
          fontSize: 11,
          fontWeight: "900",
          textTransform: "uppercase",
        }}
      >
        Filter by keyword class
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {KEYWORD_CATEGORY_TABS.map((category) => {
          const selected = activeCategory === category;

          return (
            <Pressable
              key={category}
              accessibilityRole="button"
              accessibilityLabel={`Show ${KEYWORD_CATEGORY_LABELS[category]}`}
              onPress={() => onChangeCategory(category)}
              style={{
                minHeight: 54,
                minWidth: 128,
                flexGrow: 1,
                borderRadius: 8,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: selected ? "#151820" : "#d4d8e0",
                backgroundColor: selected ? "#151820" : "#ffffff",
                alignItems: "flex-start",
                justifyContent: "center",
                paddingHorizontal: 12,
                paddingVertical: 9,
                gap: 2,
              }}
            >
              <Text
                selectable={false}
                numberOfLines={1}
                style={{
                  color: selected ? "#ffffff" : "#1f2530",
                  fontSize: 13,
                  lineHeight: 16,
                  fontWeight: "900",
                }}
              >
                {getKeywordCategoryShortLabel(category)}
              </Text>
              <Text
                selectable={false}
                numberOfLines={1}
                style={{
                  color: selected ? "rgba(255,255,255,0.72)" : "#68707d",
                  fontSize: 11,
                  lineHeight: 13,
                  fontWeight: "800",
                }}
              >
                {counts[category]} {counts[category] === 1 ? "entry" : "entries"}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: showArenaKeywords }}
        accessibilityLabel="Show Arena keywords"
        onPress={() => onChangeShowArenaKeywords(!showArenaKeywords)}
        style={{
          minHeight: 46,
          borderRadius: 8,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: showArenaKeywords ? "#151820" : "#d4d8e0",
          backgroundColor: showArenaKeywords ? "#f4f6f9" : "#ffffff",
          alignItems: "center",
          flexDirection: "row",
          gap: 10,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <View
          style={{
            width: 36,
            height: 22,
            borderRadius: 999,
            backgroundColor: showArenaKeywords ? "#151820" : "#c8ccd5",
            justifyContent: "center",
            padding: 3,
          }}
        >
          <View
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              backgroundColor: "#ffffff",
              alignSelf: showArenaKeywords ? "flex-end" : "flex-start",
            }}
          />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text selectable={false} style={{ color: "#151820", fontSize: 13, fontWeight: "900" }}>
            Show Arena keywords
          </Text>
          <Text selectable={false} style={{ color: "#68707d", fontSize: 11, fontWeight: "800" }}>
            {showArenaKeywords ? "Digital-only entries included" : "Digital-only entries hidden"}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

function KeywordDefinitionGrid({
  definitions,
  selectedIds,
  onToggleDefinition,
}: {
  definitions: KeywordDefinition[];
  selectedIds: Set<string>;
  onToggleDefinition: (definition: KeywordDefinition) => void;
}) {
  const groups = getKeywordDefinitionGroups(definitions);
  const [collapsedGroupIds, setCollapsedGroupIds] = useCollapsedKeywordGroups();
  const toggleGroup = (groupId: string) => {
    setCollapsedGroupIds((current) => {
      const next = new Set(current);

      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }

      return next;
    });
  };

  return (
    <View style={{ gap: 8 }}>
      {groups.map((group) => {
        const collapsed =
          Boolean(group.title) &&
          group.definitions.length > 1 &&
          collapsedGroupIds.has(group.id);

        return group.title ? (
          <View
            key={group.id}
            style={{
              borderRadius: 9,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: "#d8dbe2",
              backgroundColor: "#ffffff",
              padding: 9,
              gap: 8,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text selectable style={{ color: "#151820", fontSize: 13, fontWeight: "900" }}>
                  {group.title}
                </Text>
                <Text selectable style={{ color: "#68707d", fontSize: 11, fontWeight: "800" }}>
                  {group.definitions.length} {group.definitions.length === 1 ? "ability" : "abilities"}
                </Text>
              </View>
              {group.definitions.length > 1 ? (
                <KeywordGroupToggle
                  collapsed={collapsed}
                  title={group.title}
                  onPress={() => toggleGroup(group.id)}
                />
              ) : null}
            </View>
            {!collapsed ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {group.definitions.map((definition) => (
                  <KeywordDefinitionChip
                    key={definition.id}
                    definition={definition}
                    selected={selectedIds.has(definition.id)}
                    onPress={() => onToggleDefinition(definition)}
                  />
                ))}
              </View>
            ) : null}
          </View>
        ) : (
          <View key={group.id} style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {group.definitions.map((definition) => (
              <KeywordDefinitionChip
                key={definition.id}
                definition={definition}
                selected={selectedIds.has(definition.id)}
                onPress={() => onToggleDefinition(definition)}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}

function KeywordDefinitionChip({
  definition,
  selected,
  onPress,
}: {
  definition: KeywordDefinition;
  selected: boolean;
  onPress: () => void;
}) {
  const descriptor = definition.reminderText
    ? "Reminder available"
    : definition.helpText
      ? "Reference text"
      : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${selected ? "Remove" : "Add"} ${definition.name}`}
      onPress={onPress}
      style={{
        minHeight: 42,
        maxWidth: "100%",
        borderRadius: 8,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: selected ? "#151820" : "#d4d8e0",
        backgroundColor: selected ? "#151820" : "#ffffff",
        justifyContent: "center",
        paddingHorizontal: 11,
        paddingVertical: 8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <KeywordIconMark definition={definition} selected={selected} size={20} />
        <Text
          selectable={false}
          numberOfLines={2}
          style={{
            color: selected ? "#ffffff" : "#1f2530",
            flexShrink: 1,
            fontSize: 13,
            lineHeight: 16,
            fontWeight: "900",
          }}
        >
          {definition.name}
        </Text>
      </View>
      {descriptor ? (
        <Text
          selectable={false}
          numberOfLines={1}
          style={{
            color: selected ? "rgba(255,255,255,0.72)" : "#68707d",
            fontSize: 10,
            lineHeight: 12,
            fontWeight: "800",
          }}
        >
          {descriptor}
        </Text>
      ) : null}
    </Pressable>
  );
}

function KeywordGroupToggle({
  collapsed,
  title,
  onPress,
}: {
  collapsed: boolean;
  title: string;
  onPress: () => void;
}) {
  const Icon = collapsed ? ChevronRight : ChevronDown;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${collapsed ? "Expand" : "Collapse"} ${title}`}
      onPress={onPress}
      style={{
        minHeight: 34,
        borderRadius: 8,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: "#d4d8e0",
        backgroundColor: "#f7f8fb",
        alignItems: "center",
        flexDirection: "row",
        gap: 4,
        justifyContent: "center",
        paddingHorizontal: 8,
      }}
    >
      <Icon size={15} color="#1f2530" strokeWidth={2.6} />
      <Text selectable={false} style={{ color: "#1f2530", fontSize: 12, fontWeight: "900" }}>
        {collapsed ? "Expand" : "Collapse"}
      </Text>
    </Pressable>
  );
}

function KeywordIconMark({
  definition,
  selected = false,
  size = 16,
}: {
  definition: KeywordDefinition;
  selected?: boolean;
  size?: number;
}) {
  const source = definition.icon ? KEYWORD_ICON_SOURCES[definition.icon] : undefined;

  if (!source) {
    return null;
  }

  return (
    <Image
      accessibilityIgnoresInvertColors
      source={source}
      style={{
        width: size,
        height: size,
        opacity: selected ? 0.96 : 0.88,
        tintColor: selected ? "#ffffff" : "#151820",
      }}
    />
  );
}

function KeywordLibraryGrid({ definitions }: { definitions: KeywordDefinition[] }) {
  const groups = getKeywordDefinitionGroups(definitions);
  const [collapsedGroupIds, setCollapsedGroupIds] = useCollapsedKeywordGroups();
  const toggleGroup = (groupId: string) => {
    setCollapsedGroupIds((current) => {
      const next = new Set(current);

      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }

      return next;
    });
  };

  return (
    <View style={{ gap: 8 }}>
      {groups.map((group) => {
        const collapsed =
          Boolean(group.title) &&
          group.definitions.length > 1 &&
          collapsedGroupIds.has(group.id);

        return (
          <View
            key={group.id}
            style={{
              borderRadius: 9,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: "#d8dbe2",
              backgroundColor: "#ffffff",
              padding: 11,
              gap: 4,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  {!group.title && group.definitions[0] ? (
                    <KeywordIconMark definition={group.definitions[0]} size={22} />
                  ) : null}
                  <Text
                    selectable
                    style={{
                      color: "#151820",
                      flexShrink: 1,
                      fontSize: 15,
                      fontWeight: "900",
                    }}
                  >
                    {group.title ?? group.definitions[0]?.name}
                  </Text>
                </View>
                <Text selectable style={{ color: "#68707d", fontSize: 12, fontWeight: "800" }}>
                  {group.title
                    ? `${group.definitions.length} ${group.definitions.length === 1 ? "ability" : "abilities"}`
                    : KEYWORD_CATEGORY_LABELS[group.definitions[0]?.category ?? "ability"]}
                </Text>
              </View>
              {group.title && group.definitions.length > 1 ? (
                <KeywordGroupToggle
                  collapsed={collapsed}
                  title={group.title}
                  onPress={() => toggleGroup(group.id)}
                />
              ) : null}
            </View>
            {group.title ? (
              !collapsed ? (
                <View style={{ gap: 7, paddingTop: 3 }}>
                  {group.definitions.map((definition) => (
                    <View key={definition.id} style={{ gap: 2 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <KeywordIconMark definition={definition} size={20} />
                        <Text
                          selectable
                          style={{
                            color: "#151820",
                            flexShrink: 1,
                            fontSize: 13,
                            fontWeight: "900",
                          }}
                        >
                          {definition.name}
                        </Text>
                      </View>
                      {getKeywordDefinitionHelpText(definition) ? (
                        <Text selectable style={{ color: "#303743", fontSize: 13, lineHeight: 17 }}>
                          {getKeywordDefinitionHelpText(definition)}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null
            ) : getKeywordDefinitionHelpText(group.definitions[0]) ? (
              <Text selectable style={{ color: "#303743", fontSize: 13, lineHeight: 17 }}>
                {getKeywordDefinitionHelpText(group.definitions[0])}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function matchesKeywordQuery(
  definition: KeywordDefinition,
  normalizedQuery: string,
): boolean {
  const helpText = getKeywordDefinitionHelpText(definition);

  return (
    definition.name.toLowerCase().includes(normalizedQuery) ||
    Boolean(helpText?.toLowerCase().includes(normalizedQuery))
  );
}

function getKeywordDefinitionHelpText(
  definition?: KeywordDefinition,
): string | undefined {
  return definition?.helpText ?? definition?.reminderText;
}

function getKeywordCategoryShortLabel(category: KeywordCategory): string {
  if (category === "ability") {
    return "Abilities";
  }

  if (category === "action") {
    return "Mechanic actions";
  }

  if (category === "coreAction") {
    return "Core actions";
  }

  if (category === "abilityWord") {
    return "Ability words";
  }

  return "Custom";
}

function getKeywordCategoryCounts(
  customDefinitionCount: number,
  showArenaKeywords: boolean,
): Record<KeywordCategory, number> {
  return {
    ability: filterArenaKeywordDefinitions(MTG_KEYWORD_ABILITIES, showArenaKeywords).length,
    action: filterArenaKeywordDefinitions(MTG_KEYWORD_ACTIONS, showArenaKeywords).length,
    coreAction: MTG_CORE_ACTIONS.length,
    abilityWord: MTG_ABILITY_WORDS.length,
    custom: customDefinitionCount,
  };
}

type KeywordDefinitionGroup = {
  id: string;
  title?: string;
  definitions: KeywordDefinition[];
};

const DEFAULT_COLLAPSED_KEYWORD_GROUP_IDS = [
  "group-landwalk-abilities",
  "group-landcycling-abilities",
];

const LANDWALK_KEYWORD_IDS = new Set([
  "landwalk",
  "plainswalk",
  "islandwalk",
  "swampwalk",
  "mountainwalk",
  "forestwalk",
  "desertwalk",
  "legendary-landwalk",
  "nonbasic-landwalk",
]);

const LANDCYCLING_KEYWORD_IDS = new Set([
  "basic-landcycling",
  "plainscycling",
  "islandcycling",
  "swampcycling",
  "mountaincycling",
  "forestcycling",
  "landcycling",
]);

function useCollapsedKeywordGroups() {
  return useState<Set<string>>(
    () => new Set(DEFAULT_COLLAPSED_KEYWORD_GROUP_IDS),
  );
}

function getKeywordDefinitionGroups(definitions: KeywordDefinition[]): KeywordDefinitionGroup[] {
  const groups: KeywordDefinitionGroup[] = [];
  const groupedById = new Map<string, KeywordDefinitionGroup>();

  for (const definition of definitions) {
    const title = getLandTypeKeywordGroupTitle(definition.id);

    if (!title) {
      groups.push({ id: definition.id, definitions: [definition] });
      continue;
    }

    const groupId = `group-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    let group = groupedById.get(groupId);

    if (!group) {
      group = { id: groupId, title, definitions: [] };
      groupedById.set(groupId, group);
      groups.push(group);
    }

    group.definitions.push(definition);
  }

  return groups;
}

function getLandTypeKeywordGroupTitle(keywordId: string): string | null {
  if (LANDWALK_KEYWORD_IDS.has(keywordId)) {
    return "Landwalk abilities";
  }

  if (LANDCYCLING_KEYWORD_IDS.has(keywordId)) {
    return "Landcycling abilities";
  }

  return null;
}

function getKeywordCatalog(
  category: KeywordCategory,
  customDefinitions: KeywordDefinition[] = [],
  showArenaKeywords = false,
): KeywordDefinition[] {
  if (category === "ability") {
    return filterArenaKeywordDefinitions(MTG_KEYWORD_ABILITIES, showArenaKeywords);
  }

  if (category === "action") {
    return filterArenaKeywordDefinitions(MTG_KEYWORD_ACTIONS, showArenaKeywords);
  }

  if (category === "coreAction") {
    return MTG_CORE_ACTIONS;
  }

  if (category === "abilityWord") {
    return MTG_ABILITY_WORDS;
  }

  return customDefinitions;
}

function getSearchKeywordCatalog(
  customDefinitions: KeywordDefinition[] = [],
  showArenaKeywords = false,
): KeywordDefinition[] {
  const catalog = [
    ...filterArenaKeywordDefinitions(MTG_KEYWORD_ABILITIES, showArenaKeywords),
    ...filterArenaKeywordDefinitions(MTG_KEYWORD_ACTIONS, showArenaKeywords),
    ...MTG_CORE_ACTIONS,
    ...MTG_ABILITY_WORDS,
    ...customDefinitions,
  ];
  const seenIds = new Set<string>();

  return catalog.filter((definition) => {
    if (seenIds.has(definition.id)) {
      return false;
    }

    seenIds.add(definition.id);
    return true;
  });
}

function filterArenaKeywordDefinitions(
  definitions: KeywordDefinition[],
  showArenaKeywords: boolean,
): KeywordDefinition[] {
  if (showArenaKeywords) {
    return definitions;
  }

  return definitions.filter((definition) => !definition.arenaOnly);
}

function getAvailableCustomKeywordId(name: string, keywords: CardKeyword[]): string {
  const baseId = `custom-${normalizeKeywordId(name) || "keyword"}`;
  let candidate = baseId;
  let suffix = 2;

  while (keywords.some((keyword) => keyword.id === candidate)) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function getAvailableCustomDefinitionId(
  name: string,
  definitions: KeywordDefinition[],
): string {
  const baseId = `custom-${normalizeKeywordId(name) || "keyword"}`;
  let candidate = baseId;
  let suffix = 2;

  while (definitions.some((keyword) => keyword.id === candidate)) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function PlaneswalkerLoyaltyEditor({
  card,
  customKeywordDefinitions = [],
  onChange,
}: {
  card: CardDraft;
  customKeywordDefinitions?: KeywordDefinition[];
  onChange: (patch: Partial<CardDraft>) => void;
}) {
  const abilities = getLoyaltyAbilities(card);

  const updateAbility = (
    abilityId: string,
    patch: Partial<Pick<PlaneswalkerLoyaltyAbility, "cost" | "text">>,
  ) => {
    onChange({
      loyaltyAbilities: abilities.map((ability) =>
        ability.id === abilityId ? { ...ability, ...patch } : ability,
      ),
    });
  };

  const addAbility = () => {
    onChange({
      loyaltyAbilities: [...abilities, createBlankLoyaltyAbility(abilities.length)],
    });
  };

  const removeAbility = (abilityId: string) => {
    const nextAbilities = abilities.filter((ability) => ability.id !== abilityId);

    onChange({
      loyaltyAbilities:
        nextAbilities.length > 0 ? nextAbilities : createDefaultLoyaltyAbilities(),
    });
  };

  return (
    <View style={{ gap: 18 }}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <EditorField
          compact
          label="Starting loyalty"
          value={getStartingLoyalty(card)}
          onChangeText={(startingLoyalty) => onChange({ startingLoyalty })}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add loyalty ability"
          onPress={addAbility}
          style={{
            alignSelf: "flex-end",
            minHeight: 44,
            borderRadius: 8,
            borderCurve: "continuous",
            backgroundColor: "#151820",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            paddingHorizontal: 13,
          }}
        >
          <ListPlus size={17} color="#ffffff" strokeWidth={2.5} />
          <Text selectable={false} style={{ color: "#ffffff", fontSize: 14, fontWeight: "900" }}>
            Add row
          </Text>
        </Pressable>
      </View>

      <View style={{ gap: 12 }}>
        <Text
          selectable
          style={{
            color: "#5f6470",
            fontSize: 12,
            fontWeight: "800",
            textTransform: "uppercase",
          }}
        >
          Loyalty ability rows
        </Text>
        {abilities.map((ability, index) => (
          <View
            key={ability.id}
            style={{
              borderRadius: 10,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: "#d8dbe2",
              backgroundColor: "#ffffff",
              padding: 12,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 12 }}>
              <EditorField
                compact
                label={`Cost ${index + 1}`}
                value={ability.cost}
                onChangeText={(cost) => updateAbility(ability.id, { cost })}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove loyalty ability ${index + 1}`}
                onPress={() => removeAbility(ability.id)}
                style={{
                  width: 44,
                  minHeight: 44,
                  borderRadius: 8,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: "#d4d8e0",
                  backgroundColor: "#f7f8fb",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Trash2 size={17} color="#7a2530" strokeWidth={2.4} />
              </Pressable>
            </View>
            <RichTextEditor
              label="Ability text"
              value={ability.text}
              onChangeText={(text) => updateAbility(ability.id, { text })}
              autocompleteDefinitions={customKeywordDefinitions}
              showSymbolPalette
            />
          </View>
        ))}
      </View>
    </View>
  );
}

function SplitCardEditor({
  card,
  customKeywordDefinitions = [],
  onChange,
}: {
  card: CardDraft;
  customKeywordDefinitions?: KeywordDefinition[];
  onChange: (patch: Partial<CardDraft>) => void;
}) {
  const layout = getSplitLayout(card);
  const leftHalf = getSplitHalf(card, "left");
  const rightHalf = getSplitHalf(card, "right");

  const setLayout = (nextLayout: SplitCardLayout) => {
    if (nextLayout === layout) {
      return;
    }

    onChange({
      typeFrame: getTypeFrameForSplitLayout(nextLayout),
      ...getDefaultSplitPatch(nextLayout, card),
    });
  };

  const updateHalf = (side: "left" | "right", patch: Partial<SplitCardHalf>) => {
    onChange(getSplitHalfPatch(card, side, patch));
  };

  return (
    <View style={{ gap: 18 }}>
      <SplitLayoutToggle value={layout} onChange={setLayout} />
      {layout === "fuse" ? (
        <RichTextEditor
          label="Fuse reminder"
          value={card.splitFuseText ?? DEFAULT_FUSE_REMINDER_TEXT}
          onChangeText={(splitFuseText) => onChange({ splitFuseText })}
          autocompleteDefinitions={customKeywordDefinitions}
          showSymbolPalette
        />
      ) : null}
      <SplitHalfEditor
        label={layout === "aftermath" ? "Upright half" : "Left half"}
        half={leftHalf}
        customKeywordDefinitions={customKeywordDefinitions}
        onChange={(patch) => updateHalf("left", patch)}
      />
      <SplitHalfEditor
        label={layout === "aftermath" ? "Aftermath half" : "Right half"}
        half={rightHalf}
        customKeywordDefinitions={customKeywordDefinitions}
        onChange={(patch) => updateHalf("right", patch)}
      />
    </View>
  );
}

function SplitLayoutToggle({
  value,
  onChange,
}: {
  value: SplitCardLayout;
  onChange: (layout: SplitCardLayout) => void;
}) {
  const options = [
    ["split", "Split"] as const,
    ["fuse", "Fuse"] as const,
    ["aftermath", "Aftermath"] as const,
  ];

  return (
    <View style={{ gap: 8 }}>
      <Text
        selectable
        style={{
          color: "#5f6470",
          fontSize: 12,
          fontWeight: "800",
          textTransform: "uppercase",
        }}
      >
        Split layout
      </Text>
      <View
        style={{
          minHeight: 42,
          borderRadius: 10,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: "#d4d8e0",
          backgroundColor: "#ffffff",
          flexDirection: "row",
          padding: 4,
          gap: 4,
        }}
      >
        {options.map(([option, label]) => {
          const selected = value === option;

          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityLabel={`Use ${label} split layout`}
              onPress={() => onChange(option)}
              style={{
                flex: 1,
                minHeight: 34,
                borderRadius: 7,
                borderCurve: "continuous",
                backgroundColor: selected ? "#151820" : "transparent",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 8,
              }}
            >
              <Text
                selectable={false}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                style={{
                  color: selected ? "#ffffff" : "#1f2530",
                  fontSize: 13,
                  fontWeight: "900",
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function getTypeFrameForSplitLayout(layout: SplitCardLayout): TypeFrame {
  return layout === "aftermath" ? "aftermath" : layout === "fuse" ? "fuse" : "split";
}

function SplitHalfEditor({
  label,
  half,
  customKeywordDefinitions = [],
  onChange,
}: {
  label: string;
  half: SplitCardHalf;
  customKeywordDefinitions?: KeywordDefinition[];
  onChange: (patch: Partial<SplitCardHalf>) => void;
}) {
  const frameIdentity = inferFrameIdentity(toSplitHalfCard({} as CardDraft, half));

  return (
    <View
      style={{
        borderRadius: 10,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: "#d8dbe2",
        backgroundColor: "#ffffff",
        padding: 12,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 34,
            height: 18,
            borderRadius: 4,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: "#aab0ba",
            backgroundColor: frameSwatchColor(frameIdentity),
          }}
        />
        <View style={{ flex: 1 }}>
          <Text
            selectable
            style={{
              color: "#5f6470",
              fontSize: 12,
              fontWeight: "800",
              textTransform: "uppercase",
            }}
          >
            {label}
          </Text>
          <Text selectable style={{ color: "#1f2530", fontSize: 13, fontWeight: "800" }}>
            Automatic frame: {FRAME_SELECTION_LABELS[frameIdentity]}
          </Text>
        </View>
      </View>

      <EditorField
        label="Half name"
        value={half.name}
        onChangeText={(name) => onChange({ name })}
        autoCapitalize="words"
      />
      <View style={{ flexDirection: "row", gap: 12 }}>
        <EditorField
          compact
          label="Mana cost"
          value={half.manaCost}
          onChangeText={(manaCost) => onChange({ manaCost })}
          onBlur={() => onChange({ manaCost: normalizeManaInput(half.manaCost) })}
        />
        <EditorField
          compact
          label="Type line"
          value={half.typeLine}
          onChangeText={(typeLine) => onChange({ typeLine: normalizeTypeLineInput(typeLine) })}
          autoCapitalize="words"
        />
      </View>
      <ManaCostControl value={half.manaCost} onChange={(manaCost) => onChange({ manaCost })} />
      <RichTextEditor
        label="Rules text"
        value={half.rulesText}
        onChangeText={(rulesText) => onChange({ rulesText })}
        autocompleteDefinitions={customKeywordDefinitions}
        keywords={half.keywords ?? []}
        onChangeKeywords={(keywords) => onChange({ keywords })}
        showSymbolPalette
      />
      <RichTextEditor
        label="Flavor text"
        value={half.flavorText ?? ""}
        onChangeText={(flavorText) => onChange({ flavorText })}
      />
    </View>
  );
}

function SagaRulesEditor({
  card,
  customKeywordDefinitions = [],
  onChange,
}: {
  card: CardDraft;
  customKeywordDefinitions?: KeywordDefinition[];
  onChange: (patch: Partial<CardDraft>) => void;
}) {
  const faceCard = getEditableCardFace(card);
  const updateFace = (patch: Partial<CardDraft>) => onChange(toDfcFacePatch(card, patch));
  const nextChapter = getNextSagaChapterLabel(faceCard.rulesText);
  const sagaRulesEditorText = getSagaRulesEditorText(faceCard.rulesText);
  const appendChapter = (chapterLabel: string) => {
    updateFace({ rulesText: appendSagaChapterLine(faceCard.rulesText, chapterLabel) });
  };

  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 10 }}>
        <Text
          selectable
          style={{
            color: "#5f6470",
            fontSize: 12,
            fontWeight: "800",
            textTransform: "uppercase",
          }}
        >
          Saga chapter controls
        </Text>
        <ScrollView
          horizontal
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 4 }}
        >
          <SagaChapterButton
            label={`Add ${nextChapter}`}
            accessibilityLabel={`Add chapter ${nextChapter}`}
            onPress={() => appendChapter(nextChapter)}
          />
          <SagaChapterButton
            label="I, II"
            accessibilityLabel="Add shared chapters I and II"
            onPress={() => appendChapter("I, II")}
          />
          {SAGA_CHAPTER_LABELS.map((chapterLabel) => (
            <SagaChapterButton
              key={`saga-chapter-${chapterLabel}`}
              label={chapterLabel}
              accessibilityLabel={`Add chapter ${chapterLabel}`}
              onPress={() => appendChapter(chapterLabel)}
            />
          ))}
        </ScrollView>
      </View>

      <RichTextEditor
        label="Saga rules text"
        value={sagaRulesEditorText}
        onChangeText={(rulesText) =>
          updateFace({ rulesText: normalizeSagaChapterBreaks(rulesText) })
        }
        autocompleteDefinitions={customKeywordDefinitions}
        keywords={faceCard.keywords ?? []}
        onChangeKeywords={(keywords) => updateFace({ keywords })}
        showSymbolPalette
      />
      <RichTextEditor
        label="Flavor text"
        value={faceCard.flavorText}
        onChangeText={(flavorText) => updateFace({ flavorText })}
      />
    </View>
  );
}

function SagaChapterButton({
  label,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={{
        minWidth: 44,
        minHeight: 36,
        borderRadius: 8,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: "#ccd2dc",
        backgroundColor: "#ffffff",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 12,
      }}
    >
      <Text
        selectable={false}
        style={{
          color: "#11151c",
          fontSize: 14,
          fontWeight: "800",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function appendSagaChapterLine(rulesText: string, chapterLabel: string): string {
  const trimmedText = rulesText.trimEnd();
  const separator = trimmedText.length > 0 ? "\n" : "";

  return `${trimmedText}${separator}${chapterLabel} — `;
}

function getSagaRulesEditorText(rulesText: string): string {
  const normalizedRulesText = rulesText.replace(/\r\n?/g, "\n");
  const trimmedRulesText = normalizedRulesText.trim();

  if (!trimmedRulesText) {
    return "I — ";
  }

  if (trimmedRulesText.startsWith("(")) {
    const lines = normalizedRulesText.split("\n");
    const chapterText = lines.slice(1).join("\n").trim();

    if (!chapterText) {
      return `${lines[0]}\nI — `;
    }

    if (SAGA_CHAPTER_PREFIX_PATTERN.test(chapterText)) {
      return normalizedRulesText;
    }

    return `${lines[0]}\nI — ${lines.slice(1).join("\n")}`;
  }

  if (SAGA_CHAPTER_PREFIX_PATTERN.test(trimmedRulesText)) {
    return normalizedRulesText;
  }

  return `I — ${normalizedRulesText}`;
}

function getNextSagaChapterLabel(rulesText: string): string {
  const usedChapters = new Set<number>();

  for (const match of rulesText.matchAll(/^((?:VI|IV|III|II|V|I)(?:\s*(?:,|-|–|—|\s)\s*(?:VI|IV|III|II|V|I))*)\s*[—–-]/gim)) {
    match[1]
      .toUpperCase()
      .match(SAGA_CHAPTER_TOKEN_PATTERN)
      ?.forEach((chapterLabel) => {
        const chapterIndex = SAGA_CHAPTER_LABELS.indexOf(
          chapterLabel as (typeof SAGA_CHAPTER_LABELS)[number],
        );

        if (chapterIndex >= 0) {
          usedChapters.add(chapterIndex);
        }
      });
  }

  return SAGA_CHAPTER_LABELS.find((_, chapterIndex) => !usedChapters.has(chapterIndex)) ?? "VI";
}

function AdventureRulesEditor({
  card,
  customKeywordDefinitions = [],
  onChange,
}: {
  card: CardDraft;
  customKeywordDefinitions?: KeywordDefinition[];
  onChange: (patch: Partial<CardDraft>) => void;
}) {
  const adventureName = card.adventureName ?? "Swift Errand";
  const adventureManaCost = card.adventureManaCost ?? "{1}{G}";
  const adventureTypeLine = card.adventureTypeLine ?? "Sorcery — Adventure";
  const adventureRulesText =
    card.adventureRulesText ?? "Create a 1/1 green Elf creature token.";

  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 10 }}>
        <Text
          selectable
          style={{
            color: "#5f6470",
            fontSize: 12,
            fontWeight: "800",
            textTransform: "uppercase",
          }}
        >
          Adventure spell panel
        </Text>
        <EditorField
          label="Adventure name"
          value={adventureName}
          onChangeText={(nextAdventureName) =>
            onChange({ adventureName: nextAdventureName })
          }
        />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <EditorField
            compact
            label="Adventure cost"
            value={adventureManaCost}
            onChangeText={(nextAdventureManaCost) =>
              onChange({ adventureManaCost: nextAdventureManaCost })
            }
            onBlur={() =>
              onChange({ adventureManaCost: normalizeManaInput(adventureManaCost) })
            }
          />
          <EditorField
            compact
            label="Spell type"
            value={adventureTypeLine}
            onChangeText={(nextAdventureTypeLine) =>
              onChange({ adventureTypeLine: normalizeTypeLineInput(nextAdventureTypeLine) })
            }
          />
        </View>
        <RichTextEditor
          label="Adventure rules text"
          value={adventureRulesText}
          onChangeText={(nextAdventureRulesText) =>
            onChange({ adventureRulesText: nextAdventureRulesText })
          }
          autocompleteDefinitions={customKeywordDefinitions}
          showSymbolPalette
        />
      </View>

      <View style={{ gap: 10 }}>
        <Text
          selectable
          style={{
            color: "#5f6470",
            fontSize: 12,
            fontWeight: "800",
            textTransform: "uppercase",
          }}
        >
          Main card text panel
        </Text>
        <RichTextEditor
          label="Main rules text"
          value={card.rulesText}
          onChangeText={(rulesText) => onChange({ rulesText })}
          autocompleteDefinitions={customKeywordDefinitions}
          keywords={card.keywords ?? []}
          onChangeKeywords={(keywords) => onChange({ keywords })}
          showSymbolPalette
        />
        <RichTextEditor
          label="Main flavor text"
          value={card.flavorText}
          onChangeText={(flavorText) => onChange({ flavorText })}
        />
      </View>
    </View>
  );
}

function RichTextEditor({
  label,
  value,
  onChangeText,
  autocompleteDefinitions,
  keywords = [],
  onChangeKeywords,
  showSymbolPalette = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  autocompleteDefinitions?: KeywordDefinition[];
  keywords?: CardKeyword[];
  onChangeKeywords?: (keywords: CardKeyword[]) => void;
  showSymbolPalette?: boolean;
}) {
  const [selectionRange, setSelectionRange] = useState({ start: value.length, end: value.length });
  const [forcedSelectionRange, setForcedSelectionRange] = useState<
    { start: number; end: number } | undefined
  >(undefined);
  const [contentHeight, setContentHeight] = useState(0);
  const [symbolMode, setSymbolMode] = useState<RulesTextSymbolMode>("standard");
  const selectionStart = selectionRange.start;
  const symbolsForMode =
    symbolMode === "standard" ? STANDARD_RULES_TEXT_SYMBOLS : HYBRID_RULES_TEXT_SYMBOLS;
  const keywordSuggestions = useMemo(
    () =>
      autocompleteDefinitions
        ? getRulesKeywordAutocompleteSuggestions(value, selectionStart, autocompleteDefinitions)
        : [],
    [autocompleteDefinitions, selectionStart, value],
  );
  const multilineMinHeight = 108;
  const multilineLineHeight = 21;
  const multilineVerticalPadding = 22;
  const shouldMeasureContentHeight = Platform.OS !== "web";
  const explicitLineHeight = getExplicitLineCount(value) * multilineLineHeight + multilineVerticalPadding;
  const measuredMultilineHeight =
    contentHeight > 0 ? contentHeight + multilineVerticalPadding : multilineMinHeight;
  const multilineHeight = Math.max(
    multilineMinHeight,
    explicitLineHeight,
    shouldMeasureContentHeight ? measuredMultilineHeight : 0,
  );

  useEffect(() => {
    setSelectionRange((currentRange) => {
      const nextStart = Math.min(currentRange.start, value.length);
      const nextEnd = Math.min(Math.max(currentRange.end, nextStart), value.length);

      return nextStart === currentRange.start && nextEnd === currentRange.end
        ? currentRange
        : { start: nextStart, end: nextEnd };
    });
    setForcedSelectionRange((currentRange) => {
      if (!currentRange) {
        return currentRange;
      }

      const nextStart = Math.min(currentRange.start, value.length);
      const nextEnd = Math.min(Math.max(currentRange.end, nextStart), value.length);

      return nextStart === currentRange.start && nextEnd === currentRange.end
        ? currentRange
        : { start: nextStart, end: nextEnd };
    });
  }, [value.length]);

  const appendSymbol = (symbol: string) => {
    if (symbol === "1") {
      incrementGenericManaSymbol();
      return;
    }

    const start = Math.max(0, Math.min(selectionRange.start, value.length));
    const end = Math.max(start, Math.min(selectionRange.end, value.length));
    const beforeSelection = value.slice(0, start);
    const afterSelection = value.slice(end);
    const prefixSeparator = beforeSelection.length > 0 && !/[\s({/]$/.test(beforeSelection) ? " " : "";
    const suffixSeparator = afterSelection.length > 0 && !/^[\s.,;:)}]/.test(afterSelection) ? " " : "";
    const insertion = `${prefixSeparator}{${symbol}}${suffixSeparator}`;
    const cursorIndex = start + insertion.length;

    onChangeText(`${beforeSelection}${insertion}${afterSelection}`);
    setSelectionRange({ start: cursorIndex, end: cursorIndex });
    setForcedSelectionRange({ start: cursorIndex, end: cursorIndex });
  };
  const incrementGenericManaSymbol = () => {
    const start = Math.max(0, Math.min(selectionRange.start, value.length));
    const end = Math.max(start, Math.min(selectionRange.end, value.length));
    const selectedText = value.slice(start, end);
    const selectedGenericMatch = selectedText.match(/^\{(\d+)\}$/);

    if (selectedGenericMatch) {
      const nextValue = Number(selectedGenericMatch[1]) + 1;
      const insertion = `{${nextValue}}`;
      const cursorIndex = start + insertion.length;

      onChangeText(`${value.slice(0, start)}${insertion}${value.slice(end)}`);
      setSelectionRange({ start: cursorIndex, end: cursorIndex });
      setForcedSelectionRange({ start: cursorIndex, end: cursorIndex });
      return;
    }

    const cursor = start;
    const adjacentGenericSymbolPattern = /\{(\d+)\}/g;
    let adjacentGenericMatch: RegExpExecArray | null = null;

    let match: RegExpExecArray | null;

    while ((match = adjacentGenericSymbolPattern.exec(value)) !== null) {
      const tokenStart = match.index ?? 0;
      const tokenEnd = tokenStart + match[0].length;

      if (cursor >= tokenStart && cursor <= tokenEnd) {
        adjacentGenericMatch = match;
      }

      if (tokenEnd === cursor) {
        adjacentGenericMatch = match;
      }
    }

    if (adjacentGenericMatch) {
      const tokenStart = adjacentGenericMatch.index ?? 0;
      const tokenEnd = tokenStart + adjacentGenericMatch[0].length;
      const nextValue = Number(adjacentGenericMatch[1]) + 1;
      const insertion = `{${nextValue}}`;
      const cursorIndex = tokenStart + insertion.length;

      onChangeText(`${value.slice(0, tokenStart)}${insertion}${value.slice(tokenEnd)}`);
      setSelectionRange({ start: cursorIndex, end: cursorIndex });
      setForcedSelectionRange({ start: cursorIndex, end: cursorIndex });
      return;
    }

    const beforeSelection = value.slice(0, start);
    const afterSelection = value.slice(end);
    const prefixSeparator = beforeSelection.length > 0 && !/[\s({/]$/.test(beforeSelection) ? " " : "";
    const suffixSeparator = afterSelection.length > 0 && !/^[\s.,;:)}]/.test(afterSelection) ? " " : "";
    const insertion = `${prefixSeparator}{1}${suffixSeparator}`;
    const cursorIndex = start + insertion.length;

    onChangeText(`${beforeSelection}${insertion}${afterSelection}`);
    setSelectionRange({ start: cursorIndex, end: cursorIndex });
    setForcedSelectionRange({ start: cursorIndex, end: cursorIndex });
  };
  const selectKeywordSuggestion = (suggestion: RulesKeywordAutocompleteSuggestion) => {
    onChangeText(suggestion.replacement);
    setSelectionRange({ start: suggestion.cursorIndex, end: suggestion.cursorIndex });
    setForcedSelectionRange({ start: suggestion.cursorIndex, end: suggestion.cursorIndex });
  };
  const updateSelection = (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
    const nextSelection = event.nativeEvent.selection;

    setSelectionRange(nextSelection);
    setForcedSelectionRange((currentSelection) =>
      currentSelection &&
      currentSelection.start === nextSelection.start &&
      currentSelection.end === nextSelection.end
        ? undefined
        : currentSelection,
    );
  };
  const updateSelectionFromTextChange = (event: unknown) => {
    const selectionStart = getTextInputSelectionStart(event);

    if (selectionStart !== null) {
      const nextSelection = { start: selectionStart, end: selectionStart };

      setSelectionRange(nextSelection);
      setForcedSelectionRange((currentSelection) =>
        currentSelection &&
        currentSelection.start === nextSelection.start &&
        currentSelection.end === nextSelection.end
          ? undefined
          : currentSelection,
      );
    }
  };

  return (
    <View style={{ gap: 8, position: "relative", zIndex: keywordSuggestions.length > 0 ? 80 : 1 }}>
      <View style={{ gap: 6 }}>
        <Text
          selectable
          style={{
            color: "#5f6470",
            fontSize: 12,
            fontWeight: "800",
            textTransform: "uppercase",
          }}
        >
          {label}
        </Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onChange={updateSelectionFromTextChange}
          onSelectionChange={updateSelection}
          selection={forcedSelectionRange}
          multiline
          scrollEnabled={false}
          blurOnSubmit={false}
          submitBehavior="newline"
          onContentSizeChange={
            shouldMeasureContentHeight
              ? (event) => {
                  const nextHeight = Math.ceil(event.nativeEvent.contentSize.height);

                  setContentHeight((currentHeight) =>
                    currentHeight === nextHeight ? currentHeight : nextHeight,
                  );
                }
              : undefined
          }
          textAlignVertical="top"
          style={{
            minHeight: multilineMinHeight,
            height: multilineHeight,
            borderRadius: 8,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: "#d8dbe2",
            backgroundColor: "#ffffff",
            color: "#151820",
            fontSize: 16,
            lineHeight: multilineLineHeight,
            overflow: "hidden",
            paddingHorizontal: 12,
            paddingVertical: 11,
          }}
        />
        {keywordSuggestions.length > 0 ? (
          <RulesKeywordAutocompleteMenu
            suggestions={keywordSuggestions}
            onSelect={selectKeywordSuggestion}
          />
        ) : null}
        <KeywordReminderToggleBar
          keywords={keywords}
          onChangeKeywords={onChangeKeywords}
        />
      </View>
      {showSymbolPalette ? (
        <View style={{ gap: 8 }}>
          <RulesTextSymbolModePicker
            value={symbolMode}
            onChange={setSymbolMode}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
            {symbolsForMode.map((symbol) => (
              <Pressable
                key={`${label}-${symbol}`}
                accessibilityRole="button"
                accessibilityLabel={
                  symbol === "1"
                    ? `Add or increment generic mana symbol in ${label}`
                    : `Add ${symbol} symbol to ${label}`
                }
                onPress={() => appendSymbol(symbol)}
                style={{
                  minWidth: 38,
                  height: 34,
                  borderRadius: 8,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: "#d4d8e0",
                  backgroundColor: "#f7f8fb",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 7,
                }}
              >
                <ManaSymbol value={symbol} size={20} />
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function RulesTextSymbolModePicker({
  value,
  onChange,
}: {
  value: RulesTextSymbolMode;
  onChange: (value: RulesTextSymbolMode) => void;
}) {
  const options: Array<{ value: RulesTextSymbolMode; label: string }> = [
    { value: "standard", label: "Standard" },
    { value: "hybrid", label: "Hybrid" },
  ];

  return (
    <View
      accessibilityRole="tablist"
      style={{
        minHeight: 38,
        borderRadius: 10,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: "#d4d8e0",
        backgroundColor: "#eef1f6",
        flexDirection: "row",
        padding: 3,
        gap: 3,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`Show ${option.label.toLowerCase()} rules text mana symbols`}
            onPress={() => onChange(option.value)}
            style={{
              flex: 1,
              minHeight: 30,
              borderRadius: 8,
              borderCurve: "continuous",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: selected ? "#151820" : "transparent",
            }}
          >
            <Text
              selectable={false}
              style={{
                color: selected ? "#ffffff" : "#4e5664",
                fontSize: 13,
                fontWeight: "900",
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function KeywordReminderToggleBar({
  keywords,
  onChangeKeywords,
}: {
  keywords: CardKeyword[];
  onChangeKeywords?: (keywords: CardKeyword[]) => void;
}) {
  if (keywords.length === 0) {
    return null;
  }

  const updateKeyword = (keywordId: string, patch: Partial<CardKeyword>) => {
    onChangeKeywords?.(
      keywords.map((keyword) =>
        keyword.id === keywordId ? { ...keyword, ...patch } : keyword,
      ),
    );
  };

  return (
    <View style={{ gap: 7 }}>
      <Text
        selectable
        style={{
          color: "#68707d",
          fontSize: 11,
          fontWeight: "900",
          textTransform: "uppercase",
        }}
      >
        Keyword reminders
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
        {keywords.map((keyword) => {
          const hasReminder = Boolean(keyword.reminderText?.trim());
          const reminderShown = Boolean(keyword.showReminder);

          return (
            <Pressable
              key={`rules-keyword-${keyword.id}`}
              accessibilityRole={hasReminder ? "switch" : "button"}
              accessibilityLabel={
                hasReminder
                  ? `${reminderShown ? "Hide" : "Show"} reminder text for ${keyword.name}`
                  : `${keyword.name} has no reminder text`
              }
              accessibilityState={hasReminder ? { checked: reminderShown } : { disabled: true }}
              disabled={!hasReminder || !onChangeKeywords}
              onPress={() =>
                updateKeyword(keyword.id, {
                  showReminder: !reminderShown,
                })
              }
              style={{
                minHeight: 34,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: !hasReminder
                  ? "#d4d8e0"
                  : reminderShown
                    ? "#151820"
                    : "#98a1af",
                backgroundColor: !hasReminder
                  ? "#f1f3f6"
                  : reminderShown
                    ? "#151820"
                    : "#ffffff",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 7,
                paddingHorizontal: 11,
              }}
            >
              <KeywordIconMark definition={keyword} size={17} />
              <Text
                selectable={false}
                style={{
                  color: !hasReminder ? "#767d89" : reminderShown ? "#ffffff" : "#1f2530",
                  fontSize: 12,
                  fontWeight: "900",
                }}
              >
                {keyword.name}
              </Text>
              {hasReminder ? (
                <Text
                  selectable={false}
                  style={{
                    color: reminderShown ? "#d7e3ff" : "#68707d",
                    fontSize: 11,
                    fontWeight: "900",
                  }}
                >
                  {reminderShown ? "Shown" : "Hidden"}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type RulesKeywordAutocompleteSuggestion = KeywordDefinition & {
  fragment: string;
  replacement: string;
  cursorIndex: number;
};

type RulesKeywordFragment = {
  text: string;
  start: number;
  end: number;
  wordCount: number;
};

const RULES_KEYWORD_WORD_PATTERN = /[A-Za-z][A-Za-z'’!-]*/g;
const RULES_KEYWORD_WORD_CHAR_PATTERN = /[A-Za-z'’!-]/;
const MAX_RULES_KEYWORD_SUGGESTIONS = 6;

const RULES_KEYWORD_CATEGORY_WEIGHT: Record<KeywordCategory, number> = {
  ability: 0,
  action: 1,
  coreAction: 2,
  abilityWord: 3,
  custom: 4,
};

function RulesKeywordAutocompleteMenu({
  suggestions,
  onSelect,
}: {
  suggestions: RulesKeywordAutocompleteSuggestion[];
  onSelect: (suggestion: RulesKeywordAutocompleteSuggestion) => void;
}) {
  return (
    <View
      style={{
        borderRadius: 10,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: "#d8dbe2",
        backgroundColor: "#ffffff",
        boxShadow: "0 12px 26px rgba(0, 0, 0, 0.14)",
        overflow: "hidden",
        elevation: 90,
        zIndex: 100,
      }}
    >
      {suggestions.map((suggestion) => (
        <Pressable
          key={`rules-keyword-${suggestion.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Autocomplete ${suggestion.name}`}
          onPress={() => onSelect(suggestion)}
          style={{
            minHeight: 50,
            borderBottomWidth: 1,
            borderBottomColor: "#edf0f4",
            paddingHorizontal: 12,
            paddingVertical: 8,
            gap: 2,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <Text selectable={false} style={{ color: "#151820", fontSize: 15, fontWeight: "900" }}>
              {suggestion.name}
            </Text>
            <Text selectable={false} style={{ color: "#68707d", fontSize: 11, fontWeight: "800" }}>
              {getKeywordCategoryShortLabel(suggestion.category)}
            </Text>
          </View>
          {getKeywordDefinitionHelpText(suggestion) ? (
            <Text selectable={false} numberOfLines={1} style={{ color: "#68707d", fontSize: 12, lineHeight: 15 }}>
              {getKeywordDefinitionHelpText(suggestion)}
            </Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

function getRulesKeywordAutocompleteSuggestions(
  rulesText: string,
  cursorIndex: number,
  customDefinitions: KeywordDefinition[],
): RulesKeywordAutocompleteSuggestion[] {
  const fragmentCandidates = getRulesKeywordFragmentCandidates(rulesText, cursorIndex);

  if (fragmentCandidates.length === 0) {
    return [];
  }

  const catalog = getSearchKeywordCatalog(customDefinitions, false);
  const seenIds = new Set<string>();
  const suggestions: Array<RulesKeywordAutocompleteSuggestion & { score: number }> = [];

  for (const definition of catalog) {
    const normalizedName = normalizeRulesKeywordAutocompleteText(definition.name);
    const matchingFragment = fragmentCandidates.find((fragment) => {
      const normalizedFragment = normalizeRulesKeywordAutocompleteText(fragment.text);

      return (
        normalizedFragment.length > 0 &&
        normalizedName !== normalizedFragment &&
        normalizedName.startsWith(normalizedFragment)
      );
    });

    if (!matchingFragment || seenIds.has(definition.id)) {
      continue;
    }

    seenIds.add(definition.id);

    const insertion = getRulesKeywordInsertionName(definition.name, matchingFragment, rulesText);
    suggestions.push({
      ...definition,
      fragment: matchingFragment.text,
      replacement: `${rulesText.slice(0, matchingFragment.start)}${insertion}${rulesText.slice(matchingFragment.end)}`,
      cursorIndex: matchingFragment.start + insertion.length,
      score: normalizeRulesKeywordAutocompleteText(matchingFragment.text).length,
    });
  }

  return suggestions
    .sort((first, second) => {
      return (
        second.score - first.score ||
        RULES_KEYWORD_CATEGORY_WEIGHT[first.category] - RULES_KEYWORD_CATEGORY_WEIGHT[second.category] ||
        first.name.length - second.name.length ||
        first.name.localeCompare(second.name)
      );
    })
    .slice(0, MAX_RULES_KEYWORD_SUGGESTIONS)
    .map(({ score: _score, ...suggestion }) => suggestion);
}

function getRulesKeywordFragmentCandidates(
  rulesText: string,
  cursorIndex: number,
): RulesKeywordFragment[] {
  const boundedCursorIndex = Math.max(0, Math.min(rulesText.length, cursorIndex));

  if (isCursorInsideManaSymbol(rulesText, boundedCursorIndex)) {
    return [];
  }

  let tokenStart = boundedCursorIndex;
  let tokenEnd = boundedCursorIndex;

  while (tokenStart > 0 && RULES_KEYWORD_WORD_CHAR_PATTERN.test(rulesText[tokenStart - 1])) {
    tokenStart -= 1;
  }

  while (tokenEnd < rulesText.length && RULES_KEYWORD_WORD_CHAR_PATTERN.test(rulesText[tokenEnd])) {
    tokenEnd += 1;
  }

  if (tokenStart === tokenEnd || !/[A-Za-z]/.test(rulesText.slice(tokenStart, tokenEnd))) {
    return [];
  }

  const prefix = rulesText.slice(0, tokenEnd);
  const wordMatches = Array.from(prefix.matchAll(RULES_KEYWORD_WORD_PATTERN))
    .map((match) => ({
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
    }))
    .filter((match) => match.end <= tokenEnd);
  const lastWordIndex = wordMatches.findLastIndex(
    (match) => match.start <= tokenStart && match.end >= tokenStart,
  );

  if (lastWordIndex < 0) {
    return [];
  }

  const fragments: RulesKeywordFragment[] = [];

  for (let index = lastWordIndex; index >= 0; index -= 1) {
    const wordCount = lastWordIndex - index + 1;

    if (wordCount > getMaxKeywordDefinitionWordCount()) {
      break;
    }

    if (index < lastWordIndex) {
      const separator = rulesText.slice(wordMatches[index].end, wordMatches[index + 1].start);

      if (!/^\s+$/.test(separator)) {
        break;
      }
    }

    fragments.push({
      text: rulesText.slice(wordMatches[index].start, tokenEnd),
      start: wordMatches[index].start,
      end: tokenEnd,
      wordCount,
    });
  }

  return fragments.sort((first, second) => second.wordCount - first.wordCount);
}

let maxKeywordDefinitionWordCountCache: number | null = null;

function getMaxKeywordDefinitionWordCount(): number {
  if (maxKeywordDefinitionWordCountCache !== null) {
    return maxKeywordDefinitionWordCountCache;
  }

  maxKeywordDefinitionWordCountCache = Math.max(
    1,
    ...getSearchKeywordCatalog([], true).map((definition) => definition.name.trim().split(/\s+/).length),
  );

  return maxKeywordDefinitionWordCountCache;
}

function isCursorInsideManaSymbol(rulesText: string, cursorIndex: number): boolean {
  const lastOpenBrace = rulesText.lastIndexOf("{", cursorIndex - 1);
  const lastCloseBrace = rulesText.lastIndexOf("}", cursorIndex - 1);

  return lastOpenBrace > lastCloseBrace;
}

function getRulesKeywordInsertionName(
  keywordName: string,
  fragment: RulesKeywordFragment,
  rulesText: string,
): string {
  const previousText = rulesText.slice(0, fragment.start);
  const startsSentence = /(^|[\n.!?]\s*)$/.test(previousText);
  const firstCharacter = fragment.text.trimStart()[0];

  if (!startsSentence && firstCharacter === firstCharacter.toLowerCase()) {
    return `${keywordName.charAt(0).toLowerCase()}${keywordName.slice(1)}`;
  }

  return keywordName;
}

function normalizeRulesKeywordAutocompleteText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function getExplicitLineCount(value: string): number {
  return Math.max(1, value.replace(/\r\n?/g, "\n").split("\n").length);
}

function FrameEditor({
  card,
  onChange,
}: {
  card: CardDraft;
  onChange: (patch: Partial<CardDraft>) => void;
}) {
  const faceCard = getEditableCardFace(card);
  const selection = faceCard.frameSelection ?? "auto";
  const frameTreatment = faceCard.frameTreatment ?? "standard";
  const frameIdentity = inferFrameIdentity(faceCard);
  const selectedShowcaseFrame = faceCard.showcaseFrame ?? DEFAULT_SHOWCASE_FRAME;
  const compatibleFrameTreatments = (card.typeFrame ?? "standard") === "standard"
    ? STANDARD_FRAME_TREATMENTS
    : (["standard"] as FrameTreatment[]);
  const manualFrameSelections = FRAME_SELECTIONS.filter((frameSelection) => frameSelection !== "auto");
  const manualFrameColors = getManualFrameColors(faceCard);
  const frameSelectionColors: Partial<Record<FrameSelection, ManaColor>> = {
    white: "W",
    blue: "U",
    black: "B",
    red: "R",
    green: "G",
  };

  const setSelection = (frameSelection: FrameSelection) => {
    onChange(toDfcFacePatch(card, { frameSelection, frameColors: undefined }));
  };

  const toggleFrameColor = (color: ManaColor) => {
    const selectedColors = new Set(manualFrameColors);

    if (selectedColors.has(color)) {
      selectedColors.delete(color);
    } else {
      selectedColors.add(color);
    }

    const frameColors = FRAME_MANA_COLORS.filter((manaColor) => selectedColors.has(manaColor));

    onChange(
      toDfcFacePatch(card, {
        frameSelection: undefined,
        frameColors: frameColors.length > 0 ? frameColors : undefined,
      }),
    );
  };

  const selectFrameOption = (frameSelection: FrameSelection) => {
    const manaColor = frameSelectionColors[frameSelection];

    if (manaColor) {
      toggleFrameColor(manaColor);
      return;
    }

    setSelection(frameSelection);
  };

  const isFrameOptionSelected = (frameSelection: FrameSelection) => {
    const manaColor = frameSelectionColors[frameSelection];

    if (manaColor) {
      return manualFrameColors.includes(manaColor);
    }

    return manualFrameColors.length === 0 && selection === frameSelection;
  };

  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 8 }}>
        <Text
          selectable
          style={{
            color: "#5f6470",
            fontSize: 12,
            fontWeight: "800",
            textTransform: "uppercase",
          }}
        >
          Frame type
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {compatibleFrameTreatments
            .filter((treatment) => treatment !== "showcase")
            .map((treatment) => (
              <FrameTreatmentPreviewTile
                key={treatment}
                frameIdentity={frameIdentity}
                treatment={treatment}
                selected={frameTreatment === treatment}
                onPress={() => onChange(toDfcFacePatch(card, { frameTreatment: treatment }))}
              />
            ))}
          {compatibleFrameTreatments.includes("showcase")
            ? VISIBLE_SHOWCASE_FRAME_ORDER.map((showcaseFrame) => (
                <ShowcaseFramePreviewTile
                  key={showcaseFrame}
                  showcaseFrame={showcaseFrame}
                  selected={frameTreatment === "showcase" && selectedShowcaseFrame === showcaseFrame}
                  onPress={() =>
                    onChange(toDfcFacePatch(card, { frameTreatment: "showcase", showcaseFrame }))
                  }
                />
              ))
            : null}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text
          selectable
          style={{
            color: "#5f6470",
            fontSize: 12,
            fontWeight: "800",
            textTransform: "uppercase",
          }}
        >
          Default frames
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {manualFrameSelections.map((frameSelection) => {
            const manaColor = frameSelectionColors[frameSelection];
            const selected = isFrameOptionSelected(frameSelection);
            const resolvedFrame = frameSelection;

            return (
              <Pressable
                key={frameSelection}
                accessibilityRole="button"
                accessibilityLabel={
                  manaColor
                    ? `Toggle ${FRAME_COLOR_LABELS[manaColor]} frame color`
                    : `Choose ${FRAME_SELECTION_LABELS[frameSelection]} frame`
                }
                onPress={() => selectFrameOption(frameSelection)}
                style={{
                  minHeight: 54,
                  minWidth: "30%",
                  flexGrow: 1,
                  borderRadius: 9,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: selected ? "#151820" : "#d4d8e0",
                  backgroundColor: selected ? "#151820" : "#ffffff",
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  gap: 6,
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 18,
                    borderRadius: 4,
                    borderCurve: "continuous",
                    borderWidth: 1,
                    borderColor: selected ? "rgba(255,255,255,0.48)" : "#aab0ba",
                    backgroundColor: frameSwatchColor(resolvedFrame),
                  }}
                />
                <Text
                  selectable={false}
                  numberOfLines={2}
                  style={{
                    color: selected ? "#ffffff" : "#1f2530",
                    fontSize: 13,
                    lineHeight: 16,
                    fontWeight: "800",
                  }}
                >
                  {FRAME_SELECTION_LABELS[frameSelection]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function getFrameTreatmentPreviewSource(treatment: FrameTreatment, frameIdentity: ReturnType<typeof inferFrameIdentity>) {
  if (treatment === "standard") {
    return getMseM15MainframeSource(frameIdentity);
  }

  return getMseM15FrameTreatmentSource(treatment, frameIdentity) ?? getMseM15MainframeSource(frameIdentity);
}

function FrameTreatmentPreviewTile({
  frameIdentity,
  treatment,
  selected,
  onPress,
}: {
  frameIdentity: ReturnType<typeof inferFrameIdentity>;
  treatment: FrameTreatment;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Choose ${FRAME_TREATMENT_LABELS[treatment]} frame type`}
      onPress={onPress}
      style={{
        width: 76,
        borderRadius: 8,
        borderCurve: "continuous",
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? "#151820" : "#d8dbe2",
        backgroundColor: selected ? "#151820" : "#ffffff",
        padding: 4,
      }}
    >
      <View
        style={{
          aspectRatio: 375 / 523,
          borderRadius: 5,
          borderCurve: "continuous",
          overflow: "hidden",
          backgroundColor: "#151820",
        }}
      >
        {treatment === "borderless" ? (
          <>
            <View
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                backgroundColor: "#5f7355",
              }}
            />
            <Image
              accessibilityIgnoresInvertColors
              source={BORDERLESS_TREATMENT_PREVIEW_SOURCE}
              resizeMode="stretch"
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
            />
          </>
        ) : (
          <Image
            accessibilityIgnoresInvertColors
            source={getFrameTreatmentPreviewSource(treatment, frameIdentity)}
            resizeMode="stretch"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
          />
        )}
      </View>
      <Text
        selectable={false}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        style={{
          color: selected ? "#ffffff" : "#2a2f38",
          fontSize: 10.5,
          fontWeight: "900",
          lineHeight: 12,
          marginTop: 4,
          minHeight: 24,
          textAlign: "center",
        }}
      >
        {FRAME_TREATMENT_LABELS[treatment]}
      </Text>
    </Pressable>
  );
}

function ShowcaseFramePreviewTile({
  showcaseFrame,
  selected,
  onPress,
}: {
  showcaseFrame: (typeof SHOWCASE_FRAME_ORDER)[number];
  selected: boolean;
  onPress: () => void;
}) {
  const spec = SHOWCASE_FRAMES[showcaseFrame];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Choose ${spec.label} showcase frame`}
      onPress={onPress}
      style={{
        width: 76,
        borderRadius: 8,
        borderCurve: "continuous",
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? "#151820" : "#d8dbe2",
        backgroundColor: selected ? "#151820" : "#ffffff",
        padding: 4,
      }}
    >
      <View
        style={{
          aspectRatio: 375 / 523,
          borderRadius: 5,
          borderCurve: "continuous",
          overflow: "hidden",
          backgroundColor: "#151820",
        }}
      >
        <Image
          accessibilityIgnoresInvertColors
          source={spec.previewSource}
          resizeMode="stretch"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        />
      </View>
      <Text
        selectable={false}
        numberOfLines={3}
        adjustsFontSizeToFit
        minimumFontScale={0.68}
        style={{
          color: selected ? "#ffffff" : "#2a2f38",
          fontSize: 10.5,
          fontWeight: "900",
          lineHeight: 12,
          marginTop: 4,
          minHeight: 36,
          textAlign: "center",
        }}
      >
        {spec.label}
      </Text>
    </Pressable>
  );
}

function TypeLineComposer({
  card,
  onChange,
}: {
  card: CardDraft;
  onChange: (patch: Partial<CardDraft>) => void;
}) {
  const faceCard = getEditableCardFace(card);
  const value = faceCard.typeLine;
  const typeFrame = card.typeFrame ?? "standard";
  const splitFrame = typeFrame === "split" || typeFrame === "fuse" || typeFrame === "aftermath";
  const typeWords = getTypeWords(value);
  const selectedSupertypes = TYPE_LINE_SUPERTYPE_PRESETS.filter((supertype) =>
    typeWords.includes(supertype),
  );
  const selectedCardTypes = CARD_TYPE_PRESETS.filter((type) => typeWords.includes(type));
  const selectedTypeWords = [...selectedSupertypes, ...selectedCardTypes];
  const subtypeText = getSubtypeText(value);
  const updateTypeLine = (typeLine: string) => onChange(getTypeLineChangePatch(card, typeLine));

  const toggleSupertype = (supertype: string) => {
    const nextSupertypes = selectedSupertypes.some((selectedSupertype) => selectedSupertype === supertype)
      ? selectedSupertypes.filter((selectedSupertype) => selectedSupertype !== supertype)
      : [...selectedSupertypes, supertype];

    updateTypeLine(buildCompatibleTypeLine([...nextSupertypes, ...selectedCardTypes], subtypeText));
  };

  const toggleType = (type: string) => {
    const nextCardTypes = selectedCardTypes.some((selectedType) => selectedType === type)
      ? selectedCardTypes.filter((selectedType) => selectedType !== type)
      : [...selectedCardTypes, type];

    updateTypeLine(buildCompatibleTypeLine([...selectedSupertypes, ...nextCardTypes], subtypeText));
  };

  const selectTypeFrame = (nextTypeFrame: TypeFrame) => {
    const adventurePatch =
      nextTypeFrame === "adventure"
        ? {
            adventureName: card.adventureName || "Swift Errand",
            adventureManaCost: card.adventureManaCost || "{1}{G}",
            adventureTypeLine: card.adventureTypeLine || "Sorcery — Adventure",
            adventureRulesText:
              card.adventureRulesText ||
              "Create a 1/1 green Elf creature token.",
          }
        : {};
    const transformPatch =
      nextTypeFrame === "dfc" || nextTypeFrame === "battle"
        ? {
            ...getNextDfcFacePatch({
              ...card,
              typeFrame: nextTypeFrame,
              typeLine: inferTypeLineForTypeFrame(nextTypeFrame, card.typeLine),
              dfcFace: "front",
            }),
            dfcFace: "front" as const,
            ...(nextTypeFrame === "battle"
              ? {
                  defense: card.defense || "3",
                  power: "",
                  toughness: "",
                  rulesText:
                    card.rulesText.trim().length > 0
                      ? card.rulesText
                      : `${DEFAULT_BATTLE_SIEGE_REMINDER}\nWhen this battle enters the battlefield, `,
                }
              : {}),
          }
        : {};
    const tokenPatch =
      nextTypeFrame === "token"
        ? {
            manaCost: "",
            power: card.power || "1",
            toughness: card.toughness || "1",
          }
        : {};
    const planeswalkerPatch =
      nextTypeFrame === "planeswalker"
        ? {
            startingLoyalty: card.startingLoyalty || "4",
            loyaltyAbilities:
              card.loyaltyAbilities && card.loyaltyAbilities.length > 0
                ? card.loyaltyAbilities
                : createDefaultLoyaltyAbilities(),
            power: "",
            toughness: "",
          }
        : {};
    const splitPatch =
      nextTypeFrame === "split" || nextTypeFrame === "fuse" || nextTypeFrame === "aftermath"
        ? getDefaultSplitPatch(nextTypeFrame, card)
        : {};

    onChange({
      typeFrame: nextTypeFrame === "standard" ? undefined : nextTypeFrame,
      typeLine: inferTypeLineForTypeFrame(nextTypeFrame, card.typeLine),
      ...adventurePatch,
      ...transformPatch,
      ...tokenPatch,
      ...planeswalkerPatch,
      ...splitPatch,
    });
  };

  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 8 }}>
        <Text
          selectable
          style={{
            color: "#5f6470",
            fontSize: 12,
            fontWeight: "800",
            textTransform: "uppercase",
          }}
        >
          Card type frame
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingRight: 6 }}
        >
          {VISIBLE_TYPE_FRAMES.map((option) => {
            const selected = typeFrame === option;
            const spec = TYPE_FRAME_SPECS[option];

            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityLabel={`Choose ${TYPE_FRAME_LABELS[option]} type frame`}
                onPress={() => selectTypeFrame(option)}
                style={{
                  width: spec.orientation === "landscape" ? 146 : 112,
                  borderRadius: 8,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: selected ? "#151820" : "#d4d8e0",
                  backgroundColor: selected ? "#151820" : "#ffffff",
                  padding: 7,
                  gap: 7,
                }}
              >
                <TypeFrameThumbnail typeFrame={option} />
                <Text
                  selectable={false}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                  style={{
                    color: selected ? "#ffffff" : "#1f2530",
                    fontSize: 12,
                    lineHeight: 14,
                    fontWeight: "900",
                  }}
                >
                  {TYPE_FRAME_LABELS[option]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {typeFrame === "dfc" ? (
        <DfcModeToggle
          value={getDfcMode(card)}
          onChange={(dfcMode) =>
            onChange({
              dfcMode,
              ...getDefaultDfcBackPatch({ ...card, typeFrame: "dfc", dfcMode }),
            })
          }
        />
      ) : null}

      {!splitFrame ? (
        <View style={{ gap: 10 }}>
          <Text
            selectable
            style={{
              color: "#5f6470",
              fontSize: 12,
              fontWeight: "800",
              textTransform: "uppercase",
            }}
          >
            Auto type
          </Text>
          <AutoTypePresetGroup
            label="Supertypes"
            values={TYPE_LINE_SUPERTYPE_PRESETS}
            selectedValues={selectedSupertypes}
            onToggle={toggleSupertype}
          />
          <AutoTypePresetGroup
            label="Card types"
            values={CARD_TYPE_PRESETS}
            selectedValues={selectedCardTypes}
            onToggle={toggleType}
          />
        </View>
      ) : null}

      {!splitFrame ? (
        <>
          <EditorField
            label="Subtypes"
            value={subtypeText}
            onChangeText={(subtypes) => updateTypeLine(buildTypeLine(selectedTypeWords, subtypes))}
            autoCapitalize="words"
          />
          <TypeLineAutocompleteField
            label="Manual type line"
            value={value}
            onChangeText={updateTypeLine}
            onBlur={() => updateTypeLine(normalizeCompatibleTypeLine(value))}
          />
        </>
      ) : null}
    </View>
  );
}

function TypeLineAutocompleteField({
  label,
  value,
  onChangeText,
  onBlur,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const [cursorIndex, setCursorIndex] = useState(value.length);
  const suggestions = focused ? getTypeLineAutocompleteSuggestions(value, cursorIndex) : [];
  const updateCursorIndex = (event: unknown) => {
    const selectionStart = getTextInputSelectionStart(event);

    if (selectionStart !== null) {
      setCursorIndex(selectionStart);
    }
  };

  return (
    <View
      style={{
        gap: 6,
        position: "relative",
        zIndex: suggestions.length > 0 ? 100 : 1,
        elevation: suggestions.length > 0 ? 100 : 0,
      }}
    >
      <Text
        selectable
        style={{
          color: "#5f6470",
          fontSize: 12,
          fontWeight: "800",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <View style={{ position: "relative", zIndex: suggestions.length > 0 ? 100 : undefined }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="words"
          onChange={updateCursorIndex}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            onBlur?.();
            setTimeout(() => setFocused(false), 120);
          }}
          onSelectionChange={updateCursorIndex}
          numberOfLines={1}
          style={{
            minHeight: 44,
            borderRadius: 8,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: "#d8dbe2",
            backgroundColor: "#ffffff",
            color: "#151820",
            fontSize: 16,
            overflow: "visible",
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        />
        {suggestions.length > 0 ? (
          <TypeLineAutocompleteMenu
            suggestions={suggestions}
            onSelect={(suggestion) => {
              onChangeText(suggestion.replacement);
              setFocused(false);
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

function AutoTypePresetGroup({
  label,
  values,
  selectedValues,
  onToggle,
}: {
  label: string;
  values: readonly string[];
  selectedValues: readonly string[];
  onToggle: (value: string) => void;
}) {
  return (
    <View style={{ gap: 7 }}>
      <Text
        selectable
        style={{
          color: "#7a818d",
          fontSize: 11,
          fontWeight: "900",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {values.map((value) => {
          const selected = selectedValues.includes(value);

          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Toggle ${label.toLowerCase()} ${value}`}
              onPress={() => onToggle(value)}
              style={{
                minHeight: 40,
                borderRadius: 8,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: selected ? "#151820" : "#d4d8e0",
                backgroundColor: selected ? "#151820" : "#ffffff",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 12,
              }}
            >
              <Text
                selectable={false}
                style={{
                  color: selected ? "#ffffff" : "#1f2530",
                  fontWeight: "800",
                }}
              >
                {value}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TypeLineAutocompleteMenu({
  suggestions,
  onSelect,
}: {
  suggestions: TypeLineAutocompleteSuggestion[];
  onSelect: (suggestion: TypeLineAutocompleteSuggestion) => void;
}) {
  return (
    <View
      style={{
        position: "absolute",
        top: 48,
        left: 0,
        right: 0,
        borderRadius: 10,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: "#d8dbe2",
        backgroundColor: "#ffffff",
        boxShadow: "0 12px 26px rgba(0, 0, 0, 0.18)",
        overflow: "hidden",
        elevation: 100,
        zIndex: 120,
      }}
    >
      {suggestions.map((suggestion) => (
        <Pressable
          key={`${suggestion.category}-${suggestion.value}`}
          accessibilityRole="button"
          accessibilityLabel={`Autocomplete ${suggestion.value}`}
          onPressIn={() => onSelect(suggestion)}
          onPress={() => onSelect(suggestion)}
          style={{
            minHeight: 40,
            alignItems: "center",
            flexDirection: "row",
            gap: 10,
            paddingHorizontal: 12,
          }}
        >
          <Text
            selectable={false}
            numberOfLines={1}
            style={{
              flex: 1,
              color: "#151820",
              fontSize: 15,
              fontWeight: "900",
            }}
          >
            {suggestion.value}
          </Text>
          <Text
            selectable={false}
            numberOfLines={1}
            style={{
              color: "#6b7280",
              fontSize: 11,
              fontWeight: "900",
              textTransform: "uppercase",
            }}
          >
            {getTypeLineAutocompleteCategoryLabel(suggestion)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function getTypeLineAutocompleteCategoryLabel(
  suggestion: TypeLineAutocompleteSuggestion,
): string {
  switch (suggestion.category) {
    case "supertype":
      return "Supertype";
    case "cardType":
      return "Type";
    case "subtype":
    default:
      return suggestion.detail ?? "Subtype";
  }
}

function TypeFrameThumbnail({ typeFrame }: { typeFrame: TypeFrame }) {
  const spec = TYPE_FRAME_SPECS[typeFrame];

  return (
    <View
      style={{
        width: "100%",
        height: 132,
        borderRadius: 6,
        borderCurve: "continuous",
        backgroundColor: "#111111",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: spec.orientation === "landscape" ? "100%" : undefined,
          height: spec.orientation === "portrait" ? "100%" : undefined,
          aspectRatio: spec.aspectRatio,
          borderRadius: 5,
          borderCurve: "continuous",
          overflow: "hidden",
        }}
      >
        <Image
          accessibilityIgnoresInvertColors
          source={spec.source}
          resizeMode="contain"
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </View>
    </View>
  );
}

function DfcModeToggle({
  value,
  onChange,
}: {
  value: DfcMode;
  onChange: (mode: DfcMode) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text
        selectable
        style={{
          color: "#5f6470",
          fontSize: 12,
          fontWeight: "800",
          textTransform: "uppercase",
        }}
      >
        DFC mode
      </Text>
      <View
        style={{
          minHeight: 42,
          borderRadius: 10,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: "#d4d8e0",
          backgroundColor: "#ffffff",
          flexDirection: "row",
          padding: 4,
          gap: 4,
        }}
      >
        {DFC_MODES.map((mode) => {
          const selected = value === mode;

          return (
            <Pressable
              key={mode}
              accessibilityRole="button"
              accessibilityLabel={`Use ${DFC_MODE_LABELS[mode]} double-faced mode`}
              onPress={() => onChange(mode)}
              style={{
                flex: 1,
                minHeight: 34,
                borderRadius: 7,
                borderCurve: "continuous",
                backgroundColor: selected ? "#151820" : "transparent",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 8,
              }}
            >
              <Text
                selectable={false}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                style={{
                  color: selected ? "#ffffff" : "#1f2530",
                  fontSize: 13,
                  fontWeight: "900",
                }}
              >
                {DFC_MODE_LABELS[mode]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function frameSwatchColor(frame: Exclude<FrameSelection, "auto">): string {
  const colors: Record<Exclude<FrameSelection, "auto">, string> = {
    white: "#efe4bb",
    blue: "#8fc2d9",
    black: "#5a5451",
    red: "#c15d38",
    green: "#7da05a",
    gold: "#caa653",
    artifact: "#a7aaa4",
    land: "#9d7d45",
    colorless: "#b9b2a5",
  };

  return colors[frame];
}

function manaFrameSwatchColor(color: ManaColor): string {
  const frames: Record<ManaColor, Exclude<FrameSelection, "auto">> = {
    W: "white",
    U: "blue",
    B: "black",
    R: "red",
    G: "green",
  };

  return frameSwatchColor(frames[color]);
}

function getTypeWords(typeLine: string): string[] {
  const [types] = typeLine.split(/\s+[—–-]\s+/);

  return types.split(/\s+/).filter(Boolean);
}

function getSubtypeText(typeLine: string): string {
  const [, subtypes = ""] = typeLine.split(/\s+[—–-]\s+/);

  return subtypes.trim();
}

function buildTypeLine(types: string[], subtypes: string): string {
  const typeText = types.join(" ").trim();
  const subtypeText = subtypes.trim();

  if (!typeText) {
    return subtypeText;
  }

  if (!subtypeText) {
    return typeText;
  }

  return `${typeText} — ${subtypeText}`;
}

function buildCompatibleTypeLine(types: string[], subtypes: string): string {
  return buildTypeLine(types, filterCompatibleSubtypeText(types, subtypes));
}

function normalizeCompatibleTypeLine(typeLine: string): string {
  return buildCompatibleTypeLine(getTypeWords(typeLine), getSubtypeText(typeLine));
}

function getTextInputSelectionStart(event: unknown): number | null {
  const nativeSelectionStart = (
    event as {
      nativeEvent?: { selection?: { start?: unknown } };
    }
  ).nativeEvent?.selection?.start;

  if (typeof nativeSelectionStart === "number") {
    return nativeSelectionStart;
  }

  const targetSelectionStart = (
    event as {
      target?: { selectionStart?: unknown };
      currentTarget?: { selectionStart?: unknown };
    }
  ).target?.selectionStart;

  if (typeof targetSelectionStart === "number") {
    return targetSelectionStart;
  }

  const currentTargetSelectionStart = (
    event as {
      currentTarget?: { selectionStart?: unknown };
    }
  ).currentTarget?.selectionStart;

  return typeof currentTargetSelectionStart === "number" ? currentTargetSelectionStart : null;
}

function inferTypeLineForTypeFrame(typeFrame: TypeFrame, currentTypeLine: string): string {
  const subtypeText = getSubtypeText(currentTypeLine);

  switch (typeFrame) {
    case "saga":
      return "Enchantment — Saga";
    case "token":
      return "Token Creature — Soldier";
    case "planeswalker":
      return buildTypeLine(
        ["Legendary", "Planeswalker"],
        getTypeWords(currentTypeLine).includes("Planeswalker") && subtypeText
          ? subtypeText
          : "Maren",
      );
    case "battle":
      return "Battle — Siege";
    case "dfc":
      return currentTypeLine.trim() || "Creature";
    case "adventure":
      return currentTypeLine.trim() || "Creature — Adventurer";
    case "split":
      return currentTypeLine.includes("//") ? currentTypeLine : "Instant // Instant";
    case "fuse":
      return currentTypeLine.includes("//") ? currentTypeLine : "Instant // Instant";
    case "aftermath":
      return currentTypeLine.includes("//") ? currentTypeLine : "Sorcery // Sorcery";
    case "standard":
    default:
      return currentTypeLine;
  }
}
