import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { ArrowDown, ArrowUp, BookOpen, Bug, Check, ChevronDown, ChevronUp, Database, Download, Heart, Layers, ListPlus, MessageCircle, Minus, Palette, Pencil, Plus, RefreshCw, RotateCw, Save, Search, Share2, Shuffle, SlidersHorizontal, Sparkles, Tags, Trash2, Undo2, Upload, UserPlus, Users, X } from "lucide-react-native";
import { Component, memo, type ErrorInfo, type ReactNode, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ActivityIndicator,
  Alert,
  Image,
  type GestureResponderEvent,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  type LayoutChangeEvent,
  Modal,
  type NativeScrollEvent,
  NativeModules,
  type NativeSyntheticEvent,
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
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { captureRef as nativeViewShotCaptureRef } from "react-native-view-shot";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { AccountModal } from "@/components/account-modal";
import { CardBackPicker } from "@/components/card-back-picker";
import { CardBackPreview } from "@/components/card-back-preview";
import { CardTransformSurface } from "@/components/card-transform-surface";
import {
  CardPreview,
  getVisibleArtAspectRatioForCard,
  getVisibleArtRectForCard,
} from "@/components/card-preview";
import { loadHtmlImage, waitForFlattenedFrameComposites } from "@/lib/export-flatten";
import { EditorField } from "@/components/editor-field";
import { HybridSymbolStyleProvider } from "@/components/hybrid-symbol-style-context";
import {
  AchievementCompletionPopups,
  AchievementsModal,
  CreditStoreModal,
  LevelUpToasts,
  ProgressionHud,
  XpFloatingNumbers,
  type LevelUpToastItem,
  type XpFloatingNumber,
} from "@/components/progression-hud";
import { EarlyAccessCodeModal } from "@/components/early-access-code-modal";
import { GenerationButtonLabel } from "@/components/generation-button-label";
import { PatchNotesModal } from "@/components/patch-notes-modal";
import { KeywordLibraryPanel, SectionEditorModal, type GeneratedSetSymbolEntry } from "@/components/section-editor-modal";
import { SET_SYMBOL_PRESETS, SetSymbolMark } from "@/components/set-symbol";
import { DEFAULT_CARD_BACK_ID, getCardBackOption, type CustomCardBackEntry } from "@/data/card-backs";
import { FULL_MAGIC_PACK, getTypeFrameSpec } from "@/data/full-magic-pack";
import {
  getMseM15FrameTreatmentSource,
  getMseM15MainframeSource,
} from "@/data/mse-frame-renderer";
import {
  DEFAULT_SHOWCASE_FRAME,
  SHOWCASE_FRAME_LABELS,
  SHOWCASE_FRAME_ORDER,
  SHOWCASE_FRAMES,
  VISIBLE_SHOWCASE_FRAME_ORDER,
} from "@/data/showcase-frames";
import { INITIAL_CARD } from "@/data/sample-card";
import {
  ART_GENERATOR_STYLE_OPTIONS,
  type ArtGeneratorStyleId,
  buildArtGeneratorPrompt,
  buildCardBackGeneratorPrompt,
  buildSetSymbolGeneratorPrompt,
  buildRulesTextFixerPrompt,
  getDefaultArtGeneratorRequest,
} from "@/lib/ai-prompts";
import {
  useMobileBrowserBottomInset,
  useMobileWebInputZoomGuard,
  useWebTextSelectionGuard,
} from "@/hooks/browser-guards";
import {
  getWebStorageItem,
  isWebMediaReference,
  persistWebMediaUri,
  resolveWebMediaUri,
  setWebStorageItem,
} from "@/lib/web-media-store";
import {
  fetchAccountProfile,
  type AccountProfile,
} from "@/lib/account-profile";
import {
  fetchCommunityCards,
  fetchCommunityCardComments,
  fetchCommunityFeaturedCard,
  fetchCommunityPolls,
  fetchCommunitySetCards,
  fetchCommunitySets,
  fetchCollaborationSetCards,
  fetchCollaborationSetMembers,
  fetchCollaborationSetPendingInvites,
  fetchCollaborationSets,
  fetchRemoteCustomSetSymbols,
  fetchRemoteCardSets,
  markCommunityCardsSeen,
  createCommunityPoll,
  inviteCollaborationSetMember,
  publishCommunityCard,
  replaceRemoteCustomSetSymbols,
  replaceRemoteCardSets,
  saveCommunityCardComment,
  searchCollaborationInviteProfiles,
  setCommunityPollStatus,
  submitCommunityFeedback,
  submitCommunityPollVote,
  toggleCommunityCardLike,
  toggleCommunityUserFollow,
  updateCommunityDisplayName,
  uploadCommunityCardImage,
  uploadCommunityFeedbackScreenshot,
  type AccountCardSetPayload,
  type AccountCustomSetSymbolPayload,
  type CommunityCardFeedSort,
  type CommunityCardPagePayload,
  type CommunityCardCommentPayload,
  type CommunityCardPayload,
  type CollaborationSetPayload,
  type CommunityFeedbackType,
  type CommunityPollPayload,
  type CommunityPollSelectionType,
  type CommunitySetCardPayload,
  type CommunitySetPayload,
  type CollaborationInviteProfileSuggestion,
  type CollaborationPendingInvitePayload,
  type CollaborationSetMemberPayload,
} from "@/lib/account-sets";
import {
  fixRulesTextViaEdge,
  generateAiImageEditViaEdge,
  generateAiImageViaEdge,
  generateSubjectMatteViaEdge,
  type AiCreditProgressResponse,
  type AiImageGenerationOptions,
  SubjectMatteProviderError,
  type SubjectMatteDiagnostics,
} from "@/lib/ai-edge";
import {
  createStripeCheckoutUrl,
  fetchRemoteUserProgress,
  hasRedeemedPromotionalCreditCode,
  recordCreditTransaction,
  updateRemoteUserProgress,
  type CheckoutProductId,
  type CreditTransactionType,
} from "@/lib/commerce";
import { getResizedCommunityImageUrl } from "@/lib/community-image";
import {
  CARDMAGIC_RELEASE_BRANCH,
  CARDMAGIC_VISIBLE_PATCH_NOTES,
} from "@/lib/patch-notes";
import {
  FRAME_SELECTION_LABELS,
  FRAME_TREATMENT_LABELS,
  getFrameColors,
  inferFrameIdentity,
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
import {
  applyProgressEvent,
  canSpendCredits,
  createDefaultUserProgress,
  CREDIT_SPEND_COSTS,
  getXpLevelState,
  grantPromotionalCredits,
  normalizeUserProgressProfile,
  spendProgressCredits,
  type AchievementDefinition,
  type CreditPackId,
  type CreditSpendCategory,
  type ProgressMutationResult,
  type ProgressEventType,
  type UserProgressProfile,
} from "@/lib/progression";
import { fetchCardMagicReleaseDeployment, type CardMagicReleaseDeployment } from "@/lib/release-metadata";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getSplitHalf, getSplitLayout, isSplitTypeFrame, toSplitHalfCard } from "@/lib/split-card";
import {
  ArtTransform,
  CardBackId,
  CardDraft,
  CardRarity,
  CardSection,
  CardTextColorPreset,
  DfcFace,
  DfcMode,
  FrameCustomization,
  FrameIdentity,
  FrameSelection,
  FrameTreatment,
  KeywordDefinition,
  ManaColor,
  PlaneswalkerLoyaltyAbility,
  ShowcaseFrameId,
  SplitCardHalf,
  SplitCardLayout,
  SubjectMaskComponent,
  TypeFrame,
} from "@/types/card";

const BORDERLESS_TREATMENT_PREVIEW_SOURCE = require("./assets/card-assets/basic-m15/mse-renderer/treatments/borderless/mask-frame.png");
const PACKAGE_METADATA = require("./package.json") as { version: string };
const CARDMAGIC_APP_VERSION = PACKAGE_METADATA.version;
const CARDMAGIC_SINGLE_EXPORT_PREVIEW_ID = "cardmagic-single-export-preview";
const CARDMAGIC_BATCH_EXPORT_PREVIEW_ID = "cardmagic-batch-export-preview";
const CARDMAGIC_SET_THUMBNAIL_LAZY_ROOT_MARGIN = "720px 0px";
type InspectorTab = "edit" | "keywords" | "sets" | "community";
type VisibleInspectorTab = Exclude<InspectorTab, "keywords">;
type MainScrollBoundaryHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
type MainScrollWindow = {
  offsetY: number;
  viewportHeight: number;
};

type SetCardSnapshot = {
  id: string;
  savedAt: string;
  card: CardDraft;
};

type CardRecoverySnapshot = {
  id: string;
  savedAt: string;
  reason: "tab-switch" | "autosave";
  setId: string;
  setName: string;
  activeSetCardId: string | null;
  card: CardDraft;
};

type CardSet = {
  id: string;
  name: string;
  code: string;
  ownerUserId?: string;
  ownerName?: string;
  collaborationRole?: CollaborationSetPayload["role"];
  cardBackId?: CardBackId;
  setSymbolPreset?: string;
  setSymbolId?: string;
  setSymbolUri?: string;
  setSymbolUsesRarityTreatment?: boolean;
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

type AchievementPopup = AchievementDefinition & {
  popupId: string;
};

const XP_FLOAT_COLORS = ["#0b7180", "#6b4fc4", "#c58b17", "#228555", "#d45a2a"] as const;

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
      footerOwnerName?: string;
      artImageAspectRatio?: number | null;
      // Flatten masked layers (borderless pinline, rarity set symbol) into plain
      // raster images via offscreen canvas so the html2canvas capture renders
      // them faithfully. Set for web exports.
      flattenMasksExport?: boolean;
    }
  | {
      kind: "back";
      cardBackId: CardBackId;
    };

type WebPhotoExport = {
  fileName: string;
  dataUri: string;
};

type PreviewToolbarPosition = {
  x: number;
  y: number;
};

type PreviewToolbarOrientation = "horizontal" | "vertical";

type WebFileActionResult = "shared" | "saved" | "opened" | "cancelled";

type ExportConfirmationToastState = {
  id: string;
  message: string;
};

type AuthToastState = {
  id: string;
  message: string;
};

type DeletedSetTombstone = {
  id: string;
  deletedAt: string;
};

type DeletedCardTombstone = {
  setId: string;
  cardId: string;
  deletedAt: string;
};

type DeletionTombstones = {
  sets: DeletedSetTombstone[];
  cards: DeletedCardTombstone[];
};

type DeleteUndoState =
  | {
      id: string;
      kind: "card";
      message: string;
      setId: string;
      snapshot: SetCardSnapshot;
      index: number;
    }
  | {
      id: string;
      kind: "set";
      message: string;
      set: CardSet;
      index: number;
    };

type WebFileSystemWritableFileStream = {
  write: (data: Blob) => Promise<void>;
  close: () => Promise<void>;
  abort?: () => Promise<void>;
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

type JsZipStreamHelper = {
  on: (
    event: "data" | "error" | "end",
    callback: ((chunk: Uint8Array) => void) | ((error: unknown) => void) | (() => void),
  ) => JsZipStreamHelper;
  pause: () => JsZipStreamHelper;
  resume: () => JsZipStreamHelper;
};

type JsZipArchiveLike = {
  generateAsync(options: { type: "uint8array"; streamFiles?: boolean }): Promise<Uint8Array>;
  generateAsync(options: { type: "blob"; streamFiles?: boolean }): Promise<Blob>;
  generateInternalStream: (options: { type: "uint8array"; streamFiles?: boolean }) => JsZipStreamHelper;
};
type JsZipFilePayload = string | Uint8Array | Blob;
type JsZipFolderLike = {
  file: (name: string, payload: JsZipFilePayload) => unknown;
};
type JsZipMutableArchiveLike = JsZipArchiveLike &
  JsZipFolderLike & {
    folder: (name: string) => JsZipFolderLike | null;
  };

type WebStreamingZipEntry = {
  fileNameBytes: Uint8Array;
  crc32: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
  modifiedAt: Date;
};

type WebStreamingZipWriter = {
  addFile: (fileName: string, data: string | Uint8Array) => Promise<void>;
  close: () => Promise<void>;
  abort: () => Promise<void>;
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
const CARD_BACK_MAX_DIMENSION = 1536;
const AUXILIARY_IMAGE_MAX_DIMENSION = 512;
const CARD_SET_STORAGE_KEY = "cardmagic.savedSets.v1";
const DELETION_TOMBSTONE_STORAGE_KEY = "cardmagic.deletionTombstones.v1";
const ACTIVE_CARD_STORAGE_KEY = "cardmagic.activeCard.v1";
const CARD_RECOVERY_SNAPSHOT_STORAGE_KEY = "cardmagic.cardRecoverySnapshots.v1";
const CARD_RECOVERY_SNAPSHOT_LIMIT = 24;
const ART_LIBRARY_STORAGE_KEY = "cardmagic.artLibrary.v1";
const CUSTOM_CARD_BACK_STORAGE_KEY = "cardmagic.customCardBacks.v1";
const DEFAULT_CARD_BACK_RESKIN_ID = "custom:card-back-default-reskin" as CardBackId;
const GENERATED_SET_SYMBOL_STORAGE_KEY = "cardmagic.generatedSetSymbols.v1";
const USER_PROGRESS_STORAGE_KEY = "cardmagic.userProgress.v1";
const EARLY_ACCESS_CODE_PROMPT_STORAGE_KEY = "cardmagic.earlyAccessCodePrompt.v1";
const EARLY_ACCESS_CREDIT_CODE = "EARLYACCESS100";
const REDEEMED_CREDIT_CODES_STORAGE_KEY = "cardmagic.redeemedCreditCodes.v1";
const PREVIEW_TOOLBAR_POSITION_STORAGE_KEY = "cardmagic.previewToolbarPosition.v1";
const PREVIEW_TOOLBAR_ORIENTATION_STORAGE_KEY = "cardmagic.previewToolbarOrientation.v1";
const PROMOTIONAL_CREDIT_CODES: Record<string, number> = {
  CARDMAGIC100: 100,
  CHILLIN1000: 1000,
  EARLYACCESS100: 100,
};
const STORAGE_LOG_PREFIX = "[CardMagic storage]";
const OPENAI_CARD_ART_IMAGE_BASE_OPTIONS = {
  size: "1536x1024",
} as const;
const OPENAI_AUXILIARY_IMAGE_OPTIONS = {
  size: "1024x1024",
  quality: "medium",
} as const;
const PREVIEW_ACTION_BUTTON_SIZE = 44;
const PREVIEW_ACTION_BUTTON_GAP = 10;
const PREVIEW_ACTION_TOOLBAR_PADDING = 7;
const PREVIEW_ACTION_HORIZONTAL_GAP = 8;
const PREVIEW_ACTION_GRABBER_SIZE = 22;
const PREVIEW_ACTION_TOOLBAR_EDGE_MARGIN = 10;
const PREVIEW_ACTION_TOOLBAR_MENU_GAP = 10;
const FRAME_STYLE_PREVIEW_BUTTON_WIDTH = 76;
const FRAME_STYLE_PREVIEW_GRID_GAP = 8;
const FRAME_STYLE_PREVIEW_SCROLL_PADDING_RIGHT = 6;
const FRAME_STYLE_MENU_HORIZONTAL_PADDING = 8;
const FRAME_STYLE_MENU_BASE_WIDTH =
  FRAME_STYLE_MENU_HORIZONTAL_PADDING * 2 +
  FRAME_STYLE_PREVIEW_BUTTON_WIDTH * 3 +
  FRAME_STYLE_PREVIEW_GRID_GAP * 2 +
  FRAME_STYLE_PREVIEW_SCROLL_PADDING_RIGHT;
const PREVIEW_FLOATING_TOOLBAR_CARD_GAP_RESERVE = 18;
const PREVIEW_FLOATING_TOOLBAR_Z_INDEX = 12;
const PREVIEW_FLOATING_TOOLBAR_MENU_Z_INDEX = 24;
const EDIT_TAB_VERTICAL_CHROME_HEIGHT = 98;
const BOTTOM_TAB_BAR_HEIGHT = 62;
const DEFAULT_ART_TRANSFORM: ArtTransform = { offsetX: 0, offsetY: 0, scale: 1 };
// Shared stable no-op for read-only CardPreview renders (thumbnails, exports).
// A module-level reference lets the memoized CardPreview skip re-rendering when
// its host re-renders, instead of receiving a fresh `() => undefined` each time.
const noopCardPreviewHandler = () => undefined;
const CARD_BACK_PREVIEW_ASPECT_RATIO = 375 / 523;
const ART_ADJUSTMENT_CROP_RADIUS = 6;
const ART_LIBRARY_MAX_ENTRIES = 96;
const CUSTOM_CARD_BACK_MAX_ENTRIES = 48;
const GENERATED_SET_SYMBOL_MAX_ENTRIES = 48;
const ART_LIBRARY_VISIBLE_THUMBNAIL_LIMIT = 32;
const SET_GRID_INITIAL_CARD_LIMIT = 12;
const SET_GRID_PAGE_SIZE = 12;
const SET_GRID_COMPACT_EAGER_PREVIEW_COUNT = 2;
const SET_CARD_THUMBNAIL_RADIUS = 5;
const COLOR_IDENTITY_SORT_ORDER: ManaColor[] = ["W", "U", "B", "R", "G"];
const ART_IMAGE_QUALITY_OPTIONS = [
  {
    value: "medium",
    label: "Medium",
    detail: `${CREDIT_SPEND_COSTS.artImage} credits`,
    spendCategory: "artImage",
  },
  {
    value: "high",
    label: "High",
    detail: `${CREDIT_SPEND_COSTS.artImageHigh} credits`,
    spendCategory: "artImageHigh",
  },
] as const;

type ArtImageQuality = (typeof ART_IMAGE_QUALITY_OPTIONS)[number]["value"];
type CardBackGeneratorMode = "reskin" | "custom";

type PickedImageAsset = Pick<ImagePicker.ImagePickerAsset, "uri" | "width" | "height">;
type ArtAdjustmentInitialMode = "crop" | "mask";

type StoredActiveCardDraft = {
  schemaVersion: 1;
  card: CardDraft;
};

type StoredCardRecoverySnapshots = {
  schemaVersion: 1;
  snapshots: CardRecoverySnapshot[];
};

function getArtImageQualitySpendCategory(quality: ArtImageQuality): CreditSpendCategory {
  return quality === "high" ? "artImageHigh" : "artImage";
}

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

function getImageUriExtension(uri: string, fallback = "png") {
  const path = uri.split("?")[0]?.split("#")[0] ?? uri;
  const extension = path.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();

  if (!extension) {
    return fallback;
  }

  return extension === "jpeg" ? "jpg" : extension;
}

async function materializeExternalImageUri(uri: string, prefix: string) {
  if (Platform.OS === "web") {
    return readWebImageUriAsDataUri(uri, `image/${getImageUriExtension(uri)}`);
  }

  if (!hasNativeModule("ExpoFileSystem")) {
    return uri;
  }

  try {
    const FileSystem = await import("expo-file-system");
    const documentUri = FileSystem.Paths.document.uri;

    if (uri.startsWith(documentUri)) {
      return uri;
    }

    const safePrefix = prefix.replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "") || "cardmagic-image";
    const safeExtension = getImageUriExtension(uri).replace(/[^a-z0-9]+/gi, "").toLowerCase() || "png";
    const destination = new FileSystem.File(
      FileSystem.Paths.document,
      `${safePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExtension}`,
    );

    if (/^https?:\/\//i.test(uri)) {
      const downloaded = await FileSystem.File.downloadFileAsync(uri, destination, { idempotent: true });
      return downloaded.uri;
    }

    new FileSystem.File(uri).copy(destination);
    return destination.uri;
  } catch (error) {
    console.warn("Unable to materialize external image URI; keeping original image URI.", error);
    return uri;
  }
}

async function materializeImageUri(uri: string, prefix: string) {
  if (Platform.OS === "web" && isWebMediaReference(uri)) {
    return resolveWebMediaUri(uri, `image/${getImageUriExtension(uri)}`);
  }

  const dataUriParts = getImageDataUriParts(uri);

  if (dataUriParts) {
    return materializeBase64ImageUri(dataUriParts.base64, dataUriParts.extension, prefix);
  }

  return materializeExternalImageUri(uri, prefix);
}

function getImageUriLogDescriptor(uri: string) {
  if (uri.startsWith("data:")) {
    return { kind: "data-uri", length: uri.length };
  }

  if (uri.startsWith("blob:")) {
    return { kind: "blob-uri", length: uri.length };
  }

  if (/^https?:\/\//i.test(uri)) {
    try {
      const url = new URL(uri);

      return { kind: "remote-uri", origin: url.origin, length: uri.length };
    } catch {
      return { kind: "remote-uri", length: uri.length };
    }
  }

  if (uri.startsWith("file:")) {
    return { kind: "file-uri", length: uri.length };
  }

  return { kind: "uri", length: uri.length };
}

async function materializeCardDraftImageDataUris(card: CardDraft, prefix: string): Promise<CardDraft> {
  const imageKeys = ["artUri", "artSubjectMaskUri", "backArtUri", "backArtSubjectMaskUri", "setSymbolUri", "watermarkUri"] as const;
  let nextCard = card;

  for (const key of imageKeys) {
    const uri = nextCard[key];

    if (!uri) {
      continue;
    }

    let materializedUri = uri;

    try {
      materializedUri = await materializeImageUri(uri, `${prefix}-${key}`);
    } catch (error) {
      logStorageWarning("Unable to materialize stored card image URI; preserving original URI.", {
        prefix,
        field: key,
        uri: getImageUriLogDescriptor(uri),
        error,
      });
      continue;
    }

    if (materializedUri !== uri) {
      nextCard = {
        ...nextCard,
        [key]: materializedUri,
      };
    }
  }

  const materializeSubjectMaskComponents = async (
    key: "artSubjectMaskComponents" | "backArtSubjectMaskComponents",
  ) => {
    const components = nextCard[key];

    if (!components || components.length === 0) {
      return;
    }

    let changed = false;
    const nextComponents: SubjectMaskComponent[] = [];

    for (let index = 0; index < components.length; index += 1) {
      const component = components[index];
      let cutoutUrl = component.cutoutUrl;

      try {
        cutoutUrl = await materializeImageUri(component.cutoutUrl, `${prefix}-${key}-${index}`);
      } catch (error) {
        logStorageWarning("Unable to materialize stored subject-mask component URI; preserving original URI.", {
          prefix,
          field: key,
          concept: component.concept,
          uri: getImageUriLogDescriptor(component.cutoutUrl),
          error,
        });
      }

      if (cutoutUrl !== component.cutoutUrl) {
        changed = true;
      }

      nextComponents.push({
        ...component,
        cutoutUrl,
      });
    }

    if (changed) {
      nextCard = {
        ...nextCard,
        [key]: nextComponents,
      };
    }
  };

  await materializeSubjectMaskComponents("artSubjectMaskComponents");
  await materializeSubjectMaskComponents("backArtSubjectMaskComponents");

  return nextCard;
}

async function materializeCardSetImageDataUris(set: CardSet): Promise<CardSet> {
  let changed = false;
  let setSymbolUri = set.setSymbolUri;
  const cards: SetCardSnapshot[] = [];

  if (setSymbolUri) {
    try {
      const materializedSetSymbolUri = await materializeImageUri(setSymbolUri, `set-${set.id}-default-set-symbol`);

      if (materializedSetSymbolUri !== setSymbolUri) {
        setSymbolUri = materializedSetSymbolUri;
        changed = true;
      }
    } catch (error) {
      logStorageWarning("Unable to materialize set default symbol URI; preserving original URI.", {
        setId: set.id,
        uri: getImageUriLogDescriptor(setSymbolUri),
        error,
      });
    }
  }

  for (const snapshot of set.cards) {
    const card = await materializeCardDraftImageDataUris(snapshot.card, `set-${set.id}-${snapshot.id}`);

    if (card !== snapshot.card) {
      changed = true;
      cards.push({ ...snapshot, card });
    } else {
      cards.push(snapshot);
    }
  }

  return changed ? { ...set, setSymbolUri, cards } : set;
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
    let uri = entry.uri;

    try {
      uri = await materializeImageUri(entry.uri, `art-library-${entry.id}`);
    } catch (error) {
      console.warn("Unable to materialize stored art-library image; keeping original URI.", error);
    }

    materializedEntries.push(uri === entry.uri ? entry : { ...entry, uri });
  }

  return materializedEntries;
}

async function materializeGeneratedSetSymbolImageDataUris(
  entries: GeneratedSetSymbolEntry[],
): Promise<GeneratedSetSymbolEntry[]> {
  const materializedEntries: GeneratedSetSymbolEntry[] = [];

  for (const entry of entries) {
    const uri = await materializeImageUri(entry.uri, `set-symbol-${entry.id}`);

    materializedEntries.push(uri === entry.uri ? entry : { ...entry, uri });
  }

  return materializedEntries;
}

async function materializeCustomCardBackImageDataUris(
  entries: CustomCardBackEntry[],
): Promise<CustomCardBackEntry[]> {
  const materializedEntries: CustomCardBackEntry[] = [];

  for (const entry of entries) {
    const uri = await materializeImageUri(entry.uri, `card-back-${entry.id.replace(/^custom:/, "")}`);

    materializedEntries.push(uri === entry.uri ? entry : { ...entry, uri });
  }

  return materializedEntries;
}

async function persistImageUri(uri: string, prefix: string) {
  if (Platform.OS === "web") {
    return persistWebMediaUri(uri, prefix, `image/${getImageUriExtension(uri)}`);
  }

  return materializeImageUri(uri, prefix);
}

async function persistCardDraftImageUris(card: CardDraft, prefix: string): Promise<CardDraft> {
  const imageKeys = ["artUri", "artSubjectMaskUri", "backArtUri", "backArtSubjectMaskUri", "setSymbolUri", "watermarkUri"] as const;
  let nextCard = card;

  for (const key of imageKeys) {
    const uri = nextCard[key];

    if (!uri) {
      continue;
    }

    let persistedUri = uri;

    try {
      persistedUri = await persistImageUri(uri, `${prefix}-${key}`);
    } catch (error) {
      logStorageWarning("Unable to persist card media URI; preserving original URI.", {
        prefix,
        field: key,
        uri: getImageUriLogDescriptor(uri),
        error,
      });
      continue;
    }

    if (persistedUri !== uri) {
      nextCard = {
        ...nextCard,
        [key]: persistedUri,
      };
    }
  }

  const persistSubjectMaskComponents = async (
    key: "artSubjectMaskComponents" | "backArtSubjectMaskComponents",
  ) => {
    const components = nextCard[key];

    if (!components || components.length === 0) {
      return;
    }

    let changed = false;
    const nextComponents: SubjectMaskComponent[] = [];

    for (let index = 0; index < components.length; index += 1) {
      const component = components[index];
      let cutoutUrl = component.cutoutUrl;

      try {
        cutoutUrl = await persistImageUri(component.cutoutUrl, `${prefix}-${key}-${index}`);
      } catch (error) {
        logStorageWarning("Unable to persist subject-mask component media; preserving original URI.", {
          prefix,
          field: key,
          concept: component.concept,
          uri: getImageUriLogDescriptor(component.cutoutUrl),
          error,
        });
      }

      if (cutoutUrl !== component.cutoutUrl) {
        changed = true;
      }

      nextComponents.push({
        ...component,
        cutoutUrl,
      });
    }

    if (changed) {
      nextCard = {
        ...nextCard,
        [key]: nextComponents,
      };
    }
  };

  await persistSubjectMaskComponents("artSubjectMaskComponents");
  await persistSubjectMaskComponents("backArtSubjectMaskComponents");

  return nextCard;
}

async function persistCardSetImageUris(set: CardSet): Promise<CardSet> {
  let changed = false;
  let setSymbolUri = set.setSymbolUri;
  const cards: SetCardSnapshot[] = [];

  if (setSymbolUri) {
    try {
      const persistedSetSymbolUri = await persistImageUri(setSymbolUri, `set-${set.id}-default-set-symbol`);

      if (persistedSetSymbolUri !== setSymbolUri) {
        setSymbolUri = persistedSetSymbolUri;
        changed = true;
      }
    } catch (error) {
      logStorageWarning("Unable to persist set default symbol media; preserving original URI.", {
        setId: set.id,
        uri: getImageUriLogDescriptor(setSymbolUri),
        error,
      });
    }
  }

  for (const snapshot of set.cards) {
    const card = await persistCardDraftImageUris(snapshot.card, `set-${set.id}-${snapshot.id}`);

    if (card !== snapshot.card) {
      changed = true;
      cards.push({ ...snapshot, card });
    } else {
      cards.push(snapshot);
    }
  }

  return changed ? { ...set, setSymbolUri, cards } : set;
}

async function persistCardSetsImageUris(sets: CardSet[]): Promise<CardSet[]> {
  const persistedSets: CardSet[] = [];

  for (const set of sets) {
    persistedSets.push(await persistCardSetImageUris(set));
  }

  return persistedSets;
}

async function persistArtLibraryImageUris(entries: ArtLibraryEntry[]): Promise<ArtLibraryEntry[]> {
  const persistedEntries: ArtLibraryEntry[] = [];

  for (const entry of entries) {
    let uri = entry.uri;

    try {
      uri = await persistImageUri(entry.uri, `art-library-${entry.id}`);
    } catch (error) {
      console.warn("Unable to persist art-library media; keeping original URI.", error);
    }

    persistedEntries.push(uri === entry.uri ? entry : { ...entry, uri });
  }

  return persistedEntries;
}

async function persistGeneratedSetSymbolImageUris(
  entries: GeneratedSetSymbolEntry[],
): Promise<GeneratedSetSymbolEntry[]> {
  const persistedEntries: GeneratedSetSymbolEntry[] = [];

  for (const entry of entries) {
    const uri = await persistImageUri(entry.uri, `set-symbol-${entry.id}`);

    persistedEntries.push(uri === entry.uri ? entry : { ...entry, uri });
  }

  return persistedEntries;
}

async function persistCustomCardBackImageUris(
  entries: CustomCardBackEntry[],
): Promise<CustomCardBackEntry[]> {
  const persistedEntries: CustomCardBackEntry[] = [];

  for (const entry of entries) {
    const uri = await persistImageUri(entry.uri, `card-back-${entry.id.replace(/^custom:/, "")}`);

    persistedEntries.push(uri === entry.uri ? entry : { ...entry, uri });
  }

  return persistedEntries;
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

function createPendingStripeCheckoutPopup() {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return null;
  }

  const popup = window.open("", "_blank", "popup,width=520,height=760");

  if (!popup) {
    return null;
  }

  popup.opener = null;
  popup.document.title = "Opening Stripe Checkout";
  popup.document.body.style.margin = "0";
  popup.document.body.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  popup.document.body.style.background = "#f7f8fb";

  const document = popup.document;
  const main = document.createElement("main");
  const section = document.createElement("section");
  const badge = document.createElement("div");
  const heading = document.createElement("h1");
  const copy = document.createElement("p");

  Object.assign(main.style, {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    color: "#111820",
  });
  Object.assign(section.style, {
    maxWidth: "320px",
    textAlign: "center",
  });
  Object.assign(badge.style, {
    width: "42px",
    height: "42px",
    borderRadius: "21px",
    background: "#111820",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    marginBottom: "14px",
  });
  Object.assign(heading.style, {
    fontSize: "20px",
    lineHeight: "1.2",
    margin: "0 0 8px",
    fontWeight: "900",
  });
  Object.assign(copy.style, {
    fontSize: "14px",
    lineHeight: "1.45",
    margin: "0",
    color: "#5f6570",
    fontWeight: "700",
  });

  badge.textContent = "CM";
  heading.textContent = "Opening Stripe Checkout";
  copy.textContent = "CardMagic is creating a secure checkout session.";
  section.append(badge, heading, copy);
  main.append(section);
  popup.document.body.replaceChildren(main);
  popup.focus();

  return popup;
}

async function openStripeCheckoutUrl(checkoutUrl: string, popup?: Window | null) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const checkoutWindow = popup && !popup.closed ? popup : window.open(checkoutUrl, "_blank", "popup,width=520,height=760");

    if (!checkoutWindow) {
      throw new Error("Safari blocked the Stripe Checkout popup. Allow pop-ups for CardMagic and try again.");
    }

    checkoutWindow.opener = null;
    checkoutWindow.location.href = checkoutUrl;
    checkoutWindow.focus();
    return;
  }

  const canOpen = await Linking.canOpenURL(checkoutUrl);

  if (!canOpen) {
    throw new Error("This device cannot open the Stripe Checkout URL.");
  }

  await Linking.openURL(checkoutUrl);
}

// SAM segmentation doesn't need full resolution — the returned mask is scaled
// back to the source dimensions during normalization. Downscaling shrinks the
// request body, which keeps concurrent (parallel) fal uploads under the
// HTTP/2 limit and speeds up inference. Aspect ratio is preserved (width-only
// resize), so per-axis upscaling during normalization realigns it.
const SUBJECT_MASK_REQUEST_MAX_DIMENSION = 640;

async function downscaleImageForMaskRequest(uri: string) {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: SUBJECT_MASK_REQUEST_MAX_DIMENSION } }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );

    if (result.base64) {
      return `data:image/jpeg;base64,${result.base64}`;
    }

    return Platform.OS === "web" ? await readWebImageUriAsDataUri(result.uri, "image/jpeg") : result.uri;
  } catch (error) {
    console.warn("Unable to downscale image for mask request; using full-size art.", error);
    return uri;
  }
}

async function normalizeGeneratedAuxiliaryImageUri(uri: string, prefix: string) {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: AUXILIARY_IMAGE_MAX_DIMENSION, height: AUXILIARY_IMAGE_MAX_DIMENSION } }],
      { compress: 0.92, format: ImageManipulator.SaveFormat.PNG, base64: true },
    );

    if (result.base64) {
      return await materializeBase64ImageUri(result.base64, "png", prefix);
    }

    return Platform.OS === "web" ? readWebImageUriAsDataUri(result.uri, "image/png") : result.uri;
  } catch (error) {
    console.warn("Unable to normalize generated auxiliary image; using generated URI.", error);
    return uri;
  }
}

async function normalizeCardBackImageUri(uri: string, prefix: string) {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024, height: CARD_BACK_MAX_DIMENSION } }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );

    if (result.base64) {
      return await materializeBase64ImageUri(result.base64, "jpg", prefix);
    }

    return Platform.OS === "web" ? readWebImageUriAsDataUri(result.uri, "image/jpeg") : result.uri;
  } catch (error) {
    console.warn("Unable to normalize generated card back; using generated URI.", error);
    return uri;
  }
}

function getDefaultCardBackImageUri() {
  const defaultBackSource = getCardBackOption(DEFAULT_CARD_BACK_ID).source;
  const resolvedSource = defaultBackSource ? Image.resolveAssetSource(defaultBackSource) : null;

  if (!resolvedSource?.uri) {
    throw new Error("The default CardMagic card back image asset could not be resolved.");
  }

  return resolvedSource.uri;
}

function loadWebImageElement(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Generated set symbol image could not be loaded."));

    if (/^https?:\/\//i.test(uri)) {
      image.crossOrigin = "anonymous";
    }

    image.src = uri;
  });
}

async function createWebSetSymbolAlphaMask(uri: string, size: number) {
  if (typeof document === "undefined") {
    return uri;
  }

  const image = await loadWebImageElement(uri);
  const sourceWidth = image.naturalWidth || image.width || size;
  const sourceHeight = image.naturalHeight || image.height || size;
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = sourceWidth;
  sourceCanvas.height = sourceHeight;

  const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });

  if (!sourceContext) {
    return uri;
  }

  sourceContext.clearRect(0, 0, sourceWidth, sourceHeight);
  sourceContext.drawImage(image, 0, 0, sourceWidth, sourceHeight);

  const imageData = sourceContext.getImageData(0, 0, sourceWidth, sourceHeight);
  const data = imageData.data;
  let minX = sourceWidth;
  let minY = sourceHeight;
  let maxX = -1;
  let maxY = -1;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];
    const luma = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    const chroma = Math.max(red, green, blue) - Math.min(red, green, blue);
    const isBackground = alpha < 8 || (luma > 215 && chroma < 56);
    const maskAlpha = isBackground ? 0 : clamp((255 - luma - 14) * 3.2, 0, 255);

    data[index] = 0;
    data[index + 1] = 0;
    data[index + 2] = 0;
    data[index + 3] = Math.round(maskAlpha);

    if (maskAlpha > 24) {
      const pixelIndex = index / 4;
      const pixelX = pixelIndex % sourceWidth;
      const pixelY = Math.floor(pixelIndex / sourceWidth);
      minX = Math.min(minX, pixelX);
      minY = Math.min(minY, pixelY);
      maxX = Math.max(maxX, pixelX);
      maxY = Math.max(maxY, pixelY);
    }
  }

  sourceContext.putImageData(imageData, 0, 0);

  if (maxX < minX || maxY < minY) {
    return sourceCanvas.toDataURL("image/png");
  }

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");

  if (!context) {
    return sourceCanvas.toDataURL("image/png");
  }

  const cropPadding = Math.max(2, Math.round(Math.min(sourceWidth, sourceHeight) * 0.02));
  const cropX = Math.max(0, minX - cropPadding);
  const cropY = Math.max(0, minY - cropPadding);
  const cropRight = Math.min(sourceWidth - 1, maxX + cropPadding);
  const cropBottom = Math.min(sourceHeight - 1, maxY + cropPadding);
  const cropWidth = Math.max(1, cropRight - cropX + 1);
  const cropHeight = Math.max(1, cropBottom - cropY + 1);
  const outputPadding = Math.round(size * 0.055);
  const outputMaxSize = size - outputPadding * 2;
  const scale = Math.min(outputMaxSize / cropWidth, outputMaxSize / cropHeight);
  const outputWidth = Math.max(1, Math.round(cropWidth * scale));
  const outputHeight = Math.max(1, Math.round(cropHeight * scale));
  const outputX = Math.round((size - outputWidth) / 2);
  const outputY = Math.round((size - outputHeight) / 2);

  context.clearRect(0, 0, size, size);
  context.imageSmoothingEnabled = true;
  context.drawImage(sourceCanvas, cropX, cropY, cropWidth, cropHeight, outputX, outputY, outputWidth, outputHeight);

  return canvas.toDataURL("image/png");
}

async function normalizeGeneratedSetSymbolImageUri(uri: string, prefix: string) {
  const normalizedUri = await normalizeGeneratedAuxiliaryImageUri(uri, prefix);

  if (Platform.OS !== "web") {
    return normalizedUri;
  }

  try {
    return await createWebSetSymbolAlphaMask(normalizedUri, AUXILIARY_IMAGE_MAX_DIMENSION);
  } catch (error) {
    console.warn("Unable to convert generated set symbol into an alpha mask; using normalized image.", error);
    return normalizedUri;
  }
}

async function normalizePickedSetSymbolImage(asset: PickedImageAsset) {
  const normalizedUri = await normalizePickedImage(asset, {
    maxDimension: AUXILIARY_IMAGE_MAX_DIMENSION,
    compress: 0.9,
    format: ImageManipulator.SaveFormat.PNG,
  });

  if (Platform.OS !== "web") {
    return normalizedUri;
  }

  try {
    return await createWebSetSymbolAlphaMask(normalizedUri, AUXILIARY_IMAGE_MAX_DIMENSION);
  } catch (error) {
    console.warn("Unable to trim uploaded set symbol into an alpha mask; using normalized image.", error);
    return normalizedUri;
  }
}

async function normalizeSubjectMatteImageUri(
  uri: string,
  sourceImageUri: string,
  options?: { keepAllComponents?: boolean },
) {
  const materializedUri = await materializeImageUri(uri, "subject-matte");

  if (Platform.OS !== "web") {
    return materializedUri;
  }

  try {
    return await createWebSubjectAlphaMask(materializedUri, sourceImageUri, options?.keepAllComponents);
  } catch (error) {
    console.warn("Unable to normalize subject matte alpha; using provider output.", error);
    return materializedUri;
  }
}

async function createWebSubjectAlphaMask(uri: string, sourceImageUri?: string, keepAllComponents = false) {
  if (typeof document === "undefined") {
    return uri;
  }

  const image = await loadWebImageElement(uri);
  const sourceImage = sourceImageUri ? await loadWebImageElement(sourceImageUri) : null;
  const width = sourceImage?.naturalWidth || sourceImage?.width || image.naturalWidth || image.width || 1024;
  const height = sourceImage?.naturalHeight || sourceImage?.height || image.naturalHeight || image.height || 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return uri;
  }

  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  const pixelCount = width * height;
  const sourceAlpha = new Uint8ClampedArray(pixelCount);
  let transparentPixelCount = 0;

  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] < 250) {
      transparentPixelCount += 1;
    }
  }

  const usesEmbeddedAlpha = transparentPixelCount > (data.length / 4) * 0.01;

  for (let index = 0; index < data.length; index += 4) {
    const pixelIndex = index / 4;
    const alpha = usesEmbeddedAlpha
      ? data[index + 3]
      : Math.round(0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2]);
    sourceAlpha[pixelIndex] = alpha;
  }

  // For merged multi-concept mattes the segmented regions are disconnected
  // (e.g. bow + wolf), so keep every region; the primary-component cleanup is
  // only correct for a single subject.
  const primarySubjectMask = keepAllComponents
    ? null
    : getPrimarySubjectComponentMask(sourceAlpha, width, height);

  for (let index = 0; index < data.length; index += 4) {
    const pixelIndex = index / 4;
    const alpha = sourceAlpha[pixelIndex];
    const cleanedAlpha = !primarySubjectMask || primarySubjectMask[pixelIndex]
      ? Math.round(clamp((alpha - 28) * 1.32, 0, 255))
      : 0;

    data[index] = 255;
    data[index + 1] = 255;
    data[index + 2] = 255;
    data[index + 3] = cleanedAlpha;
  }

  context.putImageData(imageData, 0, 0);

  return canvas.toDataURL("image/png");
}

function getPrimarySubjectComponentMask(alpha: Uint8ClampedArray, width: number, height: number) {
  const pixelCount = width * height;
  const componentLabels = new Int32Array(pixelCount);
  componentLabels.fill(-1);

  const seedThreshold = 84;
  const softThreshold = 28;
  const stack = new Int32Array(pixelCount);
  const componentStats: Array<{
    count: number;
    alphaSum: number;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  }> = [];
  let bestLabel = -1;
  let bestScore = 0;
  let currentLabel = 0;

  for (let start = 0; start < pixelCount; start += 1) {
    if (alpha[start] < seedThreshold || componentLabels[start] !== -1) {
      continue;
    }

    let stackLength = 0;
    let count = 0;
    let alphaSum = 0;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;

    stack[stackLength] = start;
    stackLength += 1;
    componentLabels[start] = currentLabel;

    while (stackLength > 0) {
      stackLength -= 1;
      const pixelIndex = stack[stackLength];
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);
      count += 1;
      alphaSum += alpha[pixelIndex];
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);

      for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
        for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
          if (xOffset === 0 && yOffset === 0) {
            continue;
          }

          const nextX = x + xOffset;
          const nextY = y + yOffset;

          if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
            continue;
          }

          const nextIndex = nextY * width + nextX;

          if (componentLabels[nextIndex] === -1 && alpha[nextIndex] >= seedThreshold) {
            componentLabels[nextIndex] = currentLabel;
            stack[stackLength] = nextIndex;
            stackLength += 1;
          }
        }
      }
    }

    const componentArea = Math.max(1, (maxX - minX + 1) * (maxY - minY + 1));
    const fillRatio = count / componentArea;
    const averageAlpha = alphaSum / Math.max(1, count);
    const minUsefulPixels = Math.max(96, pixelCount * 0.004);
    const score = count >= minUsefulPixels ? count * (0.75 + fillRatio) * (averageAlpha / 255) : 0;
    componentStats[currentLabel] = { count, alphaSum, minX, minY, maxX, maxY };

    if (score > bestScore) {
      bestScore = score;
      bestLabel = currentLabel;
    }

    currentLabel += 1;
  }

  const keepMask = new Uint8Array(pixelCount);

  if (bestLabel < 0) {
    for (let index = 0; index < pixelCount; index += 1) {
      keepMask[index] = alpha[index] >= seedThreshold ? 1 : 0;
    }

    return keepMask;
  }

  const primary = componentStats[bestLabel];
  const accessoryDistance = Math.max(16, Math.round(Math.min(width, height) * 0.13));
  const primaryAccessoryBounds = {
    minX: Math.max(0, primary.minX - accessoryDistance),
    minY: Math.max(0, primary.minY - accessoryDistance * 1.45),
    maxX: Math.min(width - 1, primary.maxX + accessoryDistance),
    maxY: Math.min(height - 1, primary.maxY + accessoryDistance * 0.48),
  };
  const keptLabels = new Set<number>([bestLabel]);

  componentStats.forEach((stats, label) => {
    if (label === bestLabel || !stats) {
      return;
    }

    const countRatio = stats.count / Math.max(1, primary.count);
    const averageAlpha = stats.alphaSum / Math.max(1, stats.count);
    const overlapsAccessoryBounds =
      stats.maxX >= primaryAccessoryBounds.minX &&
      stats.minX <= primaryAccessoryBounds.maxX &&
      stats.maxY >= primaryAccessoryBounds.minY &&
      stats.minY <= primaryAccessoryBounds.maxY;
    const closeEnough =
      getRectDistance(stats, primary) <= accessoryDistance ||
      overlapsAccessoryBounds;
    const likelyAccessory =
      stats.count >= Math.max(24, pixelCount * 0.00018) &&
      countRatio <= 0.42 &&
      averageAlpha >= 72 &&
      closeEnough;

    if (likelyAccessory) {
      keptLabels.add(label);
    }
  });

  for (let index = 0; index < pixelCount; index += 1) {
    if (keptLabels.has(componentLabels[index])) {
      keepMask[index] = 1;
    }
  }

  const featherMask = new Uint8Array(pixelCount);

  for (let index = 0; index < pixelCount; index += 1) {
    if (alpha[index] < softThreshold) {
      continue;
    }

    const x = index % width;
    const y = Math.floor(index / width);
    let nearPrimarySubject = false;

    for (let yOffset = -2; yOffset <= 2 && !nearPrimarySubject; yOffset += 1) {
      for (let xOffset = -2; xOffset <= 2; xOffset += 1) {
        const nextX = x + xOffset;
        const nextY = y + yOffset;

        if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
          continue;
        }

        if (keepMask[nextY * width + nextX]) {
          nearPrimarySubject = true;
          break;
        }
      }
    }

    featherMask[index] = nearPrimarySubject ? 1 : 0;
  }

  return featherMask;
}

function getRectDistance(
  first: { minX: number; minY: number; maxX: number; maxY: number },
  second: { minX: number; minY: number; maxX: number; maxY: number },
) {
  const xGap = first.maxX < second.minX
    ? second.minX - first.maxX
    : second.maxX < first.minX
      ? first.minX - second.maxX
      : 0;
  const yGap = first.maxY < second.minY
    ? second.minY - first.maxY
    : second.maxY < first.minY
      ? first.minY - second.maxY
      : 0;

  return Math.hypot(xGap, yGap);
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

const DEFAULT_MAIN_SET_NAME = "Main Set";
const DEFAULT_MAIN_SET_ID = "00000000-0000-4000-8000-000000000001";

function createDefaultCardSets(): CardSet[] {
  return [createDefaultCardSet(DEFAULT_MAIN_SET_NAME, DEFAULT_MAIN_SET_ID)];
}

function createDefaultCardSet(name: string, id = createUuid()): CardSet {
  return {
    id: normalizeSetId(id),
    name,
    code: generateSetCode(name),
    cardBackId: DEFAULT_CARD_BACK_ID,
    setSymbolPreset: SET_SYMBOL_PRESETS[0].id,
    cards: [],
  };
}

function createUuid(): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();

  if (randomUuid) {
    return randomUuid;
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const value = Math.floor(Math.random() * 16);
    const nibble = character === "x" ? value : (value & 0x3) | 0x8;
    return nibble.toString(16);
  });
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeSetId(value: unknown): string {
  return isUuid(value) ? value : createUuid();
}

function generateSetCode(name: string): string {
  const normalizedWords = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .match(/[A-Z0-9]+/g) ?? [];

  if (normalizedWords.length >= 3) {
    return normalizedWords.slice(0, 3).map((word) => word[0]).join("");
  }

  if (normalizedWords.length === 2) {
    return `${normalizedWords[0][0]}${normalizedWords[1].slice(0, 2)}`.padEnd(3, "X").slice(0, 3);
  }

  const compactName = normalizedWords.join("");
  return (compactName || "SET").slice(0, 3).padEnd(3, "X");
}

function normalizeSetCode(code: unknown, fallbackName = "Set"): string {
  if (typeof code === "string") {
    const compactCode = code
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 5);

    if (compactCode) {
      return compactCode;
    }
  }

  return generateSetCode(fallbackName);
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

function getSetSymbolDefaultsPatch(set?: CardSet): Partial<CardDraft> {
  if (!set) {
    return {};
  }

  const patch: Partial<CardDraft> = {
    setSymbolPreset: SET_SYMBOL_PRESETS[0].id,
    setSymbolId: undefined,
    setSymbolUri: undefined,
    setSymbolUsesRarityTreatment: undefined,
  };

  if (typeof set.setSymbolPreset === "string") {
    patch.setSymbolPreset = set.setSymbolPreset;
  }

  if (typeof set.setSymbolId === "string") {
    patch.setSymbolId = set.setSymbolId;
  }

  if (typeof set.setSymbolUri === "string") {
    patch.setSymbolUri = set.setSymbolUri;
  }

  if (typeof set.setSymbolUsesRarityTreatment === "boolean") {
    patch.setSymbolUsesRarityTreatment = set.setSymbolUsesRarityTreatment;
  }

  return patch;
}

function withResolvedSetCode(card: CardDraft, set?: CardSet): CardDraft {
  if (!set) {
    return card;
  }

  const setCode = normalizeSetCode(set.code, set.name);

  if (card.setCode === setCode) {
    return card;
  }

  return {
    ...card,
    setCode,
  };
}

function withResolvedSetSymbol(card: CardDraft, set?: CardSet): CardDraft {
  if (!set) {
    return card;
  }

  const defaultsPatch = getSetSymbolDefaultsPatch(set);

  return {
    ...card,
    ...defaultsPatch,
  };
}

function withResolvedSetDefaults(card: CardDraft, set?: CardSet): CardDraft {
  return withResolvedSetCode(withResolvedCardBack(withResolvedSetSymbol(card, set), set), set);
}

function normalizeCardDuplicateField(value: string | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function getCardDuplicateSignature(card: CardDraft) {
  return [
    normalizeCardDuplicateField(card.name),
    normalizeCardDuplicateField(card.manaCost),
    normalizeCardDuplicateField(card.typeLine),
    normalizeCardDuplicateField(card.rulesText),
    normalizeCardDuplicateField(card.power),
    normalizeCardDuplicateField(card.toughness),
    normalizeCardDuplicateField(card.frameTreatment),
    normalizeCardDuplicateField(card.typeFrame),
  ].join("|");
}

function findDuplicateSetCardSnapshot(
  set: CardSet | undefined,
  card: CardDraft,
  excludedSnapshotId: string | null,
) {
  if (!set) {
    return null;
  }

  const duplicateSignature = getCardDuplicateSignature(withResolvedSetDefaults(card, set));

  return (
    set.cards.find((snapshot) => {
      if (snapshot.id === excludedSnapshotId) {
        return false;
      }

      return getCardDuplicateSignature(snapshot.card) === duplicateSignature;
    }) ?? null
  );
}

function getCardNameSaveKey(card: CardDraft) {
  return normalizeCardDuplicateField(getEditableCardFace(card).name);
}

function findNamedSetCardSnapshot(
  set: CardSet | undefined,
  card: CardDraft,
  excludedSnapshotId: string | null,
) {
  if (!set) {
    return null;
  }

  const nameKey = getCardNameSaveKey(card);

  if (!nameKey) {
    return null;
  }

  return (
    set.cards.find((snapshot) => {
      if (snapshot.id === excludedSnapshotId) {
        return false;
      }

      return getCardNameSaveKey(snapshot.card) === nameKey;
    }) ?? null
  );
}

function saveCardDraftIntoSet(
  sets: CardSet[],
  selectedSetId: string,
  card: CardDraft,
  activeSetCardId: string | null,
  options?: {
    saveMode?: "auto" | "new" | "overwrite";
    overwriteSnapshotId?: string | null;
  },
) {
  const selectedSet = sets.find((set) => set.id === selectedSetId) ?? sets[0];

  if (!selectedSet) {
    return null;
  }

  const timestamp = new Date().toISOString();
  const resolvedCard = withResolvedSetDefaults(card, selectedSet);
  const snapshot = createSetCardSnapshot(resolvedCard);
  let savedSnapshot = snapshot;

  const nextSets = normalizeCardSets(
    sets.map((set) => {
      if (set.id !== selectedSet.id) {
        return set;
      }

      const overwriteSnapshotId =
        options?.saveMode === "overwrite"
          ? options.overwriteSnapshotId ?? activeSetCardId
          : options?.saveMode === "new"
            ? null
            : activeSetCardId;
      const updatesExistingSnapshot =
        overwriteSnapshotId !== null && set.cards.some((setCard) => setCard.id === overwriteSnapshotId);
      const savedSnapshotId = updatesExistingSnapshot ? overwriteSnapshotId : snapshot.id;
      const nextCards = updatesExistingSnapshot
        ? set.cards.map((setCard) =>
            setCard.id === overwriteSnapshotId
              ? { ...setCard, card: cloneCardDraft(resolvedCard), savedAt: timestamp }
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
  return coalesceCardSetsById(sets.map(normalizeCardSet));
}

function normalizeCardSet(set: CardSet): CardSet {
  const rawSet = set as Partial<CardSet>;
  const name = typeof rawSet.name === "string" && rawSet.name.trim() ? rawSet.name : "Untitled Set";
  const code = normalizeSetCode(rawSet.code, name);

  return {
    ...rawSet,
    id: normalizeSetId(rawSet.id),
    name,
    code,
    ownerUserId: typeof rawSet.ownerUserId === "string" && rawSet.ownerUserId.trim()
      ? rawSet.ownerUserId
      : undefined,
    ownerName: typeof rawSet.ownerName === "string" && rawSet.ownerName.trim()
      ? rawSet.ownerName
      : undefined,
    collaborationRole: rawSet.collaborationRole === "owner" || rawSet.collaborationRole === "editor"
      ? rawSet.collaborationRole
      : undefined,
    cardBackId: rawSet.cardBackId ?? DEFAULT_CARD_BACK_ID,
    setSymbolPreset: typeof rawSet.setSymbolPreset === "string" ? rawSet.setSymbolPreset : SET_SYMBOL_PRESETS[0].id,
    setSymbolId: typeof rawSet.setSymbolId === "string" ? rawSet.setSymbolId : undefined,
    setSymbolUri: typeof rawSet.setSymbolUri === "string" ? rawSet.setSymbolUri : undefined,
    setSymbolUsesRarityTreatment:
      typeof rawSet.setSymbolUsesRarityTreatment === "boolean"
        ? rawSet.setSymbolUsesRarityTreatment
        : undefined,
    cards: normalizeSetCardOrder(Array.isArray(rawSet.cards) ? rawSet.cards : [], code),
  };
}

function getSetMergeScore(set: CardSet) {
  return (
    set.cards.length * 10 +
    (set.cardBackId && set.cardBackId !== DEFAULT_CARD_BACK_ID ? 2 : 0) +
    (set.setSymbolId || set.setSymbolUri ? 2 : 0) +
    (set.setSymbolPreset && set.setSymbolPreset !== SET_SYMBOL_PRESETS[0].id ? 1 : 0)
  );
}

function mergeSetCardSnapshots(first: SetCardSnapshot[], second: SetCardSnapshot[], setCode: string) {
  const snapshotsById = new Map<string, SetCardSnapshot>();

  for (const snapshot of [...first, ...second]) {
    const existing = snapshotsById.get(snapshot.id);
    const snapshotTime = new Date(snapshot.savedAt).getTime();
    const existingTime = existing ? new Date(existing.savedAt).getTime() : Number.NEGATIVE_INFINITY;

    if (!existing || snapshotTime >= existingTime) {
      snapshotsById.set(snapshot.id, snapshot);
    }
  }

  return normalizeSetCardOrder(Array.from(snapshotsById.values()), setCode);
}

function mergeCardSetsById(first: CardSet, second: CardSet): CardSet {
  const preferred = getSetMergeScore(second) > getSetMergeScore(first) ? second : first;
  const fallback = preferred === first ? second : first;
  const code = normalizeSetCode(preferred.code, preferred.name);

  return normalizeCardSet({
    ...preferred,
    cardBackId:
      preferred.cardBackId && preferred.cardBackId !== DEFAULT_CARD_BACK_ID
        ? preferred.cardBackId
        : fallback.cardBackId ?? preferred.cardBackId,
    setSymbolPreset:
      preferred.setSymbolPreset && preferred.setSymbolPreset !== SET_SYMBOL_PRESETS[0].id
        ? preferred.setSymbolPreset
        : fallback.setSymbolPreset ?? preferred.setSymbolPreset,
    setSymbolId: preferred.setSymbolId ?? fallback.setSymbolId,
    setSymbolUri: preferred.setSymbolUri ?? fallback.setSymbolUri,
    setSymbolUsesRarityTreatment:
      preferred.setSymbolUsesRarityTreatment ?? fallback.setSymbolUsesRarityTreatment,
    cards: mergeSetCardSnapshots(first.cards, second.cards, code),
  });
}

function coalesceCardSetsById(sets: CardSet[]): CardSet[] {
  const coalescedSetsById = new Map<string, CardSet>();
  const coalescedSets: CardSet[] = [];

  for (const set of sets) {
    const existingSet = coalescedSetsById.get(set.id);

    if (!existingSet) {
      coalescedSetsById.set(set.id, set);
      coalescedSets.push(set);
      continue;
    }

    const mergedSet = mergeCardSetsById(existingSet, set);
    coalescedSetsById.set(mergedSet.id, mergedSet);
    const existingIndex = coalescedSets.findIndex((candidate) => candidate.id === mergedSet.id);

    if (existingIndex >= 0) {
      coalescedSets[existingIndex] = mergedSet;
    }
  }

  return coalescedSets;
}

type StoredCardSetsRepairResult = {
  sets: CardSet[];
  repaired: boolean;
  sourceKind: string;
  sourceShape: string;
  rejectedItems: number;
};

function normalizeStoredCardSetItems(
  items: unknown[],
  sourceKind: string,
  sourceShape: string,
): StoredCardSetsRepairResult | null {
  const setRecords = items.filter(looksLikeStoredCardSet);
  const looseCardRecords = items.filter(
    (item) => !looksLikeStoredCardSet(item) && (looksLikeStoredCardSnapshot(item) || looksLikeStoredCardRecord(item)),
  );
  const rejectedItems = items.length - setRecords.length - looseCardRecords.length;

  if (setRecords.length === 0 && looseCardRecords.length === 0) {
    return null;
  }

  const recoveredSets: CardSet[] = setRecords.map((set) => set as CardSet);

  if (looseCardRecords.length > 0) {
    recoveredSets.push({
      id: createUuid(),
      name: "Recovered Cards",
      code: generateSetCode("Recovered Cards"),
      cardBackId: DEFAULT_CARD_BACK_ID,
      cards: looseCardRecords as SetCardSnapshot[],
    });
  }

  return {
    sets: normalizeCardSets(recoveredSets),
    repaired:
      sourceKind !== "card-set-array" ||
      rejectedItems > 0 ||
      looseCardRecords.length > 0 ||
      !items.every(isCardSetArrayItem),
    sourceKind,
    sourceShape,
    rejectedItems,
  };
}

function isCardSetArrayItem(value: unknown) {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as CardSet).id === "string" &&
    typeof (value as CardSet).name === "string" &&
    Array.isArray((value as CardSet).cards)
  );
}

function normalizeStoredCardSetsPayload(value: unknown): StoredCardSetsRepairResult | null {
  const sourceShape = describeStoredValue(value);

  if (Array.isArray(value)) {
    return normalizeStoredCardSetItems(value, "card-set-array", sourceShape);
  }

  if (!isStoredRecord(value)) {
    return null;
  }

  const envelopeKeys = ["sets", "cardSets", "savedSets", "data"];

  for (const key of envelopeKeys) {
    if (Array.isArray(value[key])) {
      const result = normalizeStoredCardSetItems(value[key], `envelope.${key}`, sourceShape);

      return result ? { ...result, repaired: true } : null;
    }
  }

  if (looksLikeStoredCardSet(value)) {
    return {
      sets: normalizeCardSets([value as CardSet]),
      repaired: true,
      sourceKind: "single-card-set",
      sourceShape,
      rejectedItems: 0,
    };
  }

  return null;
}

function mergeAccountCardSets(localSets: CardSet[], remoteSets: CardSet[]): CardSet[] {
  const mergedById = new Map<string, CardSet>();

  for (const set of normalizeCardSets(localSets)) {
    mergedById.set(set.id, set);
  }

  for (const remoteSet of normalizeCardSets(remoteSets)) {
    const localSet = mergedById.get(remoteSet.id);

    if (!localSet) {
      mergedById.set(remoteSet.id, remoteSet);
      continue;
    }

    const cardsById = new Map<string, SetCardSnapshot>();

    for (const snapshot of localSet.cards) {
      cardsById.set(snapshot.id, snapshot);
    }

    for (const snapshot of remoteSet.cards) {
      const localSnapshot = cardsById.get(snapshot.id);
      const remoteIsNewer =
        !localSnapshot || new Date(snapshot.savedAt).getTime() >= new Date(localSnapshot.savedAt).getTime();

      if (remoteIsNewer) {
        cardsById.set(snapshot.id, snapshot);
      }
    }

    mergedById.set(remoteSet.id, {
      ...localSet,
      ...remoteSet,
      cards: Array.from(cardsById.values()),
    });
  }

  const mergedSets = Array.from(mergedById.values());

  return normalizeCardSets(mergedSets.length > 0 ? mergedSets : createDefaultCardSets());
}

function isOwnedAccountCardSet(set: CardSet, accountUserId: string) {
  return !set.ownerUserId || set.ownerUserId === accountUserId;
}

function getOwnedAccountCardSets(sets: CardSet[], accountUserId: string): CardSet[] {
  return normalizeCardSets(sets).filter((set) => isOwnedAccountCardSet(set, accountUserId));
}

function getLocalPersistableCardSets(sets: CardSet[]): CardSet[] {
  return normalizeCardSets(sets).filter((set) => !set.ownerUserId);
}

async function fetchSharedAccountCardSets(accountUserId: string): Promise<CardSet[]> {
  const collaborationSets = await fetchCollaborationSets();
  const sharedSets = collaborationSets.filter((set) => set.ownerUserId && set.ownerUserId !== accountUserId);

  const hydratedSets = await Promise.all(
    sharedSets.map(async (set) => {
      const cards = await fetchCollaborationSetCards(set.id);

      return normalizeCardSet({
        id: set.id,
        name: set.name,
        code: set.code ?? generateSetCode(set.name),
        ownerUserId: set.ownerUserId,
        ownerName: set.ownerName,
        collaborationRole: set.role,
        cardBackId: set.cardBackId as CardBackId | undefined,
        setSymbolPreset: set.setSymbolPreset,
        setSymbolUri: set.setSymbolUri,
        setSymbolUsesRarityTreatment: set.setSymbolUsesRarityTreatment,
        cards: cards.map((card) => ({
          id: card.id,
          savedAt: card.updatedAt ?? card.createdAt,
          card: card.card,
        })),
      });
    }),
  );

  return normalizeCardSets(hydratedSets);
}

function createEmptyDeletionTombstones(): DeletionTombstones {
  return { sets: [], cards: [] };
}

function normalizeDeletionTombstones(value: unknown): DeletionTombstones {
  if (!value || typeof value !== "object") {
    return createEmptyDeletionTombstones();
  }

  const candidate = value as Partial<DeletionTombstones>;
  const seenSetIds = new Set<string>();
  const seenCardKeys = new Set<string>();
  const sets = Array.isArray(candidate.sets)
    ? candidate.sets.flatMap((entry) => {
        if (!entry || typeof entry !== "object") {
          return [];
        }

        const record = entry as Partial<DeletedSetTombstone>;
        const id = typeof record.id === "string" ? record.id : "";

        if (!id || seenSetIds.has(id)) {
          return [];
        }

        seenSetIds.add(id);

        return [{
          id,
          deletedAt: typeof record.deletedAt === "string" ? record.deletedAt : new Date().toISOString(),
        }];
      })
    : [];
  const cards = Array.isArray(candidate.cards)
    ? candidate.cards.flatMap((entry) => {
        if (!entry || typeof entry !== "object") {
          return [];
        }

        const record = entry as Partial<DeletedCardTombstone>;
        const setId = typeof record.setId === "string" ? record.setId : "";
        const cardId = typeof record.cardId === "string" ? record.cardId : "";
        const key = `${setId}:${cardId}`;

        if (!setId || !cardId || seenCardKeys.has(key) || seenSetIds.has(setId)) {
          return [];
        }

        seenCardKeys.add(key);

        return [{
          setId,
          cardId,
          deletedAt: typeof record.deletedAt === "string" ? record.deletedAt : new Date().toISOString(),
        }];
      })
    : [];

  return { sets, cards };
}

function applyDeletionTombstonesToSets(sets: CardSet[], tombstones: DeletionTombstones): CardSet[] {
  const deletedSetIds = new Set(tombstones.sets.map((entry) => entry.id));
  const deletedCardIdsBySetId = new Map<string, Set<string>>();

  for (const entry of tombstones.cards) {
    if (deletedSetIds.has(entry.setId)) {
      continue;
    }

    const cardIds = deletedCardIdsBySetId.get(entry.setId) ?? new Set<string>();
    cardIds.add(entry.cardId);
    deletedCardIdsBySetId.set(entry.setId, cardIds);
  }

  return normalizeCardSets(
    sets
      .filter((set) => !deletedSetIds.has(set.id))
      .map((set) => {
        const deletedCardIds = deletedCardIdsBySetId.get(set.id);

        if (!deletedCardIds?.size) {
          return set;
        }

        return normalizeCardSet({
          ...set,
          cards: set.cards.filter((snapshot) => !deletedCardIds.has(snapshot.id)),
        });
      }),
  );
}

function addDeletedSetTombstone(tombstones: DeletionTombstones, setId: string): DeletionTombstones {
  const now = new Date().toISOString();

  return normalizeDeletionTombstones({
    sets: [
      ...tombstones.sets.filter((entry) => entry.id !== setId),
      { id: setId, deletedAt: now },
    ],
    cards: tombstones.cards.filter((entry) => entry.setId !== setId),
  });
}

function addDeletedCardTombstone(tombstones: DeletionTombstones, setId: string, cardId: string): DeletionTombstones {
  const now = new Date().toISOString();

  return normalizeDeletionTombstones({
    sets: tombstones.sets,
    cards: [
      ...tombstones.cards.filter((entry) => entry.setId !== setId || entry.cardId !== cardId),
      { setId, cardId, deletedAt: now },
    ],
  });
}

function removeDeletedSetTombstone(tombstones: DeletionTombstones, setId: string): DeletionTombstones {
  return normalizeDeletionTombstones({
    sets: tombstones.sets.filter((entry) => entry.id !== setId),
    cards: tombstones.cards,
  });
}

function removeDeletedCardTombstone(tombstones: DeletionTombstones, setId: string, cardId: string): DeletionTombstones {
  return normalizeDeletionTombstones({
    sets: tombstones.sets,
    cards: tombstones.cards.filter((entry) => entry.setId !== setId || entry.cardId !== cardId),
  });
}

function cardSetsEqual(first: CardSet[], second: CardSet[]) {
  return JSON.stringify(normalizeCardSets(first)) === JSON.stringify(normalizeCardSets(second));
}

function getUserProgressActivityScore(profile: UserProgressProfile) {
  return Object.values(profile.counters).reduce((total, count) => total + count, 0) +
    profile.completedAchievementIds.length;
}

function getNewestUserProgressProfile(localProfile: UserProgressProfile, remoteProfile: UserProgressProfile) {
  if (localProfile.lifetimeCreditsPurchased !== remoteProfile.lifetimeCreditsPurchased) {
    return localProfile.lifetimeCreditsPurchased > remoteProfile.lifetimeCreditsPurchased
      ? localProfile
      : remoteProfile;
  }

  if (localProfile.lifetimeXpEarned !== remoteProfile.lifetimeXpEarned) {
    return localProfile.lifetimeXpEarned > remoteProfile.lifetimeXpEarned ? localProfile : remoteProfile;
  }

  if (localProfile.lifetimeLevelCreditsEarned !== remoteProfile.lifetimeLevelCreditsEarned) {
    return localProfile.lifetimeLevelCreditsEarned > remoteProfile.lifetimeLevelCreditsEarned
      ? localProfile
      : remoteProfile;
  }

  const localActivityScore = getUserProgressActivityScore(localProfile);
  const remoteActivityScore = getUserProgressActivityScore(remoteProfile);

  if (localActivityScore !== remoteActivityScore) {
    return localActivityScore > remoteActivityScore ? localProfile : remoteProfile;
  }

  return localProfile.credits <= remoteProfile.credits ? localProfile : remoteProfile;
}

function userProgressProfilesEqual(first: UserProgressProfile, second: UserProgressProfile) {
  return JSON.stringify(normalizeUserProgressProfile(first)) === JSON.stringify(normalizeUserProgressProfile(second));
}

function toAccountCardSetPayloads(sets: CardSet[], accountUserId?: string): AccountCardSetPayload[] {
  const accountSets = accountUserId ? getOwnedAccountCardSets(sets, accountUserId) : normalizeCardSets(sets);

  return accountSets.map((set) => ({
    id: set.id,
    name: set.name,
    code: set.code,
    cardBackId: set.cardBackId,
    setSymbolPreset: set.setSymbolPreset,
    setSymbolId: set.setSymbolId,
    setSymbolUri: set.setSymbolUri,
    setSymbolUsesRarityTreatment: set.setSymbolUsesRarityTreatment,
    cards: set.cards,
  }));
}

function toAccountCustomSetSymbolPayloads(symbols: GeneratedSetSymbolEntry[]): AccountCustomSetSymbolPayload[] {
  return normalizeGeneratedSetSymbolEntries(symbols).map((symbol) => ({
    id: symbol.id,
    label: symbol.label,
    uri: symbol.uri,
    createdAt: symbol.createdAt,
  }));
}

function mergeCustomSetSymbols(
  localSymbols: GeneratedSetSymbolEntry[],
  remoteSymbols: AccountCustomSetSymbolPayload[],
): GeneratedSetSymbolEntry[] {
  return normalizeGeneratedSetSymbolEntries([
    ...localSymbols,
    ...remoteSymbols.map((symbol) => ({
      id: symbol.id,
      label: symbol.label,
      uri: symbol.uri,
      createdAt: symbol.createdAt ?? new Date().toISOString(),
    })),
  ]);
}

function generatedSetSymbolEntriesEqual(
  left: GeneratedSetSymbolEntry[],
  right: GeneratedSetSymbolEntry[],
) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((leftSymbol, index) => {
    const rightSymbol = right[index];

    return (
      leftSymbol.id === rightSymbol.id &&
      leftSymbol.label === rightSymbol.label &&
      leftSymbol.uri === rightSymbol.uri &&
      leftSymbol.createdAt === rightSymbol.createdAt
    );
  });
}

function resolveSetSymbolReferences(sets: CardSet[], symbols: GeneratedSetSymbolEntry[]): CardSet[] {
  const symbolsById = new Map(symbols.map((symbol) => [symbol.id, symbol]));

  return normalizeCardSets(sets).map((set) => {
    if (!set.setSymbolId) {
      return set;
    }

    const symbol = symbolsById.get(set.setSymbolId);

    if (!symbol) {
      return set;
    }

    return normalizeCardSet({
      ...set,
      setSymbolPreset: undefined,
      setSymbolUri: symbol.uri,
      setSymbolUsesRarityTreatment: true,
      cards: set.cards.map((snapshot) => ({
        ...snapshot,
        card: {
          ...snapshot.card,
          setSymbolPreset: undefined,
          setSymbolId: symbol.id,
          setSymbolUri: symbol.uri,
          setSymbolUsesRarityTreatment: true,
        },
      })),
    });
  });
}

function getCardSetStorageSummary(sets: CardSet[]) {
  return {
    setCount: sets.length,
    cardCount: sets.reduce((total, set) => total + set.cards.length, 0),
    sets: sets.slice(0, 6).map((set) => ({
      id: set.id,
      name: set.name,
      cardCount: set.cards.length,
    })),
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

type StoredCardRecord = Record<string, any>;

function logStorageInfo(message: string, detail?: unknown) {
  if (detail === undefined) {
    console.info(`${STORAGE_LOG_PREFIX} ${message}`);
    return;
  }

  console.info(`${STORAGE_LOG_PREFIX} ${message}`, detail);
}

function logStorageWarning(message: string, detail?: unknown) {
  if (detail === undefined) {
    console.warn(`${STORAGE_LOG_PREFIX} ${message}`);
    return;
  }

  console.warn(`${STORAGE_LOG_PREFIX} ${message}`, detail);
}

function isStoredRecord(value: unknown): value is StoredCardRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function describeStoredValue(value: unknown): string {
  if (Array.isArray(value)) {
    return `array(length=${value.length})`;
  }

  if (isStoredRecord(value)) {
    const keys = Object.keys(value);

    return `object(keys=${keys.slice(0, 12).join(",")}${keys.length > 12 ? ",..." : ""})`;
  }

  return value === null ? "null" : typeof value;
}

function looksLikeStoredCardRecord(value: unknown): value is StoredCardRecord {
  if (!isStoredRecord(value)) {
    return false;
  }

  return [
    "name",
    "manaCost",
    "typeLine",
    "rulesText",
    "flavorText",
    "rarity",
    "power",
    "toughness",
    "collectorNumber",
  ].some((key) => key in value);
}

function looksLikeStoredCardSnapshot(value: unknown): value is StoredCardRecord {
  return isStoredRecord(value) && "card" in value && looksLikeStoredCardRecord(value.card);
}

function looksLikeStoredCardSet(value: unknown): value is StoredCardRecord {
  return isStoredRecord(value) && Array.isArray(value.cards);
}

function getStringField(source: StoredCardRecord, key: string, fallback = "") {
  const value = source[key];
  return typeof value === "string" ? value : fallback;
}

function getOptionalStringField(source: StoredCardRecord, key: string) {
  const value = source[key];
  return typeof value === "string" ? value : undefined;
}

function getOptionalBooleanField(source: StoredCardRecord, key: string) {
  const value = source[key];
  return typeof value === "boolean" ? value : undefined;
}

function getOptionalNumberField(source: StoredCardRecord, key: string) {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getEnumField<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return options.includes(value as T) ? value as T : fallback;
}

function getOptionalEnumField<T extends string>(value: unknown, options: readonly T[]) {
  return options.includes(value as T) ? value as T : undefined;
}

function getManaColorsField(value: unknown): ManaColor[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const colors = value.filter((color): color is ManaColor => COLOR_IDENTITY_SORT_ORDER.includes(color));
  return colors.length > 0 ? Array.from(new Set(colors)) : undefined;
}

function normalizeArtTransformField(value: unknown): ArtTransform | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const transform = value as Partial<ArtTransform>;

  return {
    offsetX: typeof transform.offsetX === "number" && Number.isFinite(transform.offsetX) ? transform.offsetX : 0,
    offsetY: typeof transform.offsetY === "number" && Number.isFinite(transform.offsetY) ? transform.offsetY : 0,
    scale: typeof transform.scale === "number" && Number.isFinite(transform.scale) && transform.scale > 0
      ? transform.scale
      : 1,
  };
}

function normalizeSubjectMaskComponentsField(value: unknown): SubjectMaskComponent[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const seen = new Set<string>();
  const components = value.flatMap((component, index): SubjectMaskComponent[] => {
    if (!component || typeof component !== "object") {
      return [];
    }

    const source = component as Partial<SubjectMaskComponent> & { url?: unknown };
    const cutoutUrl =
      typeof source.cutoutUrl === "string"
        ? source.cutoutUrl.trim()
        : typeof source.url === "string"
          ? source.url.trim()
          : "";

    if (!cutoutUrl) {
      return [];
    }

    const concept = typeof source.concept === "string" && source.concept.trim()
      ? source.concept.trim()
      : `Subject ${index + 1}`;
    const key = `${concept}\n${cutoutUrl}`;

    if (seen.has(key)) {
      return [];
    }

    seen.add(key);

    return [{
      concept,
      cutoutUrl,
      enabled: source.enabled !== false,
    }];
  });

  return components.length > 0 ? components : undefined;
}

function normalizeFrameCustomizationField(value: unknown): FrameCustomization | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const customization = value as Partial<FrameCustomization>;

  if (typeof customization.tintColor !== "string") {
    return undefined;
  }

  const tintOpacity =
    typeof customization.tintOpacity === "number" && Number.isFinite(customization.tintOpacity)
      ? clamp(customization.tintOpacity, 0, 1)
      : 0;

  return {
    tintColor: customization.tintColor,
    tintOpacity,
  };
}

function normalizeFrameTextColorOverridesField(
  value: unknown,
): Partial<Record<FrameTreatment, CardTextColorPreset>> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const source = value as Record<string, unknown>;
  const normalized = FRAME_TREATMENT_OPTIONS.reduce<Partial<Record<FrameTreatment, CardTextColorPreset>>>(
    (colors, treatment) => {
      const color = getOptionalEnumField(source[treatment], TEXT_COLOR_OPTIONS);

      if (color) {
        colors[treatment] = color;
      }

      return colors;
    },
    {},
  );

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeFrameTextColorOverridesWithLegacyFallback({
  value,
  legacyValue,
  treatment,
}: {
  value: unknown;
  legacyValue: unknown;
  treatment: unknown;
}): Partial<Record<FrameTreatment, CardTextColorPreset>> | undefined {
  const normalized = normalizeFrameTextColorOverridesField(value);

  if (normalized) {
    return normalized;
  }

  const legacyColor = getOptionalEnumField(legacyValue, TEXT_COLOR_OPTIONS);
  const frameTreatment = getOptionalFrameTreatmentField(treatment) ?? "standard";

  return legacyColor ? { [frameTreatment]: legacyColor } : undefined;
}

function normalizeLoyaltyAbilitiesField(value: unknown): PlaneswalkerLoyaltyAbility[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const abilities = value.flatMap((ability, index) => {
    if (!ability || typeof ability !== "object") {
      return [];
    }

    const source = ability as Partial<PlaneswalkerLoyaltyAbility>;

    return [{
      id: typeof source.id === "string" && source.id.trim() ? source.id : `loyalty-${index}`,
      cost: typeof source.cost === "string" ? source.cost : "",
      text: typeof source.text === "string" ? source.text : "",
    }];
  });

  return abilities.length > 0 ? abilities : undefined;
}

function normalizeSplitHalfField(value: unknown): SplitCardHalf | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const source = value as Partial<SplitCardHalf>;

  return {
    name: typeof source.name === "string" ? source.name : "",
    manaCost: typeof source.manaCost === "string" ? source.manaCost : "",
    typeLine: typeof source.typeLine === "string" ? source.typeLine : "",
    rulesText: typeof source.rulesText === "string" ? source.rulesText : "",
    flavorText: typeof source.flavorText === "string" ? source.flavorText : undefined,
    frameSelection: getOptionalEnumField(source.frameSelection, FRAME_SELECTION_OPTIONS),
    frameColors: getManaColorsField(source.frameColors),
  };
}

const CARD_RARITY_OPTIONS: readonly CardRarity[] = ["common", "uncommon", "rare", "mythic"];
const DFC_MODE_OPTIONS: readonly DfcMode[] = ["transform", "modal", "dayNight"];
const DFC_FACE_OPTIONS: readonly DfcFace[] = ["front", "back"];
const SPLIT_LAYOUT_OPTIONS: readonly SplitCardLayout[] = ["split", "fuse", "aftermath"];
const FRAME_SELECTION_OPTIONS: readonly FrameSelection[] = ["auto", "white", "blue", "black", "red", "green", "gold", "artifact", "land", "colorless"];
const FRAME_TREATMENT_OPTIONS: readonly FrameTreatment[] = ["standard", "fullArt", "extendedArt", "borderless", "promo", "showcase", "textless", "retro", "etchedFoil"];
const LEGACY_FRAME_TREATMENT_ALIASES: Readonly<Record<string, FrameTreatment>> = {
  transparentBorderless: "borderless",
};
const TYPE_FRAME_OPTIONS: readonly TypeFrame[] = ["standard", "token", "saga", "planeswalker", "battle", "dfc", "adventure", "split", "fuse", "aftermath"];
const TEXT_COLOR_OPTIONS: readonly CardTextColorPreset[] = ["black", "white"];
const SHOWCASE_FRAME_OPTIONS: readonly ShowcaseFrameId[] = SHOWCASE_FRAME_ORDER;

function getOptionalFrameTreatmentField(value: unknown): FrameTreatment | undefined {
  if (typeof value === "string" && value in LEGACY_FRAME_TREATMENT_ALIASES) {
    return LEGACY_FRAME_TREATMENT_ALIASES[value];
  }

  return getOptionalEnumField(value, FRAME_TREATMENT_OPTIONS);
}

function normalizeStoredCardDraft(value: unknown): CardDraft {
  const source: StoredCardRecord = isStoredRecord(value) ? value : {};
  const normalized: any = {};
  const copyString = (key: string, fallback = "") => {
    normalized[key] = getStringField(source, key, fallback);
  };
  const copyOptionalString = (key: string) => {
    const nextValue = getOptionalStringField(source, key);
    if (nextValue !== undefined) {
      normalized[key] = nextValue;
    }
  };

  copyString("name", INITIAL_CARD.name);
  copyString("manaCost");
  copyString("typeLine", INITIAL_CARD.typeLine);
  copyString("rulesText");
  copyString("flavorText");
  copyString("power");
  copyString("toughness");
  copyString("artist", INITIAL_CARD.artist);
  copyString("setCode", INITIAL_CARD.setCode);
  copyString("collectorNumber", INITIAL_CARD.collectorNumber);
  copyString("setSize", INITIAL_CARD.setSize);
  copyString("language", INITIAL_CARD.language);
  copyString("copyrightLine", INITIAL_CARD.copyrightLine);

  [
    "baseCardName",
    "adventureName",
    "adventureManaCost",
    "adventureTypeLine",
    "adventureRulesText",
    "backName",
    "backBaseCardName",
    "backManaCost",
    "backTypeLine",
    "backRulesText",
    "backFlavorText",
    "backPower",
    "backToughness",
    "defense",
    "startingLoyalty",
    "splitFuseText",
    "artUri",
    "artSubjectMaskUri",
    "backArtUri",
    "backArtSubjectMaskUri",
    "setSymbolPreset",
    "setSymbolId",
    "setSymbolUri",
    "watermarkPreset",
    "watermarkUri",
  ].forEach(copyOptionalString);

  normalized.rarity = getEnumField(source.rarity, CARD_RARITY_OPTIONS, INITIAL_CARD.rarity);
  if (typeof source.cardBackId === "string") {
    normalized.cardBackId = source.cardBackId;
  }
  normalized.dfcMode = getOptionalEnumField(source.dfcMode, DFC_MODE_OPTIONS);
  normalized.dfcFace = getOptionalEnumField(source.dfcFace, DFC_FACE_OPTIONS);
  normalized.backRulesTextColors = normalizeFrameTextColorOverridesWithLegacyFallback({
    value: source.backRulesTextColors,
    legacyValue: source.backRulesTextColor,
    treatment: source.backFrameTreatment,
  });
  normalized.rulesTextColors = normalizeFrameTextColorOverridesWithLegacyFallback({
    value: source.rulesTextColors,
    legacyValue: source.rulesTextColor,
    treatment: source.frameTreatment,
  });
  normalized.loyaltyAbilities = normalizeLoyaltyAbilitiesField(source.loyaltyAbilities);
  normalized.splitLayout = getOptionalEnumField(source.splitLayout, SPLIT_LAYOUT_OPTIONS);
  normalized.splitLeft = normalizeSplitHalfField(source.splitLeft);
  normalized.splitRight = normalizeSplitHalfField(source.splitRight);
  normalized.artTransform = normalizeArtTransformField(source.artTransform);
  normalized.backArtTransform = normalizeArtTransformField(source.backArtTransform);
  normalized.artSubjectMaskDisabled = getOptionalBooleanField(source, "artSubjectMaskDisabled");
  normalized.backArtSubjectMaskDisabled = getOptionalBooleanField(source, "backArtSubjectMaskDisabled");
  normalized.artSubjectMaskComponents = normalizeSubjectMaskComponentsField(source.artSubjectMaskComponents);
  normalized.backArtSubjectMaskComponents = normalizeSubjectMaskComponentsField(source.backArtSubjectMaskComponents);
  normalized.setSymbolUsesRarityTreatment = getOptionalBooleanField(source, "setSymbolUsesRarityTreatment");
  normalized.watermarkOpacity = getOptionalNumberField(source, "watermarkOpacity");
  normalized.watermarkScale = getOptionalNumberField(source, "watermarkScale");
  normalized.frameSelection = getOptionalEnumField(source.frameSelection, FRAME_SELECTION_OPTIONS);
  normalized.frameColors = getManaColorsField(source.frameColors);
  normalized.backFrameSelection = getOptionalEnumField(source.backFrameSelection, FRAME_SELECTION_OPTIONS);
  normalized.backFrameColors = getManaColorsField(source.backFrameColors);
  normalized.backFrameTreatment = getOptionalFrameTreatmentField(source.backFrameTreatment);
  normalized.backShowcaseFrame = getOptionalEnumField(source.backShowcaseFrame, SHOWCASE_FRAME_OPTIONS);
  normalized.frameTreatment = getOptionalFrameTreatmentField(source.frameTreatment);
  normalized.showcaseFrame = getOptionalEnumField(source.showcaseFrame, SHOWCASE_FRAME_OPTIONS);
  normalized.typeFrame = getOptionalEnumField(source.typeFrame, TYPE_FRAME_OPTIONS);
  normalized.frameCustomization = normalizeFrameCustomizationField(source.frameCustomization);

  Object.keys(normalized).forEach((key) => {
    if (normalized[key] === undefined) {
      delete normalized[key];
    }
  });

  return cloneCardDraft(normalized as CardDraft);
}

function normalizeSetCardSnapshot(value: unknown, index: number): SetCardSnapshot {
  const source = isStoredRecord(value) ? value as Partial<SetCardSnapshot> : {};
  const cardSource = source.card ?? (looksLikeStoredCardRecord(value) ? value : undefined);

  return {
    id: typeof source.id === "string" && source.id.trim() ? source.id : `card-${Date.now()}-${index}`,
    savedAt: typeof source.savedAt === "string" && source.savedAt.trim()
      ? source.savedAt
      : new Date(0).toISOString(),
    card: normalizeStoredCardDraft(cardSource),
  };
}

function normalizeSetCardOrder(cards: SetCardSnapshot[], setCode?: string): SetCardSnapshot[] {
  const normalizedSnapshots = cards.map(normalizeSetCardSnapshot);
  const cardCount = normalizedSnapshots.length;
  const setSize = formatSetSize(cardCount);
  const normalizedSetCode = setCode ? normalizeSetCode(setCode) : undefined;

  return normalizedSnapshots
    .sort(compareSetCardSnapshots)
    .map((snapshot, index) => ({
      ...snapshot,
      card: {
        ...normalizeStoredCardDraft(snapshot.card),
        ...(normalizedSetCode ? { setCode: normalizedSetCode } : null),
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
  try {
    if (isSplitTypeFrame(card) && card.splitLeft && card.splitRight) {
      return normalizeSetManaColors([
        ...getFrameColors(toSplitHalfCard(card, card.splitLeft)),
        ...getFrameColors(toSplitHalfCard(card, card.splitRight)),
      ]);
    }

    return normalizeSetManaColors(getFrameColors({ ...card, dfcFace: "front" }));
  } catch (error) {
    logStorageWarning("Unable to infer saved-card collector colors.", {
      cardName: typeof card.name === "string" ? card.name : undefined,
      error,
    });
    return [];
  }
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

function normalizeSetManaColors(colors: ManaColor[] = []) {
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

function parseCollectorTypeLine(typeLine: unknown) {
  const normalizedTypeLine = typeof typeLine === "string" ? typeLine : "";
  const [left = "", right = ""] = normalizedTypeLine.trim().split(TYPE_LINE_DIVIDER_PATTERN);
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

  return BASIC_LAND_ORDER.findIndex(
    (landType) => normalizeCollectorTypeWord(typeof card.name === "string" ? card.name : "") === landType,
  );
}

function getCollectorSortName(card: CardDraft) {
  const cardName = typeof card.name === "string" ? card.name : "";
  const baseCardName = typeof card.baseCardName === "string" ? card.baseCardName : "";

  return (cardName || baseCardName || "Untitled Card").trim().toLocaleLowerCase();
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

function isGeneratedSetSymbolEntry(value: unknown): value is GeneratedSetSymbolEntry {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as GeneratedSetSymbolEntry).id === "string" &&
    typeof (value as GeneratedSetSymbolEntry).label === "string" &&
    typeof (value as GeneratedSetSymbolEntry).uri === "string" &&
    typeof (value as GeneratedSetSymbolEntry).createdAt === "string"
  );
}

function isGeneratedSetSymbolEntryArray(value: unknown): value is GeneratedSetSymbolEntry[] {
  return Array.isArray(value) && value.every(isGeneratedSetSymbolEntry);
}

function isCustomCardBackEntry(value: unknown): value is CustomCardBackEntry {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as CustomCardBackEntry).id === "string" &&
    (value as CustomCardBackEntry).id.startsWith("custom:") &&
    typeof (value as CustomCardBackEntry).label === "string" &&
    typeof (value as CustomCardBackEntry).description === "string" &&
    typeof (value as CustomCardBackEntry).uri === "string" &&
    typeof (value as CustomCardBackEntry).createdAt === "string"
  );
}

function isCustomCardBackEntryArray(value: unknown): value is CustomCardBackEntry[] {
  return Array.isArray(value) && value.every(isCustomCardBackEntry);
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
        ? await getWebStorageItem(CARD_SET_STORAGE_KEY)
        : await (await getNativeStorageAdapter())?.getItem(CARD_SET_STORAGE_KEY);

    if (!rawSets) {
      logStorageInfo("No saved set payload found.", { key: CARD_SET_STORAGE_KEY, platform: Platform.OS });
      return null;
    }

    logStorageInfo("Read saved set payload.", {
      key: CARD_SET_STORAGE_KEY,
      platform: Platform.OS,
      serializedLength: rawSets.length,
    });

    const parsed = JSON.parse(rawSets) as unknown;
    const repairedPayload = normalizeStoredCardSetsPayload(parsed);

    if (!repairedPayload) {
      logStorageWarning("Saved set payload did not match a repairable schema.", {
        shape: describeStoredValue(parsed),
      });
      return null;
    }

    if (repairedPayload.repaired || repairedPayload.rejectedItems > 0) {
      logStorageWarning("Repaired saved set payload during hydration.", {
        sourceKind: repairedPayload.sourceKind,
        sourceShape: repairedPayload.sourceShape,
        rejectedItems: repairedPayload.rejectedItems,
        ...getCardSetStorageSummary(repairedPayload.sets),
      });
    } else {
      logStorageInfo("Saved set payload matched the current schema.", {
        sourceKind: repairedPayload.sourceKind,
        ...getCardSetStorageSummary(repairedPayload.sets),
      });
    }

    const materializedSets = await materializeCardSetsImageDataUris(repairedPayload.sets);

    logStorageInfo("Materialized saved set image URIs.", getCardSetStorageSummary(materializedSets));

    return materializedSets;
  } catch (error) {
    console.warn("Unable to load saved CardMagic sets.", error);
    return null;
  }
}

async function loadStoredDeletionTombstones(): Promise<DeletionTombstones> {
  try {
    const rawValue =
      Platform.OS === "web" && typeof window !== "undefined"
        ? await getWebStorageItem(DELETION_TOMBSTONE_STORAGE_KEY)
        : await (await getNativeStorageAdapter())?.getItem(DELETION_TOMBSTONE_STORAGE_KEY);

    if (!rawValue) {
      return createEmptyDeletionTombstones();
    }

    return normalizeDeletionTombstones(JSON.parse(rawValue) as unknown);
  } catch (error) {
    console.warn("Unable to load CardMagic deletion tombstones.", error);
    return createEmptyDeletionTombstones();
  }
}

async function loadStoredActiveCardDraft(): Promise<CardDraft | null> {
  try {
    const rawCard =
      Platform.OS === "web" && typeof window !== "undefined"
        ? await getWebStorageItem(ACTIVE_CARD_STORAGE_KEY)
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
      logStorageWarning("Active draft payload required schema normalization.", {
        shape: describeStoredValue(candidate),
      });
    }

    const normalizedCard = normalizeStoredCardDraft(candidate);

    if (!isCardDraft(normalizedCard)) {
      logStorageWarning("Active draft payload could not be normalized.", {
        shape: describeStoredValue(candidate),
      });
      return null;
    }

    return await materializeCardDraftImageDataUris(normalizedCard, "active-card");
  } catch (error) {
    console.warn("Unable to load active CardMagic draft.", error);
    return null;
  }
}

function normalizeCardRecoverySnapshot(value: unknown): CardRecoverySnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const rawSnapshot = value as Partial<CardRecoverySnapshot>;

  if (
    typeof rawSnapshot.id !== "string" ||
    typeof rawSnapshot.savedAt !== "string" ||
    typeof rawSnapshot.setId !== "string" ||
    typeof rawSnapshot.setName !== "string"
  ) {
    return null;
  }

  return {
    id: rawSnapshot.id,
    savedAt: rawSnapshot.savedAt,
    reason: rawSnapshot.reason === "tab-switch" ? "tab-switch" : "autosave",
    setId: rawSnapshot.setId,
    setName: rawSnapshot.setName,
    activeSetCardId: typeof rawSnapshot.activeSetCardId === "string" ? rawSnapshot.activeSetCardId : null,
    card: normalizeStoredCardDraft(rawSnapshot.card),
  };
}

async function loadStoredCardRecoverySnapshots(): Promise<CardRecoverySnapshot[]> {
  try {
    const rawValue =
      Platform.OS === "web" && typeof window !== "undefined"
        ? await getWebStorageItem(CARD_RECOVERY_SNAPSHOT_STORAGE_KEY)
        : await (await getNativeStorageAdapter())?.getItem(CARD_RECOVERY_SNAPSHOT_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue) as unknown;
    const candidates =
      Boolean(parsed) &&
      typeof parsed === "object" &&
      (parsed as StoredCardRecoverySnapshots).schemaVersion === 1 &&
      Array.isArray((parsed as StoredCardRecoverySnapshots).snapshots)
        ? (parsed as StoredCardRecoverySnapshots).snapshots
        : Array.isArray(parsed)
          ? parsed
          : [];
    const snapshots = candidates
      .map(normalizeCardRecoverySnapshot)
      .filter((snapshot): snapshot is CardRecoverySnapshot => Boolean(snapshot))
      .sort((first, second) => new Date(second.savedAt).getTime() - new Date(first.savedAt).getTime())
      .slice(0, CARD_RECOVERY_SNAPSHOT_LIMIT);
    const materializedSnapshots: CardRecoverySnapshot[] = [];

    for (const snapshot of snapshots) {
      materializedSnapshots.push({
        ...snapshot,
        card: await materializeCardDraftImageDataUris(snapshot.card, `recovery-${snapshot.id}`),
      });
    }

    return materializedSnapshots;
  } catch (error) {
    console.warn("Unable to load CardMagic recovery snapshots.", error);
    return [];
  }
}

async function loadStoredArtLibrary(): Promise<ArtLibraryEntry[] | null> {
  try {
    const rawEntries =
      Platform.OS === "web" && typeof window !== "undefined"
        ? await getWebStorageItem(ART_LIBRARY_STORAGE_KEY)
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

async function loadStoredGeneratedSetSymbols(): Promise<GeneratedSetSymbolEntry[] | null> {
  try {
    const rawEntries =
      Platform.OS === "web" && typeof window !== "undefined"
        ? await getWebStorageItem(GENERATED_SET_SYMBOL_STORAGE_KEY)
        : await (await getNativeStorageAdapter())?.getItem(GENERATED_SET_SYMBOL_STORAGE_KEY);

    if (!rawEntries) {
      return null;
    }

    const parsed = JSON.parse(rawEntries) as unknown;

    if (!isGeneratedSetSymbolEntryArray(parsed)) {
      return null;
    }

    const materializedEntries = await materializeGeneratedSetSymbolImageDataUris(parsed);

    return normalizeGeneratedSetSymbolEntries(materializedEntries);
  } catch (error) {
    console.warn("Unable to load custom CardMagic set symbols.", error);
    return null;
  }
}

async function loadStoredCustomCardBacks(): Promise<CustomCardBackEntry[] | null> {
  try {
    const rawEntries =
      Platform.OS === "web" && typeof window !== "undefined"
        ? await getWebStorageItem(CUSTOM_CARD_BACK_STORAGE_KEY)
        : await (await getNativeStorageAdapter())?.getItem(CUSTOM_CARD_BACK_STORAGE_KEY);

    if (!rawEntries) {
      return null;
    }

    const parsed = JSON.parse(rawEntries) as unknown;

    if (!isCustomCardBackEntryArray(parsed)) {
      return null;
    }

    const materializedEntries = await materializeCustomCardBackImageDataUris(parsed);

    return normalizeCustomCardBackEntries(materializedEntries);
  } catch (error) {
    console.warn("Unable to load custom CardMagic card backs.", error);
    return null;
  }
}

async function loadStoredUserProgress(): Promise<UserProgressProfile> {
  try {
    const rawProfile =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.localStorage.getItem(USER_PROGRESS_STORAGE_KEY)
        : await (await getNativeStorageAdapter())?.getItem(USER_PROGRESS_STORAGE_KEY);

    if (!rawProfile) {
      return createDefaultUserProgress();
    }

    return normalizeUserProgressProfile(JSON.parse(rawProfile) as unknown);
  } catch (error) {
    console.warn("Unable to load CardMagic user progression.", error);
    return createDefaultUserProgress();
  }
}

async function loadEarlyAccessCodePromptShown(userId?: string | null): Promise<boolean> {
  try {
    const rawValue =
      Platform.OS === "web" && typeof window !== "undefined"
        ? await getWebStorageItem(EARLY_ACCESS_CODE_PROMPT_STORAGE_KEY)
        : await (await getNativeStorageAdapter())?.getItem(EARLY_ACCESS_CODE_PROMPT_STORAGE_KEY);

    if (rawValue === "shown") {
      return true;
    }

    const redeemedCodes = await loadRedeemedCreditCodes();
    const normalizedCode = normalizeCreditCode(EARLY_ACCESS_CREDIT_CODE);

    if (redeemedCodes.has(normalizedCode)) {
      return true;
    }

    if (userId) {
      return await hasRedeemedPromotionalCreditCode(userId, normalizedCode);
    }

    return false;
  } catch (error) {
    console.warn("Unable to load CardMagic early access code prompt state.", error);
    return true;
  }
}

async function storeEarlyAccessCodePromptShown() {
  try {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      await setWebStorageItem(EARLY_ACCESS_CODE_PROMPT_STORAGE_KEY, "shown");
      window.localStorage.setItem(EARLY_ACCESS_CODE_PROMPT_STORAGE_KEY, "shown");
      return;
    }

    await (await getNativeStorageAdapter())?.setItem(EARLY_ACCESS_CODE_PROMPT_STORAGE_KEY, "shown");
  } catch (error) {
    console.warn("Unable to persist CardMagic early access code prompt state.", error);
  }
}

function normalizeCreditCode(code: string) {
  return code.trim().replace(/[\s-]+/g, "").toUpperCase();
}

function isPreviewToolbarPosition(value: unknown): value is PreviewToolbarPosition {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    Number.isFinite((value as PreviewToolbarPosition).x) &&
    Number.isFinite((value as PreviewToolbarPosition).y)
  );
}

function isPreviewToolbarOrientation(value: unknown): value is PreviewToolbarOrientation {
  return value === "horizontal" || value === "vertical";
}

async function loadStoredPreviewToolbarPosition(): Promise<PreviewToolbarPosition | null> {
  try {
    const rawValue =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.localStorage.getItem(PREVIEW_TOOLBAR_POSITION_STORAGE_KEY)
        : await (await getNativeStorageAdapter())?.getItem(PREVIEW_TOOLBAR_POSITION_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as unknown;

    return isPreviewToolbarPosition(parsedValue) ? parsedValue : null;
  } catch (error) {
    console.warn("Unable to load CardMagic preview toolbar position.", error);
    return null;
  }
}

async function storePreviewToolbarPosition(position: PreviewToolbarPosition) {
  try {
    const serializedPosition = JSON.stringify(position);

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage.setItem(PREVIEW_TOOLBAR_POSITION_STORAGE_KEY, serializedPosition);
      return;
    }

    await (await getNativeStorageAdapter())?.setItem(PREVIEW_TOOLBAR_POSITION_STORAGE_KEY, serializedPosition);
  } catch (error) {
    console.warn("Unable to persist CardMagic preview toolbar position.", error);
  }
}

async function loadStoredPreviewToolbarOrientation(): Promise<PreviewToolbarOrientation | null> {
  try {
    const rawValue =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.localStorage.getItem(PREVIEW_TOOLBAR_ORIENTATION_STORAGE_KEY)
        : await (await getNativeStorageAdapter())?.getItem(PREVIEW_TOOLBAR_ORIENTATION_STORAGE_KEY);

    return isPreviewToolbarOrientation(rawValue) ? rawValue : null;
  } catch (error) {
    console.warn("Unable to load CardMagic preview toolbar orientation.", error);
    return null;
  }
}

async function storePreviewToolbarOrientation(orientation: PreviewToolbarOrientation) {
  try {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage.setItem(PREVIEW_TOOLBAR_ORIENTATION_STORAGE_KEY, orientation);
      return;
    }

    await (await getNativeStorageAdapter())?.setItem(PREVIEW_TOOLBAR_ORIENTATION_STORAGE_KEY, orientation);
  } catch (error) {
    console.warn("Unable to persist CardMagic preview toolbar orientation.", error);
  }
}

async function loadRedeemedCreditCodes(): Promise<Set<string>> {
  try {
    const rawValue =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.localStorage.getItem(REDEEMED_CREDIT_CODES_STORAGE_KEY)
        : await (await getNativeStorageAdapter())?.getItem(REDEEMED_CREDIT_CODES_STORAGE_KEY);

    if (!rawValue) {
      return new Set();
    }

    const parsedValue = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsedValue)) {
      return new Set();
    }

    return new Set(parsedValue.filter((value): value is string => typeof value === "string"));
  } catch (error) {
    console.warn("Unable to load CardMagic redeemed credit codes.", error);
    return new Set();
  }
}

async function storeRedeemedCreditCodes(codes: Set<string>) {
  try {
    const serializedCodes = JSON.stringify([...codes]);

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage.setItem(REDEEMED_CREDIT_CODES_STORAGE_KEY, serializedCodes);
      return;
    }

    await (await getNativeStorageAdapter())?.setItem(REDEEMED_CREDIT_CODES_STORAGE_KEY, serializedCodes);
  } catch (error) {
    console.warn("Unable to persist CardMagic redeemed credit codes.", error);
  }
}

async function storeCardSets(sets: CardSet[]) {
  try {
    const persistedSets = await persistCardSetsImageUris(getLocalPersistableCardSets(sets));
    const serializedSets = JSON.stringify(persistedSets);

    if (Platform.OS === "web" && typeof window !== "undefined") {
      await setWebStorageItem(CARD_SET_STORAGE_KEY, serializedSets);
      return;
    }

    await (await getNativeStorageAdapter())?.setItem(CARD_SET_STORAGE_KEY, serializedSets);
  } catch (error) {
    console.warn("Unable to persist CardMagic sets.", error);
  }
}

async function storeDeletionTombstones(tombstones: DeletionTombstones) {
  try {
    const serializedTombstones = JSON.stringify(normalizeDeletionTombstones(tombstones));

    if (Platform.OS === "web" && typeof window !== "undefined") {
      await setWebStorageItem(DELETION_TOMBSTONE_STORAGE_KEY, serializedTombstones);
      return;
    }

    await (await getNativeStorageAdapter())?.setItem(DELETION_TOMBSTONE_STORAGE_KEY, serializedTombstones);
  } catch (error) {
    console.warn("Unable to persist CardMagic deletion tombstones.", error);
  }
}

async function storeActiveCardDraft(card: CardDraft) {
  try {
    const persistedCard = await persistCardDraftImageUris(cloneCardDraft(card), "active-card");
    const serializedCard = JSON.stringify({
      schemaVersion: 1,
      card: persistedCard,
    } satisfies StoredActiveCardDraft);

    if (Platform.OS === "web" && typeof window !== "undefined") {
      await setWebStorageItem(ACTIVE_CARD_STORAGE_KEY, serializedCard);
      return;
    }

    await (await getNativeStorageAdapter())?.setItem(ACTIVE_CARD_STORAGE_KEY, serializedCard);
  } catch (error) {
    console.warn("Unable to persist active CardMagic draft.", error);
  }
}

async function storeCardRecoverySnapshots(snapshots: CardRecoverySnapshot[]) {
  try {
    const normalizedSnapshots = snapshots
      .map(normalizeCardRecoverySnapshot)
      .filter((snapshot): snapshot is CardRecoverySnapshot => Boolean(snapshot))
      .sort((first, second) => new Date(second.savedAt).getTime() - new Date(first.savedAt).getTime())
      .slice(0, CARD_RECOVERY_SNAPSHOT_LIMIT);
    const persistedSnapshots: CardRecoverySnapshot[] = [];

    for (const snapshot of normalizedSnapshots) {
      persistedSnapshots.push({
        ...snapshot,
        card: await persistCardDraftImageUris(snapshot.card, `recovery-${snapshot.id}`),
      });
    }

    const serializedSnapshots = JSON.stringify({
      schemaVersion: 1,
      snapshots: persistedSnapshots,
    } satisfies StoredCardRecoverySnapshots);

    if (Platform.OS === "web" && typeof window !== "undefined") {
      await setWebStorageItem(CARD_RECOVERY_SNAPSHOT_STORAGE_KEY, serializedSnapshots);
      return;
    }

    await (await getNativeStorageAdapter())?.setItem(CARD_RECOVERY_SNAPSHOT_STORAGE_KEY, serializedSnapshots);
  } catch (error) {
    console.warn("Unable to persist CardMagic recovery snapshots.", error);
  }
}

async function storeArtLibrary(entries: ArtLibraryEntry[]) {
  try {
    const persistedEntries = await persistArtLibraryImageUris(normalizeArtLibraryEntries(entries));
    const serializedEntries = JSON.stringify(persistedEntries);

    if (Platform.OS === "web" && typeof window !== "undefined") {
      await setWebStorageItem(ART_LIBRARY_STORAGE_KEY, serializedEntries);
      return;
    }

    await (await getNativeStorageAdapter())?.setItem(ART_LIBRARY_STORAGE_KEY, serializedEntries);
  } catch (error) {
    console.warn("Unable to persist CardMagic art library.", error);
  }
}

async function storeGeneratedSetSymbols(entries: GeneratedSetSymbolEntry[]) {
  try {
    const persistedEntries = await persistGeneratedSetSymbolImageUris(
      normalizeGeneratedSetSymbolEntries(entries),
    );
    const serializedEntries = JSON.stringify(persistedEntries);

    if (Platform.OS === "web" && typeof window !== "undefined") {
      await setWebStorageItem(GENERATED_SET_SYMBOL_STORAGE_KEY, serializedEntries);
      return;
    }

    await (await getNativeStorageAdapter())?.setItem(GENERATED_SET_SYMBOL_STORAGE_KEY, serializedEntries);
  } catch (error) {
    console.warn("Unable to persist custom CardMagic set symbols.", error);
  }
}

async function storeCustomCardBacks(entries: CustomCardBackEntry[]) {
  try {
    const persistedEntries = await persistCustomCardBackImageUris(
      normalizeCustomCardBackEntries(entries),
    );
    const serializedEntries = JSON.stringify(persistedEntries);

    if (Platform.OS === "web" && typeof window !== "undefined") {
      await setWebStorageItem(CUSTOM_CARD_BACK_STORAGE_KEY, serializedEntries);
      return;
    }

    await (await getNativeStorageAdapter())?.setItem(CUSTOM_CARD_BACK_STORAGE_KEY, serializedEntries);
  } catch (error) {
    console.warn("Unable to persist custom CardMagic card backs.", error);
  }
}

async function storeUserProgress(profile: UserProgressProfile) {
  try {
    const serializedProfile = JSON.stringify(normalizeUserProgressProfile(profile));

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage.setItem(USER_PROGRESS_STORAGE_KEY, serializedProfile);
      return;
    }

    await (await getNativeStorageAdapter())?.setItem(USER_PROGRESS_STORAGE_KEY, serializedProfile);
  } catch (error) {
    console.warn("Unable to persist CardMagic user progression.", error);
  }
}

function getSetCardDisplayCard(snapshot: SetCardSnapshot): CardDraft {
  return snapshot.card;
}

function getSetCardPreviewCard(snapshot: SetCardSnapshot, set: CardSet): CardDraft {
  return withResolvedSetDefaults(snapshot.card, set);
}

function getSafeSetCardPreviewCard(snapshot: SetCardSnapshot, set: CardSet): CardDraft {
  try {
    return getSetCardPreviewCard(snapshot, set);
  } catch (error) {
    logStorageWarning("Unable to build saved-card preview; falling back to a normalized card draft.", {
      setId: set.id,
      setName: set.name,
      snapshotId: snapshot.id,
      error,
    });

    try {
      return withResolvedSetDefaults(normalizeStoredCardDraft(snapshot.card), set);
    } catch (normalizationError) {
      logStorageWarning("Unable to normalize saved-card preview fallback; using the initial card draft.", {
        setId: set.id,
        setName: set.name,
        snapshotId: snapshot.id,
        error: normalizationError,
      });

      return withResolvedSetDefaults(cloneCardDraft(INITIAL_CARD), set);
    }
  }
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

function normalizeGeneratedSetSymbolEntries(entries: GeneratedSetSymbolEntry[]) {
  const seen = new Set<string>();

  return [...entries]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .flatMap((entry) => {
      const normalizedEntry: GeneratedSetSymbolEntry = {
        ...entry,
        id: isUuid(entry.id) ? entry.id : createUuid(),
        label: toTitleCase(entry.label.trim() || "Custom"),
      };
      const key = normalizedEntry.uri;

      if (seen.has(key)) {
        return [];
      }

      seen.add(key);
      return [normalizedEntry];
    })
    .slice(0, GENERATED_SET_SYMBOL_MAX_ENTRIES);
}

function normalizeCustomCardBackEntries(entries: CustomCardBackEntry[]) {
  const seen = new Set<string>();

  return [...entries]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .filter((entry) => {
      const label = toTitleCase(entry.label.trim() || "Custom Back").slice(0, 24);
      const description = entry.description.trim() || "Custom CardMagic card back";
      const key = entry.id || entry.uri;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      entry.label = label;
      entry.description = description;
      return true;
    })
    .slice(0, CUSTOM_CARD_BACK_MAX_ENTRIES);
}

function toTitleCase(value: string) {
  return value.replace(/\S+/g, (word) => {
    const firstLetterIndex = word.search(/[A-Za-z0-9]/);

    if (firstLetterIndex === -1) {
      return word;
    }

    return `${word.slice(0, firstLetterIndex)}${word[firstLetterIndex].toUpperCase()}${word
      .slice(firstLetterIndex + 1)
      .toLowerCase()}`;
  });
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

async function waitForExportPreviewRef(
  ref: RefObject<View | null>,
  options: {
    nativeID?: string;
    timeoutMs?: number;
    errorMessage: string;
  },
) {
  const timeoutMs = options.timeoutMs ?? 2500;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (ref.current) {
      return ref.current;
    }

    if (Platform.OS === "web" && options.nativeID && typeof document !== "undefined") {
      const webElement =
        document.getElementById(options.nativeID) ??
        document.querySelector(`[data-testid="${options.nativeID.replace(/["\\]/g, "\\$&")}"]`);

      if (webElement) {
        return webElement as unknown as View;
      }
    }

    await waitForRenderFrame(50);
  }

  throw new Error(options.errorMessage);
}

async function waitForExportPreviewImages(target: View | HTMLElement | null, timeoutMs = 3000) {
  if (Platform.OS !== "web" || !target || typeof HTMLImageElement === "undefined") {
    return;
  }

  const root = target as HTMLElement;
  const images = Array.from(root.querySelectorAll("img")) as HTMLImageElement[];

  if (images.length === 0) {
    await waitForRenderFrame(80);
    return;
  }

  const startedAt = Date.now();
  await Promise.all(
    images.map(async (image) => {
      if (image.complete && image.naturalWidth > 0) {
        return;
      }

      if (typeof image.decode === "function") {
        try {
          await Promise.race([
            image.decode(),
            new Promise<void>((resolve) =>
              setTimeout(resolve, Math.max(100, timeoutMs - (Date.now() - startedAt))),
            ),
          ]);
          return;
        } catch {
          // Fall back to load/error events below. Safari can reject decode() for cached images.
        }
      }

      await new Promise<void>((resolve) => {
        if (image.complete) {
          resolve();
          return;
        }

        const remainingMs = Math.max(100, timeoutMs - (Date.now() - startedAt));
        const cleanup = () => {
          image.removeEventListener("load", cleanup);
          image.removeEventListener("error", cleanup);
          resolve();
        };

        image.addEventListener("load", cleanup, { once: true });
        image.addEventListener("error", cleanup, { once: true });
        setTimeout(cleanup, remainingMs);
      });
    }),
  );
  await waitForRenderFrame(120);
}

async function getCardExportArtImageAspectRatio(card: CardDraft): Promise<number | null> {
  const faceCard = getEditableCardFace(card);

  if (!faceCard.artUri) {
    return null;
  }

  return await new Promise<number | null>((resolve) => {
    Image.getSize(
      faceCard.artUri ?? "",
      (width, height) => resolve(width > 0 && height > 0 ? width / height : null),
      () => resolve(null),
    );
  });
}

async function applyExportRenderTargetUpdate(update: () => void) {
  if (Platform.OS === "web") {
    const reactDom = await import("react-dom");

    if (typeof reactDom.flushSync === "function") {
      reactDom.flushSync(update);
    } else {
      update();
    }

    await waitForRenderFrame(80);
    return;
  }

  update();
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

function loadViewShotCaptureRef() {
  return nativeViewShotCaptureRef;
}

type WebViewShotOptions = {
  width?: number;
  height?: number;
  format?: "png" | "jpg";
  quality?: number;
  result?: "tmpfile" | "base64" | "data-uri" | "blob";
};

async function captureWebRefWithHtml2Canvas(view: HTMLElement, options: WebViewShotOptions) {
  if (options.result === "tmpfile") {
    console.warn(
      "Tmpfile is not implemented for web. Try base64 or data-uri. For compatibility, it currently returns the same result as data-uri.",
    );
  }

  const { default: html2canvas } = await import("html2canvas");
  let renderedCanvas = await html2canvas(view);

  if (options.width && options.height) {
    const resizedCanvas = document.createElement("canvas");
    const resizedContext = resizedCanvas.getContext("2d");

    resizedCanvas.height = options.height;
    resizedCanvas.width = options.width;
    resizedContext?.drawImage(renderedCanvas, 0, 0, resizedCanvas.width, resizedCanvas.height);
    renderedCanvas = resizedCanvas;
  }

  if (options.result === "blob") {
    return await new Promise<Blob>((resolve, reject) => {
      renderedCanvas.toBlob(
        (blob) => {
          blob ? resolve(blob) : reject(new Error("CardMagic could not encode the rendered canvas as a PNG blob."));
        },
        `image/${options.format ?? "png"}`,
        options.quality ?? 1,
      );
    });
  }

  const dataUrl = renderedCanvas.toDataURL(`image/${options.format ?? "png"}`, options.quality ?? 1);

  if (options.result === "data-uri" || options.result === "tmpfile") {
    return dataUrl;
  }

  return dataUrl.replace(/data:image\/(\w+);base64,/, "");
}

function loadWebViewShotCaptureRef() {
  return captureWebRefWithHtml2Canvas;
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

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image blob."));
    reader.readAsDataURL(blob);
  });
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

function openWebImageInNewTab(fileName: string, dataUri: string): WebFileActionResult {
  if (typeof window === "undefined") {
    return "cancelled";
  }

  const url = normalizeWebPngExportUri(dataUri);
  const openedWindow = window.open(url, "_blank", "noopener,noreferrer");

  if (openedWindow) {
    openedWindow.document.title = fileName;
    return "opened";
  }

  window.location.href = url;
  return "opened";
}

async function shareOrDownloadWebFile(
  fileName: string,
  blob: Blob,
  title = fileName,
  fileHandle?: WebFileSystemFileHandle | null,
): Promise<WebFileActionResult> {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return "cancelled";
  }

  if (shouldPreferWebFileShare()) {
    const shareResult = await tryShareWebFile(fileName, blob, title);

    if (shareResult === "shared") {
      return "shared";
    }

    if (shareResult === "cancelled") {
      return "cancelled";
    }
  }

  if (fileHandle) {
    await writeWebFileHandle(fileHandle, blob);
    return "saved";
  }

  const pickedFileHandle = await promptForWebSaveFileHandle(fileName, blob.type || "application/octet-stream");

  if (pickedFileHandle === "cancelled") {
    return "cancelled";
  }

  if (pickedFileHandle) {
    await writeWebFileHandle(pickedFileHandle, blob);
    return "saved";
  }

  downloadBlob(fileName, blob);
  return "saved";
}

async function writeJsZipArchiveToWebFile(archive: JsZipArchiveLike, fileHandle: WebFileSystemFileHandle) {
  const writable = await fileHandle.createWritable();
  const stream = archive.generateInternalStream({ type: "uint8array", streamFiles: true });
  let writeChain = Promise.resolve();

  try {
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const rejectOnce = (error: unknown) => {
        if (settled) {
          return;
        }

        settled = true;
        reject(error instanceof Error ? error : new Error(String(error)));
      };

      stream
        .on("data", ((chunk: Uint8Array) => {
          stream.pause();
          writeChain = writeChain
            .then(() => writable.write(new Blob([getArrayBufferSlice(chunk)], { type: "application/zip" })))
            .then(() => {
              if (!settled) {
                stream.resume();
              }
            }, rejectOnce);
        }) as (chunk: Uint8Array) => void)
        .on("error", rejectOnce as (error: unknown) => void)
        .on("end", (() => {
          writeChain.then(() => {
            if (!settled) {
              settled = true;
              resolve();
            }
          }, rejectOnce);
        }) as () => void)
        .resume();
    });
  } finally {
    await writable.close();
  }
}

async function shareOrDownloadWebZipArchive(
  fileName: string,
  archive: JsZipArchiveLike,
  fileHandle: WebFileSystemFileHandle | null,
) {
  if (fileHandle) {
    await writeJsZipArchiveToWebFile(archive, fileHandle);
    return "saved" as const;
  }

  const zipBlob = await archive.generateAsync({ type: "blob", streamFiles: true });
  return shareOrDownloadWebFile(fileName, zipBlob, "Export CardMagic set batch");
}

async function createWebStreamingZipWriter(fileHandle: WebFileSystemFileHandle): Promise<WebStreamingZipWriter> {
  const writable = await fileHandle.createWritable();
  const entries: WebStreamingZipEntry[] = [];
  let offset = 0;
  let closed = false;

  const writeZipBytes = async (bytes: Uint8Array) => {
    await writable.write(new Blob([getArrayBufferSlice(bytes)], { type: "application/zip" }));
    offset += bytes.byteLength;
  };

  return {
    async addFile(fileName, data) {
      if (closed) {
        throw new Error("Cannot write to a finalized ZIP archive.");
      }

      const fileNameBytes = getUtf8Bytes(fileName);
      const fileBytes = typeof data === "string" ? getUtf8Bytes(data) : data;

      assertZip32Size(fileNameBytes.byteLength, "ZIP file name");
      assertZip32Size(fileBytes.byteLength, fileName);
      assertZip32Size(offset, "ZIP local header offset");

      const entry: WebStreamingZipEntry = {
        fileNameBytes,
        crc32: getCrc32(fileBytes),
        compressedSize: fileBytes.byteLength,
        uncompressedSize: fileBytes.byteLength,
        localHeaderOffset: offset,
        modifiedAt: new Date(),
      };

      const header = createZipLocalFileHeader(entry);
      await writeZipBytes(header);
      await writeZipBytes(fileBytes);
      entries.push(entry);
    },
    async close() {
      if (closed) {
        return;
      }

      closed = true;
      const centralDirectoryOffset = offset;

      for (const entry of entries) {
        await writeZipBytes(createZipCentralDirectoryHeader(entry));
      }

      const centralDirectorySize = offset - centralDirectoryOffset;
      await writeZipBytes(createZipEndOfCentralDirectory(entries.length, centralDirectorySize, centralDirectoryOffset));
      await writable.close();
    },
    async abort() {
      if (closed) {
        return;
      }

      closed = true;

      if (writable.abort) {
        await writable.abort();
        return;
      }

      await writable.close();
    },
  };
}

function createZipLocalFileHeader(entry: WebStreamingZipEntry) {
  const header = new Uint8Array(30 + entry.fileNameBytes.byteLength);
  const view = new DataView(header.buffer);
  const { dosDate, dosTime } = getZipDosDateTime(entry.modifiedAt);

  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0x0800, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, dosTime, true);
  view.setUint16(12, dosDate, true);
  view.setUint32(14, entry.crc32, true);
  view.setUint32(18, entry.compressedSize, true);
  view.setUint32(22, entry.uncompressedSize, true);
  view.setUint16(26, entry.fileNameBytes.byteLength, true);
  view.setUint16(28, 0, true);
  header.set(entry.fileNameBytes, 30);

  return header;
}

function createZipCentralDirectoryHeader(entry: WebStreamingZipEntry) {
  const header = new Uint8Array(46 + entry.fileNameBytes.byteLength);
  const view = new DataView(header.buffer);
  const { dosDate, dosTime } = getZipDosDateTime(entry.modifiedAt);

  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0x0800, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, dosTime, true);
  view.setUint16(14, dosDate, true);
  view.setUint32(16, entry.crc32, true);
  view.setUint32(20, entry.compressedSize, true);
  view.setUint32(24, entry.uncompressedSize, true);
  view.setUint16(28, entry.fileNameBytes.byteLength, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, entry.localHeaderOffset, true);
  header.set(entry.fileNameBytes, 46);

  return header;
}

function createZipEndOfCentralDirectory(entryCount: number, centralDirectorySize: number, centralDirectoryOffset: number) {
  assertZip32Size(entryCount, "ZIP entry count");
  assertZip32Size(centralDirectorySize, "ZIP central directory size");
  assertZip32Size(centralDirectoryOffset, "ZIP central directory offset");

  const header = new Uint8Array(22);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, entryCount, true);
  view.setUint16(10, entryCount, true);
  view.setUint32(12, centralDirectorySize, true);
  view.setUint32(16, centralDirectoryOffset, true);
  view.setUint16(20, 0, true);

  return header;
}

function getZipDosDateTime(date: Date) {
  const year = Math.min(2107, Math.max(1980, date.getFullYear()));
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | (month << 5) | day;

  return { dosDate, dosTime };
}

function getUtf8Bytes(value: string) {
  return new TextEncoder().encode(value);
}

let crc32Table: Uint32Array | null = null;

function getCrc32(bytes: Uint8Array) {
  const table = getCrc32Table();
  let crc = 0xffffffff;

  for (let index = 0; index < bytes.length; index += 1) {
    crc = table[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function getCrc32Table() {
  if (crc32Table) {
    return crc32Table;
  }

  crc32Table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    crc32Table[index] = value >>> 0;
  }

  return crc32Table;
}

function assertZip32Size(value: number, label: string) {
  if (value > 0xffffffff) {
    throw new Error(`${label} exceeds the ZIP32 size limit.`);
  }
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

async function shareOrDownloadWebPng(
  fileName: string,
  dataUri: string,
  fileHandle?: WebFileSystemFileHandle | null,
): Promise<WebFileActionResult> {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return "cancelled";
  }

  const blob = await webPngExportUriToBlob(dataUri);
  return await shareOrDownloadWebFile(fileName, blob, "Export CardMagic PNG", fileHandle);
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

type MaterializedAiImageResult = AiCreditProgressResponse & {
  uri: string;
};

async function generateOpenAiImageUri({
  prompt,
  options = OPENAI_AUXILIARY_IMAGE_OPTIONS,
  spendCategory,
}: {
  prompt: string;
  options?: AiImageGenerationOptions;
  spendCategory?: CreditSpendCategory;
}): Promise<MaterializedAiImageResult> {
  const image = await generateAiImageViaEdge({ prompt, options, spendCategory });

  if (image.b64Json) {
    return {
      uri: await materializeBase64ImageUri(image.b64Json, "png", "generated-art"),
      progress: image.progress,
      creditSpend: image.creditSpend,
    };
  }

  if (image.url) {
    return {
      uri: await materializeExternalImageUri(image.url, "generated-art"),
      progress: image.progress,
      creditSpend: image.creditSpend,
    };
  }

  throw new Error("OpenAI did not return image data.");
}

async function generateOpenAiImageEditUri({
  imageUri,
  prompt,
  size,
  spendCategory,
}: {
  imageUri: string;
  prompt: string;
  size: AiImageGenerationOptions["size"];
  spendCategory?: CreditSpendCategory;
}): Promise<MaterializedAiImageResult> {
  const image = await generateAiImageEditViaEdge({ imageUri, prompt, size, spendCategory });

  if (image.b64Json) {
    return {
      uri: await materializeBase64ImageUri(image.b64Json, "png", "edited-image"),
      progress: image.progress,
      creditSpend: image.creditSpend,
    };
  }

  if (image.url) {
    return {
      uri: await materializeExternalImageUri(image.url, "edited-image"),
      progress: image.progress,
      creditSpend: image.creditSpend,
    };
  }

  throw new Error("OpenAI did not return edited image data.");
}

// Unions multiple per-concept cutouts into one matte. Each cutout is the source
// image with only its concept opaque, so stacking them with default source-over
// compositing merges the opaque regions. Web-only (uses canvas); falls back to
// the first cutout elsewhere.
async function compositeSubjectCutouts(urls: string[]): Promise<string> {
  if (Platform.OS !== "web" || typeof document === "undefined") {
    return urls[0];
  }

  const images = await Promise.all(
    urls.map((url, index) =>
      loadHtmlImage(url).catch((error) => {
        console.warn("[CardMagic subject mask] Subject cutout image failed to load.", {
          index,
          uri: getImageUriLogDescriptor(url),
          error,
        });
        throw error;
      }),
    ),
  );
  const width = Math.max(...images.map((image) => image.naturalWidth || 0)) || images[0].naturalWidth;
  const height = Math.max(...images.map((image) => image.naturalHeight || 0)) || images[0].naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return urls[0];
  }

  for (const image of images) {
    ctx.drawImage(image, 0, 0, width, height);
  }

  try {
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.warn("[CardMagic subject mask] Subject cutout canvas export failed.", {
      imageCount: images.length,
      sources: urls.map(getImageUriLogDescriptor),
      error,
    });
    throw new Error(
      "Subject mask cutouts loaded but could not be composited. The image source may not allow canvas export.",
    );
  }
}

function getSubjectMaskConcepts(targetPrompt?: string): string[] {
  const prompt = targetPrompt?.trim();

  if (!prompt) {
    return [];
  }

  const concepts = prompt
    .replace(/\s*&\s*/g, ",")
    .split(/[,;]+|\s+(?:and|plus|with)\s+/i)
    .map((concept) => concept.replace(/^(?:a|an|the)\s+/i, "").trim())
    .filter(Boolean)
    .slice(0, 4);

  return Array.from(new Set(concepts));
}

function getSubjectMaskPromptForProvider(targetPrompt?: string): string | undefined {
  const concepts = getSubjectMaskConcepts(targetPrompt);
  return concepts.length > 0 ? concepts.join(", ") : undefined;
}

function getFriendlySubjectMaskError(error: unknown, targetPrompt?: string) {
  const message = error instanceof Error ? error.message : String(error);
  const concepts = getSubjectMaskConcepts(targetPrompt);
  const targetLabel = concepts.length > 0 ? concepts.join(", ") : targetPrompt?.trim();
  const targetText =
    targetLabel && concepts.length > 1
      ? `those subjects (${targetLabel})`
      : targetLabel
        ? `“${targetLabel}”`
        : "that subject";

  if (message.includes("taking too long") || message.includes("timed out")) {
    return message || "Targeted masking is taking too long. Try one simpler visible object, or try again in a moment.";
  }

  if (
    error instanceof SubjectMatteProviderError ||
    message.includes("Couldn't find") ||
    message.includes("masksLength") ||
    message.includes("did not return a segmented mask URL")
  ) {
    return `I couldn't isolate ${targetText} in this art. Try one simple visible object, like “arrow”, “bow”, “face”, or “wolf”. Very thin or overlapping objects may need a simpler target or manual mask editing.`;
  }

  return message || "CardMagic could not generate the subject mask.";
}

async function generateSubjectMatteUri({
  imageUri,
  targetPrompt,
}: {
  imageUri: string;
  targetPrompt?: string;
}) {
  // Prompted SAM segmentation runs one fal call per concept (in parallel); send a
  // downscaled image so the bodies stay small. The mask is normalized against the
  // full-res original below, so output resolution is unaffected.
  const providerPrompt = getSubjectMaskPromptForProvider(targetPrompt);
  const requestImageUri = providerPrompt
    ? await downscaleImageForMaskRequest(imageUri)
    : imageUri;
  const matte = await generateSubjectMatteViaEdge({ imageUri: requestImageUri, targetPrompt: providerPrompt });
  let matteUri: string;

  // Per-concept cutouts (prompted segmentation): merge the enabled ones and keep
  // the components so the UI can toggle each subject on/off without re-running.
  const subjectMasks = (matte.subjectMasks ?? []).filter((mask) => mask && Boolean(mask.url));

  if (subjectMasks.length > 0) {
    const components = subjectMasks.map((mask) => ({ concept: mask.concept, cutoutUrl: mask.url }));
    const cutoutUrls = components.map((component) => component.cutoutUrl);
    const merged = cutoutUrls.length > 1 ? await compositeSubjectCutouts(cutoutUrls) : cutoutUrls[0];
    matteUri = await materializeImageUri(merged, "subject-matte");
    return {
      uri: await normalizeSubjectMatteImageUri(matteUri, imageUri, { keepAllComponents: cutoutUrls.length > 1 }),
      diagnostics: matte.diagnostics,
      components,
      sourceUri: imageUri,
      progress: matte.progress,
      creditSpend: matte.creditSpend,
    };
  }

  if (matte.b64Json) {
    matteUri = await materializeBase64ImageUri(matte.b64Json, "png", "subject-matte");
    return {
      uri: await normalizeSubjectMatteImageUri(matteUri, imageUri),
      diagnostics: matte.diagnostics,
      components: [] as { concept: string; cutoutUrl: string }[],
      sourceUri: imageUri,
      progress: matte.progress,
      creditSpend: matte.creditSpend,
    };
  }

  if (matte.url) {
    matteUri = await materializeImageUri(matte.url, "subject-matte");
    return {
      uri: await normalizeSubjectMatteImageUri(matteUri, imageUri),
      diagnostics: matte.diagnostics,
      components: [] as { concept: string; cutoutUrl: string }[],
      sourceUri: imageUri,
      progress: matte.progress,
      creditSpend: matte.creditSpend,
    };
  }

  throw new Error("Subject matte provider did not return image data.");
}

// Re-merge the currently-enabled per-subject cutouts into a single matte.
// Returns null when nothing is enabled (caller should clear the mask).
async function composeSubjectMaskFromComponents(
  components: { concept: string; cutoutUrl: string; enabled: boolean }[],
  sourceUri: string,
): Promise<string | null> {
  const enabledUrls = components.filter((component) => component.enabled).map((component) => component.cutoutUrl);

  if (enabledUrls.length === 0) {
    return null;
  }

  const merged = enabledUrls.length > 1 ? await compositeSubjectCutouts(enabledUrls) : enabledUrls[0];
  const matteUri = await materializeImageUri(merged, "subject-matte");
  return normalizeSubjectMatteImageUri(matteUri, sourceUri, { keepAllComponents: enabledUrls.length > 1 });
}

async function generateOpenAiRulesText({
  prompt,
}: {
  prompt: string;
}) {
  return parseOpenAiRulesTextResponse(await fixRulesTextViaEdge(prompt));
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
    .replace(/\bdiscard pile\b/gi, "graveyard")
    .replace(/\bremoved from the game\b/gi, "exile")
    .replace(/\bplay area\b/gi, "battlefield")
    .replace(/\bdecks\b/gi, "libraries")
    .replace(/\bdeck\b/gi, "library")
    .replace(
      /\bYou may cast (?:a|an|one) (?:spell|card) from your library without paying its mana cost\./gi,
      "You may cast the top card of your library without paying its mana cost.",
    )
    .replace(
      /\bYou may play (?:a|an|one) card from your library\./gi,
      "You may play the top card of your library.",
    )
    .replace(
      /\bPlay (?:a|an|one) card from your library this turn\./gi,
      "Exile the top card of your library. You may play that card this turn.",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function captureWebPngWithHtml2Canvas(element: HTMLElement): Promise<string> {
  const captureWebRef = await loadWebViewShotCaptureRef();
  const result = await withTimeout(
    captureWebRef(element, { format: "png", quality: 1, result: "data-uri" }),
    20000,
    "CardMagic timed out while rasterizing the card preview.",
  );
  return String(result);
}

async function captureCardMagicPng(target: View | null): Promise<string> {
  if (!target) {
    throw new Error("CardMagic could not find the rendered card preview.");
  }

  if (Platform.OS === "web") {
    // Masked layers (borderless pinline, rarity set symbol) are pre-flattened
    // into the export render, so html2canvas captures them faithfully.
    return captureWebPngWithHtml2Canvas(target as unknown as HTMLElement);
  }

  if (!hasNativeModule("RNViewShot")) {
    throw new Error("RNViewShot native module is unavailable.");
  }

  const captureRef = await loadViewShotCaptureRef();

  const result = await withTimeout(
    captureRef(target, {
      format: "png",
      quality: 1,
      result: "tmpfile",
    }),
    30000,
    "CardMagic timed out while rasterizing the card preview.",
  );
  return String(result);
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

function FrameChangeMenu({
  open,
  menuWidth,
  showMenu = true,
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
  showMenu?: boolean;
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

      {open && showMenu ? (
        <View
          style={{
            position: "absolute",
            right: PREVIEW_ACTION_BUTTON_SIZE + 10,
            bottom: 0,
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
  useWebTextSelectionGuard();

  const [card, setCard] = useState<CardDraft>(() => createStarterCard());
  const [activeSection, setActiveSection] = useState<CardSection | null>(null);
  const [sheetSection, setSheetSection] = useState<CardSection | null>(null);
  const previewBoundsRef = useRef<CoordinateBounds | null>(null);
  const previewContainerRef = useRef<View>(null);
  const visibleCardExportRef = useRef<View>(null);
  const visibleCardExportActive = false;
  const mainScrollRef = useRef<ScrollView>(null);
  const communityScrollBoundaryHandlerRef = useRef<MainScrollBoundaryHandler | null>(null);
  const singleExportContainerRef = useRef<View>(null);
  const batchExportContainerRef = useRef<View>(null);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("edit");
  const [customKeywordDefinitions, setCustomKeywordDefinitions] = useState<KeywordDefinition[]>([]);
  const [cardSets, setCardSets] = useState<CardSet[]>(createDefaultCardSets);
  const cardSetsRef = useRef<CardSet[]>(cardSets);
  const [deletionTombstones, setDeletionTombstones] = useState<DeletionTombstones>(createEmptyDeletionTombstones);
  const deletionTombstonesRef = useRef<DeletionTombstones>(deletionTombstones);
  const [artLibraryEntries, setArtLibraryEntries] = useState<ArtLibraryEntry[]>([]);
  const [customCardBacks, setCustomCardBacks] = useState<CustomCardBackEntry[]>([]);
  const [generatedSetSymbols, setGeneratedSetSymbols] = useState<GeneratedSetSymbolEntry[]>([]);
  const generatedSetSymbolsRef = useRef<GeneratedSetSymbolEntry[]>(generatedSetSymbols);
  const [userProgress, setUserProgress] = useState<UserProgressProfile>(() => createDefaultUserProgress());
  const userProgressRef = useRef(userProgress);
  const [previewToolbarPosition, setPreviewToolbarPosition] = useState<PreviewToolbarPosition | null>(null);
  const previewToolbarPositionRef = useRef<PreviewToolbarPosition | null>(null);
  const previewToolbarDragStartRef = useRef<PreviewToolbarPosition | null>(null);
  const previewToolbarDragStartGrabberAnchorRef = useRef<PreviewToolbarPosition | null>(null);
  const [previewToolbarOrientationOverride, setPreviewToolbarOrientationOverride] =
    useState<PreviewToolbarOrientation | null>(null);
  const [previewToolbarCollapsed, setPreviewToolbarCollapsed] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState(DEFAULT_MAIN_SET_ID);
  const [activeSetCardId, setActiveSetCardId] = useState<string | null>(null);
  const [cardHasUnsavedEdits, setCardHasUnsavedEdits] = useState(false);
  const [newSetName, setNewSetName] = useState("");
  const [previewRotated, setPreviewRotated] = useState(false);
  const previewRotateIconDegrees = useSharedValue(0);
  const previewToolbarTransition = useSharedValue(1);
  const [suppressPreviewFlipTransition, setSuppressPreviewFlipTransition] = useState(false);
  const [cardActionMenuOpen, setCardActionMenuOpen] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [randomizeSavePromptOpen, setRandomizeSavePromptOpen] = useState(false);
  const [savedCardPrompt, setSavedCardPrompt] = useState<{
    cardName: string;
    setName: string;
  } | null>(null);
  const [saveCardChoicePrompt, setSaveCardChoicePrompt] = useState<{
    cardName: string;
    setName: string;
    targetSetId: string;
    overwriteSnapshotId: string | null;
    overwriteLabel: string;
  } | null>(null);
  const [physicalBackMenuOpen, setPhysicalBackMenuOpen] = useState(false);
  const [artSourceOpen, setArtSourceOpen] = useState(false);
  const [artGeneratorOpen, setArtGeneratorOpen] = useState(false);
  const [creditStoreOpen, setCreditStoreOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [earlyAccessCodeOpen, setEarlyAccessCodeOpen] = useState(false);
  const [accountUser, setAccountUser] = useState<SupabaseUser | null>(null);
  const [accountProfile, setAccountProfile] = useState<AccountProfile | null>(null);
  const [accountSyncBusy, setAccountSyncBusy] = useState(false);
  const [accountSetsHydrated, setAccountSetsHydrated] = useState(false);
  const [checkoutBusyProductId, setCheckoutBusyProductId] = useState<CheckoutProductId | null>(null);
  const [checkoutErrorMessage, setCheckoutErrorMessage] = useState<string | null>(null);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [achievementPopups, setAchievementPopups] = useState<AchievementPopup[]>([]);
  const [xpFloatingNumbers, setXpFloatingNumbers] = useState<XpFloatingNumber[]>([]);
  const [levelUpToasts, setLevelUpToasts] = useState<LevelUpToastItem[]>([]);
  const [authToast, setAuthToast] = useState<AuthToastState | null>(null);
  const [setSymbolGeneratorOpen, setSetSymbolGeneratorOpen] = useState(false);
  const [setSymbolGeneratorPrompt, setSetSymbolGeneratorPrompt] = useState("");
  const [setSymbolGeneratorBusy, setSetSymbolGeneratorBusy] = useState(false);
  const [setSymbolGeneratorError, setSetSymbolGeneratorError] = useState<string | null>(null);
  const [setSymbolGeneratorTargetSetId, setSetSymbolGeneratorTargetSetId] = useState<string | null>(null);
  const [cardBackGeneratorOpen, setCardBackGeneratorOpen] = useState(false);
  const [cardBackGeneratorPrompt, setCardBackGeneratorPrompt] = useState("");
  const [cardBackGeneratorMode, setCardBackGeneratorMode] = useState<CardBackGeneratorMode>("reskin");
  const [cardBackGeneratorBusy, setCardBackGeneratorBusy] = useState(false);
  const [cardBackGeneratorError, setCardBackGeneratorError] = useState<string | null>(null);
  const [artGeneratorRequest, setArtGeneratorRequest] = useState("");
  const [artGeneratorQuality, setArtGeneratorQuality] = useState<ArtImageQuality>("medium");
  const [artGeneratorStyle, setArtGeneratorStyle] = useState<ArtGeneratorStyleId>("random");
  const [artGeneratorVariationSeed, setArtGeneratorVariationSeed] = useState(0);
  const [artGeneratorBusy, setArtGeneratorBusy] = useState(false);
  const [artGeneratorError, setArtGeneratorError] = useState<string | null>(null);
  const [subjectMaskBusy, setSubjectMaskBusy] = useState(false);
  const [subjectMaskStatus, setSubjectMaskStatus] = useState<string | null>(null);
  const [subjectMaskError, setSubjectMaskError] = useState<string | null>(null);
  const [, setSubjectMaskDiagnostics] = useState<SubjectMatteDiagnostics | null>(null);
  // Per-subject cutouts from the last prompted segmentation, each toggleable on/off.
  const [subjectMaskComponents, setSubjectMaskComponents] = useState<SubjectMaskComponent[]>([]);
  const subjectMaskSourceUriRef = useRef<string | null>(null);
  const [subjectMaskToggleBusy, setSubjectMaskToggleBusy] = useState(false);
  const [rulesTextFixerBusy, setRulesTextFixerBusy] = useState(false);
  const [rulesTextFixerError, setRulesTextFixerError] = useState<string | null>(null);
  const [rulesTextFixerSuggestion, setRulesTextFixerSuggestion] = useState<{
    original: string;
    corrected: string;
  } | null>(null);
  const [artAdjustOpen, setArtAdjustOpen] = useState(false);
  const [artAdjustmentInitialMode, setArtAdjustmentInitialMode] = useState<ArtAdjustmentInitialMode>("crop");
  const [physicalBackVisible, setPhysicalBackVisible] = useState(false);
  const [singleExportTarget, setSingleExportTarget] = useState<FlatCardExportTarget | null>(null);
  const [webPhotoExport, setWebPhotoExport] = useState<WebPhotoExport | null>(null);
  const [exportConfirmationToast, setExportConfirmationToast] = useState<ExportConfirmationToastState | null>(null);
  const [deleteUndo, setDeleteUndo] = useState<DeleteUndoState | null>(null);
  const [webPhotoExportBusy, setWebPhotoExportBusy] = useState(false);
  const [batchExportCard, setBatchExportCard] = useState<CardDraft | null>(null);
  const [batchExportProgress, setBatchExportProgress] = useState<BatchExportProgress | null>(null);
  const [activeDraftHydrated, setActiveDraftHydrated] = useState(false);
  const [setsHydrated, setSetsHydrated] = useState(false);
  const [deletionTombstonesHydrated, setDeletionTombstonesHydrated] = useState(false);
  const [artLibraryHydrated, setArtLibraryHydrated] = useState(false);
  const [customCardBacksHydrated, setCustomCardBacksHydrated] = useState(false);
  const [generatedSetSymbolsHydrated, setGeneratedSetSymbolsHydrated] = useState(false);
  const [userProgressHydrated, setUserProgressHydrated] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showReturnToTop, setShowReturnToTop] = useState(false);
  const [patchNotesOpen, setPatchNotesOpen] = useState(false);
  const [betaReleaseDeployment, setBetaReleaseDeployment] =
    useState<CardMagicReleaseDeployment | null>(null);
  const { width, height } = useWindowDimensions();
  const mobileBrowserBottomInset = useMobileBrowserBottomInset(width);
  const [cardFontsLoaded, cardFontLoadError] = useFonts(FULL_MAGIC_PACK.fonts);
  const cardFontsReady = cardFontsLoaded || Boolean(cardFontLoadError);

  const faceCard = useMemo(() => getEditableCardFace(card), [card]);

  useEffect(() => {
    let cancelled = false;

    fetchCardMagicReleaseDeployment("beta")
      .then((deployment) => {
        if (!cancelled) {
          setBetaReleaseDeployment(deployment);
        }
      })
      .catch((error) => {
        console.warn("Unable to load CardMagic beta release metadata.", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (subjectMaskBusy || subjectMaskToggleBusy) {
      return;
    }

    const components = normalizeSubjectMaskComponentsField(faceCard.artSubjectMaskComponents) ?? [];
    setSubjectMaskComponents(components);
    subjectMaskSourceUriRef.current = components.length > 0 ? faceCard.artUri ?? null : null;
  }, [faceCard.artSubjectMaskComponents, faceCard.artUri, subjectMaskBusy, subjectMaskToggleBusy]);

  const accountFooterOwnerName = useMemo(() => {
    const explicitName =
      accountProfile?.username ??
      accountProfile?.displayName ??
      accountUser?.user_metadata?.name ??
      accountUser?.user_metadata?.full_name ??
      accountUser?.email?.split("@")[0];

    return String(explicitName ?? "CardMagic Creator").trim() || "CardMagic Creator";
  }, [
    accountProfile?.displayName,
    accountProfile?.username,
    accountUser?.email,
    accountUser?.user_metadata?.full_name,
    accountUser?.user_metadata?.name,
  ]);
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
  const headerVersionLabel = `v${CARDMAGIC_APP_VERSION}`;
  const headerContextLabel = `${frameTypeLabel} · ${selectedSet?.name ?? "No set"}`;
  const previewCard = useMemo(
    () => withResolvedSetDefaults(getSetNumberedPreviewCard(card, selectedSet?.cards ?? [], activeSetCardId), selectedSet),
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
  const canAddCardBack = previewTypeFrame !== "planeswalker";
  const canAddPhysicalCardBackFace = !hasBackFace && canAddCardBack;
  const rotatePreview = useCallback(() => {
    previewRotateIconDegrees.value = 0;
    previewRotateIconDegrees.value = withTiming(previewRotated ? -180 : 180, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
    setPreviewRotated((current) => !current);
  }, [previewRotateIconDegrees, previewRotated]);
  const previewRotateIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${previewRotateIconDegrees.value}deg` }],
  }));
  const previewRotationDegrees =
    hasRotateControl && previewRotated ? getFaceUpPreviewRotationDegrees(previewTypeFrame) : 0;
  const previewQuarterTurn = previewRotationDegrees % 180 !== 0;
  const previewAvailableOuterHeight = Math.max(
    180,
    height -
      EDIT_TAB_VERTICAL_CHROME_HEIGHT -
      (keyboardVisible ? 0 : BOTTOM_TAB_BAR_HEIGHT + PREVIEW_FLOATING_TOOLBAR_CARD_GAP_RESERVE),
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
  const previewSurfaceHeight = previewQuarterTurn
    ? previewRenderWidth
    : previewRenderWidth / previewAspectRatio;
  const nextFaceLabel = hasBackFace
    ? isDfcBackFace(card) ? "front face" : "back face"
    : showingPhysicalBack ? "front face" : "card back";
  const previewActionCount =
    3 +
    (hasDeleteBackControl ? 1 : 0) +
    (hasRotateControl ? 1 : 0);
  const previewVisibleActionCount = previewToolbarCollapsed ? 0 : previewActionCount;
  const previewToolbarItemCount = previewVisibleActionCount + 1;
  const previewToolbarHorizontalWidth =
    previewVisibleActionCount * PREVIEW_ACTION_BUTTON_SIZE +
    PREVIEW_ACTION_GRABBER_SIZE +
    Math.max(0, previewToolbarItemCount - 1) * PREVIEW_ACTION_HORIZONTAL_GAP +
    PREVIEW_ACTION_TOOLBAR_PADDING * 2;
  const previewToolbarCrossSize = PREVIEW_ACTION_BUTTON_SIZE + PREVIEW_ACTION_TOOLBAR_PADDING * 2;
  const previewHasRoomForBelowToolbar =
    previewAvailableOuterHeight - previewSurfaceHeight >= previewToolbarCrossSize + 14 &&
    previewToolbarHorizontalWidth <= previewSurfaceWidth;
  const previewAutoToolbarOrientation: PreviewToolbarOrientation =
    previewHasRoomForBelowToolbar ? "horizontal" : "vertical";
  const previewToolbarOrientation = previewToolbarOrientationOverride ?? previewAutoToolbarOrientation;
  const previewToolbarHostWidth =
    previewToolbarOrientation === "horizontal"
      ? previewToolbarHorizontalWidth
      : previewToolbarCrossSize;
  const previewToolbarMenuWidth = Math.min(
    330,
    Math.max(236, previewToolbarHostWidth - (previewToolbarOrientation === "horizontal" ? 16 : 64)),
  );
  const previewToolbarMenuAnchorStyle =
    previewToolbarOrientation === "horizontal"
      ? {
          right: 0,
          bottom: previewToolbarCrossSize + 10,
        }
      : {
          right: previewToolbarCrossSize + 10,
          bottom: 0,
        };
  const previewFixedToolbarRight = Math.max(
    12,
    (width - previewSurfaceWidth) / 2 - previewToolbarCrossSize - 10,
  );
  const previewFixedToolbarBottom = keyboardVisible
    ? 16
    : BOTTOM_TAB_BAR_HEIGHT + mobileBrowserBottomInset + PREVIEW_ACTION_TOOLBAR_EDGE_MARGIN;
  const previewToolbarViewportHeight =
    Platform.OS === "web" && typeof window !== "undefined"
      ? Math.max(
          height,
          Math.round(window.visualViewport?.height ?? 0),
          Math.round(window.innerHeight || 0),
        )
      : height;
  const previewToolbarWidth =
    previewToolbarOrientation === "horizontal" ? previewToolbarHorizontalWidth : previewToolbarCrossSize;
  const previewToolbarHeight =
    previewToolbarOrientation === "horizontal"
      ? previewToolbarCrossSize
      : previewVisibleActionCount * PREVIEW_ACTION_BUTTON_SIZE +
        PREVIEW_ACTION_GRABBER_SIZE +
        Math.max(0, previewToolbarItemCount - 1) * PREVIEW_ACTION_BUTTON_GAP +
        PREVIEW_ACTION_TOOLBAR_PADDING * 2;
  const previewDefaultToolbarPosition: PreviewToolbarPosition =
    previewToolbarOrientation === "horizontal"
      ? {
          x: (width - previewToolbarWidth) / 2,
          y: previewToolbarViewportHeight - previewFixedToolbarBottom - previewToolbarHeight,
        }
      : {
          x: width - previewFixedToolbarRight - previewToolbarWidth,
          y: previewToolbarViewportHeight - previewFixedToolbarBottom - previewToolbarHeight,
        };
  const clampPreviewToolbarPosition = useCallback(
    (position: PreviewToolbarPosition): PreviewToolbarPosition => {
      const margin = PREVIEW_ACTION_TOOLBAR_EDGE_MARGIN;
      const bottomMargin = keyboardVisible
        ? PREVIEW_ACTION_TOOLBAR_EDGE_MARGIN
        : BOTTOM_TAB_BAR_HEIGHT + mobileBrowserBottomInset + PREVIEW_ACTION_TOOLBAR_EDGE_MARGIN;
      const maxX = Math.max(margin, width - previewToolbarWidth - margin);
      const maxY = Math.max(margin, previewToolbarViewportHeight - previewToolbarHeight - bottomMargin);

      return {
        x: Math.min(maxX, Math.max(margin, position.x)),
        y: Math.min(maxY, Math.max(margin, position.y)),
      };
    },
    [
      keyboardVisible,
      mobileBrowserBottomInset,
      previewToolbarHeight,
      previewToolbarViewportHeight,
      previewToolbarWidth,
      width,
    ],
  );
  const resolvedPreviewToolbarPosition = clampPreviewToolbarPosition(
    previewToolbarPosition ?? previewDefaultToolbarPosition,
  );
  const previewToolbarFrameMenuLayout = useMemo(() => {
    const edge = PREVIEW_ACTION_TOOLBAR_EDGE_MARGIN;
    const gap = PREVIEW_ACTION_TOOLBAR_MENU_GAP;
    const bottomInset = keyboardVisible
      ? edge
      : BOTTOM_TAB_BAR_HEIGHT + mobileBrowserBottomInset + edge;
    const usableLeft = edge;
    const usableRight = Math.max(usableLeft, width - edge);
    const usableTop = edge;
    const usableBottom = Math.max(
      usableTop,
      previewToolbarViewportHeight - bottomInset,
    );
    const toolbarLeft = resolvedPreviewToolbarPosition.x;
    const toolbarTop = resolvedPreviewToolbarPosition.y;
    const toolbarRight = toolbarLeft + previewToolbarWidth;
    const toolbarBottom = toolbarTop + previewToolbarHeight;
    const toolbarCenterX = toolbarLeft + previewToolbarWidth / 2;
    const toolbarCenterY = toolbarTop + previewToolbarHeight / 2;
    const viewportMenuWidth = Math.max(0, usableRight - usableLeft);
    const preferredMenuWidth = Math.min(FRAME_STYLE_MENU_BASE_WIDTH, viewportMenuWidth);
    const minMenuWidth = Math.min(236, preferredMenuWidth);
    const leftSpace = Math.max(0, toolbarLeft - usableLeft - gap);
    const rightSpace = Math.max(0, usableRight - toolbarRight - gap);
    const preferSideMenu = previewToolbarOrientation === "vertical";
    const openLeft = leftSpace >= rightSpace;
    const sideSpace = openLeft ? leftSpace : rightSpace;
    const fallbackSideSpace = openLeft ? rightSpace : leftSpace;
    const sideWidth = Math.max(sideSpace, fallbackSideSpace);
    const menuWidth = preferSideMenu && sideWidth > 0
      ? Math.min(preferredMenuWidth, Math.max(minMenuWidth, sideWidth))
      : preferredMenuWidth;
    const useLeftSide = preferSideMenu
      ? leftSpace >= menuWidth || (leftSpace >= rightSpace && rightSpace < menuWidth)
      : false;
    const useRightSide = preferSideMenu && !useLeftSide && rightSpace >= menuWidth;
    const left = useLeftSide
      ? toolbarLeft - gap - menuWidth
      : useRightSide
        ? toolbarRight + gap
        : clamp(toolbarCenterX - menuWidth / 2, usableLeft, usableRight - menuWidth);
    const spaceAbove = Math.max(0, toolbarTop - usableTop - gap);
    const spaceBelow = Math.max(0, usableBottom - toolbarBottom - gap);
    const verticalSpace = previewToolbarOrientation === "horizontal"
      ? Math.max(spaceAbove, spaceBelow)
      : Math.max(0, usableBottom - usableTop);
    const maxAvailableHeight = Math.max(0, usableBottom - usableTop);
    const maxHeight = Math.min(432, Math.max(188, verticalSpace), maxAvailableHeight);
    const top = previewToolbarOrientation === "horizontal"
      ? spaceAbove >= spaceBelow
        ? toolbarTop - gap - maxHeight
        : toolbarBottom + gap
      : clamp(toolbarCenterY - maxHeight / 2, usableTop, usableBottom - maxHeight);

    return {
      left: clamp(left, usableLeft, usableRight - menuWidth),
      top: clamp(top, usableTop, usableBottom - maxHeight),
      width: menuWidth,
      maxHeight,
    };
  }, [
    keyboardVisible,
    mobileBrowserBottomInset,
    previewToolbarHeight,
    previewToolbarOrientation,
    previewToolbarViewportHeight,
    previewToolbarWidth,
    resolvedPreviewToolbarPosition.x,
    resolvedPreviewToolbarPosition.y,
    width,
  ]);
  const previewToolbarFrameMenuRelativeStyle = {
    position: "absolute" as const,
    left: previewToolbarFrameMenuLayout.left - resolvedPreviewToolbarPosition.x,
    top: previewToolbarFrameMenuLayout.top - resolvedPreviewToolbarPosition.y,
    width: previewToolbarFrameMenuLayout.width,
  };

  const beginPreviewToolbarDrag = useCallback(() => {
    const dragStart = previewToolbarPositionRef.current ?? resolvedPreviewToolbarPosition;
    const grabberOffset =
      previewToolbarOrientation === "horizontal"
        ? {
            x: PREVIEW_ACTION_TOOLBAR_PADDING + PREVIEW_ACTION_GRABBER_SIZE / 2,
            y: previewToolbarCrossSize / 2,
          }
        : {
            x: previewToolbarCrossSize / 2,
            y: PREVIEW_ACTION_TOOLBAR_PADDING + PREVIEW_ACTION_GRABBER_SIZE / 2,
          };

    previewToolbarDragStartRef.current = dragStart;
    previewToolbarDragStartGrabberAnchorRef.current = {
      x: dragStart.x + grabberOffset.x,
      y: dragStart.y + grabberOffset.y,
    };
  }, [previewToolbarCrossSize, previewToolbarOrientation, resolvedPreviewToolbarPosition]);

  const getToolbarSizeForOrientation = useCallback(
    (orientation: PreviewToolbarOrientation) => {
      const nextWidth =
        orientation === "horizontal" ? previewToolbarHorizontalWidth : previewToolbarCrossSize;
      const nextHeight =
        orientation === "horizontal"
          ? previewToolbarCrossSize
          : previewVisibleActionCount * PREVIEW_ACTION_BUTTON_SIZE +
            PREVIEW_ACTION_GRABBER_SIZE +
            Math.max(0, previewToolbarItemCount - 1) * PREVIEW_ACTION_BUTTON_GAP +
            PREVIEW_ACTION_TOOLBAR_PADDING * 2;

      return { width: nextWidth, height: nextHeight };
    },
    [
      previewToolbarCrossSize,
      previewToolbarHorizontalWidth,
      previewToolbarItemCount,
      previewVisibleActionCount,
    ],
  );

  const getGrabberOffsetForOrientation = useCallback(
    (orientation: PreviewToolbarOrientation): PreviewToolbarPosition =>
      orientation === "horizontal"
        ? {
            x: PREVIEW_ACTION_TOOLBAR_PADDING + PREVIEW_ACTION_GRABBER_SIZE / 2,
            y: previewToolbarCrossSize / 2,
          }
        : {
            x: previewToolbarCrossSize / 2,
            y: PREVIEW_ACTION_TOOLBAR_PADDING + PREVIEW_ACTION_GRABBER_SIZE / 2,
          },
    [previewToolbarCrossSize],
  );

  const getPositionForToolbarAnchor = useCallback(
    (
      anchor: PreviewToolbarPosition,
      orientation: PreviewToolbarOrientation,
      size: { width: number; height: number },
    ): PreviewToolbarPosition => {
      const margin = PREVIEW_ACTION_TOOLBAR_EDGE_MARGIN;
      const bottomMargin = keyboardVisible
        ? PREVIEW_ACTION_TOOLBAR_EDGE_MARGIN
        : BOTTOM_TAB_BAR_HEIGHT + mobileBrowserBottomInset + PREVIEW_ACTION_TOOLBAR_EDGE_MARGIN;
      const grabberOffset = getGrabberOffsetForOrientation(orientation);

      return {
        x: Math.min(
          Math.max(margin, width - size.width - margin),
          Math.max(margin, anchor.x - grabberOffset.x),
        ),
        y: Math.min(
          Math.max(margin, previewToolbarViewportHeight - size.height - bottomMargin),
          Math.max(margin, anchor.y - grabberOffset.y),
        ),
      };
    },
    [getGrabberOffsetForOrientation, keyboardVisible, mobileBrowserBottomInset, previewToolbarViewportHeight, width],
  );

  const getDockOrientationForToolbarPosition = useCallback(
    (center: PreviewToolbarPosition): PreviewToolbarOrientation => {
      const centerX = center.x;
      const centerY = center.y;
      const nearestHorizontalEdge = Math.min(centerY, previewToolbarViewportHeight - centerY);
      const nearestVerticalEdge = Math.min(centerX, width - centerX);

      return nearestHorizontalEdge <= nearestVerticalEdge ? "horizontal" : "vertical";
    },
    [previewToolbarViewportHeight, width],
  );

  const updatePreviewToolbarDrag = useCallback(
    (translationX: number, translationY: number) => {
      const dragStart = previewToolbarDragStartRef.current ?? resolvedPreviewToolbarPosition;
      const fallbackGrabberOffset = getGrabberOffsetForOrientation(previewToolbarOrientation);
      const dragStartAnchor = previewToolbarDragStartGrabberAnchorRef.current ?? {
        x: dragStart.x + fallbackGrabberOffset.x,
        y: dragStart.y + fallbackGrabberOffset.y,
      };
      const nextAnchor = {
        x: dragStartAnchor.x + translationX,
        y: dragStartAnchor.y + translationY,
      };
      const nextOrientation = getDockOrientationForToolbarPosition(nextAnchor);
      const nextSize = getToolbarSizeForOrientation(nextOrientation);
      const nextPosition = getPositionForToolbarAnchor(nextAnchor, nextOrientation, nextSize);

      if (nextOrientation !== previewToolbarOrientation) {
        setPreviewToolbarOrientationOverride(nextOrientation);
      }

      previewToolbarPositionRef.current = nextPosition;
      setPreviewToolbarPosition(nextPosition);
    },
    [
      getDockOrientationForToolbarPosition,
      getGrabberOffsetForOrientation,
      getPositionForToolbarAnchor,
      getToolbarSizeForOrientation,
      previewToolbarOrientation,
      resolvedPreviewToolbarPosition,
    ],
  );

  const commitPreviewToolbarDrag = useCallback(() => {
    if (!previewToolbarDragStartRef.current) {
      return;
    }

    const currentPosition = previewToolbarPositionRef.current ?? resolvedPreviewToolbarPosition;
    const currentGrabberOffset = getGrabberOffsetForOrientation(previewToolbarOrientation);
    const currentAnchor = {
      x: currentPosition.x + currentGrabberOffset.x,
      y: currentPosition.y + currentGrabberOffset.y,
    };
    const nextOrientation = getDockOrientationForToolbarPosition(currentAnchor);
    const nextSize = getToolbarSizeForOrientation(nextOrientation);
    const nextPosition =
      nextOrientation === previewToolbarOrientation
        ? currentPosition
        : getPositionForToolbarAnchor(currentAnchor, nextOrientation, nextSize);

    previewToolbarDragStartRef.current = null;
    previewToolbarDragStartGrabberAnchorRef.current = null;
    setPreviewToolbarOrientationOverride(nextOrientation);
    previewToolbarPositionRef.current = nextPosition;
    setPreviewToolbarPosition(nextPosition);
    void storePreviewToolbarOrientation(nextOrientation);
    void storePreviewToolbarPosition(nextPosition);
  }, [
    getDockOrientationForToolbarPosition,
    getGrabberOffsetForOrientation,
    getPositionForToolbarAnchor,
    getToolbarSizeForOrientation,
    previewToolbarOrientation,
    resolvedPreviewToolbarPosition,
  ]);

  const togglePreviewToolbarCollapsed = useCallback(() => {
    setPreviewToolbarCollapsed((current) => {
      const nextCollapsed = !current;

      if (nextCollapsed) {
        setCardActionMenuOpen(false);
        setEditMenuOpen(false);
        setShareMenuOpen(false);
      }

      return nextCollapsed;
    });
  }, []);

  const previewToolbarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 0.82 + previewToolbarTransition.value * 0.18,
    transform: [
      { scale: 0.96 + previewToolbarTransition.value * 0.04 },
    ],
  }));

  useEffect(() => {
    previewToolbarTransition.value = 0;
    previewToolbarTransition.value = withTiming(1, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [previewToolbarCollapsed, previewToolbarOrientation, previewToolbarTransition]);

  const previewToolbarGesture = useMemo(() => {
    const doubleTapGesture = Gesture.Tap()
      .numberOfTaps(2)
      .maxDuration(260)
      .onEnd((_event, success) => {
        if (success) {
          runOnJS(togglePreviewToolbarCollapsed)();
        }
      });
    const dragGesture = Gesture.Pan()
        .minDistance(8)
        .onStart(() => {
          runOnJS(beginPreviewToolbarDrag)();
        })
        .onUpdate((event) => {
          runOnJS(updatePreviewToolbarDrag)(event.translationX, event.translationY);
        })
        .onEnd(() => {
          runOnJS(commitPreviewToolbarDrag)();
        })
        .onFinalize(() => {
          runOnJS(commitPreviewToolbarDrag)();
        });

    return Gesture.Exclusive(doubleTapGesture, dragGesture);
  }, [
    beginPreviewToolbarDrag,
    commitPreviewToolbarDrag,
    togglePreviewToolbarCollapsed,
    updatePreviewToolbarDrag,
  ]);

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
    previewToolbarPositionRef.current = previewToolbarPosition;
  }, [previewToolbarPosition]);

  useEffect(() => {
    if (!previewToolbarPosition) {
      return;
    }

    const clampedPosition = clampPreviewToolbarPosition(previewToolbarPosition);

    if (clampedPosition.x === previewToolbarPosition.x && clampedPosition.y === previewToolbarPosition.y) {
      return;
    }

    previewToolbarPositionRef.current = clampedPosition;
    setPreviewToolbarPosition(clampedPosition);
    void storePreviewToolbarPosition(clampedPosition);
  }, [clampPreviewToolbarPosition, previewToolbarPosition]);

  useEffect(() => {
    let cancelled = false;

    loadStoredPreviewToolbarPosition().then((storedPosition) => {
      if (cancelled || !storedPosition) {
        return;
      }

      const clampedPosition = clampPreviewToolbarPosition(storedPosition);

      previewToolbarPositionRef.current = clampedPosition;
      setPreviewToolbarPosition(clampedPosition);
    });

    return () => {
      cancelled = true;
    };
  }, [clampPreviewToolbarPosition]);

  useEffect(() => {
    let cancelled = false;

    loadStoredPreviewToolbarOrientation().then((storedOrientation) => {
      if (!cancelled && storedOrientation) {
        setPreviewToolbarOrientationOverride(storedOrientation);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

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

        logStorageInfo("Applying hydrated saved sets to editor state.", getCardSetStorageSummary(normalizedSets));
        setCardSets(normalizedSets);
        setSelectedSetId((current) =>
          normalizedSets.some((set) => set.id === current) ? current : normalizedSets[0].id,
        );
      } else {
        logStorageInfo("Using default in-memory saved sets after hydration.");
      }

      setSetsHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadStoredDeletionTombstones().then((storedTombstones) => {
      if (cancelled) {
        return;
      }

      const normalizedTombstones = normalizeDeletionTombstones(storedTombstones);
      deletionTombstonesRef.current = normalizedTombstones;
      setDeletionTombstones(normalizedTombstones);
      setDeletionTombstonesHydrated(true);
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

    loadStoredGeneratedSetSymbols().then((storedEntries) => {
      if (cancelled) {
        return;
      }

      if (storedEntries) {
        setGeneratedSetSymbols(storedEntries);
      }

      setGeneratedSetSymbolsHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadStoredCustomCardBacks().then((storedEntries) => {
      if (cancelled) {
        return;
      }

      if (storedEntries) {
        setCustomCardBacks(storedEntries);
      }

      setCustomCardBacksHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadStoredUserProgress().then((storedProfile) => {
      if (cancelled) {
        return;
      }

      setUserProgress(storedProfile);
      setUserProgressHydrated(true);
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
    if (!setsHydrated || !generatedSetSymbolsHydrated) {
      return;
    }

    void storeCardSets(cardSets);
  }, [cardSets, generatedSetSymbolsHydrated, setsHydrated]);

  useEffect(() => {
    cardSetsRef.current = cardSets;
  }, [cardSets]);

  useEffect(() => {
    deletionTombstonesRef.current = deletionTombstones;
  }, [deletionTombstones]);

  useEffect(() => {
    if (!deletionTombstonesHydrated) {
      return;
    }

    void storeDeletionTombstones(deletionTombstones);
  }, [deletionTombstones, deletionTombstonesHydrated]);

  useEffect(() => {
    generatedSetSymbolsRef.current = generatedSetSymbols;
  }, [generatedSetSymbols]);

  useEffect(() => {
    if (!accountUser) {
      setAccountSetsHydrated(false);
      setCardSets((current) => {
        const localSets = getLocalPersistableCardSets(current);

        return cardSetsEqual(current, localSets) ? current : localSets;
      });
      return;
    }

    if (!setsHydrated || !deletionTombstonesHydrated) {
      return;
    }

    let active = true;

    const syncInitialAccountSets = async () => {
      setAccountSyncBusy(true);
      setAccountSetsHydrated(false);

      try {
        const [remoteSymbols, remoteSets, sharedSets] = await Promise.all([
          fetchRemoteCustomSetSymbols(accountUser.id),
          fetchRemoteCardSets(accountUser.id),
          fetchSharedAccountCardSets(accountUser.id),
        ]);

        if (!active) {
          return;
        }

        const mergedSymbols = mergeCustomSetSymbols(generatedSetSymbolsRef.current, remoteSymbols);

        if (!generatedSetSymbolEntriesEqual(generatedSetSymbolsRef.current, mergedSymbols)) {
          generatedSetSymbolsRef.current = mergedSymbols;
          setGeneratedSetSymbols(mergedSymbols);
        }

        const repairedRemoteSets = normalizeStoredCardSetsPayload(remoteSets);
        const validRemoteSets = applyDeletionTombstonesToSets(
          resolveSetSymbolReferences(repairedRemoteSets?.sets ?? [], mergedSymbols),
          deletionTombstonesRef.current,
        );

        if (repairedRemoteSets?.repaired || repairedRemoteSets?.rejectedItems) {
          logStorageWarning("Repaired Supabase account set payload before merge.", {
            sourceKind: repairedRemoteSets.sourceKind,
            rejectedItems: repairedRemoteSets.rejectedItems,
            ...getCardSetStorageSummary(validRemoteSets),
          });
        } else {
          logStorageInfo("Loaded Supabase account set payload before merge.", getCardSetStorageSummary(validRemoteSets));
        }

        const mergedOwnedSets = applyDeletionTombstonesToSets(
          resolveSetSymbolReferences(
            mergeAccountCardSets(getOwnedAccountCardSets(cardSetsRef.current, accountUser.id), validRemoteSets),
            mergedSymbols,
          ),
          deletionTombstonesRef.current,
        );
        const mergedSets = normalizeCardSets([
          ...mergedOwnedSets,
          ...resolveSetSymbolReferences(sharedSets, mergedSymbols),
        ]);

        if (!cardSetsEqual(cardSetsRef.current, mergedSets)) {
          cardSetsRef.current = mergedSets;
          setCardSets(mergedSets);
          setSelectedSetId((current) =>
            mergedSets.some((set) => set.id === current) ? current : mergedSets[0].id,
          );
        }

        await replaceRemoteCustomSetSymbols(accountUser.id, toAccountCustomSetSymbolPayloads(mergedSymbols));
        await replaceRemoteCardSets(accountUser.id, toAccountCardSetPayloads(mergedOwnedSets, accountUser.id));
      } catch (error) {
        console.warn("Unable to sync Supabase account sets.", error);
      } finally {
        if (active) {
          setAccountSetsHydrated(true);
          setAccountSyncBusy(false);
        }
      }
    };

    void syncInitialAccountSets();

    return () => {
      active = false;
    };
  }, [accountUser, deletionTombstonesHydrated, generatedSetSymbolsHydrated, setsHydrated]);

  useEffect(() => {
    if (!accountUser || !setsHydrated || !generatedSetSymbolsHydrated || !deletionTombstonesHydrated || !accountSetsHydrated) {
      return;
    }

    const persistRemoteSets = setTimeout(() => {
      void replaceRemoteCustomSetSymbols(accountUser.id, toAccountCustomSetSymbolPayloads(generatedSetSymbolsRef.current))
        .then(() => replaceRemoteCardSets(accountUser.id, toAccountCardSetPayloads(cardSetsRef.current, accountUser.id)))
        .catch((error) => {
          console.warn("Unable to persist Supabase account sets.", error);
        });
    }, 900);

    return () => {
      clearTimeout(persistRemoteSets);
    };
  }, [accountSetsHydrated, accountUser, cardSets, deletionTombstones, deletionTombstonesHydrated, generatedSetSymbols, generatedSetSymbolsHydrated, setsHydrated]);

  useEffect(() => {
    if (!accountUser) {
      setAccountProfile(null);
      return;
    }

    let active = true;

    void fetchAccountProfile(accountUser.id)
      .then((profile) => {
        if (active) {
          setAccountProfile(profile);
        }
      })
      .catch((error) => {
        if (active) {
          console.warn("Unable to load Supabase account profile.", error);
          setAccountProfile(null);
        }
      });

    return () => {
      active = false;
    };
  }, [accountUser]);

  useEffect(() => {
    if (!accountUser) {
      return;
    }

    const displayName =
      accountProfile?.username ??
      accountProfile?.displayName ??
      accountUser.user_metadata?.name ??
      accountUser.user_metadata?.full_name ??
      accountUser.email?.split("@")[0] ??
      "CardMagic Creator";

    void updateCommunityDisplayName(String(displayName)).catch((error) => {
      console.warn("Unable to update Supabase community display name.", error);
    });
  }, [accountProfile?.displayName, accountProfile?.username, accountUser]);

  useEffect(() => {
    if (!artLibraryHydrated) {
      return;
    }

    void storeArtLibrary(artLibraryEntries);
  }, [artLibraryEntries, artLibraryHydrated]);

  useEffect(() => {
    if (!generatedSetSymbolsHydrated) {
      return;
    }

    void storeGeneratedSetSymbols(generatedSetSymbols);
  }, [generatedSetSymbols, generatedSetSymbolsHydrated]);

  useEffect(() => {
    if (!customCardBacksHydrated) {
      return;
    }

    void storeCustomCardBacks(customCardBacks);
  }, [customCardBacks, customCardBacksHydrated]);

  useEffect(() => {
    if (!userProgressHydrated) {
      return;
    }

    void storeUserProgress(userProgress);
  }, [userProgress, userProgressHydrated]);

  useEffect(() => {
    setPreviewRotated(false);
  }, [card.typeFrame]);

  useEffect(() => {
    if (hasBackFace) {
      setPhysicalBackVisible(false);
    }
  }, [hasBackFace]);

  useEffect(() => {
    userProgressRef.current = userProgress;
  }, [userProgress]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    const supabaseClient = supabase;
    let active = true;

    const hydrateSession = async () => {
      const { data, error } = await supabaseClient.auth.getSession();

      if (!active) {
        return;
      }

      if (error) {
        console.warn("Unable to load Supabase auth session.", error);
        return;
      }

      setAccountUser(data.session?.user ?? null);
    };

    void hydrateSession();

    const { data: subscription } = supabaseClient.auth.onAuthStateChange((_event, session: Session | null) => {
      setAccountUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!accountUser || !userProgressHydrated) {
      return;
    }

    let active = true;

    const syncInitialAccountProgress = async () => {
      setAccountSyncBusy(true);

      try {
        const remoteProgress = await fetchRemoteUserProgress(accountUser.id);

        if (!active) {
          return;
        }

        if (!remoteProgress) {
          void updateRemoteUserProgress(userProgressRef.current).catch((error) => {
            console.warn("Unable to initialize Supabase account progress.", error);
          });
          return;
        }

        const remoteNormalizedProgress = normalizeUserProgressProfile(remoteProgress);
        const nextProgress = getNewestUserProgressProfile(userProgressRef.current, remoteNormalizedProgress);
        userProgressRef.current = nextProgress;
        setUserProgress(nextProgress);

        if (!userProgressProfilesEqual(nextProgress, remoteNormalizedProgress)) {
          void updateRemoteUserProgress(nextProgress).catch((error) => {
            console.warn("Unable to repair stale Supabase account progress.", error);
          });
        }
      } catch (error) {
        console.warn("Unable to sync Supabase account progress.", error);
      } finally {
        if (active) {
          setAccountSyncBusy(false);
        }
      }
    };

    void syncInitialAccountProgress();

    return () => {
      active = false;
    };
  }, [accountUser, userProgressHydrated]);

  useEffect(() => {
    if (achievementPopups.length === 0) {
      return;
    }

    const dismissTimers = achievementPopups.map((popup) =>
      setTimeout(() => {
        setAchievementPopups((current) =>
          current.filter((candidate) => candidate.popupId !== popup.popupId),
        );
      }, 4200),
    );

    return () => {
      dismissTimers.forEach(clearTimeout);
    };
  }, [achievementPopups]);

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

  const enqueueAchievementPopups = (achievements: AchievementDefinition[]) => {
    if (achievements.length === 0) {
      return;
    }

    const createdAt = Date.now();
    const nextPopups = achievements.map((achievement, index) => ({
      ...achievement,
      popupId: `${achievement.id}-${createdAt}-${index}`,
    }));

    setAchievementPopups((current) => [...current, ...nextPopups].slice(-3));
  };

  const enqueueXpFloatingNumber = (xp: number) => {
    if (xp <= 0) {
      return;
    }

    const createdAt = Date.now();
    const color = XP_FLOAT_COLORS[Math.floor(Math.random() * XP_FLOAT_COLORS.length)] ?? XP_FLOAT_COLORS[0];

    setXpFloatingNumbers((current) => [
      ...current,
      {
        id: `xp-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
        xp,
        color,
        offsetPercent: 8 + Math.random() * 70,
        skewDeg: -14 + Math.random() * 28,
      },
    ].slice(-5));
  };

  const enqueueLevelUpToast = (level: number, creditReward: number) => {
    setLevelUpToasts((current) => [
      ...current,
      {
        id: `level-${level}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        level,
        creditReward,
      },
    ].slice(-3));
  };

  const applyUserProgressMutation = (
    mutateProfile: (current: UserProgressProfile) => ProgressMutationResult,
  ) => {
    const previousProfile = userProgressRef.current;
    const previousLevel = getXpLevelState(previousProfile).level;
    const result = mutateProfile(previousProfile);
    const nextLevel = getXpLevelState(result.profile).level;
    const xpGained = Math.max(0, result.profile.lifetimeXpEarned - previousProfile.lifetimeXpEarned);
    const creditReward = Math.max(0, result.profile.lifetimeLevelCreditsEarned - previousProfile.lifetimeLevelCreditsEarned);

    userProgressRef.current = result.profile;
    setUserProgress(result.profile);
    if (accountUser) {
      void updateRemoteUserProgress(result.profile).catch((error) => {
        console.warn("Unable to persist Supabase account progress.", error);
      });
    }
    enqueueXpFloatingNumber(xpGained);
    if (nextLevel > previousLevel) {
      enqueueLevelUpToast(nextLevel, creditReward);
    }
    enqueueAchievementPopups(result.unlockedAchievements);
  };

  const applyAuthoritativeAiProgress = (progress: unknown) => {
    if (!progress) {
      return false;
    }

    const previousProfile = userProgressRef.current;
    const previousLevel = getXpLevelState(previousProfile).level;
    const nextProfile = normalizeUserProgressProfile(progress);
    const nextLevel = getXpLevelState(nextProfile).level;
    const xpGained = Math.max(0, nextProfile.lifetimeXpEarned - previousProfile.lifetimeXpEarned);
    const creditReward = Math.max(
      0,
      nextProfile.lifetimeLevelCreditsEarned - previousProfile.lifetimeLevelCreditsEarned,
    );

    userProgressRef.current = nextProfile;
    setUserProgress(nextProfile);
    enqueueXpFloatingNumber(xpGained);
    if (nextLevel > previousLevel) {
      enqueueLevelUpToast(nextLevel, creditReward);
    }

    return true;
  };

  const dismissAchievementPopup = useCallback((popupId: string) => {
    setAchievementPopups((current) => current.filter((popup) => popup.popupId !== popupId));
  }, []);

  const dismissXpFloatingNumber = useCallback((id: string) => {
    setXpFloatingNumbers((current) => current.filter((number) => number.id !== id));
  }, []);

  const dismissLevelUpToast = useCallback((id: string) => {
    setLevelUpToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showExportConfirmationToast = useCallback((result: Extract<WebFileActionResult, "shared" | "saved" | "opened">) => {
    setExportConfirmationToast({
      id: `export-confirmation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message:
        result === "shared"
          ? "Card photo shared"
          : result === "opened"
            ? "Card photo opened"
            : "Card photo saved",
    });
  }, []);

  const dismissExportConfirmationToast = useCallback((id: string) => {
    setExportConfirmationToast((current) => (current?.id === id ? null : current));
  }, []);

  const dismissDeleteUndo = useCallback((id: string) => {
    setDeleteUndo((current) => (current?.id === id ? null : current));
  }, []);

  const persistAccountSetsNow = useCallback(
    (nextSets: CardSet[]) => {
      const normalizedSets = normalizeCardSets(nextSets);

      cardSetsRef.current = normalizedSets;
      void storeCardSets(normalizedSets);

      if (!accountUser || !accountSetsHydrated) {
        return;
      }

      void replaceRemoteCustomSetSymbols(accountUser.id, toAccountCustomSetSymbolPayloads(generatedSetSymbolsRef.current))
        .then(() => replaceRemoteCardSets(accountUser.id, toAccountCardSetPayloads(normalizedSets, accountUser.id)))
        .catch((error) => {
          console.warn("Unable to persist Supabase account sets immediately after local edit.", error);
        });
    },
    [accountSetsHydrated, accountUser],
  );

  const persistDeletionTombstonesNow = useCallback((nextTombstones: DeletionTombstones) => {
    const normalizedTombstones = normalizeDeletionTombstones(nextTombstones);

    deletionTombstonesRef.current = normalizedTombstones;
    void storeDeletionTombstones(normalizedTombstones);
  }, []);

  const showLoginSuccessToast = useCallback(() => {
    setAccountOpen(false);
    setAuthToast({
      id: `auth-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message: "Logged in successfully.",
    });

    void (async () => {
      const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
      const userId = data.user?.id ?? accountUser?.id ?? null;
      const alreadyShown = await loadEarlyAccessCodePromptShown(userId);

      if (alreadyShown) {
        return;
      }

      await storeEarlyAccessCodePromptShown();
      setEarlyAccessCodeOpen(true);
    })();
  }, [accountUser?.id]);

  const closeEarlyAccessCodePrompt = useCallback(() => {
    setEarlyAccessCodeOpen(false);
    void storeEarlyAccessCodePromptShown();
  }, []);

  const dismissAuthToast = useCallback((id: string) => {
    setAuthToast((current) => (current?.id === id ? null : current));
  }, []);

  const recordAccountCreditLedgerEntry = useCallback(
    ({
      amount,
      type,
      source,
      referenceId,
      balanceAfter,
      metadata,
    }: {
      amount: number;
      type: CreditTransactionType;
      source?: string;
      referenceId?: string;
      balanceAfter: number;
      metadata?: Record<string, unknown>;
    }) => {
      if (!accountUser || amount === 0) {
        return;
      }

      void recordCreditTransaction({
        amount,
        type,
        source,
        referenceId,
        balanceAfter,
        metadata,
      }).catch((error) => {
        console.warn("Unable to record Supabase credit transaction.", error);
      });
    },
    [accountUser],
  );

  const recordProgressEvent = (eventType: ProgressEventType) => {
    applyUserProgressMutation((current) => applyProgressEvent(current, eventType));
  };

  const recordSuccessfulCreditSpendAndEvent = (category: CreditSpendCategory, eventType: ProgressEventType) => {
    const ledgerEntries: Array<{ amount: number; type: CreditTransactionType; source: string; balanceAfter: number; metadata?: Record<string, unknown> }> = [];

    applyUserProgressMutation((current) => {
      const spendResult = spendProgressCredits(current, category);

      if (!spendResult.ok) {
        return {
          profile: current,
          unlockedAchievements: [],
        };
      }

      const eventResult = applyProgressEvent(spendResult.profile, eventType);
      const levelReward = Math.max(0, eventResult.profile.lifetimeLevelCreditsEarned - current.lifetimeLevelCreditsEarned);

      ledgerEntries.push({
        amount: -spendResult.cost,
        type: "spend",
        source: category,
        balanceAfter: eventResult.profile.credits,
        metadata: { eventType },
      });

      if (levelReward > 0) {
        ledgerEntries.push({
          amount: levelReward,
          type: "level_reward",
          source: eventType,
          balanceAfter: eventResult.profile.credits,
          metadata: { spendCategory: category },
        });
      }

      return {
        profile: eventResult.profile,
        unlockedAchievements: [
          ...spendResult.unlockedAchievements,
          ...eventResult.unlockedAchievements,
        ],
      };
    });

    for (const ledgerEntry of ledgerEntries) {
      recordAccountCreditLedgerEntry({
        amount: ledgerEntry.amount,
        type: ledgerEntry.type,
        source: ledgerEntry.source,
        balanceAfter: ledgerEntry.balanceAfter,
        metadata: ledgerEntry.metadata,
      });
    }
  };

  const recordSuccessfulCreditSpend = (category: CreditSpendCategory) => {
    const ledgerEntries: Array<{ amount: number; type: CreditTransactionType; source: string; balanceAfter: number }> = [];

    applyUserProgressMutation((current) => {
      const spendResult = spendProgressCredits(current, category);

      if (!spendResult.ok) {
        return {
          profile: current,
          unlockedAchievements: [],
        };
      }

      const levelReward = Math.max(0, spendResult.profile.lifetimeLevelCreditsEarned - current.lifetimeLevelCreditsEarned);

      ledgerEntries.push({
        amount: -spendResult.cost,
        type: "spend",
        source: category,
        balanceAfter: spendResult.profile.credits,
      });

      if (levelReward > 0) {
        ledgerEntries.push({
          amount: levelReward,
          type: "level_reward",
          source: category,
          balanceAfter: spendResult.profile.credits,
        });
      }

      return {
        profile: spendResult.profile,
        unlockedAchievements: spendResult.unlockedAchievements,
      };
    });

    for (const ledgerEntry of ledgerEntries) {
      recordAccountCreditLedgerEntry({
        amount: ledgerEntry.amount,
        type: ledgerEntry.type,
        source: ledgerEntry.source,
        balanceAfter: ledgerEntry.balanceAfter,
      });
    }
  };

  const syncRemoteUserProgress = useCallback(
    async () => {
      if (!accountUser) {
        return;
      }

      setAccountSyncBusy(true);

      try {
        const [remoteProgress, remoteSymbols, remoteSets, sharedSets] = await Promise.all([
          fetchRemoteUserProgress(accountUser.id),
          fetchRemoteCustomSetSymbols(accountUser.id),
          fetchRemoteCardSets(accountUser.id),
          fetchSharedAccountCardSets(accountUser.id),
        ]);

        if (remoteProgress) {
          const remoteNormalizedProgress = normalizeUserProgressProfile(remoteProgress);
          const nextProgress = getNewestUserProgressProfile(userProgressRef.current, remoteNormalizedProgress);

          userProgressRef.current = nextProgress;
          setUserProgress(nextProgress);

          if (!userProgressProfilesEqual(nextProgress, remoteNormalizedProgress)) {
            void updateRemoteUserProgress(nextProgress).catch((error) => {
              console.warn("Unable to repair stale Supabase account progress during manual sync.", error);
            });
          }
        } else {
          void updateRemoteUserProgress(userProgressRef.current).catch((error) => {
            console.warn("Unable to initialize Supabase account progress during manual sync.", error);
          });
        }

        const mergedSymbols = mergeCustomSetSymbols(generatedSetSymbolsRef.current, remoteSymbols);

        generatedSetSymbolsRef.current = mergedSymbols;
        setGeneratedSetSymbols(mergedSymbols);

        const repairedRemoteSets = normalizeStoredCardSetsPayload(remoteSets);
        const validRemoteSets = applyDeletionTombstonesToSets(
          resolveSetSymbolReferences(repairedRemoteSets?.sets ?? [], mergedSymbols),
          deletionTombstonesRef.current,
        );

        if (repairedRemoteSets?.repaired || repairedRemoteSets?.rejectedItems) {
          logStorageWarning("Repaired Supabase account set payload before manual sync.", {
            sourceKind: repairedRemoteSets.sourceKind,
            rejectedItems: repairedRemoteSets.rejectedItems,
            ...getCardSetStorageSummary(validRemoteSets),
          });
        } else {
          logStorageInfo("Loaded Supabase account set payload before manual sync.", getCardSetStorageSummary(validRemoteSets));
        }

        const mergedOwnedSets = applyDeletionTombstonesToSets(
          resolveSetSymbolReferences(
            mergeAccountCardSets(getOwnedAccountCardSets(cardSetsRef.current, accountUser.id), validRemoteSets),
            mergedSymbols,
          ),
          deletionTombstonesRef.current,
        );
        const mergedSets = normalizeCardSets([
          ...mergedOwnedSets,
          ...resolveSetSymbolReferences(sharedSets, mergedSymbols),
        ]);

        cardSetsRef.current = mergedSets;
        setCardSets(mergedSets);
        setSelectedSetId((current) =>
          mergedSets.some((set) => set.id === current) ? current : mergedSets[0].id,
        );
        await replaceRemoteCustomSetSymbols(accountUser.id, toAccountCustomSetSymbolPayloads(mergedSymbols));
        await replaceRemoteCardSets(accountUser.id, toAccountCardSetPayloads(mergedOwnedSets, accountUser.id));
      } catch (error) {
        Alert.alert("Account sync failed", error instanceof Error ? error.message : "Unable to sync your account.");
      } finally {
        setAccountSyncBusy(false);
      }
    },
    [accountUser],
  );

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined" || !accountUser) {
      return;
    }

    const currentUrl = new URL(window.location.href);
    const checkoutState = currentUrl.searchParams.get("checkout");

    if (checkoutState !== "success") {
      return;
    }

    currentUrl.searchParams.delete("checkout");
    window.history.replaceState({}, "", currentUrl.toString());
    void syncRemoteUserProgress();
  }, [accountUser, syncRemoteUserProgress]);

  const openAccount = () => {
    setEditMenuOpen(false);
    setCardActionMenuOpen(false);
    setShareMenuOpen(false);
    setPhysicalBackMenuOpen(false);
    setArtSourceOpen(false);
    setArtGeneratorOpen(false);
    setSetSymbolGeneratorOpen(false);
    setAchievementsOpen(false);
    setCreditStoreOpen(false);
    setAccountOpen(true);
  };

  const openCreditStore = () => {
    setEditMenuOpen(false);
    setCardActionMenuOpen(false);
    setShareMenuOpen(false);
    setPhysicalBackMenuOpen(false);
    setArtSourceOpen(false);
    setArtGeneratorOpen(false);
    setSetSymbolGeneratorOpen(false);
    setAchievementsOpen(false);
    setCreditStoreOpen(true);
  };

  const openAchievements = () => {
    setEditMenuOpen(false);
    setCardActionMenuOpen(false);
    setShareMenuOpen(false);
    setPhysicalBackMenuOpen(false);
    setSetSymbolGeneratorOpen(false);
    setCreditStoreOpen(false);
    setAchievementsOpen(true);
  };

  const startCheckout = async (productId: CheckoutProductId) => {
    setCheckoutErrorMessage(null);

    if (!isSupabaseConfigured) {
      const message = "Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY first.";
      setCheckoutErrorMessage(message);
      Alert.alert("Supabase is not configured", message);
      return;
    }

    if (!accountUser) {
      setCreditStoreOpen(false);
      setAccountOpen(true);
      return;
    }

    const checkoutPopup = createPendingStripeCheckoutPopup();

    setCheckoutBusyProductId(productId);

    try {
      await syncRemoteUserProgress();
      const checkoutUrl = await createStripeCheckoutUrl(productId);
      await openStripeCheckoutUrl(checkoutUrl, checkoutPopup);
    } catch (error) {
      if (checkoutPopup && !checkoutPopup.closed) {
        checkoutPopup.close();
      }
      const message = error instanceof Error ? error.message : "Unable to start Stripe Checkout.";
      setCheckoutErrorMessage(message);
      Alert.alert("Checkout failed", message);
    } finally {
      setCheckoutBusyProductId(null);
    }
  };

  const buyStoreCreditPack = (packId: CreditPackId) => {
    void startCheckout(packId);
  };

  const subscribeToMonthlyCredits = () => {
    void startCheckout("monthly");
  };

  const redeemCreditCode = async (code: string) => {
    if (!accountUser) {
      openAccount();
      return {
        ok: false,
        message: "Create an account or sign in to redeem credit codes.",
      };
    }

    const normalizedCode = normalizeCreditCode(code);

    if (!normalizedCode) {
      return {
        ok: false,
        message: "Enter a credit code.",
      };
    }

    const creditAmount = PROMOTIONAL_CREDIT_CODES[normalizedCode];

    if (!creditAmount) {
      return {
        ok: false,
        message: "That code is not active.",
      };
    }

    const redeemedCodes = await loadRedeemedCreditCodes();

    if (redeemedCodes.has(normalizedCode)) {
      return {
        ok: false,
        message: "That code has already been redeemed on this device.",
      };
    }

    try {
      if (await hasRedeemedPromotionalCreditCode(accountUser.id, normalizedCode)) {
        redeemedCodes.add(normalizedCode);
        await storeRedeemedCreditCodes(redeemedCodes);
        await storeEarlyAccessCodePromptShown();

        return {
          ok: false,
          message: "That code has already been redeemed on this account.",
        };
      }
    } catch (error) {
      console.warn("Unable to check Supabase credit code redemption state.", error);
    }

    const previousCredits = userProgressRef.current.credits;
    applyUserProgressMutation((current) => grantPromotionalCredits(current, creditAmount));
    try {
      await recordCreditTransaction({
        amount: creditAmount,
        type: "promo_code",
        source: normalizedCode,
        referenceId: `promo:${normalizedCode}`,
        balanceAfter: previousCredits + creditAmount,
        metadata: { code: normalizedCode },
      });
    } catch (error) {
      console.warn("Unable to record Supabase promo code redemption.", error);
      applyUserProgressMutation((current) => ({
        profile: {
          ...current,
          credits: Math.max(0, current.credits - creditAmount),
          lifetimeCreditsPurchased: Math.max(0, current.lifetimeCreditsPurchased - creditAmount),
        },
        unlockedAchievements: [],
      }));

      return {
        ok: false,
        message: "CardMagic could not record that code on your account. Try again.",
      };
    }

    redeemedCodes.add(normalizedCode);
    await storeRedeemedCreditCodes(redeemedCodes);
    await storeEarlyAccessCodePromptShown();

    return {
      ok: true,
      credits: creditAmount,
      message: `${creditAmount} credits added.`,
    };
  };

  const ensureAiServiceReady = (setError: (message: string) => void) => {
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured. Add the Supabase public environment variables before running AI prompts.");
      openCreditStore();
      return false;
    }

    if (!accountUser) {
      setError("Sign in before running AI prompts.");
      setAccountOpen(true);
      return false;
    }

    return true;
  };

  const measurePreviewContainer = () => {
    previewContainerRef.current?.measureInWindow((x, y, previewWidth, previewHeight) => {
      previewBoundsRef.current = { x, y, width: previewWidth, height: previewHeight };
    });
  };

  const handleMainScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    measurePreviewContainer();

    const shouldShowReturnToTop = event.nativeEvent.contentOffset.y > 360;
    setShowReturnToTop((current) => (
      current === shouldShowReturnToTop ? current : shouldShowReturnToTop
    ));

    if (inspectorTab === "community") {
      communityScrollBoundaryHandlerRef.current?.(event);
    }
  };

  const scrollMainToTop = () => {
    mainScrollRef.current?.scrollTo({ y: 0, animated: true });
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

  // Stable identity (only uses setters + functional updates) so the memoized
  // CardPreview can skip re-rendering when unrelated state changes.
  const updateCard = useCallback((patch: Partial<CardDraft>) => {
    setCardHasUnsavedEdits(true);
    setCard((current) => ({
      ...current,
      ...patch,
      ...getFrameGeometryArtResetPatch(current, patch),
    }));
  }, []);

  const updateCurrentFace = (patch: Partial<CardDraft>) => {
    updateCard(toDfcFacePatch(card, patch));
  };

  const artGeneratorPrompt = useMemo(
    () =>
      buildArtGeneratorPrompt(card, artGeneratorRequest, {
        styleId: artGeneratorStyle,
        variationSeed: artGeneratorVariationSeed,
      }),
    [artGeneratorRequest, artGeneratorStyle, artGeneratorVariationSeed, card],
  );
  const generatedCardBackPrompt = useMemo(
    () =>
      buildCardBackGeneratorPrompt({
        request: cardBackGeneratorPrompt,
        mode: cardBackGeneratorMode,
      }),
    [cardBackGeneratorMode, cardBackGeneratorPrompt],
  );

  const openArtSourceOptions = () => {
    if (faceCard.artUri) {
      editArtTransform();
      return;
    }

    setActiveSection("art");
    setSheetSection(null);
    setArtGeneratorError(null);
    setSubjectMaskError(null);
    setArtSourceOpen(true);
  };

  const openArtGenerator = () => {
    setArtGeneratorRequest(getDefaultArtGeneratorRequest(card));
    setArtGeneratorVariationSeed(Math.random());
    setArtGeneratorError(null);
    setArtSourceOpen(false);
    setArtGeneratorOpen(true);
  };

  const applyArtUri = (artUri: string, options?: { artist?: string }) => {
    const artistPatch = options?.artist ? { artist: options.artist } : {};

    if (isDfcBackFace(card)) {
      updateCard({
        ...artistPatch,
        backArtUri: artUri,
        backArtSubjectMaskUri: undefined,
        backArtSubjectMaskComponents: undefined,
        backArtTransform: { offsetX: 0, offsetY: 0, scale: 1 },
      });
      return;
    }

    updateCard({
      ...artistPatch,
      artUri,
      artSubjectMaskUri: undefined,
      artSubjectMaskComponents: undefined,
      artTransform: { offsetX: 0, offsetY: 0, scale: 1 },
    });
  };

  const addArtLibraryEntry = (source: ArtLibrarySource, uri: string) => {
    const now = new Date().toISOString();
    const labelBase = faceCard.name.trim() || (source === "generated" ? "Generated art" : "Added art");
    const entry: ArtLibraryEntry = {
      id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      uri,
      source,
      colorIdentity: getCardArtLibraryColorIdentity(card),
      label: labelBase,
      createdAt: now,
    };

    setArtLibraryEntries((current) => normalizeArtLibraryEntries([entry, ...current]));

    if (artLibraryHydrated) {
      void storeArtLibrary(normalizeArtLibraryEntries([entry, ...artLibraryEntries]));
    }
  };

  const addCustomSetSymbolEntry = (labelBase: string, uri: string): GeneratedSetSymbolEntry => {
    const now = new Date().toISOString();
    const label = labelBase.trim().slice(0, 18) || "Custom";
    const entry: GeneratedSetSymbolEntry = {
      id: createUuid(),
      label,
      uri,
      createdAt: now,
    };

    setGeneratedSetSymbols((current) =>
      normalizeGeneratedSetSymbolEntries([
        entry,
        ...current,
      ]),
    );

    return entry;
  };

  const addCustomCardBackEntry = ({
    labelBase,
    description,
    uri,
    prompt,
  }: {
    labelBase: string;
    description: string;
    uri: string;
    prompt?: string;
  }) => {
    const id = `custom:card-back-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` as CardBackId;
    const entry: CustomCardBackEntry = {
      id,
      label: labelBase.trim().slice(0, 24) || "Custom Back",
      description: description.trim() || "Custom CardMagic card back",
      uri,
      createdAt: new Date().toISOString(),
      prompt,
    };

    setCustomCardBacks((current) => normalizeCustomCardBackEntries([entry, ...current]));
    updateCard({ cardBackId: id });
    setActiveSection("printing");
    setSheetSection("printing");
    return entry;
  };

  const upsertDefaultCardBackReskinEntry = ({
    uri,
    prompt,
  }: {
    uri: string;
    prompt?: string;
  }) => {
    const entry: CustomCardBackEntry = {
      id: DEFAULT_CARD_BACK_RESKIN_ID,
      label: "CardMagic Reskin",
      description: "Generated reskin of the default CardMagic back",
      uri,
      createdAt: new Date().toISOString(),
      prompt,
    };

    setCustomCardBacks((current) =>
      normalizeCustomCardBackEntries([
        entry,
        ...current.filter((cardBack) => cardBack.id !== DEFAULT_CARD_BACK_RESKIN_ID),
      ]),
    );
    updateCard({ cardBackId: DEFAULT_CARD_BACK_RESKIN_ID });
    setActiveSection("printing");
    setSheetSection("printing");
    return entry;
  };

  const selectArtLibraryEntry = (entry: ArtLibraryEntry) => {
    applyArtUri(entry.uri, entry.source === "generated" ? { artist: "OpenAI" } : undefined);
    setActiveSection("art");
    setSheetSection(null);
    setArtSourceOpen(false);
    setArtAdjustmentInitialMode("crop");
    setArtAdjustOpen(true);
  };

  const generateArt = async () => {
    if (!ensureAiServiceReady(setArtGeneratorError)) {
      return;
    }

    const artSpendCategory = getArtImageQualitySpendCategory(artGeneratorQuality);
    const creditStatus = canSpendCredits(userProgress, artSpendCategory);

    if (!creditStatus.ok) {
      setArtGeneratorError(
        `Generating card art costs ${creditStatus.cost} credits. Add ${creditStatus.shortfall} more to continue.`,
      );
      openCreditStore();
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
      const generatedArt = await generateOpenAiImageUri({
        prompt: artGeneratorPrompt,
        options: {
          ...OPENAI_CARD_ART_IMAGE_BASE_OPTIONS,
          quality: artGeneratorQuality,
        },
        spendCategory: artSpendCategory,
      });
      const artUri = generatedArt.uri;

      applyArtUri(artUri, { artist: "OpenAI" });
      addArtLibraryEntry("generated", artUri);
      setActiveSection("art");
      setSheetSection(null);
      setArtGeneratorOpen(false);
      setArtAdjustmentInitialMode("crop");
      setArtAdjustOpen(true);
      if (applyAuthoritativeAiProgress(generatedArt.progress)) {
        recordProgressEvent("generate-art");
      } else {
        recordSuccessfulCreditSpendAndEvent(artSpendCategory, "generate-art");
      }
    } catch (error) {
      console.warn("Unable to generate card art.", error);
      setArtGeneratorError(error instanceof Error ? error.message : "CardMagic could not generate art.");
      setArtGeneratorOpen(true);
    } finally {
      setArtGeneratorBusy(false);
    }
  };

  // Updates the on-screen subject-mask status and mirrors every in-progress
  // message to the browser console (not just the fal request step).
  const reportSubjectMaskStatus = (message: string | null) => {
    if (message) {
      console.log(`[CardMagic subject mask] ${message}`);
    }
    setSubjectMaskStatus(message);
  };

  const generateSubjectMask = async (targetPrompt?: string) => {
    if (subjectMaskBusy) {
      return;
    }

    const artUri = faceCard.artUri;

    if (!artUri) {
      setSubjectMaskError("Add card art before generating a subject mask.");
      return;
    }

    if (!ensureAiServiceReady(setSubjectMaskError)) {
      return;
    }

    const creditStatus = canSpendCredits(userProgress, "subjectMask");

    if (!creditStatus.ok) {
      setSubjectMaskError(
        `Generating a subject mask costs ${creditStatus.cost} credits. Add ${creditStatus.shortfall} more to continue.`,
      );
      openCreditStore();
      return;
    }

    const normalizedTargetPrompt = targetPrompt?.trim();
    const concepts = getSubjectMaskConcepts(normalizedTargetPrompt);
    const providerTargetPrompt = getSubjectMaskPromptForProvider(normalizedTargetPrompt);

    setSubjectMaskBusy(true);
    setSubjectMaskError(null);
    setSubjectMaskDiagnostics(null);
    setSubjectMaskComponents([]);

    // One timer running from the true start of masking; the phase label advances
    // through prepare → segment → combine → apply with continuous elapsed.
    const stopMaskTimer = startSubjectMaskTimer("Preparing your art…");

    try {
      let maskUri: string;
      let nextComponents: SubjectMaskComponent[] = [];
      let generatedMaskProgress: unknown;

      try {
        if (Platform.OS !== "web") {
          throw new Error("Dedicated subject matte normalization is currently web-only.");
        }

        stopMaskTimer.setPhase(
          !normalizedTargetPrompt
            ? "Removing the background from your art…"
            : concepts.length > 1
              ? `Segmenting ${concepts.length} subjects: ${concepts.join(", ")}…`
              : `Segmenting “${concepts[0] ?? normalizedTargetPrompt}”…`,
        );

        const generatedMask = await generateSubjectMatteUri({
          imageUri: artUri,
          targetPrompt: providerTargetPrompt,
        });
        maskUri = generatedMask.uri;
        generatedMaskProgress = generatedMask.progress;
        setSubjectMaskDiagnostics(generatedMask.diagnostics ?? null);
        subjectMaskSourceUriRef.current = generatedMask.sourceUri ?? artUri;
        nextComponents =
          normalizeSubjectMaskComponentsField(
            (generatedMask.components ?? []).map((component) => ({ ...component, enabled: true })),
          ) ?? [];
        setSubjectMaskComponents(nextComponents);

        stopMaskTimer.setPhase(concepts.length > 1 ? "Combining the masks…" : "Cleaning up the cutout…");
      } catch (matteError) {
        console.warn("Dedicated subject matte provider unavailable.", matteError);
        throw matteError;
      }

      stopMaskTimer.setPhase("Applying the cutout to your card…");
      updateCurrentFace({
        artSubjectMaskUri: maskUri,
        artSubjectMaskDisabled: false,
        artSubjectMaskComponents: nextComponents.length > 0 ? nextComponents : undefined,
      });
      setActiveSection("art");
      setSheetSection(null);
      setArtSourceOpen(false);
      setArtAdjustmentInitialMode("mask");
      setArtAdjustOpen(true);
      if (!applyAuthoritativeAiProgress(generatedMaskProgress)) {
        recordSuccessfulCreditSpend("subjectMask");
      }
    } catch (error) {
      console.warn("Unable to generate subject mask.", error);
      if (error instanceof SubjectMatteProviderError) {
        setSubjectMaskDiagnostics(error.diagnostics ?? null);
      }
      setSubjectMaskError(getFriendlySubjectMaskError(error, normalizedTargetPrompt));
      setArtSourceOpen(false);
      setArtAdjustmentInitialMode("mask");
      setArtAdjustOpen(true);
    } finally {
      stopMaskTimer.stop();
      setSubjectMaskBusy(false);
      setSubjectMaskStatus(null);
    }
  };

  // Drives the masking status line with a continuous elapsed timer. Returns a
  // handle to advance the phase label and to stop the timer.
  const startSubjectMaskTimer = (initialPhase: string) => {
    const startedAt = Date.now();
    let phase = initialPhase;
    const render = () => {
      const elapsed = Math.round((Date.now() - startedAt) / 1000);
      reportSubjectMaskStatus(`${phase} (${elapsed}s)`);
    };
    render();
    const intervalId = setInterval(render, 1000);
    return {
      setPhase: (next: string) => {
        phase = next;
        render();
      },
      stop: () => clearInterval(intervalId),
    };
  };

  // Add another subject to an existing mask: segment just the new concept and
  // append it to the current components, then re-merge.
  const addSubjectMask = async (concept: string) => {
    const trimmed = concept.trim();
    const sourceUri = subjectMaskSourceUriRef.current;

    if (!trimmed || !sourceUri || subjectMaskBusy) {
      return;
    }

    const creditStatus = canSpendCredits(userProgress, "subjectMask");

    if (!creditStatus.ok) {
      setSubjectMaskError(
        `Adding a subject costs ${creditStatus.cost} credits. Add ${creditStatus.shortfall} more to continue.`,
      );
      openCreditStore();
      return;
    }

    setSubjectMaskBusy(true);
    setSubjectMaskError(null);
    const stopMaskTimer = startSubjectMaskTimer(`Adding “${trimmed}”…`);

    try {
      const requestImageUri = await downscaleImageForMaskRequest(sourceUri);
      const matte = await generateSubjectMatteViaEdge({
        imageUri: requestImageUri,
        targetPrompt: getSubjectMaskPromptForProvider(trimmed),
      });
      const newMasks = (matte.subjectMasks ?? []).filter((mask) => mask && Boolean(mask.url));

      if (newMasks.length === 0) {
        throw new Error(`Couldn't find “${trimmed}” in your art.`);
      }

      const additions = newMasks.map((mask) => ({ concept: mask.concept, cutoutUrl: mask.url, enabled: true }));
      const next = normalizeSubjectMaskComponentsField([...subjectMaskComponents, ...additions]) ?? [];
      setSubjectMaskComponents(next);

      if (matte.diagnostics) {
        setSubjectMaskDiagnostics(matte.diagnostics);
      }

      stopMaskTimer.setPhase("Combining the masks…");
      const composed = await composeSubjectMaskFromComponents(next, sourceUri);
      updateCurrentFace({
        artSubjectMaskUri: composed ?? undefined,
        artSubjectMaskComponents: next.length > 0 ? next : undefined,
      });
      if (!applyAuthoritativeAiProgress(matte.progress)) {
        recordSuccessfulCreditSpend("subjectMask");
      }
    } catch (error) {
      console.warn("Unable to add subject mask.", error);
      if (error instanceof SubjectMatteProviderError) {
        setSubjectMaskDiagnostics(error.diagnostics ?? null);
      }
      setSubjectMaskError(getFriendlySubjectMaskError(error, trimmed));
    } finally {
      stopMaskTimer.stop();
      setSubjectMaskBusy(false);
      setSubjectMaskStatus(null);
    }
  };

  // Toggle one segmented subject in/out of the matte and re-merge the enabled
  // cutouts locally (no re-segmentation).
  const toggleSubjectMaskComponent = async (concept: string) => {
    if (subjectMaskToggleBusy) {
      return;
    }

    const sourceUri = subjectMaskSourceUriRef.current;

    if (!sourceUri) {
      return;
    }

    const next = subjectMaskComponents.map((component) =>
      component.concept === concept ? { ...component, enabled: !component.enabled } : component,
    );
    setSubjectMaskComponents(next);
    setSubjectMaskToggleBusy(true);
    setSubjectMaskError(null);

    try {
      const composed = await composeSubjectMaskFromComponents(next, sourceUri);
      updateCurrentFace({
        artSubjectMaskUri: composed ?? undefined,
        artSubjectMaskComponents: next.length > 0 ? next : undefined,
      });
    } catch (error) {
      console.warn("Unable to update subject mask toggle.", error);
      setSubjectMaskError(error instanceof Error ? error.message : "CardMagic could not update that subject mask.");
    } finally {
      setSubjectMaskToggleBusy(false);
    }
  };

  const fixRulesTextWithAi = async () => {
    const sourceRulesText = getEditableCardFace(card).rulesText.trim();

    if (!ensureAiServiceReady(setRulesTextFixerError)) {
      return;
    }

    if (!sourceRulesText) {
      setRulesTextFixerError("Add rules text before running the templating fixer.");
      return;
    }

    setRulesTextFixerBusy(true);
    setRulesTextFixerError(null);
    setRulesTextFixerSuggestion(null);

    try {
      const rulesText = await generateOpenAiRulesText({
        prompt: buildRulesTextFixerPrompt(card, customKeywordDefinitions),
      });

      if (!rulesText) {
        throw new Error("OpenAI returned an empty rules text field.");
      }

      setRulesTextFixerSuggestion({
        original: sourceRulesText,
        corrected: rulesText.trim(),
      });
    } catch (error) {
      console.warn("Unable to fix rules text.", error);
      setRulesTextFixerError(error instanceof Error ? error.message : "CardMagic could not fix the rules text.");
    } finally {
      setRulesTextFixerBusy(false);
    }
  };

  const applyRulesTextFixerSuggestion = () => {
    if (!rulesTextFixerSuggestion) {
      return;
    }

    updateCurrentFace({ rulesText: rulesTextFixerSuggestion.corrected });
    setRulesTextFixerSuggestion(null);
    setRulesTextFixerError(null);
  };

  const dismissRulesTextFixerSuggestion = () => {
    setRulesTextFixerSuggestion(null);
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

  // Stable wrapper for the memoized CardPreview. `selectPreviewSection` closes
  // over `card`/`faceCard`, so a plain useCallback would either go stale or
  // change identity every render. The latest-ref indirection keeps a constant
  // identity while always invoking the current implementation.
  const selectPreviewSectionRef = useRef(selectPreviewSection);
  selectPreviewSectionRef.current = selectPreviewSection;
  const handlePreviewSectionPress = useCallback(
    (section: CardSection, options?: { openSheet?: boolean }) => {
      selectPreviewSectionRef.current(section, options);
    },
    [],
  );

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
      recordProgressEvent("upload-art");

      setActiveSection("art");
      setSheetSection(null);
      setArtAdjustmentInitialMode("crop");
      setArtAdjustOpen(true);
    }
  };

  const editArtTransform = () => {
    setActiveSection("art");
    setSheetSection(null);
    setArtSourceOpen(false);
    setArtGeneratorOpen(false);
    setArtAdjustmentInitialMode("crop");
    setArtAdjustOpen(true);
  };

  const applySetSymbolPatch = (
    patch: Pick<CardDraft, "setSymbolPreset" | "setSymbolId" | "setSymbolUri" | "setSymbolUsesRarityTreatment">,
    targetSetId?: string | null,
  ) => {
    if (targetSetId) {
      updateSetSymbolDefaults(targetSetId, patch);

      return;
    }

    if (selectedSet) {
      updateSetSymbolDefaults(selectedSet.id, patch);
      return;
    }

    updateCard(patch);
  };

  const pickSetSymbol = async (targetSetId?: string | null) => {
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
      const setSymbolUri = await normalizePickedSetSymbolImage(result.assets[0]);
      const symbolEntry = addCustomSetSymbolEntry(faceCard.name || "Uploaded", setSymbolUri);

      applySetSymbolPatch({ setSymbolId: symbolEntry.id, setSymbolUri, setSymbolUsesRarityTreatment: true }, targetSetId);
      recordProgressEvent("upload-set-icon");
      if (!targetSetId) {
        setActiveSection("printing");
        setSheetSection("printing");
      }
    }
  };

  const openSetSymbolGenerator = (targetSetId?: string | null) => {
    setSetSymbolGeneratorPrompt("");
    setSetSymbolGeneratorError(null);
    setSetSymbolGeneratorTargetSetId(targetSetId ?? null);
    setSetSymbolGeneratorOpen(true);
  };

  const openCardBackGenerator = () => {
    setCardBackGeneratorPrompt("");
    setCardBackGeneratorMode("reskin");
    setCardBackGeneratorError(null);
    setCardBackGeneratorOpen(true);
  };

  const generateCardBack = async () => {
    const request = cardBackGeneratorPrompt.trim();

    if (!ensureAiServiceReady(setCardBackGeneratorError)) {
      return;
    }

    const creditStatus = canSpendCredits(userProgress, "artImage");

    if (!creditStatus.ok) {
      setCardBackGeneratorError(
        `Generating a card back costs ${creditStatus.cost} credits. Add ${creditStatus.shortfall} more to continue.`,
      );
      openCreditStore();
      return;
    }

    setCardBackGeneratorBusy(true);
    setCardBackGeneratorError(null);

    try {
      const generatedBack =
        cardBackGeneratorMode === "reskin"
          ? await generateOpenAiImageEditUri({
              imageUri: getDefaultCardBackImageUri(),
              prompt: generatedCardBackPrompt,
              size: "1024x1536",
              spendCategory: "artImage",
            })
          : await generateOpenAiImageUri({
              prompt: generatedCardBackPrompt,
              options: {
                size: "1024x1536",
                quality: "medium",
              },
              spendCategory: "artImage",
            });
      const generatedBackUri = generatedBack.uri;
      const cardBackUri = await normalizeCardBackImageUri(generatedBackUri, "generated-card-back");
      const labelBase =
        request ||
        (cardBackGeneratorMode === "reskin" ? "CardMagic Reskin" : "Custom Back");

      if (cardBackGeneratorMode === "reskin") {
        upsertDefaultCardBackReskinEntry({
          uri: cardBackUri,
          prompt: generatedCardBackPrompt,
        });
      } else {
        addCustomCardBackEntry({
          labelBase,
          description: "Generated custom CardMagic card back",
          uri: cardBackUri,
          prompt: generatedCardBackPrompt,
        });
      }
      setCardBackGeneratorOpen(false);
      if (!applyAuthoritativeAiProgress(generatedBack.progress)) {
        recordSuccessfulCreditSpend("artImage");
      }
    } catch (error) {
      console.warn("Unable to generate card back.", error);
      setCardBackGeneratorError(error instanceof Error ? error.message : "CardMagic could not generate the card back.");
    } finally {
      setCardBackGeneratorBusy(false);
    }
  };

  const pickCustomCardBack = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Photos Permission", "Enable photo library access to upload a custom card back.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [375, 523],
      quality: 0.9,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      const cardBackUri = await normalizePickedImage(result.assets[0], {
        maxDimension: CARD_BACK_MAX_DIMENSION,
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      addCustomCardBackEntry({
        labelBase: "Uploaded Back",
        description: "Uploaded custom CardMagic card back",
        uri: cardBackUri,
      });
    }
  };

  const generateSetSymbol = async () => {
    const request = setSymbolGeneratorPrompt.trim();

    if (!ensureAiServiceReady(setSetSymbolGeneratorError)) {
      return;
    }

    if (!request) {
      setSetSymbolGeneratorError("Enter a symbol concept.");
      return;
    }

    const creditStatus = canSpendCredits(userProgress, "setIcon");

    if (!creditStatus.ok) {
      setSetSymbolGeneratorError(
        `Generating a set symbol costs ${creditStatus.cost} credits. Add ${creditStatus.shortfall} more to continue.`,
      );
      openCreditStore();
      return;
    }

    setSetSymbolGeneratorBusy(true);
    setSetSymbolGeneratorError(null);

    try {
      const generatedSymbol = await generateOpenAiImageUri({
        prompt: buildSetSymbolGeneratorPrompt(card, request),
        spendCategory: "setIcon",
      });
      const generatedSymbolUri = generatedSymbol.uri;
      const setSymbolUri = await normalizeGeneratedSetSymbolImageUri(generatedSymbolUri, "generated-set-symbol");
      const symbolEntry = addCustomSetSymbolEntry(request, setSymbolUri);

      applySetSymbolPatch(
        { setSymbolId: symbolEntry.id, setSymbolUri, setSymbolUsesRarityTreatment: true },
        setSymbolGeneratorTargetSetId,
      );
      if (!setSymbolGeneratorTargetSetId) {
        setActiveSection("printing");
        setSheetSection("printing");
      }
      setSetSymbolGeneratorOpen(false);
      setSetSymbolGeneratorTargetSetId(null);
      if (applyAuthoritativeAiProgress(generatedSymbol.progress)) {
        recordProgressEvent("upload-set-icon");
      } else {
        recordSuccessfulCreditSpendAndEvent("setIcon", "upload-set-icon");
      }
    } catch (error) {
      console.warn("Unable to generate set symbol.", error);
      setSetSymbolGeneratorError(error instanceof Error ? error.message : "CardMagic could not generate the symbol.");
    } finally {
      setSetSymbolGeneratorBusy(false);
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
      saveMode?: "auto" | "new" | "overwrite";
      overwriteSnapshotId?: string | null;
    },
  ) => {
    const activeSnapshotId = targetSetId === selectedSetId ? activeSetCardId : null;
    const result = saveCardDraftIntoSet(cardSets, targetSetId, card, activeSnapshotId, {
      saveMode: options?.saveMode,
      overwriteSnapshotId: options?.overwriteSnapshotId,
    });

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

    recordProgressEvent("save-card");

    if (options?.notify) {
      Alert.alert("Card saved", `${result.snapshot.card.name || "Untitled Card"} was saved to ${result.setName}.`);
    }

    return result;
  };

  const saveCardToSelectedSet = (options?: {
    notify?: boolean;
    updateCurrentCard?: boolean;
    clearDirty?: boolean;
    saveMode?: "auto" | "new" | "overwrite";
    overwriteSnapshotId?: string | null;
  }) => {
    return saveCardToSet(selectedSetId, options);
  };

  const confirmDuplicateCardSave = (targetSetId: string, onConfirm: () => void) => {
    const targetSet = cardSets.find((set) => set.id === targetSetId) ?? cardSets[0];
    const activeSnapshotId = targetSetId === selectedSetId ? activeSetCardId : null;
    const duplicateSnapshot = findDuplicateSetCardSnapshot(targetSet, card, activeSnapshotId);

    if (!targetSet || !duplicateSnapshot) {
      onConfirm();
      return;
    }

    const cardName = duplicateSnapshot.card.name || card.name || "Untitled Card";
    const message = `${cardName} already exists in ${targetSet.name}. Save another copy anyway?`;

    if (Platform.OS === "web" && typeof window !== "undefined" && typeof window.confirm === "function") {
      if (window.confirm(message)) {
        onConfirm();
      }
      return;
    }

    Alert.alert("Save duplicate card?", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Save copy", onPress: onConfirm },
    ]);
  };

  const saveCardRecoverySnapshotNow = (reason: CardRecoverySnapshot["reason"]) => {
    const targetSet = cardSetsRef.current.find((set) => set.id === selectedSetId) ?? cardSetsRef.current[0];

    if (!targetSet) {
      return;
    }

    const timestamp = new Date().toISOString();
    const recoverySnapshot: CardRecoverySnapshot = {
      id: `recovery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      savedAt: timestamp,
      reason,
      setId: targetSet.id,
      setName: targetSet.name,
      activeSetCardId,
      card: cloneCardDraft(withResolvedSetDefaults(card, targetSet)),
    };

    void loadStoredCardRecoverySnapshots()
      .then((snapshots) => storeCardRecoverySnapshots([recoverySnapshot, ...snapshots]))
      .catch((error) => {
        console.warn("Unable to write CardMagic recovery snapshot.", error);
      });
  };

  const autosaveCurrentCardIfEdited = (reason: CardRecoverySnapshot["reason"] = "autosave") => {
    if (!cardHasUnsavedEdits) {
      return null;
    }

    saveCardRecoverySnapshotNow(reason);

    return saveCardToSelectedSet({ updateCurrentCard: false });
  };

  const resetCard = (options?: { autosave?: boolean }) => {
    if (options?.autosave !== false) {
      autosaveCurrentCardIfEdited();
    }

    setCard(createStarterCard());
    setActiveSetCardId(null);
    setCardHasUnsavedEdits(true);
    setActiveSection(null);
    setSheetSection(null);
    setPhysicalBackVisible(false);
    setEditMenuOpen(false);
    setCardActionMenuOpen(false);
    setShareMenuOpen(false);
    setPhysicalBackMenuOpen(false);
  };

  const confirmSavedCard = (result: NonNullable<ReturnType<typeof saveCardToSet>>) => {
    const cardName = result.snapshot.card.name || "Untitled Card";

    setSavedCardPrompt({
      cardName,
      setName: result.setName,
    });
  };

  const closeTransientMenus = () => {
    setActiveSection(null);
    setSheetSection(null);
    setPhysicalBackVisible(false);
    setEditMenuOpen(false);
    setCardActionMenuOpen(false);
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
    confirmDuplicateCardSave(targetSetId, () => {
      saveCardToSet(targetSetId, { updateCurrentCard: false });
      performRandomizeCard();
    });
  };

  const saveCurrentCardToSelectedSet = (options?: { notify?: boolean }) => {
    setShareMenuOpen(false);

    const targetSet = cardSets.find((set) => set.id === selectedSetId) ?? cardSets[0];

    if (!targetSet) {
      return;
    }

    const activeSnapshot =
      activeSetCardId && targetSet.cards.some((snapshot) => snapshot.id === activeSetCardId)
        ? targetSet.cards.find((snapshot) => snapshot.id === activeSetCardId) ?? null
        : null;
    const namedSnapshot = findNamedSetCardSnapshot(targetSet, card, activeSetCardId);
    const overwriteSnapshot = activeSnapshot ?? namedSnapshot;

    if (!overwriteSnapshot) {
      const result = saveCardToSelectedSet({ notify: false, saveMode: "new" });

      if (result && options?.notify) {
        confirmSavedCard(result);
      }
      return;
    }

    setSaveCardChoicePrompt({
      cardName: getEditableCardFace(card).name || "Untitled Card",
      setName: targetSet.name,
      targetSetId: targetSet.id,
      overwriteSnapshotId: overwriteSnapshot.id,
      overwriteLabel:
        activeSnapshot && overwriteSnapshot.id === activeSnapshot.id
          ? "Overwrite current card"
          : `Overwrite ${overwriteSnapshot.card.name || "matching card"}`,
    });
  };

  const completeSaveCardChoice = (
    prompt: NonNullable<typeof saveCardChoicePrompt>,
    saveMode: "new" | "overwrite",
  ) => {
    setSaveCardChoicePrompt(null);

    const result = saveCardToSet(prompt.targetSetId, {
      notify: false,
      saveMode,
      overwriteSnapshotId: saveMode === "overwrite" ? prompt.overwriteSnapshotId : null,
    });

    if (result) {
      confirmSavedCard(result);
    }
  };

  const startNewCardWithoutSaving = () => {
    resetCard({ autosave: false });
  };

  const shareCurrentCardToCommunity = async () => {
    setCardActionMenuOpen(false);
    setEditMenuOpen(false);
    setShareMenuOpen(false);
    setPhysicalBackMenuOpen(false);

    if (!accountUser) {
      Alert.alert("Sign in required", "Sign in before sharing a card to the community feed.");
      openAccount();
      return;
    }

    const communityCardId = activeSetCardId
      ? `community-${accountUser.id}-${activeSetCardId}`
      : `community-${accountUser.id}-${createUuid()}`;

    try {
      const communityCard = cloneCardDraft(previewCard);
      const imageUrl = await renderCommunityCardImageForUpload(
        communityCard,
        accountFooterOwnerName,
        accountUser.id,
        communityCardId,
      );

      await publishCommunityCard({
        id: communityCardId,
        userId: accountUser.id,
        localSnapshotId: activeSetCardId ? `community-${activeSetCardId}` : undefined,
        card: communityCard,
        imageUrl,
      });

      setAuthToast({
        id: `community-share-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        message: "Card shared to community",
      });
    } catch (error) {
      Alert.alert(
        "Community share unavailable",
        error instanceof Error ? error.message : "CardMagic could not share this card to the community feed.",
      );
    }
  };

  const renderCommunityCardImageForUpload = useCallback(async (
    communityCard: CardDraft,
    footerOwnerName: string,
    userId: string,
    communityCardId: string,
  ) => {
    const exportCard = cloneCardDraft(communityCard);
    const exportTarget: FlatCardExportTarget = {
      kind: "card",
      card: exportCard,
      footerOwnerName,
      artImageAspectRatio: await getCardExportArtImageAspectRatio(exportCard),
      flattenMasksExport: Platform.OS === "web",
    };

    setWebPhotoExportBusy(Platform.OS === "web");
    try {
      await applyExportRenderTargetUpdate(() => setSingleExportTarget(exportTarget));
      const exportPreview = await waitForExportPreviewRef(singleExportContainerRef, {
        nativeID: CARDMAGIC_SINGLE_EXPORT_PREVIEW_ID,
        timeoutMs: 8000,
        errorMessage: "CardMagic could not find the rendered card preview.",
      });
      if (Platform.OS === "web") {
        await waitForFlattenedFrameComposites();
      }
      await waitForExportPreviewImages(exportPreview);
      const renderedPng = await captureCardMagicPng(exportPreview);
      const uploadBody =
        Platform.OS === "web"
          ? await webPngExportUriToBlob(renderedPng)
          : await readPngCaptureBytes(renderedPng);

      return await uploadCommunityCardImage(userId, communityCardId, uploadBody);
    } finally {
      setWebPhotoExportBusy(false);
      setSingleExportTarget(null);
    }
  }, []);

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
    recordProgressEvent("export-card");
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

    const exportCard = cloneCardDraft(previewCard);
    const artImageAspectRatio = showingPhysicalBack ? null : await getCardExportArtImageAspectRatio(exportCard);
    const exportTarget: FlatCardExportTarget = showingPhysicalBack
      ? {
          kind: "back",
          cardBackId: previewCard.cardBackId ?? DEFAULT_CARD_BACK_ID,
        }
      : {
          kind: "card",
          card: exportCard,
          footerOwnerName: accountFooterOwnerName,
          artImageAspectRatio,
          flattenMasksExport: Platform.OS === "web",
        };

    try {
      setWebPhotoExportBusy(Platform.OS === "web");
      await applyExportRenderTargetUpdate(() => setSingleExportTarget(exportTarget));
      const exportPreview = await waitForExportPreviewRef(singleExportContainerRef, {
        nativeID: CARDMAGIC_SINGLE_EXPORT_PREVIEW_ID,
        timeoutMs: 8000,
        errorMessage: "CardMagic could not find the rendered card preview.",
      });
      if (Platform.OS === "web") {
        // Wait for the offscreen-canvas composites to produce their <img>s.
        await waitForFlattenedFrameComposites();
      }
      await waitForExportPreviewImages(exportPreview);

      if (Platform.OS === "web") {
        const dataUri = normalizeWebPngExportUri(await captureCardMagicPng(exportPreview));

        if (webFileHandle) {
          const blob = await webPngExportUriToBlob(dataUri);
          await writeWebFileHandle(webFileHandle, blob);
          recordProgressEvent("export-card");
          return;
        }

        setWebPhotoExport({ fileName, dataUri });
        recordProgressEvent("export-card");
        return;
      }

      await exportCardMagicPng(fileName, exportPreview);
      recordProgressEvent("export-card");
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

  const exportCommunityCardPng = useCallback(async (communityCard: CardDraft, cardName: string, footerOwnerName?: string, renderedImageUrl?: string) => {
    const fileName = getExportFileName(cardName || "community-card", "card").replace(/\.json$/, ".png");

    // Prefer the already-rendered hosted image. Community cards no longer carry
    // embedded art in their JSON (compacted at publish), so re-rendering would be
    // blank — and downloading the finished PNG is faster anyway.
    if (Platform.OS === "web" && renderedImageUrl) {
      try {
        setWebPhotoExportBusy(true);
        const response = await fetch(renderedImageUrl);
        if (!response.ok) {
          throw new Error(`Image download failed with HTTP ${response.status}.`);
        }
        const dataUri = await blobToDataUri(await response.blob());
        setWebPhotoExport({ fileName, dataUri });
        recordProgressEvent("export-card");
        return;
      } catch (error) {
        console.warn("Community image download failed; falling back to re-render.", error);
      } finally {
        setWebPhotoExportBusy(false);
      }
    }

    const exportCard = cloneCardDraft(communityCard);
    const exportTarget: FlatCardExportTarget = {
      kind: "card",
      card: exportCard,
      footerOwnerName,
      artImageAspectRatio: await getCardExportArtImageAspectRatio(exportCard),
      // Flatten masked layers so the html2canvas capture renders borderless
      // pinline and rarity set symbols faithfully here too.
      flattenMasksExport: Platform.OS === "web",
    };

    try {
      setWebPhotoExportBusy(Platform.OS === "web");
      await applyExportRenderTargetUpdate(() => setSingleExportTarget(exportTarget));
      const exportPreview = await waitForExportPreviewRef(singleExportContainerRef, {
        nativeID: CARDMAGIC_SINGLE_EXPORT_PREVIEW_ID,
        timeoutMs: 8000,
        errorMessage: "CardMagic could not find the rendered card preview.",
      });
      if (Platform.OS === "web") {
        await waitForFlattenedFrameComposites();
      }
      await waitForExportPreviewImages(exportPreview);

      if (Platform.OS === "web") {
        const dataUri = normalizeWebPngExportUri(await captureCardMagicPng(exportPreview));
        setWebPhotoExport({ fileName, dataUri });
        recordProgressEvent("export-card");
        return;
      }

      await exportCardMagicPng(fileName, exportPreview);
      recordProgressEvent("export-card");
    } catch (error) {
      console.warn("Community card photo export unavailable.", error);
      const message =
        Platform.OS === "web"
          ? `CardMagic could not render a downloadable PNG in this browser. ${
              error instanceof Error ? error.message : ""
            }`.trim()
          : "CardMagic could not save the rendered community card photo.";

      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(message);
      } else {
        Alert.alert("PNG export unavailable", message);
      }
    } finally {
      setWebPhotoExportBusy(false);
      setSingleExportTarget(null);
    }
  }, [recordProgressEvent]);

  const exportSelectedSet = async () => {
    setShareMenuOpen(false);

    if (!selectedSet) {
      return;
    }

    await exportCardMagicJson(getExportFileName(selectedSet.name, "set"), createSetExportPayload(selectedSet));
    recordProgressEvent("export-set");
  };

  const renderBatchCardPng = async (snapshot: SetCardSnapshot, set: CardSet, index: number) => {
    if (Platform.OS !== "web" && !hasNativeModule("RNViewShot")) {
      throw new Error("RNViewShot native module is unavailable.");
    }

    const cardName = getSetCardDisplayCard(snapshot).name || `Card ${index + 1}`;
    const fileName = `${String(index + 1).padStart(3, "0")}-${getExportFileBaseName(cardName)}.png`;

    try {
      await applyExportRenderTargetUpdate(() =>
        setBatchExportCard(cloneCardDraft(getSetCardPreviewCard(snapshot, set))),
      );
      const batchExportPreview = await waitForExportPreviewRef(batchExportContainerRef, {
        nativeID: CARDMAGIC_BATCH_EXPORT_PREVIEW_ID,
        timeoutMs: 8000,
        errorMessage: "CardMagic could not find the batch render surface.",
      });
      await waitForExportPreviewImages(batchExportPreview);

      if (Platform.OS === "web") {
        const captureWebRef = await loadWebViewShotCaptureRef();
        const blob = await captureWebRef(batchExportPreview as unknown as HTMLElement, {
          format: "png",
          quality: 1,
          result: "blob",
        });

        if (!(blob instanceof Blob)) {
          throw new Error("CardMagic web export did not return a PNG blob.");
        }

        return {
          fileName,
          bytes: new Uint8Array(await blob.arrayBuffer()),
        };
      }

      const captureRef = await loadViewShotCaptureRef();
      const result = await captureRef(batchExportPreview as never, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });

      return {
        fileName,
        bytes: await readPngCaptureBytes(result),
      };
    } finally {
      await applyExportRenderTargetUpdate(() => setBatchExportCard(null));
    }
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

    let streamingZip: WebStreamingZipWriter | null = null;
    let streamingZipClosed = false;

    try {
      setCardActionMenuOpen(false);
      setEditMenuOpen(false);
      setShareMenuOpen(false);
      const setPayload = createSetExportPayload(setSnapshot);
      const setJson = `${JSON.stringify(setPayload, null, 2)}\n`;
      const fileName = `${getExportFileBaseName(setSnapshot.name)}-batch-export.zip`;
      const webZipFileHandleResult =
        Platform.OS === "web" ? await promptForWebSaveFileHandle(fileName, "application/zip") : null;

      if (webZipFileHandleResult === "cancelled") {
        return;
      }

      const webZipFileHandle = webZipFileHandleResult ?? null;
      const { PDFDocument } = await import("pdf-lib");
      let archive: JsZipMutableArchiveLike | null = null;
      let pngFolder: JsZipFolderLike | null = null;

      if (Platform.OS === "web" && webZipFileHandle) {
        streamingZip = await createWebStreamingZipWriter(webZipFileHandle);
        await streamingZip.addFile("set.json", setJson);
      } else {
        const JSZip = (await import("jszip")).default;
        archive = new JSZip() as JsZipMutableArchiveLike;
        pngFolder = archive.folder("png");
        archive.file("set.json", setJson);
      }

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

        if (streamingZip) {
          await streamingZip.addFile(`png/${renderedCard.fileName}`, renderedCard.bytes);
        } else {
          pngFolder?.file(renderedCard.fileName, renderedCard.bytes);
        }

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
      const pdfBytes = await pdf.save();

      if (streamingZip) {
        await streamingZip.addFile("print-ready.pdf", pdfBytes);
        await streamingZip.close();
        streamingZipClosed = true;
      } else if (archive && Platform.OS === "web") {
        archive.file("print-ready.pdf", new Blob([getArrayBufferSlice(pdfBytes)], { type: "application/pdf" }));
        await shareOrDownloadWebZipArchive(fileName, archive, null);
      } else if (archive) {
        archive.file("print-ready.pdf", pdfBytes);
        const archiveBytes = await archive.generateAsync({ type: "uint8array", streamFiles: true });
        await writeAndShareNativeBytes(fileName, archiveBytes, {
          dialogTitle: "Export CardMagic set batch",
          mimeType: "application/zip",
          UTI: "public.zip-archive",
        });
      } else {
        throw new Error("Batch export ZIP writer was not initialized.");
      }
      recordProgressEvent("export-set");
    } catch (error) {
      if (streamingZip && !streamingZipClosed) {
        try {
          await streamingZip.abort();
        } catch (abortError) {
          console.warn("Unable to abort streamed ZIP export.", abortError);
        }
      }

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
    setShareMenuOpen(false);
  };

  const addFlipSideToCard = (options?: { initialFace?: "front" | "back" }) => {
    if ((card.typeFrame ?? "standard") === "planeswalker") {
      setPhysicalBackMenuOpen(false);
      return;
    }

    setCardHasUnsavedEdits(true);
    const nextDfcFace = options?.initialFace ?? (physicalBackVisible ? "back" : "front");

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
    setShareMenuOpen(false);
    setPhysicalBackMenuOpen(false);
  };

  const openCardBackSettings = () => {
    setActiveSection("printing");
    setSheetSection("printing");
    setEditMenuOpen(false);
    setCardActionMenuOpen(false);
    setShareMenuOpen(false);
    setPhysicalBackMenuOpen(false);
  };

  const openPhysicalBackActions = () => {
    setActiveSection(null);
    setSheetSection(null);
    setEditMenuOpen(false);
    setCardActionMenuOpen(false);
    setShareMenuOpen(false);
    setPhysicalBackMenuOpen(true);
  };

  const createSet = () => {
    const name = newSetName.trim();

    if (!name) {
      return;
    }

    const id = createUuid();

    autosaveCurrentCardIfEdited();
    setCardSets((current) => normalizeCardSets([...current, createDefaultCardSet(name, id)]));
    setSelectedSetId(id);
    setNewSetName("");
    recordProgressEvent("create-set");
  };

  const renameSet = (setId: string, name: string) => {
    const nextName = name.trim();

    if (!nextName) {
      return;
    }

    const currentSelectedSet = cardSetsRef.current.find((set) => set.id === setId);
    const currentGeneratedCode = currentSelectedSet ? generateSetCode(currentSelectedSet.name) : null;
    const shouldUpdateSelectedSetCode = Boolean(
      currentSelectedSet &&
        currentSelectedSet.id === selectedSetId &&
        normalizeSetCode(currentSelectedSet.code, currentSelectedSet.name) === currentGeneratedCode,
    );
    const nextSelectedSetCode = shouldUpdateSelectedSetCode ? generateSetCode(nextName) : null;

    setCardSets((current) => {
      const nextSets = normalizeCardSets(
        current.map((set) => {
          if (set.id !== setId) {
            return set;
          }

          const currentGeneratedCode = generateSetCode(set.name);
          const shouldRegenerateCode = normalizeSetCode(set.code, set.name) === currentGeneratedCode;
          const nextCode = shouldRegenerateCode ? generateSetCode(nextName) : set.code;

          return {
            ...set,
            name: nextName,
            code: nextCode,
          };
        }),
      );

      persistAccountSetsNow(nextSets);
      return nextSets;
    });

    if (nextSelectedSetCode) {
      updateCard({ setCode: nextSelectedSetCode });
    }
  };

  const updateSetCode = (setId: string, code: string) => {
    const nextCode = normalizeSetCode(code);

    setCardSets((current) =>
      normalizeCardSets(current.map((set) => (set.id === setId ? { ...set, code: nextCode } : set))),
    );

    if (setId === selectedSetId) {
      updateCard({ setCode: nextCode });
    }
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
    const targetSet = cardSetsRef.current.find((set) => set.id === setId);
    const targetIndex = targetSet?.cards.findIndex((snapshot) => snapshot.id === cardId) ?? -1;
    const targetSnapshot = targetSet && targetIndex >= 0 ? targetSet.cards[targetIndex] : null;

    if (!targetSet || !targetSnapshot) {
      return;
    }

    if (activeSetCardId === cardId) {
      setActiveSetCardId(null);
    }

    const nextTombstones = addDeletedCardTombstone(deletionTombstonesRef.current, setId, cardId);

    persistDeletionTombstonesNow(nextTombstones);
    setDeletionTombstones(nextTombstones);

    setCardSets((current) => {
      const nextSets = normalizeCardSets(
        current.map((set) =>
          set.id === setId
            ? normalizeCardSet({ ...set, cards: set.cards.filter((setCard) => setCard.id !== cardId) })
            : set,
        ),
      );

      persistAccountSetsNow(nextSets);
      return nextSets;
    });
    setDeleteUndo({
      id: `delete-card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: "card",
      message: `Removed ${targetSnapshot.card.name || "card"} from ${targetSet.name}`,
      setId,
      snapshot: targetSnapshot,
      index: targetIndex,
    });
  };

  const updateSetCardBack = (setId: string, cardBackId: CardBackId) => {
    setCardSets((current) =>
      current.map((set) => (set.id === setId ? normalizeCardSet({ ...set, cardBackId }) : set)),
    );
  };

  const updateSetSymbolDefaults = (
    setId: string,
    patch: Pick<CardDraft, "setSymbolPreset" | "setSymbolId" | "setSymbolUri" | "setSymbolUsesRarityTreatment">,
  ) => {
    const defaultPatch: Partial<CardDraft> = {
      setSymbolPreset: patch.setSymbolUri ? undefined : patch.setSymbolPreset ?? SET_SYMBOL_PRESETS[0].id,
      setSymbolId: patch.setSymbolUri ? patch.setSymbolId : undefined,
      setSymbolUri: patch.setSymbolUri,
      setSymbolUsesRarityTreatment: patch.setSymbolUsesRarityTreatment,
    };

    setCardSets((current) =>
      current.map((set) =>
        set.id === setId
          ? normalizeCardSet({
              ...set,
              ...defaultPatch,
              cards: set.cards.map((snapshot) => ({
                ...snapshot,
                card: {
                  ...snapshot.card,
                  ...defaultPatch,
                },
              })),
            })
          : set,
      ),
    );

    if (setId === selectedSetId) {
      setCard((current) => ({
        ...current,
        ...defaultPatch,
      }));
    }
  };

  const removeSet = (setId: string) => {
    const currentSets = cardSetsRef.current;
    const removedIndex = currentSets.findIndex((set) => set.id === setId);
    const removedSet = removedIndex >= 0 ? currentSets[removedIndex] : null;

    if (!removedSet) {
      return;
    }

    const nextSets = currentSets.filter((set) => set.id !== setId);
    const fallbackSet = nextSets[0] ?? createDefaultCardSet("Main Set");
    const resolvedSets = normalizeCardSets(nextSets.length > 0 ? nextSets : [fallbackSet]);
    const nextTombstones = addDeletedSetTombstone(deletionTombstonesRef.current, setId);

    persistDeletionTombstonesNow(nextTombstones);
    setDeletionTombstones(nextTombstones);
    persistAccountSetsNow(resolvedSets);
    setCardSets(resolvedSets);
    setActiveSetCardId(null);
    setDeleteUndo({
      id: `delete-set-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: "set",
      message: `Deleted ${removedSet.name}`,
      set: removedSet,
      index: removedIndex,
    });

    if (selectedSetId === setId || !resolvedSets.some((set) => set.id === selectedSetId)) {
      setSelectedSetId(fallbackSet.id);
    }
  };

  const inviteSetCollaborator = useCallback(async (setId: string, inviteIdentifier: string) => {
    if (!accountUser) {
      throw new Error("Sign in before inviting collaborators.");
    }

    await inviteCollaborationSetMember(setId, inviteIdentifier);
  }, [accountUser]);

  const undoDelete = useCallback((undoState: DeleteUndoState) => {
    if (undoState.kind === "card") {
      const nextTombstones = removeDeletedCardTombstone(
        deletionTombstonesRef.current,
        undoState.setId,
        undoState.snapshot.id,
      );

      persistDeletionTombstonesNow(nextTombstones);
      setDeletionTombstones(nextTombstones);
      setCardSets((current) => {
        const nextSets = normalizeCardSets(
          current.map((set) => {
            if (set.id !== undoState.setId || set.cards.some((snapshot) => snapshot.id === undoState.snapshot.id)) {
              return set;
            }

            const nextCards = [...set.cards];
            nextCards.splice(Math.min(undoState.index, nextCards.length), 0, undoState.snapshot);

            return normalizeCardSet({ ...set, cards: nextCards });
          }),
        );

        persistAccountSetsNow(nextSets);
        return nextSets;
      });
      setSelectedSetId(undoState.setId);
      setDeleteUndo(null);
      return;
    }

    const nextTombstones = removeDeletedSetTombstone(deletionTombstonesRef.current, undoState.set.id);

    persistDeletionTombstonesNow(nextTombstones);
    setDeletionTombstones(nextTombstones);
    setCardSets((current) => {
      if (current.some((set) => set.id === undoState.set.id)) {
        return current;
      }

      const nextSets = [...current];
      nextSets.splice(Math.min(undoState.index, nextSets.length), 0, undoState.set);
      const normalizedSets = normalizeCardSets(nextSets);

      persistAccountSetsNow(normalizedSets);
      return normalizedSets;
    });
    setSelectedSetId(undoState.set.id);
    setDeleteUndo(null);
  }, [persistAccountSetsNow, persistDeletionTombstonesNow]);

  const repairSavedSets = useCallback(() => {
    setCardSets((current) => {
      const repairedSets = normalizeCardSets(current.length > 0 ? current : createDefaultCardSets());

      logStorageWarning("Repair action rewrote saved sets through the schema normalizer.", {
        before: getCardSetStorageSummary(current),
        after: getCardSetStorageSummary(repairedSets),
      });

      void storeCardSets(repairedSets);
      return repairedSets;
    });
  }, []);

  const selectInspectorTab = (tab: InspectorTab) => {
    const nextTab: VisibleInspectorTab = tab === "keywords" ? "edit" : tab;

    if (nextTab !== inspectorTab) {
      autosaveCurrentCardIfEdited("tab-switch");
    }

    setActiveSection(null);
    setEditMenuOpen(false);
    setCardActionMenuOpen(false);
    setShareMenuOpen(false);
    setShowReturnToTop(false);
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
            ref={mainScrollRef}
            contentInsetAdjustmentBehavior="automatic"
            keyboardDismissMode="none"
            keyboardShouldPersistTaps="always"
            onPointerDown={deselectWhenTapStartsOutsideCard}
            onStartShouldSetResponderCapture={deselectWhenTapStartsOutsideCard}
            onTouchStart={deselectWhenTapStartsOutsideCard}
            onScroll={handleMainScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 22,
              paddingBottom: 78 + (keyboardVisible ? 0 : mobileBrowserBottomInset),
              gap: 18,
              alignItems: "center",
            }}
          >
            <TabContentErrorBoundary resetKey={inspectorTab} onRepairSavedSets={repairSavedSets}>
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
                      zIndex: shareMenuOpen ? 30 : 1,
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
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Show ${CARDMAGIC_RELEASE_BRANCH === "main" ? "release notes" : "patch notes"} for ${headerVersionLabel}`}
                        hitSlop={8}
                        onPress={() => setPatchNotesOpen(true)}
                        style={{ alignSelf: "flex-start" }}
                      >
                        <Text
                          selectable={false}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          style={{
                            color: "#5f6570",
                            fontSize: 13,
                            fontWeight: "700",
                            textDecorationLine: "underline",
                            textDecorationColor: "rgba(95, 101, 112, 0.38)",
                          }}
                        >
                          {headerVersionLabel}
                        </Text>
                      </Pressable>
                      <Text
                        selectable
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={{
                          color: "#5f6570",
                          fontSize: 13,
                          fontWeight: "700",
                          marginTop: -1,
                        }}
                      >
                        {headerContextLabel}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={accountUser ? "Open account" : "Sign in"}
                      onPress={openAccount}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: accountUser ? "#eef8fb" : "#ffffff",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: accountUser ? "#0b7180" : "rgba(17, 22, 31, 0.14)",
                      }}
                    >
                      <Users size={21} color={accountUser ? "#0b7180" : "#20242d"} strokeWidth={2.6} />
                    </Pressable>
                    <TopShareMenu
                      open={shareMenuOpen}
                      onToggle={() => {
                        setEditMenuOpen(false);
                        setCardActionMenuOpen(false);
                        setShareMenuOpen((current) => !current);
                      }}
                      onClose={() => setShareMenuOpen(false)}
                      onStartNewCard={startNewCardWithoutSaving}
                      onRandomizeCard={randomizeCard}
                      onShareToCommunity={() => void shareCurrentCardToCommunity()}
                      onExportCurrentCardImage={exportCurrentCardPng}
                      onExportCurrentCardJson={() => void exportCurrentCard()}
                      hasSelectedSet={Boolean(selectedSet)}
                      onExportSelectedSetJson={() => void exportSelectedSet()}
                      onExportSelectedSetBatch={() => void exportSelectedSetBatch()}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={selectedSet ? `Save card to ${selectedSet.name}` : "Save card to set"}
                      onPress={() => {
                        setEditMenuOpen(false);
                        setCardActionMenuOpen(false);
                        setShareMenuOpen(false);
                        saveCurrentCardToSelectedSet({ notify: true });
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
                      <Save size={22} color="#ffffff" strokeWidth={2.8} />
                    </Pressable>
                  </View>

                  <View style={{ width: "100%", maxWidth: cardWidth, position: "relative" }}>
                    <ProgressionHud
                      profile={userProgress}
                      maxWidth={cardWidth}
                      onOpenStore={openCreditStore}
                      onOpenAchievements={openAchievements}
                    />
                    <XpFloatingNumbers
                      numbers={xpFloatingNumbers}
                      onComplete={dismissXpFloatingNumber}
                    />
                  </View>

                  <View
                    ref={previewContainerRef}
                    collapsable={false}
                    onLayout={measurePreviewContainer}
                    style={{ width: previewSurfaceWidth, position: "relative" }}
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
                                customBacks={customCardBacks}
                                width={previewRenderWidth}
                              />
                            </Pressable>
                          ) : (
                            <View
                              ref={visibleCardExportRef}
                              collapsable={false}
                              id="cardmagic-visible-card-export-source"
                              nativeID="cardmagic-visible-card-export-source"
                              testID="cardmagic-visible-card-export-source"
                              style={{
                                width: previewRenderWidth,
                                aspectRatio: previewAspectRatio,
                                backgroundColor: "transparent",
                              }}
                            >
                              <CardPreview
                                card={previewCard}
                                activeSection={visibleCardExportActive ? null : activeSection}
                                width={previewRenderWidth}
                                exportCaptureMode={visibleCardExportActive}
                                exportSetSymbolMode={visibleCardExportActive}
                                artGenerating={artGeneratorBusy}
                                footerOwnerName={accountFooterOwnerName}
                                onSectionPress={handlePreviewSectionPress}
                                onChange={updateCard}
                              />
                            </View>
                          )}
                        </CardTransformSurface>
                        {physicalBackMenuOpen && showingPhysicalBack ? (
                          <PhysicalBackActionsMenu
                            width={Math.min(304, Math.max(236, previewRenderWidth - 32))}
                            onChangeBack={openCardBackSettings}
                            onClose={() => setPhysicalBackMenuOpen(false)}
                          />
                        ) : null}
                        {Platform.OS === "web" && typeof document !== "undefined" && sheetSection === null ? createPortal(
                        <View
                          pointerEvents="box-none"
                          style={{
                            position: "fixed" as unknown as "absolute",
                            left: resolvedPreviewToolbarPosition.x,
                            top: resolvedPreviewToolbarPosition.y,
                            width: previewToolbarWidth,
                            alignItems: "center",
                            zIndex: editMenuOpen || cardActionMenuOpen
                              ? PREVIEW_FLOATING_TOOLBAR_MENU_Z_INDEX
                              : PREVIEW_FLOATING_TOOLBAR_Z_INDEX,
                          }}
                        >
                          {editMenuOpen ? (
                            <View
                              style={{
                                position: "absolute",
                                ...previewToolbarMenuAnchorStyle,
                                width: previewToolbarMenuWidth,
                              }}
                            >
                              <CardEditMenuPanel
                                menuWidth={previewToolbarMenuWidth}
                                typeFrame={card.typeFrame ?? "standard"}
                                activeSection={activeSection}
                                sheetSection={sheetSection}
                                onSelectSection={(section) => {
                                  setActiveSection(
                                    shouldUseSheetForMobileWebCardTextEditing(section) ? null : section,
                                  );
                                  setSheetSection(section);
                                  setEditMenuOpen(false);
                                }}
                              />
                            </View>
                          ) : null}
                          {cardActionMenuOpen ? (
                            <View
                              style={previewToolbarFrameMenuRelativeStyle}
                            >
                              <FrameChangeMenuPanel
                                menuWidth={previewToolbarFrameMenuLayout.width}
                                maxHeight={previewToolbarFrameMenuLayout.maxHeight}
                                frameIdentity={previewFrameIdentity}
                                selectedFrameTreatment={activeFrameTreatment}
                                selectedShowcaseFrame={activeShowcaseFrame}
                                compatibleFrameTreatments={compatibleFrameTreatments}
                                onToggle={() => setCardActionMenuOpen(false)}
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
                          ) : null}
                          <GestureDetector gesture={previewToolbarGesture}>
                            <Animated.View
                              style={[
                                {
                                  flexDirection: previewToolbarOrientation === "horizontal" ? "row" : "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap:
                                    previewToolbarOrientation === "horizontal"
                                      ? PREVIEW_ACTION_HORIZONTAL_GAP
                                      : PREVIEW_ACTION_BUTTON_GAP,
                                  padding: PREVIEW_ACTION_TOOLBAR_PADDING,
                                  borderRadius: 28,
                                  borderCurve: "continuous",
                                  borderWidth: 1,
                                  borderColor: "rgba(199, 203, 211, 0.86)",
                                  backgroundColor: "rgba(255, 255, 255, 0.88)",
                                  shadowColor: "#000000",
                                  shadowOpacity: 0.18,
                                  shadowRadius: 18,
                                  shadowOffset: { width: 0, height: 10 },
                                  elevation: 12,
                                },
                                previewToolbarAnimatedStyle,
                              ]}
                            >
                              <PreviewToolbarGrabber orientation={previewToolbarOrientation} />
                              {!previewToolbarCollapsed ? (
                                <>
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
                                      onPress={rotatePreview}
                                      icon={
                                        <Animated.View style={previewRotateIconStyle}>
                                          <RotateCw
                                            size={21}
                                            color={previewRotated ? "#ffffff" : "#20242d"}
                                            strokeWidth={2.5}
                                          />
                                        </Animated.View>
                                      }
                                    />
                                  ) : null}
                                  <CardEditMenu
                                    open={editMenuOpen}
                                    menuWidth={previewToolbarMenuWidth}
                                    showMenu={false}
                                    typeFrame={card.typeFrame ?? "standard"}
                                    activeSection={activeSection}
                                    sheetSection={sheetSection}
                                    onToggle={() => {
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
                                    menuWidth={previewToolbarMenuWidth}
                                    showMenu={false}
                                    frameIdentity={previewFrameIdentity}
                                    selectedFrameTreatment={activeFrameTreatment}
                                    selectedShowcaseFrame={activeShowcaseFrame}
                                    compatibleFrameTreatments={compatibleFrameTreatments}
                                    onToggle={() => {
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
                                </>
                              ) : null}
                            </Animated.View>
                          </GestureDetector>
                        </View>,
                        document.body,
                        ) : null}
                      </>
                    ) : (
                      <CardFontLoadingPreview width={previewRenderWidth} aspectRatio={previewAspectRatio} />
                    )}
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
                <TabScreen title="Sets" subtitle="Manage set shells and card membership" fullWidth framed={false}>
                  <SetsPanel
                    sets={cardSets}
                    selectedSetId={selectedSetId}
                    newSetName={newSetName}
                    onChangeNewSetName={setNewSetName}
                    onSelectSet={selectSet}
                    onCreateSet={createSet}
                    onRenameSet={renameSet}
                    onChangeSetCode={updateSetCode}
                    onCreateCardInSet={createCardInSet}
                    onOpenCardFromSet={openCardFromSet}
                    onRemoveCardFromSet={removeCardFromSet}
                    onRemoveSet={removeSet}
                    onChangeSetCardBack={updateSetCardBack}
                    onChangeSetDefaultSymbol={(setId, patch) => {
                      updateSetSymbolDefaults(setId, patch);
                    }}
                    onPickSetSymbol={(setId) => void pickSetSymbol(setId)}
                    onGenerateSetSymbol={(setId) => openSetSymbolGenerator(setId)}
                    customCardBacks={customCardBacks}
                    generatedSetSymbols={generatedSetSymbols}
                    footerOwnerName={accountFooterOwnerName}
                    canRefreshSets={Boolean(accountUser)}
                    setsRefreshing={accountSyncBusy}
                    onRefreshSets={() => void syncRemoteUserProgress()}
                    canInviteSetCollaborators={Boolean(accountUser)}
                    onFetchSetCollaborators={fetchCollaborationSetMembers}
                    onFetchPendingInvites={fetchCollaborationSetPendingInvites}
                    onInviteSetCollaborator={inviteSetCollaborator}
                  />
                </TabScreen>
              ) : null}

              {inspectorTab === "community" ? (
                <CommunityPanel
                  sets={cardSets}
                  accountUser={accountUser}
                  onRegisterMainScrollHandler={(handler) => {
                    communityScrollBoundaryHandlerRef.current = handler;
                  }}
                  onExportCardImage={exportCommunityCardPng}
                />
              ) : null}
            </TabContentErrorBoundary>
          </ScrollView>

          {!keyboardVisible ? (
            <BottomTabBar
              activeTab={inspectorTab}
              bottomInset={mobileBrowserBottomInset}
              onSelectTab={selectInspectorTab}
            />
          ) : null}
          <FlatCardExportRenderHost
            target={singleExportTarget}
            containerRef={singleExportContainerRef}
            nativeID={CARDMAGIC_SINGLE_EXPORT_PREVIEW_ID}
            customBacks={customCardBacks}
          />
          <FlatCardExportRenderHost
            target={batchExportCard ? { kind: "card", card: batchExportCard } : null}
            containerRef={batchExportContainerRef}
            nativeID={CARDMAGIC_BATCH_EXPORT_PREVIEW_ID}
            customBacks={customCardBacks}
          />
          <WebPhotoExportModal
            exportFile={webPhotoExport}
            onClose={() => setWebPhotoExport(null)}
            onActionComplete={showExportConfirmationToast}
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
          <SaveCardChoiceModal
            prompt={saveCardChoicePrompt}
            onOverwrite={(prompt) => completeSaveCardChoice(prompt, "overwrite")}
            onSaveNew={(prompt) => completeSaveCardChoice(prompt, "new")}
            onClose={() => setSaveCardChoicePrompt(null)}
          />
          <SavedCardPromptModal
            prompt={savedCardPrompt}
            onKeepEditing={() => setSavedCardPrompt(null)}
            onStartNewCard={() => {
              setSavedCardPrompt(null);
              resetCard({ autosave: false });
            }}
          />
          {webPhotoExportBusy ? <CardPhotoExportBusyOverlay /> : null}
          <ExportConfirmationToast
            toast={exportConfirmationToast}
            onDismiss={dismissExportConfirmationToast}
          />
          <DeleteUndoToast
            undo={deleteUndo}
            onUndo={undoDelete}
            onDismiss={dismissDeleteUndo}
          />
          {showReturnToTop && !keyboardVisible ? (
            <ReturnToTopButton bottomInset={mobileBrowserBottomInset} onPress={scrollMainToTop} />
          ) : null}
          <AuthToast
            toast={authToast}
            onDismiss={dismissAuthToast}
          />
          {batchExportProgress ? <BatchExportProgressOverlay progress={batchExportProgress} /> : null}
        </KeyboardAvoidingView>

        <AchievementCompletionPopups
          popups={achievementPopups}
          onDismiss={dismissAchievementPopup}
          onOpenAchievements={openAchievements}
        />
        <LevelUpToasts
          toasts={levelUpToasts}
          onDismiss={dismissLevelUpToast}
        />

        <SectionEditorModal
          card={previewCard}
          section={sheetSection}
          setCardBackId={selectedSet?.cardBackId ?? DEFAULT_CARD_BACK_ID}
          cardBackOverrideId={card.cardBackId}
          setSymbolDefaults={selectedSet ? getSetSymbolDefaultsPatch(selectedSet) : undefined}
          customCardBacks={customCardBacks}
          generatedSetSymbols={generatedSetSymbols}
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
          onPickSetSymbol={() => void pickSetSymbol(selectedSet?.id)}
          onGenerateSetSymbol={() => openSetSymbolGenerator(selectedSet?.id)}
          onAddCardBack={
            canAddPhysicalCardBackFace ? () => addFlipSideToCard({ initialFace: "back" }) : undefined
          }
          onGenerateCardBack={openCardBackGenerator}
          onPickCustomCardBack={pickCustomCardBack}
          onChangeSetDefaultCardBack={(cardBackId) => {
            if (selectedSet) {
              updateSetCardBack(selectedSet.id, cardBackId);
              updateCard({ cardBackId: undefined });
            }
          }}
          onChangeSetDefaultSymbol={(patch) => {
            if (selectedSet) {
              updateSetSymbolDefaults(selectedSet.id, patch);
            }
          }}
          onPickWatermark={pickWatermark}
          customKeywordDefinitions={customKeywordDefinitions}
          rulesTextAiFixer={{
            busy: rulesTextFixerBusy,
            error: rulesTextFixerError,
            suggestion: rulesTextFixerSuggestion,
            onFixRulesText: fixRulesTextWithAi,
            onApplySuggestion: applyRulesTextFixerSuggestion,
            onDismissSuggestion: dismissRulesTextFixerSuggestion,
          }}
        />
        <ArtSourceModal
          visible={artSourceOpen}
          hasArt={Boolean(faceCard.artUri)}
          artLibraryEntries={artLibraryEntries}
          onPickPhoto={pickArt}
          onGenerateArt={openArtGenerator}
          onGenerateSubjectMask={generateSubjectMask}
          onEditImage={editArtTransform}
          onSelectLibraryArt={selectArtLibraryEntry}
          subjectMaskBusy={subjectMaskBusy}
          subjectMaskStatus={subjectMaskStatus}
          subjectMaskError={subjectMaskError}
          onClose={() => setArtSourceOpen(false)}
        />
        <ArtGeneratorModal
          visible={artGeneratorOpen}
          hasArt={Boolean(faceCard.artUri)}
          request={artGeneratorRequest}
          quality={artGeneratorQuality}
          styleId={artGeneratorStyle}
          generatedPrompt={artGeneratorPrompt}
          busy={artGeneratorBusy}
          error={artGeneratorError}
          onChangeRequest={setArtGeneratorRequest}
          onChangeQuality={setArtGeneratorQuality}
          onChangeStyle={setArtGeneratorStyle}
          onGenerate={generateArt}
          onClose={() => {
            if (!artGeneratorBusy) {
              setArtGeneratorOpen(false);
            }
          }}
        />
        <SetSymbolGeneratorModal
          visible={setSymbolGeneratorOpen}
          request={setSymbolGeneratorPrompt}
          busy={setSymbolGeneratorBusy}
          error={setSymbolGeneratorError}
          onChangeRequest={setSetSymbolGeneratorPrompt}
          onGenerate={generateSetSymbol}
          onClose={() => {
            if (!setSymbolGeneratorBusy) {
              setSetSymbolGeneratorOpen(false);
              setSetSymbolGeneratorTargetSetId(null);
            }
          }}
        />
        <CardBackGeneratorModal
          visible={cardBackGeneratorOpen}
          request={cardBackGeneratorPrompt}
          mode={cardBackGeneratorMode}
          generatedPrompt={generatedCardBackPrompt}
          busy={cardBackGeneratorBusy}
          error={cardBackGeneratorError}
          onChangeRequest={setCardBackGeneratorPrompt}
          onChangeMode={setCardBackGeneratorMode}
          onGenerate={generateCardBack}
          onClose={() => {
            if (!cardBackGeneratorBusy) {
              setCardBackGeneratorOpen(false);
            }
          }}
        />
        <ArtAdjustmentModal
          visible={artAdjustOpen}
          card={card}
          initialMode={artAdjustmentInitialMode}
          onChange={updateCard}
          onGenerateSubjectMask={generateSubjectMask}
          subjectMaskBusy={subjectMaskBusy}
          subjectMaskStatus={subjectMaskStatus}
          subjectMaskError={subjectMaskError}
          subjectMaskComponents={subjectMaskComponents}
          subjectMaskToggleBusy={subjectMaskToggleBusy}
          onToggleSubjectMaskComponent={toggleSubjectMaskComponent}
          onAddSubjectMask={addSubjectMask}
          onPickPhoto={() => {
            setArtAdjustOpen(false);
            setArtAdjustmentInitialMode("crop");
            void pickArt();
          }}
          onGenerateArt={() => {
            setArtAdjustOpen(false);
            setArtAdjustmentInitialMode("crop");
            openArtGenerator();
          }}
          onClose={() => {
            setArtAdjustOpen(false);
            setArtAdjustmentInitialMode("crop");
          }}
        />
        <EarlyAccessCodeModal
          visible={earlyAccessCodeOpen}
          code={EARLY_ACCESS_CREDIT_CODE}
          onClose={closeEarlyAccessCodePrompt}
        />
        <CreditStoreModal
          visible={creditStoreOpen}
          profile={userProgress}
          checkoutBusyProductId={checkoutBusyProductId}
          checkoutErrorMessage={checkoutErrorMessage}
          onClose={() => setCreditStoreOpen(false)}
          onBuyCreditPack={buyStoreCreditPack}
          onSubscribeMonthly={subscribeToMonthlyCredits}
          onRedeemCreditCode={redeemCreditCode}
          canRedeemCreditCode={Boolean(accountUser)}
          onRequireAccount={openAccount}
        />
        <AccountModal
          visible={accountOpen}
          user={accountUser}
          onClose={() => setAccountOpen(false)}
          onAuthSuccess={showLoginSuccessToast}
          onProfileChange={setAccountProfile}
        />
        <AchievementsModal
          visible={achievementsOpen}
          profile={userProgress}
          onClose={() => setAchievementsOpen(false)}
        />
        <PatchNotesModal
          visible={patchNotesOpen}
          appVersion={CARDMAGIC_APP_VERSION}
          releaseBranch={CARDMAGIC_RELEASE_BRANCH}
          betaReleaseDeployment={betaReleaseDeployment}
          notes={CARDMAGIC_VISIBLE_PATCH_NOTES}
          onClose={() => setPatchNotesOpen(false)}
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
  onGenerateSubjectMask,
  onEditImage,
  onSelectLibraryArt,
  subjectMaskBusy,
  subjectMaskStatus,
  subjectMaskError,
  onClose,
}: {
  visible: boolean;
  hasArt: boolean;
  artLibraryEntries: ArtLibraryEntry[];
  onPickPhoto: () => void;
  onGenerateArt: () => void;
  onGenerateSubjectMask: (targetPrompt?: string) => void;
  onEditImage: () => void;
  onSelectLibraryArt: (entry: ArtLibraryEntry) => void;
  subjectMaskBusy: boolean;
  subjectMaskStatus: string | null;
  subjectMaskError: string | null;
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

          {!hasArt ? (
            <>
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
            </>
          ) : null}
          {hasArt ? (
            <>
              <ArtSourceMenuItem
                label="Edit image crop"
                detail="Adjust scale and focal point inside the visible art slot."
                icon={<SlidersHorizontal size={20} color="#151820" strokeWidth={2.5} />}
                onPress={onEditImage}
              />
              <ArtSourceMenuItem
                label={subjectMaskBusy ? "Generating mask" : "Generate subject mask"}
                detail={subjectMaskStatus ?? "Create an alpha matte for over-border borderless art."}
                icon={
                  subjectMaskBusy ? (
                    <ActivityIndicator color="#151820" />
                  ) : (
                    <Layers size={20} color="#151820" strokeWidth={2.5} />
                  )
                }
                onPress={() => onGenerateSubjectMask()}
              />
              {subjectMaskStatus ? (
                <View
                  style={{
                    borderRadius: 12,
                    backgroundColor: "#eef8fb",
                    borderWidth: 1,
                    borderColor: "#b7e7f1",
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    gap: 3,
                  }}
                >
                  <Text selectable={false} style={{ color: "#0b7180", fontSize: 11, fontWeight: "900" }}>
                    Subject matte progress
                  </Text>
                  <Text selectable style={{ color: "#334155", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
                    {subjectMaskStatus}
                  </Text>
                </View>
              ) : null}
            </>
          ) : null}
          {subjectMaskError ? (
            <Text selectable style={{ color: "#b42318", fontSize: 12, lineHeight: 17, fontWeight: "800", paddingHorizontal: 6 }}>
              {subjectMaskError}
            </Text>
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
  hasArt,
  request,
  quality,
  styleId,
  generatedPrompt,
  busy,
  error,
  onChangeRequest,
  onChangeQuality,
  onChangeStyle,
  onGenerate,
  onClose,
}: {
  visible: boolean;
  hasArt: boolean;
  request: string;
  quality: ArtImageQuality;
  styleId: ArtGeneratorStyleId;
  generatedPrompt: string;
  busy: boolean;
  error: string | null;
  onChangeRequest: (request: string) => void;
  onChangeQuality: (quality: ArtImageQuality) => void;
  onChangeStyle: (styleId: ArtGeneratorStyleId) => void;
  onGenerate: () => void;
  onClose: () => void;
}) {
  const { height } = useWindowDimensions();
  const [showComposedPrompt, setShowComposedPrompt] = useState(false);
  const maxPromptHeight = Math.max(120, Math.min(260, height * 0.26));
  const submitLabel = hasArt ? "Regenerate" : "Generate";
  const submitAccessibilityLabel = hasArt ? "Regenerate card art" : "Generate card art";

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
            <Text selectable={false} style={{ color: "#343a44", fontSize: 12, fontWeight: "900" }}>
              Style
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 2 }}>
              {ART_GENERATOR_STYLE_OPTIONS.map((option) => {
                const selected = styleId === option.id;

                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Use ${option.label.toLowerCase()} art style`}
                    disabled={busy}
                    onPress={() => onChangeStyle(option.id)}
                    style={{
                      minWidth: 82,
                      minHeight: 40,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: selected ? "#151820" : "#d8dbe2",
                      backgroundColor: selected ? "#151820" : "#ffffff",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 14,
                      opacity: busy ? 0.68 : 1,
                    }}
                  >
                    <Text
                      selectable={false}
                      numberOfLines={1}
                      style={{
                        color: selected ? "#ffffff" : "#151820",
                        fontSize: 13,
                        fontWeight: "900",
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={{ gap: 7 }}>
            <Text selectable={false} style={{ color: "#343a44", fontSize: 12, fontWeight: "900" }}>
              Image Quality
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {ART_IMAGE_QUALITY_OPTIONS.map((option) => {
                const selected = quality === option.value;

                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Generate ${option.label.toLowerCase()} quality card art for ${option.detail}`}
                    disabled={busy}
                    onPress={() => onChangeQuality(option.value)}
                    style={{
                      flex: 1,
                      minHeight: 48,
                      borderRadius: 12,
                      borderCurve: "continuous",
                      borderWidth: 1,
                      borderColor: selected ? "#151820" : "#d8dbe2",
                      backgroundColor: selected ? "#151820" : "#ffffff",
                      justifyContent: "center",
                      paddingHorizontal: 12,
                      opacity: busy ? 0.68 : 1,
                    }}
                  >
                    <Text
                      selectable={false}
                      numberOfLines={1}
                      style={{
                        color: selected ? "#ffffff" : "#151820",
                        fontSize: 14,
                        fontWeight: "900",
                      }}
                    >
                      {option.label}
                    </Text>
                    <Text
                      selectable={false}
                      numberOfLines={1}
                      style={{
                        color: selected ? "rgba(255,255,255,0.72)" : "#68707d",
                        fontSize: 11,
                        fontWeight: "800",
                      }}
                    >
                      {option.detail}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
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
              accessibilityLabel={submitAccessibilityLabel}
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
              <GenerationButtonLabel busy={busy} idleLabel={submitLabel} busyLabel="Generating, please wait" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SetSymbolGeneratorModal({
  visible,
  request,
  busy,
  error,
  onChangeRequest,
  onGenerate,
  onClose,
}: {
  visible: boolean;
  request: string;
  busy: boolean;
  error: string | null;
  onChangeRequest: (request: string) => void;
  onGenerate: () => void;
  onClose: () => void;
}) {
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
            boxShadow: "0 -10px 28px rgba(0, 0, 0, 0.2)",
          }}
        >
          <View style={{ gap: 3 }}>
            <Text selectable={false} style={{ color: "#151820", fontSize: 22, fontWeight: "900" }}>
              Generate Set Symbol
            </Text>
          </View>

          <View style={{ gap: 7 }}>
            <Text selectable={false} style={{ color: "#343a44", fontSize: 12, fontWeight: "900" }}>
              Symbol Concept
            </Text>
            <TextInput
              accessibilityLabel="Set symbol concept"
              value={request}
              onChangeText={onChangeRequest}
              placeholder="heart"
              placeholderTextColor="#9aa1ad"
              autoCapitalize="none"
              autoCorrect
              style={{
                minHeight: 46,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#d8dbe2",
                backgroundColor: "#f7f8fb",
                paddingHorizontal: 12,
                color: "#151820",
                fontSize: 15,
                fontWeight: "800",
              }}
            />
          </View>

          {error ? (
            <Text selectable style={{ color: "#b42318", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
              {error}
            </Text>
          ) : null}

          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel set symbol generation"
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
              accessibilityLabel="Generate set symbol"
              disabled={busy}
              onPress={onGenerate}
              style={{
                minHeight: 46,
                borderRadius: 999,
                backgroundColor: "#0b7180",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 20,
                flexDirection: "row",
                gap: 9,
                opacity: busy ? 0.72 : 1,
              }}
            >
              {busy ? <ActivityIndicator color="#ffffff" /> : <Sparkles size={18} color="#ffffff" strokeWidth={2.5} />}
              <GenerationButtonLabel busy={busy} idleLabel="Generate" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function CardBackGeneratorModal({
  visible,
  request,
  mode,
  generatedPrompt,
  busy,
  error,
  onChangeRequest,
  onChangeMode,
  onGenerate,
  onClose,
}: {
  visible: boolean;
  request: string;
  mode: CardBackGeneratorMode;
  generatedPrompt: string;
  busy: boolean;
  error: string | null;
  onChangeRequest: (request: string) => void;
  onChangeMode: (mode: CardBackGeneratorMode) => void;
  onGenerate: () => void;
  onClose: () => void;
}) {
  const { height } = useWindowDimensions();
  const [showComposedPrompt, setShowComposedPrompt] = useState(false);
  const maxPromptHeight = Math.max(110, Math.min(240, height * 0.24));

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
            boxShadow: "0 -10px 28px rgba(0, 0, 0, 0.2)",
          }}
        >
          <View style={{ gap: 3 }}>
            <Text selectable={false} style={{ color: "#151820", fontSize: 22, fontWeight: "900" }}>
              Generate Card Back
            </Text>
            <Text selectable={false} style={{ color: "#68707d", fontSize: 12, lineHeight: 17, fontWeight: "700" }}>
              Reskin edits the default CardMagic back in place. Custom creates a separate reusable back design.
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["reskin", "custom"] as const).map((option) => {
              const selected = mode === option;

              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Use ${option} card back mode`}
                  disabled={busy}
                  onPress={() => onChangeMode(option)}
                  style={{
                    flex: 1,
                    minHeight: 44,
                    borderRadius: 10,
                    borderCurve: "continuous",
                    borderWidth: 1,
                    borderColor: selected ? "#151820" : "#d8dbe2",
                    backgroundColor: selected ? "#151820" : "#ffffff",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: busy ? 0.68 : 1,
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
                    {option === "reskin" ? "Reskin" : "Custom"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ gap: 7 }}>
            <Text selectable={false} style={{ color: "#343a44", fontSize: 12, fontWeight: "900" }}>
              Back Concept
            </Text>
            <TextInput
              accessibilityLabel="Card back concept"
              value={request}
              onChangeText={onChangeRequest}
              multiline
              placeholder={mode === "reskin" ? "black marble and gold ink" : "cosmic map with ivory frame"}
              placeholderTextColor="#9aa1ad"
              style={{
                minHeight: 70,
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
              accessibilityLabel={showComposedPrompt ? "Hide card back prompt" : "Show card back prompt"}
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
                {showComposedPrompt ? "Hide prompt" : "Show prompt"}
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
              accessibilityLabel="Cancel card back generation"
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
              accessibilityLabel="Generate card back"
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
              {busy ? <ActivityIndicator color="#ffffff" /> : <Sparkles size={18} color="#ffffff" strokeWidth={2.5} />}
              <GenerationButtonLabel busy={busy} idleLabel="Generate" />
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
  initialMode,
  onChange,
  onGenerateSubjectMask,
  subjectMaskBusy,
  subjectMaskStatus,
  subjectMaskError,
  subjectMaskComponents,
  subjectMaskToggleBusy,
  onToggleSubjectMaskComponent,
  onAddSubjectMask,
  onPickPhoto,
  onGenerateArt,
  onClose,
}: {
  visible: boolean;
  card: CardDraft;
  initialMode: ArtAdjustmentInitialMode;
  onChange: (patch: Partial<CardDraft>) => void;
  onGenerateSubjectMask: (targetPrompt?: string) => void;
  subjectMaskBusy: boolean;
  subjectMaskStatus: string | null;
  subjectMaskError: string | null;
  subjectMaskComponents: SubjectMaskComponent[];
  subjectMaskToggleBusy: boolean;
  onToggleSubjectMaskComponent: (concept: string) => void;
  onAddSubjectMask: (concept: string) => void;
  onPickPhoto: () => void;
  onGenerateArt: () => void;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const faceCard = getEditableCardFace(card);
  const artUri = faceCard.artUri;
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const [addSubjectPrompt, setAddSubjectPrompt] = useState("");
  // Artwork vs Mask view: each shows only its own controls.
  const [adjustMode, setAdjustMode] = useState<ArtAdjustmentInitialMode>(initialMode);
  const [maskPreviewUri, setMaskPreviewUri] = useState<string | null>(faceCard.artSubjectMaskUri ?? null);
  const subjectMaskEnabled = faceCard.artSubjectMaskDisabled !== true;
  const maskOverlayVisible = adjustMode === "mask" && subjectMaskEnabled && Boolean(maskPreviewUri);
  const [maskTargetPrompt, setMaskTargetPrompt] = useState("");
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
  const artTransform = normalizeArtTransformForVisibleRect(
    faceCard.artTransform ?? DEFAULT_ART_TRANSFORM,
    artRect,
    imageAspectRatio,
  );
  const fittedImageLayout = getCoverFittedImageLayout(cropWidth, cropHeight, imageAspectRatio);
  const transformedImageLayerStyle = {
    position: "absolute" as const,
    left: fittedImageLayout.left,
    top: fittedImageLayout.top,
    width: fittedImageLayout.width,
    height: fittedImageLayout.height,
    transform: [
      { translateX: artTransform.offsetX * coordinateScale },
      { translateY: artTransform.offsetY * coordinateScale },
      { scale: artTransform.scale },
    ],
  };
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
    if (!visible) {
      return;
    }

    panStartTransform.current = artTransform;
    pinchStartTransform.current = artTransform;
    setMaskPreviewUri(faceCard.artSubjectMaskUri ?? null);
    setAdjustMode(initialMode);
  }, [artUri, initialMode, visible]);

  useEffect(() => {
    if (visible) {
      setMaskPreviewUri(faceCard.artSubjectMaskUri ?? null);
    }
  }, [faceCard.artSubjectMaskUri, visible]);

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

  const scaleArt = (scaleDelta: number) => {
    updateArtTransform({
      ...artTransform,
      scale: artTransform.scale + scaleDelta,
    });
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
          <ScrollView
            style={{ flex: 1, width: "100%" }}
            contentContainerStyle={{
              minHeight: height,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 24,
              paddingVertical: 40,
              gap: 18,
            }}
            keyboardShouldPersistTaps="always"
          >
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
                  ...transformedImageLayerStyle,
                  opacity: 0.26,
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
                  style={transformedImageLayerStyle}
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
                {maskOverlayVisible && maskPreviewUri && adjustMode === "mask" ? (
                  <View
                    pointerEvents="none"
                    style={{
                      ...transformedImageLayerStyle,
                      opacity: 0.46,
                    }}
                  >
                    <Image
                      accessibilityIgnoresInvertColors
                      source={{ uri: maskPreviewUri }}
                      resizeMode={fittedImageLayout.resizeMode}
                      style={{
                        width: "100%",
                        height: "100%",
                        tintColor: "#55dff5",
                      }}
                    />
                  </View>
                ) : null}
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
                    borderColor: maskOverlayVisible ? "#55dff5" : "#ffffff",
                    backgroundColor: maskOverlayVisible ? "rgba(85, 223, 245, 0.08)" : "transparent",
                    boxShadow: "0 18px 42px rgba(0, 0, 0, 0.36)",
                  }}
                />
              </GestureDetector>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignSelf: "center",
                gap: 8,
                padding: 4,
                borderRadius: 999,
                borderCurve: "continuous",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
              }}
            >
              {(["crop", "mask"] as const).map((mode) => {
                const active = adjustMode === mode;
                return (
                  <Pressable
                    key={mode}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      setAdjustMode(mode);
                      if (mode === "mask") {
                        setMaskPreviewUri(faceCard.artSubjectMaskUri ?? null);
                      }
                    }}
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 8,
                      borderRadius: 999,
                      borderCurve: "continuous",
                      backgroundColor: active ? "#ffffff" : "transparent",
                    }}
                  >
                    <Text
                      selectable={false}
                      style={{ color: active ? "#151820" : "rgba(255, 255, 255, 0.7)", fontSize: 13, fontWeight: "900" }}
                    >
                      {mode === "crop" ? "Artwork" : "Mask"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {adjustMode === "mask" ? (
              <Pressable
                accessibilityRole="switch"
                accessibilityLabel="Enable subject mask compositing"
                accessibilityState={{ checked: subjectMaskEnabled, disabled: !faceCard.artSubjectMaskUri }}
                disabled={!faceCard.artSubjectMaskUri}
                onPress={() => {
                  onChange(toDfcFacePatch(cardRef.current, {
                    artSubjectMaskDisabled: subjectMaskEnabled,
                  }));
                }}
                style={({ pressed }) => ({
                  width: cropWidth,
                  minHeight: 48,
                  borderRadius: 14,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: subjectMaskEnabled ? "rgba(85, 223, 245, 0.62)" : "rgba(255, 255, 255, 0.24)",
                  backgroundColor: subjectMaskEnabled
                    ? "rgba(85, 223, 245, 0.16)"
                    : pressed
                      ? "rgba(255, 255, 255, 0.14)"
                      : "rgba(255, 255, 255, 0.08)",
                  opacity: faceCard.artSubjectMaskUri ? 1 : 0.52,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                })}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text selectable={false} style={{ color: "#e6f7fb", fontSize: 12, fontWeight: "900" }}>
                    SUBJECT MASK COMPOSITING
                  </Text>
                  <Text selectable={false} style={{ color: "rgba(230, 247, 251, 0.66)", fontSize: 11, lineHeight: 15, fontWeight: "700" }}>
                    {faceCard.artSubjectMaskUri
                      ? "Toggle the foreground cutout without deleting the saved alpha matte."
                      : "Generate a subject mask before enabling compositing."}
                  </Text>
                </View>
                <View
                  style={{
                    width: 46,
                    height: 26,
                    borderRadius: 999,
                    borderCurve: "continuous",
                    backgroundColor: subjectMaskEnabled && faceCard.artSubjectMaskUri ? "#31d0e0" : "rgba(255, 255, 255, 0.22)",
                    padding: 3,
                    alignItems: subjectMaskEnabled && faceCard.artSubjectMaskUri ? "flex-end" : "flex-start",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: "#ffffff",
                    }}
                  />
                </View>
              </Pressable>
            ) : null}
            {adjustMode === "mask" ? (
              <View
                style={{
                  width: cropWidth,
                  borderRadius: 16,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.24)",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  gap: 6,
                }}
              >
                <Text selectable={false} style={{ color: "#d9eef4", fontSize: 11, fontWeight: "900" }}>
                  MASK TARGET
                </Text>
                <TextInput
                  value={maskTargetPrompt}
                  onChangeText={setMaskTargetPrompt}
                  placeholder="Optional: sword, wings, face, blue flame"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!subjectMaskBusy}
                  style={{
                    minHeight: 40,
                    borderRadius: 12,
                    borderCurve: "continuous",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.22)",
                    backgroundColor: "rgba(255, 255, 255, 0.12)",
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: "800",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                />
                <Text selectable={false} style={{ color: "rgba(255, 255, 255, 0.62)", fontSize: 11, lineHeight: 15, fontWeight: "700" }}>
                  Leave blank for the normal foreground matte. Add a phrase to use fal.ai SAM semantic segmentation.
                </Text>
              </View>
            ) : null}
            <View
              style={{
	                flexDirection: "row",
	                flexWrap: "wrap",
	                alignItems: "center",
	                justifyContent: "center",
	                gap: 10,
              }}
            >
              {adjustMode === "crop" ? (
              <View
                style={{
                  height: 46,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.38)",
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  overflow: "hidden",
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Zoom image out"
                  hitSlop={6}
                  onPress={() => scaleArt(-scaleStep)}
                  style={{
                    width: 46,
                    height: 46,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Minus size={18} color="#ffffff" strokeWidth={2.8} />
                </Pressable>
                <Text selectable={false} style={{ color: "#ffffff", fontSize: 14, fontWeight: "800" }}>
                  {Math.round(artTransform.scale * 100)}%
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Zoom image in"
                  hitSlop={6}
                  onPress={() => scaleArt(scaleStep)}
                  style={{
                    width: 46,
                    height: 46,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Plus size={18} color="#ffffff" strokeWidth={2.8} />
                </Pressable>
              </View>
              ) : null}
              {adjustMode === "mask" ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={subjectMaskBusy ? "Generating target mask" : "Generate target mask"}
                  accessibilityState={{ busy: subjectMaskBusy }}
                  disabled={subjectMaskBusy}
                  onPress={() => onGenerateSubjectMask(maskTargetPrompt)}
                  style={({ pressed }) => ({
                    minHeight: 46,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: subjectMaskBusy ? "rgba(85, 223, 245, 0.78)" : "rgba(255, 255, 255, 0.38)",
                    backgroundColor: subjectMaskBusy
                      ? "rgba(85, 223, 245, 0.2)"
                      : pressed
                        ? "rgba(255, 255, 255, 0.2)"
                        : "rgba(255, 255, 255, 0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 14,
                    flexDirection: "row",
                    gap: 7,
                    opacity: subjectMaskBusy ? 0.78 : 1,
                  })}
                >
                  {subjectMaskBusy ? (
                    <ActivityIndicator color="#b7f6ff" />
                  ) : (
                    <Layers size={17} color="#ffffff" strokeWidth={2.5} />
                  )}
                  <Text
                    selectable={false}
                    style={{
                      color: subjectMaskBusy ? "#b7f6ff" : "#ffffff",
                      fontSize: 14,
                      fontWeight: "800",
                    }}
                  >
                    {subjectMaskBusy ? "Masking" : "Generate target mask"}
                  </Text>
                </Pressable>
              ) : null}
              {(subjectMaskStatus || subjectMaskError) && adjustMode === "mask" ? (
                <View
                  style={{
                    width: "100%",
                    maxWidth: cropWidth,
                    borderRadius: 12,
                    borderCurve: "continuous",
                    borderWidth: 1,
                    borderColor: subjectMaskError ? "rgba(255, 179, 171, 0.72)" : "rgba(85, 223, 245, 0.44)",
                    backgroundColor: subjectMaskError ? "rgba(180, 35, 24, 0.24)" : "rgba(85, 223, 245, 0.14)",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    selectable
                    style={{
                      color: subjectMaskError ? "#ffd4ce" : "#b7f6ff",
                      fontSize: 12,
                      lineHeight: 17,
                      fontWeight: "800",
                      textAlign: "center",
                    }}
                  >
                    {subjectMaskError ?? subjectMaskStatus}
                  </Text>
                </View>
              ) : null}
              {subjectMaskComponents.length > 0 && adjustMode === "mask" ? (
                <View
                  style={{
                    width: "100%",
                    maxWidth: cropWidth,
                    borderRadius: 14,
                    borderCurve: "continuous",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    backgroundColor: "rgba(7, 11, 18, 0.72)",
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    gap: 8,
                  }}
                >
                  <Text selectable={false} style={{ color: "#e6f7fb", fontSize: 11, fontWeight: "900" }}>
                    SUBJECTS IN MASK
                  </Text>
                  <Text selectable={false} style={{ color: "rgba(230, 247, 251, 0.66)", fontSize: 11, lineHeight: 15, fontWeight: "700" }}>
                    Tap a subject to include or exclude it from the mask.
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {subjectMaskComponents.map((component) => (
                      <Pressable
                        key={component.concept}
                        accessibilityRole="button"
                        accessibilityState={{ selected: component.enabled, disabled: subjectMaskToggleBusy }}
                        accessibilityLabel={`${component.enabled ? "Remove" : "Add"} ${component.concept}`}
                        disabled={subjectMaskToggleBusy}
                        onPress={() => onToggleSubjectMaskComponent(component.concept)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 999,
                          borderCurve: "continuous",
                          borderWidth: 1.5,
                          borderColor: component.enabled ? "#31d0e0" : "rgba(255, 255, 255, 0.28)",
                          backgroundColor: component.enabled ? "rgba(49, 208, 224, 0.22)" : "rgba(255, 255, 255, 0.04)",
                          opacity: subjectMaskToggleBusy ? 0.6 : 1,
                        }}
                      >
                        {component.enabled ? (
                          <Check size={14} color="#9bedf7" strokeWidth={3} />
                        ) : (
                          <Plus size={14} color="rgba(255, 255, 255, 0.6)" strokeWidth={3} />
                        )}
                        <Text
                          selectable={false}
                          style={{
                            color: component.enabled ? "#e6f7fb" : "rgba(255, 255, 255, 0.66)",
                            fontSize: 13,
                            fontWeight: "800",
                            textTransform: "capitalize",
                          }}
                        >
                          {component.concept}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <TextInput
                      value={addSubjectPrompt}
                      onChangeText={setAddSubjectPrompt}
                      editable={!subjectMaskBusy}
                      placeholder="Add another subject…"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      onSubmitEditing={() => {
                        const value = addSubjectPrompt.trim();
                        if (value && !subjectMaskBusy) {
                          onAddSubjectMask(value);
                          setAddSubjectPrompt("");
                        }
                      }}
                      style={{
                        flex: 1,
                        color: "#ffffff",
                        fontSize: 13,
                        fontWeight: "700",
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        borderRadius: 999,
                        borderCurve: "continuous",
                        borderWidth: 1,
                        borderColor: "rgba(255, 255, 255, 0.24)",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                      }}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Add subject to mask"
                      disabled={subjectMaskBusy || addSubjectPrompt.trim().length === 0}
                      onPress={() => {
                        const value = addSubjectPrompt.trim();
                        if (value && !subjectMaskBusy) {
                          onAddSubjectMask(value);
                          setAddSubjectPrompt("");
                        }
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 14,
                        paddingVertical: 9,
                        borderRadius: 999,
                        borderCurve: "continuous",
                        backgroundColor: "#31d0e0",
                        opacity: subjectMaskBusy || addSubjectPrompt.trim().length === 0 ? 0.5 : 1,
                      }}
                    >
                      {subjectMaskBusy ? (
                        <ActivityIndicator color="#04222b" />
                      ) : (
                        <Plus size={15} color="#04222b" strokeWidth={3} />
                      )}
                      <Text selectable={false} style={{ color: "#04222b", fontSize: 13, fontWeight: "900" }}>
                        Add
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
              {adjustMode !== "mask" ? (
                <>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Pick replacement image"
                    onPress={onPickPhoto}
                    style={{
                      minHeight: 46,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: "rgba(255, 255, 255, 0.38)",
                      backgroundColor: "rgba(255, 255, 255, 0.12)",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 14,
                      flexDirection: "row",
                      gap: 7,
                    }}
                  >
                    <Upload size={17} color="#ffffff" strokeWidth={2.5} />
                    <Text selectable={false} style={{ color: "#ffffff", fontSize: 14, fontWeight: "800" }}>
                      Pick photo
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Regenerate replacement art"
                    onPress={onGenerateArt}
                    style={{
                      minHeight: 46,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: "rgba(255, 255, 255, 0.38)",
                      backgroundColor: "rgba(255, 255, 255, 0.12)",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 14,
                      flexDirection: "row",
                      gap: 7,
                    }}
                  >
                    <Palette size={17} color="#ffffff" strokeWidth={2.5} />
                    <Text selectable={false} style={{ color: "#ffffff", fontSize: 14, fontWeight: "800" }}>
                      Regenerate
                    </Text>
                  </Pressable>
                </>
              ) : null}
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
          </ScrollView>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function FlatCardExportRenderHost({
  target,
  containerRef,
  nativeID,
  customBacks,
}: {
  target: FlatCardExportTarget | null;
  containerRef: RefObject<View | null>;
  nativeID: string;
  customBacks: CustomCardBackEntry[];
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
        id={nativeID}
        nativeID={nativeID}
        testID={nativeID}
        collapsable={false}
        style={{ width: renderWidth, height: renderHeight, backgroundColor: "transparent" }}
      >
        {target.kind === "back" ? (
          <CardBackPreview cardBackId={target.cardBackId} customBacks={customBacks} width={renderWidth} />
        ) : (
          <CardPreview
            card={target.card}
            activeSection={null}
            width={renderWidth}
            exportMode
            exportFlattenMasks={target.flattenMasksExport}
            footerOwnerName={target.footerOwnerName}
            initialArtImageAspectRatio={target.artImageAspectRatio}
            onSectionPress={noopCardPreviewHandler}
            onChange={noopCardPreviewHandler}
          />
        )}
      </View>
    </View>
  );
}

function WebPhotoExportModal({
  exportFile,
  onClose,
  onActionComplete,
}: {
  exportFile: WebPhotoExport | null;
  onClose: () => void;
  onActionComplete: (result: Extract<WebFileActionResult, "shared" | "saved" | "opened">) => void;
}) {
  if (!exportFile) {
    return null;
  }

  const shareAvailable = Platform.OS === "web" && hasWebShareApi();
  const preferShare = shouldPreferWebFileShare() && shareAvailable;
  const closeWithResult = (result: WebFileActionResult) => {
    onClose();

    if (result !== "cancelled") {
      onActionComplete(result);
    }
  };
  const handlePrimaryAction = async () => {
    let result: WebFileActionResult = "cancelled";

    try {
      if (preferShare || shareAvailable) {
        result = await shareOrDownloadWebPng(exportFile.fileName, exportFile.dataUri);
      } else {
        result = openWebImageInNewTab(exportFile.fileName, exportFile.dataUri);
      }
    } finally {
      closeWithResult(result);
    }
  };
  const handleSecondaryShare = async () => {
    let result: WebFileActionResult = "cancelled";

    try {
      result = await shareOrDownloadWebPng(exportFile.fileName, exportFile.dataUri);
    } finally {
      closeWithResult(result);
    }
  };
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
            onPress={handlePrimaryAction}
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
              onPress={handleSecondaryShare}
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

function ExportConfirmationToast({
  toast,
  onDismiss,
}: {
  toast: ExportConfirmationToastState | null;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = setTimeout(() => onDismiss(toast.id), 2100);

    return () => clearTimeout(timeoutId);
  }, [onDismiss, toast]);

  if (!toast) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 20,
        right: 20,
        bottom: 104,
        zIndex: 120,
        alignItems: "center",
      }}
    >
      <View
        style={{
          maxWidth: 340,
          borderRadius: 14,
          borderCurve: "continuous",
          backgroundColor: "#141821",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.16)",
          paddingVertical: 12,
          paddingHorizontal: 16,
          shadowColor: "#000000",
          shadowOpacity: 0.26,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
          elevation: 18,
        }}
      >
        <Text
          selectable={false}
          style={{
            color: "#ffffff",
            fontSize: 14,
            fontWeight: "900",
            textAlign: "center",
          }}
        >
          {toast.message}
        </Text>
      </View>
    </View>
  );
}

function DeleteUndoToast({
  undo,
  onUndo,
  onDismiss,
}: {
  undo: DeleteUndoState | null;
  onUndo: (undo: DeleteUndoState) => void;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    if (!undo) {
      return;
    }

    const timeoutId = setTimeout(() => onDismiss(undo.id), 6500);

    return () => clearTimeout(timeoutId);
  }, [onDismiss, undo]);

  if (!undo) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 104,
        zIndex: 125,
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 390,
          minHeight: 54,
          borderRadius: 16,
          borderCurve: "continuous",
          backgroundColor: "#141821",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.16)",
          paddingVertical: 9,
          paddingHorizontal: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          shadowColor: "#000000",
          shadowOpacity: 0.26,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
          elevation: 18,
        }}
      >
        <Text
          selectable={false}
          numberOfLines={2}
          style={{
            flex: 1,
            color: "#ffffff",
            fontSize: 13,
            lineHeight: 17,
            fontWeight: "900",
          }}
        >
          {undo.message}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Undo delete"
          onPress={() => onUndo(undo)}
          style={{
            minHeight: 36,
            borderRadius: 999,
            borderCurve: "continuous",
            backgroundColor: "#ffffff",
            paddingHorizontal: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Undo2 size={16} color="#151820" strokeWidth={2.7} />
          <Text selectable={false} style={{ color: "#151820", fontSize: 13, fontWeight: "900" }}>
            Undo
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function ReturnToTopButton({
  bottomInset,
  onPress,
}: {
  bottomInset: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Return to top"
      onPress={onPress}
      style={{
        position: "absolute",
        right: 18,
        bottom: BOTTOM_TAB_BAR_HEIGHT + bottomInset + 22,
        zIndex: 116,
        width: 44,
        height: 44,
        borderRadius: 22,
        borderCurve: "continuous",
        backgroundColor: "#151820",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.18)",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000000",
        shadowOpacity: 0.24,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 9 },
        elevation: 16,
      }}
    >
      <ArrowUp size={21} color="#ffffff" strokeWidth={2.8} />
    </Pressable>
  );
}

function AuthToast({
  toast,
  onDismiss,
}: {
  toast: AuthToastState | null;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = setTimeout(() => onDismiss(toast.id), 1800);

    return () => clearTimeout(timeoutId);
  }, [onDismiss, toast]);

  if (!toast) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 20,
        right: 20,
        top: 92,
        zIndex: 130,
        alignItems: "center",
      }}
    >
      <View
        style={{
          maxWidth: 300,
          borderRadius: 14,
          borderCurve: "continuous",
          backgroundColor: "#111820",
          borderWidth: 1,
          borderColor: "rgba(114, 230, 255, 0.34)",
          paddingVertical: 11,
          paddingHorizontal: 15,
          shadowColor: "#000000",
          shadowOpacity: 0.22,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 9 },
          elevation: 18,
        }}
      >
        <Text
          selectable={false}
          style={{
            color: "#ffffff",
            fontSize: 13,
            fontWeight: "900",
            textAlign: "center",
          }}
        >
          {toast.message}
        </Text>
      </View>
    </View>
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

function SavedCardPromptModal({
  prompt,
  onKeepEditing,
  onStartNewCard,
}: {
  prompt: { cardName: string; setName: string } | null;
  onKeepEditing: () => void;
  onStartNewCard: () => void;
}) {
  if (!prompt) {
    return null;
  }

  return (
    <Modal transparent animationType="fade" visible={Boolean(prompt)} onRequestClose={onKeepEditing}>
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
            maxWidth: 380,
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
          <View style={{ gap: 5 }}>
            <Text selectable style={{ color: "#11151c", fontSize: 21, fontWeight: "900" }}>
              Card saved
            </Text>
            <Text selectable style={{ color: "#5f6570", fontSize: 14, lineHeight: 19, fontWeight: "700" }}>
              {prompt.cardName} was saved to {prompt.setName}. Start a new card or keep editing this one?
            </Text>
          </View>

          <View style={{ gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start new card"
              onPress={onStartNewCard}
              style={{
                minHeight: 48,
                borderRadius: 10,
                borderCurve: "continuous",
                backgroundColor: "#151820",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                paddingHorizontal: 14,
              }}
            >
              <Plus size={18} color="#ffffff" strokeWidth={2.5} />
              <Text selectable={false} style={{ color: "#ffffff", fontSize: 14, fontWeight: "900" }}>
                Start new card
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Keep editing saved card"
              onPress={onKeepEditing}
              style={{
                minHeight: 46,
                borderRadius: 10,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: "#d8dbe2",
                backgroundColor: "#f8f9fb",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 14,
              }}
            >
              <Text selectable={false} style={{ color: "#20242d", fontSize: 14, fontWeight: "900" }}>
                Keep editing
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type SaveCardChoiceModalPrompt = {
  cardName: string;
  setName: string;
  targetSetId: string;
  overwriteSnapshotId: string | null;
  overwriteLabel: string;
};

function SaveCardChoiceModal({
  prompt,
  onOverwrite,
  onSaveNew,
  onClose,
}: {
  prompt: SaveCardChoiceModalPrompt | null;
  onOverwrite: (prompt: SaveCardChoiceModalPrompt) => void;
  onSaveNew: (prompt: SaveCardChoiceModalPrompt) => void;
  onClose: () => void;
}) {
  if (!prompt) {
    return null;
  }

  return (
    <Modal transparent animationType="fade" visible={Boolean(prompt)} onRequestClose={onClose}>
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
            maxWidth: 380,
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
          <View style={{ gap: 5 }}>
            <Text selectable style={{ color: "#11151c", fontSize: 21, fontWeight: "900" }}>
              Save card
            </Text>
            <Text selectable style={{ color: "#5f6570", fontSize: 14, lineHeight: 19, fontWeight: "700" }}>
              Save {prompt.cardName} to {prompt.setName} by overwriting the saved snapshot, or keep the existing card and save this draft as a new card.
            </Text>
          </View>

          <View style={{ gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={prompt.overwriteLabel}
              onPress={() => onOverwrite(prompt)}
              style={{
                minHeight: 48,
                borderRadius: 10,
                borderCurve: "continuous",
                backgroundColor: "#151820",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                paddingHorizontal: 14,
              }}
            >
              <Save size={18} color="#ffffff" strokeWidth={2.5} />
              <Text selectable={false} style={{ color: "#ffffff", fontSize: 14, fontWeight: "900" }}>
                {prompt.overwriteLabel}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save as new card"
              onPress={() => onSaveNew(prompt)}
              style={{
                minHeight: 46,
                borderRadius: 10,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: "#d8dbe2",
                backgroundColor: "#f8f9fb",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                paddingHorizontal: 14,
              }}
            >
              <Plus size={18} color="#20242d" strokeWidth={2.5} />
              <Text selectable={false} style={{ color: "#20242d", fontSize: 14, fontWeight: "900" }}>
                Save as new card
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel save"
              onPress={onClose}
              style={{
                minHeight: 44,
                borderRadius: 10,
                borderCurve: "continuous",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 14,
              }}
            >
              <Text selectable={false} style={{ color: "#68707d", fontSize: 14, fontWeight: "900" }}>
                Cancel
              </Text>
            </Pressable>
          </View>
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

type TabContentErrorBoundaryProps = {
  resetKey: InspectorTab;
  children: ReactNode;
  onRepairSavedSets: () => void;
};

type TabContentErrorBoundaryState = {
  failed: boolean;
  autoRepairAttempted: boolean;
};

class TabContentErrorBoundary extends Component<TabContentErrorBoundaryProps, TabContentErrorBoundaryState> {
  state: TabContentErrorBoundaryState = { failed: false, autoRepairAttempted: false };

  static getDerivedStateFromError(state: TabContentErrorBoundaryState): TabContentErrorBoundaryState {
    return { ...state, failed: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("CardMagic tab render failed.", error, errorInfo.componentStack);

    if (!this.state.autoRepairAttempted) {
      logStorageWarning("Tab render boundary triggered saved-set auto-repair.", {
        message: error.message,
        resetKey: this.props.resetKey,
      });
      this.props.onRepairSavedSets();
      this.setState({ failed: false, autoRepairAttempted: true });
    }
  }

  componentDidUpdate(previousProps: TabContentErrorBoundaryProps) {
    if (
      previousProps.resetKey !== this.props.resetKey &&
      (this.state.failed || this.state.autoRepairAttempted)
    ) {
      this.setState({ failed: false, autoRepairAttempted: false });
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <TabScreen title="Unable to load tab" subtitle="Stored card data needs to be normalized before rendering">
          <View style={{ gap: 8 }}>
            <Text selectable={false} style={{ color: "#151820", fontSize: 16, fontWeight: "900" }}>
              This tab hit invalid saved data.
            </Text>
            <Text selectable style={{ color: "#68707d", fontSize: 13, lineHeight: 19, fontWeight: "700" }}>
              Use the repair action to rewrite saved set records through the current schema normalizer.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Repair saved sets"
              onPress={() => {
                this.props.onRepairSavedSets();
                this.setState({ failed: false });
              }}
              style={{
                minHeight: 44,
                borderRadius: 8,
                borderCurve: "continuous",
                backgroundColor: "#151820",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 14,
                marginTop: 4,
              }}
            >
              <Text selectable={false} style={{ color: "#ffffff", fontSize: 14, fontWeight: "900" }}>
                Repair saved sets
              </Text>
            </Pressable>
          </View>
        </TabScreen>
      );
    }

    return this.props.children;
  }
}

type SafeCardThumbnailProps = {
  card: CardDraft;
  width: number;
  cornerRadius: number;
  footerOwnerName?: string;
};

type LazySafeCardThumbnailProps = SafeCardThumbnailProps & {
  deferFullPreview?: boolean;
};

function LazySafeCardThumbnail({
  card,
  width,
  cornerRadius,
  footerOwnerName,
  deferFullPreview = false,
}: LazySafeCardThumbnailProps) {
  const nativeIdRef = useRef(`cardmagic-set-thumbnail-${Math.random().toString(36).slice(2, 10)}`);
  const [shouldMountFullPreview, setShouldMountFullPreview] = useState(!deferFullPreview);

  useEffect(() => {
    if (!deferFullPreview) {
      setShouldMountFullPreview(true);
      return;
    }

    setShouldMountFullPreview(false);
  }, [card, deferFullPreview]);

  useEffect(() => {
    if (
      shouldMountFullPreview ||
      !deferFullPreview ||
      Platform.OS !== "web" ||
      typeof document === "undefined" ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const element = document.getElementById(nativeIdRef.current);

    if (!element) {
      setShouldMountFullPreview(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldMountFullPreview(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin: CARDMAGIC_SET_THUMBNAIL_LAZY_ROOT_MARGIN, threshold: 0.01 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [deferFullPreview, shouldMountFullPreview]);

  return (
    <View nativeID={nativeIdRef.current}>
      {shouldMountFullPreview ? (
        <SafeCardThumbnail
          card={card}
          width={width}
          cornerRadius={cornerRadius}
          footerOwnerName={footerOwnerName}
        />
      ) : (
        <CardThumbnailFallback
          card={card}
          width={width}
          cornerRadius={cornerRadius}
          statusLabel="Preview loading"
        />
      )}
    </View>
  );
}

class SafeCardThumbnail extends Component<SafeCardThumbnailProps, TabContentErrorBoundaryState> {
  state: TabContentErrorBoundaryState = { failed: false, autoRepairAttempted: false };

  static getDerivedStateFromError(state: TabContentErrorBoundaryState): TabContentErrorBoundaryState {
    return { ...state, failed: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("CardMagic card thumbnail render failed.", error, errorInfo.componentStack);
  }

  componentDidUpdate(previousProps: SafeCardThumbnailProps) {
    if (previousProps.card !== this.props.card && this.state.failed) {
      this.setState({ failed: false, autoRepairAttempted: false });
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <CardThumbnailFallback
          card={this.props.card}
          width={this.props.width}
          cornerRadius={this.props.cornerRadius}
        />
      );
    }

    return (
      <CardPreview
        card={this.props.card}
        activeSection={null}
        width={this.props.width}
        cornerRadius={this.props.cornerRadius}
        footerOwnerName={this.props.footerOwnerName}
        onSectionPress={noopCardPreviewHandler}
        onChange={noopCardPreviewHandler}
      />
    );
  }
}

function CardThumbnailFallback({
  card,
  width,
  cornerRadius,
  statusLabel = "Preview repaired",
}: {
  card: CardDraft;
  width: number;
  cornerRadius: number;
  statusLabel?: string;
}) {
  const height = width / CARD_BACK_PREVIEW_ASPECT_RATIO;
  const face = getEditableCardFace(card);

  return (
    <View
      style={{
        width,
        height,
        borderRadius: cornerRadius,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: "#c9ced8",
        backgroundColor: "#f4f6f9",
        overflow: "hidden",
        padding: Math.max(5, Math.round(width * 0.07)),
        justifyContent: "space-between",
      }}
    >
      <View style={{ gap: 2 }}>
        <Text selectable={false} numberOfLines={2} style={{ color: "#151820", fontSize: Math.max(8, width * 0.105), lineHeight: Math.max(10, width * 0.125), fontWeight: "900" }}>
          {face.name || "Untitled Card"}
        </Text>
        <Text selectable={false} numberOfLines={2} style={{ color: "#596273", fontSize: Math.max(7, width * 0.075), lineHeight: Math.max(9, width * 0.095), fontWeight: "800" }}>
          {face.typeLine || "Card"}
        </Text>
      </View>
      <Text selectable={false} numberOfLines={1} style={{ color: "#8a93a3", fontSize: Math.max(6, width * 0.065), fontWeight: "900", textTransform: "uppercase" }}>
        {statusLabel}
      </Text>
    </View>
  );
}

function TabScreen({
  title,
  subtitle,
  children,
  fullWidth = false,
  framed = true,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  fullWidth?: boolean;
  framed?: boolean;
}) {
  return (
    <View style={{ width: "100%", maxWidth: fullWidth ? undefined : 560, gap: 14 }}>
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
      {framed ? (
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
      ) : (
        children
      )}
    </View>
  );
}

function BottomTabBar({
  activeTab,
  bottomInset,
  onSelectTab,
}: {
  activeTab: InspectorTab;
  bottomInset: number;
  onSelectTab: (tab: VisibleInspectorTab) => void;
}) {
  const tabs = [
    ["edit", "Edit", Palette],
    ["sets", "Sets", BookOpen],
    ["community", "Community", Users],
  ] as const;
  const selectedIndex = Math.max(0, tabs.findIndex(([tab]) => tab === activeTab));
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const bubbleX = useSharedValue(0);
  const indicatorX = useSharedValue(0);
  const tabBarPadding = 3;
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
        minHeight: BOTTOM_TAB_BAR_HEIGHT + bottomInset,
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 5 + bottomInset,
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
          padding: 3,
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
                pointerEvents: "none",
              },
              bubbleStyle,
            ]}
          >
            <LinearGradient
              pointerEvents="none"
              colors={["#141821", "#24324c"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, pointerEvents: "none" }}
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
                bottom: 7,
                left: 0,
                width: indicatorWidth,
                height: 2,
                borderRadius: 999,
                backgroundColor: "#50d6ff",
                zIndex: 3,
                pointerEvents: "none",
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
        minHeight: 44,
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

function PreviewToolbarGrabber({ orientation }: { orientation: PreviewToolbarOrientation }) {
  const horizontal = orientation === "horizontal";
  const lineWidth = horizontal ? 14 : 18;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={{
        width: horizontal ? PREVIEW_ACTION_GRABBER_SIZE : PREVIEW_ACTION_BUTTON_SIZE,
        height: horizontal ? PREVIEW_ACTION_BUTTON_SIZE : PREVIEW_ACTION_GRABBER_SIZE,
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
      }}
    >
      {[0, 1, 2].map((line) => (
        <View
          key={line}
          style={{
            width: lineWidth,
            height: 2,
            borderRadius: 999,
            backgroundColor: "#9aa1ad",
            opacity: 0.82,
          }}
        />
      ))}
    </View>
  );
}

function TopShareMenu({
  open,
  onToggle,
  onClose,
  onStartNewCard,
  onRandomizeCard,
  onShareToCommunity,
  onExportCurrentCardImage,
  onExportCurrentCardJson,
  hasSelectedSet,
  onExportSelectedSetJson,
  onExportSelectedSetBatch,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onStartNewCard: () => void;
  onRandomizeCard: () => void;
  onShareToCommunity: () => void;
  onExportCurrentCardImage: () => void;
  onExportCurrentCardJson: () => void;
  hasSelectedSet: boolean;
  onExportSelectedSetJson: () => void;
  onExportSelectedSetBatch: () => void;
}) {
  const runAndClose = (action: () => void) => {
    onClose();
    action();
  };

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
            label="Start new card without saving"
            icon={<Plus size={18} color="#20242d" strokeWidth={2.4} />}
            onPress={() => runAndClose(onStartNewCard)}
          />
          <CardSettingsAction
            label="Randomize card"
            icon={<Shuffle size={18} color="#20242d" strokeWidth={2.4} />}
            onPress={() => runAndClose(onRandomizeCard)}
          />
          <CardSettingsAction
            label={Platform.OS === "web" ? "Download card photo" : "Save card photo"}
            icon={<Download size={18} color="#20242d" strokeWidth={2.4} />}
            onPress={() => runAndClose(onExportCurrentCardImage)}
          />
          <CardSettingsAction
            label="Download card JSON"
            icon={<Database size={18} color="#20242d" strokeWidth={2.4} />}
            onPress={() => runAndClose(onExportCurrentCardJson)}
          />
          {hasSelectedSet ? (
            <>
              <CardSettingsAction
                label="Download set JSON"
                icon={<Download size={18} color="#20242d" strokeWidth={2.4} />}
                onPress={() => runAndClose(onExportSelectedSetJson)}
              />
              <CardSettingsAction
                label="Download set batch"
                icon={<Layers size={18} color="#20242d" strokeWidth={2.4} />}
                onPress={() => runAndClose(onExportSelectedSetBatch)}
              />
            </>
          ) : null}
          <CardSettingsAction
            label="Share card to community"
            icon={<Users size={18} color="#20242d" strokeWidth={2.4} />}
            onPress={() => runAndClose(onShareToCommunity)}
          />
        </View>
      ) : null}
    </View>
  );
}

function PhysicalBackActionsMenu({
  width,
  onChangeBack,
  onClose,
}: {
  width: number;
  onChangeBack: () => void;
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
      </View>
    </View>
  );
}

function CardEditMenu({
  open,
  menuWidth,
  showMenu = true,
  typeFrame,
  activeSection,
  sheetSection,
  onToggle,
  onSelectSection,
}: {
  open: boolean;
  menuWidth: number;
  showMenu?: boolean;
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

      {open && showMenu ? (
        <View
          style={{
            position: "absolute",
            right: PREVIEW_ACTION_BUTTON_SIZE + 10,
            bottom: 0,
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

function CardEditMenuPanel({
  menuWidth,
  typeFrame,
  activeSection,
  sheetSection,
  onSelectSection,
}: {
  menuWidth: number;
  typeFrame: NonNullable<CardDraft["typeFrame"]> | "standard";
  activeSection: CardSection | null;
  sheetSection: CardSection | null;
  onSelectSection: (section: CardSection) => void;
}) {
  return (
    <View
      style={{
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
  );
}

function FrameChangeMenuPanel({
  menuWidth,
  maxHeight,
  frameIdentity,
  selectedFrameTreatment,
  selectedShowcaseFrame,
  compatibleFrameTreatments,
  onToggle,
  onChangeFrameTreatment,
  onChangeShowcaseFrame,
}: {
  menuWidth: number;
  maxHeight?: number;
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
  const frameMenuMaxHeight = maxHeight ?? Math.min(432, Math.max(240, viewportHeight * 0.52));

  return (
    <View
      style={{
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
          ? VISIBLE_SHOWCASE_FRAME_ORDER.map((showcaseFrame) => ({
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
            gap: FRAME_STYLE_PREVIEW_GRID_GAP,
            justifyContent: "center",
            paddingRight: FRAME_STYLE_PREVIEW_SCROLL_PADDING_RIGHT,
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
        width: FRAME_STYLE_PREVIEW_BUTTON_WIDTH,
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
        width: FRAME_STYLE_PREVIEW_BUTTON_WIDTH,
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

function getInviteUsernameSearchQuery(value: string) {
  const trimmed = value.trim();

  if (!trimmed || trimmed.includes(" ")) {
    return null;
  }

  if (/^[^@\s]+@/.test(trimmed)) {
    return null;
  }

  const usernameQuery = trimmed.replace(/^@+/, "").replace(/[^A-Za-z0-9_]/g, "");

  if (usernameQuery.length < 2) {
    return null;
  }

  return usernameQuery;
}

function SetsPanel({
  sets,
  selectedSetId,
  newSetName,
  customCardBacks,
  generatedSetSymbols,
  footerOwnerName,
  canRefreshSets,
  setsRefreshing,
  canInviteSetCollaborators,
  onRefreshSets,
  onChangeNewSetName,
  onSelectSet,
  onCreateSet,
  onRenameSet,
  onChangeSetCode,
  onCreateCardInSet,
  onOpenCardFromSet,
  onRemoveCardFromSet,
  onRemoveSet,
  onChangeSetCardBack,
  onChangeSetDefaultSymbol,
  onPickSetSymbol,
  onGenerateSetSymbol,
  onFetchSetCollaborators,
  onFetchPendingInvites,
  onInviteSetCollaborator,
}: {
  sets: CardSet[];
  selectedSetId: string;
  newSetName: string;
  customCardBacks: CustomCardBackEntry[];
  generatedSetSymbols: GeneratedSetSymbolEntry[];
  footerOwnerName: string;
  canRefreshSets: boolean;
  setsRefreshing: boolean;
  canInviteSetCollaborators: boolean;
  onRefreshSets: () => void;
  onChangeNewSetName: (name: string) => void;
  onSelectSet: (setId: string) => void;
  onCreateSet: () => void;
  onRenameSet: (setId: string, name: string) => void;
  onChangeSetCode: (setId: string, code: string) => void;
  onCreateCardInSet: (setId: string) => void;
  onOpenCardFromSet: (setId: string, snapshot: SetCardSnapshot) => void;
  onRemoveCardFromSet: (setId: string, cardId: string) => void;
  onRemoveSet: (setId: string) => void;
  onChangeSetCardBack: (setId: string, cardBackId: CardBackId) => void;
  onChangeSetDefaultSymbol: (
    setId: string,
    patch: Pick<CardDraft, "setSymbolPreset" | "setSymbolId" | "setSymbolUri" | "setSymbolUsesRarityTreatment">,
  ) => void;
  onPickSetSymbol: (setId: string) => void;
  onGenerateSetSymbol: (setId: string) => void;
  onFetchSetCollaborators: (setId: string) => Promise<CollaborationSetMemberPayload[]>;
  onFetchPendingInvites: (setId: string) => Promise<CollaborationPendingInvitePayload[]>;
  onInviteSetCollaborator: (setId: string, inviteIdentifier: string) => Promise<void>;
}) {
  const { width: viewportWidth } = useWindowDimensions();
  const compactWebViewport = Platform.OS === "web" && viewportWidth <= 700;
  const [expandedSetIds, setExpandedSetIds] = useState<Set<string>>(() => new Set([selectedSetId]));
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editingSetDefaultsPanel, setEditingSetDefaultsPanel] = useState<"cardBack" | "setSymbol" | null>(null);
  const [editingSetName, setEditingSetName] = useState("");
  const [editingSetCode, setEditingSetCode] = useState("");
  const [invitingSetId, setInvitingSetId] = useState<string | null>(null);
  const [inviteIdentifier, setInviteIdentifier] = useState("");
  const [inviteBusySetId, setInviteBusySetId] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccessMessage, setInviteSuccessMessage] = useState<string | null>(null);
  const [inviteSuggestions, setInviteSuggestions] = useState<CollaborationInviteProfileSuggestion[]>([]);
  const [inviteSuggestionsLoading, setInviteSuggestionsLoading] = useState(false);
  const [inviteSuggestionsSuppressedFor, setInviteSuggestionsSuppressedFor] = useState<string | null>(null);
  const [inviteSendingSlow, setInviteSendingSlow] = useState(false);
  const [collaboratorsBySetId, setCollaboratorsBySetId] = useState<Record<string, CollaborationSetMemberPayload[]>>({});
  const [collaboratorsLoadingSetId, setCollaboratorsLoadingSetId] = useState<string | null>(null);
  const [collaboratorsErrorBySetId, setCollaboratorsErrorBySetId] = useState<Record<string, string>>({});
  const [pendingInvitesBySetId, setPendingInvitesBySetId] = useState<Record<string, CollaborationPendingInvitePayload[]>>({});
  const [pendingInvitesLoadingSetId, setPendingInvitesLoadingSetId] = useState<string | null>(null);
  const [pendingInvitesErrorBySetId, setPendingInvitesErrorBySetId] = useState<Record<string, string>>({});
  const [visibleCardLimits, setVisibleCardLimits] = useState<Record<string, number>>({});
  const [measuredGridContentWidth, setMeasuredGridContentWidth] = useState(0);
  const gridGap = 8;
  const gridContentWidth = Math.max(220, measuredGridContentWidth || viewportWidth - 52);
  const forceTwoColumnMobile = gridContentWidth < 430;
  const minimumGridItemWidth = forceTwoColumnMobile ? 118 : 168;
  const gridColumns = forceTwoColumnMobile
    ? 2
    : Math.max(1, Math.floor((gridContentWidth + gridGap) / (minimumGridItemWidth + gridGap)));
  const gridItemWidth = Math.floor((gridContentWidth - gridGap * (gridColumns - 1)) / gridColumns);
  const previewWidth = Math.max(96, gridItemWidth);
  const blankCardHeight = previewWidth / CARD_BACK_PREVIEW_ASPECT_RATIO;

  const handleGridLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.floor(event.nativeEvent.layout.width);

    setMeasuredGridContentWidth((current) => (Math.abs(current - nextWidth) > 1 ? nextWidth : current));
  }, []);

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

  const openSetEditMode = useCallback((set: CardSet, panel: "cardBack" | "setSymbol" | null = null) => {
    onSelectSet(set.id);
    setExpandedSetIds(new Set([set.id]));
    setEditingSetId(set.id);
    setEditingSetDefaultsPanel(panel);
    setEditingSetName(set.name);
    setEditingSetCode(normalizeSetCode(set.code, set.name));
  }, [onSelectSet]);

  const closeSetEditMode = useCallback((setId: string) => {
    const nextName = editingSetName.trim();

    if (nextName) {
      onRenameSet(setId, nextName);
    }

    onChangeSetCode(setId, editingSetCode);

    setEditingSetId(null);
    setEditingSetDefaultsPanel(null);
    setEditingSetName("");
    setEditingSetCode("");
  }, [editingSetCode, editingSetName, onChangeSetCode, onRenameSet]);

  const loadSetCollaborators = useCallback(async (setId: string) => {
    setCollaboratorsLoadingSetId(setId);
    setCollaboratorsErrorBySetId((current) => {
      const next = { ...current };

      delete next[setId];

      return next;
    });

    try {
      const collaborators = await onFetchSetCollaborators(setId);

      setCollaboratorsBySetId((current) => ({
        ...current,
        [setId]: collaborators,
      }));
    } catch (error) {
      setCollaboratorsErrorBySetId((current) => ({
        ...current,
        [setId]: error instanceof Error ? error.message : "CardMagic could not load collaborators.",
      }));
    } finally {
      setCollaboratorsLoadingSetId((current) => (current === setId ? null : current));
    }
  }, [onFetchSetCollaborators]);

  const loadPendingInvites = useCallback(async (setId: string) => {
    setPendingInvitesLoadingSetId(setId);
    setPendingInvitesErrorBySetId((current) => {
      const next = { ...current };

      delete next[setId];

      return next;
    });

    try {
      const pendingInvites = await onFetchPendingInvites(setId);

      setPendingInvitesBySetId((current) => ({
        ...current,
        [setId]: pendingInvites,
      }));
    } catch (error) {
      setPendingInvitesErrorBySetId((current) => ({
        ...current,
        [setId]: error instanceof Error ? error.message : "CardMagic could not load pending invites.",
      }));
    } finally {
      setPendingInvitesLoadingSetId((current) => (current === setId ? null : current));
    }
  }, [onFetchPendingInvites]);

  const openSetInvitePanel = useCallback((setId: string) => {
    if (!canInviteSetCollaborators) {
      Alert.alert("Sign in required", "Sign in before inviting collaborators to a set.");
      return;
    }

    const shouldOpen = invitingSetId !== setId;

    onSelectSet(setId);
    setExpandedSetIds(new Set([setId]));
    setInvitingSetId(shouldOpen ? setId : null);
    setInviteIdentifier("");
    setInviteError(null);
    setInviteSuccessMessage(null);
    setInviteSuggestions([]);
    setInviteSuggestionsLoading(false);
    setInviteSuggestionsSuppressedFor(null);
    setInviteSendingSlow(false);

    if (shouldOpen) {
      void loadSetCollaborators(setId);
      void loadPendingInvites(setId);
    }
  }, [canInviteSetCollaborators, invitingSetId, loadPendingInvites, loadSetCollaborators, onSelectSet]);

  const submitSetInvite = useCallback(async (setId: string, setName: string) => {
    const identifier = inviteIdentifier.trim();

    if (!identifier) {
      setInviteError("Enter an email address or username.");
      return;
    }

    setInviteBusySetId(setId);
    setInviteError(null);
    setInviteSuccessMessage(null);
    setInviteSendingSlow(false);
    const slowTimer = setTimeout(() => setInviteSendingSlow(true), 1200);

    try {
      await onInviteSetCollaborator(setId, identifier);
      setInviteIdentifier("");
      setInviteSuggestions([]);
      setInviteSuggestionsSuppressedFor(null);
      setInviteSuccessMessage(`Invitation queued for ${identifier} on ${setName}.`);
      void loadSetCollaborators(setId);
      void loadPendingInvites(setId);
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : "CardMagic could not invite that collaborator.");
    } finally {
      clearTimeout(slowTimer);
      setInviteBusySetId(null);
      setInviteSendingSlow(false);
    }
  }, [inviteIdentifier, loadPendingInvites, loadSetCollaborators, onInviteSetCollaborator]);

  useEffect(() => {
    const query = getInviteUsernameSearchQuery(inviteIdentifier);

    if (!invitingSetId || !canInviteSetCollaborators || !query || inviteIdentifier === inviteSuggestionsSuppressedFor) {
      setInviteSuggestions([]);
      setInviteSuggestionsLoading(false);
      return;
    }

    let cancelled = false;

    const timeoutId = setTimeout(() => {
      if (cancelled) {
        return;
      }

      setInviteSuggestionsLoading(true);
      void searchCollaborationInviteProfiles(query)
        .then((suggestions) => {
          if (cancelled) {
            return;
          }

          setInviteSuggestions(suggestions);
        })
        .catch((error) => {
          if (!cancelled) {
            console.warn("Unable to load invite username suggestions.", error);
            setInviteSuggestions([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setInviteSuggestionsLoading(false);
          }
        });
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [canInviteSetCollaborators, inviteIdentifier, inviteSuggestionsSuppressedFor, invitingSetId]);

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
    <View style={{ gap: 14 }}>
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text
            selectable
            style={{ flex: 1, color: "#5f6470", fontSize: 12, fontWeight: "800", textTransform: "uppercase" }}
          >
            Saved Sets
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh saved sets"
            disabled={!canRefreshSets || setsRefreshing}
            onPress={onRefreshSets}
            style={{
              minHeight: 34,
              borderRadius: 8,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: canRefreshSets ? "#d4d8e0" : "#e2e5ea",
              backgroundColor: canRefreshSets ? "#ffffff" : "#f1f3f6",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 7,
              paddingHorizontal: 10,
              opacity: setsRefreshing ? 0.74 : 1,
            }}
          >
            {setsRefreshing ? (
              <ActivityIndicator color="#0b7180" size="small" />
            ) : (
              <RefreshCw size={15} color={canRefreshSets ? "#151820" : "#8b92a0"} strokeWidth={2.5} />
            )}
            <Text
              selectable={false}
              numberOfLines={1}
              style={{
                color: canRefreshSets ? "#151820" : "#8b92a0",
                fontSize: 12,
                fontWeight: "900",
              }}
            >
              Refresh sets
            </Text>
          </Pressable>
        </View>

        {sets.map((set) => {
          const selected = set.id === selectedSetId;
          const expanded = expandedSetIds.has(set.id);
          const setCardBackId = set.cardBackId ?? DEFAULT_CARD_BACK_ID;
          const setCardBackOption = getCardBackOption(setCardBackId, customCardBacks);
          const setBarGradient = getSetBarGradient(set);
          const isEditingSet = editingSetId === set.id;
          const visibleCardLimit = visibleCardLimits[set.id] ?? SET_GRID_INITIAL_CARD_LIMIT;
          const visibleSetCards = set.cards.slice(0, visibleCardLimit);
          const hiddenCardCount = Math.max(0, set.cards.length - visibleSetCards.length);
          const collaborators = collaboratorsBySetId[set.id] ?? [];
          const collaboratorsLoading = collaboratorsLoadingSetId === set.id;
          const collaboratorsError = collaboratorsErrorBySetId[set.id];
          const pendingInvites = pendingInvitesBySetId[set.id] ?? [];
          const pendingInvitesLoading = pendingInvitesLoadingSetId === set.id;
          const pendingInvitesError = pendingInvitesErrorBySetId[set.id];
          const collaboratorPanelLoading = collaboratorsLoading || pendingInvitesLoading;
          const collaboratorPanelError = collaboratorsError ?? pendingInvitesError;
          const collaboratorRowCount = collaborators.length + pendingInvites.length;
          const sharedSetLabel = set.ownerUserId
            ? `Shared by ${set.ownerName ?? "another user"}${set.collaborationRole ? ` - ${set.collaborationRole}` : ""}`
            : null;

          return (
            <View
              key={set.id}
              style={{
                gap: 8,
              }}
            >
              <View
                style={{
                  minHeight: 52,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  borderRadius: 10,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: selected ? "#151820" : "rgba(21,24,32,0.12)",
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
                      {normalizeSetCode(set.code, set.name)} - {set.cards.length} {set.cards.length === 1 ? "card" : "cards"}
                      {sharedSetLabel ? ` - ${sharedSetLabel}` : ""}
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Invite collaborators to ${set.name}`}
                  accessibilityState={{ expanded: invitingSetId === set.id }}
                  hitSlop={6}
                  onPress={(event) => {
                    event.stopPropagation();
                    openSetInvitePanel(set.id);
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.28)",
                    backgroundColor: invitingSetId === set.id ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.14)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <UserPlus size={16} color="#ffffff" strokeWidth={2.35} />
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

              {invitingSetId === set.id ? (
                <View
                  style={{
                    borderRadius: 9,
                    borderCurve: "continuous",
                    borderWidth: 1,
                    borderColor: inviteError ? "#f1bcc4" : "#b7ecf4",
                    backgroundColor: inviteError ? "#fff5f6" : "#f2fcfd",
                    padding: 10,
                    gap: 8,
                  }}
                >
                  <Text
                    selectable={false}
                    style={{
                      color: inviteError ? "#a62231" : "#0b7180",
                      fontSize: 11,
                      fontWeight: "900",
                      textTransform: "uppercase",
                    }}
                  >
                    Invite collaborator
                  </Text>
                  <View style={{ flexDirection: viewportWidth >= 560 ? "row" : "column", gap: 8 }}>
                    <TextInput
                      accessibilityLabel={`Invite email or username for ${set.name}`}
                      value={inviteIdentifier}
                      onChangeText={(identifier) => {
                        setInviteIdentifier(identifier);
                        setInviteError(null);
                        setInviteSuccessMessage(null);
                        setInviteSuggestionsSuppressedFor(null);
                      }}
                      placeholder="friend@example.com or @username"
                      placeholderTextColor="#68707d"
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="default"
                      onSubmitEditing={() => void submitSetInvite(set.id, set.name)}
                      returnKeyType="send"
                      style={{
                        flex: 1,
                        minHeight: 42,
                        borderRadius: 8,
                        borderCurve: "continuous",
                        borderWidth: 1,
                        borderColor: "#d4d8e0",
                        backgroundColor: "#ffffff",
                        color: "#151820",
                        fontSize: 14,
                        fontWeight: "800",
                        paddingHorizontal: 10,
                      }}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Send ${set.name} collaboration invite`}
                      disabled={inviteBusySetId === set.id}
                      onPress={() => void submitSetInvite(set.id, set.name)}
                      style={{
                        minHeight: 42,
                        borderRadius: 8,
                        borderCurve: "continuous",
                        backgroundColor: inviteBusySetId === set.id ? "#8aa7ad" : "#151820",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        gap: 8,
                        paddingHorizontal: 14,
                      }}
                    >
                      {inviteBusySetId === set.id ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <UserPlus size={16} color="#ffffff" strokeWidth={2.4} />
                      )}
                      <Text selectable={false} style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>
                        Send invite
                      </Text>
                    </Pressable>
                  </View>
                  {inviteSuggestionsLoading || inviteSuggestions.length > 0 ? (
                    <View
                      style={{
                        borderRadius: 8,
                        borderCurve: "continuous",
                        borderWidth: 1,
                        borderColor: "#d4d8e0",
                        backgroundColor: "#ffffff",
                        overflow: "hidden",
                      }}
                    >
                      {inviteSuggestionsLoading ? (
                        <View style={{ minHeight: 40, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <ActivityIndicator color="#0b7180" size="small" />
                          <Text selectable={false} style={{ color: "#68707d", fontSize: 12, fontWeight: "800" }}>
                            Searching users
                          </Text>
                        </View>
                      ) : (
                        inviteSuggestions.map((suggestion, suggestionIndex) => (
                          <Pressable
                            key={suggestion.userId}
                            accessibilityRole="button"
                            accessibilityLabel={`Use ${suggestion.username} as the collaborator username`}
                            onPress={() => {
                              const inviteHandle = `@${suggestion.username}`;
                              setInviteIdentifier(inviteHandle);
                              setInviteSuggestions([]);
                              setInviteSuggestionsLoading(false);
                              setInviteSuggestionsSuppressedFor(inviteHandle);
                              setInviteError(null);
                              setInviteSuccessMessage(null);
                            }}
                            style={({ pressed }) => ({
                              minHeight: 42,
                              paddingHorizontal: 10,
                              paddingVertical: 7,
                              borderTopWidth: suggestionIndex === 0 ? 0 : 1,
                              borderTopColor: "#eef0f4",
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 9,
                              backgroundColor: pressed ? "#f2fcfd" : "#ffffff",
                            })}
                          >
                            <View
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 13,
                                backgroundColor: "#e9fbfd",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Users size={14} color="#0b7180" strokeWidth={2.5} />
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text selectable={false} numberOfLines={1} style={{ color: "#151820", fontSize: 13, fontWeight: "900" }}>
                                @{suggestion.username}
                              </Text>
                              {suggestion.displayName && suggestion.displayName !== suggestion.username ? (
                                <Text selectable={false} numberOfLines={1} style={{ color: "#68707d", fontSize: 11, fontWeight: "800" }}>
                                  {suggestion.displayName}
                                </Text>
                              ) : null}
                            </View>
                          </Pressable>
                        ))
                      )}
                    </View>
                  ) : null}
                  <View
                    style={{
                      borderRadius: 8,
                      borderCurve: "continuous",
                      borderWidth: 1,
                      borderColor: "#d4d8e0",
                      backgroundColor: "#ffffff",
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        minHeight: 40,
                        paddingHorizontal: 10,
                        paddingVertical: 7,
                        borderBottomWidth: collaboratorPanelLoading || collaboratorPanelError || collaboratorRowCount > 0 ? 1 : 0,
                        borderBottomColor: "#eef0f4",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Text
                        selectable={false}
                        style={{ flex: 1, color: "#151820", fontSize: 12, fontWeight: "900", textTransform: "uppercase" }}
                      >
                        Collaborators
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Refresh collaborators for ${set.name}`}
                        disabled={collaboratorPanelLoading}
                        onPress={() => {
                          void loadSetCollaborators(set.id);
                          void loadPendingInvites(set.id);
                        }}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: collaboratorPanelLoading ? "#eef0f4" : "#f2fcfd",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {collaboratorPanelLoading ? (
                          <ActivityIndicator color="#0b7180" size="small" />
                        ) : (
                          <RefreshCw size={14} color="#0b7180" strokeWidth={2.5} />
                        )}
                      </Pressable>
                    </View>
                    {collaboratorPanelLoading && collaboratorRowCount === 0 ? (
                      <View style={{ minHeight: 40, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <ActivityIndicator color="#0b7180" size="small" />
                        <Text selectable={false} style={{ color: "#68707d", fontSize: 12, fontWeight: "800" }}>
                          Loading collaborators
                        </Text>
                      </View>
                    ) : collaboratorPanelError ? (
                      <Text selectable style={{ paddingHorizontal: 10, paddingVertical: 9, color: "#a62231", fontSize: 12, fontWeight: "800" }}>
                        {collaboratorPanelError}
                      </Text>
                    ) : collaboratorRowCount > 0 ? (
                      <>
                        {collaborators.map((collaborator, collaboratorIndex) => {
                          const collaboratorHandle = collaborator.username ? `@${collaborator.username}` : null;
                          const collaboratorName = collaboratorHandle ?? collaborator.displayName ?? collaborator.memberName;
                          const secondaryLabel = [
                            collaborator.role,
                            collaborator.displayName && collaborator.displayName !== collaboratorName ? collaborator.displayName : null,
                            formatCompactCommentDate(collaborator.acceptedAt ?? collaborator.createdAt),
                          ].filter(Boolean).join(" - ");

                          return (
                            <View
                              key={collaborator.id}
                              style={{
                                minHeight: 42,
                                paddingHorizontal: 10,
                                paddingVertical: 7,
                                borderTopWidth: collaboratorIndex === 0 ? 0 : 1,
                                borderTopColor: "#eef0f4",
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 9,
                              }}
                            >
                              <View
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: 13,
                                  backgroundColor: collaborator.role === "owner" ? "#eef8f4" : "#e9fbfd",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Users size={14} color={collaborator.role === "owner" ? "#117b55" : "#0b7180"} strokeWidth={2.5} />
                              </View>
                              <View style={{ flex: 1, minWidth: 0 }}>
                                <Text selectable numberOfLines={1} style={{ color: "#151820", fontSize: 13, fontWeight: "900" }}>
                                  {collaboratorName}
                                </Text>
                                <Text selectable={false} numberOfLines={1} style={{ color: "#68707d", fontSize: 11, fontWeight: "800" }}>
                                  {secondaryLabel}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                        {pendingInvites.map((invite, inviteIndex) => {
                          const rowIndex = collaborators.length + inviteIndex;

                          return (
                            <View
                              key={`pending-${invite.id}`}
                              style={{
                                minHeight: 42,
                                paddingHorizontal: 10,
                                paddingVertical: 7,
                                borderTopWidth: rowIndex === 0 ? 0 : 1,
                                borderTopColor: "#eef0f4",
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 9,
                              }}
                            >
                              <View
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: 13,
                                  backgroundColor: "#fff5db",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <UserPlus size={14} color="#835c00" strokeWidth={2.5} />
                              </View>
                              <View style={{ flex: 1, minWidth: 0 }}>
                                <Text selectable numberOfLines={1} style={{ color: "#151820", fontSize: 13, fontWeight: "900" }}>
                                  {invite.invitedEmail}
                                </Text>
                                <Text selectable={false} numberOfLines={1} style={{ color: "#68707d", fontSize: 11, fontWeight: "800" }}>
                                  pending {invite.role} invite{formatCompactCommentDate(invite.createdAt) ? ` - ${formatCompactCommentDate(invite.createdAt)}` : ""}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                      </>
                    ) : (
                      <Text selectable={false} style={{ paddingHorizontal: 10, paddingVertical: 9, color: "#68707d", fontSize: 12, fontWeight: "800" }}>
                        No collaborators for this set yet.
                      </Text>
                    )}
                  </View>
                  {inviteError ? (
                    <Text selectable style={{ color: "#a62231", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
                      {inviteError}
                    </Text>
                  ) : inviteSuccessMessage ? (
                    <Text selectable={false} style={{ color: "#0b7180", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
                      {inviteSuccessMessage}
                    </Text>
                  ) : null}
                  {inviteSendingSlow && inviteBusySetId === set.id ? (
                    <Text selectable={false} style={{ color: "#68707d", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
                      Still sending the invite through Supabase...
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {expanded ? (
                <View style={{ gap: 10 }}>
                  <View
                    style={{
                      borderRadius: 9,
                      borderCurve: "continuous",
                      borderWidth: 1,
                      borderColor: "#d8dbe2",
                      backgroundColor: "#f7f8fb",
                      padding: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Change ${set.name} default card back`}
                      accessibilityState={{ expanded: isEditingSet && editingSetDefaultsPanel === "cardBack" }}
                      onPress={() => openSetEditMode(set, "cardBack")}
                      style={{
                        borderRadius: 8,
                        borderCurve: "continuous",
                        borderWidth: isEditingSet && editingSetDefaultsPanel === "cardBack" ? 2 : 0,
                        borderColor: "#151820",
                        padding: isEditingSet && editingSetDefaultsPanel === "cardBack" ? 2 : 0,
                      }}
                    >
                      <CardBackPreview
                        cardBackId={setCardBackId}
                        customBacks={customCardBacks}
                        width={44}
                      />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Change ${set.name} default set symbol`}
                      accessibilityState={{ expanded: isEditingSet && editingSetDefaultsPanel === "setSymbol" }}
                      onPress={() => openSetEditMode(set, "setSymbol")}
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 8,
                        borderCurve: "continuous",
                        borderWidth: isEditingSet && editingSetDefaultsPanel === "setSymbol" ? 2 : 1,
                        borderColor: isEditingSet && editingSetDefaultsPanel === "setSymbol" ? "#151820" : "#d4d8e0",
                        backgroundColor: "#ffffff",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <SetSymbolMark
                        presetId={set.setSymbolPreset ?? SET_SYMBOL_PRESETS[0].id}
                        imageUri={set.setSymbolUri}
                        usesRarityTreatment={set.setSymbolUsesRarityTreatment}
                        rarity="rare"
                        size={set.setSymbolUri && set.setSymbolUsesRarityTreatment ? 29 : 25}
                      />
                    </Pressable>
                    <View pointerEvents="none" style={{ flex: 1, minWidth: 0, gap: 2 }}>
                      <Text
                        selectable={false}
                        style={{
                          color: "#5f6470",
                          fontSize: 11,
                          fontWeight: "900",
                          textTransform: "uppercase",
                        }}
                      >
                        Set defaults - {normalizeSetCode(set.code, set.name)}
                      </Text>
                      <Text
                        selectable={false}
                        numberOfLines={1}
                        style={{
                          color: "#151820",
                          fontSize: 14,
                          fontWeight: "900",
                        }}
                      >
                        {setCardBackOption.label} back
                      </Text>
                      <Text
                        selectable={false}
                        numberOfLines={1}
                        style={{
                          color: "#68707d",
                          fontSize: 12,
                          fontWeight: "800",
                        }}
                      >
                        Cards inherit this back, set symbol, and set code.
                      </Text>
                    </View>
                  </View>

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
                          Set identity
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
                          <TextInput
                            accessibilityLabel={`Set code for ${set.name}`}
                            value={editingSetCode}
                            onChangeText={(code) =>
                              setEditingSetCode(
                                code
                                  .normalize("NFKD")
                                  .replace(/[\u0300-\u036f]/g, "")
                                  .toUpperCase()
                                  .replace(/[^A-Z0-9]/g, "")
                                  .slice(0, 5),
                              )
                            }
                            onSubmitEditing={() => closeSetEditMode(set.id)}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            maxLength={5}
                            returnKeyType="done"
                            style={{
                              width: 76,
                              minHeight: 42,
                              borderRadius: 8,
                              borderCurve: "continuous",
                              borderWidth: 1,
                              borderColor: "#d4d8e0",
                              backgroundColor: "#f7f8fb",
                              color: "#151820",
                              fontSize: 15,
                              fontWeight: "900",
                              letterSpacing: 0,
                              paddingHorizontal: 10,
                              textAlign: "center",
                            }}
                          />
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Save ${set.name} identity`}
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

                      {editingSetDefaultsPanel === "cardBack" ? (
                        <View>
                          <CardBackPicker
                            value={setCardBackId}
                            customBacks={customCardBacks}
                            showSummary={false}
                            onChange={(cardBackId) => {
                              onSelectSet(set.id);
                              setEditingSetId(set.id);
                              setEditingSetDefaultsPanel("cardBack");
                              onChangeSetCardBack(set.id, cardBackId ?? DEFAULT_CARD_BACK_ID);
                            }}
                          />
                        </View>
                      ) : null}

                      {editingSetDefaultsPanel === "setSymbol" ? (
                        <View style={{ gap: 10 }}>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Generate default set symbol for ${set.name}`}
                            onPress={() => {
                              onSelectSet(set.id);
                              setEditingSetId(set.id);
                              setEditingSetDefaultsPanel("setSymbol");
                              onGenerateSetSymbol(set.id);
                            }}
                            style={{
                              flexGrow: 1,
                              flexBasis: 148,
                              minHeight: 40,
                              borderRadius: 8,
                              borderCurve: "continuous",
                              backgroundColor: "#0b7180",
                              alignItems: "center",
                              justifyContent: "center",
                              flexDirection: "row",
                              gap: 8,
                              paddingHorizontal: 10,
                            }}
                          >
                            <Sparkles size={16} color="#ffffff" strokeWidth={2.4} />
                            <Text selectable={false} numberOfLines={1} adjustsFontSizeToFit style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>
                              Generate
                            </Text>
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Upload default set symbol for ${set.name}`}
                            onPress={() => {
                              onSelectSet(set.id);
                              setEditingSetId(set.id);
                              setEditingSetDefaultsPanel("setSymbol");
                              onPickSetSymbol(set.id);
                            }}
                            style={{
                              flexGrow: 1,
                              flexBasis: 148,
                              minHeight: 40,
                              borderRadius: 8,
                              borderCurve: "continuous",
                              backgroundColor: "#151820",
                              alignItems: "center",
                              justifyContent: "center",
                              flexDirection: "row",
                              gap: 8,
                              paddingHorizontal: 10,
                            }}
                          >
                            <Upload size={16} color="#ffffff" strokeWidth={2.4} />
                            <Text selectable={false} numberOfLines={1} adjustsFontSizeToFit style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>
                              Upload symbol
                            </Text>
                          </Pressable>
                        </View>

                        {generatedSetSymbols.length > 0 ? (
                          <View style={{ gap: 8 }}>
                            <Text selectable={false} style={{ color: "#5f6470", fontSize: 11, fontWeight: "900", textTransform: "uppercase" }}>
                              Custom icons
                            </Text>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                              {generatedSetSymbols.map((symbol) => {
                                const selectedSymbol =
                                  (set.setSymbolId && set.setSymbolId === symbol.id) ||
                                  (!set.setSymbolId && set.setSymbolUri === symbol.uri && set.setSymbolUsesRarityTreatment);

                                return (
                                  <Pressable
                                    key={symbol.id}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Use ${symbol.label} as ${set.name} default set symbol`}
                                    accessibilityState={{ selected: selectedSymbol }}
                                    onPress={() => {
                                      setEditingSetId(set.id);
                                      setEditingSetDefaultsPanel("setSymbol");
                                      onChangeSetDefaultSymbol(set.id, {
                                        setSymbolId: symbol.id,
                                        setSymbolUri: symbol.uri,
                                        setSymbolUsesRarityTreatment: true,
                                      });
                                    }}
                                    style={{
                                      width: 58,
                                      minHeight: 54,
                                      borderRadius: 8,
                                      borderCurve: "continuous",
                                      borderWidth: 1,
                                      borderColor: selectedSymbol ? "#151820" : "#d4d8e0",
                                      backgroundColor: selectedSymbol ? "#151820" : "#ffffff",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      padding: 6,
                                    }}
                                  >
                                    <SetSymbolMark imageUri={symbol.uri} usesRarityTreatment rarity="rare" size={28} />
                                    <Text
                                      selectable={false}
                                      numberOfLines={1}
                                      adjustsFontSizeToFit
                                      minimumFontScale={0.7}
                                      style={{
                                        color: selectedSymbol ? "#ffffff" : "#1f2530",
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
                          <Text selectable={false} style={{ color: "#5f6470", fontSize: 11, fontWeight: "900", textTransform: "uppercase" }}>
                            Preset icons
                          </Text>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ flexDirection: "row", gap: 8, paddingRight: 2 }}
                          >
                            {SET_SYMBOL_PRESETS.map((preset) => {
                              const selectedPreset = !set.setSymbolUri && (set.setSymbolPreset ?? SET_SYMBOL_PRESETS[0].id) === preset.id;

                              return (
                                <Pressable
                                  key={preset.id}
                                  accessibilityRole="button"
                                  accessibilityLabel={`Use ${preset.label} as ${set.name} default set symbol`}
                                  accessibilityState={{ selected: selectedPreset }}
                                  onPress={() => {
                                    setEditingSetId(set.id);
                                    setEditingSetDefaultsPanel("setSymbol");
                                    onChangeSetDefaultSymbol(set.id, {
                                      setSymbolPreset: preset.id,
                                      setSymbolId: undefined,
                                      setSymbolUri: undefined,
                                      setSymbolUsesRarityTreatment: undefined,
                                    });
                                  }}
                                  style={{
                                    width: 58,
                                    minHeight: 54,
                                    borderRadius: 8,
                                    borderCurve: "continuous",
                                    borderWidth: 1,
                                    borderColor: selectedPreset ? "#151820" : "#d4d8e0",
                                    backgroundColor: selectedPreset ? "#151820" : "#ffffff",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: 6,
                                  }}
                                >
                                  <SetSymbolMark presetId={preset.id} rarity="rare" size={24} />
                                  <Text
                                    selectable={false}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.7}
                                    style={{
                                      color: selectedPreset ? "#ffffff" : "#1f2530",
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
                          </ScrollView>
                        </View>
                      </View>
                      ) : null}
                    </View>
                  ) : null}

                  <View
                    onLayout={handleGridLayout}
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: gridGap,
                      alignItems: "flex-start",
                    }}
                  >
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
                    {visibleSetCards.map((snapshot, index) => {
                      const setCard = getSafeSetCardPreviewCard(snapshot, set);

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
                            <LazySafeCardThumbnail
                              card={setCard}
                              width={previewWidth}
                              cornerRadius={SET_CARD_THUMBNAIL_RADIUS}
                              footerOwnerName={footerOwnerName}
                              deferFullPreview={compactWebViewport && index >= SET_GRID_COMPACT_EAGER_PREVIEW_COUNT}
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

type CommunityBrowseMode = "cards" | "sets";
const COMMUNITY_CARD_PAGE_SIZE = 8;
const COMMUNITY_INITIAL_RENDERED_CARD_COUNT = 3;
const COMMUNITY_AUTO_LOAD_MORE_THRESHOLD = 420;
const COMMUNITY_SCROLL_WINDOW_UPDATE_THRESHOLD = 96;
const COMMUNITY_FEED_OVERSCAN_PX = 1200;
const COMMUNITY_FEED_ESTIMATED_CARD_ITEM_HEIGHT = 690;

function CommunityPanel({
  sets,
  accountUser,
  onRegisterMainScrollHandler,
  onExportCardImage,
}: {
  sets: CardSet[];
  accountUser: SupabaseUser | null;
  onRegisterMainScrollHandler?: (handler: MainScrollBoundaryHandler | null) => void;
  onExportCardImage: (card: CardDraft, cardName: string, footerOwnerName?: string, imageUrl?: string) => Promise<void>;
}) {
  const [browseMode, setBrowseMode] = useState<CommunityBrowseMode>("cards");
  const [searchText, setSearchText] = useState("");
  const [feedSort, setFeedSort] = useState<CommunityCardFeedSort>("newest");
  const [hideSeenCards, setHideSeenCards] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [communityCards, setCommunityCards] = useState<CommunityCardPayload[]>([]);
  const [communitySets, setCommunitySets] = useState<CommunitySetPayload[]>([]);
  const [selectedCommunitySetId, setSelectedCommunitySetId] = useState<string | null>(null);
  const [communitySetCardsBySetId, setCommunitySetCardsBySetId] = useState<Record<string, CommunitySetCardPayload[]>>({});
  const [communitySetCardsLoadingId, setCommunitySetCardsLoadingId] = useState<string | null>(null);
  const [communitySetCardsErrorBySetId, setCommunitySetCardsErrorBySetId] = useState<Record<string, string>>({});
  const [featuredCard, setFeaturedCard] = useState<CommunityCardPayload | null>(null);
  const [communityBusy, setCommunityBusy] = useState(false);
  const [communitySetsLoaded, setCommunitySetsLoaded] = useState(false);
  const [communityLoadingMore, setCommunityLoadingMore] = useState(false);
  const [communityHasMoreCards, setCommunityHasMoreCards] = useState(false);
  const [communityNextOffset, setCommunityNextOffset] = useState(0);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [commentPopoverCard, setCommentPopoverCard] = useState<CommunityCardPayload | null>(null);
  const [pollsPopoverOpen, setPollsPopoverOpen] = useState(false);
  const [feedbackPopoverOpen, setFeedbackPopoverOpen] = useState(false);
  const [communityScrollWindow, setCommunityScrollWindow] = useState<MainScrollWindow | null>(null);
  const communityCardsRef = useRef<CommunityCardPayload[]>([]);
  const featuredCardRef = useRef<CommunityCardPayload | null>(null);
  const communityAutoLoadInFlightRef = useRef(false);
  const communitySeenMarkIdsRef = useRef<Set<string>>(new Set());
  const communityScrollWindowRef = useRef<MainScrollWindow | null>(null);
  const canManageCommunityPolls = accountUser?.email?.toLowerCase() === "gtjoe51@gmail.com";
  const localCards = useMemo(
    () =>
      sets.flatMap((set) =>
        set.cards.slice(0, 6).map((snapshot) => ({
          id: snapshot.id,
          setName: set.name,
          card: getSafeSetCardPreviewCard(snapshot, set),
        })),
      ),
    [sets],
  );
  const normalizedSearchText = searchText.trim().toLowerCase();
  const filteredCommunityCards = useMemo(() => {
    if (!normalizedSearchText) {
      return communityCards;
    }

    return communityCards.filter((entry) => {
      const haystack = `${entry.name} ${entry.typeLine} ${entry.rarity ?? ""} ${entry.frameTreatment ?? ""}`.toLowerCase();
      return haystack.includes(normalizedSearchText);
    });
  }, [communityCards, normalizedSearchText]);
  const filteredSets = useMemo(() => {
    if (!normalizedSearchText) {
      return communitySets;
    }

    return communitySets.filter((set) => {
      const haystack = `${set.name} ${set.code ?? ""} ${set.authorName}`.toLowerCase();
      return haystack.includes(normalizedSearchText);
    });
  }, [communitySets, normalizedSearchText]);
  const loadCommunityCards = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setCommunityError("Supabase is not configured.");
      return;
    }

    setCommunityBusy(true);
    setCommunityLoadingMore(false);
    setCommunityError(null);

    try {
      const page = await fetchCommunityCards(COMMUNITY_CARD_PAGE_SIZE, 0, { sort: feedSort, hideSeen: hideSeenCards });
      setCommunityCards(page.cards);
      setCommunityHasMoreCards(page.hasMore);
      setCommunityNextOffset(page.nextOffset);

      void fetchCommunityFeaturedCard()
        .then(setFeaturedCard)
        .catch((error) => {
          console.warn("Unable to load weekly featured card.", error);
        });
    } catch (error) {
      setCommunityError(error instanceof Error ? error.message : "Unable to load community cards.");
    } finally {
      setCommunityBusy(false);
    }
  }, [feedSort, hideSeenCards]);

  const loadCommunitySets = useCallback(async () => {
    if (!isSupabaseConfigured || communitySetsLoaded) {
      return;
    }

    try {
      const directory = await fetchCommunitySets(24, 0);
      setCommunitySets(directory);
      setCommunitySetsLoaded(true);
    } catch (error) {
      console.warn("Unable to load community sets.", error);
    }
  }, [communitySetsLoaded]);

  const loadMoreCommunityCards = useCallback(async () => {
    if (communityBusy || communityLoadingMore || !communityHasMoreCards) {
      return;
    }

    setCommunityLoadingMore(true);
    setCommunityError(null);

    try {
      const page: CommunityCardPagePayload = await fetchCommunityCards(
        COMMUNITY_CARD_PAGE_SIZE,
        communityNextOffset,
        { sort: feedSort, hideSeen: hideSeenCards },
      );
      setCommunityCards((current) => {
        const existingIds = new Set(current.map((entry) => entry.id));
        const uniqueCards = page.cards.filter((entry) => !existingIds.has(entry.id));
        return [...current, ...uniqueCards];
      });
      setCommunityHasMoreCards(page.hasMore);
      setCommunityNextOffset(page.nextOffset);
    } catch (error) {
      setCommunityError(error instanceof Error ? error.message : "Unable to load more community cards.");
    } finally {
      setCommunityLoadingMore(false);
    }
  }, [communityBusy, communityHasMoreCards, communityLoadingMore, communityNextOffset, feedSort, hideSeenCards]);

  const handleCommunityMainScroll = useCallback<MainScrollBoundaryHandler>((event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const nextScrollWindow = {
      offsetY: Math.max(0, contentOffset.y),
      viewportHeight: Math.max(1, layoutMeasurement.height),
    };
    const previousScrollWindow = communityScrollWindowRef.current;

    if (
      !previousScrollWindow ||
      Math.abs(previousScrollWindow.offsetY - nextScrollWindow.offsetY) >= COMMUNITY_SCROLL_WINDOW_UPDATE_THRESHOLD ||
      Math.abs(previousScrollWindow.viewportHeight - nextScrollWindow.viewportHeight) >= 24
    ) {
      communityScrollWindowRef.current = nextScrollWindow;
      setCommunityScrollWindow(nextScrollWindow);
    }

    if (
      browseMode !== "cards" ||
      normalizedSearchText ||
      communityBusy ||
      communityLoadingMore ||
      !communityHasMoreCards ||
      communityCards.length === 0
    ) {
      return;
    }

    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);

    if (distanceFromBottom > COMMUNITY_AUTO_LOAD_MORE_THRESHOLD || communityAutoLoadInFlightRef.current) {
      return;
    }

    communityAutoLoadInFlightRef.current = true;
    void loadMoreCommunityCards().finally(() => {
      communityAutoLoadInFlightRef.current = false;
    });
  }, [
    browseMode,
    communityBusy,
    communityCards.length,
    communityHasMoreCards,
    communityLoadingMore,
    loadMoreCommunityCards,
    normalizedSearchText,
  ]);

  useEffect(() => {
    onRegisterMainScrollHandler?.(handleCommunityMainScroll);

    return () => {
      onRegisterMainScrollHandler?.(null);
    };
  }, [handleCommunityMainScroll, onRegisterMainScrollHandler]);

  useEffect(() => {
    communityCardsRef.current = communityCards;
  }, [communityCards]);

  useEffect(() => {
    featuredCardRef.current = featuredCard;
  }, [featuredCard]);

  const patchCommunityCard = useCallback((cardId: string, patch: Partial<CommunityCardPayload>) => {
    setCommunityCards((current) => current.map((entry) => entry.id === cardId ? { ...entry, ...patch } : entry));
    setFeaturedCard((current) => current?.id === cardId ? { ...current, ...patch } : current);
  }, []);

  const handleToggleCommunityLike = useCallback(async (cardId: string, liked: boolean) => {
    const currentCard =
      communityCardsRef.current.find((entry) => entry.id === cardId) ??
      (featuredCardRef.current?.id === cardId ? featuredCardRef.current : null);

    if (!currentCard) {
      return;
    }

    const nextLikeCount = Math.max(0, currentCard.likeCount + (liked ? 1 : -1));
    patchCommunityCard(cardId, { likedByViewer: liked, likeCount: nextLikeCount });

    try {
      await toggleCommunityCardLike(cardId, liked);
    } catch (error) {
      patchCommunityCard(cardId, {
        likedByViewer: currentCard.likedByViewer,
        likeCount: currentCard.likeCount,
      });
      Alert.alert("Community like unavailable", error instanceof Error ? error.message : "CardMagic could not update the like.");
    }
  }, [patchCommunityCard]);

  const handleToggleCommunityFollow = useCallback(async (userId: string, followed: boolean) => {
    const previousCards = communityCardsRef.current.filter((entry) => entry.userId === userId);
    const previousFeatured = featuredCardRef.current?.userId === userId ? featuredCardRef.current : null;

    setCommunityCards((current) => current.map((entry) => (
      entry.userId === userId ? { ...entry, followedByViewer: followed } : entry
    )));
    setFeaturedCard((current) => (
      current?.userId === userId ? { ...current, followedByViewer: followed } : current
    ));

    try {
      await toggleCommunityUserFollow(userId, followed);
    } catch (error) {
      setCommunityCards((current) => current.map((entry) => {
        const previous = previousCards.find((card) => card.id === entry.id);
        return previous ? { ...entry, followedByViewer: previous.followedByViewer } : entry;
      }));
      if (previousFeatured) {
        setFeaturedCard((current) => (
          current?.id === previousFeatured.id ? { ...current, followedByViewer: previousFeatured.followedByViewer } : current
        ));
      }
      Alert.alert("Follow unavailable", error instanceof Error ? error.message : "CardMagic could not update this follow.");
    }
  }, []);

  const openCommunityComments = useCallback((cardId: string) => {
    const currentCard =
      communityCardsRef.current.find((entry) => entry.id === cardId) ??
      (featuredCardRef.current?.id === cardId ? featuredCardRef.current : null);

    if (!currentCard) {
      return;
    }

    setCommentPopoverCard(currentCard);
  }, []);
  const handleCommunityCommentCountChange = useCallback((cardId: string, commentCount: number) => {
    patchCommunityCard(cardId, { commentCount });
  }, [patchCommunityCard]);

  const markVisibleCommunityCardsSeen = useCallback((cardIds: string[]) => {
    if (hideSeenCards || cardIds.length === 0) {
      return;
    }

    const unmarkedIds = Array.from(new Set(cardIds)).filter((cardId) => (
      !communitySeenMarkIdsRef.current.has(cardId)
    ));

    if (unmarkedIds.length === 0) {
      return;
    }

    for (const cardId of unmarkedIds) {
      communitySeenMarkIdsRef.current.add(cardId);
    }

    void markCommunityCardsSeen(unmarkedIds).catch((error) => {
      for (const cardId of unmarkedIds) {
        communitySeenMarkIdsRef.current.delete(cardId);
      }

      console.warn("Unable to mark rendered community cards seen.", error);
    });
  }, [hideSeenCards]);

  const openCommunitySet = useCallback((set: CommunitySetPayload) => {
    const nextSelectedSetId = selectedCommunitySetId === set.id ? null : set.id;
    setSelectedCommunitySetId(nextSelectedSetId);

    if (!nextSelectedSetId || communitySetCardsBySetId[set.id] || communitySetCardsLoadingId === set.id) {
      return;
    }

    setCommunitySetCardsLoadingId(set.id);
    setCommunitySetCardsErrorBySetId((current) => {
      const next = { ...current };
      delete next[set.id];
      return next;
    });

    void fetchCommunitySetCards(set.id)
      .then((cards) => {
        setCommunitySetCardsBySetId((current) => ({
          ...current,
          [set.id]: cards,
        }));
      })
      .catch((error) => {
        setCommunitySetCardsErrorBySetId((current) => ({
          ...current,
          [set.id]: error instanceof Error ? error.message : "Unable to load this set.",
        }));
      })
      .finally(() => {
        setCommunitySetCardsLoadingId((current) => current === set.id ? null : current);
      });
  }, [communitySetCardsBySetId, communitySetCardsLoadingId, selectedCommunitySetId]);

  useEffect(() => {
    void loadCommunityCards();
  }, [loadCommunityCards]);

  useEffect(() => {
    if (browseMode === "sets") {
      void loadCommunitySets();
    }
  }, [browseMode, loadCommunitySets]);

  return (
    <View style={{ width: "100%", maxWidth: 560, gap: 14 }}>
      <View
        style={{
          gap: 10,
          zIndex: 30,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
            <Text
              selectable
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ color: "#101318", fontSize: 32, fontWeight: "900" }}
            >
              Community
            </Text>
            <Text selectable style={{ color: "#606775", fontSize: 14, fontWeight: "700" }}>
              Browse shared cards and sets
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open community polls"
            onPress={() => setPollsPopoverOpen(true)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: pollsPopoverOpen ? "#0b7180" : "#d8dbe2",
              backgroundColor: pollsPopoverOpen ? "#151820" : "#ffffff",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000000",
              shadowOpacity: 0.08,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 5 },
            }}
          >
            <ListPlus size={18} color={pollsPopoverOpen ? "#ffffff" : "#151820"} strokeWidth={2.6} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open community feedback"
            onPress={() => setFeedbackPopoverOpen(true)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: feedbackPopoverOpen ? "#0b7180" : "#d8dbe2",
              backgroundColor: feedbackPopoverOpen ? "#151820" : "#ffffff",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000000",
              shadowOpacity: 0.08,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 5 },
            }}
          >
            <MessageCircle size={18} color={feedbackPopoverOpen ? "#ffffff" : "#151820"} strokeWidth={2.6} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh community feed"
            disabled={communityBusy}
            onPress={() => void loadCommunityCards()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: "#d8dbe2",
              backgroundColor: communityBusy ? "#eef1f5" : "#ffffff",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000000",
              shadowOpacity: 0.08,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 5 },
            }}
          >
            {communityBusy ? (
              <ActivityIndicator color="#0b7180" size="small" />
            ) : (
              <RefreshCw size={18} color="#151820" strokeWidth={2.6} />
            )}
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: 999,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: "#d8dbe2",
              backgroundColor: "#ffffff",
              paddingHorizontal: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 9,
            }}
          >
            <Search size={17} color="#68707d" strokeWidth={2.4} />
            <TextInput
              accessibilityLabel="Search community cards and sets"
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search community"
              placeholderTextColor="#68707d"
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                flex: 1,
                minHeight: 42,
                color: "#151820",
                fontSize: 14,
                fontWeight: "800",
                paddingVertical: 0,
              }}
            />
          </View>

          <View style={{ position: "relative" }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open community filter menu"
              accessibilityState={{ expanded: filterMenuOpen }}
              onPress={() => setFilterMenuOpen((current) => !current)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: filterMenuOpen || hideSeenCards || feedSort !== "newest" ? "#0b7180" : "#d8dbe2",
                backgroundColor: filterMenuOpen || hideSeenCards || feedSort !== "newest" ? "#151820" : "#ffffff",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000000",
                shadowOpacity: 0.08,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 5 },
              }}
            >
              <SlidersHorizontal
                size={18}
                color={filterMenuOpen || hideSeenCards || feedSort !== "newest" ? "#ffffff" : "#151820"}
                strokeWidth={2.6}
              />
            </Pressable>

            {filterMenuOpen ? (
              <View
                style={{
                  position: "absolute",
                  top: 50,
                  right: 0,
                  width: 220,
                  borderRadius: 14,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: "#d8dbe2",
                  backgroundColor: "#ffffff",
                  padding: 8,
                  gap: 6,
                  shadowColor: "#000000",
                  shadowOpacity: 0.16,
                  shadowRadius: 18,
                  shadowOffset: { width: 0, height: 12 },
                  zIndex: 50,
                }}
              >
                <Text selectable={false} style={{ color: "#68707d", fontSize: 11, fontWeight: "900", textTransform: "uppercase", paddingHorizontal: 8, paddingTop: 2 }}>
                  Feed order
                </Text>
                <CommunityMenuOptionButton
                  label="Newest"
                  selected={feedSort === "newest"}
                  onPress={() => {
                    setFeedSort("newest");
                    setFilterMenuOpen(false);
                  }}
                />
                <CommunityMenuOptionButton
                  label="Most liked"
                  selected={feedSort === "most_liked"}
                  onPress={() => {
                    setFeedSort("most_liked");
                    setFilterMenuOpen(false);
                  }}
                />
                <View style={{ height: 1, backgroundColor: "#eceef2", marginVertical: 2 }} />
                <CommunityMenuOptionButton
                  label="Hide seen cards"
                  selected={hideSeenCards}
                  onPress={() => setHideSeenCards((current) => !current)}
                />
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <WeeklyFeaturedCardPreview card={featuredCard} loading={communityBusy} />

      <View style={{ flexDirection: "row", gap: 8 }}>
        <CommunityModeButton
          label="Cards"
          selected={browseMode === "cards"}
          onPress={() => setBrowseMode("cards")}
        />
        <CommunityModeButton
          label="Sets"
          selected={browseMode === "sets"}
          onPress={() => setBrowseMode("sets")}
        />
      </View>

      <View
        style={{
          borderRadius: 12,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: "#d8dbe2",
          backgroundColor: "#ffffff",
          overflow: "hidden",
        }}
      >
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: "#eceef2",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Database size={17} color="#151820" strokeWidth={2.4} />
          <Text selectable={false} style={{ flex: 1, color: "#151820", fontSize: 14, fontWeight: "900" }}>
            {browseMode === "cards" ? "Card Feed" : "Set Directory"}
          </Text>
          <Text selectable={false} style={{ color: "#0b7180", fontSize: 11, fontWeight: "900", textTransform: "uppercase" }}>
            {communityBusy ? "Loading" : "Live"}
          </Text>
        </View>

        {communityError ? (
          <CommunityEmptyState
            icon={<Database size={24} color="#68707d" strokeWidth={2.4} />}
            title="Community feed unavailable"
            detail={communityError}
          />
        ) : browseMode === "cards" ? (
          <CommunityCardsPreview
            cards={filteredCommunityCards}
            localFallbackCards={localCards}
            feedResetKey={`${feedSort}:${hideSeenCards ? "hide-seen" : "all"}:${normalizedSearchText}`}
            scrollWindow={communityScrollWindow}
            hasMore={Boolean(!normalizedSearchText && communityCards.length > 0 && communityHasMoreCards)}
            loadingMore={communityLoadingMore}
            onVisibleCommunityCardIdsChange={markVisibleCommunityCardsSeen}
            onToggleLike={handleToggleCommunityLike}
            onToggleFollow={handleToggleCommunityFollow}
            onOpenComments={openCommunityComments}
            onExportCardImage={onExportCardImage}
          />
        ) : (
          <CommunitySetsPreview
            sets={filteredSets}
            selectedSetId={selectedCommunitySetId}
            cardsBySetId={communitySetCardsBySetId}
            loadingSetId={communitySetCardsLoadingId}
            errorBySetId={communitySetCardsErrorBySetId}
            onOpenSet={openCommunitySet}
            onExportCardImage={onExportCardImage}
          />
        )}
      </View>
      <CommunityCommentsPopover
        card={commentPopoverCard}
        onClose={() => setCommentPopoverCard(null)}
        onCommentCountChange={handleCommunityCommentCountChange}
      />
      <CommunityPollsPopover
        visible={pollsPopoverOpen}
        canCreatePolls={canManageCommunityPolls}
        onClose={() => setPollsPopoverOpen(false)}
      />
      <CommunityFeedbackPopover
        visible={feedbackPopoverOpen}
        accountUser={accountUser}
        onClose={() => setFeedbackPopoverOpen(false)}
      />
    </View>
  );
}

function WeeklyFeaturedCardPreview({
  card,
  loading,
}: {
  card: CommunityCardPayload | null;
  loading: boolean;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const previewWidth =
    windowWidth >= 900 ? 360 :
    windowWidth >= 620 ? 320 :
    Math.min(300, Math.max(232, windowWidth - 96));
  const previewAspectRatio = card ? getTypeFrameSpec(getPreviewTypeFrame(card.card)).aspectRatio : CARD_BACK_PREVIEW_ASPECT_RATIO;
  const reservedPreviewHeight = previewWidth / previewAspectRatio;

  return (
    <View
      style={{
        borderRadius: 12,
        borderCurve: "continuous",
        backgroundColor: "#101820",
        padding: 14,
        gap: 12,
        overflow: "hidden",
      }}
    >
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(80,214,255,0.2)", "rgba(255,255,255,0)", "rgba(255,208,98,0.14)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", inset: 0 }}
      />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "rgba(255,255,255,0.12)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Heart size={21} color="#ffffff" strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text selectable={false} style={{ color: "#ffffff", fontSize: 18, fontWeight: "900" }}>
            Weekly Featured Card
          </Text>
        </View>
      </View>

      {loading && !card ? (
        <View style={{ gap: 12, alignItems: "center" }}>
          <View
            style={{
              width: previewWidth,
              height: reservedPreviewHeight,
              borderRadius: 9,
              backgroundColor: "rgba(255,255,255,0.1)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.14)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActivityIndicator color="#6ed7e8" />
          </View>
          <View style={{ width: "100%", gap: 6, alignItems: "center" }}>
            <View style={{ width: "62%", height: 15, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.16)" }} />
            <View style={{ width: "46%", height: 12, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.12)" }} />
          </View>
        </View>
      ) : card ? (
        <View style={{ gap: 12, alignItems: "center" }}>
          {card.imageUrl ? (
            <Image
              source={{ uri: card.imageUrl }}
              resizeMode="contain"
              style={{
                width: previewWidth,
                height: previewWidth / previewAspectRatio,
                borderRadius: 9,
              }}
            />
          ) : (
            <CardPreview
              card={card.card}
              activeSection={null}
              width={previewWidth}
              cornerRadius={9}
              footerOwnerName={card.authorName}
              onSectionPress={noopCardPreviewHandler}
              onChange={noopCardPreviewHandler}
            />
          )}
          <View style={{ width: "100%", gap: 4 }}>
            <Text selectable={false} numberOfLines={1} style={{ color: "#ffffff", fontSize: 15, fontWeight: "900", textAlign: "center" }}>
              {card.name || "Untitled Card"}
            </Text>
            <Text selectable={false} numberOfLines={1} style={{ color: "rgba(255,255,255,0.72)", fontSize: 12, fontWeight: "800", textAlign: "center" }}>
              {card.authorName} · Level {card.authorLevel} · {card.likeCount} likes · {card.commentCount} comments
            </Text>
          </View>
        </View>
      ) : (
        <Text selectable={false} style={{ color: "rgba(255,255,255,0.72)", fontSize: 13, lineHeight: 18, fontWeight: "800" }}>
          No public cards are available for the weekly feature yet.
        </Text>
      )}
    </View>
  );
}

function CommunityModeButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Show community ${label.toLowerCase()}`}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 42,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: selected ? "#151820" : "#d8dbe2",
        backgroundColor: selected ? "#151820" : "#ffffff",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text selectable={false} style={{ color: selected ? "#ffffff" : "#151820", fontSize: 13, fontWeight: "900" }}>
        {label}
      </Text>
    </Pressable>
  );
}

function CommunityMenuOptionButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="menuitem"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        minHeight: 38,
        borderRadius: 10,
        borderCurve: "continuous",
        backgroundColor: selected ? "rgba(11,113,128,0.1)" : "#ffffff",
        paddingHorizontal: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
      }}
    >
      <View
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          borderWidth: 2,
          borderColor: selected ? "#0b7180" : "#c8ced8",
          backgroundColor: selected ? "#0b7180" : "#ffffff",
        }}
      />
      <Text selectable={false} numberOfLines={1} style={{ flex: 1, color: selected ? "#0b7180" : "#151820", fontSize: 13, fontWeight: "900" }}>
        {label}
      </Text>
    </Pressable>
  );
}

type FeedbackScreenshotDraft = {
  id: string;
  uri: string;
};

function CommunityFeedbackPopover({
  visible,
  accountUser,
  onClose,
}: {
  visible: boolean;
  accountUser: SupabaseUser | null;
  onClose: () => void;
}) {
  const { height: windowHeight } = useWindowDimensions();
  const [feedbackType, setFeedbackType] = useState<CommunityFeedbackType>("feedback");
  const [feedbackBody, setFeedbackBody] = useState("");
  const [screenshots, setScreenshots] = useState<FeedbackScreenshotDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setFeedbackError(null);
      setFeedbackSuccess(null);
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  const pickScreenshot = async () => {
    if (screenshots.length >= 3) {
      setFeedbackError("You can attach up to three screenshots.");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setFeedbackError("Enable photo library access to attach screenshots.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.82,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    try {
      const uri = await normalizePickedImage(result.assets[0], {
        maxDimension: 1600,
        compress: 0.82,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      setScreenshots((current) => [...current, { id: createUuid(), uri }].slice(0, 3));
      setFeedbackError(null);
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : "CardMagic could not attach that screenshot.");
    }
  };

  const sendFeedback = async () => {
    if (!accountUser) {
      setFeedbackError("Sign in before sending feedback.");
      return;
    }

    setSubmitting(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const screenshotPaths: string[] = [];

      for (const [index, screenshot] of screenshots.entries()) {
        screenshotPaths.push(await uploadCommunityFeedbackScreenshot(accountUser.id, screenshot.uri, index));
      }

      await submitCommunityFeedback({
        feedbackType,
        body: feedbackBody,
        appVersion: CARDMAGIC_APP_VERSION,
        deviceInfo: getCommunityFeedbackDeviceInfo(),
        screenshotPaths,
      });

      setFeedbackBody("");
      setScreenshots([]);
      setFeedbackSuccess("Feedback submitted. Device metadata and screenshots were attached.");
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : "CardMagic could not send feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <View
      pointerEvents="auto"
      style={{
        flex: 1,
        backgroundColor: "rgba(15, 18, 24, 0.48)",
        alignItems: "center",
        justifyContent: "center",
        padding: 14,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 620,
          maxHeight: Math.max(430, windowHeight - 58),
          borderRadius: 16,
          borderCurve: "continuous",
          backgroundColor: "#ffffff",
          borderWidth: 1,
          borderColor: "#d8dbe2",
          overflow: "hidden",
          shadowColor: "#000000",
          shadowOpacity: 0.22,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 14 },
          elevation: 18,
        }}
      >
        <View
          style={{
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#eceef2",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text selectable={false} style={{ color: "#151820", fontSize: 17, fontWeight: "900" }}>
              Community feedback
            </Text>
            <Text selectable={false} style={{ color: "#68707d", fontSize: 12, fontWeight: "800" }}>
              Send a bug report or product note with diagnostic context
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close community feedback"
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
            <X size={18} color="#20242d" strokeWidth={2.6} />
          </Pressable>
        </View>

        <ScrollView
          style={{ maxHeight: Math.max(360, windowHeight - 150) }}
          contentContainerStyle={{ padding: 14, gap: 14 }}
          keyboardShouldPersistTaps="handled"
        >
          {feedbackError ? (
            <View
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#f1bcc4",
                backgroundColor: "#fff5f6",
                padding: 10,
              }}
            >
              <Text selectable={false} style={{ color: "#a62231", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
                {feedbackError}
              </Text>
            </View>
          ) : null}

          {feedbackSuccess ? (
            <View
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#b7ecf4",
                backgroundColor: "#f2fcfd",
                padding: 10,
              }}
            >
              <Text selectable={false} style={{ color: "#0b7180", fontSize: 12, lineHeight: 17, fontWeight: "900" }}>
                {feedbackSuccess}
              </Text>
            </View>
          ) : null}

          {!accountUser ? (
            <View
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#f2d6a7",
                backgroundColor: "#fff9ed",
                padding: 10,
              }}
            >
              <Text selectable={false} style={{ color: "#8a5d0a", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
                Sign in so CardMagic can associate this report with your account.
              </Text>
            </View>
          ) : null}

          <View style={{ flexDirection: "row", gap: 8 }}>
            <CommunityModeButton
              label="Feedback"
              selected={feedbackType === "feedback"}
              onPress={() => setFeedbackType("feedback")}
            />
            <CommunityModeButton
              label="Bug report"
              selected={feedbackType === "bug"}
              onPress={() => setFeedbackType("bug")}
            />
          </View>

          <TextInput
            accessibilityLabel="Feedback content"
            value={feedbackBody}
            onChangeText={setFeedbackBody}
            placeholder={feedbackType === "bug" ? "What broke, what did you expect, and what did you tap before it happened?" : "What should CardMagic improve or add?"}
            placeholderTextColor="#68707d"
            multiline
            maxLength={4000}
            style={[communityPollInputStyle, { minHeight: 156, textAlignVertical: "top" }]}
          />

          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text selectable={false} style={{ color: "#151820", fontSize: 13, fontWeight: "900" }}>
                  Screenshots
                </Text>
                <Text selectable={false} style={{ color: "#68707d", fontSize: 11, fontWeight: "800" }}>
                  Optional, up to 3 images
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Attach feedback screenshot"
                disabled={submitting || screenshots.length >= 3}
                onPress={() => void pickScreenshot()}
                style={{
                  minHeight: 38,
                  borderRadius: 999,
                  backgroundColor: screenshots.length >= 3 ? "#d8dbe2" : "#151820",
                  paddingHorizontal: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Upload size={15} color="#ffffff" strokeWidth={2.6} />
                <Text selectable={false} style={{ color: "#ffffff", fontSize: 12, fontWeight: "900" }}>
                  Add
                </Text>
              </Pressable>
            </View>

            {screenshots.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {screenshots.map((screenshot, index) => (
                  <View
                    key={screenshot.id}
                    style={{
                      width: 96,
                      borderRadius: 12,
                      borderCurve: "continuous",
                      borderWidth: 1,
                      borderColor: "#d8dbe2",
                      backgroundColor: "#f8f9fb",
                      overflow: "hidden",
                    }}
                  >
                    <Image source={{ uri: screenshot.uri }} style={{ width: 94, height: 94, backgroundColor: "#eef0f4" }} resizeMode="cover" />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove screenshot ${index + 1}`}
                      disabled={submitting}
                      onPress={() => setScreenshots((current) => current.filter((entry) => entry.id !== screenshot.id))}
                      style={{ minHeight: 32, alignItems: "center", justifyContent: "center" }}
                    >
                      <Text selectable={false} style={{ color: "#a62231", fontSize: 11, fontWeight: "900" }}>
                        Remove
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View
            style={{
              borderRadius: 12,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: "#e1e5eb",
              backgroundColor: "#f8f9fb",
              padding: 10,
              gap: 4,
            }}
          >
            <Text selectable={false} style={{ color: "#68707d", fontSize: 11, fontWeight: "900", textTransform: "uppercase" }}>
              Diagnostics
            </Text>
            <Text selectable={false} style={{ color: "#46505d", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
              v{CARDMAGIC_APP_VERSION} · {Platform.OS}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Submit community feedback"
            disabled={submitting}
            onPress={() => void sendFeedback()}
            style={{
              minHeight: 46,
              borderRadius: 999,
              backgroundColor: submitting ? "#8aa7ad" : "#151820",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
            }}
          >
            {submitting ? <ActivityIndicator color="#ffffff" size="small" /> : feedbackType === "bug" ? <Bug size={17} color="#ffffff" strokeWidth={2.6} /> : <MessageCircle size={17} color="#ffffff" strokeWidth={2.6} />}
            <Text selectable={false} style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>
              {submitting ? "Submitting" : "Submit"}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );

  if (Platform.OS === "web" && typeof document !== "undefined") {
    return createPortal(
      <View style={{ position: "fixed" as unknown as "absolute", inset: 0, zIndex: 190 }}>
        {content}
      </View>,
      document.body,
    );
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      {content}
    </Modal>
  );
}

function getCommunityFeedbackDeviceInfo() {
  const screenInfo = Platform.OS === "web" && typeof window !== "undefined"
    ? {
        width: window.screen?.width,
        height: window.screen?.height,
        pixelRatio: window.devicePixelRatio,
      }
    : undefined;

  return {
    platform: Platform.OS,
    os: Platform.OS,
    userAgent: Platform.OS === "web" && typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    language: Platform.OS === "web" && typeof navigator !== "undefined" ? navigator.language : undefined,
    screen: screenInfo,
  };
}

function CommunityPollsPopover({
  visible,
  canCreatePolls,
  onClose,
}: {
  visible: boolean;
  canCreatePolls: boolean;
  onClose: () => void;
}) {
  const { height: windowHeight } = useWindowDimensions();
  const [polls, setPolls] = useState<CommunityPollPayload[]>([]);
  const [pollsLoading, setPollsLoading] = useState(false);
  const [pollsError, setPollsError] = useState<string | null>(null);
  const [draftSelections, setDraftSelections] = useState<Record<string, string[]>>({});
  const [savingPollId, setSavingPollId] = useState<string | null>(null);
  const [creatingPoll, setCreatingPoll] = useState(false);
  const [newPollTitle, setNewPollTitle] = useState("");
  const [newPollDescription, setNewPollDescription] = useState("");
  const [newPollSelectionType, setNewPollSelectionType] = useState<CommunityPollSelectionType>("single");
  const [newPollOptionsText, setNewPollOptionsText] = useState("Yes\nNo");

  const reloadPolls = useCallback(async () => {
    if (!visible) {
      return;
    }

    setPollsLoading(true);
    setPollsError(null);

    try {
      const nextPolls = await fetchCommunityPolls();
      setPolls(nextPolls);
      setDraftSelections(Object.fromEntries(
        nextPolls.map((poll) => [
          poll.id,
          poll.options.filter((option) => option.selectedByViewer).map((option) => option.id),
        ]),
      ));
    } catch (error) {
      setPollsError(error instanceof Error ? error.message : "CardMagic could not load community polls.");
    } finally {
      setPollsLoading(false);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      void reloadPolls();
    }
  }, [reloadPolls, visible]);

  if (!visible) {
    return null;
  }

  const submitVote = async (poll: CommunityPollPayload) => {
    const optionIds = draftSelections[poll.id] ?? [];

    if (optionIds.length === 0) {
      setPollsError("Choose at least one option before submitting your vote.");
      return;
    }

    setSavingPollId(poll.id);
    setPollsError(null);

    try {
      await submitCommunityPollVote(poll.id, optionIds);
      await reloadPolls();
    } catch (error) {
      setPollsError(error instanceof Error ? error.message : "CardMagic could not submit this vote.");
    } finally {
      setSavingPollId(null);
    }
  };

  const togglePollStatus = async (poll: CommunityPollPayload) => {
    setSavingPollId(poll.id);
    setPollsError(null);

    try {
      await setCommunityPollStatus(poll.id, poll.status === "open" ? "closed" : "open");
      await reloadPolls();
    } catch (error) {
      setPollsError(error instanceof Error ? error.message : "CardMagic could not update this poll.");
    } finally {
      setSavingPollId(null);
    }
  };

  const createPoll = async () => {
    const options = newPollOptionsText
      .split(/\r?\n/)
      .map((option) => option.trim())
      .filter(Boolean);

    setCreatingPoll(true);
    setPollsError(null);

    try {
      await createCommunityPoll({
        title: newPollTitle,
        description: newPollDescription,
        selectionType: newPollSelectionType,
        options,
      });
      setNewPollTitle("");
      setNewPollDescription("");
      setNewPollSelectionType("single");
      setNewPollOptionsText("Yes\nNo");
      await reloadPolls();
    } catch (error) {
      setPollsError(error instanceof Error ? error.message : "CardMagic could not create this poll.");
    } finally {
      setCreatingPoll(false);
    }
  };

  const content = (
    <View
      pointerEvents="auto"
      style={{
        flex: 1,
        backgroundColor: "rgba(15, 18, 24, 0.48)",
        alignItems: "center",
        justifyContent: "center",
        padding: 14,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 720,
          maxHeight: Math.max(430, windowHeight - 58),
          borderRadius: 16,
          borderCurve: "continuous",
          backgroundColor: "#ffffff",
          borderWidth: 1,
          borderColor: "#d8dbe2",
          overflow: "hidden",
          shadowColor: "#000000",
          shadowOpacity: 0.22,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 14 },
          elevation: 18,
        }}
      >
        <View
          style={{
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#eceef2",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text selectable={false} style={{ color: "#151820", fontSize: 17, fontWeight: "900" }}>
              Community polls
            </Text>
            <Text selectable={false} style={{ color: "#68707d", fontSize: 12, fontWeight: "800" }}>
              Vote on feature direction and app priorities
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh community polls"
            disabled={pollsLoading}
            onPress={() => void reloadPolls()}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "#eef0f4",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {pollsLoading ? <ActivityIndicator color="#0b7180" size="small" /> : <RefreshCw size={17} color="#20242d" strokeWidth={2.6} />}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close community polls"
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
            <X size={18} color="#20242d" strokeWidth={2.6} />
          </Pressable>
        </View>

        <ScrollView
          style={{ maxHeight: Math.max(360, windowHeight - 150) }}
          contentContainerStyle={{ padding: 14, gap: 14 }}
        >
          {pollsError ? (
            <View
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#f1bcc4",
                backgroundColor: "#fff5f6",
                padding: 10,
              }}
            >
              <Text selectable={false} style={{ color: "#a62231", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
                {pollsError}
              </Text>
            </View>
          ) : null}

          {canCreatePolls ? (
            <View
              style={{
                borderRadius: 14,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: "#b7ecf4",
                backgroundColor: "#f2fcfd",
                padding: 12,
                gap: 10,
              }}
            >
              <Text selectable={false} style={{ color: "#0b7180", fontSize: 12, fontWeight: "900", textTransform: "uppercase" }}>
                Create poll
              </Text>
              <TextInput
                accessibilityLabel="Poll title"
                value={newPollTitle}
                onChangeText={setNewPollTitle}
                placeholder="Feature poll title"
                placeholderTextColor="#68707d"
                maxLength={120}
                style={communityPollInputStyle}
              />
              <TextInput
                accessibilityLabel="Poll description"
                value={newPollDescription}
                onChangeText={setNewPollDescription}
                placeholder="Optional context"
                placeholderTextColor="#68707d"
                maxLength={500}
                multiline
                style={[communityPollInputStyle, { minHeight: 72, textAlignVertical: "top" }]}
              />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <CommunityModeButton
                  label="Single choice"
                  selected={newPollSelectionType === "single"}
                  onPress={() => setNewPollSelectionType("single")}
                />
                <CommunityModeButton
                  label="Multi choice"
                  selected={newPollSelectionType === "multiple"}
                  onPress={() => setNewPollSelectionType("multiple")}
                />
              </View>
              <TextInput
                accessibilityLabel="Poll options"
                value={newPollOptionsText}
                onChangeText={setNewPollOptionsText}
                placeholder="One option per line"
                placeholderTextColor="#68707d"
                multiline
                style={[communityPollInputStyle, { minHeight: 96, textAlignVertical: "top" }]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Create community poll"
                disabled={creatingPoll}
                onPress={() => void createPoll()}
                style={{
                  minHeight: 44,
                  borderRadius: 999,
                  backgroundColor: creatingPoll ? "#8aa7ad" : "#151820",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8,
                }}
              >
                {creatingPoll ? <ActivityIndicator color="#ffffff" size="small" /> : <ListPlus size={17} color="#ffffff" strokeWidth={2.6} />}
                <Text selectable={false} style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>
                  {creatingPoll ? "Creating poll" : "Create poll"}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {pollsLoading && polls.length === 0 ? (
            <View style={{ minHeight: 180, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color="#0b7180" />
            </View>
          ) : polls.length > 0 ? (
            polls.map((poll) => {
              const selectedOptionIds = draftSelections[poll.id] ?? [];
              const totalVotes = poll.options.reduce((total, option) => total + option.voteCount, 0);
              const isSaving = savingPollId === poll.id;
              const isClosed = poll.status === "closed";

              return (
                <View
                  key={poll.id}
                  style={{
                    borderRadius: 14,
                    borderCurve: "continuous",
                    borderWidth: 1,
                    borderColor: isClosed ? "#d8dbe2" : "#b7ecf4",
                    backgroundColor: isClosed ? "#f8f9fb" : "#ffffff",
                    padding: 12,
                    gap: 10,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                    <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                      <Text selectable={false} style={{ color: "#151820", fontSize: 16, lineHeight: 21, fontWeight: "900" }}>
                        {poll.title}
                      </Text>
                      {poll.description ? (
                        <Text selectable style={{ color: "#68707d", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
                          {poll.description}
                        </Text>
                      ) : null}
                      <Text selectable={false} style={{ color: "#8a93a3", fontSize: 11, fontWeight: "900", textTransform: "uppercase" }}>
                        {poll.selectionType === "multiple" ? "Multi choice" : "Single choice"} · {poll.status} · {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
                      </Text>
                    </View>
                    {canCreatePolls ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={isClosed ? "Reopen poll" : "Close poll"}
                        disabled={isSaving}
                        onPress={() => void togglePollStatus(poll)}
                        style={{
                          minHeight: 32,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: "#d8dbe2",
                          backgroundColor: "#ffffff",
                          paddingHorizontal: 10,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text selectable={false} style={{ color: "#46505d", fontSize: 11, fontWeight: "900" }}>
                          {isClosed ? "Reopen" : "Close"}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>

                  <View style={{ gap: 8 }}>
                    {poll.options.map((option) => {
                      const selected = selectedOptionIds.includes(option.id);
                      const percent = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;

                      return (
                        <Pressable
                          key={option.id}
                          accessibilityRole={poll.selectionType === "multiple" ? "checkbox" : "radio"}
                          accessibilityState={{ checked: selected, disabled: isClosed }}
                          accessibilityLabel={`${option.label}, ${option.voteCount} votes`}
                          disabled={isClosed || isSaving}
                          onPress={() => {
                            setDraftSelections((current) => {
                              const currentSelection = current[poll.id] ?? [];
                              const nextSelection = poll.selectionType === "single"
                                ? [option.id]
                                : currentSelection.includes(option.id)
                                  ? currentSelection.filter((id) => id !== option.id)
                                  : [...currentSelection, option.id];

                              return { ...current, [poll.id]: nextSelection };
                            });
                          }}
                          style={{
                            minHeight: 44,
                            borderRadius: 12,
                            borderCurve: "continuous",
                            borderWidth: 1,
                            borderColor: selected ? "#0b7180" : "#d8dbe2",
                            backgroundColor: selected ? "rgba(11,113,128,0.08)" : "#ffffff",
                            padding: 10,
                            gap: 7,
                          }}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                            <View
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: poll.selectionType === "multiple" ? 5 : 9,
                                borderWidth: 2,
                                borderColor: selected ? "#0b7180" : "#c8ced8",
                                backgroundColor: selected ? "#0b7180" : "#ffffff",
                              }}
                            />
                            <Text selectable={false} style={{ flex: 1, color: "#151820", fontSize: 13, fontWeight: "900" }}>
                              {option.label}
                            </Text>
                            <Text selectable={false} style={{ color: "#68707d", fontSize: 12, fontWeight: "900" }}>
                              {percent}%
                            </Text>
                          </View>
                          <View style={{ height: 6, borderRadius: 999, backgroundColor: "#eceef2", overflow: "hidden" }}>
                            <View style={{ width: `${percent}%`, height: "100%", backgroundColor: selected ? "#0b7180" : "#b8c0cc" }} />
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Submit vote for ${poll.title}`}
                    disabled={isClosed || isSaving || selectedOptionIds.length === 0}
                    onPress={() => void submitVote(poll)}
                    style={{
                      minHeight: 42,
                      borderRadius: 999,
                      backgroundColor: isClosed || selectedOptionIds.length === 0 ? "#d8dbe2" : "#151820",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 8,
                    }}
                  >
                    {isSaving ? <ActivityIndicator color="#ffffff" size="small" /> : <ListPlus size={16} color="#ffffff" strokeWidth={2.6} />}
                    <Text selectable={false} style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>
                      {isClosed ? "Poll closed" : isSaving ? "Saving vote" : "Submit vote"}
                    </Text>
                  </Pressable>
                </View>
              );
            })
          ) : (
            <CommunityEmptyState
              icon={<ListPlus size={24} color="#68707d" strokeWidth={2.4} />}
              title="No polls yet"
              detail="Open polls will appear here for feature requests, release priorities, and community feedback."
            />
          )}
        </ScrollView>
      </View>
    </View>
  );

  if (Platform.OS === "web" && typeof document !== "undefined") {
    return createPortal(
      <View style={{ position: "fixed" as unknown as "absolute", inset: 0, zIndex: 180 }}>
        {content}
      </View>,
      document.body,
    );
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      {content}
    </Modal>
  );
}

const communityPollInputStyle = {
  minHeight: 44,
  borderRadius: 12,
  borderCurve: "continuous" as const,
  borderWidth: 1,
  borderColor: "#d8dbe2",
  backgroundColor: "#ffffff",
  color: "#151820",
  fontSize: 14,
  lineHeight: 19,
  fontWeight: "800" as const,
  paddingHorizontal: 12,
  paddingVertical: 10,
};

function CommunityCommentsPopover({
  card,
  onClose,
  onCommentCountChange,
}: {
  card: CommunityCardPayload | null;
  onClose: () => void;
  onCommentCountChange: (cardId: string, commentCount: number) => void;
}) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [comments, setComments] = useState<CommunityCardCommentPayload[]>([]);
  const [draftBody, setDraftBody] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const previewWidth =
    windowWidth >= 900 ? 260 :
    windowWidth >= 620 ? 230 :
    Math.min(210, Math.max(160, windowWidth - 190));

  useEffect(() => {
    let cancelled = false;

    if (!card) {
      setComments([]);
      setDraftBody("");
      setEditingCommentId(null);
      setCommentError(null);
      return;
    }

    setLoadingComments(true);
    setCommentError(null);
    setDraftBody("");
    setEditingCommentId(null);

    fetchCommunityCardComments(card.id)
      .then((nextComments) => {
        if (cancelled) {
          return;
        }

        setComments(nextComments);
        onCommentCountChange(card.id, nextComments.length);
      })
      .catch((error) => {
        if (!cancelled) {
          setCommentError(error instanceof Error ? error.message : "CardMagic could not load comments.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingComments(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [card, onCommentCountChange]);

  if (!card) {
    return null;
  }

  const editingComment = editingCommentId ? comments.find((comment) => comment.id === editingCommentId) : null;
  const saveLabel = editingComment ? "Update comment" : "Post comment";
  const canSaveComment = draftBody.trim().length > 0 && !savingComment;
  const saveComment = async () => {
    if (!canSaveComment) {
      return;
    }

    setSavingComment(true);
    setCommentError(null);

    try {
      const savedComment = await saveCommunityCardComment(card.id, draftBody, editingCommentId ?? undefined);
      setComments((current) => {
        const nextComments = editingCommentId
          ? current.map((comment) => comment.id === savedComment.id ? savedComment : comment)
          : [...current, savedComment];

        onCommentCountChange(card.id, nextComments.length);
        return nextComments;
      });
      setDraftBody("");
      setEditingCommentId(null);
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : "CardMagic could not save this comment.");
    } finally {
      setSavingComment(false);
    }
  };
  const content = (
    <View
      pointerEvents="auto"
      style={{
        flex: 1,
        backgroundColor: "rgba(15, 18, 24, 0.48)",
        alignItems: "center",
        justifyContent: "center",
        padding: 14,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 720,
          maxHeight: Math.max(420, windowHeight - 58),
          borderRadius: 16,
          borderCurve: "continuous",
          backgroundColor: "#ffffff",
          borderWidth: 1,
          borderColor: "#d8dbe2",
          overflow: "hidden",
          shadowColor: "#000000",
          shadowOpacity: 0.22,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 14 },
          elevation: 18,
        }}
      >
        <View
          style={{
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#eceef2",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text selectable={false} numberOfLines={1} style={{ color: "#151820", fontSize: 16, fontWeight: "900" }}>
              {card.name || "Untitled Card"}
            </Text>
            <Text selectable={false} numberOfLines={1} style={{ color: "#68707d", fontSize: 12, fontWeight: "800" }}>
              {card.authorName} · Level {card.authorLevel}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close comments"
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
            <X size={18} color="#20242d" strokeWidth={2.6} />
          </Pressable>
        </View>

        <View
          style={{
            padding: 14,
            gap: 14,
            flexDirection: windowWidth >= 640 ? "row" : "column",
          }}
        >
          <View style={{ alignItems: "center", gap: 8 }}>
            <CardPreview
              card={card.card}
              activeSection={null}
              width={previewWidth}
              cornerRadius={9}
              footerOwnerName={card.authorName}
              onSectionPress={noopCardPreviewHandler}
              onChange={noopCardPreviewHandler}
            />
            <Text selectable={false} style={{ color: "#68707d", fontSize: 12, fontWeight: "800" }}>
              {comments.length} {comments.length === 1 ? "comment" : "comments"}
            </Text>
          </View>

          <View style={{ flex: 1, minWidth: 0, gap: 12 }}>
            <ScrollView
              style={{ maxHeight: windowWidth >= 640 ? Math.max(230, windowHeight - 360) : 210 }}
              contentContainerStyle={{ gap: 10, paddingRight: 2 }}
            >
              {loadingComments ? (
                <View style={{ minHeight: 120, alignItems: "center", justifyContent: "center" }}>
                  <ActivityIndicator color="#0b7180" />
                </View>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <View
                    key={comment.id}
                    style={{
                      borderRadius: 12,
                      borderCurve: "continuous",
                      borderWidth: 1,
                      borderColor: comment.editableByViewer ? "#b7ecf4" : "#eceef2",
                      backgroundColor: comment.editableByViewer ? "#f2fcfd" : "#f8f9fb",
                      padding: 10,
                      gap: 6,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text selectable={false} style={{ flex: 1, color: "#151820", fontSize: 12, fontWeight: "900" }}>
                        {comment.authorName}
                      </Text>
                      <Text selectable={false} style={{ color: "#8a93a3", fontSize: 10, fontWeight: "800" }}>
                        {formatCompactCommentDate(comment.updatedAt)}
                      </Text>
                    </View>
                    <Text selectable style={{ color: "#2a303a", fontSize: 13, lineHeight: 18, fontWeight: "700" }}>
                      {comment.body}
                    </Text>
                    {comment.editableByViewer ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Edit your comment"
                        onPress={() => {
                          setEditingCommentId(comment.id);
                          setDraftBody(comment.body);
                        }}
                        style={{ alignSelf: "flex-start", paddingVertical: 4 }}
                      >
                        <Text selectable={false} style={{ color: "#0b7180", fontSize: 12, fontWeight: "900" }}>
                          Edit
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))
              ) : (
                <View
                  style={{
                    minHeight: 120,
                    borderRadius: 12,
                    backgroundColor: "#f4f5f7",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 16,
                  }}
                >
                  <Text selectable={false} style={{ color: "#68707d", fontSize: 13, fontWeight: "900", textAlign: "center" }}>
                    No comments yet
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={{ gap: 8 }}>
              <TextInput
                accessibilityLabel={editingComment ? "Edit your comment" : "Add a comment"}
                value={draftBody}
                onChangeText={setDraftBody}
                placeholder={editingComment ? "Edit your comment" : "Add a comment"}
                placeholderTextColor="#8a93a3"
                multiline
                maxLength={500}
                style={{
                  minHeight: 82,
                  borderRadius: 12,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: "#d8dbe2",
                  backgroundColor: "#ffffff",
                  color: "#151820",
                  fontSize: 14,
                  lineHeight: 19,
                  fontWeight: "700",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  textAlignVertical: "top",
                }}
              />
              {commentError ? (
                <Text selectable={false} style={{ color: "#a52735", fontSize: 12, fontWeight: "800" }}>
                  {commentError}
                </Text>
              ) : null}
              <View style={{ flexDirection: "row", gap: 8 }}>
                {editingComment ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cancel comment edit"
                    onPress={() => {
                      setEditingCommentId(null);
                      setDraftBody("");
                    }}
                    style={{
                      minHeight: 42,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: "#d8dbe2",
                      paddingHorizontal: 14,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text selectable={false} style={{ color: "#46505d", fontSize: 13, fontWeight: "900" }}>
                      Cancel
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={saveLabel}
                  disabled={!canSaveComment}
                  onPress={() => void saveComment()}
                  style={{
                    flex: 1,
                    minHeight: 42,
                    borderRadius: 999,
                    backgroundColor: canSaveComment ? "#151820" : "#d8dbe2",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 8,
                  }}
                >
                  {savingComment ? <ActivityIndicator color="#ffffff" size="small" /> : <MessageCircle size={16} color="#ffffff" strokeWidth={2.5} />}
                  <Text selectable={false} style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>
                    {savingComment ? "Saving" : saveLabel}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  if (Platform.OS === "web" && typeof document !== "undefined") {
    return createPortal(
      <View style={{ position: "fixed" as unknown as "absolute", inset: 0, zIndex: 180 }}>
        {content}
      </View>,
      document.body,
    );
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      {content}
    </Modal>
  );
}

function formatCompactCommentDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function CommunityCardsPreview({
  cards,
  localFallbackCards,
  feedResetKey,
  scrollWindow,
  hasMore,
  loadingMore,
  onVisibleCommunityCardIdsChange,
  onToggleLike,
  onToggleFollow,
  onOpenComments,
  onExportCardImage,
}: {
  cards: CommunityCardPayload[];
  localFallbackCards: Array<{ id: string; setName: string; card: CardDraft }>;
  feedResetKey: string;
  scrollWindow: MainScrollWindow | null;
  hasMore: boolean;
  loadingMore: boolean;
  onVisibleCommunityCardIdsChange: (cardIds: string[]) => void;
  onToggleLike: (cardId: string, liked: boolean) => void;
  onToggleFollow: (userId: string, followed: boolean) => void;
  onOpenComments: (cardId: string) => void;
  onExportCardImage: (card: CardDraft, cardName: string, footerOwnerName?: string, imageUrl?: string) => Promise<void>;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const [listTopY, setListTopY] = useState(0);
  const [itemHeightsById, setItemHeightsById] = useState<Record<string, number>>({});
  const cardPreviewWidth =
    windowWidth >= 900 ? 420 :
    windowWidth >= 620 ? 380 :
    Math.min(360, Math.max(286, windowWidth - 28));
  const usingCommunityCards = cards.length > 0;
  const feedItems = useMemo(
    () =>
      usingCommunityCards
        ? cards.map((entry) => ({ kind: "community" as const, id: entry.id, entry }))
        : localFallbackCards.map((entry) => ({ kind: "fallback" as const, id: entry.id, entry })),
    [cards, localFallbackCards, usingCommunityCards],
  );
  const feedItemCount = feedItems.length;

  useEffect(() => {
    setItemHeightsById({});
  }, [cardPreviewWidth, feedResetKey]);

  const virtualWindow = useMemo(() => {
    if (feedItemCount === 0) {
      return {
        startIndex: 0,
        endIndex: 0,
        topSpacerHeight: 0,
        bottomSpacerHeight: 0,
      };
    }

    const estimatedInitialHeight =
      COMMUNITY_FEED_ESTIMATED_CARD_ITEM_HEIGHT * COMMUNITY_INITIAL_RENDERED_CARD_COUNT;
    const viewportTop = scrollWindow
      ? Math.max(0, scrollWindow.offsetY - listTopY - COMMUNITY_FEED_OVERSCAN_PX)
      : 0;
    const viewportBottom = scrollWindow
      ? Math.max(
          viewportTop + scrollWindow.viewportHeight,
          scrollWindow.offsetY - listTopY + scrollWindow.viewportHeight + COMMUNITY_FEED_OVERSCAN_PX,
        )
      : estimatedInitialHeight;
    let cursorY = 0;
    let startIndex = 0;
    let endIndex = feedItemCount;
    let topSpacerHeight = 0;
    let visibleHeight = 0;

    for (let index = 0; index < feedItemCount; index += 1) {
      const item = feedItems[index];
      const itemHeight = itemHeightsById[item.id] ?? COMMUNITY_FEED_ESTIMATED_CARD_ITEM_HEIGHT;
      const itemTop = cursorY;
      const itemBottom = cursorY + itemHeight;

      if (itemBottom < viewportTop) {
        startIndex = index + 1;
        topSpacerHeight += itemHeight;
      }

      if (itemTop <= viewportBottom) {
        endIndex = index + 1;
      }

      cursorY = itemBottom;
    }

    endIndex = Math.min(feedItemCount, Math.max(endIndex, startIndex + 1));

    for (let index = startIndex; index < endIndex; index += 1) {
      const item = feedItems[index];
      visibleHeight += itemHeightsById[item.id] ?? COMMUNITY_FEED_ESTIMATED_CARD_ITEM_HEIGHT;
    }

    return {
      startIndex,
      endIndex,
      topSpacerHeight,
      bottomSpacerHeight: Math.max(0, cursorY - topSpacerHeight - visibleHeight),
    };
  }, [feedItemCount, feedItems, itemHeightsById, listTopY, scrollWindow]);

  const visibleFeedItems = feedItems.slice(virtualWindow.startIndex, virtualWindow.endIndex);
  const visibleCommunityCardIds = useMemo(
    () => visibleFeedItems.flatMap((item) => (item.kind === "community" ? [item.id] : [])),
    [visibleFeedItems],
  );
  const visibleCommunityCardIdsKey = visibleCommunityCardIds.join("\n");
  const handleItemLayout = useCallback((itemId: string, event: LayoutChangeEvent) => {
    const measuredHeight = event.nativeEvent.layout.height;

    if (measuredHeight <= 0) {
      return;
    }

    setItemHeightsById((current) => {
      if (Math.abs((current[itemId] ?? 0) - measuredHeight) < 2) {
        return current;
      }

      return {
        ...current,
        [itemId]: measuredHeight,
      };
    });
  }, []);

  useEffect(() => {
    if (visibleCommunityCardIds.length > 0) {
      onVisibleCommunityCardIdsChange(visibleCommunityCardIds);
    }
  }, [onVisibleCommunityCardIdsChange, visibleCommunityCardIdsKey]);

  if (feedItemCount === 0) {
    return (
      <CommunityEmptyState
        icon={<Tags size={24} color="#68707d" strokeWidth={2.4} />}
        title="No community cards yet"
        detail="Save cards while signed in to publish them into the public Supabase card feed."
      />
    );
  }

  return (
    <View
      onLayout={(event) => setListTopY(event.nativeEvent.layout.y)}
      style={{ padding: 12, gap: 16 }}
    >
      {virtualWindow.topSpacerHeight > 0 ? (
        <View pointerEvents="none" style={{ height: virtualWindow.topSpacerHeight }} />
      ) : null}
      {visibleFeedItems.map((item) => (
        <View
          key={item.id}
          onLayout={(event) => handleItemLayout(item.id, event)}
        >
          {item.kind === "community" ? (
            <CommunityFeedCardItem
              entry={item.entry}
              cardPreviewWidth={cardPreviewWidth}
              onToggleLike={onToggleLike}
              onToggleFollow={onToggleFollow}
              onOpenComments={onOpenComments}
              onExportCardImage={onExportCardImage}
            />
          ) : (
            <CommunityFallbackCardItem
              entry={item.entry}
              cardPreviewWidth={cardPreviewWidth}
              onExportCardImage={onExportCardImage}
            />
          )}
        </View>
      ))}
      {virtualWindow.bottomSpacerHeight > 0 ? (
        <View pointerEvents="none" style={{ height: virtualWindow.bottomSpacerHeight }} />
      ) : null}
      {cards.length > 0 && hasMore && loadingMore ? (
        <View
          accessibilityRole="progressbar"
          style={{
            minHeight: 46,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: "#d8dbe2",
            backgroundColor: "#f4f5f7",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
          }}
        >
          <ActivityIndicator color="#0b7180" size="small" />
          <Text selectable={false} style={{ color: "#68707d", fontSize: 13, fontWeight: "900" }}>
            Loading cards
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const CommunityFeedCardItem = memo(function CommunityFeedCardItem({
  entry,
  cardPreviewWidth,
  onToggleLike,
  onToggleFollow,
  onOpenComments,
  onExportCardImage,
}: {
  entry: CommunityCardPayload;
  cardPreviewWidth: number;
  onToggleLike: (cardId: string, liked: boolean) => void;
  onToggleFollow: (userId: string, followed: boolean) => void;
  onOpenComments: (cardId: string) => void;
  onExportCardImage: (card: CardDraft, cardName: string, footerOwnerName?: string, imageUrl?: string) => Promise<void>;
}) {
  // Use the lean row fields (not the card JSON) so this works whether the feed
  // payload carries a full card or just display metadata.
  const cardName = entry.name || "Untitled Card";
  const label = entry.typeLine || "Community card";
  const cardAspectRatio = getTypeFrameSpec(getPreviewTypeFrame(entry.card)).aspectRatio;

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: "#eceef2",
        paddingVertical: 14,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: "#151820",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Users size={18} color="#ffffff" strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text selectable={false} numberOfLines={1} style={{ color: "#151820", fontSize: 14, fontWeight: "900" }}>
            {cardName}
          </Text>
          <Text selectable={false} numberOfLines={1} style={{ color: "#68707d", fontSize: 12, fontWeight: "800" }}>
            {entry.authorName} · Level {entry.authorLevel} · {label}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: entry.followedByViewer }}
          accessibilityLabel={`${entry.followedByViewer ? "Unfollow" : "Follow"} ${entry.authorName}`}
          onPress={() => onToggleFollow(entry.userId, !entry.followedByViewer)}
          style={{
            minHeight: 34,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: entry.followedByViewer ? "#0b7180" : "#d8dbe2",
            backgroundColor: entry.followedByViewer ? "rgba(11,113,128,0.1)" : "#ffffff",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 10,
          }}
        >
          <Text selectable={false} style={{ color: entry.followedByViewer ? "#0b7180" : "#46505d", fontSize: 11, fontWeight: "900" }}>
            {entry.followedByViewer ? "Following" : "Follow"}
          </Text>
        </Pressable>
      </View>

      <View
        style={{
          alignItems: "center",
          backgroundColor: "#f4f5f7",
          paddingVertical: 12,
        }}
      >
        <View
          style={{
            width: cardPreviewWidth,
            height: cardPreviewWidth / cardAspectRatio,
            borderRadius: 9,
            overflow: "hidden",
            backgroundColor: "#e7e9ee",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {entry.imageUrl ? (
            // expo-image: memory + disk caching, lazy decode, and the source is a
            // Supabase image-transform URL (right-sized, WebP) rather than the
            // full-res export PNG. The fixed aspect-ratio box above prevents
            // layout shift while it loads.
            <ExpoImage
              source={{ uri: getResizedCommunityImageUrl(entry.imageUrl, cardPreviewWidth) }}
              contentFit="contain"
              transition={180}
              cachePolicy="memory-disk"
              recyclingKey={entry.id}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <CardPreview
              card={entry.card}
              activeSection={null}
              width={cardPreviewWidth}
              cornerRadius={9}
              footerOwnerName={entry.authorName}
              onSectionPress={noopCardPreviewHandler}
              onChange={noopCardPreviewHandler}
            />
          )}
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <CommunityFeedActionButton
          label={`${entry.likedByViewer ? "Unlike" : "Like"} ${cardName}`}
          icon={
            <Heart
              size={18}
              color={entry.likedByViewer ? "#d93a4a" : "#46505d"}
              fill={entry.likedByViewer ? "#d93a4a" : "transparent"}
              strokeWidth={2.5}
            />
          }
          text={`${entry.likeCount}`}
          selected={entry.likedByViewer}
          onPress={() => onToggleLike(entry.id, !entry.likedByViewer)}
        />
        <CommunityFeedActionButton
          label={`Comment on ${cardName}`}
          icon={<MessageCircle size={18} color="#46505d" strokeWidth={2.5} />}
          text={`${entry.commentCount}`}
          onPress={() => onOpenComments(entry.id)}
        />
        <CommunityFeedActionButton
          label={`Save rendered image for ${cardName}`}
          icon={<Download size={18} color="#46505d" strokeWidth={2.5} />}
          onPress={() => void onExportCardImage(entry.card, cardName, entry.authorName, entry.imageUrl)}
        />
      </View>
    </View>
  );
});

const CommunityFallbackCardItem = memo(function CommunityFallbackCardItem({
  entry,
  cardPreviewWidth,
  onExportCardImage,
}: {
  entry: { id: string; setName: string; card: CardDraft };
  cardPreviewWidth: number;
  onExportCardImage: (card: CardDraft, cardName: string, footerOwnerName?: string, imageUrl?: string) => Promise<void>;
}) {
  const face = getEditableCardFace(entry.card);
  const cardName = face.name || "Untitled Card";

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: "#eceef2",
        paddingVertical: 14,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: "#151820",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Users size={18} color="#ffffff" strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text selectable={false} numberOfLines={1} style={{ color: "#151820", fontSize: 14, fontWeight: "900" }}>
            {cardName}
          </Text>
          <Text selectable={false} numberOfLines={1} style={{ color: "#68707d", fontSize: 12, fontWeight: "800" }}>
            {entry.setName} · Local preview
          </Text>
        </View>
      </View>

      <View
        style={{
          alignItems: "center",
          backgroundColor: "#f4f5f7",
          paddingVertical: 12,
        }}
      >
        <CardPreview
          card={entry.card}
          activeSection={null}
          width={cardPreviewWidth}
          cornerRadius={9}
          footerOwnerName={entry.setName}
          onSectionPress={noopCardPreviewHandler}
          onChange={noopCardPreviewHandler}
        />
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <CommunityFeedActionButton
          label={`Save rendered image for ${cardName}`}
          icon={<Download size={18} color="#46505d" strokeWidth={2.5} />}
          onPress={() => void onExportCardImage(entry.card, cardName, entry.setName)}
        />
      </View>
    </View>
  );
});

function CommunityFeedActionButton({
  label,
  icon,
  text,
  selected = false,
  onPress,
}: {
  label: string;
  icon: ReactNode;
  text?: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 40,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: selected ? "rgba(217,58,74,0.28)" : "#d8dbe2",
        backgroundColor: selected ? "rgba(217,58,74,0.08)" : "#ffffff",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingHorizontal: 8,
      }}
    >
      {icon}
      {typeof text === "string" ? (
        <Text selectable={false} numberOfLines={1} style={{ color: selected ? "#a62231" : "#46505d", fontSize: 12, fontWeight: "900" }}>
          {text}
        </Text>
      ) : null}
    </Pressable>
  );
}

function CommunitySetsPreview({
  sets,
  selectedSetId,
  cardsBySetId,
  loadingSetId,
  errorBySetId,
  onOpenSet,
  onExportCardImage,
}: {
  sets: CommunitySetPayload[];
  selectedSetId: string | null;
  cardsBySetId: Record<string, CommunitySetCardPayload[]>;
  loadingSetId: string | null;
  errorBySetId: Record<string, string>;
  onOpenSet: (set: CommunitySetPayload) => void;
  onExportCardImage: (card: CardDraft, cardName: string, footerOwnerName?: string, imageUrl?: string) => Promise<void>;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const cardPreviewWidth =
    windowWidth >= 900 ? 360 :
    windowWidth >= 620 ? 330 :
    Math.min(320, Math.max(270, windowWidth - 56));

  if (sets.length === 0) {
    return (
      <CommunityEmptyState
        icon={<BookOpen size={24} color="#68707d" strokeWidth={2.4} />}
        title="No community sets yet"
        detail="The directory is ready for published set metadata, cover images, card counts, authors, and sort indexes."
      />
    );
  }

  return (
    <View style={{ padding: 12, gap: 10 }}>
      {sets.map((set) => {
        const expanded = selectedSetId === set.id;
        const setCards = cardsBySetId[set.id] ?? [];
        const loading = loadingSetId === set.id;
        const error = errorBySetId[set.id];

        return (
          <View
            key={set.id}
            style={{
              borderRadius: 10,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: expanded ? "#9edbe5" : "#eceef2",
              backgroundColor: expanded ? "#f7fdfe" : "#fbfcfe",
              overflow: "hidden",
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${expanded ? "Collapse" : "View"} ${set.name}`}
              accessibilityState={{ expanded }}
              onPress={() => onOpenSet(set)}
              style={({ pressed }) => ({
                minHeight: 72,
                padding: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                opacity: pressed ? 0.72 : 1,
              })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: "#151820",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BookOpen size={21} color="#ffffff" strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text selectable={false} numberOfLines={1} style={{ color: "#151820", fontSize: 14, fontWeight: "900" }}>
                  {set.name}
                </Text>
                <Text selectable={false} numberOfLines={1} style={{ color: "#68707d", fontSize: 12, fontWeight: "800" }}>
                  {set.authorName} · Level {set.authorLevel} · {set.cardCount} {set.cardCount === 1 ? "card" : "cards"}
                </Text>
                <Text selectable={false} numberOfLines={1} style={{ color: "#8a93a3", fontSize: 11, fontWeight: "900", textTransform: "uppercase" }}>
                  {set.code ?? "SET"}
                </Text>
              </View>
              {expanded ? (
                <ChevronUp size={18} color="#46505d" strokeWidth={2.6} />
              ) : (
                <ChevronDown size={18} color="#46505d" strokeWidth={2.6} />
              )}
            </Pressable>

            {expanded ? (
              <View style={{ borderTopWidth: 1, borderTopColor: "#e2f1f4", padding: 10, gap: 12 }}>
                {loading ? (
                  <View style={{ minHeight: 54, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}>
                    <ActivityIndicator color="#0b7180" size="small" />
                    <Text selectable={false} style={{ color: "#68707d", fontSize: 12, fontWeight: "900" }}>
                      Loading set cards
                    </Text>
                  </View>
                ) : error ? (
                  <Text selectable style={{ color: "#a62231", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
                    {error}
                  </Text>
                ) : setCards.length === 0 ? (
                  <Text selectable={false} style={{ color: "#68707d", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
                    No public cards are available for this set.
                  </Text>
                ) : (
                  setCards.map((entry) => (
                    <CommunitySetCardPreview
                      key={entry.id}
                      entry={entry}
                      cardPreviewWidth={cardPreviewWidth}
                      onExportCardImage={onExportCardImage}
                    />
                  ))
                )}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function CommunitySetCardPreview({
  entry,
  cardPreviewWidth,
  onExportCardImage,
}: {
  entry: CommunitySetCardPayload;
  cardPreviewWidth: number;
  onExportCardImage: (card: CardDraft, cardName: string, footerOwnerName?: string, imageUrl?: string) => Promise<void>;
}) {
  const cardName = entry.name || "Untitled Card";
  const cardAspectRatio = getTypeFrameSpec(getPreviewTypeFrame(entry.card)).aspectRatio;

  return (
    <View style={{ gap: 8 }}>
      <View style={{ gap: 2 }}>
        <Text selectable={false} numberOfLines={1} style={{ color: "#151820", fontSize: 13, fontWeight: "900" }}>
          {cardName}
        </Text>
        <Text selectable={false} numberOfLines={1} style={{ color: "#68707d", fontSize: 11, fontWeight: "800" }}>
          {entry.typeLine || "Community card"}
        </Text>
      </View>
      <View
        style={{
          alignItems: "center",
          backgroundColor: "transparent",
        }}
      >
        <View
          style={{
            width: cardPreviewWidth,
            height: cardPreviewWidth / cardAspectRatio,
            borderRadius: 9,
            overflow: "hidden",
            backgroundColor: "#e7e9ee",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {entry.imageUrl ? (
            <ExpoImage
              source={{ uri: getResizedCommunityImageUrl(entry.imageUrl, cardPreviewWidth) }}
              contentFit="contain"
              transition={180}
              cachePolicy="memory-disk"
              recyclingKey={`set-${entry.id}`}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <CardPreview
              card={entry.card}
              activeSection={null}
              width={cardPreviewWidth}
              cornerRadius={9}
              footerOwnerName={entry.authorName}
              onSectionPress={noopCardPreviewHandler}
              onChange={noopCardPreviewHandler}
            />
          )}
        </View>
      </View>
      <CommunityFeedActionButton
        label={`Save rendered image for ${cardName}`}
        icon={<Download size={18} color="#46505d" strokeWidth={2.5} />}
        onPress={() => void onExportCardImage(entry.card, cardName, entry.authorName, entry.imageUrl)}
      />
    </View>
  );
}

function CommunityEmptyState({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <View style={{ padding: 22, alignItems: "center", gap: 10 }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: "#f0f2f5",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <View style={{ gap: 4 }}>
        <Text selectable={false} style={{ color: "#151820", fontSize: 16, fontWeight: "900", textAlign: "center" }}>
          {title}
        </Text>
        <Text selectable style={{ color: "#68707d", fontSize: 12, lineHeight: 17, fontWeight: "800", textAlign: "center" }}>
          {detail}
        </Text>
      </View>
    </View>
  );
}
