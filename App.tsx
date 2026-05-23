import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BookOpen, Download, Layers, ListPlus, Minus, Palette, Pencil, Plus, RefreshCw, RotateCcw, RotateCw, Save, Share2, Shuffle, SlidersHorizontal, Tags, Trash2, Upload, X } from "lucide-react-native";
import { type ReactNode, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  type GestureResponderEvent,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  type LayoutChangeEvent,
  Modal,
  NativeModules,
  Platform,
  type PointerEvent,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { CardBackPicker } from "@/components/card-back-picker";
import { CardBackPreview } from "@/components/card-back-preview";
import { CardTransformSurface } from "@/components/card-transform-surface";
import {
  CardPreview,
  getVisibleArtAspectRatioForCard,
  getVisibleArtRectForCard,
} from "@/components/card-preview";
import { EditorField } from "@/components/editor-field";
import { HybridSymbolStyleProvider } from "@/components/hybrid-symbol-style-context";
import { KeywordLibraryPanel, SectionEditorModal } from "@/components/section-editor-modal";
import { DEFAULT_CARD_BACK_ID, getCardBackOption } from "@/data/card-backs";
import { FULL_MAGIC_PACK, getTypeFrameSpec } from "@/data/full-magic-pack";
import {
  getMseM15FrameTreatmentSource,
  getMseM15MainframeSource,
} from "@/data/mse-frame-renderer";
import { DEFAULT_SHOWCASE_FRAME, SHOWCASE_FRAME_LABELS, SHOWCASE_FRAME_ORDER, SHOWCASE_FRAMES } from "@/data/showcase-frames";
import { INITIAL_CARD } from "@/data/sample-card";
import {
  buildArtGeneratorPrompt,
  buildRulesTextFixerPrompt,
  getDefaultArtGeneratorRequest,
} from "@/lib/ai-prompts";
import {
  FRAME_SELECTION_LABELS,
  FRAME_TREATMENT_LABELS,
  getFrameColors,
  inferFrameIdentity,
  inferFrameStyle,
  normalizeManaInput,
} from "@/lib/card-style";
import {
  getDefaultDfcBackPatch,
  getNextDfcFacePatch,
  getEditableCardFace,
  isDfcBackFace,
  isTransformingTypeFrame,
  toDfcFacePatch,
} from "@/lib/dfc";
import { createRandomCard } from "@/lib/random-card";
import { getModernCollectorLine } from "@/lib/printing";
import { getSplitHalf, getSplitLayout, isSplitTypeFrame, toSplitHalfCard } from "@/lib/split-card";
import {
  ArtTransform,
  CardBackId,
  CardDraft,
  CardSection,
  FrameCustomization,
  FrameIdentity,
  FrameSelection,
  FrameTreatment,
  KeywordDefinition,
  ManaColor,
  ShowcaseFrameId,
  SplitCardLayout,
  TypeFrame,
} from "@/types/card";

const BORDERLESS_TREATMENT_PREVIEW_SOURCE = require("./assets/card-assets/basic-m15/mse-renderer/treatments/borderless/mask-frame.png");
const PACKAGE_METADATA = require("./package.json") as { version: string };
const CARDMAGIC_APP_VERSION = PACKAGE_METADATA.version;

type InspectorTab = "edit" | "keywords" | "sets";
type VisibleInspectorTab = Exclude<InspectorTab, "keywords">;

type NewCardPrimaryAction = "saveAsk" | "saveThenStart" | "startBlank" | "randomize" | "reset";

type SetCardSnapshot = {
  id: string;
  savedAt: string;
  card: CardDraft;
};

type CardSet = {
  id: string;
  name: string;
  cardBackId?: CardBackId;
  cards: SetCardSnapshot[];
};

type ArtLibrarySource = "generated" | "added";

type ArtLibraryEntry = {
  id: string;
  uri: string;
  source: ArtLibrarySource;
  colorIdentity: string;
  label: string;
  createdAt: string;
};

type FrameTemplateData = {
  typeFrame?: TypeFrame;
  dfcMode?: CardDraft["dfcMode"];
  splitLayout?: SplitCardLayout;
  frameSelection?: FrameSelection;
  frameColors?: ManaColor[];
  backFrameSelection?: FrameSelection;
  backFrameColors?: ManaColor[];
  frameTreatment?: FrameTreatment;
  showcaseFrame?: ShowcaseFrameId;
  frameCustomization?: FrameCustomization;
};

function useMobileWebInputZoomGuard() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      return;
    }

    const existingViewport = document.querySelector('meta[name="viewport"]');
    const viewportMeta = existingViewport ?? document.createElement("meta");
    const previousContent = viewportMeta.getAttribute("content");
    const createdViewportMeta = existingViewport === null;

    if (createdViewportMeta) {
      viewportMeta.setAttribute("name", "viewport");
      document.head.appendChild(viewportMeta);
    }

    viewportMeta.setAttribute(
      "content",
      "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no",
    );

    return () => {
      if (createdViewportMeta) {
        viewportMeta.remove();
        return;
      }

      if (previousContent !== null) {
        viewportMeta.setAttribute("content", previousContent);
      }
    };
  }, []);
}

type CardFrameTemplate = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  data: FrameTemplateData;
};

type CardMagicExport =
  | {
      schemaVersion: 1;
      kind: "card";
      exportedAt: string;
      card: CardDraft;
    }
  | {
      schemaVersion: 1;
      kind: "set";
      exportedAt: string;
      set: CardSet;
    }
  | {
      schemaVersion: 1;
      kind: "frame-template";
      exportedAt: string;
      template: CardFrameTemplate;
    }
  | {
      schemaVersion: 1;
      kind: "frame-templates";
      exportedAt: string;
      templates: CardFrameTemplate[];
    };

type CardMagicStorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

type CoordinateBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type PreviewTypeFrame = NonNullable<CardDraft["typeFrame"]> | "standard";

type BatchExportProgress = {
  phase: "rendering" | "packaging";
  current: number;
  total: number;
  label: string;
};

type FlatCardExportTarget =
  | {
      kind: "card";
      card: CardDraft;
    }
  | {
      kind: "back";
      cardBackId: CardBackId;
    };

type WebPhotoExport = {
  fileName: string;
  dataUri: string;
};

type WebFileSystemWritableFileStream = {
  write: (data: Blob) => Promise<void>;
  close: () => Promise<void>;
};

type WebFileSystemFileHandle = {
  createWritable: () => Promise<WebFileSystemWritableFileStream>;
};

type WebSaveFilePickerAccept = {
  description: string;
  accept: Record<string, string[]>;
};

type WebSaveFilePickerOptions = {
  suggestedName?: string;
  types?: WebSaveFilePickerAccept[];
};

type WindowWithSaveFilePicker = Window & {
  showSaveFilePicker?: (options?: WebSaveFilePickerOptions) => Promise<WebFileSystemFileHandle>;
};

type FrameMenuOption =
  | {
      kind: "treatment";
      treatment: FrameTreatment;
    }
  | {
      kind: "showcase";
      showcaseFrame: ShowcaseFrameId;
    };

const CARD_ART_MAX_DIMENSION = 1280;
const AUXILIARY_IMAGE_MAX_DIMENSION = 512;
const CARD_SET_STORAGE_KEY = "cardmagic.savedSets.v1";
const ACTIVE_CARD_STORAGE_KEY = "cardmagic.activeCard.v1";
const FRAME_TEMPLATE_STORAGE_KEY = "cardmagic.frameTemplates.v1";
const ART_LIBRARY_STORAGE_KEY = "cardmagic.artLibrary.v1";
const OPENAI_API_KEY_STORAGE_KEY = "cardmagic.openAiApiKey.v1";
const OPENAI_IMAGE_GENERATION_URL = "https://api.openai.com/v1/images/generations";
const OPENAI_IMAGE_MODELS = ["gpt-image-2", "gpt-image-1"] as const;
const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_RULES_TEXT_MODELS = ["gpt-4.1-nano", "gpt-4o-mini"] as const;
const PREVIEW_ACTION_BUTTON_SIZE = 44;
const PREVIEW_ACTION_BUTTON_GAP = 10;
const PREVIEW_ACTION_ROW_HEIGHT = 48;
const EDIT_TAB_VERTICAL_CHROME_HEIGHT = 98;
const BOTTOM_TAB_BAR_HEIGHT = 68;
const DEFAULT_ART_TRANSFORM: ArtTransform = { offsetX: 0, offsetY: 0, scale: 1 };
const CARD_BACK_PREVIEW_ASPECT_RATIO = 375 / 523;
const ART_ADJUSTMENT_CROP_RADIUS = 6;
const ART_LIBRARY_MAX_ENTRIES = 96;
const ART_LIBRARY_VISIBLE_THUMBNAIL_LIMIT = 32;
const SET_GRID_INITIAL_CARD_LIMIT = 12;
const SET_GRID_PAGE_SIZE = 12;
const SET_CARD_THUMBNAIL_RADIUS = 5;
const COLOR_IDENTITY_SORT_ORDER: ManaColor[] = ["W", "U", "B", "R", "G"];

type PickedImageAsset = Pick<ImagePicker.ImagePickerAsset, "uri" | "width" | "height">;

type StoredActiveCardDraft = {
  schemaVersion: 1;
  card: CardDraft;
};

type OpenAiImageGenerationResponse = {
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
  error?: {
    message?: string;
  };
};

type OpenAiChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

function hasNativeModule(...moduleNames: string[]) {
  return moduleNames.some((moduleName) => Boolean(NativeModules[moduleName]));
}

function hasAllNativeModules(...moduleNames: string[]) {
  return moduleNames.every((moduleName) => Boolean(NativeModules[moduleName]));
}

function getImageDataUriParts(uri: string): { extension: string; base64: string } | null {
  const match = uri.match(/^data:image\/([a-z0-9.+-]+);base64,(.+)$/i);

  if (!match) {
    return null;
  }

  const rawExtension = match[1].toLowerCase();

  return {
    extension: rawExtension === "jpeg" ? "jpg" : rawExtension,
    base64: match[2],
  };
}

function getImageManipulatorMimeType(format: ImageManipulator.SaveFormat) {
  return String(format).toLowerCase().includes("png") ? "image/png" : "image/jpeg";
}

function getImageManipulatorExtension(format: ImageManipulator.SaveFormat) {
  return String(format).toLowerCase().includes("png") ? "png" : "jpg";
}

function readBlobAsDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Image blob could not be converted to a data URI."));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Image blob could not be read."));
    };
    reader.readAsDataURL(blob);
  });
}

async function readWebImageUriAsDataUri(uri: string, fallbackMimeType: string) {
  if (uri.startsWith("data:")) {
    return uri;
  }

  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error(`Image fetch failed with ${response.status}.`);
  }

  const blob = await response.blob();
  const typedBlob = blob.type ? blob : blob.slice(0, blob.size, fallbackMimeType);

  return readBlobAsDataUri(typedBlob);
}

async function materializeBase64ImageUri(base64: string, extension: string, prefix: string) {
  if (Platform.OS === "web" || !hasNativeModule("ExpoFileSystem")) {
    return `data:image/${extension === "jpg" ? "jpeg" : extension};base64,${base64}`;
  }

  try {
    const FileSystem = await import("expo-file-system");
    const safePrefix = prefix.replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "") || "cardmagic-image";
    const safeExtension = extension.replace(/[^a-z0-9]+/gi, "").toLowerCase() || "png";
    const file = new FileSystem.File(
      FileSystem.Paths.document,
      `${safePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExtension}`,
    );

    file.create({ overwrite: true, intermediates: true });
    file.write(base64, { encoding: "base64" });

    return file.uri;
  } catch (error) {
    console.warn("Unable to materialize generated image; keeping data URI fallback.", error);
    return `data:image/${extension === "jpg" ? "jpeg" : extension};base64,${base64}`;
  }
}

async function materializeImageDataUri(uri: string, prefix: string) {
  const dataUriParts = getImageDataUriParts(uri);

  if (!dataUriParts) {
    return uri;
  }

  return materializeBase64ImageUri(dataUriParts.base64, dataUriParts.extension, prefix);
}

async function materializeCardDraftImageDataUris(card: CardDraft, prefix: string): Promise<CardDraft> {
  const imageKeys = ["artUri", "backArtUri", "setSymbolUri", "watermarkUri"] as const;
  let nextCard = card;

  for (const key of imageKeys) {
    const uri = nextCard[key];

    if (!uri) {
      continue;
    }

    const materializedUri = await materializeImageDataUri(uri, `${prefix}-${key}`);

    if (materializedUri !== uri) {
      nextCard = {
        ...nextCard,
        [key]: materializedUri,
      };
    }
  }

  return nextCard;
}

async function materializeCardSetImageDataUris(set: CardSet): Promise<CardSet> {
  let changed = false;
  const cards: SetCardSnapshot[] = [];

  for (const snapshot of set.cards) {
    const card = await materializeCardDraftImageDataUris(snapshot.card, `set-${set.id}-${snapshot.id}`);

    if (card !== snapshot.card) {
      changed = true;
      cards.push({ ...snapshot, card });
    } else {
      cards.push(snapshot);
    }
  }

  return changed ? { ...set, cards } : set;
}

async function materializeCardSetsImageDataUris(sets: CardSet[]): Promise<CardSet[]> {
  const materializedSets: CardSet[] = [];

  for (const set of sets) {
    materializedSets.push(await materializeCardSetImageDataUris(set));
  }

  return materializedSets;
}

async function materializeArtLibraryImageDataUris(entries: ArtLibraryEntry[]): Promise<ArtLibraryEntry[]> {
  const materializedEntries: ArtLibraryEntry[] = [];

  for (const entry of entries) {
    const uri = await materializeImageDataUri(entry.uri, `art-library-${entry.id}`);

    materializedEntries.push(uri === entry.uri ? entry : { ...entry, uri });
  }

  return materializedEntries;
}

function getConstrainedImageSize(asset: PickedImageAsset, maxDimension: number) {
  const width = asset.width || 0;
  const height = asset.height || 0;
  const largestDimension = Math.max(width, height);

  if (largestDimension <= 0 || largestDimension <= maxDimension) {
    return null;
  }

  const scale = maxDimension / largestDimension;

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function normalizePickedImage(
  asset: PickedImageAsset,
  {
    maxDimension,
    compress,
    format,
  }: {
    maxDimension: number;
    compress: number;
    format: ImageManipulator.SaveFormat;
  },
) {
  const resize = getConstrainedImageSize(asset, maxDimension);
  const mimeType = getImageManipulatorMimeType(format);
  const extension = getImageManipulatorExtension(format);

  const actions = resize ? [{ resize }] : [];

  try {
    const result = await ImageManipulator.manipulateAsync(
      asset.uri,
      actions,
      { compress, format, base64: true },
    );

    if (result.base64) {
      return await materializeBase64ImageUri(result.base64, extension, "picked-image");
    }

    if (Platform.OS === "web") {
      return readWebImageUriAsDataUri(result.uri, mimeType);
    }

    return result.uri;
  } catch (error) {
    console.warn("Unable to normalize picked image; using persistent fallback when possible.", error);

    if (Platform.OS === "web") {
      try {
        return await readWebImageUriAsDataUri(asset.uri, mimeType);
      } catch (fallbackError) {
        console.warn("Unable to persist picked web image URI; using original asset.", fallbackError);
      }
    }

    return asset.uri;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeArtTransformForVisibleRect(
  transform: ArtTransform,
  artBounds: { width: number; height: number },
  imageAspectRatio?: number | null,
): ArtTransform {
  const nextScale = clamp(transform.scale, 1, 3);
  const viewportAspectRatio = artBounds.width / artBounds.height;
  const coverWidth =
    imageAspectRatio && imageAspectRatio > viewportAspectRatio
      ? artBounds.height * imageAspectRatio
      : artBounds.width;
  const coverHeight =
    imageAspectRatio && imageAspectRatio < viewportAspectRatio
      ? artBounds.width / imageAspectRatio
      : artBounds.height;
  const maxOffsetX = Math.max(0, (coverWidth * nextScale - artBounds.width) / 2);
  const maxOffsetY = Math.max(0, (coverHeight * nextScale - artBounds.height) / 2);

  return {
    scale: nextScale,
    offsetX: clamp(transform.offsetX, -maxOffsetX, maxOffsetX),
    offsetY: clamp(transform.offsetY, -maxOffsetY, maxOffsetY),
  };
}

function getCoverFittedImageLayout(
  viewportWidth: number,
  viewportHeight: number,
  imageAspectRatio?: number | null,
) {
  if (!imageAspectRatio) {
    return {
      width: viewportWidth,
      height: viewportHeight,
      left: 0,
      top: 0,
      resizeMode: "cover" as const,
    };
  }

  const viewportAspectRatio = viewportWidth / viewportHeight;
  const coverWidth =
    imageAspectRatio > viewportAspectRatio ? viewportHeight * imageAspectRatio : viewportWidth;
  const coverHeight =
    imageAspectRatio < viewportAspectRatio ? viewportWidth / imageAspectRatio : viewportHeight;

  return {
    width: coverWidth,
    height: coverHeight,
    left: (viewportWidth - coverWidth) / 2,
    top: (viewportHeight - coverHeight) / 2,
    resizeMode: "stretch" as const,
  };
}

function getArtPickerAspect(card: CardDraft): [number, number] {
  const aspectRatio = getVisibleArtAspectRatioForCard(card);
  const denominator = 1000;

  return [Math.max(1, Math.round(aspectRatio * denominator)), denominator];
}

function getPreviewTypeFrame(card: CardDraft): PreviewTypeFrame {
  return isDfcBackFace(card) && (card.typeFrame === "battle" || card.typeFrame === "dfc")
    ? "standard"
    : card.typeFrame ?? "standard";
}

function getActiveFrameTreatment(card: CardDraft): FrameTreatment {
  return isDfcBackFace(card)
    ? card.backFrameTreatment ?? "standard"
    : card.frameTreatment ?? "standard";
}

function getActiveShowcaseFrame(card: CardDraft): ShowcaseFrameId {
  return isDfcBackFace(card)
    ? card.backShowcaseFrame ?? DEFAULT_SHOWCASE_FRAME
    : card.showcaseFrame ?? DEFAULT_SHOWCASE_FRAME;
}

function getFaceUpPreviewRotationDegrees(typeFrame: PreviewTypeFrame): number {
  if (typeFrame === "split" || typeFrame === "fuse") {
    return -90;
  }

  if (typeFrame === "battle" || typeFrame === "aftermath") {
    return 90;
  }

  return 0;
}

function hasPreviewRotation(typeFrame: PreviewTypeFrame): boolean {
  return getFaceUpPreviewRotationDegrees(typeFrame) !== 0;
}

function getCompatibleFrameTreatments(typeFrame: PreviewTypeFrame): FrameTreatment[] {
  return typeFrame === "standard"
    ? ["standard", "borderless", "showcase", "textless", "retro", "etchedFoil"]
    : ["standard"];
}

function getFrameTreatmentPreviewSource(treatment: FrameTreatment, frameIdentity: FrameIdentity) {
  if (treatment === "standard") {
    return getMseM15MainframeSource(frameIdentity);
  }

  return getMseM15FrameTreatmentSource(treatment, frameIdentity) ?? getMseM15MainframeSource(frameIdentity);
}

function getNewCardActionLabel(action: NewCardPrimaryAction) {
  switch (action) {
    case "saveAsk":
      return "Save, then ask";
    case "saveThenStart":
      return "Save, then start new";
    case "startBlank":
      return "Start new without saving";
    case "randomize":
      return "Randomize";
    case "reset":
      return "Reset";
  }
}

function getNewCardActionIcon(action: NewCardPrimaryAction, color: string, size: number) {
  const strokeWidth = size >= 22 ? 2.8 : 2.4;

  switch (action) {
    case "saveAsk":
      return <Plus size={size} color={color} strokeWidth={strokeWidth} />;
    case "saveThenStart":
      return <Save size={size} color={color} strokeWidth={strokeWidth} />;
    case "startBlank":
      return <Plus size={size} color={color} strokeWidth={strokeWidth} />;
    case "randomize":
      return <Shuffle size={size} color={color} strokeWidth={strokeWidth} />;
    case "reset":
      return <RotateCcw size={size} color={color} strokeWidth={strokeWidth} />;
  }
}

function createDefaultCardSets(): CardSet[] {
  return [{ id: "main-set", name: "Main Set", cardBackId: DEFAULT_CARD_BACK_ID, cards: [] }];
}

function cloneCardDraft(card: CardDraft): CardDraft {
  return JSON.parse(JSON.stringify(card)) as CardDraft;
}

function createSetCardSnapshot(card: CardDraft): SetCardSnapshot {
  return {
    id: `card-${Date.now()}`,
    savedAt: new Date().toISOString(),
    card: cloneCardDraft(card),
  };
}

function saveCardDraftIntoSet(
  sets: CardSet[],
  selectedSetId: string,
  card: CardDraft,
  activeSetCardId: string | null,
) {
  const selectedSet = sets.find((set) => set.id === selectedSetId) ?? sets[0];

  if (!selectedSet) {
    return null;
  }

  const timestamp = new Date().toISOString();
  const snapshot = createSetCardSnapshot(card);
  let savedSnapshot = snapshot;

  const nextSets = normalizeCardSets(
    sets.map((set) => {
      if (set.id !== selectedSet.id) {
        return set;
      }

      const updatesActiveSnapshot =
        activeSetCardId !== null && set.cards.some((setCard) => setCard.id === activeSetCardId);
      const savedSnapshotId = updatesActiveSnapshot ? activeSetCardId : snapshot.id;
      const nextCards = updatesActiveSnapshot
        ? set.cards.map((setCard) =>
            setCard.id === activeSetCardId
              ? { ...setCard, card: cloneCardDraft(card), savedAt: timestamp }
              : setCard,
          )
        : [...set.cards, snapshot];
      const nextSet = normalizeCardSet({ ...set, cards: nextCards });

      savedSnapshot = nextSet.cards.find((setCard) => setCard.id === savedSnapshotId) ?? snapshot;
      return nextSet;
    }),
  );

  return {
    sets: nextSets,
    setId: selectedSet.id,
    setName: selectedSet.name,
    snapshot: savedSnapshot,
  };
}

const SET_NUMBER_COLOR_ORDER: ManaColor[] = ["W", "U", "B", "R", "G"];
const BASIC_LAND_ORDER = ["Plains", "Island", "Swamp", "Mountain", "Forest", "Wastes"];
const TYPE_LINE_DIVIDER_PATTERN = /\s+[—–-]\s+/;

function getCollectorNumberWidth(cardCount: number) {
  return Math.max(3, String(Math.max(1, cardCount)).length);
}

function formatSetCollectorNumber(index: number, cardCount: number) {
  return String(index + 1).padStart(getCollectorNumberWidth(cardCount), "0");
}

function formatSetSize(cardCount: number) {
  return String(Math.max(1, cardCount)).padStart(getCollectorNumberWidth(cardCount), "0");
}

function getSetNumberedPreviewCard(
  card: CardDraft,
  setCards: SetCardSnapshot[] = [],
  activeSetCardId: string | null = null,
): CardDraft {
  if (activeSetCardId && setCards.some((snapshot) => snapshot.id === activeSetCardId)) {
    const numberedCards = normalizeSetCardOrder(
      setCards.map((snapshot) =>
        snapshot.id === activeSetCardId
          ? { ...snapshot, card: cloneCardDraft(card) }
          : snapshot,
      ),
    );

    return cloneCardDraft(
      numberedCards.find((snapshot) => snapshot.id === activeSetCardId)?.card ?? card,
    );
  }

  const previewSnapshot: SetCardSnapshot = {
    id: "preview-card",
    savedAt: new Date(0).toISOString(),
    card: cloneCardDraft(card),
  };
  const numberedCards = normalizeSetCardOrder([...setCards, previewSnapshot]);

  return cloneCardDraft(
    numberedCards.find((snapshot) => snapshot.id === previewSnapshot.id)?.card ?? {
      ...card,
      collectorNumber: "001",
      setSize: "001",
    },
  );
}

function normalizeCardSets(sets: CardSet[]): CardSet[] {
  return sets.map(normalizeCardSet);
}

function normalizeCardSet(set: CardSet): CardSet {
  return {
    ...set,
    cardBackId: set.cardBackId ?? DEFAULT_CARD_BACK_ID,
    cards: normalizeSetCardOrder(set.cards),
  };
}

function resolveCardBackId(card: CardDraft, set?: CardSet): CardBackId {
  return card.cardBackId ?? set?.cardBackId ?? DEFAULT_CARD_BACK_ID;
}

function withResolvedCardBack(card: CardDraft, set?: CardSet): CardDraft {
  return {
    ...card,
    cardBackId: resolveCardBackId(card, set),
  };
}

function hasOwnPatchKey<T extends object>(patch: Partial<T>, key: keyof T) {
  return Object.prototype.hasOwnProperty.call(patch, key);
}

function getFrameGeometryArtResetPatch(current: CardDraft, patch: Partial<CardDraft>): Partial<CardDraft> {
  const nextTypeFrame = hasOwnPatchKey(patch, "typeFrame") ? patch.typeFrame : current.typeFrame;
  const nextFrameTreatment = hasOwnPatchKey(patch, "frameTreatment")
    ? patch.frameTreatment
    : current.frameTreatment;
  const nextBackFrameTreatment = hasOwnPatchKey(patch, "backFrameTreatment")
    ? patch.backFrameTreatment
    : current.backFrameTreatment;
  const nextShowcaseFrame = hasOwnPatchKey(patch, "showcaseFrame")
    ? patch.showcaseFrame
    : current.showcaseFrame;
  const nextBackShowcaseFrame = hasOwnPatchKey(patch, "backShowcaseFrame")
    ? patch.backShowcaseFrame
    : current.backShowcaseFrame;
  const typeFrameChanged = (current.typeFrame ?? "standard") !== (nextTypeFrame ?? "standard");
  const treatmentChanged = (current.frameTreatment ?? "standard") !== (nextFrameTreatment ?? "standard");
  const backTreatmentChanged =
    (current.backFrameTreatment ?? "standard") !== (nextBackFrameTreatment ?? "standard");
  const showcaseChanged =
    (current.showcaseFrame ?? DEFAULT_SHOWCASE_FRAME) !== (nextShowcaseFrame ?? DEFAULT_SHOWCASE_FRAME);
  const backShowcaseChanged =
    (current.backShowcaseFrame ?? DEFAULT_SHOWCASE_FRAME) !==
    (nextBackShowcaseFrame ?? DEFAULT_SHOWCASE_FRAME);

  if (!typeFrameChanged && !treatmentChanged && !backTreatmentChanged && !showcaseChanged && !backShowcaseChanged) {
    return {};
  }

  const resetFrontArt = typeFrameChanged || treatmentChanged || showcaseChanged;
  const resetBackArt = typeFrameChanged || backTreatmentChanged || backShowcaseChanged;

  return {
    ...(resetFrontArt && current.artUri ? { artTransform: DEFAULT_ART_TRANSFORM } : {}),
    ...(resetBackArt && current.backArtUri ? { backArtTransform: DEFAULT_ART_TRANSFORM } : {}),
  };
}

function normalizeSetCardOrder(cards: SetCardSnapshot[]): SetCardSnapshot[] {
  const cardCount = cards.length;
  const setSize = formatSetSize(cardCount);

  return [...cards]
    .sort(compareSetCardSnapshots)
    .map((snapshot, index) => ({
      ...snapshot,
      card: {
        ...cloneCardDraft(snapshot.card),
        collectorNumber: formatSetCollectorNumber(index, cardCount),
        setSize,
      },
    }));
}

function compareSetCardSnapshots(first: SetCardSnapshot, second: SetCardSnapshot) {
  const firstKey = getSetCollectorSortKey(first.card);
  const secondKey = getSetCollectorSortKey(second.card);

  return (
    firstKey.categoryRank - secondKey.categoryRank ||
    firstKey.colorRank - secondKey.colorRank ||
    firstKey.name.localeCompare(secondKey.name, undefined, { sensitivity: "base" }) ||
    first.savedAt.localeCompare(second.savedAt) ||
    first.id.localeCompare(second.id)
  );
}

function getSetCollectorSortKey(card: CardDraft) {
  const typeInfo = getCollectorTypeInfo(card);
  const colors = getCollectorColors(card);
  const name = getCollectorSortName(card);
  const basicLandRank = getBasicLandRank(card, typeInfo);

  if (typeInfo.cardTypes.includes("Land")) {
    return {
      categoryRank: basicLandRank >= 0 ? 9 : 8,
      colorRank: basicLandRank >= 0 ? basicLandRank : 0,
      name,
    };
  }

  if (colors.length === 0 && typeInfo.cardTypes.includes("Artifact")) {
    return { categoryRank: 7, colorRank: 0, name };
  }

  if (colors.length === 0) {
    return { categoryRank: 0, colorRank: 0, name };
  }

  if (colors.length === 1) {
    return {
      categoryRank: 1 + SET_NUMBER_COLOR_ORDER.indexOf(colors[0]),
      colorRank: 0,
      name,
    };
  }

  return { categoryRank: 6, colorRank: 0, name };
}

function getCollectorColors(card: CardDraft): ManaColor[] {
  if (isSplitTypeFrame(card) && card.splitLeft && card.splitRight) {
    return normalizeSetManaColors([
      ...getFrameColors(toSplitHalfCard(card, card.splitLeft)),
      ...getFrameColors(toSplitHalfCard(card, card.splitRight)),
    ]);
  }

  return normalizeSetManaColors(getFrameColors({ ...card, dfcFace: "front" }));
}

type SetBarColorKey = ManaColor | "C";

type SetBarColorSegment = {
  key: SetBarColorKey;
  color: string;
  flex: number;
};

type SetBarGradient = {
  colors: [string, string, ...string[]];
  locations: [number, number, ...number[]];
};

const SET_BAR_COLOR_ORDER: SetBarColorKey[] = ["W", "U", "B", "R", "G", "C"];
const SET_BAR_COLORS: Record<SetBarColorKey, string> = {
  W: "#e9d99a",
  U: "#2c86b8",
  B: "#2b2730",
  R: "#b84932",
  G: "#4e7d43",
  C: "#9da0a0",
};

function getSetBarColorSegments(set: CardSet): SetBarColorSegment[] {
  const weights: Record<SetBarColorKey, number> = {
    W: 0,
    U: 0,
    B: 0,
    R: 0,
    G: 0,
    C: 0,
  };

  for (const snapshot of set.cards) {
    const colors = getCollectorColors(snapshot.card);

    if (colors.length === 0) {
      weights.C += 1;
      continue;
    }

    const colorWeight = 1 / colors.length;

    for (const color of colors) {
      weights[color] += colorWeight;
    }
  }

  const segments = SET_BAR_COLOR_ORDER
    .filter((color) => weights[color] > 0)
    .map((color) => ({
      key: color,
      color: SET_BAR_COLORS[color],
      flex: weights[color],
    }));

  return segments.length > 0 ? segments : [{ key: "C", color: "#151820", flex: 1 }];
}

function getSetBarGradient(set: CardSet): SetBarGradient {
  const segments = getSetBarColorSegments(set);
  const totalWeight = segments.reduce((total, segment) => total + segment.flex, 0) || 1;

  if (segments.length === 1) {
    return {
      colors: [segments[0].color, segments[0].color],
      locations: [0, 1],
    };
  }

  const colors: string[] = [segments[0].color];
  const locations: number[] = [0];
  let cursor = 0;

  for (const segment of segments) {
    const center = (cursor + segment.flex / 2) / totalWeight;
    colors.push(segment.color);
    locations.push(center);
    cursor += segment.flex;
  }

  colors.push(segments[segments.length - 1].color);
  locations.push(1);

  return {
    colors: colors as [string, string, ...string[]],
    locations: locations as [number, number, ...number[]],
  };
}

function normalizeSetManaColors(colors: ManaColor[]) {
  const selectedColors = new Set(colors);

  return SET_NUMBER_COLOR_ORDER.filter((color) => selectedColors.has(color));
}

function getCollectorTypeInfo(card: CardDraft): { supertypes: string[]; cardTypes: string[]; subtypes: string[] } {
  const typeLines =
    isSplitTypeFrame(card) && card.splitLeft && card.splitRight
      ? [card.splitLeft.typeLine, card.splitRight.typeLine]
      : [card.typeLine];
  const parsed = typeLines.map(parseCollectorTypeLine);

  return {
    supertypes: Array.from(new Set(parsed.flatMap((typeInfo) => typeInfo.supertypes))),
    cardTypes: Array.from(new Set(parsed.flatMap((typeInfo) => typeInfo.cardTypes))),
    subtypes: Array.from(new Set(parsed.flatMap((typeInfo) => typeInfo.subtypes))),
  };
}

function parseCollectorTypeLine(typeLine: string) {
  const [left = "", right = ""] = typeLine.trim().split(TYPE_LINE_DIVIDER_PATTERN);
  const supertypes: string[] = [];
  const cardTypes: string[] = [];

  left
    .split(/\s+/)
    .filter(Boolean)
    .map(normalizeCollectorTypeWord)
    .forEach((word) => {
      if (["Basic", "Legendary", "Ongoing", "Snow", "World"].includes(word)) {
        supertypes.push(word);
      } else {
        cardTypes.push(word);
      }
    });

  return {
    supertypes,
    cardTypes,
    subtypes: right.split(/\s+/).filter(Boolean).map(normalizeCollectorTypeWord),
  };
}

function normalizeCollectorTypeWord(word: string) {
  const lowerWord = word.toLowerCase();

  return `${lowerWord.charAt(0).toUpperCase()}${lowerWord.slice(1)}`;
}

function getBasicLandRank(card: CardDraft, typeInfo: { supertypes: string[]; subtypes: string[] }) {
  if (!typeInfo.supertypes.includes("Basic")) {
    return -1;
  }

  const subtypeRank = BASIC_LAND_ORDER.findIndex((landType) => typeInfo.subtypes.includes(landType));

  if (subtypeRank >= 0) {
    return subtypeRank;
  }

  return BASIC_LAND_ORDER.findIndex((landType) => normalizeCollectorTypeWord(card.name) === landType);
}

function getCollectorSortName(card: CardDraft) {
  return (card.name || card.baseCardName || "Untitled Card").trim().toLocaleLowerCase();
}

function cloneFrameTemplate(template: CardFrameTemplate): CardFrameTemplate {
  return JSON.parse(JSON.stringify(template)) as CardFrameTemplate;
}

function createFrameTemplateFromCard(card: CardDraft): CardFrameTemplate {
  const faceCard = getEditableCardFace(card);
  const frameLabel = inferFrameStyle(faceCard).label;
  const treatment = card.frameTreatment ?? "standard";
  const timestamp = new Date().toISOString();

  return {
    id: `frame-template-${Date.now()}`,
    name: `${frameLabel} ${FRAME_TREATMENT_LABELS[treatment]}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    data: {
      typeFrame: card.typeFrame,
      dfcMode: card.dfcMode,
      splitLayout: card.splitLayout,
      frameSelection: card.frameSelection,
      frameColors: card.frameColors ? [...card.frameColors] : undefined,
      backFrameSelection: card.backFrameSelection,
      backFrameColors: card.backFrameColors ? [...card.backFrameColors] : undefined,
      frameTreatment: card.frameTreatment,
      showcaseFrame: card.showcaseFrame,
      frameCustomization: card.frameCustomization ? { ...card.frameCustomization } : undefined,
    },
  };
}

function getFrameTemplatePatch(template: CardFrameTemplate): Partial<CardDraft> {
  return {
    typeFrame: template.data.typeFrame,
    dfcMode: template.data.dfcMode,
    splitLayout: template.data.splitLayout,
    frameSelection: template.data.frameSelection,
    frameColors: template.data.frameColors ? [...template.data.frameColors] : undefined,
    backFrameSelection: template.data.backFrameSelection,
    backFrameColors: template.data.backFrameColors ? [...template.data.backFrameColors] : undefined,
    frameTreatment: template.data.frameTreatment,
    showcaseFrame: template.data.showcaseFrame,
    frameCustomization: template.data.frameCustomization ? { ...template.data.frameCustomization } : undefined,
  };
}

function isCardDraft(value: unknown): value is CardDraft {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as CardDraft).name === "string" &&
    typeof (value as CardDraft).manaCost === "string" &&
    typeof (value as CardDraft).typeLine === "string" &&
    typeof (value as CardDraft).rulesText === "string" &&
    typeof (value as CardDraft).flavorText === "string" &&
    typeof (value as CardDraft).rarity === "string"
  );
}

function isCardSetArray(value: unknown): value is CardSet[] {
  return (
    Array.isArray(value) &&
    value.every(
      (set) =>
        Boolean(set) &&
        typeof set === "object" &&
        typeof (set as CardSet).id === "string" &&
        typeof (set as CardSet).name === "string" &&
        Array.isArray((set as CardSet).cards),
    )
  );
}

function isCardFrameTemplate(value: unknown): value is CardFrameTemplate {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as CardFrameTemplate).id === "string" &&
    typeof (value as CardFrameTemplate).name === "string" &&
    typeof (value as CardFrameTemplate).createdAt === "string" &&
    typeof (value as CardFrameTemplate).updatedAt === "string" &&
    Boolean((value as CardFrameTemplate).data) &&
    typeof (value as CardFrameTemplate).data === "object"
  );
}

function isCardFrameTemplateArray(value: unknown): value is CardFrameTemplate[] {
  return Array.isArray(value) && value.every(isCardFrameTemplate);
}

function isArtLibraryEntry(value: unknown): value is ArtLibraryEntry {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as ArtLibraryEntry).id === "string" &&
    typeof (value as ArtLibraryEntry).uri === "string" &&
    ((value as ArtLibraryEntry).source === "generated" || (value as ArtLibraryEntry).source === "added") &&
    typeof (value as ArtLibraryEntry).colorIdentity === "string" &&
    typeof (value as ArtLibraryEntry).label === "string" &&
    typeof (value as ArtLibraryEntry).createdAt === "string"
  );
}

function isArtLibraryEntryArray(value: unknown): value is ArtLibraryEntry[] {
  return Array.isArray(value) && value.every(isArtLibraryEntry);
}

async function getNativeStorageAdapter(): Promise<CardMagicStorageAdapter | null> {
  if (!hasNativeModule("RNCAsyncStorage", "AsyncStorage", "PlatformLocalStorage")) {
    return null;
  }

  try {
    const module = await import("@react-native-async-storage/async-storage");

    return module.default;
  } catch (error) {
    console.warn("CardMagic native storage adapter is unavailable.", error);
    return null;
  }
}

async function loadStoredCardSets(): Promise<CardSet[] | null> {
  try {
    const rawSets =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.localStorage.getItem(CARD_SET_STORAGE_KEY)
        : await (await getNativeStorageAdapter())?.getItem(CARD_SET_STORAGE_KEY);

    if (!rawSets) {
      return null;
    }

    const parsed = JSON.parse(rawSets) as unknown;

    if (!isCardSetArray(parsed)) {
      return null;
    }

    const normalizedSets = normalizeCardSets(parsed);

    return await materializeCardSetsImageDataUris(normalizedSets);
  } catch (error) {
    console.warn("Unable to load saved CardMagic sets.", error);
    return null;
  }
}

async function loadStoredActiveCardDraft(): Promise<CardDraft | null> {
  try {
    const rawCard =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.localStorage.getItem(ACTIVE_CARD_STORAGE_KEY)
        : await (await getNativeStorageAdapter())?.getItem(ACTIVE_CARD_STORAGE_KEY);

    if (!rawCard) {
      return null;
    }

    const parsed = JSON.parse(rawCard) as unknown;
    const candidate =
      Boolean(parsed) &&
      typeof parsed === "object" &&
      (parsed as StoredActiveCardDraft).schemaVersion === 1
        ? (parsed as StoredActiveCardDraft).card
        : parsed;

    if (!isCardDraft(candidate)) {
      return null;
    }

    return await materializeCardDraftImageDataUris(candidate, "active-card");
  } catch (error) {
    console.warn("Unable to load active CardMagic draft.", error);
    return null;
  }
}

async function loadStoredFrameTemplates(): Promise<CardFrameTemplate[] | null> {
  try {
    const rawTemplates =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.localStorage.getItem(FRAME_TEMPLATE_STORAGE_KEY)
        : await (await getNativeStorageAdapter())?.getItem(FRAME_TEMPLATE_STORAGE_KEY);

    if (!rawTemplates) {
      return null;
    }

    const parsed = JSON.parse(rawTemplates) as unknown;

    return isCardFrameTemplateArray(parsed) ? parsed : null;
  } catch (error) {
    console.warn("Unable to load CardMagic frame templates.", error);
    return null;
  }
}

async function loadStoredArtLibrary(): Promise<ArtLibraryEntry[] | null> {
  try {
    const rawEntries =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.localStorage.getItem(ART_LIBRARY_STORAGE_KEY)
        : await (await getNativeStorageAdapter())?.getItem(ART_LIBRARY_STORAGE_KEY);

    if (!rawEntries) {
      return null;
    }

    const parsed = JSON.parse(rawEntries) as unknown;

    if (!isArtLibraryEntryArray(parsed)) {
      return null;
    }

    const materializedEntries = await materializeArtLibraryImageDataUris(parsed);

    return normalizeArtLibraryEntries(materializedEntries);
  } catch (error) {
    console.warn("Unable to load CardMagic art library.", error);
    return null;
  }
}

async function storeCardSets(sets: CardSet[]) {
  try {
    const serializedSets = JSON.stringify(normalizeCardSets(sets));

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage.setItem(CARD_SET_STORAGE_KEY, serializedSets);
      return;
    }

    await (await getNativeStorageAdapter())?.setItem(CARD_SET_STORAGE_KEY, serializedSets);
  } catch (error) {
    console.warn("Unable to persist CardMagic sets.", error);
  }
}

async function storeActiveCardDraft(card: CardDraft) {
  try {
    const serializedCard = JSON.stringify({
      schemaVersion: 1,
      card: cloneCardDraft(card),
    } satisfies StoredActiveCardDraft);

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_CARD_STORAGE_KEY, serializedCard);
      return;
    }

    await (await getNativeStorageAdapter())?.setItem(ACTIVE_CARD_STORAGE_KEY, serializedCard);
  } catch (error) {
    console.warn("Unable to persist active CardMagic draft.", error);
  }
}

async function storeFrameTemplates(templates: CardFrameTemplate[]) {
  try {
    const serializedTemplates = JSON.stringify(templates);

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage.setItem(FRAME_TEMPLATE_STORAGE_KEY, serializedTemplates);
      return;
    }

    await (await getNativeStorageAdapter())?.setItem(FRAME_TEMPLATE_STORAGE_KEY, serializedTemplates);
  } catch (error) {
    console.warn("Unable to persist CardMagic frame templates.", error);
  }
}

async function storeArtLibrary(entries: ArtLibraryEntry[]) {
  try {
    const serializedEntries = JSON.stringify(normalizeArtLibraryEntries(entries));

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage.setItem(ART_LIBRARY_STORAGE_KEY, serializedEntries);
      return;
    }

    await (await getNativeStorageAdapter())?.setItem(ART_LIBRARY_STORAGE_KEY, serializedEntries);
  } catch (error) {
    console.warn("Unable to persist CardMagic art library.", error);
  }
}

async function loadStoredOpenAiApiKey(): Promise<string> {
  try {
    const rawKey =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY)
        : await (await getNativeStorageAdapter())?.getItem(OPENAI_API_KEY_STORAGE_KEY);

    return rawKey ?? "";
  } catch (error) {
    console.warn("Unable to load stored OpenAI API key.", error);
    return "";
  }
}

async function storeOpenAiApiKey(apiKey: string) {
  try {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, apiKey);
      return;
    }

    await (await getNativeStorageAdapter())?.setItem(OPENAI_API_KEY_STORAGE_KEY, apiKey);
  } catch (error) {
    console.warn("Unable to persist OpenAI API key.", error);
  }
}

function getSetCardDisplayCard(snapshot: SetCardSnapshot): CardDraft {
  return snapshot.card;
}

function getSetCardPreviewCard(snapshot: SetCardSnapshot, set: CardSet): CardDraft {
  return withResolvedCardBack(snapshot.card, set);
}

function normalizeArtLibraryEntries(entries: ArtLibraryEntry[]) {
  const seen = new Set<string>();

  return sortArtLibraryEntries(entries)
    .filter((entry) => {
      const key = `${entry.source}:${entry.uri}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, ART_LIBRARY_MAX_ENTRIES);
}

function sortArtLibraryEntries(entries: ArtLibraryEntry[]) {
  return [...entries].sort((left, right) => {
    const colorDelta =
      getColorIdentitySortValue(left.colorIdentity) - getColorIdentitySortValue(right.colorIdentity);

    if (colorDelta !== 0) {
      return colorDelta;
    }

    return Date.parse(right.createdAt) - Date.parse(left.createdAt);
  });
}

function getColorIdentitySortValue(colorIdentity: string) {
  if (colorIdentity === "artifact") {
    return 700;
  }

  if (colorIdentity === "land") {
    return 800;
  }

  if (colorIdentity === "colorless") {
    return 900;
  }

  const colors = colorIdentity
    .split("")
    .filter((color): color is ManaColor => COLOR_IDENTITY_SORT_ORDER.includes(color as ManaColor));

  if (colors.length === 0) {
    return 950;
  }

  return colors.length * 100 + colors.reduce(
    (total, color, index) => total + COLOR_IDENTITY_SORT_ORDER.indexOf(color) * Math.pow(10, colors.length - index - 1),
    0,
  );
}

function getCardArtLibraryColorIdentity(card: CardDraft) {
  const faceCard = getEditableCardFace(card);
  const colors = getFrameColors(faceCard)
    .filter((color, index, allColors) => allColors.indexOf(color) === index)
    .sort((left, right) => COLOR_IDENTITY_SORT_ORDER.indexOf(left) - COLOR_IDENTITY_SORT_ORDER.indexOf(right));

  if (colors.length > 0) {
    return colors.join("");
  }

  const frameIdentity = inferFrameIdentity(faceCard);

  if (frameIdentity === "artifact" || frameIdentity === "land") {
    return frameIdentity;
  }

  return "colorless";
}

function getArtLibraryColorLabel(colorIdentity: string) {
  const colors = colorIdentity
    .split("")
    .filter((color): color is ManaColor => COLOR_IDENTITY_SORT_ORDER.includes(color as ManaColor));

  if (colors.length > 0) {
    return colors.map((color) => COLOR_LABELS_FOR_LIBRARY[color]).join("-");
  }

  return colorIdentity.charAt(0).toUpperCase() + colorIdentity.slice(1);
}

const COLOR_LABELS_FOR_LIBRARY: Record<ManaColor, string> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
};

function getExportFileName(name: string, suffix: string) {
  const safeName = (name || "cardmagic")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${safeName || "cardmagic"}-${suffix}.json`;
}

function getExportFileBaseName(name: string) {
  return (name || "cardmagic")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "cardmagic";
}

function createSetExportPayload(set: CardSet): CardMagicExport {
  const normalizedSet = normalizeCardSet(set);

  return {
    schemaVersion: 1,
    kind: "set",
    exportedAt: new Date().toISOString(),
    set: {
      ...normalizedSet,
      cards: normalizedSet.cards.map((snapshot) => ({
        ...snapshot,
        card: cloneCardDraft(getSetCardPreviewCard(snapshot, normalizedSet)),
      })),
    },
  };
}

function waitForRenderFrame(delayMs = 120) {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, delayMs);
      });
    });
  });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(message)), timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

async function readPngCaptureBytes(result: string): Promise<Uint8Array> {
  if (result.startsWith("data:")) {
    const response = await fetch(result);
    return new Uint8Array(await response.arrayBuffer());
  }

  if (!hasNativeModule("ExpoFileSystem")) {
    throw new Error("ExpoFileSystem native module is unavailable.");
  }

  const FileSystem = await import("expo-file-system");
  return await new FileSystem.File(result).bytes();
}

async function loadViewShotCaptureRef() {
  const module = await import("react-native-view-shot/src/index.js");
  return module.captureRef;
}

async function loadWebViewShotCaptureRef() {
  const module = await import("react-native-view-shot/src/RNViewShot.web.js");
  return module.default.captureRef;
}

function downloadBlob(fileName: string, blob: Blob) {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

function shouldPreferWebFileShare() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /\b(?:android|iphone|ipad|ipod|mobile)\b/i.test(navigator.userAgent);
}

function shouldUseSheetForMobileWebCardTextEditing(section: CardSection) {
  return (
    Platform.OS === "web" &&
    shouldPreferWebFileShare() &&
    (section === "identity" || section === "typeLine" || section === "rules" || section === "stats")
  );
}

function getFileExtension(fileName: string) {
  const match = /\.([a-z0-9]+)$/i.exec(fileName);
  return match ? `.${match[1].toLowerCase()}` : "";
}

function getWebSavePickerTypes(fileName: string, mimeType: string): WebSaveFilePickerAccept[] {
  const extension = getFileExtension(fileName);

  if (!extension || !mimeType) {
    return [];
  }

  return [
    {
      description: mimeType.startsWith("image/") ? "Image file" : "CardMagic export",
      accept: { [mimeType]: [extension] },
    },
  ];
}

async function promptForWebSaveFileHandle(fileName: string, mimeType: string) {
  if (
    typeof window === "undefined" ||
    shouldPreferWebFileShare() ||
    typeof (window as WindowWithSaveFilePicker).showSaveFilePicker !== "function"
  ) {
    return null;
  }

  try {
    return await (window as WindowWithSaveFilePicker).showSaveFilePicker?.({
      suggestedName: fileName,
      types: getWebSavePickerTypes(fileName, mimeType),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "cancelled" as const;
    }

    console.warn("Web save picker unavailable; falling back to browser download.", error);
    return null;
  }
}

async function writeWebFileHandle(fileHandle: WebFileSystemFileHandle, blob: Blob) {
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

function hasWebShareApi() {
  if (typeof navigator === "undefined" || typeof File === "undefined") {
    return false;
  }

  const navigatorWithShare = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };

  if (!navigatorWithShare.share) {
    return false;
  }

  return true;
}

function canShareWebFile(fileName: string, blob: Blob) {
  if (!hasWebShareApi()) {
    return false;
  }

  const navigatorWithShare = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };

  const file = new File([blob], fileName, { type: blob.type || "application/octet-stream" });
  const shareData: ShareData = {
    title: fileName,
    files: [file],
  };

  return !navigatorWithShare.canShare || navigatorWithShare.canShare(shareData);
}

async function tryShareWebFile(fileName: string, blob: Blob, title = fileName) {
  if (typeof navigator === "undefined" || typeof File === "undefined") {
    return "unavailable" as const;
  }

  const navigatorWithShare = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };

  if (!navigatorWithShare.share) {
    return "unavailable" as const;
  }

  const file = new File([blob], fileName, { type: blob.type || "application/octet-stream" });
  const shareData: ShareData = {
    title,
    text: "CardMagic card photo",
    files: [file],
  };

  if (navigatorWithShare.canShare && !navigatorWithShare.canShare(shareData)) {
    return "unavailable" as const;
  }

  try {
    await navigatorWithShare.share(shareData);
    return "shared" as const;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "cancelled" as const;
    }

    console.warn("Web file share unavailable; falling back to save/download.", error);
    return "failed" as const;
  }
}

function normalizeWebPngExportUri(result: string) {
  const trimmed = result.trim();

  if (/^data:image\/png[;,]/i.test(trimmed) || /^blob:/i.test(trimmed) || /^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^[a-z0-9+/=\s]+$/i.test(trimmed)) {
    return `data:image/png;base64,${trimmed.replace(/\s+/g, "")}`;
  }

  throw new Error(`Unexpected web PNG export result: ${trimmed.slice(0, 48)}`);
}

async function webPngExportUriToBlob(result: string) {
  const normalizedUri = normalizeWebPngExportUri(result);

  if (normalizedUri.startsWith("data:")) {
    return dataUriToBlob(normalizedUri);
  }

  const response = await fetch(normalizedUri);

  if (!response.ok) {
    throw new Error(`Unable to read rendered PNG blob: HTTP ${response.status}`);
  }

  return await response.blob();
}

function openWebImageInNewTab(fileName: string, dataUri: string) {
  if (typeof window === "undefined") {
    return;
  }

  const url = normalizeWebPngExportUri(dataUri);
  const openedWindow = window.open(url, "_blank", "noopener,noreferrer");

  if (openedWindow) {
    openedWindow.document.title = fileName;
    return;
  }

  window.location.href = url;
}

async function shareOrDownloadWebFile(
  fileName: string,
  blob: Blob,
  title = fileName,
  fileHandle?: WebFileSystemFileHandle | null,
) {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  if (shouldPreferWebFileShare()) {
    const shareResult = await tryShareWebFile(fileName, blob, title);

    if (shareResult === "shared" || shareResult === "cancelled") {
      return;
    }
  }

  if (fileHandle) {
    await writeWebFileHandle(fileHandle, blob);
    return;
  }

  const pickedFileHandle = await promptForWebSaveFileHandle(fileName, blob.type || "application/octet-stream");

  if (pickedFileHandle === "cancelled") {
    return;
  }

  if (pickedFileHandle) {
    await writeWebFileHandle(pickedFileHandle, blob);
    return;
  }

  downloadBlob(fileName, blob);
}

function dataUriToBlob(dataUri: string) {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUri);

  if (!match) {
    throw new Error("Expected a data URI PNG export.");
  }

  const mimeType = match[1] || "application/octet-stream";
  const isBase64 = Boolean(match[2]);
  const payload = match[3];
  const binary = isBase64 ? window.atob(payload) : decodeURIComponent(payload);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

function getArrayBufferSlice(bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

async function writeAndShareNativeBytes(
  fileName: string,
  bytes: Uint8Array,
  options: { dialogTitle: string; mimeType: string; UTI: string },
) {
  if (!hasAllNativeModules("ExpoFileSystem", "ExpoSharing")) {
    Alert.alert("Export unavailable", "This app build does not include the native file export modules.");
    return;
  }

  const FileSystem = await import("expo-file-system");
  const file = new FileSystem.File(FileSystem.Paths.cache, fileName);

  if (!file.uri.startsWith("file:")) {
    throw new Error("CardMagic could not find a writable cache directory.");
  }

  file.create({ overwrite: true, intermediates: true });
  file.write(bytes);
  await shareNativeFile(file.uri, options);
}

async function exportCardMagicJson(fileName: string, payload: CardMagicExport) {
  const json = `${JSON.stringify(payload, null, 2)}\n`;

  if (Platform.OS === "web" && typeof window !== "undefined" && typeof document !== "undefined") {
    await shareOrDownloadWebFile(fileName, new Blob([json], { type: "application/json" }), "Export CardMagic JSON");
    return;
  }

  try {
    if (!hasAllNativeModules("ExpoFileSystem", "ExpoSharing")) {
      throw new Error("Native file export modules are unavailable.");
    }

    const [FileSystem, Sharing] = await Promise.all([
      import("expo-file-system"),
      import("expo-sharing"),
    ]);
    const file = new FileSystem.File(FileSystem.Paths.cache, fileName);

    if (!file.uri.startsWith("file:")) {
      throw new Error("CardMagic could not find a writable cache directory.");
    }

    file.create({ overwrite: true, intermediates: true });
    file.write(json);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        dialogTitle: "Export CardMagic JSON",
        mimeType: "application/json",
        UTI: "public.json",
      });
      return;
    }

    Alert.alert("Export saved", `CardMagic wrote the export file to ${file.uri}`);
  } catch (error) {
    console.warn("File export adapter unavailable; falling back to text share.", error);
    await Share.share({
      title: fileName,
      message: json,
    });
  }
}

function importJsonFromWebFile(): Promise<unknown | null> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(null);
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";

    input.onchange = () => {
      const file = input.files?.[0];

      if (!file) {
        resolve(null);
        return;
      }

      file
        .text()
        .then((text) => resolve(JSON.parse(text) as unknown))
        .catch((error) => {
          console.warn("Unable to import JSON file.", error);
          resolve(null);
        });
    };

    input.click();
  });
}

async function importCardMagicJson(): Promise<unknown | null> {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    return importJsonFromWebFile();
  }

  try {
    if (!hasNativeModule("ExpoFileSystem")) {
      throw new Error("ExpoFileSystem native module is unavailable.");
    }

    const FileSystem = await import("expo-file-system");
    const picked = await FileSystem.File.pickFileAsync(undefined, "application/json");
    const file = Array.isArray(picked) ? picked[0] : picked;

    return JSON.parse(await file.text()) as unknown;
  } catch (error) {
    console.warn("Unable to import CardMagic JSON.", error);
    Alert.alert("Import unavailable", "CardMagic could not read a JSON file from this app build.");
    return null;
  }
}

async function shareOrDownloadWebPng(
  fileName: string,
  dataUri: string,
  fileHandle?: WebFileSystemFileHandle | null,
) {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  const blob = await webPngExportUriToBlob(dataUri);
  await shareOrDownloadWebFile(fileName, blob, "Export CardMagic PNG", fileHandle);
}

async function shareNativeFile(uri: string, options: { dialogTitle: string; mimeType: string; UTI: string }) {
  if (hasNativeModule("ExpoSharing")) {
    try {
      const Sharing = await import("expo-sharing");

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, options);
        return;
      }
    } catch (error) {
      console.warn("Native file sharing adapter is unavailable.", error);
    }
  }

  try {
    await Share.share({
      title: options.dialogTitle,
      url: normalizeMediaLibraryUri(uri),
    });
  } catch (error) {
    console.warn("Native share sheet fallback is unavailable.", error);
    Alert.alert(
      "Export unavailable",
      "CardMagic rendered the card, but this app build cannot open a share sheet. Rebuild with Expo Sharing or Media Library support.",
    );
  }
}

function normalizeMediaLibraryUri(uri: string) {
  return uri.startsWith("file://") ? uri : `file://${uri}`;
}

async function saveNativePngToPhotoLibrary(
  uri: string,
  fallbackOptions: { dialogTitle: string; mimeType: string; UTI: string },
) {
  if (!hasNativeModule("ExpoMediaLibrary")) {
    await shareNativeFile(uri, fallbackOptions);
    return;
  }

  try {
    const MediaLibrary = await import("expo-media-library");

    const permission = await MediaLibrary.requestPermissionsAsync(true);

    if (!permission.granted) {
      await shareNativeFile(uri, fallbackOptions);
      return;
    }

    await MediaLibrary.saveToLibraryAsync(normalizeMediaLibraryUri(uri));
    Alert.alert("Photo saved", "CardMagic saved the rendered card to your photo library.");
  } catch (error) {
    console.warn("Photo library export adapter is unavailable.", error);
    await shareNativeFile(uri, fallbackOptions);
  }
}

async function generateOpenAiImageUri({
  apiKey,
  prompt,
}: {
  apiKey: string;
  prompt: string;
}) {
  let lastError: Error | null = null;

  for (const model of OPENAI_IMAGE_MODELS) {
    try {
      return await generateOpenAiImageUriWithModel({ apiKey, prompt, model });
    } catch (error) {
      const generationError = error instanceof Error ? error : new Error("OpenAI image generation failed.");

      lastError = generationError;

      if (!shouldTryNextImageModel(generationError)) {
        throw generationError;
      }
    }
  }

  throw lastError ?? new Error("OpenAI image generation failed.");
}

async function generateOpenAiRulesText({
  apiKey,
  prompt,
}: {
  apiKey: string;
  prompt: string;
}) {
  let lastError: Error | null = null;

  for (const model of OPENAI_RULES_TEXT_MODELS) {
    try {
      return await generateOpenAiRulesTextWithModel({ apiKey, prompt, model });
    } catch (error) {
      const generationError = error instanceof Error ? error : new Error("OpenAI rules text fixer failed.");

      lastError = generationError;

      if (!shouldTryNextOpenAiTextModel(generationError)) {
        throw generationError;
      }
    }
  }

  throw lastError ?? new Error("OpenAI rules text fixer failed.");
}

async function generateOpenAiRulesTextWithModel({
  apiKey,
  prompt,
  model,
}: {
  apiKey: string;
  prompt: string;
  model: (typeof OPENAI_RULES_TEXT_MODELS)[number];
}) {
  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a Magic: The Gathering Oracle text templating editor. Return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as OpenAiChatCompletionResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message || `OpenAI rules text fixer failed with HTTP ${response.status}.`);
  }

  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI did not return fixed rules text.");
  }

  return parseOpenAiRulesTextResponse(content);
}

async function generateOpenAiImageUriWithModel({
  apiKey,
  prompt,
  model,
}: {
  apiKey: string;
  prompt: string;
  model: (typeof OPENAI_IMAGE_MODELS)[number];
}) {
  const response = await fetch(OPENAI_IMAGE_GENERATION_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      size: "1024x1024",
      quality: "medium",
      output_format: "png",
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as OpenAiImageGenerationResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message || `OpenAI image generation failed with HTTP ${response.status}.`);
  }

  const image = payload.data?.[0];

  if (image?.b64_json) {
    return await materializeBase64ImageUri(image.b64_json, "png", "generated-art");
  }

  if (image?.url) {
    return image.url;
  }

  throw new Error("OpenAI did not return image data.");
}

function shouldTryNextImageModel(error: Error) {
  return /\b(?:model|unsupported|not supported|not found|does not exist|access|permission|available)\b/i.test(
    error.message,
  );
}

function shouldTryNextOpenAiTextModel(error: Error) {
  return /\b(?:model|unsupported|not supported|not found|does not exist|access|permission|available)\b/i.test(
    error.message,
  );
}

function parseOpenAiRulesTextResponse(content: string) {
  const normalizedContent = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  try {
    const payload = JSON.parse(normalizedContent) as { rulesText?: unknown };

    if (typeof payload.rulesText === "string") {
      return normalizeFixedRulesText(payload.rulesText);
    }
  } catch {
    // Fall through to the plain-text rescue path for older or nonconforming models.
  }

  return normalizeFixedRulesText(normalizedContent);
}

function normalizeFixedRulesText(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function captureCardMagicPng(target: View | null) {
  if (!target) {
    throw new Error("CardMagic could not find the rendered card preview.");
  }

  if (Platform.OS === "web") {
    const captureWebRef = await loadWebViewShotCaptureRef();

    return await withTimeout(
      captureWebRef(target as unknown as HTMLElement, {
        format: "png",
        quality: 1,
        result: "data-uri",
      }),
      20000,
      "CardMagic timed out while rasterizing the card preview.",
    );
  }

  if (!hasNativeModule("RNViewShot")) {
    throw new Error("RNViewShot native module is unavailable.");
  }

  const captureRef = await loadViewShotCaptureRef();

  return await withTimeout(
    captureRef(target, {
      format: "png",
      quality: 1,
      result: "tmpfile",
    }),
    30000,
    "CardMagic timed out while rasterizing the card preview.",
  );
}

async function exportCardMagicPng(fileName: string, target: View | null) {
  try {
    const result = await captureCardMagicPng(target);

    if (Platform.OS === "web") {
      await shareOrDownloadWebPng(fileName, result);
      return;
    }

    await saveNativePngToPhotoLibrary(result, {
      dialogTitle: "Export CardMagic PNG",
      mimeType: "image/png",
      UTI: "public.png",
    });
  } catch (error) {
    console.warn("PNG export adapter unavailable.", error);
    Alert.alert(
      "PNG export unavailable",
      Platform.OS === "web"
        ? "CardMagic could not render a downloadable PNG in this browser."
        : "The current app build does not include the image capture adapter. Rebuild the native app to enable rendered PNG exports.",
    );
  }
}

function createNextBlankCard(previous: CardDraft): CardDraft {
  return {
    ...INITIAL_CARD,
    artist: previous.artist,
    setCode: previous.setCode,
    collectorNumber: getNextCollectorNumber(previous.collectorNumber),
    setSymbolPreset: previous.setSymbolPreset,
    setSymbolUri: previous.setSymbolUri,
    cardBackId: previous.cardBackId,
  };
}

function createStarterCard(): CardDraft {
  return createRandomCard(INITIAL_CARD);
}

function getNextCollectorNumber(value: string): string {
  const match = value.trim().match(/^(\D*)(\d+)(\D*)$/);

  if (!match) {
    return value.trim() ? value : "2";
  }

  const [, prefix, numberText, suffix] = match;
  const nextNumber = String(Number(numberText) + 1).padStart(numberText.length, "0");

  return `${prefix}${nextNumber}${suffix}`;
}

function getPreviewActionMenuCenterOffset(actionIndex: number, actionCount: number) {
  const rowWidth =
    actionCount * PREVIEW_ACTION_BUTTON_SIZE +
    Math.max(0, actionCount - 1) * PREVIEW_ACTION_BUTTON_GAP;
  const actionCenter =
    actionIndex * (PREVIEW_ACTION_BUTTON_SIZE + PREVIEW_ACTION_BUTTON_GAP) +
    PREVIEW_ACTION_BUTTON_SIZE / 2;

  return actionCenter - rowWidth / 2;
}

function FrameChangeMenu({
  open,
  menuWidth,
  menuCenterOffset = 0,
  frameIdentity,
  selectedFrameTreatment,
  selectedShowcaseFrame,
  compatibleFrameTreatments,
  onToggle,
  onChangeFrameTreatment,
  onChangeShowcaseFrame,
}: {
  open: boolean;
  menuWidth: number;
  menuCenterOffset?: number;
  frameIdentity: FrameIdentity;
  selectedFrameTreatment: FrameTreatment;
  selectedShowcaseFrame: ShowcaseFrameId;
  compatibleFrameTreatments: FrameTreatment[];
  onToggle: () => void;
  onChangeFrameTreatment: (frameTreatment: FrameTreatment) => void;
  onChangeShowcaseFrame: (showcaseFrame: ShowcaseFrameId) => void;
}) {
  const { height: viewportHeight } = useWindowDimensions();
  const hasAlternateFrameTypes = compatibleFrameTreatments.length > 1;
  const frameMenuMaxHeight = Math.min(432, Math.max(240, viewportHeight * 0.52));

  return (
    <View
      style={{
        width: PREVIEW_ACTION_BUTTON_SIZE,
        minHeight: 48,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: open ? 20 : 1,
      }}
    >
      <PreviewActionButton
        accessibilityLabel={open ? "Close change frame menu" : "Open change frame menu"}
        selected={open}
        onPress={onToggle}
        icon={<Palette size={21} color={open ? "#ffffff" : "#20242d"} strokeWidth={2.5} />}
      />

      {open ? (
        <View
          style={{
            position: "absolute",
            bottom: 56,
            left: -(menuWidth - PREVIEW_ACTION_BUTTON_SIZE) / 2 - menuCenterOffset,
            width: menuWidth,
            borderRadius: 12,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: "#d8dbe2",
            backgroundColor: "#ffffff",
            padding: 8,
            gap: 8,
            shadowColor: "#000000",
            shadowOpacity: 0.18,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
            elevation: 12,
          }}
        >
          <FrameTreatmentPreviewGrid
            frameIdentity={frameIdentity}
            treatments={compatibleFrameTreatments}
            selectedTreatment={selectedFrameTreatment}
            selectedShowcaseFrame={selectedShowcaseFrame}
            hasAlternateFrameTypes={hasAlternateFrameTypes}
            menuWidth={menuWidth}
            maxHeight={frameMenuMaxHeight}
            showBack={false}
            onBack={onToggle}
            onSelect={(frameTreatment) => {
              if (frameTreatment === "showcase") {
                onChangeShowcaseFrame(selectedShowcaseFrame);
                return;
              }

              onChangeFrameTreatment(frameTreatment);
            }}
            onSelectShowcase={onChangeShowcaseFrame}
          />
        </View>
      ) : null}
    </View>
  );
}

function CardFontLoadingPreview({
  width,
  aspectRatio,
}: {
  width: number;
  aspectRatio: number;
}) {
  return (
    <View
      style={{
        width,
        aspectRatio,
        pointerEvents: "none",
        borderRadius: 20,
        backgroundColor: "#151515",
        padding: 16,
        boxShadow: "0 16px 32px rgba(0, 0, 0, 0.24)",
      }}
    >
      <View
        style={{
          flex: 1,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.24)",
          backgroundColor: "#d7c98d",
          opacity: 0.45,
        }}
      />
    </View>
  );
}

export default function App() {
  useMobileWebInputZoomGuard();

  const [card, setCard] = useState<CardDraft>(() => createStarterCard());
  const [activeSection, setActiveSection] = useState<CardSection | null>(null);
  const [sheetSection, setSheetSection] = useState<CardSection | null>(null);
  const previewBoundsRef = useRef<CoordinateBounds | null>(null);
  const previewContainerRef = useRef<View>(null);
  const singleExportContainerRef = useRef<View>(null);
  const batchExportContainerRef = useRef<View>(null);
  const skipNextAddPressRef = useRef(false);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("edit");
  const [customKeywordDefinitions, setCustomKeywordDefinitions] = useState<KeywordDefinition[]>([]);
  const [cardSets, setCardSets] = useState<CardSet[]>(createDefaultCardSets);
  const [frameTemplates, setFrameTemplates] = useState<CardFrameTemplate[]>([]);
  const [artLibraryEntries, setArtLibraryEntries] = useState<ArtLibraryEntry[]>([]);
  const [selectedSetId, setSelectedSetId] = useState("main-set");
  const [activeSetCardId, setActiveSetCardId] = useState<string | null>(null);
  const [cardHasUnsavedEdits, setCardHasUnsavedEdits] = useState(false);
  const [newSetName, setNewSetName] = useState("");
  const [previewRotated, setPreviewRotated] = useState(false);
  const [suppressPreviewFlipTransition, setSuppressPreviewFlipTransition] = useState(false);
  const [cardActionMenuOpen, setCardActionMenuOpen] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [newCardMenuOpen, setNewCardMenuOpen] = useState(false);
  const [newCardPrimaryAction, setNewCardPrimaryAction] = useState<NewCardPrimaryAction>("saveAsk");
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [randomizeSavePromptOpen, setRandomizeSavePromptOpen] = useState(false);
  const [physicalBackMenuOpen, setPhysicalBackMenuOpen] = useState(false);
  const [artSourceOpen, setArtSourceOpen] = useState(false);
  const [artGeneratorOpen, setArtGeneratorOpen] = useState(false);
  const [artGeneratorRequest, setArtGeneratorRequest] = useState("");
  const [artGeneratorVariationSeed, setArtGeneratorVariationSeed] = useState(0);
  const [artGeneratorBusy, setArtGeneratorBusy] = useState(false);
  const [artGeneratorError, setArtGeneratorError] = useState<string | null>(null);
  const [rulesTextFixerBusy, setRulesTextFixerBusy] = useState(false);
  const [rulesTextFixerError, setRulesTextFixerError] = useState<string | null>(null);
  const [openAiApiKey, setOpenAiApiKey] = useState("");
  const [artAdjustOpen, setArtAdjustOpen] = useState(false);
  const [physicalBackVisible, setPhysicalBackVisible] = useState(false);
  const [singleExportTarget, setSingleExportTarget] = useState<FlatCardExportTarget | null>(null);
  const [webPhotoExport, setWebPhotoExport] = useState<WebPhotoExport | null>(null);
  const [webPhotoExportBusy, setWebPhotoExportBusy] = useState(false);
  const [batchExportCard, setBatchExportCard] = useState<CardDraft | null>(null);
  const [batchExportProgress, setBatchExportProgress] = useState<BatchExportProgress | null>(null);
  const [activeDraftHydrated, setActiveDraftHydrated] = useState(false);
  const [setsHydrated, setSetsHydrated] = useState(false);
  const [frameTemplatesHydrated, setFrameTemplatesHydrated] = useState(false);
  const [artLibraryHydrated, setArtLibraryHydrated] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const { width, height } = useWindowDimensions();
  const [cardFontsLoaded, cardFontLoadError] = useFonts(FULL_MAGIC_PACK.fonts);
  const cardFontsReady = cardFontsLoaded || Boolean(cardFontLoadError);

  const faceCard = useMemo(() => getEditableCardFace(card), [card]);
  const frame = useMemo(() => inferFrameStyle(faceCard), [faceCard]);
  const isSplitFrame = isSplitTypeFrame(card);
  const splitFrameSummary = useMemo(() => {
    if (!isSplitTypeFrame(card)) {
      return "";
    }

    const leftHalf = getSplitHalf(card, "left");
    const rightHalf = getSplitHalf(card, "right");
    const leftFrame = inferFrameIdentity(toSplitHalfCard(card, leftHalf));
    const rightFrame = inferFrameIdentity(toSplitHalfCard(card, rightHalf));
    const layout = getSplitLayout(card);
    const layoutLabel =
      layout === "aftermath" ? "Aftermath layout" : layout === "fuse" ? "Fuse layout" : "Split layout";

    return `${layoutLabel} · ${leftHalf.name || "Left"} ${FRAME_SELECTION_LABELS[leftFrame]} / ${
      rightHalf.name || "Right"
    } ${FRAME_SELECTION_LABELS[rightFrame]}`;
  }, [card]);
  const selectedSet = cardSets.find((set) => set.id === selectedSetId) ?? cardSets[0];
  const activeFrameTreatment = getActiveFrameTreatment(card);
  const activeShowcaseFrame = getActiveShowcaseFrame(card);
  const frameTypeLabel = isSplitFrame
    ? splitFrameSummary
    : activeFrameTreatment === "showcase"
      ? SHOWCASE_FRAME_LABELS[activeShowcaseFrame]
      : FRAME_TREATMENT_LABELS[activeFrameTreatment];
  const headerSubtitle = `v${CARDMAGIC_APP_VERSION} · ${frameTypeLabel} · ${selectedSet?.name ?? "No set"}`;
  const previewCard = useMemo(
    () => withResolvedCardBack(getSetNumberedPreviewCard(card, selectedSet?.cards ?? [], activeSetCardId), selectedSet),
    [activeSetCardId, card, selectedSet],
  );
  const cardWidth = Math.min(374, Math.max(272, width - 32));
  const previewTypeFrame = getPreviewTypeFrame(card);
  const hasBackFace = isTransformingTypeFrame(card);
  const showingPhysicalBack = !hasBackFace && physicalBackVisible;
  const previewFrameIdentity = inferFrameIdentity(faceCard);
  const compatibleFrameTreatments = getCompatibleFrameTreatments(previewTypeFrame);
  const previewAspectRatio = showingPhysicalBack
    ? CARD_BACK_PREVIEW_ASPECT_RATIO
    : getTypeFrameSpec(previewTypeFrame).aspectRatio;
  const previewFlipKey =
    showingPhysicalBack
      ? `card-back:${previewCard.cardBackId ?? DEFAULT_CARD_BACK_ID}`
      : card.typeFrame === "dfc" || card.typeFrame === "battle"
      ? `${card.typeFrame}:${card.dfcFace ?? "front"}`
      : "front";
  const previewInteractionEnabled = sheetSection === null && activeSection === null;
  const hasRotateControl = !showingPhysicalBack && hasPreviewRotation(previewTypeFrame);
  const hasDeleteBackControl = hasBackFace;
  const previewRotationDegrees =
    hasRotateControl && previewRotated ? getFaceUpPreviewRotationDegrees(previewTypeFrame) : 0;
  const previewQuarterTurn = previewRotationDegrees % 180 !== 0;
  const previewAvailableOuterHeight = Math.max(
    180,
    height -
      EDIT_TAB_VERTICAL_CHROME_HEIGHT -
      PREVIEW_ACTION_ROW_HEIGHT -
      (keyboardVisible ? 0 : BOTTOM_TAB_BAR_HEIGHT),
  );
  const previewRenderWidth = Math.max(
    180,
    previewQuarterTurn
      ? Math.min(cardWidth * previewAspectRatio, previewAvailableOuterHeight)
      : Math.min(cardWidth, previewAvailableOuterHeight * previewAspectRatio),
  );
  const previewSurfaceWidth = previewQuarterTurn
    ? previewRenderWidth / previewAspectRatio
    : previewRenderWidth;
  const nextFaceLabel = hasBackFace
    ? isDfcBackFace(card) ? "front face" : "back face"
    : showingPhysicalBack ? "front face" : "card back";
  const bottomActionCount = 3 + (hasRotateControl ? 1 : 0) + (hasDeleteBackControl ? 1 : 0);
  const editActionIndex = (hasDeleteBackControl ? 1 : 0) + (hasRotateControl ? 1 : 0);
  const frameActionIndex = bottomActionCount - 1;
  const editMenuCenterOffset = getPreviewActionMenuCenterOffset(editActionIndex, bottomActionCount);
  const frameMenuCenterOffset = getPreviewActionMenuCenterOffset(frameActionIndex, bottomActionCount);

  useEffect(() => {
    if (!suppressPreviewFlipTransition) {
      return;
    }

    const resetSuppression = setTimeout(() => {
      setSuppressPreviewFlipTransition(false);
    }, 0);

    return () => {
      clearTimeout(resetSuppression);
    };
  }, [previewFlipKey, suppressPreviewFlipTransition]);

  useEffect(() => {
    let cancelled = false;

    loadStoredActiveCardDraft().then((storedCard) => {
      if (cancelled) {
        return;
      }

      if (storedCard) {
        setCard(storedCard);
      }

      setActiveDraftHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadStoredCardSets().then((storedSets) => {
      if (cancelled) {
        return;
      }

      if (storedSets?.length) {
        const normalizedSets = normalizeCardSets(storedSets);

        setCardSets(normalizedSets);
        setSelectedSetId((current) =>
          normalizedSets.some((set) => set.id === current) ? current : normalizedSets[0].id,
        );
      }

      setSetsHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadStoredFrameTemplates().then((storedTemplates) => {
      if (cancelled) {
        return;
      }

      if (storedTemplates) {
        setFrameTemplates(storedTemplates);
      }

      setFrameTemplatesHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadStoredArtLibrary().then((storedEntries) => {
      if (cancelled) {
        return;
      }

      if (storedEntries) {
        setArtLibraryEntries(storedEntries);
      }

      setArtLibraryHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadStoredOpenAiApiKey().then((storedApiKey) => {
      if (!cancelled) {
        setOpenAiApiKey(storedApiKey);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeDraftHydrated) {
      return;
    }

    const persistActiveDraft = setTimeout(() => {
      void storeActiveCardDraft(card);
    }, 450);

    return () => {
      clearTimeout(persistActiveDraft);
    };
  }, [activeDraftHydrated, card]);

  useEffect(() => {
    if (!setsHydrated) {
      return;
    }

    void storeCardSets(cardSets);
  }, [cardSets, setsHydrated]);

  useEffect(() => {
    if (!frameTemplatesHydrated) {
      return;
    }

    void storeFrameTemplates(frameTemplates);
  }, [frameTemplates, frameTemplatesHydrated]);

  useEffect(() => {
    if (!artLibraryHydrated) {
      return;
    }

    void storeArtLibrary(artLibraryEntries);
  }, [artLibraryEntries, artLibraryHydrated]);

  useEffect(() => {
    setPreviewRotated(false);
  }, [card.typeFrame]);

  useEffect(() => {
    if (hasBackFace) {
      setPhysicalBackVisible(false);
    }
  }, [hasBackFace]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const measurePreviewContainer = () => {
    previewContainerRef.current?.measureInWindow((x, y, previewWidth, previewHeight) => {
      previewBoundsRef.current = { x, y, width: previewWidth, height: previewHeight };
    });
  };

  const deselectWhenTapStartsOutsideCard = (event: PointerEvent | GestureResponderEvent) => {
    if ((!activeSection && !keyboardVisible) || sheetSection) {
      return false;
    }

    const bounds = previewBoundsRef.current;

    if (!bounds) {
      setActiveSection(null);
      Keyboard.dismiss();
      return false;
    }

    const { pageX, pageY } = event.nativeEvent;
    const insidePreview =
      pageX >= bounds.x &&
      pageX <= bounds.x + bounds.width &&
      pageY >= bounds.y &&
      pageY <= bounds.y + bounds.height;

    if (!insidePreview) {
      setActiveSection(null);
      Keyboard.dismiss();
    }

    return false;
  };

  const updateCard = (patch: Partial<CardDraft>) => {
    setCardHasUnsavedEdits(true);
    setCard((current) => ({
      ...current,
      ...patch,
      ...getFrameGeometryArtResetPatch(current, patch),
    }));
  };

  const updateCurrentFace = (patch: Partial<CardDraft>) => {
    updateCard(toDfcFacePatch(card, patch));
  };

  const artGeneratorPrompt = useMemo(
    () => buildArtGeneratorPrompt(card, artGeneratorRequest, { variationSeed: artGeneratorVariationSeed }),
    [artGeneratorRequest, artGeneratorVariationSeed, card],
  );

  const openArtSourceOptions = () => {
    setActiveSection("art");
    setSheetSection(null);
    setArtGeneratorError(null);
    setArtSourceOpen(true);
  };

  const openArtGenerator = () => {
    setArtGeneratorRequest(getDefaultArtGeneratorRequest(card));
    setArtGeneratorVariationSeed(Math.random());
    setArtGeneratorError(null);
    setArtSourceOpen(false);
    setArtGeneratorOpen(true);
  };

  const applyArtUri = (artUri: string) => {
    if (isDfcBackFace(card)) {
      updateCard({
        backArtUri: artUri,
        backArtTransform: { offsetX: 0, offsetY: 0, scale: 1 },
      });
      return;
    }

    updateCard({
      artUri,
      artTransform: { offsetX: 0, offsetY: 0, scale: 1 },
    });
  };

  const addArtLibraryEntry = (source: ArtLibrarySource, uri: string) => {
    const now = new Date().toISOString();
    const labelBase = faceCard.name.trim() || (source === "generated" ? "Generated art" : "Added art");

    setArtLibraryEntries((current) =>
      normalizeArtLibraryEntries([
        {
          id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          uri,
          source,
          colorIdentity: getCardArtLibraryColorIdentity(card),
          label: labelBase,
          createdAt: now,
        },
        ...current,
      ]),
    );
  };

  const selectArtLibraryEntry = (entry: ArtLibraryEntry) => {
    applyArtUri(entry.uri);
    setActiveSection("art");
    setSheetSection(null);
    setArtSourceOpen(false);
    setArtAdjustOpen(true);
  };

  const generateArt = async () => {
    const apiKey = openAiApiKey.trim();

    if (!apiKey) {
      setArtGeneratorError("Enter an OpenAI API key before generating art.");
      return;
    }

    setArtGeneratorBusy(true);
    setArtGeneratorError(null);
    setArtGeneratorOpen(false);
    setArtSourceOpen(false);
    setArtAdjustOpen(false);
    setActiveSection("art");
    setSheetSection(null);

    try {
      await storeOpenAiApiKey(apiKey);
      const artUri = await generateOpenAiImageUri({
        apiKey,
        prompt: artGeneratorPrompt,
      });

      applyArtUri(artUri);
      addArtLibraryEntry("generated", artUri);
      setActiveSection("art");
      setSheetSection(null);
      setArtGeneratorOpen(false);
      setArtAdjustOpen(true);
    } catch (error) {
      console.warn("Unable to generate card art.", error);
      setArtGeneratorError(error instanceof Error ? error.message : "CardMagic could not generate art.");
      setArtGeneratorOpen(true);
    } finally {
      setArtGeneratorBusy(false);
    }
  };

  const fixRulesTextWithAi = async () => {
    const apiKey = openAiApiKey.trim();
    const sourceRulesText = getEditableCardFace(card).rulesText.trim();

    if (!apiKey) {
      setRulesTextFixerError("Enter an OpenAI API key before fixing rules text.");
      return;
    }

    if (!sourceRulesText) {
      setRulesTextFixerError("Add rules text before running the templating fixer.");
      return;
    }

    setRulesTextFixerBusy(true);
    setRulesTextFixerError(null);

    try {
      await storeOpenAiApiKey(apiKey);
      const rulesText = await generateOpenAiRulesText({
        apiKey,
        prompt: buildRulesTextFixerPrompt(card, customKeywordDefinitions),
      });

      if (!rulesText) {
        throw new Error("OpenAI returned an empty rules text field.");
      }

      updateCurrentFace({ rulesText });
    } catch (error) {
      console.warn("Unable to fix rules text.", error);
      setRulesTextFixerError(error instanceof Error ? error.message : "CardMagic could not fix the rules text.");
    } finally {
      setRulesTextFixerBusy(false);
    }
  };

  const selectPreviewSection = (section: CardSection, options?: { openSheet?: boolean }) => {
    if (section === "art" && options?.openSheet) {
      setActiveSection(section);
      openArtSourceOptions();
      return;
    }

    if (shouldUseSheetForMobileWebCardTextEditing(section)) {
      setActiveSection(null);
      setSheetSection(section);
      return;
    }

    setActiveSection(section);

    if (options?.openSheet || section === "frame" || section === "printing") {
      setSheetSection(section);
      return;
    }

    if (
      section === "rules" &&
      faceCard.rulesText.trim().length === 0 &&
      faceCard.flavorText.trim().length === 0
    ) {
      setSheetSection(section);
    }
  };

  const pickArt = async () => {
    setArtSourceOpen(false);
    setArtGeneratorOpen(false);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Photos Permission", "Enable photo library access to use local art.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      aspect: getArtPickerAspect(card),
      quality: 0.86,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      const artUri = await normalizePickedImage(result.assets[0], {
        maxDimension: CARD_ART_MAX_DIMENSION,
        compress: 0.86,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      applyArtUri(artUri);
      addArtLibraryEntry("added", artUri);

      setActiveSection("art");
      setSheetSection(null);
      setArtAdjustOpen(true);
    }
  };

  const editArtTransform = () => {
    setActiveSection("art");
    setSheetSection(null);
    setArtSourceOpen(false);
    setArtGeneratorOpen(false);
    setArtAdjustOpen(true);
  };

  const pickSetSymbol = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Photos Permission", "Enable photo library access to upload a set symbol.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.95,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      const setSymbolUri = await normalizePickedImage(result.assets[0], {
        maxDimension: AUXILIARY_IMAGE_MAX_DIMENSION,
        compress: 0.9,
        format: ImageManipulator.SaveFormat.PNG,
      });

      updateCard({ setSymbolUri });
      setActiveSection("printing");
      setSheetSection("printing");
    }
  };

  const pickWatermark = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Photos Permission", "Enable photo library access to upload a watermark.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.95,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      const watermarkUri = await normalizePickedImage(result.assets[0], {
        maxDimension: AUXILIARY_IMAGE_MAX_DIMENSION,
        compress: 0.9,
        format: ImageManipulator.SaveFormat.PNG,
      });

      updateCard({
        watermarkUri,
        watermarkPreset: undefined,
        watermarkOpacity: card.watermarkOpacity ?? 0.16,
        watermarkScale: card.watermarkScale ?? 1,
      });
      setActiveSection("watermark");
      setSheetSection("watermark");
    }
  };

  const saveCardToSet = (
    targetSetId: string,
    options?: {
      notify?: boolean;
      updateCurrentCard?: boolean;
      clearDirty?: boolean;
    },
  ) => {
    const activeSnapshotId = targetSetId === selectedSetId ? activeSetCardId : null;
    const result = saveCardDraftIntoSet(cardSets, targetSetId, card, activeSnapshotId);

    if (!result) {
      return null;
    }

    setCardSets(result.sets);
    setSelectedSetId(result.setId);
    setActiveSetCardId(result.snapshot.id);
    setPhysicalBackVisible(false);

    if (options?.updateCurrentCard !== false) {
      setCard(cloneCardDraft(result.snapshot.card));
    }

    if (options?.clearDirty !== false) {
      setCardHasUnsavedEdits(false);
    }

    if (options?.notify) {
      Alert.alert("Card saved", `${result.snapshot.card.name || "Untitled Card"} was saved to ${result.setName}.`);
    }

    return result;
  };

  const saveCardToSelectedSet = (options?: {
    notify?: boolean;
    updateCurrentCard?: boolean;
    clearDirty?: boolean;
  }) => {
    return saveCardToSet(selectedSetId, options);
  };

  const autosaveCurrentCardIfEdited = () => {
    if (!cardHasUnsavedEdits) {
      return null;
    }

    return saveCardToSelectedSet({ updateCurrentCard: false });
  };

  const resetCard = () => {
    autosaveCurrentCardIfEdited();
    setCard(createStarterCard());
    setActiveSetCardId(null);
    setCardHasUnsavedEdits(true);
    setActiveSection(null);
    setSheetSection(null);
    setPhysicalBackVisible(false);
    setEditMenuOpen(false);
    setCardActionMenuOpen(false);
    setNewCardMenuOpen(false);
    setShareMenuOpen(false);
    setPhysicalBackMenuOpen(false);
  };

  const closeTransientMenus = () => {
    setActiveSection(null);
    setSheetSection(null);
    setPhysicalBackVisible(false);
    setEditMenuOpen(false);
    setCardActionMenuOpen(false);
    setNewCardMenuOpen(false);
    setShareMenuOpen(false);
    setPhysicalBackMenuOpen(false);
  };

  const performRandomizeCard = () => {
    setCard((current) => createRandomCard(current));
    setActiveSetCardId(null);
    setCardHasUnsavedEdits(false);
    setRandomizeSavePromptOpen(false);
    closeTransientMenus();
  };

  const randomizeCard = () => {
    closeTransientMenus();

    if (cardHasUnsavedEdits) {
      setRandomizeSavePromptOpen(true);
      return;
    }

    performRandomizeCard();
  };

  const saveCardToSetThenRandomize = (targetSetId: string) => {
    saveCardToSet(targetSetId, { updateCurrentCard: false });
    performRandomizeCard();
  };

  const saveCurrentCardToSelectedSet = (options?: { notify?: boolean }) => {
    setShareMenuOpen(false);

    saveCardToSelectedSet({ notify: options?.notify });
  };

  const exportCurrentCard = async () => {
    setCardActionMenuOpen(false);
    setEditMenuOpen(false);
    setShareMenuOpen(false);
    setPhysicalBackMenuOpen(false);

    await exportCardMagicJson(getExportFileName(card.name || "untitled-card", "card"), {
      schemaVersion: 1,
      kind: "card",
      exportedAt: new Date().toISOString(),
      card: cloneCardDraft(previewCard),
    });
  };

  const exportCurrentCardPng = async () => {
    setCardActionMenuOpen(false);
    setEditMenuOpen(false);
    setShareMenuOpen(false);
    setPhysicalBackMenuOpen(false);

    const fileName = getExportFileName(card.name || "untitled-card", "card").replace(/\.json$/, ".png");
    const webFileHandle =
      Platform.OS === "web" ? await promptForWebSaveFileHandle(fileName, "image/png") : null;

    if (webFileHandle === "cancelled") {
      return;
    }

    const exportTarget: FlatCardExportTarget = showingPhysicalBack
      ? {
          kind: "back",
          cardBackId: previewCard.cardBackId ?? DEFAULT_CARD_BACK_ID,
        }
      : {
          kind: "card",
          card: cloneCardDraft(previewCard),
        };

    try {
      setWebPhotoExportBusy(Platform.OS === "web");
      setSingleExportTarget(exportTarget);
      await waitForRenderFrame(180);

      if (Platform.OS === "web") {
        const dataUri = normalizeWebPngExportUri(await captureCardMagicPng(singleExportContainerRef.current));

        if (webFileHandle) {
          const blob = await webPngExportUriToBlob(dataUri);
          await writeWebFileHandle(webFileHandle, blob);
          return;
        }

        setWebPhotoExport({ fileName, dataUri });
        return;
      }

      await exportCardMagicPng(fileName, singleExportContainerRef.current);
    } catch (error) {
      console.warn("Card photo export unavailable.", error);
      const message =
        Platform.OS === "web"
          ? `CardMagic could not render a downloadable PNG in this browser. ${
              error instanceof Error ? error.message : ""
            }`.trim()
          : "CardMagic could not save the rendered card photo.";

      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(message);
      } else {
        Alert.alert("PNG export unavailable", message);
      }
    } finally {
      setWebPhotoExportBusy(false);
      setSingleExportTarget(null);
    }
  };

  const exportSelectedSet = async () => {
    setShareMenuOpen(false);

    if (!selectedSet) {
      return;
    }

    await exportCardMagicJson(getExportFileName(selectedSet.name, "set"), createSetExportPayload(selectedSet));
  };

  const renderBatchCardPng = async (snapshot: SetCardSnapshot, set: CardSet, index: number) => {
    if (Platform.OS !== "web" && !hasNativeModule("RNViewShot")) {
      throw new Error("RNViewShot native module is unavailable.");
    }

    const captureRef = await loadViewShotCaptureRef();
    const cardName = getSetCardDisplayCard(snapshot).name || `Card ${index + 1}`;
    const fileName = `${String(index + 1).padStart(3, "0")}-${getExportFileBaseName(cardName)}.png`;

    setBatchExportCard(cloneCardDraft(getSetCardPreviewCard(snapshot, set)));
    await waitForRenderFrame(180);

    if (!batchExportContainerRef.current) {
      throw new Error("CardMagic could not find the batch render surface.");
    }

    const result = await captureRef(batchExportContainerRef.current, {
      format: "png",
      quality: 1,
      result: Platform.OS === "web" ? "data-uri" : "tmpfile",
    });

    return {
      fileName,
      bytes: await readPngCaptureBytes(result),
    };
  };

  const exportSelectedSetBatch = async () => {
    if (!selectedSet || selectedSet.cards.length === 0) {
      Alert.alert("Batch export unavailable", "Save at least one card to the selected set first.");
      return;
    }

    if (!cardFontsReady) {
      Alert.alert("Batch export unavailable", "CardMagic is still loading card fonts.");
      return;
    }

    const normalizedSelectedSet = normalizeCardSet(selectedSet);
    const setSnapshot: CardSet = {
      ...normalizedSelectedSet,
      cards: normalizedSelectedSet.cards.map((snapshot) => ({
        ...snapshot,
        card: cloneCardDraft(snapshot.card),
      })),
    };

    try {
      setCardActionMenuOpen(false);
      setEditMenuOpen(false);
      setShareMenuOpen(false);
      const JSZip = (await import("jszip")).default;
      const { PDFDocument } = await import("pdf-lib");
      const archive = new JSZip();
      const pngFolder = archive.folder("png");
      const setPayload = createSetExportPayload(setSnapshot);
      const setJson = `${JSON.stringify(setPayload, null, 2)}\n`;
      const pdf = await PDFDocument.create();
      const pageWidth = 612;
      const pageHeight = 792;
      const margin = 18;
      const portraitCardWidth = 180;
      const portraitCardHeight = 252;
      const landscapeCardWidth = 252;
      const landscapeCardHeight = 180;
      const rowGap = 0;
      const columnGap = 0;
      let page = pdf.addPage([pageWidth, pageHeight]);
      let x = margin;
      let y = pageHeight - margin;
      let rowHeight = 0;

      archive.file("set.json", setJson);

      for (let index = 0; index < setSnapshot.cards.length; index += 1) {
        const snapshot = setSnapshot.cards[index];
        const displayCard = getSetCardDisplayCard(snapshot);

        setBatchExportProgress({
          phase: "rendering",
          current: index + 1,
          total: setSnapshot.cards.length,
          label: displayCard.name || `Card ${index + 1}`,
        });
        const renderedCard = await renderBatchCardPng(snapshot, setSnapshot, index);

        pngFolder?.file(renderedCard.fileName, renderedCard.bytes);

        const png = await pdf.embedPng(renderedCard.bytes);
        const imageAspectRatio = png.width / png.height;
        const isLandscape = imageAspectRatio > 1.05;
        const cardWidth = isLandscape ? landscapeCardWidth : portraitCardWidth;
        const cardHeight = isLandscape ? landscapeCardHeight : portraitCardHeight;

        if (x + cardWidth > pageWidth - margin + 0.01) {
          x = margin;
          y -= rowHeight + rowGap;
          rowHeight = 0;
        }

        if (y - cardHeight < margin - 0.01) {
          page = pdf.addPage([pageWidth, pageHeight]);
          x = margin;
          y = pageHeight - margin;
          rowHeight = 0;
        }

        page.drawImage(png, {
          x,
          y: y - cardHeight,
          width: cardWidth,
          height: cardHeight,
        });

        x += cardWidth + columnGap;
        rowHeight = Math.max(rowHeight, cardHeight);
      }

      setBatchExportProgress({
        phase: "packaging",
        current: setSnapshot.cards.length,
        total: setSnapshot.cards.length,
        label: "set.json, PNGs, and print-ready PDF",
      });
      archive.file("print-ready.pdf", await pdf.save());

      const archiveBytes = await archive.generateAsync({ type: "uint8array" });
      const fileName = `${getExportFileBaseName(setSnapshot.name)}-batch-export.zip`;

      if (Platform.OS === "web") {
        await shareOrDownloadWebFile(
          fileName,
          new Blob([getArrayBufferSlice(archiveBytes)], { type: "application/zip" }),
          "Export CardMagic set batch",
        );
      } else {
        await writeAndShareNativeBytes(fileName, archiveBytes, {
          dialogTitle: "Export CardMagic set batch",
          mimeType: "application/zip",
          UTI: "public.zip-archive",
        });
      }
    } catch (error) {
      console.warn("Set batch export unavailable.", error);
      Alert.alert(
        "Batch export unavailable",
        "CardMagic could not render and package the selected set from this app build.",
      );
    } finally {
      setBatchExportCard(null);
      setBatchExportProgress(null);
    }
  };

  const saveCurrentFrameTemplate = () => {
    const template = createFrameTemplateFromCard(card);

    setFrameTemplates((current) => [...current, template]);
    Alert.alert("Frame template saved", `${template.name} was added to your frame templates.`);
  };

  const applyFrameTemplate = (template: CardFrameTemplate) => {
    updateCard(getFrameTemplatePatch(template));
    setActiveSection("frame");
    setSheetSection(null);
    setPreviewRotated(false);
  };

  const removeFrameTemplate = (templateId: string) => {
    setFrameTemplates((current) => current.filter((template) => template.id !== templateId));
  };

  const exportFrameTemplates = async () => {
    await exportCardMagicJson(getExportFileName("cardmagic-frame-templates", "templates"), {
      schemaVersion: 1,
      kind: "frame-templates",
      exportedAt: new Date().toISOString(),
      templates: frameTemplates.map(cloneFrameTemplate),
    });
  };

  const importFrameTemplates = async () => {
    const imported = await importCardMagicJson();

    if (!imported || typeof imported !== "object") {
      return;
    }

    const payload = imported as Partial<CardMagicExport>;
    const templates =
      payload.kind === "frame-template" && isCardFrameTemplate(payload.template)
        ? [payload.template]
        : payload.kind === "frame-templates" && isCardFrameTemplateArray(payload.templates)
          ? payload.templates
          : [];

    if (templates.length === 0) {
      Alert.alert("Import failed", "That JSON file does not contain CardMagic frame templates.");
      return;
    }

    const timestamp = new Date().toISOString();
    const importedTemplates = templates.map((template) => ({
      ...cloneFrameTemplate(template),
      id: `frame-template-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      updatedAt: timestamp,
    }));

    setFrameTemplates((current) => [...current, ...importedTemplates]);
    Alert.alert("Templates imported", `${importedTemplates.length} frame template(s) were imported.`);
  };

  const startNextCard = (options?: { autosave?: boolean }) => {
    if (options?.autosave !== false) {
      autosaveCurrentCardIfEdited();
    }

    setCard((current) => createNextBlankCard(current));
    setActiveSetCardId(null);
    setCardHasUnsavedEdits(false);
    setActiveSection(null);
    setSheetSection(null);
    setPhysicalBackVisible(false);
    setEditMenuOpen(false);
    setCardActionMenuOpen(false);
    setNewCardMenuOpen(false);
    setShareMenuOpen(false);
  };

  const saveThenStartNextCard = () => {
    saveCurrentCardToSelectedSet();
    startNextCard({ autosave: false });
  };

  const saveAndAskToStartNewCard = () => {
    saveCurrentCardToSelectedSet();
    setNewCardMenuOpen(false);
    const savedMessage = `${card.name || "Untitled Card"} was saved to ${
      selectedSet?.name ?? "the current set"
    }.`;

    if (Platform.OS === "web" && typeof window !== "undefined") {
      if (window.confirm(`${savedMessage}\n\nStart new card?`)) {
        startNextCard({ autosave: false });
      }

      return;
    }

    Alert.alert(
      "Start new card?",
      savedMessage,
      [
        { text: "Keep editing", style: "cancel" },
        { text: "Start new card", onPress: () => startNextCard({ autosave: false }) },
      ],
    );
  };

  const runNewCardPrimaryAction = () => {
    if (skipNextAddPressRef.current) {
      skipNextAddPressRef.current = false;
      return;
    }

    switch (newCardPrimaryAction) {
      case "saveAsk":
        saveAndAskToStartNewCard();
        return;
      case "saveThenStart":
        saveThenStartNextCard();
        return;
      case "startBlank":
        startNextCard();
        return;
      case "randomize":
        randomizeCard();
        return;
      case "reset":
        resetCard();
        return;
    }
  };

  const selectNewCardPrimaryAction = (action: NewCardPrimaryAction) => {
    setNewCardPrimaryAction(action);
    setNewCardMenuOpen(false);
  };

  const addFlipSideToCard = () => {
    setCardHasUnsavedEdits(true);
    const nextDfcFace = physicalBackVisible ? "back" : "front";

    setSuppressPreviewFlipTransition(true);
    setCard((current) => {
      const typeFrame: NonNullable<CardDraft["typeFrame"]> =
        current.typeFrame === "battle" ? "battle" : "dfc";
      const dfcMode = typeFrame === "dfc" ? (current.dfcMode ?? "transform") : current.dfcMode;
      const nextCard: CardDraft = {
        ...current,
        typeFrame,
        dfcMode,
        dfcFace: "front" as const,
      };

      return {
        ...nextCard,
        ...getDefaultDfcBackPatch(nextCard),
        dfcFace: nextDfcFace,
      };
    });
    setPhysicalBackVisible(false);
    setActiveSection("identity");
    setSheetSection(null);
    setEditMenuOpen(false);
    setCardActionMenuOpen(false);
    setNewCardMenuOpen(false);
    setShareMenuOpen(false);
    setPhysicalBackMenuOpen(false);
  };

  const removeFlipSideFromCard = () => {
    setCardHasUnsavedEdits(true);
    setCard((current) => {
      const removesTransformFrame = current.typeFrame === "dfc" || current.typeFrame === "battle";

      return {
        ...current,
        typeFrame: removesTransformFrame ? undefined : current.typeFrame,
        dfcFace: undefined,
        dfcMode: removesTransformFrame ? undefined : current.dfcMode,
        backName: undefined,
        backBaseCardName: undefined,
        backManaCost: undefined,
        backTypeLine: undefined,
        backRulesText: undefined,
        backFlavorText: undefined,
        backKeywords: undefined,
        backPower: undefined,
        backToughness: undefined,
        backArtUri: undefined,
        backArtTransform: undefined,
        backFrameSelection: undefined,
        backFrameColors: undefined,
        backFrameTreatment: undefined,
        backShowcaseFrame: undefined,
      };
    });
    setPreviewRotated(false);
    setPhysicalBackVisible(false);
    setActiveSection("frame");
    setSheetSection(null);
    setEditMenuOpen(false);
    setCardActionMenuOpen(false);
    setNewCardMenuOpen(false);
    setShareMenuOpen(false);
    setPhysicalBackMenuOpen(false);
  };

  const confirmRemoveFlipSideFromCard = () => {
    const deleteBackCard = () => removeFlipSideFromCard();
    const message =
      "Delete the card on the back? This removes the back-face name, rules, art, frame, and stats from this card.";

    if (Platform.OS === "web" && typeof window !== "undefined") {
      if (window.confirm(message)) {
        deleteBackCard();
      }

      return;
    }

    Alert.alert("Delete back card?", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteBackCard },
    ]);
  };

  const flipCardFace = () => {
    if (!hasBackFace) {
      setPhysicalBackVisible((current) => !current);
      setPreviewRotated(false);
      setActiveSection(null);
      setSheetSection(null);
      setEditMenuOpen(false);
      setCardActionMenuOpen(false);
      setNewCardMenuOpen(false);
      setShareMenuOpen(false);
      setPhysicalBackMenuOpen(false);
      return;
    }

    const nextCard = { ...card, ...getNextDfcFacePatch(card) };

    setCard(nextCard);
    setPreviewRotated(hasPreviewRotation(getPreviewTypeFrame(nextCard)));
    setActiveSection(null);
    setSheetSection(null);
    setEditMenuOpen(false);
    setCardActionMenuOpen(false);
    setNewCardMenuOpen(false);
    setShareMenuOpen(false);
    setPhysicalBackMenuOpen(false);
  };

  const openCardBackSettings = () => {
    setActiveSection("printing");
    setSheetSection("printing");
    setEditMenuOpen(false);
    setCardActionMenuOpen(false);
    setNewCardMenuOpen(false);
    setShareMenuOpen(false);
    setPhysicalBackMenuOpen(false);
  };

  const openPhysicalBackActions = () => {
    setActiveSection(null);
    setSheetSection(null);
    setEditMenuOpen(false);
    setCardActionMenuOpen(false);
    setNewCardMenuOpen(false);
    setShareMenuOpen(false);
    setPhysicalBackMenuOpen(true);
  };

  const createSet = () => {
    const name = newSetName.trim();

    if (!name) {
      return;
    }

    const id = `set-${Date.now()}`;

    autosaveCurrentCardIfEdited();
    setCardSets((current) =>
      normalizeCardSets([...current, { id, name, cardBackId: DEFAULT_CARD_BACK_ID, cards: [] }]),
    );
    setSelectedSetId(id);
    setNewSetName("");
  };

  const renameSet = (setId: string, name: string) => {
    const nextName = name.trim();

    if (!nextName) {
      return;
    }

    setCardSets((current) =>
      normalizeCardSets(current.map((set) => (set.id === setId ? { ...set, name: nextName } : set))),
    );
  };

  const addCustomKeywordDefinition = (definition: KeywordDefinition) => {
    setCustomKeywordDefinitions((current) => {
      const existingIds = new Set(current.map((keyword) => keyword.id));

      if (!existingIds.has(definition.id)) {
        return [...current, definition];
      }

      let suffix = 2;
      let candidate = `${definition.id}-${suffix}`;

      while (existingIds.has(candidate)) {
        suffix += 1;
        candidate = `${definition.id}-${suffix}`;
      }

      return [...current, { ...definition, id: candidate }];
    });
  };

  const selectSet = (setId: string) => {
    if (setId !== selectedSetId) {
      autosaveCurrentCardIfEdited();
    }

    setSelectedSetId(setId);
  };

  const createCardInSet = (setId: string) => {
    autosaveCurrentCardIfEdited();
    setSelectedSetId(setId);
    startNextCard({ autosave: false });
    setInspectorTab("edit");
  };

  const openCardFromSet = (setId: string, snapshot: SetCardSnapshot) => {
    const savedResult = autosaveCurrentCardIfEdited();
    const nextSnapshot =
      savedResult?.setId === setId && savedResult.snapshot.id === snapshot.id
        ? savedResult.snapshot
        : snapshot;

    setSelectedSetId(setId);
    setCard(cloneCardDraft(nextSnapshot.card));
    setActiveSetCardId(nextSnapshot.id);
    setCardHasUnsavedEdits(false);
    setActiveSection(null);
    setSheetSection(null);
    setPreviewRotated(false);
    setPhysicalBackVisible(false);
    setInspectorTab("edit");
  };

  const removeCardFromSet = (setId: string, cardId: string) => {
    if (activeSetCardId === cardId) {
      setActiveSetCardId(null);
    }

    setCardSets((current) =>
      current.map((set) =>
        set.id === setId
          ? normalizeCardSet({ ...set, cards: set.cards.filter((setCard) => setCard.id !== cardId) })
          : set,
      ),
    );
  };

  const updateSetCardBack = (setId: string, cardBackId: CardBackId) => {
    setCardSets((current) =>
      current.map((set) => (set.id === setId ? normalizeCardSet({ ...set, cardBackId }) : set)),
    );
  };

  const removeSet = (setId: string) => {
    const nextSets = cardSets.filter((set) => set.id !== setId);
    const fallbackSet = nextSets[0] ?? {
      id: "main-set",
      name: "Main Set",
      cardBackId: DEFAULT_CARD_BACK_ID,
      cards: [],
    };
    const resolvedSets = normalizeCardSets(nextSets.length > 0 ? nextSets : [fallbackSet]);

    setCardSets(resolvedSets);
    setActiveSetCardId(null);

    if (selectedSetId === setId || !resolvedSets.some((set) => set.id === selectedSetId)) {
      setSelectedSetId(fallbackSet.id);
    }
  };

  const selectInspectorTab = (tab: InspectorTab) => {
    const nextTab: VisibleInspectorTab = tab === "keywords" ? "edit" : tab;

    setActiveSection(null);
    setEditMenuOpen(false);
    setCardActionMenuOpen(false);
    setNewCardMenuOpen(false);
    setShareMenuOpen(false);
    setInspectorTab(nextTab);
  };

  return (
    <HybridSymbolStyleProvider>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#f2f3f0" }}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
          style={{ flex: 1 }}
        >
          <ScrollView
            key={inspectorTab}
            contentInsetAdjustmentBehavior="automatic"
            keyboardDismissMode="none"
            keyboardShouldPersistTaps="always"
            onPointerDown={deselectWhenTapStartsOutsideCard}
            onStartShouldSetResponderCapture={deselectWhenTapStartsOutsideCard}
            onTouchStart={deselectWhenTapStartsOutsideCard}
            onScroll={measurePreviewContainer}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 22,
              paddingBottom: 78,
              gap: 18,
              alignItems: "center",
            }}
          >
            {inspectorTab === "edit" ? (
              <View
                style={{
                  width: "100%",
                  maxWidth: cardWidth,
                  flexDirection: "column",
                  gap: 18,
                  alignItems: "center",
                }}
              >
                <View style={{ width: cardWidth, gap: 14, alignItems: "center" }}>
                  <View
                    style={{
                      width: "100%",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      position: "relative",
                      zIndex: shareMenuOpen || newCardMenuOpen ? 30 : 1,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        selectable
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={{
                          color: "#101318",
                          fontSize: 30,
                          fontWeight: "900",
                        }}
                      >
                        CardMagic
                      </Text>
                      <Text
                        selectable
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={{
                          color: "#5f6570",
                          fontSize: 13,
                          fontWeight: "700",
                        }}
                      >
                        {headerSubtitle}
                      </Text>
                    </View>
                    <TopShareMenu
                      open={shareMenuOpen}
                      selectedSet={selectedSet}
                      onToggle={() => {
                        setNewCardMenuOpen(false);
                        setEditMenuOpen(false);
                        setCardActionMenuOpen(false);
                        setShareMenuOpen((current) => !current);
                      }}
                      onSaveToSet={() => saveCurrentCardToSelectedSet({ notify: true })}
                      onExportCurrentCard={exportCurrentCard}
                      onExportCurrentCardImage={exportCurrentCardPng}
                      onExportSelectedSet={exportSelectedSet}
                      onExportSelectedSetBatch={exportSelectedSetBatch}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Run ${getNewCardActionLabel(newCardPrimaryAction)}`}
                      onPress={runNewCardPrimaryAction}
                      onLongPress={() => {
                        skipNextAddPressRef.current = true;
                        setEditMenuOpen(false);
                        setCardActionMenuOpen(false);
                        setShareMenuOpen(false);
                        setNewCardMenuOpen((current) => !current);
                      }}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: "#151820",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: "#151820",
                      }}
                    >
                      {getNewCardActionIcon(newCardPrimaryAction, "#ffffff", 22)}
                    </Pressable>
                  </View>

                  {newCardMenuOpen ? (
                    <QuickNewCardMenu
                      selectedAction={newCardPrimaryAction}
                      onSelectAction={selectNewCardPrimaryAction}
                    />
                  ) : null}

                  <View
                    ref={previewContainerRef}
                    collapsable={false}
                    onLayout={measurePreviewContainer}
                    style={{ width: previewSurfaceWidth }}
                  >
                    {cardFontsReady ? (
                      <>
                        <CardTransformSurface
                          width={previewRenderWidth}
                          aspectRatio={previewAspectRatio}
                          flipKey={previewFlipKey}
                          animateFlipTransition={!suppressPreviewFlipTransition}
                          interactive={previewInteractionEnabled}
                          rotationDegrees={previewRotationDegrees}
                          slowPivot={previewInteractionEnabled}
                        >
                          {showingPhysicalBack ? (
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel="Edit physical card back"
                              onPress={openPhysicalBackActions}
                            >
                              <CardBackPreview
                                cardBackId={previewCard.cardBackId ?? DEFAULT_CARD_BACK_ID}
                                width={previewRenderWidth}
                              />
                            </Pressable>
                          ) : (
                            <CardPreview
                              card={previewCard}
                              activeSection={activeSection}
                              width={previewRenderWidth}
                              artGenerating={artGeneratorBusy}
                              onSectionPress={selectPreviewSection}
                              onChange={updateCard}
                            />
                          )}
                        </CardTransformSurface>
                      {physicalBackMenuOpen && showingPhysicalBack ? (
                        <PhysicalBackActionsMenu
                          width={Math.min(304, Math.max(236, previewRenderWidth - 32))}
                          onChangeBack={openCardBackSettings}
                          onAddCardBack={addFlipSideToCard}
                          onClose={() => setPhysicalBackMenuOpen(false)}
                        />
                      ) : null}
                      </>
                    ) : (
                      <CardFontLoadingPreview width={previewRenderWidth} aspectRatio={previewAspectRatio} />
                    )}
                  </View>

                  <View
                    style={{
                      minHeight: 48,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: PREVIEW_ACTION_BUTTON_GAP,
                      zIndex: editMenuOpen || cardActionMenuOpen ? 20 : 1,
                    }}
                  >
                    {hasDeleteBackControl ? (
                      <PreviewActionButton
                        accessibilityLabel="Delete card on back"
                        tone="danger"
                        onPress={confirmRemoveFlipSideFromCard}
                        icon={<Trash2 size={20} color="#a52735" strokeWidth={2.5} />}
                      />
                    ) : null}
                    {hasRotateControl ? (
                      <PreviewActionButton
                        accessibilityLabel={
                          previewRotated ? "Return preview to printed orientation" : "Rotate preview"
                        }
                        selected={previewRotated}
                        onPress={() => setPreviewRotated((current) => !current)}
                        icon={
                          <RotateCw
                            size={21}
                            color={previewRotated ? "#ffffff" : "#20242d"}
                            strokeWidth={2.5}
                          />
                        }
                      />
                    ) : null}
                    <CardEditMenu
                      open={editMenuOpen}
                      menuWidth={Math.min(330, cardWidth)}
                      menuCenterOffset={editMenuCenterOffset}
                      typeFrame={card.typeFrame ?? "standard"}
                      activeSection={activeSection}
                      sheetSection={sheetSection}
                      onToggle={() => {
                        setNewCardMenuOpen(false);
                        setCardActionMenuOpen(false);
                        setShareMenuOpen(false);
                        setEditMenuOpen((current) => !current);
                      }}
                      onSelectSection={(section) => {
                        setActiveSection(
                          shouldUseSheetForMobileWebCardTextEditing(section) ? null : section,
                        );
                        setSheetSection(section);
                        setEditMenuOpen(false);
                      }}
                    />
                    <PreviewActionButton
                      accessibilityLabel={`Show ${nextFaceLabel}`}
                      selected={showingPhysicalBack}
                      onPress={flipCardFace}
                      icon={
                        <RefreshCw
                          size={21}
                          color={showingPhysicalBack ? "#ffffff" : "#20242d"}
                          strokeWidth={2.5}
                        />
                      }
                    />
                    <FrameChangeMenu
                      open={cardActionMenuOpen}
                      menuWidth={Math.min(330, cardWidth)}
                      menuCenterOffset={frameMenuCenterOffset}
                      frameIdentity={previewFrameIdentity}
                      selectedFrameTreatment={activeFrameTreatment}
                      selectedShowcaseFrame={activeShowcaseFrame}
                      compatibleFrameTreatments={compatibleFrameTreatments}
                      onToggle={() => {
                        setNewCardMenuOpen(false);
                        setEditMenuOpen(false);
                        setShareMenuOpen(false);
                        setCardActionMenuOpen((current) => !current);
                      }}
                      onChangeFrameTreatment={(frameTreatment) => {
                        updateCard(toDfcFacePatch(card, { frameTreatment }));
                        setCardActionMenuOpen(false);
                      }}
                      onChangeShowcaseFrame={(showcaseFrame) => {
                        updateCard(toDfcFacePatch(card, { frameTreatment: "showcase", showcaseFrame }));
                        setCardActionMenuOpen(false);
                      }}
                    />
                  </View>
                </View>
              </View>
            ) : null}

            {inspectorTab === "keywords" ? (
              <TabScreen
                title="Keywords"
                subtitle="Keyword abilities, keyword actions, ability words, and custom entries"
              >
                <KeywordLibraryPanel
                  customDefinitions={customKeywordDefinitions}
                  onAddCustomDefinition={addCustomKeywordDefinition}
                />
              </TabScreen>
            ) : null}

            {inspectorTab === "sets" ? (
              <TabScreen title="Sets" subtitle="Manage set shells and card membership">
                <SetsPanel
                  sets={cardSets}
                  selectedSetId={selectedSetId}
                  newSetName={newSetName}
                  onChangeNewSetName={setNewSetName}
                  onSelectSet={selectSet}
                  onCreateSet={createSet}
                  onRenameSet={renameSet}
                  onCreateCardInSet={createCardInSet}
                  onOpenCardFromSet={openCardFromSet}
                  onRemoveCardFromSet={removeCardFromSet}
                  onRemoveSet={removeSet}
                  onChangeSetCardBack={updateSetCardBack}
                />
              </TabScreen>
            ) : null}
          </ScrollView>

          {!keyboardVisible ? (
            <BottomTabBar activeTab={inspectorTab} onSelectTab={selectInspectorTab} />
          ) : null}
          <FlatCardExportRenderHost target={singleExportTarget} containerRef={singleExportContainerRef} />
          <FlatCardExportRenderHost
            target={batchExportCard ? { kind: "card", card: batchExportCard } : null}
            containerRef={batchExportContainerRef}
          />
          <WebPhotoExportModal
            exportFile={webPhotoExport}
            onClose={() => setWebPhotoExport(null)}
          />
          <RandomizeSavePromptModal
            visible={randomizeSavePromptOpen}
            cardName={faceCard.name || "Untitled Card"}
            sets={cardSets}
            selectedSetId={selectedSetId}
            onSaveToSet={saveCardToSetThenRandomize}
            onDiscard={performRandomizeCard}
            onClose={() => setRandomizeSavePromptOpen(false)}
          />
          {webPhotoExportBusy ? <CardPhotoExportBusyOverlay /> : null}
          {batchExportProgress ? <BatchExportProgressOverlay progress={batchExportProgress} /> : null}
        </KeyboardAvoidingView>

        <SectionEditorModal
          card={previewCard}
          section={sheetSection}
          setCardBackId={selectedSet?.cardBackId ?? DEFAULT_CARD_BACK_ID}
          cardBackOverrideId={card.cardBackId}
          onClose={() => setSheetSection(null)}
          onChange={(patch) => {
            if (patch.backManaCost !== undefined || patch.adventureManaCost !== undefined) {
              const normalizedPatch = { ...patch };

              if (patch.backManaCost !== undefined) {
                normalizedPatch.backManaCost = normalizeManaInput(patch.backManaCost);
              }

              if (patch.adventureManaCost !== undefined) {
                normalizedPatch.adventureManaCost = normalizeManaInput(patch.adventureManaCost);
              }

              updateCard(normalizedPatch);
              return;
            }

            if (patch.manaCost !== undefined) {
              updateCard({ ...patch, manaCost: normalizeManaInput(patch.manaCost) });
              return;
            }

            updateCard(patch);
          }}
          onEditArt={editArtTransform}
          onPickArt={openArtSourceOptions}
          onPickSetSymbol={pickSetSymbol}
          onPickWatermark={pickWatermark}
          customKeywordDefinitions={customKeywordDefinitions}
          rulesTextAiFixer={{
            apiKey: openAiApiKey,
            busy: rulesTextFixerBusy,
            error: rulesTextFixerError,
            onChangeApiKey: setOpenAiApiKey,
            onFixRulesText: fixRulesTextWithAi,
          }}
        />
        <ArtSourceModal
          visible={artSourceOpen}
          hasArt={Boolean(faceCard.artUri)}
          artLibraryEntries={artLibraryEntries}
          onPickPhoto={pickArt}
          onGenerateArt={openArtGenerator}
          onEditImage={editArtTransform}
          onSelectLibraryArt={selectArtLibraryEntry}
          onClose={() => setArtSourceOpen(false)}
        />
        <ArtGeneratorModal
          visible={artGeneratorOpen}
          apiKey={openAiApiKey}
          request={artGeneratorRequest}
          generatedPrompt={artGeneratorPrompt}
          busy={artGeneratorBusy}
          error={artGeneratorError}
          onChangeApiKey={setOpenAiApiKey}
          onChangeRequest={setArtGeneratorRequest}
          onGenerate={generateArt}
          onClose={() => {
            if (!artGeneratorBusy) {
              setArtGeneratorOpen(false);
            }
          }}
        />
        <ArtAdjustmentModal
          visible={artAdjustOpen}
          card={card}
          onChange={updateCard}
          onPickNewImage={() => {
            setArtAdjustOpen(false);
            openArtSourceOptions();
          }}
          onClose={() => setArtAdjustOpen(false)}
        />
      </GestureHandlerRootView>
    </HybridSymbolStyleProvider>
  );
}

function ArtSourceModal({
  visible,
  hasArt,
  artLibraryEntries,
  onPickPhoto,
  onGenerateArt,
  onEditImage,
  onSelectLibraryArt,
  onClose,
}: {
  visible: boolean;
  hasArt: boolean;
  artLibraryEntries: ArtLibraryEntry[];
  onPickPhoto: () => void;
  onGenerateArt: () => void;
  onEditImage: () => void;
  onSelectLibraryArt: (entry: ArtLibraryEntry) => void;
  onClose: () => void;
}) {
  const [activeLibrarySource, setActiveLibrarySource] = useState<ArtLibrarySource>("generated");
  const visibleLibraryEntries = useMemo(
    () => sortArtLibraryEntries(artLibraryEntries.filter((entry) => entry.source === activeLibrarySource)),
    [activeLibrarySource, artLibraryEntries],
  );
  const renderedLibraryEntries = visibleLibraryEntries.slice(0, ART_LIBRARY_VISIBLE_THUMBNAIL_LIMIT);
  const hiddenLibraryEntryCount = Math.max(0, visibleLibraryEntries.length - renderedLibraryEntries.length);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close art source menu"
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(15, 18, 24, 0.34)",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Pressable
          accessibilityRole="menu"
          onPress={(event) => event.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 360,
            borderRadius: 16,
            borderCurve: "continuous",
            backgroundColor: "#ffffff",
            padding: 12,
            gap: 8,
            shadowColor: "#000000",
            shadowOpacity: 0.22,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 14 },
            elevation: 16,
          }}
        >
          <View style={{ paddingHorizontal: 6, paddingVertical: 4, gap: 2 }}>
            <Text selectable={false} style={{ color: "#151820", fontSize: 18, fontWeight: "900" }}>
              Card Art
            </Text>
            <Text selectable={false} style={{ color: "#68707d", fontSize: 12, lineHeight: 17, fontWeight: "700" }}>
              Choose an image source for the current art aperture.
            </Text>
          </View>

          <ArtSourceMenuItem
            label="Pick photo"
            detail="Use an image from the photo library."
            icon={<Upload size={20} color="#151820" strokeWidth={2.5} />}
            onPress={onPickPhoto}
          />
          <ArtSourceMenuItem
            label="Generate art"
            detail="Use a locally composed prompt for OpenAI image generation."
            icon={<Palette size={20} color="#151820" strokeWidth={2.5} />}
            onPress={onGenerateArt}
          />
          {hasArt ? (
            <ArtSourceMenuItem
              label="Edit image crop"
              detail="Adjust scale and focal point inside the visible art slot."
              icon={<SlidersHorizontal size={20} color="#151820" strokeWidth={2.5} />}
              onPress={onEditImage}
            />
          ) : null}
          {artLibraryEntries.length > 0 ? (
            <View style={{ gap: 8, paddingTop: 4 }}>
              <View
                style={{
                  flexDirection: "row",
                  borderRadius: 999,
                  backgroundColor: "#eef1f5",
                  padding: 3,
                  gap: 3,
                }}
              >
                {(["generated", "added"] as const).map((source) => {
                  const selected = activeLibrarySource === source;

                  return (
                    <Pressable
                      key={source}
                      accessibilityRole="tab"
                      accessibilityState={{ selected }}
                      onPress={() => setActiveLibrarySource(source)}
                      style={{
                        flex: 1,
                        minHeight: 34,
                        borderRadius: 999,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: selected ? "#ffffff" : "transparent",
                      }}
                    >
                      <Text
                        selectable={false}
                        style={{
                          color: selected ? "#151820" : "#66707c",
                          fontSize: 12,
                          fontWeight: "900",
                        }}
                      >
                        {source === "generated" ? "Generated" : "Added"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingVertical: 2 }}
              >
                {visibleLibraryEntries.length > 0 ? (
                  <>
                    {renderedLibraryEntries.map((entry) => (
                      <ArtLibraryThumbnail
                        key={entry.id}
                        entry={entry}
                        onPress={() => onSelectLibraryArt(entry)}
                      />
                    ))}
                    {hiddenLibraryEntryCount > 0 ? (
                      <View
                        style={{
                          width: 86,
                          height: 64,
                          borderRadius: 10,
                          borderCurve: "continuous",
                          borderWidth: 1,
                          borderColor: "#d8dbe2",
                          backgroundColor: "#f7f8fb",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 8,
                        }}
                      >
                        <Text
                          selectable={false}
                          style={{
                            color: "#66707c",
                            fontSize: 11,
                            lineHeight: 14,
                            fontWeight: "900",
                            textAlign: "center",
                          }}
                        >
                          +{hiddenLibraryEntryCount} more
                        </Text>
                      </View>
                    ) : null}
                  </>
                ) : (
                  <View
                    style={{
                      minWidth: 180,
                      minHeight: 84,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#dde1e8",
                      backgroundColor: "#f7f8fb",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 12,
                    }}
                  >
                    <Text selectable={false} style={{ color: "#66707c", fontSize: 12, fontWeight: "800" }}>
                      No {activeLibrarySource} art yet
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ArtLibraryThumbnail({
  entry,
  onPress,
}: {
  entry: ArtLibraryEntry;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Use ${entry.label} art`}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 86,
        gap: 5,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <View
        style={{
          width: 86,
          height: 64,
          borderRadius: 10,
          borderCurve: "continuous",
          overflow: "hidden",
          backgroundColor: "#101820",
          borderWidth: 1,
          borderColor: "#d8dbe2",
        }}
      >
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: entry.uri }}
          resizeMode="cover"
          style={{ width: "100%", height: "100%" }}
        />
      </View>
      <Text selectable={false} numberOfLines={1} style={{ color: "#151820", fontSize: 11, fontWeight: "900" }}>
        {getArtLibraryColorLabel(entry.colorIdentity)}
      </Text>
      <Text selectable={false} numberOfLines={1} style={{ color: "#68707d", fontSize: 10, fontWeight: "700" }}>
        {entry.label}
      </Text>
    </Pressable>
  );
}

function ArtSourceMenuItem({
  label,
  detail,
  icon,
  onPress,
}: {
  label: string;
  detail: string;
  icon: ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="menuitem"
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 66,
        borderRadius: 12,
        borderCurve: "continuous",
        backgroundColor: pressed ? "#edf5ff" : "#f6f7f9",
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      })}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: "#ffffff",
          borderWidth: 1,
          borderColor: "#dde1e8",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text selectable={false} numberOfLines={1} style={{ color: "#151820", fontSize: 15, fontWeight: "900" }}>
          {label}
        </Text>
        <Text selectable={false} numberOfLines={2} style={{ color: "#66707c", fontSize: 12, lineHeight: 17, fontWeight: "700" }}>
          {detail}
        </Text>
      </View>
    </Pressable>
  );
}

function ArtGeneratorModal({
  visible,
  apiKey,
  request,
  generatedPrompt,
  busy,
  error,
  onChangeApiKey,
  onChangeRequest,
  onGenerate,
  onClose,
}: {
  visible: boolean;
  apiKey: string;
  request: string;
  generatedPrompt: string;
  busy: boolean;
  error: string | null;
  onChangeApiKey: (apiKey: string) => void;
  onChangeRequest: (request: string) => void;
  onGenerate: () => void;
  onClose: () => void;
}) {
  const { height } = useWindowDimensions();
  const [showComposedPrompt, setShowComposedPrompt] = useState(false);
  const maxPromptHeight = Math.max(120, Math.min(260, height * 0.26));

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{
          flex: 1,
          backgroundColor: "rgba(15, 18, 24, 0.42)",
          justifyContent: "flex-end",
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            backgroundColor: "#ffffff",
            paddingHorizontal: 18,
            paddingTop: 18,
            paddingBottom: 18,
            gap: 12,
            shadowColor: "#000000",
            shadowOpacity: 0.2,
            shadowRadius: 22,
            shadowOffset: { width: 0, height: -10 },
            elevation: 16,
          }}
        >
          <View style={{ gap: 3 }}>
            <Text selectable={false} style={{ color: "#151820", fontSize: 22, fontWeight: "900" }}>
              Generate Art
            </Text>
            <Text selectable={false} style={{ color: "#68707d", fontSize: 12, lineHeight: 17, fontWeight: "700" }}>
              The request is wrapped locally with card-art direction. Explicit styles, like anime or watercolor, override the default fantasy trading-card profile.
            </Text>
          </View>

          <View style={{ gap: 7 }}>
            <Text selectable={false} style={{ color: "#343a44", fontSize: 12, fontWeight: "900" }}>
              OpenAI API Key
            </Text>
            <TextInput
              accessibilityLabel="OpenAI API key"
              value={apiKey}
              onChangeText={onChangeApiKey}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="sk-..."
              placeholderTextColor="#9aa1ad"
              style={{
                minHeight: 46,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#d8dbe2",
                backgroundColor: "#f7f8fb",
                paddingHorizontal: 12,
                color: "#151820",
                fontSize: 14,
                fontWeight: "700",
              }}
            />
          </View>

          <View style={{ gap: 7 }}>
            <Text selectable={false} style={{ color: "#343a44", fontSize: 12, fontWeight: "900" }}>
              Art Request
            </Text>
            <TextInput
              accessibilityLabel="Art request"
              value={request}
              onChangeText={onChangeRequest}
              multiline
              placeholder="make a dog"
              placeholderTextColor="#9aa1ad"
              style={{
                minHeight: 72,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#d8dbe2",
                backgroundColor: "#f7f8fb",
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: "#151820",
                fontSize: 14,
                lineHeight: 19,
                fontWeight: "700",
                textAlignVertical: "top",
              }}
            />
          </View>

          <View style={{ gap: 7 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showComposedPrompt ? "Hide composed prompt" : "Show composed prompt"}
              onPress={() => setShowComposedPrompt((current) => !current)}
              style={({ pressed }) => ({
                alignSelf: "flex-start",
                minHeight: 34,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "#d8dbe2",
                backgroundColor: pressed ? "#edf5ff" : "#ffffff",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 12,
              })}
            >
              <Text selectable={false} style={{ color: "#343a44", fontSize: 12, fontWeight: "900" }}>
                {showComposedPrompt ? "Hide composed prompt" : "Show composed prompt"}
              </Text>
            </Pressable>
            {showComposedPrompt ? (
              <ScrollView
                style={{
                  maxHeight: maxPromptHeight,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#e0e3e9",
                  backgroundColor: "#f7f8fb",
                }}
                contentContainerStyle={{ padding: 12 }}
              >
                <Text selectable style={{ color: "#333b47", fontSize: 12, lineHeight: 17, fontWeight: "700" }}>
                  {generatedPrompt}
                </Text>
              </ScrollView>
            ) : null}
          </View>

          {error ? (
            <Text selectable style={{ color: "#b42318", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
              {error}
            </Text>
          ) : null}

          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel art generation"
              disabled={busy}
              onPress={onClose}
              style={{
                minHeight: 46,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "#d8dbe2",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 18,
                opacity: busy ? 0.55 : 1,
              }}
            >
              <Text selectable={false} style={{ color: "#343a44", fontSize: 14, fontWeight: "900" }}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Generate card art"
              disabled={busy}
              onPress={onGenerate}
              style={{
                minHeight: 46,
                borderRadius: 999,
                backgroundColor: "#151820",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 20,
                flexDirection: "row",
                gap: 9,
                opacity: busy ? 0.72 : 1,
              }}
            >
              {busy ? <ActivityIndicator color="#ffffff" /> : <Palette size={18} color="#ffffff" strokeWidth={2.5} />}
              <Text selectable={false} style={{ color: "#ffffff", fontSize: 14, fontWeight: "900" }}>
                {busy ? "Generating" : "Generate"}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ArtAdjustmentModal({
  visible,
  card,
  onChange,
  onPickNewImage,
  onClose,
}: {
  visible: boolean;
  card: CardDraft;
  onChange: (patch: Partial<CardDraft>) => void;
  onPickNewImage: () => void;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const faceCard = getEditableCardFace(card);
  const artUri = faceCard.artUri;
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const artRect = getVisibleArtRectForCard(card);
  const artAspectRatio = artRect.width / artRect.height;
  const maxCropWidth = Math.min(width - 48, 460);
  const maxCropHeight = Math.max(180, height * 0.62);
  const cropWidth =
    maxCropWidth / artAspectRatio > maxCropHeight
      ? maxCropHeight * artAspectRatio
      : maxCropWidth;
  const cropHeight = cropWidth / artAspectRatio;
  const coordinateScale = cropWidth / artRect.width;
  const defaultAdjustmentControlsVisible = Platform.OS === "web" && width >= 720;
  const [controlsVisible, setControlsVisible] = useState(defaultAdjustmentControlsVisible);
  const artTransform = normalizeArtTransformForVisibleRect(
    faceCard.artTransform ?? DEFAULT_ART_TRANSFORM,
    artRect,
    imageAspectRatio,
  );
  const fittedImageLayout = getCoverFittedImageLayout(cropWidth, cropHeight, imageAspectRatio);
  const nudgeDistance = Math.max(4, Math.min(18, Math.min(artRect.width, artRect.height) * 0.035));
  const scaleStep = 0.08;
  const panStartTransform = useRef(artTransform);
  const pinchStartTransform = useRef(artTransform);
  const artTransformRef = useRef(artTransform);
  const artRectRef = useRef(artRect);
  const cardRef = useRef(card);
  const artUriRef = useRef(artUri);
  const coordinateScaleRef = useRef(coordinateScale);
  const imageAspectRatioRef = useRef(imageAspectRatio);

  useEffect(() => {
    let cancelled = false;
    setImageAspectRatio(null);

    if (!artUri) {
      return;
    }

    Image.getSize(
      artUri,
      (imageWidth, imageHeight) => {
        if (!cancelled && imageWidth > 0 && imageHeight > 0) {
          setImageAspectRatio(imageWidth / imageHeight);
        }
      },
      () => {
        if (!cancelled) {
          setImageAspectRatio(null);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [artUri]);

  useEffect(() => {
    artTransformRef.current = artTransform;
    artRectRef.current = artRect;
    cardRef.current = card;
    artUriRef.current = artUri;
    coordinateScaleRef.current = coordinateScale;
    imageAspectRatioRef.current = imageAspectRatio;
  }, [artTransform, artRect, card, artUri, coordinateScale, imageAspectRatio]);

  useEffect(() => {
    if (visible) {
      panStartTransform.current = artTransform;
      pinchStartTransform.current = artTransform;
      setControlsVisible(defaultAdjustmentControlsVisible);
    }
  }, [artUri, defaultAdjustmentControlsVisible, visible]);

  const updateArtTransform = useCallback((nextTransform: ArtTransform) => {
    const normalizedTransform = normalizeArtTransformForVisibleRect(
      nextTransform,
      artRectRef.current,
      imageAspectRatioRef.current,
    );

    artTransformRef.current = normalizedTransform;
    onChange(toDfcFacePatch(cardRef.current, {
      artTransform: normalizedTransform,
    }));
  }, [onChange]);

  const nudgeArt = (offsetX: number, offsetY: number) => {
    updateArtTransform({
      ...artTransform,
      offsetX: artTransform.offsetX + offsetX,
      offsetY: artTransform.offsetY + offsetY,
    });
  };

  const scaleArt = (scaleDelta: number) => {
    updateArtTransform({
      ...artTransform,
      scale: artTransform.scale + scaleDelta,
    });
  };

  const resetArtTransform = () => {
    updateArtTransform(DEFAULT_ART_TRANSFORM);
  };

  const artGesture = useMemo(() => {
    const panGesture = Gesture.Pan()
      .minDistance(1)
      .onBegin(() => {
        panStartTransform.current = artTransformRef.current;
      })
      .onUpdate((event) => {
        if (!artUriRef.current) {
          return;
        }

        const currentTransform = artTransformRef.current;
        const start = panStartTransform.current;

        updateArtTransform({
          ...currentTransform,
          offsetX: start.offsetX + event.translationX / coordinateScaleRef.current,
          offsetY: start.offsetY + event.translationY / coordinateScaleRef.current,
        });
      })
      .runOnJS(true);

    const pinchGesture = Gesture.Pinch()
      .onBegin(() => {
        pinchStartTransform.current = artTransformRef.current;
      })
      .onUpdate((event) => {
        if (!artUriRef.current) {
          return;
        }

        updateArtTransform({
          ...artTransformRef.current,
          scale: pinchStartTransform.current.scale * event.scale,
        });
      })
      .runOnJS(true);

    return Gesture.Simultaneous(panGesture, pinchGesture);
  }, [updateArtTransform]);

  if (!visible || !artUri) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(12, 14, 18, 0.86)",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingVertical: 40,
            gap: 18,
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(12, 14, 18, 0.34)",
            }}
          />
          <View style={{ width: cropWidth, gap: 12 }}>
            <View
              style={{
                width: cropWidth,
                height: cropHeight,
                overflow: "visible",
              }}
            >
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: fittedImageLayout.left,
                  top: fittedImageLayout.top,
                  width: fittedImageLayout.width,
                  height: fittedImageLayout.height,
                  opacity: 0.26,
                  transform: [
                    { translateX: artTransform.offsetX * coordinateScale },
                    { translateY: artTransform.offsetY * coordinateScale },
                    { scale: artTransform.scale },
                  ],
                }}
              >
                <Image
                  accessibilityIgnoresInvertColors
                  source={{ uri: artUri }}
                  resizeMode={fittedImageLayout.resizeMode}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                />
              </View>
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: cropWidth,
                  height: cropHeight,
                  overflow: "hidden",
                  borderRadius: ART_ADJUSTMENT_CROP_RADIUS,
                  borderCurve: "continuous",
                  backgroundColor: "#151820",
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    left: fittedImageLayout.left,
                    top: fittedImageLayout.top,
                    width: fittedImageLayout.width,
                    height: fittedImageLayout.height,
                    transform: [
                      { translateX: artTransform.offsetX * coordinateScale },
                      { translateY: artTransform.offsetY * coordinateScale },
                      { scale: artTransform.scale },
                    ],
                  }}
                >
                  <Image
                    accessibilityIgnoresInvertColors
                    source={{ uri: artUri }}
                    resizeMode={fittedImageLayout.resizeMode}
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                  />
                </View>
              </View>
              <GestureDetector gesture={artGesture}>
                <View
                  collapsable={false}
                  style={{
                    width: cropWidth,
                    height: cropHeight,
                    borderRadius: ART_ADJUSTMENT_CROP_RADIUS,
                    borderCurve: "continuous",
                    borderWidth: 2,
                    borderColor: "#ffffff",
                    backgroundColor: "transparent",
                    boxShadow: "0 18px 42px rgba(0, 0, 0, 0.36)",
                  }}
                />
              </GestureDetector>
            </View>
            {controlsVisible ? (
            <View
              style={{
                borderRadius: 18,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.18)",
                backgroundColor: "rgba(255, 255, 255, 0.11)",
                padding: 12,
                gap: 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <Text selectable={false} style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>
                  Scale
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <ArtAdjustmentIconButton
                    accessibilityLabel="Zoom image out"
                    onPress={() => scaleArt(-scaleStep)}
                  >
                    <Minus size={18} color="#ffffff" strokeWidth={2.5} />
                  </ArtAdjustmentIconButton>
                  <Text
                    selectable={false}
                    style={{
                      minWidth: 48,
                      textAlign: "center",
                      color: "#ffffff",
                      fontSize: 13,
                      fontWeight: "900",
                    }}
                  >
                    {Math.round(artTransform.scale * 100)}%
                  </Text>
                  <ArtAdjustmentIconButton
                    accessibilityLabel="Zoom image in"
                    onPress={() => scaleArt(scaleStep)}
                  >
                    <Plus size={18} color="#ffffff" strokeWidth={2.5} />
                  </ArtAdjustmentIconButton>
                </View>
              </View>
              <View style={{ alignItems: "center", gap: 8 }}>
                <Text selectable={false} style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>
                  Position
                </Text>
                <ArtAdjustmentIconButton
                  accessibilityLabel="Nudge image up"
                  onPress={() => nudgeArt(0, -nudgeDistance)}
                >
                  <ArrowUp size={18} color="#ffffff" strokeWidth={2.5} />
                </ArtAdjustmentIconButton>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <ArtAdjustmentIconButton
                    accessibilityLabel="Nudge image left"
                    onPress={() => nudgeArt(-nudgeDistance, 0)}
                  >
                    <ArrowLeft size={18} color="#ffffff" strokeWidth={2.5} />
                  </ArtAdjustmentIconButton>
                  <ArtAdjustmentIconButton
                    accessibilityLabel="Reset image crop"
                    onPress={resetArtTransform}
                  >
                    <RotateCcw size={18} color="#ffffff" strokeWidth={2.5} />
                  </ArtAdjustmentIconButton>
                  <ArtAdjustmentIconButton
                    accessibilityLabel="Nudge image right"
                    onPress={() => nudgeArt(nudgeDistance, 0)}
                  >
                    <ArrowRight size={18} color="#ffffff" strokeWidth={2.5} />
                  </ArtAdjustmentIconButton>
                </View>
                <ArtAdjustmentIconButton
                  accessibilityLabel="Nudge image down"
                  onPress={() => nudgeArt(0, nudgeDistance)}
                >
                  <ArrowDown size={18} color="#ffffff" strokeWidth={2.5} />
                </ArtAdjustmentIconButton>
              </View>
            </View>
            ) : null}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={controlsVisible ? "Hide image controls" : "Show image controls"}
                onPress={() => setControlsVisible((current) => !current)}
                style={{
                  minHeight: 46,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: controlsVisible ? "rgba(255, 255, 255, 0.72)" : "rgba(255, 255, 255, 0.38)",
                  backgroundColor: controlsVisible ? "rgba(255, 255, 255, 0.22)" : "rgba(255, 255, 255, 0.12)",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 14,
                  flexDirection: "row",
                  gap: 7,
                }}
              >
                <SlidersHorizontal size={17} color="#ffffff" strokeWidth={2.5} />
                <Text selectable={false} style={{ color: "#ffffff", fontSize: 14, fontWeight: "800" }}>
                  {controlsVisible ? "Hide" : "Controls"}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Pick new image"
                onPress={onPickNewImage}
                style={{
                  minHeight: 46,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.38)",
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 16,
                }}
              >
                <Text selectable={false} style={{ color: "#ffffff", fontSize: 14, fontWeight: "800" }}>
                  Pick new image
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Done editing image"
                onPress={onClose}
                style={{
                  minHeight: 46,
                  borderRadius: 999,
                  backgroundColor: "#ffffff",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 22,
                }}
              >
                <Text selectable={false} style={{ color: "#151820", fontSize: 14, fontWeight: "900" }}>
                  Done
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function ArtAdjustmentIconButton({
  accessibilityLabel,
  onPress,
  children,
}: {
  accessibilityLabel: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.34)",
        backgroundColor: pressed ? "rgba(255, 255, 255, 0.24)" : "rgba(255, 255, 255, 0.12)",
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      {children}
    </Pressable>
  );
}

function FlatCardExportRenderHost({
  target,
  containerRef,
}: {
  target: FlatCardExportTarget | null;
  containerRef: RefObject<View | null>;
}) {
  if (!target) {
    return null;
  }

  const renderWidth = 750;
  const aspectRatio =
    target.kind === "back"
      ? CARD_BACK_PREVIEW_ASPECT_RATIO
      : getTypeFrameSpec(getPreviewTypeFrame(target.card)).aspectRatio;
  const renderHeight = renderWidth / aspectRatio;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: -4000,
        top: 0,
        width: renderWidth,
        height: renderHeight,
        backgroundColor: "transparent",
      }}
    >
      <View
        ref={containerRef}
        collapsable={false}
        style={{ width: renderWidth, height: renderHeight, backgroundColor: "transparent" }}
      >
        {target.kind === "back" ? (
          <CardBackPreview cardBackId={target.cardBackId} width={renderWidth} />
        ) : (
          <CardPreview
            card={target.card}
            activeSection={null}
            width={renderWidth}
            exportMode
            onSectionPress={() => undefined}
            onChange={() => undefined}
          />
        )}
      </View>
    </View>
  );
}

function WebPhotoExportModal({
  exportFile,
  onClose,
}: {
  exportFile: WebPhotoExport | null;
  onClose: () => void;
}) {
  if (!exportFile) {
    return null;
  }

  const shareAvailable = Platform.OS === "web" && hasWebShareApi();
  const preferShare = shouldPreferWebFileShare() && shareAvailable;
  const content = (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(10, 12, 16, 0.72)",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 18,
          borderCurve: "continuous",
          backgroundColor: "#ffffff",
          padding: 16,
          gap: 14,
          shadowColor: "#000000",
          shadowOpacity: 0.22,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 16 },
          elevation: 20,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text
              selectable={false}
              style={{
                color: "#12161e",
                fontSize: 18,
                fontWeight: "900",
              }}
            >
              Card photo ready
            </Text>
            <Text
              selectable={false}
              numberOfLines={1}
              style={{
                color: "#626977",
                fontSize: 12,
                fontWeight: "700",
                marginTop: 2,
              }}
            >
              {exportFile.fileName}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close card photo export"
            onPress={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "#eef0f4",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} color="#2a303a" strokeWidth={2.6} />
          </Pressable>
        </View>

        <View
          style={{
            alignSelf: "center",
            width: "100%",
            maxWidth: 260,
            aspectRatio: 750 / 1047,
            borderRadius: 12,
            borderCurve: "continuous",
            overflow: "hidden",
            backgroundColor: "#eef1f5",
          }}
        >
          <Image
            accessibilityIgnoresInvertColors
            source={{ uri: exportFile.dataUri }}
            resizeMode="contain"
            style={{ width: "100%", height: "100%" }}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={preferShare ? "Share rendered card PNG" : "Save rendered card PNG"}
            onPress={() =>
              preferShare
                ? shareOrDownloadWebPng(exportFile.fileName, exportFile.dataUri)
                : shareAvailable
                ? shareOrDownloadWebPng(exportFile.fileName, exportFile.dataUri)
                : openWebImageInNewTab(exportFile.fileName, exportFile.dataUri)
            }
            style={{
              flex: 1,
              minHeight: 46,
              borderRadius: 11,
              borderCurve: "continuous",
              backgroundColor: "#141821",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
            }}
          >
            {preferShare ? (
              <Share2 size={18} color="#ffffff" strokeWidth={2.5} />
            ) : (
              <Download size={18} color="#ffffff" strokeWidth={2.5} />
            )}
            <Text selectable={false} style={{ color: "#ffffff", fontSize: 14, fontWeight: "900" }}>
              {preferShare ? "Share / Save" : shareAvailable ? "Save PNG" : "Open Image"}
            </Text>
          </Pressable>
          {shareAvailable && !preferShare ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share rendered card PNG"
              onPress={() => shareOrDownloadWebPng(exportFile.fileName, exportFile.dataUri)}
              style={{
                minWidth: 104,
                minHeight: 46,
                borderRadius: 11,
                borderCurve: "continuous",
                backgroundColor: "#eef0f4",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                paddingHorizontal: 14,
              }}
            >
              <Share2 size={18} color="#1f2630" strokeWidth={2.5} />
              <Text selectable={false} style={{ color: "#1f2630", fontSize: 14, fontWeight: "900" }}>
                Share
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );

  if (Platform.OS === "web") {
    return (
      <View
        pointerEvents="auto"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          zIndex: 110,
        }}
      >
        {content}
      </View>
    );
  }

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      {content}
    </Modal>
  );
}

function RandomizeSavePromptModal({
  visible,
  cardName,
  sets,
  selectedSetId,
  onSaveToSet,
  onDiscard,
  onClose,
}: {
  visible: boolean;
  cardName: string;
  sets: CardSet[];
  selectedSetId: string;
  onSaveToSet: (setId: string) => void;
  onDiscard: () => void;
  onClose: () => void;
}) {
  if (!visible) {
    return null;
  }

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(12, 15, 22, 0.46)",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 420,
            maxHeight: "86%",
            borderRadius: 18,
            borderCurve: "continuous",
            backgroundColor: "#ffffff",
            padding: 18,
            gap: 14,
            shadowColor: "#000000",
            shadowOpacity: 0.2,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 14 },
            elevation: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text selectable style={{ color: "#11151c", fontSize: 21, fontWeight: "900" }}>
                Save before randomizing?
              </Text>
              <Text selectable style={{ color: "#5f6570", fontSize: 14, lineHeight: 19, fontWeight: "700" }}>
                {cardName} has unsaved edits. Pick a destination set to commit this draft, or discard it and
                generate a new random card.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel randomize"
              onPress={onClose}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: "#eef0f4",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={19} color="#222733" strokeWidth={2.5} />
            </Pressable>
          </View>

          <ScrollView
            style={{ maxHeight: 260 }}
            contentContainerStyle={{ gap: 8 }}
            keyboardShouldPersistTaps="handled"
          >
            {sets.map((set) => {
              const selected = set.id === selectedSetId;

              return (
                <Pressable
                  key={set.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Save to ${set.name} and randomize`}
                  onPress={() => onSaveToSet(set.id)}
                  style={{
                    minHeight: 50,
                    borderRadius: 10,
                    borderCurve: "continuous",
                    borderWidth: 1,
                    borderColor: selected ? "#151820" : "#d8dbe2",
                    backgroundColor: selected ? "#151820" : "#f8f9fb",
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Save size={18} color={selected ? "#ffffff" : "#20242d"} strokeWidth={2.4} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      selectable={false}
                      numberOfLines={1}
                      style={{
                        color: selected ? "#ffffff" : "#151820",
                        fontSize: 15,
                        fontWeight: "900",
                      }}
                    >
                      {set.name}
                    </Text>
                    <Text
                      selectable={false}
                      style={{
                        color: selected ? "rgba(255,255,255,0.74)" : "#68707d",
                        fontSize: 12,
                        fontWeight: "800",
                      }}
                    >
                      {set.cards.length} {set.cards.length === 1 ? "card" : "cards"}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={{ height: 1, backgroundColor: "#eceef2" }} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Discard unsaved edits and randomize"
            onPress={onDiscard}
            style={{
              minHeight: 46,
              borderRadius: 10,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: "rgba(165, 39, 53, 0.34)",
              backgroundColor: "#fff4f5",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              paddingHorizontal: 14,
            }}
          >
            <Shuffle size={18} color="#a52735" strokeWidth={2.5} />
            <Text selectable={false} style={{ color: "#a52735", fontSize: 14, fontWeight: "900" }}>
              Discard edits and randomize
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function CardPhotoExportBusyOverlay() {
  return (
    <View
      pointerEvents="auto"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: "rgba(12, 14, 18, 0.42)",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        zIndex: 90,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 260,
          borderRadius: 18,
          borderCurve: "continuous",
          backgroundColor: "#ffffff",
          padding: 20,
          alignItems: "center",
          gap: 12,
          shadowColor: "#000000",
          shadowOpacity: 0.18,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 12 },
          elevation: 18,
        }}
      >
        <ActivityIndicator color="#151820" />
        <Text
          selectable={false}
          style={{
            color: "#151820",
            fontSize: 15,
            fontWeight: "900",
            textAlign: "center",
          }}
        >
          Rendering card photo
        </Text>
      </View>
    </View>
  );
}

function BatchExportProgressOverlay({ progress }: { progress: BatchExportProgress }) {
  const title = progress.phase === "rendering" ? "Rendering set" : "Packaging export";
  const detail =
    progress.phase === "rendering"
      ? `${progress.current}/${progress.total} · ${progress.label}`
      : progress.label;

  return (
    <View
      pointerEvents="auto"
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(15, 18, 24, 0.32)",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 320,
          borderRadius: 12,
          borderCurve: "continuous",
          backgroundColor: "#ffffff",
          padding: 18,
          gap: 8,
          boxShadow: "0 18px 36px rgba(0, 0, 0, 0.24)",
        }}
      >
        <Text selectable={false} style={{ color: "#151820", fontSize: 17, fontWeight: "900" }}>
          {title}
        </Text>
        <Text selectable={false} style={{ color: "#626a76", fontSize: 13, lineHeight: 18, fontWeight: "800" }}>
          {detail}
        </Text>
      </View>
    </View>
  );
}

function TabScreen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <View style={{ width: "100%", maxWidth: 560, gap: 14 }}>
      <View style={{ gap: 3 }}>
        <Text
          selectable
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ color: "#101318", fontSize: 32, fontWeight: "900" }}
        >
          {title}
        </Text>
        <Text selectable style={{ color: "#606775", fontSize: 14, fontWeight: "700" }}>
          {subtitle}
        </Text>
      </View>
      <View
        style={{
          borderRadius: 14,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: "#d8dbe2",
          backgroundColor: "#ffffff",
          padding: 14,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function BottomTabBar({
  activeTab,
  onSelectTab,
}: {
  activeTab: InspectorTab;
  onSelectTab: (tab: VisibleInspectorTab) => void;
}) {
  const tabs = [
    ["edit", "Edit", Palette],
    ["sets", "Sets", BookOpen],
  ] as const;
  const selectedIndex = Math.max(0, tabs.findIndex(([tab]) => tab === activeTab));
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const bubbleX = useSharedValue(0);
  const indicatorX = useSharedValue(0);
  const tabBarPadding = 4;
  const tabGap = 4;
  const indicatorInset = 12;
  const tabWidth =
    tabBarWidth > 0
      ? (tabBarWidth - tabBarPadding * 2 - tabGap * (tabs.length - 1)) / tabs.length
      : 0;
  const indicatorWidth = Math.max(0, tabWidth - indicatorInset * 2);

  useEffect(() => {
    if (tabWidth <= 0) {
      return;
    }

    const nextBubbleX = tabBarPadding + selectedIndex * (tabWidth + tabGap);
    const springConfig = {
      damping: 18,
      stiffness: 220,
      mass: 0.75,
    };

    bubbleX.value = withSpring(nextBubbleX, springConfig);
    indicatorX.value = withSpring(nextBubbleX + indicatorInset, springConfig);
  }, [bubbleX, indicatorInset, indicatorX, selectedIndex, tabBarPadding, tabGap, tabWidth]);

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: bubbleX.value }],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const handleTabBarLayout = useCallback((event: LayoutChangeEvent) => {
    setTabBarWidth(event.nativeEvent.layout.width);
  }, []);

  return (
    <View
      accessibilityRole="tablist"
      style={{
        minHeight: BOTTOM_TAB_BAR_HEIGHT,
        paddingHorizontal: 16,
        paddingTop: 6,
        paddingBottom: 8,
        borderTopWidth: 1,
        borderTopColor: "rgba(60, 60, 67, 0.18)",
        backgroundColor: "rgba(247, 248, 246, 0.94)",
      }}
    >
      <View
        onLayout={handleTabBarLayout}
        style={{
          flexDirection: "row",
          alignSelf: "center",
          width: "100%",
          maxWidth: 330,
          position: "relative",
          borderRadius: 25,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: "rgba(16, 19, 24, 0.08)",
          backgroundColor: "rgba(255, 255, 255, 0.78)",
          padding: 4,
          gap: 4,
          shadowColor: "#101318",
          shadowOpacity: 0.08,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        }}
      >
        {tabWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                top: tabBarPadding,
                bottom: tabBarPadding,
                left: 0,
                width: tabWidth,
                borderRadius: 21,
                borderCurve: "continuous",
                overflow: "hidden",
                zIndex: 0,
              },
              bubbleStyle,
            ]}
          >
            <LinearGradient
              colors={["#141821", "#24324c"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        ) : null}
        {tabs.map(([tab, label, Icon]) => (
          <BottomTabButton
            key={tab}
            label={label}
            Icon={Icon}
            selected={activeTab === tab}
            onPress={() => onSelectTab(tab)}
          />
        ))}
        {indicatorWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                bottom: 9,
                left: 0,
                width: indicatorWidth,
                height: 2,
                borderRadius: 999,
                backgroundColor: "#50d6ff",
                zIndex: 3,
              },
              indicatorStyle,
            ]}
          />
        ) : null}
      </View>
    </View>
  );
}

function BottomTabButton({
  label,
  Icon,
  selected,
  onPress,
}: {
  label: string;
  Icon: typeof Palette;
  selected: boolean;
  onPress: () => void;
}) {
  const selectedProgress = useSharedValue(selected ? 1 : 0);
  const pressProgress = useSharedValue(0);
  const tint = selected ? "#ffffff" : "#5f6570";

  useEffect(() => {
    selectedProgress.value = withSpring(selected ? 1 : 0, {
      damping: 17,
      stiffness: 210,
      mass: 0.75,
    });
  }, [selected, selectedProgress]);

  const contentStyle = useAnimatedStyle(() => {
    const selectedValue = selectedProgress.value;
    const pressedValue = pressProgress.value;

    return {
      transform: [
        { translateY: -selectedValue * 1.5 + pressedValue * 1.5 },
        { scale: 1 + selectedValue * 0.035 - pressedValue * 0.045 },
      ],
    };
  });

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={`Show ${label} tab`}
      onPress={onPress}
      onPressIn={() => {
        pressProgress.value = withTiming(1, {
          duration: 90,
          easing: Easing.out(Easing.quad),
        });
      }}
      onPressOut={() => {
        pressProgress.value = withTiming(0, {
          duration: 180,
          easing: Easing.out(Easing.cubic),
        });
      }}
      style={{
        flex: 1,
        minHeight: 48,
        borderRadius: 21,
        borderCurve: "continuous",
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
          },
          contentStyle,
        ]}
      >
        <Icon size={21} color={tint} strokeWidth={selected ? 2.75 : 2.25} />
        <Text
          selectable={false}
          numberOfLines={1}
          style={{
            color: tint,
            fontSize: 12,
            fontWeight: selected ? "900" : "800",
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function PreviewActionButton({
  accessibilityLabel,
  icon,
  selected = false,
  tone = "default",
  onPress,
}: {
  accessibilityLabel: string;
  icon: ReactNode;
  selected?: boolean;
  tone?: "default" | "danger";
  onPress: () => void;
}) {
  const danger = tone === "danger";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        width: PREVIEW_ACTION_BUTTON_SIZE,
        height: PREVIEW_ACTION_BUTTON_SIZE,
        borderRadius: PREVIEW_ACTION_BUTTON_SIZE / 2,
        backgroundColor: selected ? "#151820" : danger ? "#fff4f5" : "#ffffff",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: selected ? "#151820" : danger ? "rgba(165, 39, 53, 0.34)" : "#c7cbd3",
      }}
    >
      {icon}
    </Pressable>
  );
}

function TopShareMenu({
  open,
  selectedSet,
  onToggle,
  onSaveToSet,
  onExportCurrentCard,
  onExportCurrentCardImage,
  onExportSelectedSet,
  onExportSelectedSetBatch,
}: {
  open: boolean;
  selectedSet?: CardSet;
  onToggle: () => void;
  onSaveToSet: () => void;
  onExportCurrentCard: () => void;
  onExportCurrentCardImage: () => void;
  onExportSelectedSet: () => void;
  onExportSelectedSetBatch: () => void;
}) {
  return (
    <View
      style={{
        width: 44,
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: open ? 30 : 1,
      }}
    >
      <PreviewActionButton
        accessibilityLabel={open ? "Close share menu" : "Open share menu"}
        selected={open}
        onPress={onToggle}
        icon={<Share2 size={21} color={open ? "#ffffff" : "#20242d"} strokeWidth={2.5} />}
      />

      {open ? (
        <View
          style={{
            position: "absolute",
            top: 52,
            right: 0,
            width: 304,
            borderRadius: 12,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: "#d8dbe2",
            backgroundColor: "#ffffff",
            padding: 8,
            gap: 8,
            shadowColor: "#000000",
            shadowOpacity: 0.18,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
            elevation: 12,
          }}
        >
          <CardSettingsAction
            label={selectedSet ? `Save to ${selectedSet.name}` : "Save to set"}
            icon={<Save size={18} color="#20242d" strokeWidth={2.4} />}
            onPress={onSaveToSet}
          />
          <CardSettingsAction
            label="Export card JSON"
            icon={<Download size={18} color="#20242d" strokeWidth={2.4} />}
            onPress={onExportCurrentCard}
          />
          <CardSettingsAction
            label={Platform.OS === "web" ? "Download card photo" : "Save card photo"}
            icon={<Download size={18} color="#20242d" strokeWidth={2.4} />}
            onPress={onExportCurrentCardImage}
          />
          {selectedSet ? (
            <>
              <CardSettingsAction
                label={`Export ${selectedSet.name} JSON`}
                icon={<BookOpen size={18} color="#20242d" strokeWidth={2.4} />}
                onPress={onExportSelectedSet}
              />
              <CardSettingsAction
                label={`Batch export ${selectedSet.name}`}
                icon={<Layers size={18} color="#20242d" strokeWidth={2.4} />}
                onPress={onExportSelectedSetBatch}
              />
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function PhysicalBackActionsMenu({
  width,
  onChangeBack,
  onAddCardBack,
  onClose,
}: {
  width: number;
  onChangeBack: () => void;
  onAddCardBack: () => void;
  onClose: () => void;
}) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 40,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width,
          borderRadius: 14,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: "rgba(216, 219, 226, 0.92)",
          backgroundColor: "rgba(255, 255, 255, 0.96)",
          padding: 8,
          gap: 8,
          boxShadow: "0 18px 36px rgba(0, 0, 0, 0.24)",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 }}>
          <Text
            selectable={false}
            style={{ flex: 1, color: "#151a22", fontSize: 14, fontWeight: "900" }}
          >
            Card Back
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close card back menu"
            onPress={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#f0f1f4",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={17} color="#20242d" strokeWidth={2.6} />
          </Pressable>
        </View>
        <CardSettingsAction
          label="Change card back"
          icon={<Palette size={18} color="#20242d" strokeWidth={2.4} />}
          onPress={onChangeBack}
        />
        <CardSettingsAction
          label="Add card to back"
          icon={<Plus size={18} color="#20242d" strokeWidth={2.4} />}
          onPress={onAddCardBack}
        />
      </View>
    </View>
  );
}

function QuickNewCardMenu({
  selectedAction,
  onSelectAction,
}: {
  selectedAction: NewCardPrimaryAction;
  onSelectAction: (action: NewCardPrimaryAction) => void;
}) {
  const actions: NewCardPrimaryAction[] = [
    "saveAsk",
    "saveThenStart",
    "startBlank",
    "randomize",
    "reset",
  ];

  return (
    <View
      style={{
        width: "100%",
        borderRadius: 12,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: "#d8dbe2",
        backgroundColor: "#ffffff",
        padding: 8,
        gap: 8,
      }}
    >
      {actions.map((action) => {
        const selected = selectedAction === action;
        const color = selected ? "#ffffff" : "#20242d";

        return (
          <CardSettingsAction
            key={action}
            label={getNewCardActionLabel(action)}
            icon={getNewCardActionIcon(action, color, 18)}
            selected={selected}
            destructive={action === "reset"}
            onPress={() => onSelectAction(action)}
          />
        );
      })}
    </View>
  );
}

function CardEditMenu({
  open,
  menuWidth,
  menuCenterOffset = 0,
  typeFrame,
  activeSection,
  sheetSection,
  onToggle,
  onSelectSection,
}: {
  open: boolean;
  menuWidth: number;
  menuCenterOffset?: number;
  typeFrame: NonNullable<CardDraft["typeFrame"]> | "standard";
  activeSection: CardSection | null;
  sheetSection: CardSection | null;
  onToggle: () => void;
  onSelectSection: (section: CardSection) => void;
}) {
  return (
    <View
      style={{
        width: PREVIEW_ACTION_BUTTON_SIZE,
        minHeight: 48,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: open ? 20 : 1,
      }}
    >
      <PreviewActionButton
        accessibilityLabel={open ? "Close card edit menu" : "Open card edit menu"}
        selected={open}
        onPress={onToggle}
        icon={<Pencil size={21} color={open ? "#ffffff" : "#20242d"} strokeWidth={2.5} />}
      />

      {open ? (
        <View
          style={{
            position: "absolute",
            bottom: 56,
            left: -(menuWidth - PREVIEW_ACTION_BUTTON_SIZE) / 2 - menuCenterOffset,
            width: menuWidth,
            shadowColor: "#000000",
            shadowOpacity: 0.18,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
            elevation: 12,
          }}
        >
          <EditSectionList
            typeFrame={typeFrame}
            activeSection={activeSection}
            sheetSection={sheetSection}
            onSelectSection={onSelectSection}
          />
        </View>
      ) : null}
    </View>
  );
}

function FrameTreatmentPreviewGrid({
  frameIdentity,
  treatments,
  selectedTreatment,
  selectedShowcaseFrame,
  hasAlternateFrameTypes,
  menuWidth,
  maxHeight = 432,
  showBack = true,
  onBack,
  onSelect,
  onSelectShowcase,
}: {
  frameIdentity: FrameIdentity;
  treatments: FrameTreatment[];
  selectedTreatment: FrameTreatment;
  selectedShowcaseFrame: ShowcaseFrameId;
  hasAlternateFrameTypes: boolean;
  menuWidth: number;
  maxHeight?: number;
  showBack?: boolean;
  onBack: () => void;
  onSelect: (frameTreatment: FrameTreatment) => void;
  onSelectShowcase: (showcaseFrame: ShowcaseFrameId) => void;
}) {
  const options: FrameMenuOption[] = hasAlternateFrameTypes
    ? [
        ...treatments
          .filter((treatment) => treatment !== "showcase")
          .map((treatment) => ({ kind: "treatment" as const, treatment })),
        ...(treatments.includes("showcase")
          ? SHOWCASE_FRAME_ORDER.map((showcaseFrame) => ({
              kind: "showcase" as const,
              showcaseFrame,
            }))
          : []),
      ]
    : [];

  return (
    <View style={{ gap: 8 }}>
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to card settings"
          onPress={onBack}
          style={{
            alignSelf: "flex-start",
            minHeight: 32,
            borderRadius: 8,
            borderCurve: "continuous",
            backgroundColor: "#f5f6f8",
            justifyContent: "center",
            paddingHorizontal: 10,
          }}
        >
          <Text selectable={false} style={{ color: "#151a22", fontSize: 12, fontWeight: "800" }}>
            Back
          </Text>
        </Pressable>
      ) : null}

      {options.length > 0 ? (
        <ScrollView
          showsVerticalScrollIndicator
          persistentScrollbar
          indicatorStyle="black"
          style={{ maxHeight, maxWidth: menuWidth - 16 }}
          contentContainerStyle={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "center",
            paddingRight: 6,
            paddingBottom: 2,
          }}
        >
          {options.map((option) =>
            option.kind === "treatment" ? (
              <FrameTreatmentPreviewButton
                key={option.treatment}
                frameIdentity={frameIdentity}
                treatment={option.treatment}
                selected={selectedTreatment === option.treatment}
                onPress={() => onSelect(option.treatment)}
              />
            ) : (
              <ShowcaseFramePreviewButton
                key={option.showcaseFrame}
                showcaseFrame={option.showcaseFrame}
                selected={selectedTreatment === "showcase" && selectedShowcaseFrame === option.showcaseFrame}
                onSelect={() => onSelectShowcase(option.showcaseFrame)}
              />
            ),
          )}
        </ScrollView>
      ) : (
        <Text selectable style={{ color: "#68707d", fontSize: 12, fontWeight: "700" }}>
          No alternate frame treatments for this layout.
        </Text>
      )}
    </View>
  );
}

function FrameTreatmentPreviewButton({
  frameIdentity,
  treatment,
  selected,
  onPress,
}: {
  frameIdentity: FrameIdentity;
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
        {treatment === "promo" ? (
          <View
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 9,
              height: 9,
              borderRadius: 5,
              backgroundColor: "#d7b45a",
            }}
          />
        ) : null}
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

function ShowcaseFramePreviewButton({
  showcaseFrame,
  selected,
  onSelect,
}: {
  showcaseFrame: ShowcaseFrameId;
  selected: boolean;
  onSelect: () => void;
}) {
  const spec = SHOWCASE_FRAMES[showcaseFrame];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Choose ${spec.label} showcase frame`}
      onPress={onSelect}
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

function CardSettingsAction({
  label,
  icon,
  selected = false,
  destructive = false,
  onPress,
}: {
  label: string;
  icon: ReactNode;
  selected?: boolean;
  destructive?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minHeight: 44,
        borderRadius: 9,
        borderCurve: "continuous",
        backgroundColor: selected ? "#151820" : destructive ? "#fff1f1" : "#f5f6f8",
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      {icon}
      <Text
        selectable={false}
        style={{
          color: selected ? "#ffffff" : destructive ? "#8e1d1d" : "#151a22",
          fontSize: 14,
          fontWeight: "800",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function EditSectionList({
  typeFrame,
  activeSection,
  sheetSection,
  onSelectSection,
}: {
  typeFrame: NonNullable<CardDraft["typeFrame"]> | "standard";
  activeSection: CardSection | null;
  sheetSection: CardSection | null;
  onSelectSection: (section: CardSection) => void;
}) {
  return (
    <View
      style={{
        borderRadius: 10,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: "#d8dbe2",
        backgroundColor: "#ffffff",
        overflow: "hidden",
      }}
    >
      {(
        [
          ["identity", "Name and Cost"],
          ["art", "Art"],
          ["typeLine", "Type Line"],
          ["rules", typeFrame === "planeswalker" ? "Rules and Loyalty" : "Rules Text"],
          ["aiPrompts", "AI Prompts"],
          ["printing", "Printing"],
        ] as const
      ).map(([section, label], index) => (
        <Pressable
          key={section}
          accessibilityRole="button"
          onPress={() => onSelectSection(section)}
          style={{
            minHeight: 50,
            paddingHorizontal: 14,
            flexDirection: "row",
            alignItems: "center",
            borderTopWidth: index === 0 ? 0 : 1,
            borderTopColor: "#eceef2",
            backgroundColor:
              activeSection === section || sheetSection === section ? "#eef8f4" : "#ffffff",
          }}
        >
          <Text
            selectable={false}
            style={{
              flex: 1,
              color: "#151a22",
              fontSize: 15,
              fontWeight: "800",
            }}
          >
            {label}
          </Text>
          <Text
            selectable={false}
            style={{ color: "#68707d", fontSize: 13, fontWeight: "700" }}
          >
            Edit
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function SetsPanel({
  sets,
  selectedSetId,
  newSetName,
  onChangeNewSetName,
  onSelectSet,
  onCreateSet,
  onRenameSet,
  onCreateCardInSet,
  onOpenCardFromSet,
  onRemoveCardFromSet,
  onRemoveSet,
  onChangeSetCardBack,
}: {
  sets: CardSet[];
  selectedSetId: string;
  newSetName: string;
  onChangeNewSetName: (name: string) => void;
  onSelectSet: (setId: string) => void;
  onCreateSet: () => void;
  onRenameSet: (setId: string, name: string) => void;
  onCreateCardInSet: (setId: string) => void;
  onOpenCardFromSet: (setId: string, snapshot: SetCardSnapshot) => void;
  onRemoveCardFromSet: (setId: string, cardId: string) => void;
  onRemoveSet: (setId: string) => void;
  onChangeSetCardBack: (setId: string, cardBackId: CardBackId) => void;
}) {
  const { width: viewportWidth } = useWindowDimensions();
  const [expandedSetIds, setExpandedSetIds] = useState<Set<string>>(() => new Set([selectedSetId]));
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editingSetName, setEditingSetName] = useState("");
  const [visibleCardLimits, setVisibleCardLimits] = useState<Record<string, number>>({});
  const gridContentWidth = Math.min(528, Math.max(260, viewportWidth - 128));
  const gridGap = 6;
  const gridColumns = 2;
  const gridItemWidth = Math.floor((gridContentWidth - gridGap * (gridColumns - 1)) / gridColumns);
  const previewWidth = Math.max(98, gridItemWidth);
  const blankCardHeight = previewWidth / CARD_BACK_PREVIEW_ASPECT_RATIO;

  useEffect(() => {
    setExpandedSetIds((current) => {
      if (current.has(selectedSetId)) {
        return current;
      }

      return new Set([selectedSetId]);
    });
  }, [selectedSetId]);

  const toggleSetExpansion = useCallback((setId: string) => {
    setExpandedSetIds((current) => {
      return current.has(setId) ? new Set() : new Set([setId]);
    });
  }, []);

  const openSetEditMode = useCallback((set: CardSet) => {
    onSelectSet(set.id);
    setExpandedSetIds(new Set([set.id]));
    setEditingSetId(set.id);
    setEditingSetName(set.name);
  }, [onSelectSet]);

  const closeSetEditMode = useCallback((setId: string) => {
    const nextName = editingSetName.trim();

    if (nextName) {
      onRenameSet(setId, nextName);
    }

    setEditingSetId(null);
    setEditingSetName("");
  }, [editingSetName, onRenameSet]);

  const showMoreCards = useCallback((setId: string) => {
    setVisibleCardLimits((current) => ({
      ...current,
      [setId]: (current[setId] ?? SET_GRID_INITIAL_CARD_LIMIT) + SET_GRID_PAGE_SIZE,
    }));
  }, []);

  const confirmDelete = useCallback((
    title: string,
    message: string,
    confirmLabel: string,
    onConfirm: () => void,
  ) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      if (window.confirm(message)) {
        onConfirm();
      }

      return;
    }

    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: confirmLabel, style: "destructive", onPress: onConfirm },
    ]);
  }, []);

  return (
    <View style={{ padding: 14, gap: 14, backgroundColor: "#f4f5f7" }}>
      <View style={{ gap: 10 }}>
        <EditorField
          label="New set name"
          value={newSetName}
          onChangeText={onChangeNewSetName}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create set"
          onPress={onCreateSet}
          style={{
            minHeight: 44,
            borderRadius: 8,
            borderCurve: "continuous",
            backgroundColor: newSetName.trim() ? "#151820" : "#c8ccd5",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            paddingHorizontal: 14,
          }}
        >
          <ListPlus size={17} color="#ffffff" strokeWidth={2.5} />
          <Text selectable={false} style={{ color: "#ffffff", fontSize: 14, fontWeight: "900" }}>
            Create set
          </Text>
        </Pressable>
      </View>

      <View style={{ gap: 10 }}>
        <Text
          selectable
          style={{ color: "#5f6470", fontSize: 12, fontWeight: "800", textTransform: "uppercase" }}
        >
          Saved Sets
        </Text>

        {sets.map((set) => {
          const selected = set.id === selectedSetId;
          const expanded = expandedSetIds.has(set.id);
          const setCardBackId = set.cardBackId ?? DEFAULT_CARD_BACK_ID;
          const setBarGradient = getSetBarGradient(set);
          const isEditingSet = editingSetId === set.id;
          const visibleCardLimit = visibleCardLimits[set.id] ?? SET_GRID_INITIAL_CARD_LIMIT;
          const visibleSetCards = set.cards.slice(0, visibleCardLimit);
          const hiddenCardCount = Math.max(0, set.cards.length - visibleSetCards.length);

          return (
            <View
              key={set.id}
              style={{
                borderRadius: 10,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: selected ? "#151820" : "#d8dbe2",
                backgroundColor: "#ffffff",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  minHeight: 52,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  backgroundColor: "#151820",
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  pointerEvents="none"
                  colors={setBarGradient.colors}
                  locations={setBarGradient.locations}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                  }}
                />
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    backgroundColor: selected ? "rgba(10, 12, 17, 0.34)" : "rgba(10, 12, 17, 0.44)",
                  }}
                />
                <Pressable
                  accessibilityRole={Platform.OS === "web" ? undefined : "button"}
                  accessibilityState={Platform.OS === "web" ? undefined : { selected, expanded }}
                  accessibilityLabel={`${expanded ? "Collapse" : "Expand"} ${set.name}`}
                  onPress={() => {
                    onSelectSet(set.id);
                    toggleSetExpansion(set.id);
                  }}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    alignSelf: "stretch",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <View
                    pointerEvents="none"
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: "rgba(255,255,255,0.16)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {expanded ? (
                      <ArrowUp size={16} color="#ffffff" strokeWidth={2.5} />
                    ) : (
                      <ArrowDown size={16} color="#ffffff" strokeWidth={2.5} />
                    )}
                  </View>
                  <View pointerEvents="none" style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Text
                      selectable={false}
                      numberOfLines={1}
                      style={{
                        color: "#ffffff",
                        fontSize: 15,
                        fontWeight: "900",
                      }}
                    >
                      {set.name}
                    </Text>
                    <Text
                      selectable={false}
                      numberOfLines={1}
                      style={{
                        color: "rgba(255,255,255,0.78)",
                        fontSize: 12,
                        fontWeight: "800",
                      }}
                    >
                      {set.cards.length} {set.cards.length === 1 ? "card" : "cards"}
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isEditingSet ? `Save ${set.name} changes` : `Edit ${set.name}`}
                  hitSlop={6}
                  onPress={(event) => {
                    event.stopPropagation();

                    if (isEditingSet) {
                      closeSetEditMode(set.id);
                    } else {
                      openSetEditMode(set);
                    }
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.28)",
                    backgroundColor: isEditingSet ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.14)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isEditingSet ? (
                    <Save size={16} color="#ffffff" strokeWidth={2.35} />
                  ) : (
                    <Pencil size={16} color="#ffffff" strokeWidth={2.35} />
                  )}
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${set.name}`}
                  hitSlop={6}
                  onPress={(event) => {
                    event.stopPropagation();
                    confirmDelete(
                      "Delete set?",
                      `Delete ${set.name}? This removes the set and its saved card snapshots from CardMagic.`,
                      "Delete",
                      () => onRemoveSet(set.id),
                    );
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.28)",
                    backgroundColor: "rgba(255,255,255,0.14)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Trash2 size={16} color="#ffffff" strokeWidth={2.35} />
                </Pressable>
              </View>

              {expanded ? (
                <View style={{ padding: 12, gap: 12, borderTopWidth: 1, borderTopColor: "#eceef2" }}>
                  {isEditingSet ? (
                    <View
                      style={{
                        borderRadius: 9,
                        borderCurve: "continuous",
                        borderWidth: 1,
                        borderColor: "#d8dbe2",
                        backgroundColor: "#ffffff",
                        padding: 10,
                        gap: 12,
                      }}
                    >
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
                          Set Name
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <TextInput
                            accessibilityLabel={`Set name for ${set.name}`}
                            value={editingSetName}
                            onChangeText={setEditingSetName}
                            onSubmitEditing={() => closeSetEditMode(set.id)}
                            returnKeyType="done"
                            style={{
                              flex: 1,
                              minHeight: 42,
                              borderRadius: 8,
                              borderCurve: "continuous",
                              borderWidth: 1,
                              borderColor: "#d4d8e0",
                              backgroundColor: "#f7f8fb",
                              color: "#151820",
                              fontSize: 15,
                              fontWeight: "800",
                              paddingHorizontal: 10,
                            }}
                          />
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Save ${set.name} name`}
                            onPress={() => closeSetEditMode(set.id)}
                            style={{
                              width: 42,
                              minHeight: 42,
                              borderRadius: 8,
                              borderCurve: "continuous",
                              backgroundColor: "#151820",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Save size={17} color="#ffffff" strokeWidth={2.4} />
                          </Pressable>
                        </View>
                      </View>

                      <View
                        style={{
                          height: 1,
                          backgroundColor: "#eceef2",
                        }}
                      />

                      <View>
                        <CardBackPicker
                          value={setCardBackId}
                          showSummary={false}
                          onChange={(cardBackId) => {
                            onSelectSet(set.id);
                            onChangeSetCardBack(set.id, cardBackId ?? DEFAULT_CARD_BACK_ID);
                          }}
                        />
                      </View>
                    </View>
                  ) : null}

                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: gridGap, alignItems: "flex-start" }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Create a new card in ${set.name}`}
                      onPress={() => onCreateCardInSet(set.id)}
                      style={{
                        width: previewWidth,
                        height: blankCardHeight,
                        borderRadius: SET_CARD_THUMBNAIL_RADIUS,
                        borderCurve: "continuous",
                        borderWidth: 2,
                        borderStyle: "dashed",
                        borderColor: "#aeb4c0",
                        backgroundColor: "#f7f8fb",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Plus size={32} color="#68707d" strokeWidth={2.6} />
                    </Pressable>
                    {visibleSetCards.map((snapshot) => {
                      const setCard = getSetCardPreviewCard(snapshot, set);

                      return (
                        <Pressable
                          key={snapshot.id}
                          accessibilityRole={Platform.OS === "web" ? undefined : "button"}
                          accessibilityLabel={`Open ${setCard.name || "Untitled Card"}`}
                          onPress={() => onOpenCardFromSet(set.id, snapshot)}
                          style={{
                            width: previewWidth,
                            alignItems: "center",
                            position: "relative",
                          }}
                        >
                          <View pointerEvents="none" style={{ alignItems: "center" }}>
                            <CardPreview
                              card={setCard}
                              activeSection={null}
                              width={previewWidth}
                              cornerRadius={SET_CARD_THUMBNAIL_RADIUS}
                              exportMode
                              onSectionPress={() => undefined}
                              onChange={() => undefined}
                            />
                          </View>
                          {isEditingSet ? (
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Remove ${setCard.name || "Untitled Card"} from ${set.name}`}
                              hitSlop={8}
                              onPress={(event) => {
                                event.stopPropagation();
                                confirmDelete(
                                  "Remove card?",
                                  `Remove ${setCard.name || "Untitled Card"} from ${set.name}?`,
                                  "Remove",
                                  () => onRemoveCardFromSet(set.id, snapshot.id),
                                );
                              }}
                              style={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                width: 30,
                                height: 30,
                                borderRadius: 15,
                                borderWidth: 1,
                                borderColor: "rgba(255,255,255,0.78)",
                                backgroundColor: "rgba(21,24,32,0.86)",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <X size={17} color="#ffffff" strokeWidth={2.8} />
                            </Pressable>
                          ) : null}
                        </Pressable>
                      );
                    })}
                    {hiddenCardCount > 0 ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Show ${hiddenCardCount} more cards in ${set.name}`}
                        onPress={() => showMoreCards(set.id)}
                        style={{
                          width: previewWidth,
                          height: blankCardHeight,
                          borderRadius: SET_CARD_THUMBNAIL_RADIUS,
                          borderCurve: "continuous",
                          backgroundColor: "#eef1f5",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 12,
                          gap: 6,
                        }}
                      >
                        <Plus size={24} color="#68707d" strokeWidth={2.6} />
                        <Text
                          selectable={false}
                          style={{
                            color: "#68707d",
                            fontSize: 12,
                            lineHeight: 15,
                            fontWeight: "900",
                            textAlign: "center",
                          }}
                        >
                          {hiddenCardCount} more
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

    </View>
  );
}

function getFrameTemplateSummary(template: CardFrameTemplate) {
  const typeFrame = template.data.typeFrame ?? "standard";
  const treatment = template.data.frameTreatment ?? "standard";
  const frameSelection = template.data.frameSelection ?? "auto";
  const colors = template.data.frameColors?.length ? template.data.frameColors.join("") : "auto";

  return `${typeFrame} · ${FRAME_TREATMENT_LABELS[treatment]} · ${FRAME_SELECTION_LABELS[frameSelection]} · ${colors}`;
}

function InspectorRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const Container = onPress ? Pressable : View;

  return (
    <Container
      accessibilityRole={onPress ? "button" : undefined}
      onPress={onPress}
      style={{
        minHeight: 62,
        borderRadius: 10,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: "#d8dbe2",
        backgroundColor: "#ffffff",
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: "#f0f1eb",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          selectable
          style={{
            color: "#6b7280",
            fontSize: 12,
            fontWeight: "800",
            textTransform: "uppercase",
          }}
        >
          {label}
        </Text>
        <Text
          selectable
          numberOfLines={2}
          style={{ color: "#151a22", fontSize: 15, fontWeight: "800", lineHeight: 19 }}
        >
          {value}
        </Text>
      </View>
    </Container>
  );
}
