import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import {Image as ExpoImage} from "expo-image";
import {LinearGradient} from "expo-linear-gradient";
import {useFonts} from "expo-font";
import {StatusBar} from "expo-status-bar";
import {ArrowDown, ArrowUp, BookOpen, Check, Database, Download, Layers, ListPlus, Minus, Palette, Pencil, Plus, RefreshCw, RotateCw, Save, Share2, Shuffle, Sparkles, Trash2, Undo2, Upload, UserPlus, Users, X} from "lucide-react-native";
import {Component, memo, type ErrorInfo, type ReactNode, type RefObject, useCallback, useEffect, useMemo, useReducer, useRef, useState} from "react";
import {createPortal} from "react-dom";
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
import type {AuthChangeEvent, Session, User as SupabaseUser} from "@supabase/supabase-js";
import {Gesture, GestureDetector, GestureHandlerRootView} from "react-native-gesture-handler";
import Svg, {Path} from "react-native-svg";
import {captureRef as nativeViewShotCaptureRef} from "react-native-view-shot";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import {AccountModal} from "@/components/account-modal";
import {CardBackPicker} from "@/components/card-back-picker";
import {CardBackPreview} from "@/components/card-back-preview";
import {CardTransformSurface} from "@/components/card-transform-surface";
import {ArtGeneratorModal, ArtSourceModal, CardBackGeneratorModal, SetSymbolGeneratorModal} from "@/components/art-generator-modals";
import {CommunityPanel} from "@/components/community-panel";
import {
  CardPreview,
  getSubjectMaskSectionRectsForCard,
  getVisibleArtAspectRatioForCard,
  getVisibleArtRectForCard,
} from "@/components/card-preview";
import {loadHtmlImage, waitForFlattenedFrameComposites} from "@/lib/export-flatten";
import {EditorField} from "@/components/editor-field";
import {HybridSymbolStyleProvider} from "@/components/hybrid-symbol-style-context";
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
import {EarlyAccessCodeModal} from "@/components/early-access-code-modal";
import {PatchNotesModal} from "@/components/patch-notes-modal";
import {KeywordLibraryPanel, SectionEditorModal, type GeneratedSetSymbolEntry} from "@/components/section-editor-modal";
import {SET_SYMBOL_PRESETS, SetSymbolMark} from "@/components/set-symbol";
import {DEFAULT_CARD_BACK_ID, getCardBackOption, type CustomCardBackEntry} from "@/data/card-backs";
import {FULL_MAGIC_PACK, getTypeFrameSpec} from "@/data/full-magic-pack";
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
import {INITIAL_CARD} from "@/data/sample-card";
import {
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
  persistWebMediaBlob,
  persistWebMediaUri,
  resolveWebMediaObjectUrl,
  resolveWebMediaUri,
  setWebStorageItem,
} from "@/lib/web-media-store";
import {isCardMagicRemoteMediaReference, materializeRemoteCardDraftMedia} from "@/lib/account-media";
import {
  fetchAccountProfile,
  type AccountProfile,
} from "@/lib/account-profile";
import {
  addCollaborationSetCard,
  attachCollaborationSetCardImage,
  createCollaborationSetInviteLink,
  fetchCommunityNotifications,
  fetchCollaborationSetCardDraftForEditing,
  fetchCollaborationSetCards,
  fetchCollaborationSetMembers,
  fetchCollaborationSetPendingInvites,
  fetchCollaborationSets,
  fetchRemoteCardDraftForEditing,
  findRemoteCardRenderedImageById,
  findRemoteCardRenderedImage,
  findExistingCommunityCardImageByPath,
  findExistingCommunityCardImages,
  fetchRemoteCustomSetSymbols,
  fetchRemoteCardSets,
  fetchRemoteDeletionTombstones,
  getCommunitySetCardImageStoragePath,
  markCommunityNotificationsRead,
  inviteCollaborationSetMember,
  previewCollaborationSetInviteCode,
  publishCommunityCard,
  redeemCollaborationSetInviteCode,
  removeCollaborationSetCard,
  removeRemoteDeletedCardTombstone,
  removeRemoteDeletedSetTombstone,
  replaceRemoteCustomSetSymbols,
  replaceRemoteCardSets,
  searchCollaborationInviteProfiles,
  updateCommunityDisplayName,
  updateRemoteCardRenderedImage,
  upsertRemoteDeletionTombstones,
  uploadCommunityCardImage,
  uploadCommunityCardImageToPath,
  type AccountCardSetPayload,
  type AccountCustomSetSymbolPayload,
  type AccountDeletionTombstonesPayload,
  type CommunityNotificationPayload,
  type CommunitySetCardPayload,
  type CollaborationInviteProfileSuggestion,
  type CollaborationPendingInvitePayload,
  type CollaborationSetInviteLinkRole,
  type CollaborationSetInvitePreviewPayload,
  type CollaborationSetMemberPayload,
} from "@/lib/account-sets";
import {
  fixRulesTextViaEdge,
  generateAiImageEditViaEdge,
  generateAiImageViaEdge,
  generateSubjectMatteViaEdge,
  type AiCreditProgressResponse,
  type AiImageGenerationOptions,
  type SubjectMaskBoxPrompt,
  type SubjectMaskPointPrompt,
  SubjectMatteProviderError,
  type SubjectMatteDiagnostics,
} from "@/lib/ai-edge";
import {
  getImageDataUriParts,
  getImageManipulatorExtension,
  getImageManipulatorMimeType,
  getImageUriExtension,
  getImageUriLogDescriptor,
  readBlobAsDataUri,
} from "@/lib/image-codec";
import {
  createRoughSelectionBrushPath,
  getMaskEditSourcePoint,
  getPaddedSubjectMaskCropRegion,
  getPrimarySubjectComponentMask,
  getSelectionConstrainedSubjectComponentMask,
  groupRoughSelectionBrushSamples,
  scaleSubjectMaskBoxPromptForRequest,
  scaleSubjectMaskPointPromptsForRequest,
  SUBJECT_MASK_GEOMETRY_REQUEST_MAX_DIMENSION,
  SUBJECT_MASK_PAINTED_CROP_MAX_DIMENSION,
  SUBJECT_MASK_REQUEST_MAX_DIMENSION,
  type MaskEditDisplayLayout,
  type RoughSelectionBrushSample,
  type SubjectMaskCropRegion,
  type SubjectMaskCropRequest,
  type SubjectMaskSelectionSample,
} from "@/lib/subject-mask";
import {
  DEFAULT_SUBJECT_MASK_FIT_MODE,
  normalizeSubjectMaskFitMode,
  normalizeSubjectMaskSections,
  resolveSubjectMaskSections,
} from "@/lib/subject-mask-sections";
import {CARDMAGIC_APP_VERSION} from "@/lib/app-version";
import {formatCompactCommentDate} from "@/lib/format-comment-date";
import type {ArtImageQuality} from "@/lib/art-image-quality";
import type {ArtLibraryEntry, ArtLibrarySource, CardBackGeneratorMode, SubjectMaskTraceEntry} from "@/types/art";
import {isReleaseVersionNewer} from "@/lib/semver";
import {createUuid} from "@/lib/uuid";
import {getPreviewTypeFrame} from "@/lib/preview-type-frame";
import type {
  CardSet,
  MainScrollBoundaryHandler,
  MainScrollWindow,
  PreviewTypeFrame,
  SetCardSnapshot,
} from "@/types/app-domain";
import {
  createPendingStripeCheckoutPopup,
  createStripeCheckoutUrl,
  fetchRemoteUserProgress,
  hasRedeemedPromotionalCreditCode,
  recordCreditTransaction,
  updateRemoteUserProgress,
  type CheckoutProductId,
  type CreditTransactionType,
} from "@/lib/commerce";
import {getResizedCommunityImageUrl} from "@/lib/community-image";
import {
  CARDMAGIC_RELEASE_BRANCH,
  CARDMAGIC_VISIBLE_PATCH_NOTES,
  type CardMagicReleaseBranch,
} from "@/lib/patch-notes";
import {
  FRAME_SELECTION_LABELS,
  FRAME_TREATMENT_LABELS,
  getFrameColors,
  inferFrameIdentity,
  normalizeManaInput,
} from "@/lib/card-style";
import {
  getNextDfcFacePatch,
  getEditableCardFace,
  isDfcBackFace,
  isTransformingTypeFrame,
  toDfcFacePatch,
} from "@/lib/dfc";
import {
  DEFAULT_ART_TRANSFORM,
  cardEditorReducer,
  createStarterCard,
  withDefaultCardCredit,
} from "@/lib/card-editor-reducer";
import {
  applyProgressEvent,
  canSpendCredits,
  createDefaultUserProgress,
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
import {fetchCardMagicReleaseDeployment, type CardMagicReleaseDeployment} from "@/lib/release-metadata";
import {isSupabaseConfigured, supabase} from "@/lib/supabase";
import {getSplitHalf, getSplitLayout, isSplitTypeFrame, toSplitHalfCard} from "@/lib/split-card";
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
  SubjectMaskSection,
  TypeFrame,
} from "@/types/card";

const BORDERLESS_TREATMENT_PREVIEW_SOURCE = require("./assets/card-assets/basic-m15/mse-renderer/treatments/borderless/mask-frame.png");
const CARDMAGIC_SINGLE_EXPORT_PREVIEW_ID = "cardmagic-single-export-preview";
const CARDMAGIC_BATCH_EXPORT_PREVIEW_ID = "cardmagic-batch-export-preview";
const PREFETCHED_SET_THUMBNAIL_URLS = new Set<string>();
const SET_THUMBNAIL_PREFETCH_URL_CACHE_LIMIT = 256;
const RELEASE_FRESHNESS_CHECK_INTERVAL_MS = 3 * 60 * 1000;
const SET_CARD_RENDER_IMAGE_WIDTH = 750;
const SET_CARD_RENDER_STATUS_MAX_ENTRIES = 120;
const SET_CARD_IMAGE_UPLOAD_CONCURRENCY = 3;
const SET_CARD_IMAGE_UPLOAD_PAYLOAD_LIMIT = 3;
const SET_CARD_IMAGE_UPLOAD_CONTENT_TYPE = "image/jpeg";
const SET_CARD_IMAGE_UPLOAD_MAX_BYTES = 4.5 * 1024 * 1024;
const SET_CARD_IMAGE_UPLOAD_ATTEMPTS = [
  { width: 750, quality: 1 },
  { width: 700, quality: 1 },
  { width: 640, quality: 1 },
  { width: 560, quality: 1 },
] as const;
const COLLABORATION_SET_CACHE_MAX_SERIALIZED_LENGTH = 12 * 1024 * 1024;
const COLLABORATION_SET_CACHE_MAX_TOTAL_CARDS = 900;
const COLLABORATION_SET_CACHE_MAX_CARDS_PER_SET = 240;
const COLLABORATION_CACHE_CARD_MEDIA_KEYS = [
  "artUri",
  "artSubjectMaskUri",
  "backArtUri",
  "backArtSubjectMaskUri",
  "setSymbolUri",
  "watermarkUri",
] as const satisfies readonly (keyof CardDraft)[];
const COLLABORATION_CACHE_SUBJECT_MASK_COMPONENT_KEYS = [
  "artSubjectMaskComponents",
  "backArtSubjectMaskComponents",
] as const satisfies readonly (keyof CardDraft)[];

function isPublicRenderedCardImageUrl(imageUrl: string | undefined) {
  return typeof imageUrl === "string" && /^https?:\/\//i.test(imageUrl);
}

function getSavedSetCardThumbnailUploadId(snapshotId: string) {
  return `set-card-${snapshotId}-thumbnail`;
}

function rememberPrefetchedSetThumbnailUrl(imageUrl: string) {
  if (PREFETCHED_SET_THUMBNAIL_URLS.has(imageUrl)) {
    return false;
  }

  PREFETCHED_SET_THUMBNAIL_URLS.add(imageUrl);

  while (PREFETCHED_SET_THUMBNAIL_URLS.size > SET_THUMBNAIL_PREFETCH_URL_CACHE_LIMIT) {
    const oldestUrl = PREFETCHED_SET_THUMBNAIL_URLS.values().next().value;

    if (typeof oldestUrl !== "string") {
      break;
    }

    PREFETCHED_SET_THUMBNAIL_URLS.delete(oldestUrl);
  }

  return true;
}

function withSavedSetCardThumbnailVersion(imageUrl: string, savedAt: string) {
  if (!isPublicRenderedCardImageUrl(imageUrl)) {
    return imageUrl;
  }

  try {
    const url = new URL(imageUrl);
    url.searchParams.set("v", savedAt);
    return url.toString();
  } catch {
    const separator = imageUrl.includes("?") ? "&" : "?";
    return `${imageUrl}${separator}v=${encodeURIComponent(savedAt)}`;
  }
}

function getMergedRenderedImageUrl(
  preferredImageUrl: string | undefined,
  fallbackImageUrl: string | undefined,
) {
  if (isPublicRenderedCardImageUrl(preferredImageUrl)) {
    return preferredImageUrl;
  }

  if (isPublicRenderedCardImageUrl(fallbackImageUrl)) {
    return fallbackImageUrl;
  }

  return preferredImageUrl ?? fallbackImageUrl;
}

function mergeSetCardRenderedImageUrl(
  preferredSnapshot: SetCardSnapshot,
  fallbackSnapshot: SetCardSnapshot,
) {
  const renderedImageUrl = getMergedRenderedImageUrl(
    preferredSnapshot.renderedImageUrl,
    fallbackSnapshot.renderedImageUrl,
  );

  if (renderedImageUrl === preferredSnapshot.renderedImageUrl) {
    return preferredSnapshot;
  }

  return {
    ...preferredSnapshot,
    renderedImageUrl,
  };
}

function normalizeCollaborationInviteCode(value: string | null | undefined) {
  const normalizedCode = value?.trim().toLowerCase() ?? "";

  return /^[a-f0-9]{32}$/.test(normalizedCode) ? normalizedCode : null;
}

function getCollaborationInviteCodeFromUrl(url: URL) {
  for (const param of COLLABORATION_INVITE_QUERY_PARAMS) {
    const inviteCode = normalizeCollaborationInviteCode(url.searchParams.get(param));

    if (inviteCode) {
      return inviteCode;
    }
  }

  return null;
}

function removeCollaborationInviteParamsFromUrl(url: URL) {
  for (const param of COLLABORATION_INVITE_QUERY_PARAMS) {
    url.searchParams.delete(param);
  }
}

async function loadPendingCollaborationInviteCode() {
  return normalizeCollaborationInviteCode(
    await getWebStorageItem(PENDING_COLLABORATION_INVITE_STORAGE_KEY),
  );
}

async function storePendingCollaborationInviteCode(inviteCode: string) {
  const normalizedInviteCode = normalizeCollaborationInviteCode(inviteCode);

  if (!normalizedInviteCode) {
    return null;
  }

  await setWebStorageItem(PENDING_COLLABORATION_INVITE_STORAGE_KEY, normalizedInviteCode);

  return normalizedInviteCode;
}

async function clearPendingCollaborationInviteCode() {
  await setWebStorageItem(PENDING_COLLABORATION_INVITE_STORAGE_KEY, "");
}

function createCollaborationInviteUrl(inviteCode: string) {
  const normalizedInviteCode = normalizeCollaborationInviteCode(inviteCode);

  if (!normalizedInviteCode) {
    throw new Error("Supabase returned an invalid collaboration invite token.");
  }

  if (Platform.OS === "web" && typeof window !== "undefined") {
    const inviteUrl = new URL(window.location.href);

    inviteUrl.search = "";
    inviteUrl.hash = "";
    inviteUrl.searchParams.set(COLLABORATION_INVITE_QUERY_PARAM, normalizedInviteCode);

    return inviteUrl.toString();
  }

  return `https://cardmagic.craftsmannsoftware.com/?${COLLABORATION_INVITE_QUERY_PARAM}=${encodeURIComponent(normalizedInviteCode)}`;
}

async function copyTextToClipboardOrShare(text: string) {
  if (Platform.OS === "web") {
    const clipboard = typeof navigator !== "undefined" ? navigator.clipboard : undefined;

    if (!clipboard?.writeText) {
      throw new Error("Clipboard access is not available in this browser.");
    }

    await clipboard.writeText(text);
    return;
  }

  await Share.share({ message: text });
}

type InspectorTab = "edit" | "keywords" | "sets" | "community";
type VisibleInspectorTab = Exclude<InspectorTab, "keywords">;

type SetCardImageRenderPhase =
  | "checking-remote"
  | "queued"
  | "mounting"
  | "loading-assets"
  | "capturing"
  | "saving-local"
  | "ready-local"
  | "promoting-local"
  | "waiting-upload-slot"
  | "upload-queued"
  | "uploading"
  | "persisting"
  | "ready-remote"
  | "failed";

type SetCardImageRenderStatus = {
  phase: SetCardImageRenderPhase;
  label: string;
  detail?: string;
  imageUrl?: string;
  updatedAt: number;
};

type SetCardImageRenderStatusDraft = Omit<SetCardImageRenderStatus, "updatedAt">;

function isSetCardImageRenderFailure(status: SetCardImageRenderStatus | undefined) {
  return status?.phase === "failed";
}

function isSetCardImageRenderProgress(status: SetCardImageRenderStatus | undefined) {
  return Boolean(status && status.phase !== "failed" && status.phase !== "ready-remote");
}

function isAnonymousSupabaseUser(user: SupabaseUser | null | undefined) {
  return Boolean(user && "is_anonymous" in user && user.is_anonymous);
}

function getVisibleAccountUser(user: SupabaseUser | null | undefined) {
  return isAnonymousSupabaseUser(user) ? null : user ?? null;
}

type SavedSetCardImageRequest = {
  setId: string;
  snapshot: SetCardSnapshot;
  remoteCardId?: string;
  remoteImageOwnerUserId?: string;
  canPersistRemoteImage: boolean;
  allowBackgroundRender: boolean;
  forceRefresh?: boolean;
};

type SavedSetCardImageUploadRequest = {
  renderKey: string;
  request: SavedSetCardImageRequest;
  user: SupabaseUser;
  localImageUrl: string;
  uploadBody: Blob | ArrayBuffer | Uint8Array;
  uploadContentType: string;
};

function getSetCardImageRenderErrorDetail(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message.slice(0, 120);
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim().slice(0, 120);
  }

  return "Check browser console for details";
}

type CardRecoverySnapshot = {
  id: string;
  savedAt: string;
  reason: "tab-switch" | "autosave";
  setId: string;
  setName: string;
  activeSetCardId: string | null;
  activeSetCardSetId: string | null;
  card: CardDraft;
};

type StoredCollaborationSetCache = {
  schemaVersion: 1;
  userId: string;
  cachedAt: string;
  sets: CardSet[];
};

type StoredEditorSessionState = {
  schemaVersion: 1;
  selectedSetId: string;
  activeSetCardId: string | null;
  activeSetCardSetId: string | null;
  inspectorTab: VisibleInspectorTab;
};

type LatestSavedSetCardReference = {
  setId: string;
  snapshot: SetCardSnapshot;
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
      renderWidth?: number;
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
const COLLABORATION_SET_CACHE_STORAGE_KEY_PREFIX = "cardmagic.collaborationSetsCache.v1";
const COLLABORATION_SET_SIGN_OUT_PRUNE_DELAY_MS = 2500;
const COLLABORATION_ROSTER_STALE_MS = 120000;
const PENDING_COLLABORATION_INVITE_STORAGE_KEY = "cardmagic.pendingCollaborationInvite.v1";
const COLLABORATION_INVITE_QUERY_PARAM = "setInvite";
const COLLABORATION_INVITE_QUERY_PARAMS = [
  COLLABORATION_INVITE_QUERY_PARAM,
  "invite",
  "inviteCode",
  "setInviteCode",
] as const;
const DELETION_TOMBSTONE_STORAGE_KEY = "cardmagic.deletionTombstones.v1";
const ACTIVE_CARD_STORAGE_KEY = "cardmagic.activeCard.v1";
const EDITOR_SESSION_STORAGE_KEY = "cardmagic.editorSession.v1";
const CARD_RECOVERY_SNAPSHOT_STORAGE_KEY = "cardmagic.cardRecoverySnapshots.v1";
const CARD_RECOVERY_SNAPSHOT_LIMIT = 24;
const ART_LIBRARY_STORAGE_KEY = "cardmagic.artLibrary.v1";
const CUSTOM_CARD_BACK_STORAGE_KEY = "cardmagic.customCardBacks.v1";
const DEFAULT_CARD_BACK_RESKIN_ID = "custom:card-back-default-reskin" as CardBackId;
const GENERATED_SET_SYMBOL_STORAGE_KEY = "cardmagic.generatedSetSymbols.v1";
const USER_PROGRESS_STORAGE_KEY = "cardmagic.userProgress.v1";
const CREATOR_TOOLS_VISIBILITY_STORAGE_KEY = "cardmagic.creatorToolsVisible.v1";
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
const FRAME_STYLE_MENU_GRID_COLUMNS = 3;
const FRAME_STYLE_MENU_CONTENT_WIDTH =
  FRAME_STYLE_PREVIEW_BUTTON_WIDTH * FRAME_STYLE_MENU_GRID_COLUMNS +
  FRAME_STYLE_PREVIEW_GRID_GAP * (FRAME_STYLE_MENU_GRID_COLUMNS - 1) +
  FRAME_STYLE_PREVIEW_SCROLL_PADDING_RIGHT;
const FRAME_STYLE_MENU_BASE_WIDTH =
  FRAME_STYLE_MENU_HORIZONTAL_PADDING * 2 +
  FRAME_STYLE_MENU_CONTENT_WIDTH;
const EDITOR_CARD_MIN_WIDTH = 272;
const EDITOR_CARD_COMPACT_MAX_WIDTH = 374;
const EDITOR_CARD_TABLET_MAX_WIDTH = 430;
const EDITOR_CARD_DESKTOP_MAX_WIDTH = 480;
const EDITOR_CARD_WIDE_DESKTOP_MAX_WIDTH = 520;
const EDITOR_TABLET_BREAKPOINT = 700;
const EDITOR_DESKTOP_BREAKPOINT = 900;
const EDITOR_WIDE_DESKTOP_BREAKPOINT = 1180;
const PREVIEW_FLOATING_TOOLBAR_CARD_GAP_RESERVE = 18;
const PREVIEW_FLOATING_TOOLBAR_Z_INDEX = 12;
const PREVIEW_FLOATING_TOOLBAR_MENU_Z_INDEX = 24;
const EDIT_TAB_VERTICAL_CHROME_HEIGHT = 98;
const BOTTOM_TAB_BAR_HEIGHT = 62;
// Shared stable no-op for read-only CardPreview renders (thumbnails, exports).
// A module-level reference lets the memoized CardPreview skip re-rendering when
// its host re-renders, instead of receiving a fresh `() => undefined` each time.
const noopCardPreviewHandler = () => undefined;
const CARD_BACK_PREVIEW_ASPECT_RATIO = 375 / 523;
const ART_ADJUSTMENT_CROP_RADIUS = 6;
const ART_LIBRARY_MAX_ENTRIES = 96;
const CUSTOM_CARD_BACK_MAX_ENTRIES = 48;
const GENERATED_SET_SYMBOL_MAX_ENTRIES = 48;
const SET_GRID_INITIAL_CARD_LIMIT = 12;
const SET_GRID_PAGE_SIZE = 12;
const SET_GRID_COMPACT_INITIAL_CARD_LIMIT = 4;
const SET_GRID_COMPACT_PAGE_SIZE = 4;
const SET_GRID_VIRTUAL_OVERSCAN_PX = 900;
const SET_GRID_COMPACT_VIRTUAL_OVERSCAN_PX = 120;
const SET_GRID_INITIAL_MOUNT_ROWS = 3;
const SET_GRID_COMPACT_INITIAL_MOUNT_ROWS = 1;
const SET_LIST_INITIAL_LIMIT = 80;
const SET_LIST_PAGE_SIZE = 80;
const SET_LIST_COMPACT_INITIAL_LIMIT = 24;
const SET_LIST_COMPACT_PAGE_SIZE = 24;
const MAIN_SCROLL_WINDOW_UPDATE_THRESHOLD = 96;
const SET_CARD_THUMBNAIL_RADIUS = 5;
const COLOR_IDENTITY_SORT_ORDER: ManaColor[] = ["W", "U", "B", "R", "G"];
type PickedImageAsset = Pick<ImagePicker.ImagePickerAsset, "uri" | "width" | "height">;
type ArtAdjustmentInitialMode = "crop" | "mask";

function createSetGridCardStub(card: CommunitySetCardPayload): CardDraft {
  return normalizeStoredCardDraft({
    name: card.name,
    typeLine: card.typeLine,
    rarity: card.rarity,
    frameColors: card.colors,
    frameTreatment: card.frameTreatment,
  });
}

function cardHasUnresolvedRemoteMedia(card: CardDraft) {
  for (const key of COLLABORATION_CACHE_CARD_MEDIA_KEYS) {
    const value = card[key];

    if (typeof value === "string" && isCardMagicRemoteMediaReference(value)) {
      return true;
    }
  }

  for (const key of COLLABORATION_CACHE_SUBJECT_MASK_COMPONENT_KEYS) {
    const components = card[key];

    if (!Array.isArray(components)) {
      continue;
    }

    if (components.some((component) =>
      typeof component?.cutoutUrl === "string" && isCardMagicRemoteMediaReference(component.cutoutUrl)
    )) {
      return true;
    }
  }

  return false;
}

function shouldUseEditorReadySetCardDraft(card: CardDraft) {
  return !cardHasUnresolvedRemoteMedia(card);
}

type StoredActiveCardDraft = {
  schemaVersion: 1;
  card: CardDraft;
  dirty?: boolean;
  selectedSetId?: string | null;
  activeSetCardId?: string | null;
  activeSetCardSetId?: string | null;
  updatedAt?: string;
};

type HydratedActiveCardDraft = {
  card: CardDraft;
  dirty: boolean;
  selectedSetId: string | null;
  activeSetCardId: string | null;
  activeSetCardSetId: string | null;
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

function cardDraftHasWebMediaReferences(card: CardDraft) {
  for (const key of COLLABORATION_CACHE_CARD_MEDIA_KEYS) {
    const uri = card[key];

    if (typeof uri === "string" && isWebMediaReference(uri)) {
      return true;
    }
  }

  for (const key of COLLABORATION_CACHE_SUBJECT_MASK_COMPONENT_KEYS) {
    const components = card[key];

    if (!Array.isArray(components)) {
      continue;
    }

    if (components.some((component) =>
      typeof component?.cutoutUrl === "string" && isWebMediaReference(component.cutoutUrl)
    )) {
      return true;
    }
  }

  return false;
}

async function materializeCardDraftWebMediaReferences(card: CardDraft, prefix: string): Promise<CardDraft> {
  if (Platform.OS !== "web" || !cardDraftHasWebMediaReferences(card)) {
    return card;
  }

  let nextCard = card;

  for (const key of COLLABORATION_CACHE_CARD_MEDIA_KEYS) {
    const uri = nextCard[key];

    if (typeof uri !== "string" || !isWebMediaReference(uri)) {
      continue;
    }

    try {
      const materializedUri = await resolveWebMediaUri(uri, `image/${getImageUriExtension(uri)}`);

      if (materializedUri !== uri) {
        nextCard = {
          ...nextCard,
          [key]: materializedUri,
        };
      }
    } catch (error) {
      logStorageWarning("Unable to materialize saved card web-media reference; preserving original URI.", {
        prefix,
        field: key,
        uri: getImageUriLogDescriptor(uri),
        error,
      });
    }
  }

  const materializeSubjectMaskComponents = async (
    key: "artSubjectMaskComponents" | "backArtSubjectMaskComponents",
  ) => {
    const components = nextCard[key];

    if (!components?.length) {
      return;
    }

    let changed = false;
    const nextComponents: SubjectMaskComponent[] = [];

    for (let index = 0; index < components.length; index += 1) {
      const component = components[index];
      let cutoutUrl = component.cutoutUrl;

      if (isWebMediaReference(cutoutUrl)) {
        try {
          cutoutUrl = await resolveWebMediaUri(cutoutUrl, `image/${getImageUriExtension(cutoutUrl)}`);
        } catch (error) {
          logStorageWarning("Unable to materialize subject-mask web-media reference; preserving original URI.", {
            prefix,
            field: key,
            concept: component.concept,
            uri: getImageUriLogDescriptor(component.cutoutUrl),
            error,
          });
        }
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

async function materializeCardDraftForExport(card: CardDraft, prefix: string): Promise<CardDraft> {
  const remoteMaterializedCard = await materializeRemoteCardDraftMedia(cloneCardDraft(card));

  return materializeCardDraftImageDataUris(remoteMaterializedCard, prefix);
}

function isLocalOrInlineMediaUri(uri: string | undefined) {
  if (!uri) {
    return false;
  }

  return (
    uri.startsWith("data:") ||
    uri.startsWith("blob:") ||
    uri.startsWith("file:") ||
    uri.startsWith("content:") ||
    isWebMediaReference(uri)
  );
}

function compactCardDraftForCollaborationCache(card: CardDraft): CardDraft {
  const nextCard = cloneCardDraft(card) as CardDraft & Record<string, unknown>;

  for (const key of COLLABORATION_CACHE_CARD_MEDIA_KEYS) {
    const uri = nextCard[key];

    if (typeof uri === "string" && isLocalOrInlineMediaUri(uri)) {
      delete nextCard[key];
    }
  }

  for (const key of COLLABORATION_CACHE_SUBJECT_MASK_COMPONENT_KEYS) {
    const components = nextCard[key];

    if (!Array.isArray(components)) {
      continue;
    }

    const compactComponents = components.filter((component): component is SubjectMaskComponent => (
      Boolean(component) &&
      typeof component === "object" &&
      typeof (component as SubjectMaskComponent).cutoutUrl === "string" &&
      !isLocalOrInlineMediaUri((component as SubjectMaskComponent).cutoutUrl)
    ));

    if (compactComponents.length === components.length) {
      continue;
    }

    if (compactComponents.length > 0) {
      nextCard[key] = compactComponents;
    } else {
      delete nextCard[key];
    }
  }

  return normalizeStoredCardDraft(nextCard);
}

function compactCollaborationSetForCache(set: CardSet): CardSet {
  const normalizedSet = normalizeCardSet(set);
  const setSymbolUri = isLocalOrInlineMediaUri(normalizedSet.setSymbolUri)
    ? undefined
    : normalizedSet.setSymbolUri;

  return normalizeCardSet({
    ...normalizedSet,
    setSymbolUri,
    cards: normalizedSet.cards.map((snapshot) => {
      const renderedImageUrl = isPublicRenderedCardImageUrl(snapshot.renderedImageUrl)
        ? snapshot.renderedImageUrl
        : undefined;
      const compactSnapshot: SetCardSnapshot = {
        ...snapshot,
        card: compactCardDraftForCollaborationCache(snapshot.card),
      };

      if (renderedImageUrl) {
        compactSnapshot.renderedImageUrl = renderedImageUrl;
      } else {
        delete compactSnapshot.renderedImageUrl;
      }

      return compactSnapshot;
    }),
  });
}

function compactCollaborationSetsForCache(sets: CardSet[], userId: string): CardSet[] {
  return normalizeCardSets(getSharedAccountCardSets(sets, userId).map(compactCollaborationSetForCache));
}

function budgetCollaborationSetsForCache(sets: CardSet[]): CardSet[] {
  let remainingCards = COLLABORATION_SET_CACHE_MAX_TOTAL_CARDS;

  return normalizeCardSets(
    sets.map((set) => {
      const cardLimit = Math.max(0, Math.min(
        set.cards.length,
        COLLABORATION_SET_CACHE_MAX_CARDS_PER_SET,
        remainingCards,
      ));
      remainingCards -= cardLimit;

      return cardLimit === set.cards.length ? set : { ...set, cards: set.cards.slice(0, cardLimit) };
    }),
  );
}

function getCollaborationSetCacheDroppedCardCount(originalSets: CardSet[], cachedSets: CardSet[]) {
  const cachedCardCountsBySetId = new Map(cachedSets.map((set) => [set.id, set.cards.length]));

  return originalSets.reduce((total, set) => {
    const cachedCount = cachedCardCountsBySetId.get(set.id) ?? 0;

    return total + Math.max(0, set.cards.length - cachedCount);
  }, 0);
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

function shouldPersistWebMediaUri(uri: string | undefined) {
  if (!uri || isWebMediaReference(uri) || isCardMagicRemoteMediaReference(uri)) {
    return false;
  }

  return (
    uri.startsWith("data:") ||
    uri.startsWith("blob:") ||
    uri.startsWith("file:") ||
    uri.startsWith("content:") ||
    /^https?:\/\//i.test(uri)
  );
}

function cardDraftNeedsWebMediaPersistence(card: CardDraft) {
  for (const key of COLLABORATION_CACHE_CARD_MEDIA_KEYS) {
    const uri = card[key];

    if (typeof uri === "string" && shouldPersistWebMediaUri(uri)) {
      return true;
    }
  }

  for (const key of COLLABORATION_CACHE_SUBJECT_MASK_COMPONENT_KEYS) {
    const components = card[key];

    if (!Array.isArray(components)) {
      continue;
    }

    if (components.some((component) =>
      typeof component?.cutoutUrl === "string" && shouldPersistWebMediaUri(component.cutoutUrl)
    )) {
      return true;
    }
  }

  return false;
}

function cardSetNeedsWebMediaPersistence(set: CardSet) {
  if (shouldPersistWebMediaUri(set.setSymbolUri)) {
    return true;
  }

  return set.cards.some((snapshot) => cardDraftNeedsWebMediaPersistence(snapshot.card));
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
  if (Platform.OS === "web" && !cardSetNeedsWebMediaPersistence(set)) {
    return set;
  }

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
type SubjectMatteNormalizeOptions = {
  keepAllComponents?: boolean;
  selectionBoxPrompt?: SubjectMaskBoxPrompt;
  selectionPointPrompts?: SubjectMaskPointPrompt[];
  selectionBrushSamples?: SubjectMaskSelectionSample[];
  selectionBrushRadius?: number;
};

function getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => {
        if (width > 0 && height > 0) {
          resolve({ width, height });
        } else {
          reject(new Error("CardMagic could not read the image dimensions."));
        }
      },
      reject,
    );
  });
}

async function downscaleImageForMaskRequest(uri: string, requestMaxDimension = SUBJECT_MASK_REQUEST_MAX_DIMENSION) {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: requestMaxDimension } }],
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

async function createPaintedSelectionCropRequest(
  imageUri: string,
  boxPrompt: SubjectMaskBoxPrompt,
  sourceDimensions: { width: number; height: number },
): Promise<SubjectMaskCropRequest> {
  const cropRegion = getPaddedSubjectMaskCropRegion(boxPrompt, sourceDimensions);
  const actions = [
    {
      crop: {
        originX: cropRegion.x,
        originY: cropRegion.y,
        width: cropRegion.width,
        height: cropRegion.height,
      },
    },
    ...(cropRegion.width > SUBJECT_MASK_PAINTED_CROP_MAX_DIMENSION
      ? [{ resize: { width: SUBJECT_MASK_PAINTED_CROP_MAX_DIMENSION } }]
      : []),
  ];

  const result = await ImageManipulator.manipulateAsync(
    imageUri,
    actions,
    { compress: 0.88, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  const uri = result.base64
    ? `data:image/jpeg;base64,${result.base64}`
    : Platform.OS === "web"
      ? await readWebImageUriAsDataUri(result.uri, "image/jpeg")
      : result.uri;

  return {
    uri,
    cropRegion,
    width: result.width || cropRegion.width,
    height: result.height || cropRegion.height,
  };
}

async function expandSubjectCropCutoutToSourceCanvas(
  cutoutUri: string,
  cropRegion: SubjectMaskCropRegion,
) {
  if (Platform.OS !== "web" || typeof document === "undefined") {
    return cutoutUri;
  }

  const cutoutImage = await loadHtmlImage(cutoutUri);
  const width = cropRegion.sourceWidth;
  const height = cropRegion.sourceHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return cutoutUri;
  }

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(cutoutImage, cropRegion.x, cropRegion.y, cropRegion.width, cropRegion.height);

  return canvas.toDataURL("image/png");
}

async function materializeSubjectCropCutoutOnSourceCanvas(
  cutoutUri: string,
  cropRegion: SubjectMaskCropRegion,
) {
  const cropCutoutUri = await materializeImageUri(cutoutUri, "subject-matte-crop");
  const sourceCanvasCutoutUri = await expandSubjectCropCutoutToSourceCanvas(cropCutoutUri, cropRegion);

  return materializeImageUri(sourceCanvasCutoutUri, "subject-matte");
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
  options?: SubjectMatteNormalizeOptions,
) {
  const materializedUri = await materializeImageUri(uri, "subject-matte");

  if (Platform.OS !== "web") {
    return materializedUri;
  }

  try {
    return await createWebSubjectAlphaMask(materializedUri, sourceImageUri, options);
  } catch (error) {
    console.warn("Unable to normalize subject matte alpha; using provider output.", error);
    return materializedUri;
  }
}

async function createWebSubjectAlphaMask(uri: string, sourceImageUri?: string, options?: SubjectMatteNormalizeOptions) {
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
  const selectionSubjectMask =
    options?.selectionBoxPrompt || options?.selectionPointPrompts?.length
      ? getSelectionConstrainedSubjectComponentMask(sourceAlpha, width, height, {
        boxPrompt: options.selectionBoxPrompt,
        pointPrompts: options.selectionPointPrompts,
        brushSamples: options.selectionBrushSamples,
        brushRadius: options.selectionBrushRadius,
      })
      : null;

  const primarySubjectMask = selectionSubjectMask ?? (
    options?.keepAllComponents
      ? null
      : getPrimarySubjectComponentMask(sourceAlpha, width, height)
  );

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
              ? { ...setCard, card: cloneCardDraft(resolvedCard), savedAt: timestamp, renderedImageUrl: undefined }
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
const SET_COLLECTOR_CATEGORY_RANKS = {
  multicolor: 5,
  colorless: 6,
  nonbasicLand: 7,
  basicLand: 8,
} as const;

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

    if (!existing) {
      snapshotsById.set(snapshot.id, snapshot);
    } else if (snapshotTime >= existingTime) {
      snapshotsById.set(snapshot.id, mergeSetCardRenderedImageUrl(snapshot, existing));
    } else {
      snapshotsById.set(snapshot.id, mergeSetCardRenderedImageUrl(existing, snapshot));
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

      if (!localSnapshot) {
        cardsById.set(snapshot.id, snapshot);
      } else if (remoteIsNewer) {
        cardsById.set(snapshot.id, mergeSetCardRenderedImageUrl(snapshot, localSnapshot));
      } else {
        cardsById.set(snapshot.id, mergeSetCardRenderedImageUrl(localSnapshot, snapshot));
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

function getLatestSavedSetCardReference(sets: CardSet[]): LatestSavedSetCardReference | null {
  let latestReference: LatestSavedSetCardReference | null = null;
  let latestSavedAt = Number.NEGATIVE_INFINITY;

  for (const set of normalizeCardSets(sets)) {
    for (const snapshot of set.cards) {
      const savedAt = new Date(snapshot.savedAt).getTime();

      if (!Number.isFinite(savedAt)) {
        continue;
      }

      if (!latestReference || savedAt > latestSavedAt) {
        latestReference = { setId: set.id, snapshot };
        latestSavedAt = savedAt;
      }
    }
  }

  return latestReference;
}

function isOwnedAccountCardSet(set: CardSet, accountUserId: string) {
  return !set.ownerUserId || set.ownerUserId === accountUserId;
}

function canDeleteCardSetContent(set: CardSet, accountUserId?: string) {
  return !set.ownerUserId || set.ownerUserId === accountUserId;
}

function isSetCardSnapshotCreator(snapshot: SetCardSnapshot, accountUserId?: string) {
  if (!accountUserId) {
    return false;
  }

  if (snapshot.remoteImageOwnerUserId === accountUserId) {
    return true;
  }

  return Boolean(snapshot.remoteCardId?.startsWith(`${accountUserId}:`));
}

function canRemoveCardSetSnapshot(set: CardSet, snapshot: SetCardSnapshot, accountUserId?: string) {
  return canDeleteCardSetContent(set, accountUserId) || isSetCardSnapshotCreator(snapshot, accountUserId);
}

function getOwnedAccountCardSets(sets: CardSet[], accountUserId: string): CardSet[] {
  return normalizeCardSets(sets).filter((set) => isOwnedAccountCardSet(set, accountUserId));
}

function getSharedAccountCardSets(sets: CardSet[], accountUserId: string): CardSet[] {
  return normalizeCardSets(sets).filter((set) => set.ownerUserId && set.ownerUserId !== accountUserId);
}

function getLocalPersistableCardSets(sets: CardSet[]): CardSet[] {
  return normalizeCardSets(sets).filter((set) => !set.ownerUserId);
}

function isEmptyBootstrapMainSet(set: CardSet) {
  return set.id === DEFAULT_MAIN_SET_ID && set.cards.length === 0;
}

function getStoredLocalCardSets(sets: CardSet[]): CardSet[] {
  return getLocalPersistableCardSets(sets).filter((set) => !isEmptyBootstrapMainSet(set));
}

function getRemotePersistableAccountCardSets(sets: CardSet[], accountUserId?: string): CardSet[] {
  const accountSets = accountUserId ? getOwnedAccountCardSets(sets, accountUserId) : normalizeCardSets(sets);

  return accountSets.filter((set) => !isEmptyBootstrapMainSet(set));
}

async function fetchSharedAccountCardSets(
  accountUserId: string,
  fallbackSharedSets: CardSet[] = [],
): Promise<CardSet[]> {
  const collaborationSets = await fetchCollaborationSets();
  const sharedSets = collaborationSets.filter((set) => set.ownerUserId && set.ownerUserId !== accountUserId);
  const fallbackSharedSetsById = new Map(
    normalizeCardSets(fallbackSharedSets)
      .filter((set) => set.ownerUserId && set.ownerUserId !== accountUserId && set.cards.length > 0)
      .map((set) => [set.id, set]),
  );

  const hydratedSets = await Promise.all(
    sharedSets.map(async (set) => {
      let cards: CommunitySetCardPayload[] = [];
      let cardHydrationFailed = false;

      try {
        cards = await fetchCollaborationSetCards(set.id);
      } catch (error) {
        cardHydrationFailed = true;
        console.warn("Unable to hydrate shared collaboration set cards.", {
          setId: set.id,
          ownerUserId: set.ownerUserId,
          error,
        });
      }

      const fallbackSet = fallbackSharedSetsById.get(set.id);
      const shouldUseFallbackCards =
        Boolean(fallbackSet) &&
        (cardHydrationFailed || (cards.length === 0 && set.cardCount > 0));

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
        cards: shouldUseFallbackCards
          ? fallbackSet!.cards
          : cards.map((card) => ({
              id: card.id,
              savedAt: card.updatedAt ?? card.createdAt,
              renderedImageUrl: card.imageUrl,
              remoteCardId: card.id,
              remoteImageOwnerUserId: card.userId,
              authorName: card.authorName,
              card: card.imageUrl ? createSetGridCardStub(card) : card.card,
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

function mergeDeletionTombstones(
  first: DeletionTombstones,
  second: AccountDeletionTombstonesPayload,
): DeletionTombstones {
  const setsById = new Map<string, DeletedSetTombstone>();
  const cardsByKey = new Map<string, DeletedCardTombstone>();

  const chooseNewerDeletedAt = <T extends { deletedAt: string }>(current: T | undefined, candidate: T) => {
    if (!current) {
      return candidate;
    }

    return new Date(candidate.deletedAt).getTime() >= new Date(current.deletedAt).getTime()
      ? candidate
      : current;
  };

  for (const entry of normalizeDeletionTombstones(first).sets) {
    setsById.set(entry.id, chooseNewerDeletedAt(setsById.get(entry.id), entry));
  }

  for (const entry of normalizeDeletionTombstones(second).sets) {
    setsById.set(entry.id, chooseNewerDeletedAt(setsById.get(entry.id), entry));
  }

  for (const entry of normalizeDeletionTombstones(first).cards) {
    const key = `${entry.setId}:${entry.cardId}`;
    cardsByKey.set(key, chooseNewerDeletedAt(cardsByKey.get(key), entry));
  }

  for (const entry of normalizeDeletionTombstones(second).cards) {
    const key = `${entry.setId}:${entry.cardId}`;
    cardsByKey.set(key, chooseNewerDeletedAt(cardsByKey.get(key), entry));
  }

  return normalizeDeletionTombstones({
    sets: Array.from(setsById.values()),
    cards: Array.from(cardsByKey.values()),
  });
}

function deletionTombstonesEqual(first: DeletionTombstones, second: DeletionTombstones) {
  return JSON.stringify(normalizeDeletionTombstones(first)) === JSON.stringify(normalizeDeletionTombstones(second));
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
  const accountSets = getRemotePersistableAccountCardSets(sets, accountUserId);

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

async function toRemotePersistableAccountCardSetPayloads(
  sets: CardSet[],
  accountUserId?: string,
): Promise<AccountCardSetPayload[]> {
  const payloads = toAccountCardSetPayloads(sets, accountUserId);
  const remotePayloads: AccountCardSetPayload[] = [];

  for (const set of payloads) {
    let setSymbolUri = set.setSymbolUri;

    if (setSymbolUri && isWebMediaReference(setSymbolUri)) {
      try {
        setSymbolUri = await resolveWebMediaUri(setSymbolUri, `image/${getImageUriExtension(setSymbolUri)}`);
      } catch (error) {
        logStorageWarning("Unable to materialize set symbol web-media reference before Supabase sync.", {
          setId: set.id,
          uri: getImageUriLogDescriptor(setSymbolUri),
          error,
        });
      }
    }

    const cards: AccountCardSetPayload["cards"] = [];

    for (const snapshot of set.cards) {
      cards.push({
        ...snapshot,
        card: await materializeCardDraftWebMediaReferences(
          snapshot.card,
          `remote-set-${set.id}-${snapshot.id}`,
        ),
      });
    }

    remotePayloads.push({
      ...set,
      setSymbolUri,
      cards,
    });
  }

  return remotePayloads;
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

type StoredCardRecord = Record<string, any>;

function logStorageInfo(message: string, detail?: unknown) {
  if (!__DEV__) {
    return;
  }

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
  normalized.artSubjectMaskSections = normalizeSubjectMaskSections(source.artSubjectMaskSections);
  normalized.backArtSubjectMaskSections = normalizeSubjectMaskSections(source.backArtSubjectMaskSections);
  normalized.artSubjectMaskFitMode = normalizeSubjectMaskFitMode(source.artSubjectMaskFitMode);
  normalized.backArtSubjectMaskFitMode = normalizeSubjectMaskFitMode(source.backArtSubjectMaskFitMode);
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
  const renderedImageUrl =
    typeof source.renderedImageUrl === "string" && source.renderedImageUrl.trim()
      ? source.renderedImageUrl
      : undefined;
  const remoteCardId =
    typeof source.remoteCardId === "string" && source.remoteCardId.trim()
      ? source.remoteCardId
      : undefined;
  const remoteImageOwnerUserId =
    typeof source.remoteImageOwnerUserId === "string" && source.remoteImageOwnerUserId.trim()
      ? source.remoteImageOwnerUserId
      : undefined;
  const authorName =
    typeof source.authorName === "string" && source.authorName.trim()
      ? source.authorName
      : undefined;

  return {
    id: typeof source.id === "string" && source.id.trim() ? source.id : `card-${Date.now()}-${index}`,
    savedAt: typeof source.savedAt === "string" && source.savedAt.trim()
      ? source.savedAt
      : new Date(0).toISOString(),
    ...(renderedImageUrl ? { renderedImageUrl } : null),
    ...(remoteCardId ? { remoteCardId } : null),
    ...(remoteImageOwnerUserId ? { remoteImageOwnerUserId } : null),
    ...(authorName ? { authorName } : null),
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
      categoryRank:
        basicLandRank >= 0
          ? SET_COLLECTOR_CATEGORY_RANKS.basicLand
          : SET_COLLECTOR_CATEGORY_RANKS.nonbasicLand,
      colorRank: basicLandRank >= 0 ? basicLandRank : 0,
      name,
    };
  }

  if (colors.length === 0) {
    return { categoryRank: SET_COLLECTOR_CATEGORY_RANKS.colorless, colorRank: 0, name };
  }

  if (colors.length === 1) {
    return {
      categoryRank: SET_NUMBER_COLOR_ORDER.indexOf(colors[0]),
      colorRank: 0,
      name,
    };
  }

  return { categoryRank: SET_COLLECTOR_CATEGORY_RANKS.multicolor, colorRank: 0, name };
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

    if (Platform.OS === "web") {
      logStorageInfo("Deferred saved set media materialization for web startup.", getCardSetStorageSummary(repairedPayload.sets));
      return repairedPayload.sets;
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

async function loadStoredActiveCardDraft(): Promise<HydratedActiveCardDraft | null> {
  try {
    const rawCard =
      Platform.OS === "web" && typeof window !== "undefined"
        ? await getWebStorageItem(ACTIVE_CARD_STORAGE_KEY)
        : await (await getNativeStorageAdapter())?.getItem(ACTIVE_CARD_STORAGE_KEY);

    if (!rawCard) {
      return null;
    }

    const parsed = JSON.parse(rawCard) as unknown;
    const storedPayload =
      Boolean(parsed) &&
      typeof parsed === "object" &&
      (parsed as StoredActiveCardDraft).schemaVersion === 1
        ? (parsed as StoredActiveCardDraft)
        : null;
    const candidate =
      storedPayload
        ? storedPayload.card
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

    const materializedCard = await materializeCardDraftImageDataUris(normalizedCard, "active-card");

    return {
      card: materializedCard,
      dirty: storedPayload && typeof storedPayload.dirty === "boolean" ? storedPayload.dirty : true,
      selectedSetId: typeof storedPayload?.selectedSetId === "string" ? storedPayload.selectedSetId : null,
      activeSetCardId: typeof storedPayload?.activeSetCardId === "string" ? storedPayload.activeSetCardId : null,
      activeSetCardSetId:
        typeof storedPayload?.activeSetCardSetId === "string" ? storedPayload.activeSetCardSetId : null,
    };
  } catch (error) {
    console.warn("Unable to load active CardMagic draft.", error);
    return null;
  }
}

function normalizeStoredEditorSessionState(value: unknown): StoredEditorSessionState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const rawSession = value as Partial<StoredEditorSessionState>;
  const inspectorTab =
    rawSession.inspectorTab === "sets" || rawSession.inspectorTab === "community"
      ? rawSession.inspectorTab
      : "edit";

  if (typeof rawSession.selectedSetId !== "string") {
    return null;
  }

  return {
    schemaVersion: 1,
    selectedSetId: rawSession.selectedSetId,
    activeSetCardId: typeof rawSession.activeSetCardId === "string" ? rawSession.activeSetCardId : null,
    activeSetCardSetId:
      typeof rawSession.activeSetCardSetId === "string" ? rawSession.activeSetCardSetId : null,
    inspectorTab,
  };
}

async function loadStoredEditorSessionState(): Promise<StoredEditorSessionState | null> {
  try {
    const rawSession =
      Platform.OS === "web" && typeof window !== "undefined"
        ? await getWebStorageItem(EDITOR_SESSION_STORAGE_KEY)
        : await (await getNativeStorageAdapter())?.getItem(EDITOR_SESSION_STORAGE_KEY);

    if (!rawSession) {
      return null;
    }

    const parsed = JSON.parse(rawSession) as unknown;
    const candidate =
      Boolean(parsed) &&
      typeof parsed === "object" &&
      (parsed as StoredEditorSessionState).schemaVersion === 1
        ? parsed
        : null;

    return normalizeStoredEditorSessionState(candidate);
  } catch (error) {
    console.warn("Unable to load CardMagic editor session state.", error);
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
    activeSetCardSetId:
      typeof rawSnapshot.activeSetCardSetId === "string"
        ? rawSnapshot.activeSetCardSetId
        : rawSnapshot.setId,
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

async function loadStoredCreatorToolsVisible(): Promise<boolean> {
  try {
    const rawValue =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.localStorage.getItem(CREATOR_TOOLS_VISIBILITY_STORAGE_KEY)
        : await (await getNativeStorageAdapter())?.getItem(CREATOR_TOOLS_VISIBILITY_STORAGE_KEY);

    return rawValue === "true";
  } catch (error) {
    console.warn("Unable to load CardMagic creator-tools visibility.", error);
    return false;
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
    const persistedSets = await persistCardSetsImageUris(getStoredLocalCardSets(sets));
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

function getCollaborationSetCacheStorageKey(userId: string) {
  return `${COLLABORATION_SET_CACHE_STORAGE_KEY_PREFIX}:${userId}`;
}

async function loadCachedCollaborationSets(userId: string): Promise<CardSet[] | null> {
  try {
    const storageKey = getCollaborationSetCacheStorageKey(userId);
    const rawSets =
      Platform.OS === "web" && typeof window !== "undefined"
        ? await getWebStorageItem(storageKey)
        : await (await getNativeStorageAdapter())?.getItem(storageKey);

    if (!rawSets) {
      return null;
    }

    if (rawSets.length > COLLABORATION_SET_CACHE_MAX_SERIALIZED_LENGTH) {
      logStorageWarning("Collaboration set cache exceeded the serialized memory budget; skipping cached hydration.", {
        key: storageKey,
        serializedLength: rawSets.length,
        maxSerializedLength: COLLABORATION_SET_CACHE_MAX_SERIALIZED_LENGTH,
      });

      const emptyPayload: StoredCollaborationSetCache = {
        schemaVersion: 1,
        userId,
        cachedAt: new Date().toISOString(),
        sets: [],
      };
      const emptySerializedSets = JSON.stringify(emptyPayload);

      if (Platform.OS === "web" && typeof window !== "undefined") {
        await setWebStorageItem(storageKey, emptySerializedSets);
      } else {
        await (await getNativeStorageAdapter())?.setItem(storageKey, emptySerializedSets);
      }

      return null;
    }

    const parsed = JSON.parse(rawSets) as unknown;
    const candidateSets =
      isStoredRecord(parsed) &&
      (parsed as Partial<StoredCollaborationSetCache>).schemaVersion === 1 &&
      (parsed as Partial<StoredCollaborationSetCache>).userId === userId
        ? (parsed as Partial<StoredCollaborationSetCache>).sets
        : parsed;
    const repairedPayload = normalizeStoredCardSetsPayload({ sets: candidateSets });

    if (!repairedPayload) {
      logStorageWarning("Collaboration set cache did not match a repairable schema.", {
        key: storageKey,
        shape: describeStoredValue(parsed),
      });
      return null;
    }

    const cachedSets = compactCollaborationSetsForCache(repairedPayload.sets, userId);

    logStorageInfo("Loaded cached collaboration sets.", {
      key: storageKey,
      ...(isStoredRecord(parsed) && typeof parsed.cachedAt === "string" ? { cachedAt: parsed.cachedAt } : null),
      serializedLength: rawSets.length,
      ...getCardSetStorageSummary(cachedSets),
    });

    return cachedSets.length > 0 ? cachedSets : null;
  } catch (error) {
    console.warn("Unable to load cached CardMagic collaboration sets.", error);
    return null;
  }
}

async function storeCachedCollaborationSets(userId: string, sets: CardSet[]) {
  try {
    const compactSets = compactCollaborationSetsForCache(sets, userId);
    const cachePayload: StoredCollaborationSetCache = {
      schemaVersion: 1,
      userId,
      cachedAt: new Date().toISOString(),
      sets: compactSets,
    };
    let serializedSets = JSON.stringify(cachePayload);
    let cachedSets = compactSets;

    if (serializedSets.length > COLLABORATION_SET_CACHE_MAX_SERIALIZED_LENGTH) {
      cachedSets = budgetCollaborationSetsForCache(compactSets);
      serializedSets = JSON.stringify({
        ...cachePayload,
        sets: cachedSets,
      } satisfies StoredCollaborationSetCache);

      logStorageWarning("Collaboration set cache exceeded the serialized memory budget; storing a bounded preview cache.", {
        serializedLength: serializedSets.length,
        maxSerializedLength: COLLABORATION_SET_CACHE_MAX_SERIALIZED_LENGTH,
        droppedCardCount: getCollaborationSetCacheDroppedCardCount(compactSets, cachedSets),
        ...getCardSetStorageSummary(cachedSets),
      });
    }

    const storageKey = getCollaborationSetCacheStorageKey(userId);

    logStorageInfo("Stored cached collaboration sets.", {
      key: storageKey,
      serializedLength: serializedSets.length,
      ...getCardSetStorageSummary(cachedSets),
    });

    if (Platform.OS === "web" && typeof window !== "undefined") {
      await setWebStorageItem(storageKey, serializedSets);
      return;
    }

    await (await getNativeStorageAdapter())?.setItem(storageKey, serializedSets);
  } catch (error) {
    console.warn("Unable to persist cached CardMagic collaboration sets.", error);
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

async function storeActiveCardDraft(
  card: CardDraft,
  metadata?: {
    dirty?: boolean;
    selectedSetId?: string | null;
    activeSetCardId?: string | null;
    activeSetCardSetId?: string | null;
  },
) {
  try {
    const persistedCard = await persistCardDraftImageUris(cloneCardDraft(card), "active-card");
    const serializedCard = JSON.stringify({
      schemaVersion: 1,
      card: persistedCard,
      dirty: metadata?.dirty ?? true,
      selectedSetId: metadata?.selectedSetId ?? null,
      activeSetCardId: metadata?.activeSetCardId ?? null,
      activeSetCardSetId: metadata?.activeSetCardSetId ?? null,
      updatedAt: new Date().toISOString(),
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

async function clearStoredActiveCardDraft() {
  try {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      await setWebStorageItem(ACTIVE_CARD_STORAGE_KEY, "");
      return;
    }

    await (await getNativeStorageAdapter())?.setItem(ACTIVE_CARD_STORAGE_KEY, "");
  } catch (error) {
    console.warn("Unable to clear active CardMagic draft.", error);
  }
}

async function storeEditorSessionState(session: StoredEditorSessionState) {
  try {
    const serializedSession = JSON.stringify({
      ...session,
      schemaVersion: 1,
    } satisfies StoredEditorSessionState);

    if (Platform.OS === "web" && typeof window !== "undefined") {
      await setWebStorageItem(EDITOR_SESSION_STORAGE_KEY, serializedSession);
      return;
    }

    await (await getNativeStorageAdapter())?.setItem(EDITOR_SESSION_STORAGE_KEY, serializedSession);
  } catch (error) {
    console.warn("Unable to persist CardMagic editor session state.", error);
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

async function storeCreatorToolsVisible(visible: boolean) {
  try {
    const serializedVisibility = visible ? "true" : "false";

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage.setItem(CREATOR_TOOLS_VISIBILITY_STORAGE_KEY, serializedVisibility);
      return;
    }

    await (await getNativeStorageAdapter())?.setItem(CREATOR_TOOLS_VISIBILITY_STORAGE_KEY, serializedVisibility);
  } catch (error) {
    console.warn("Unable to persist CardMagic creator-tools visibility.", error);
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

async function preloadCardDraftExportImages(card: CardDraft) {
  if (Platform.OS !== "web") {
    return;
  }

  const imageUris = [
    card.artUri,
    card.artSubjectMaskUri,
    card.backArtUri,
    card.backArtSubjectMaskUri,
    card.setSymbolUri,
    card.watermarkUri,
    ...(card.artSubjectMaskComponents ?? []).map((component) => component.cutoutUrl),
    ...(card.backArtSubjectMaskComponents ?? []).map((component) => component.cutoutUrl),
  ].filter((uri): uri is string => typeof uri === "string" && uri.trim().length > 0);

  if (imageUris.length === 0) {
    return;
  }

  await Promise.all(
    Array.from(new Set(imageUris)).map((uri) =>
      loadHtmlImage(uri).catch((error) => {
        console.warn("[CardMagic export] image preflight failed.", {
          field: uri.startsWith("data:") ? `data-uri:${uri.length}` : uri.slice(0, 96),
          error,
        });
      }),
    ),
  );
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
  scale?: number;
};

function getWebViewShotMimeType(format: WebViewShotOptions["format"]) {
  return format === "jpg" ? "image/jpeg" : "image/png";
}

async function captureWebRefWithHtml2Canvas(view: HTMLElement, options: WebViewShotOptions) {
  if (options.result === "tmpfile") {
    console.warn(
      "Tmpfile is not implemented for web. Try base64 or data-uri. For compatibility, it currently returns the same result as data-uri.",
    );
  }

  const { default: html2canvas } = await import("html2canvas");
  let renderedCanvas = await html2canvas(view, {
    scale: options.scale,
  });

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
        getWebViewShotMimeType(options.format),
        options.quality ?? 1,
      );
    });
  }

  const dataUrl = renderedCanvas.toDataURL(getWebViewShotMimeType(options.format), options.quality ?? 1);

  if (options.result === "data-uri" || options.result === "tmpfile") {
    return dataUrl;
  }

  return dataUrl.replace(/data:image\/(\w+);base64,/, "");
}

function loadWebViewShotCaptureRef() {
  return captureWebRefWithHtml2Canvas;
}

type SetCardUploadImage = {
  localImageUrl: string;
  localImageBlob?: Blob;
  uploadBody: Blob | ArrayBuffer | Uint8Array;
  uploadContentType: string;
};

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
    return message || "Targeted masking is taking longer than expected. Try a smaller painted selection, one simpler visible object, or try again in a moment.";
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
  boxPrompt,
  pointPrompts,
  brushSamples,
  brushRadius,
  onTrace,
}: {
  imageUri: string;
  targetPrompt?: string;
  boxPrompt?: SubjectMaskBoxPrompt;
  pointPrompts?: SubjectMaskPointPrompt[];
  brushSamples?: SubjectMaskSelectionSample[];
  brushRadius?: number;
  onTrace?: (message: string, tone?: SubjectMaskTraceEntry["tone"]) => void;
}) {
  // Prompted SAM segmentation runs one fal call per concept (in parallel); send a
  // downscaled image so the bodies stay small. The mask is normalized against the
  // full-res original below, so output resolution is unaffected.
  const providerPrompt = getSubjectMaskPromptForProvider(targetPrompt);

  if (boxPrompt && Platform.OS === "web") {
    const sourceDimensions = await getImageDimensions(imageUri);
    const cropRequest = await createPaintedSelectionCropRequest(imageUri, boxPrompt, sourceDimensions);
    const cropPrompt = providerPrompt;
    const normalizeOptions: SubjectMatteNormalizeOptions = {
      selectionBoxPrompt: boxPrompt,
      selectionPointPrompts: pointPrompts,
      selectionBrushSamples: brushSamples,
      selectionBrushRadius: brushRadius,
    };

    onTrace?.(
      `Crop-first selection: ${cropRequest.cropRegion.width}x${cropRequest.cropRegion.height} crop at ${cropRequest.cropRegion.x},${cropRequest.cropRegion.y}; ${cropPrompt ? `semantic prompt "${cropPrompt}"` : "foreground candidate"}.`,
      "info",
    );
    if (brushSamples?.length) {
      onTrace?.(`Using ${brushSamples.length} painted brush samples with ${Math.round(brushRadius ?? 0)}px source-radius local filtering.`, "info");
    }
    onTrace?.(
      cropPrompt
        ? "Submitting cropped art to semantic SAM, then filtering by the painted brush seed."
        : "Submitting cropped art to fast foreground matting, then filtering by the painted brush seed.",
      "info",
    );

    const matte = await generateSubjectMatteViaEdge({
      imageUri: cropRequest.uri,
      targetPrompt: cropPrompt,
    });
    let matteUri: string;

    const subjectMasks = (matte.subjectMasks ?? []).filter((mask) => mask && Boolean(mask.url));

    if (subjectMasks.length > 0) {
      onTrace?.(`Expanding ${subjectMasks.length} cropped mask component${subjectMasks.length === 1 ? "" : "s"} back to the original art canvas.`, "info");
      onTrace?.("Filtering the expanded matte against the painted brush seed.", "info");
      const components = await Promise.all(
        subjectMasks.map(async (mask) => ({
          concept: mask.concept,
          cutoutUrl: await normalizeSubjectMatteImageUri(
            await materializeSubjectCropCutoutOnSourceCanvas(mask.url, cropRequest.cropRegion),
            imageUri,
            normalizeOptions,
          ),
        })),
      );
      const cutoutUrls = components.map((component) => component.cutoutUrl);
      const merged = cutoutUrls.length > 1 ? await compositeSubjectCutouts(cutoutUrls) : cutoutUrls[0];
      matteUri = await materializeImageUri(merged, "subject-matte");

      return {
        uri: await normalizeSubjectMatteImageUri(matteUri, imageUri, normalizeOptions),
        diagnostics: matte.diagnostics,
        components,
        sourceUri: imageUri,
        progress: matte.progress,
        creditSpend: matte.creditSpend,
      };
    }

    if (matte.b64Json) {
      onTrace?.("Expanding the cropped matte back to the original art canvas.", "info");
      onTrace?.("Filtering the expanded matte against the painted brush seed.", "info");
      const cropMatteUri = await materializeBase64ImageUri(matte.b64Json, "png", "subject-matte-crop");
      matteUri = await materializeSubjectCropCutoutOnSourceCanvas(cropMatteUri, cropRequest.cropRegion);

      return {
        uri: await normalizeSubjectMatteImageUri(matteUri, imageUri, normalizeOptions),
        diagnostics: matte.diagnostics,
        components: [] as { concept: string; cutoutUrl: string }[],
        sourceUri: imageUri,
        progress: matte.progress,
        creditSpend: matte.creditSpend,
      };
    }

    if (matte.url) {
      onTrace?.("Expanding the cropped matte back to the original art canvas.", "info");
      onTrace?.("Filtering the expanded matte against the painted brush seed.", "info");
      matteUri = await materializeSubjectCropCutoutOnSourceCanvas(matte.url, cropRequest.cropRegion);

      return {
        uri: await normalizeSubjectMatteImageUri(matteUri, imageUri, normalizeOptions),
        diagnostics: matte.diagnostics,
        components: [] as { concept: string; cutoutUrl: string }[],
        sourceUri: imageUri,
        progress: matte.progress,
        creditSpend: matte.creditSpend,
      };
    }

    throw new Error("Subject matte provider did not return cropped image data.");
  }

  const hasGeometryPrompt = Boolean(boxPrompt) || Boolean(pointPrompts?.length);
  const requestMaxDimension = hasGeometryPrompt
    ? SUBJECT_MASK_GEOMETRY_REQUEST_MAX_DIMENSION
    : SUBJECT_MASK_REQUEST_MAX_DIMENSION;
  const requestImageUri = providerPrompt || hasGeometryPrompt
    ? await downscaleImageForMaskRequest(imageUri, requestMaxDimension)
    : imageUri;
  const sourceDimensions = hasGeometryPrompt ? await getImageDimensions(imageUri) : null;
  const requestBoxPrompt = boxPrompt
    ? scaleSubjectMaskBoxPromptForRequest(boxPrompt, sourceDimensions ?? await getImageDimensions(imageUri), requestMaxDimension)
    : undefined;
  const requestPointPrompts = pointPrompts?.length
    ? scaleSubjectMaskPointPromptsForRequest(pointPrompts, sourceDimensions ?? await getImageDimensions(imageUri), requestMaxDimension)
    : undefined;
  const matte = await generateSubjectMatteViaEdge({
    imageUri: requestImageUri,
    targetPrompt: providerPrompt,
    boxPrompt: requestBoxPrompt,
    pointPrompts: requestPointPrompts,
  });
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

function isBlobUploadBody(body: Blob | ArrayBuffer | Uint8Array): body is Blob {
  return typeof Blob !== "undefined" && body instanceof Blob;
}

function getImageUploadBodyByteLength(body: Blob | ArrayBuffer | Uint8Array) {
  if (isBlobUploadBody(body)) {
    return body.size;
  }

  return body.byteLength;
}

function formatUploadByteLength(byteLength: number) {
  return `${(byteLength / (1024 * 1024)).toFixed(1)} MB`;
}

function assertSetCardImageUploadBodyWithinLimit(body: Blob | ArrayBuffer | Uint8Array) {
  const byteLength = getImageUploadBodyByteLength(body);

  if (byteLength > SET_CARD_IMAGE_UPLOAD_MAX_BYTES) {
    throw new Error(
      `Set image is ${formatUploadByteLength(byteLength)}; maximum is ${formatUploadByteLength(SET_CARD_IMAGE_UPLOAD_MAX_BYTES)}.`,
    );
  }
}

function getElementRenderAspectRatio(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const width = rect.width || element.offsetWidth;
  const height = rect.height || element.offsetHeight;

  if (width > 0 && height > 0) {
    return height / width;
  }

  return 1039 / 744;
}

async function createWebSetCardUploadImage(
  target: View | null,
  onStatus?: (status: SetCardImageRenderStatusDraft) => void,
): Promise<SetCardUploadImage> {
  if (!target) {
    throw new Error("CardMagic could not find the rendered set card preview.");
  }

  const element = target as unknown as HTMLElement;
  const captureWebRef = await loadWebViewShotCaptureRef();
  const renderAspectRatio = getElementRenderAspectRatio(element);
  let largestRejectedBlob: Blob | null = null;

  onStatus?.({
    phase: "capturing",
    label: "Compressing image",
    detail: "Encoding high-quality set preview",
  });

  for (const attempt of SET_CARD_IMAGE_UPLOAD_ATTEMPTS) {
    const height = Math.round(attempt.width * renderAspectRatio);

    onStatus?.({
      phase: "capturing",
      label: "Compressing image",
      detail: `${attempt.width}px JPEG at ${(attempt.quality * 100).toFixed(0)}% quality`,
    });

    const capturedResult = await withTimeout(
      captureWebRef(element, {
        width: attempt.width,
        height,
        format: "jpg",
        quality: attempt.quality,
        result: "blob",
        scale: 1,
      }),
      20000,
      "CardMagic timed out while rasterizing the set card preview.",
    );
    if (typeof Blob === "undefined" || !(capturedResult instanceof Blob)) {
      throw new Error("CardMagic could not encode the set card preview as an upload Blob.");
    }
    const capturedBlob = capturedResult;
    const uploadBody = capturedBlob.type
      ? capturedBlob
      : capturedBlob.slice(0, capturedBlob.size, SET_CARD_IMAGE_UPLOAD_CONTENT_TYPE);

    if (uploadBody.type !== SET_CARD_IMAGE_UPLOAD_CONTENT_TYPE) {
      throw new Error("CardMagic could not encode the set card preview as a JPEG upload.");
    }

    if (getImageUploadBodyByteLength(uploadBody) <= SET_CARD_IMAGE_UPLOAD_MAX_BYTES) {
      return {
        localImageUrl: "",
        localImageBlob: uploadBody,
        uploadBody,
        uploadContentType: SET_CARD_IMAGE_UPLOAD_CONTENT_TYPE,
      };
    }

    largestRejectedBlob = uploadBody;
  }

  if (largestRejectedBlob) {
    assertSetCardImageUploadBodyWithinLimit(largestRejectedBlob);
  }

  throw new Error("CardMagic could not encode the set card preview for upload.");
}

async function createNativeSetCardUploadImage(
  renderedPng: string,
  onStatus?: (status: SetCardImageRenderStatusDraft) => void,
): Promise<SetCardUploadImage> {
  if (hasNativeModule("ExpoFileSystem")) {
    const FileSystem = await import("expo-file-system");
    let largestRejectedBytes: Uint8Array | null = null;

    for (const attempt of SET_CARD_IMAGE_UPLOAD_ATTEMPTS) {
      onStatus?.({
        phase: "capturing",
        label: "Compressing image",
        detail: `${attempt.width}px JPEG preview for Supabase Storage`,
      });

      const result = await ImageManipulator.manipulateAsync(
        renderedPng,
        [{ resize: { width: attempt.width } }],
        {
          compress: attempt.quality,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false,
        },
      );
      const bytes = await new FileSystem.File(result.uri).bytes();

      if (bytes.byteLength <= SET_CARD_IMAGE_UPLOAD_MAX_BYTES) {
        return {
          localImageUrl: result.uri,
          uploadBody: bytes,
          uploadContentType: SET_CARD_IMAGE_UPLOAD_CONTENT_TYPE,
        };
      }

      largestRejectedBytes = bytes;
    }

    if (largestRejectedBytes) {
      assertSetCardImageUploadBodyWithinLimit(largestRejectedBytes);
    }
  }

  throw new Error("CardMagic could not compress the set card preview for upload.");
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

  const [card, dispatchCard] = useReducer(cardEditorReducer, null, createStarterCard);
  const [activeSection, setActiveSection] = useState<CardSection | null>(null);
  const [sheetSection, setSheetSection] = useState<CardSection | null>(null);
  const previewBoundsRef = useRef<CoordinateBounds | null>(null);
  const previewContainerRef = useRef<View>(null);
  const visibleCardExportRef = useRef<View>(null);
  const visibleCardExportActive = false;
  const mainScrollRef = useRef<ScrollView>(null);
  const mainScrollWindowRef = useRef<MainScrollWindow | null>(null);
  const communityScrollBoundaryHandlerRef = useRef<MainScrollBoundaryHandler | null>(null);
  const singleExportContainerRef = useRef<View>(null);
  const batchExportContainerRef = useRef<View>(null);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("edit");
  const [customKeywordDefinitions, setCustomKeywordDefinitions] = useState<KeywordDefinition[]>([]);
  const [cardSets, setCardSets] = useState<CardSet[]>(createDefaultCardSets);
  const cardSetsRef = useRef<CardSet[]>(cardSets);
  const savedSetImageRenderQueueRef = useRef<Promise<void>>(Promise.resolve());
  const savedSetImageRenderKeysRef = useRef<Set<string>>(new Set());
  const savedSetImageUploadQueueRef = useRef<SavedSetCardImageUploadRequest[]>([]);
  const savedSetImageUploadKeysRef = useRef<Set<string>>(new Set());
  const savedSetImageUploadActiveCountRef = useRef(0);
  const savedSetImageUploadSlotWaitersRef = useRef<Array<() => void>>([]);
  const [savedSetImageRenderStatuses, setSavedSetImageRenderStatuses] = useState<Record<string, SetCardImageRenderStatus>>({});
  const [deletionTombstones, setDeletionTombstones] = useState<DeletionTombstones>(createEmptyDeletionTombstones);
  const deletionTombstonesRef = useRef<DeletionTombstones>(deletionTombstones);
  const [artLibraryEntries, setArtLibraryEntries] = useState<ArtLibraryEntry[]>([]);
  const [customCardBacks, setCustomCardBacks] = useState<CustomCardBackEntry[]>([]);
  const [generatedSetSymbols, setGeneratedSetSymbols] = useState<GeneratedSetSymbolEntry[]>([]);
  const generatedSetSymbolsRef = useRef<GeneratedSetSymbolEntry[]>(generatedSetSymbols);
  const [userProgress, setUserProgress] = useState<UserProgressProfile>(() => createDefaultUserProgress());
  const userProgressRef = useRef(userProgress);
  const [creatorToolsVisible, setCreatorToolsVisible] = useState(false);
  const [creatorToolsVisibilityHydrated, setCreatorToolsVisibilityHydrated] = useState(false);
  const [previewToolbarPosition, setPreviewToolbarPosition] = useState<PreviewToolbarPosition | null>(null);
  const previewToolbarPositionRef = useRef<PreviewToolbarPosition | null>(null);
  const previewToolbarDragStartRef = useRef<PreviewToolbarPosition | null>(null);
  const previewToolbarDragStartGrabberAnchorRef = useRef<PreviewToolbarPosition | null>(null);
  const [previewToolbarOrientationOverride, setPreviewToolbarOrientationOverride] =
    useState<PreviewToolbarOrientation | null>(null);
  const [previewToolbarCollapsed, setPreviewToolbarCollapsed] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState(DEFAULT_MAIN_SET_ID);
  const selectedSetIdRef = useRef(selectedSetId);
  const [activeSetCardId, setActiveSetCardId] = useState<string | null>(null);
  const activeSetCardIdRef = useRef(activeSetCardId);
  const [activeSetCardSetId, setActiveSetCardSetId] = useState<string | null>(null);
  const activeSetCardSetIdRef = useRef(activeSetCardSetId);
  const storedSessionCardRestoreAttemptedRef = useRef(false);
  const [cardHasUnsavedEdits, setCardHasUnsavedEdits] = useState(false);
  const cardHasUnsavedEditsRef = useRef(cardHasUnsavedEdits);
  const [previewRotated, setPreviewRotated] = useState(false);
  const previewRotateIconDegrees = useSharedValue(0);
  const previewToolbarTransition = useSharedValue(1);
  // Live drag translation for the floating toolbar, driven entirely on the UI
  // thread. Dragging updates this shared value (no React state, no App re-render
  // per frame); the final docked position is committed to React state only on
  // release. See commitPreviewToolbarDrag.
  const previewToolbarDragOffset = useSharedValue({ x: 0, y: 0 });
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
  const [saveDestinationPromptOpen, setSaveDestinationPromptOpen] = useState(false);
  const [physicalBackMenuOpen, setPhysicalBackMenuOpen] = useState(false);
  const [artSourceOpen, setArtSourceOpen] = useState(false);
  const [artGeneratorOpen, setArtGeneratorOpen] = useState(false);
  const [creditStoreOpen, setCreditStoreOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountPasswordRecoveryMode, setAccountPasswordRecoveryMode] = useState(false);
  const [earlyAccessCodeOpen, setEarlyAccessCodeOpen] = useState(false);
  const [accountUser, setAccountUser] = useState<SupabaseUser | null>(null);
  const [accountAuthHydrated, setAccountAuthHydrated] = useState(!isSupabaseConfigured);
  const [accountProfile, setAccountProfile] = useState<AccountProfile | null>(null);
  const [communityNotifications, setCommunityNotifications] = useState<CommunityNotificationPayload[]>([]);
  const [communityNotificationsLoading, setCommunityNotificationsLoading] = useState(false);
  const [communityNotificationsError, setCommunityNotificationsError] = useState<string | null>(null);
  const [accountSyncBusy, setAccountSyncBusy] = useState(false);
  const [accountSetsHydrated, setAccountSetsHydrated] = useState(false);
  const [checkoutBusyProductId, setCheckoutBusyProductId] = useState<CheckoutProductId | null>(null);
  const [checkoutErrorMessage, setCheckoutErrorMessage] = useState<string | null>(null);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [achievementPopups, setAchievementPopups] = useState<AchievementPopup[]>([]);
  const [xpFloatingNumbers, setXpFloatingNumbers] = useState<XpFloatingNumber[]>([]);
  const [levelUpToasts, setLevelUpToasts] = useState<LevelUpToastItem[]>([]);
  const [authToast, setAuthToast] = useState<AuthToastState | null>(null);
  const [pendingCollaborationInviteCode, setPendingCollaborationInviteCode] = useState<string | null>(null);
  const [pendingCollaborationInvitePreview, setPendingCollaborationInvitePreview] =
    useState<CollaborationSetInvitePreviewPayload | null>(null);
  const [collaborationInvitePreviewLoading, setCollaborationInvitePreviewLoading] = useState(false);
  const [collaborationInviteAccepting, setCollaborationInviteAccepting] = useState(false);
  const [collaborationInviteError, setCollaborationInviteError] = useState<string | null>(null);
  const collaborationInviteRedemptionBusyRef = useRef(false);
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
  const [artImageLoadingUri, setArtImageLoadingUri] = useState<string | null>(null);
  const [artGeneratorError, setArtGeneratorError] = useState<string | null>(null);
  const [subjectMaskBusy, setSubjectMaskBusy] = useState(false);
  const [subjectMaskStatus, setSubjectMaskStatus] = useState<string | null>(null);
  const [subjectMaskError, setSubjectMaskError] = useState<string | null>(null);
  const [, setSubjectMaskTrace] = useState<SubjectMaskTraceEntry[]>([]);
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
  const [editorSessionHydrated, setEditorSessionHydrated] = useState(false);
  const [userProgressHydrated, setUserProgressHydrated] = useState(false);
  const activeDraftHadStoredPayloadRef = useRef(false);
  const localCardSetsHadStoredPayloadRef = useRef(false);
  const localEditorSessionHadStoredPayloadRef = useRef(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showReturnToTop, setShowReturnToTop] = useState(false);
  const [mainScrollWindow, setMainScrollWindow] = useState<MainScrollWindow | null>(null);
  const [patchNotesOpen, setPatchNotesOpen] = useState(false);
  const [betaReleaseDeployment, setBetaReleaseDeployment] =
    useState<CardMagicReleaseDeployment | null>(null);
  const [refreshPromptDeployment, setRefreshPromptDeployment] =
    useState<CardMagicReleaseDeployment | null>(null);
  const dismissedRefreshPromptVersionRef = useRef<string | null>(null);
  const { width, height } = useWindowDimensions();
  const mobileBrowserBottomInset = useMobileBrowserBottomInset(width);
  const [cardFontsLoaded, cardFontLoadError] = useFonts(FULL_MAGIC_PACK.fonts);
  const cardFontsReady = cardFontsLoaded || Boolean(cardFontLoadError);

  const faceCard = useMemo(() => getEditableCardFace(card), [card]);

  useEffect(() => {
    let cancelled = false;
    let refreshTimer: ReturnType<typeof setInterval> | null = null;

    const loadReleaseDeployments = async () => {
      try {
        const betaDeployment = await fetchCardMagicReleaseDeployment("beta");
        const activeDeployment =
          CARDMAGIC_RELEASE_BRANCH === "beta"
            ? betaDeployment
            : await fetchCardMagicReleaseDeployment("main");

        if (cancelled) {
          return;
        }

        setBetaReleaseDeployment(betaDeployment);

        if (
          activeDeployment &&
          isReleaseVersionNewer(activeDeployment.version, CARDMAGIC_APP_VERSION) &&
          dismissedRefreshPromptVersionRef.current !== activeDeployment.version
        ) {
          setRefreshPromptDeployment(activeDeployment);
        }
      } catch (error) {
        console.warn("Unable to load CardMagic release metadata.", error);
      }
    };

    void loadReleaseDeployments();
    refreshTimer = setInterval(() => {
      void loadReleaseDeployments();
    }, RELEASE_FRESHNESS_CHECK_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
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
  useEffect(() => {
    if (!accountUser) {
      return;
    }

    dispatchCard({ type: "applyDefaultCredit", ownerName: accountFooterOwnerName });
  }, [accountFooterOwnerName, accountUser]);
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
  const activeSetCardSet =
    activeSetCardSetId
      ? cardSets.find((set) => set.id === activeSetCardSetId) ?? null
      : null;
  const previewContextSet = activeSetCardSet ?? selectedSet;
  const activeFrameTreatment = getActiveFrameTreatment(card);
  const activeShowcaseFrame = getActiveShowcaseFrame(card);
  const frameTypeLabel = isSplitFrame
    ? splitFrameSummary
    : activeFrameTreatment === "showcase"
      ? SHOWCASE_FRAME_LABELS[activeShowcaseFrame]
      : FRAME_TREATMENT_LABELS[activeFrameTreatment];
  const headerVersionLabel = `v${CARDMAGIC_APP_VERSION}`;
  const headerContextLabel = `${frameTypeLabel} · ${previewContextSet?.name ?? "No set"}`;
  const previewCard = useMemo(
    () =>
      withResolvedSetDefaults(
        getSetNumberedPreviewCard(card, previewContextSet?.cards ?? [], activeSetCardId),
        previewContextSet,
      ),
    [activeSetCardId, card, previewContextSet],
  );
  const editorCardMaxWidth =
    width >= EDITOR_WIDE_DESKTOP_BREAKPOINT
      ? EDITOR_CARD_WIDE_DESKTOP_MAX_WIDTH
      : width >= EDITOR_DESKTOP_BREAKPOINT
        ? EDITOR_CARD_DESKTOP_MAX_WIDTH
        : width >= EDITOR_TABLET_BREAKPOINT
          ? EDITOR_CARD_TABLET_MAX_WIDTH
          : EDITOR_CARD_COMPACT_MAX_WIDTH;
  const editorHorizontalInset = width >= EDITOR_DESKTOP_BREAKPOINT ? 48 : 32;
  const cardWidth = Math.min(
    editorCardMaxWidth,
    Math.max(EDITOR_CARD_MIN_WIDTH, width - editorHorizontalInset),
  );
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

  // Resolves the final docked toolbar position from the drag's total
  // translation and commits it to React state once, on release. During the drag
  // itself the toolbar is moved purely via `previewToolbarDragOffset` (UI
  // thread), so App() no longer re-renders on every pointer frame. Orientation
  // docking and edge clamping resolve here, on release.
  const commitPreviewToolbarDrag = useCallback(
    (translationX: number, translationY: number) => {
      if (!previewToolbarDragStartRef.current) {
        return;
      }

      const dragStart = previewToolbarDragStartRef.current;
      const fallbackGrabberOffset = getGrabberOffsetForOrientation(previewToolbarOrientation);
      const dragStartAnchor = previewToolbarDragStartGrabberAnchorRef.current ?? {
        x: dragStart.x + fallbackGrabberOffset.x,
        y: dragStart.y + fallbackGrabberOffset.y,
      };
      const finalAnchor = {
        x: dragStartAnchor.x + translationX,
        y: dragStartAnchor.y + translationY,
      };
      const nextOrientation = getDockOrientationForToolbarPosition(finalAnchor);
      const nextSize = getToolbarSizeForOrientation(nextOrientation);
      const nextPosition = getPositionForToolbarAnchor(finalAnchor, nextOrientation, nextSize);

      previewToolbarDragStartRef.current = null;
      previewToolbarDragStartGrabberAnchorRef.current = null;
      previewToolbarDragOffset.value = { x: 0, y: 0 };
      setPreviewToolbarOrientationOverride(nextOrientation);
      previewToolbarPositionRef.current = nextPosition;
      setPreviewToolbarPosition(nextPosition);
      void storePreviewToolbarOrientation(nextOrientation);
      void storePreviewToolbarPosition(nextPosition);
    },
    [
      getDockOrientationForToolbarPosition,
      getGrabberOffsetForOrientation,
      getPositionForToolbarAnchor,
      getToolbarSizeForOrientation,
      previewToolbarDragOffset,
      previewToolbarOrientation,
    ],
  );

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
      { translateX: previewToolbarDragOffset.value.x },
      { translateY: previewToolbarDragOffset.value.y },
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
          previewToolbarDragOffset.value = { x: 0, y: 0 };
          runOnJS(beginPreviewToolbarDrag)();
        })
        .onUpdate((event) => {
          previewToolbarDragOffset.value = { x: event.translationX, y: event.translationY };
        })
        .onEnd((event) => {
          runOnJS(commitPreviewToolbarDrag)(event.translationX, event.translationY);
        })
        .onFinalize((event) => {
          runOnJS(commitPreviewToolbarDrag)(event.translationX, event.translationY);
        });

    return Gesture.Exclusive(doubleTapGesture, dragGesture);
  }, [
    beginPreviewToolbarDrag,
    commitPreviewToolbarDrag,
    previewToolbarDragOffset,
    togglePreviewToolbarCollapsed,
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

    loadStoredActiveCardDraft().then((storedDraft) => {
      if (cancelled) {
        return;
      }

      activeDraftHadStoredPayloadRef.current = Boolean(storedDraft);

      if (storedDraft) {
        dispatchCard({ type: "replace", card: storedDraft.card });
        setCardHasUnsavedEdits(storedDraft.dirty);

        if (storedDraft.selectedSetId) {
          setSelectedSetId(storedDraft.selectedSetId);
        }

        setActiveSetCardId(storedDraft.activeSetCardId);
        setActiveSetCardSetId(storedDraft.activeSetCardSetId);
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
        const storedPersistableSets = getStoredLocalCardSets(normalizedSets);

        localCardSetsHadStoredPayloadRef.current = storedPersistableSets.length > 0;

        logStorageInfo("Applying hydrated saved sets to editor state.", getCardSetStorageSummary(normalizedSets));
        setCardSets(normalizedSets);
        setSelectedSetId((current) =>
          normalizedSets.some((set) => set.id === current) ? current : normalizedSets[0].id,
        );
      } else {
        localCardSetsHadStoredPayloadRef.current = false;
        logStorageInfo("Using default in-memory saved sets after hydration.");
      }

      setSetsHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!setsHydrated) {
      return;
    }

    let cancelled = false;

    loadStoredEditorSessionState().then((storedSession) => {
      if (cancelled) {
        return;
      }

      localEditorSessionHadStoredPayloadRef.current = Boolean(storedSession);

      if (storedSession) {
        setSelectedSetId(storedSession.selectedSetId);
        setActiveSetCardId(storedSession.activeSetCardId);
        setActiveSetCardSetId(storedSession.activeSetCardSetId);
        setInspectorTab(storedSession.inspectorTab);
      }

      setEditorSessionHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, [setsHydrated]);

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
    let cancelled = false;

    loadStoredCreatorToolsVisible().then((storedVisible) => {
      if (cancelled) {
        return;
      }

      setCreatorToolsVisible(storedVisible);
      setCreatorToolsVisibilityHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!creatorToolsVisibilityHydrated) {
      return;
    }

    void storeCreatorToolsVisible(creatorToolsVisible);
  }, [creatorToolsVisible, creatorToolsVisibilityHydrated]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      return;
    }

    let active = true;
    const currentUrl = new URL(window.location.href);
    const urlInviteCode = getCollaborationInviteCodeFromUrl(currentUrl);

    if (urlInviteCode) {
      removeCollaborationInviteParamsFromUrl(currentUrl);
      window.history.replaceState({}, "", currentUrl.toString());
    }

    void (async () => {
      const pendingInviteCode = urlInviteCode
        ? await storePendingCollaborationInviteCode(urlInviteCode)
        : await loadPendingCollaborationInviteCode();

      if (!active || !pendingInviteCode) {
        return;
      }

      setPendingCollaborationInviteCode(pendingInviteCode);
      setCollaborationInvitePreviewLoading(true);
      setCollaborationInviteError(null);

      try {
        const preview = await previewCollaborationSetInviteCode(pendingInviteCode);

        if (!active) {
          return;
        }

        setPendingCollaborationInvitePreview(preview);
      } catch (error) {
        if (!active) {
          return;
        }

        const errorMessage = error instanceof Error ? error.message : "CardMagic could not load that set invite.";

        if (/not valid|expired/i.test(errorMessage)) {
          await clearPendingCollaborationInviteCode();
          setPendingCollaborationInviteCode(null);
        }

        setCollaborationInviteError(errorMessage);
      } finally {
        if (active) {
          setCollaborationInvitePreviewLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [accountUser]);

  useEffect(() => {
    if (!activeDraftHydrated) {
      return;
    }

    const persistActiveDraft = setTimeout(() => {
      if (cardHasUnsavedEdits || (activeSetCardId && activeSetCardSetId)) {
        void storeActiveCardDraft(card, {
          dirty: cardHasUnsavedEdits,
          selectedSetId,
          activeSetCardId,
          activeSetCardSetId,
        });
      } else {
        void clearStoredActiveCardDraft();
      }
    }, 450);

    return () => {
      clearTimeout(persistActiveDraft);
    };
  }, [
    activeDraftHydrated,
    activeSetCardId,
    activeSetCardSetId,
    card,
    cardHasUnsavedEdits,
    selectedSetId,
  ]);

  useEffect(() => {
    if (!setsHydrated || !generatedSetSymbolsHydrated) {
      return;
    }

    void storeCardSets(cardSets);
  }, [cardSets, generatedSetSymbolsHydrated, setsHydrated]);

  useEffect(() => {
    if (!editorSessionHydrated) {
      return;
    }

    const persistEditorSession = setTimeout(() => {
      void storeEditorSessionState({
        schemaVersion: 1,
        selectedSetId,
        activeSetCardId,
        activeSetCardSetId,
        inspectorTab: inspectorTab === "keywords" ? "edit" : inspectorTab,
      });
    }, 200);

    return () => {
      clearTimeout(persistEditorSession);
    };
  }, [
    activeSetCardId,
    activeSetCardSetId,
    editorSessionHydrated,
    inspectorTab,
    selectedSetId,
  ]);

  useEffect(() => {
    if (
      !activeDraftHydrated ||
      !setsHydrated ||
      !editorSessionHydrated ||
      storedSessionCardRestoreAttemptedRef.current
    ) {
      return;
    }

    storedSessionCardRestoreAttemptedRef.current = true;

    if (activeDraftHadStoredPayloadRef.current || cardHasUnsavedEditsRef.current) {
      logStorageInfo("Skipped saved session card restore because an active editor card is available.", {
        activeEditorCardStored: activeDraftHadStoredPayloadRef.current,
        dirty: cardHasUnsavedEditsRef.current,
      });
      return;
    }

    if (!activeSetCardSetId || !activeSetCardId) {
      logStorageInfo("No saved session card reference to restore.", {
        activeSetCardSetId,
        activeSetCardId,
      });
      return;
    }

    const sessionSet = cardSets.find((set) => set.id === activeSetCardSetId);
    const sessionSnapshot = sessionSet?.cards.find((snapshot) => snapshot.id === activeSetCardId) ?? null;

    if (!sessionSet || !sessionSnapshot) {
      logStorageWarning("Saved editor session referenced a missing set card.", {
        activeSetCardSetId,
        activeSetCardId,
        setFound: Boolean(sessionSet),
      });
      return;
    }

    setSelectedSetId(sessionSet.id);
    dispatchCard({ type: "replace", card: cloneCardDraft(sessionSnapshot.card) });
    setCardHasUnsavedEdits(false);
    setActiveSection(null);
    setSheetSection(null);
    setPreviewRotated(false);
    setPhysicalBackVisible(false);

    void materializeSetCardSnapshotCard(sessionSnapshot, sessionSet.id)
      .then((materializedCard) => {
        const currentSet = cardSetsRef.current.find((set) => set.id === sessionSet.id);
        const currentSnapshot = currentSet?.cards.find((setCard) =>
          setCard.id === sessionSnapshot.id &&
          setCard.savedAt === sessionSnapshot.savedAt
        );

        if (!currentSnapshot) {
          return;
        }

        if (
          activeSetCardSetIdRef.current !== sessionSet.id ||
          activeSetCardIdRef.current !== sessionSnapshot.id ||
          cardHasUnsavedEditsRef.current
        ) {
          return;
        }

        dispatchCard({ type: "replace", card: materializedCard });
        setCardHasUnsavedEdits(false);
      })
      .catch((error) => {
        console.warn("Unable to materialize saved editor session card art.", error);
      });
  }, [
    activeDraftHydrated,
    activeSetCardId,
    activeSetCardSetId,
    cardSets,
    editorSessionHydrated,
    setsHydrated,
  ]);

  useEffect(() => {
    cardSetsRef.current = cardSets;
  }, [cardSets]);

  useEffect(() => {
    selectedSetIdRef.current = selectedSetId;
  }, [selectedSetId]);

  useEffect(() => {
    activeSetCardIdRef.current = activeSetCardId;
  }, [activeSetCardId]);

  useEffect(() => {
    activeSetCardSetIdRef.current = activeSetCardSetId;
  }, [activeSetCardSetId]);

  useEffect(() => {
    cardHasUnsavedEditsRef.current = cardHasUnsavedEdits;
  }, [cardHasUnsavedEdits]);

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

  function getInitialAccountMergeOwnedSets(accountUserId: string): CardSet[] {
    return localCardSetsHadStoredPayloadRef.current
      ? getOwnedAccountCardSets(cardSetsRef.current, accountUserId)
      : [];
  }

  function restoreLatestAccountSavedCardIfFreshSession(sets: CardSet[]) {
    if (
      localEditorSessionHadStoredPayloadRef.current ||
      activeDraftHadStoredPayloadRef.current ||
      activeSetCardIdRef.current ||
      cardHasUnsavedEditsRef.current
    ) {
      return;
    }

    const latestReference = getLatestSavedSetCardReference(sets);

    if (!latestReference) {
      return;
    }

    const { setId, snapshot } = latestReference;

    setSelectedSetId(setId);
    dispatchCard({ type: "replace", card: cloneCardDraft(snapshot.card) });
    setActiveSetCardId(snapshot.id);
    setActiveSetCardSetId(setId);
    setCardHasUnsavedEdits(false);
    setActiveSection(null);
    setSheetSection(null);
    setPreviewRotated(false);
    setPhysicalBackVisible(false);
    setInspectorTab("edit");

    void materializeSetCardSnapshotCard(snapshot, setId)
      .then((materializedCard) => {
        const currentSet = cardSetsRef.current.find((set) => set.id === setId);
        const currentSnapshot = currentSet?.cards.find((setCard) =>
          setCard.id === snapshot.id &&
          setCard.savedAt === snapshot.savedAt
        );

        if (!currentSnapshot) {
          return;
        }

        if (
          activeSetCardSetIdRef.current !== setId ||
          activeSetCardIdRef.current !== snapshot.id ||
          cardHasUnsavedEditsRef.current
        ) {
          return;
        }

        dispatchCard({ type: "replace", card: materializedCard });
        setCardHasUnsavedEdits(false);
      })
      .catch((error) => {
        console.warn("Unable to materialize account session card art for editing.", error);
      });
  }

  useEffect(() => {
    if (!accountUser) {
      if (!accountAuthHydrated) {
        return;
      }

      setAccountSetsHydrated(false);

      const signOutPruneTimer = setTimeout(() => {
        setCardSets((current) => {
          const localSets = getLocalPersistableCardSets(current);

          return cardSetsEqual(current, localSets) ? current : localSets;
        });
      }, COLLABORATION_SET_SIGN_OUT_PRUNE_DELAY_MS);

      return () => {
        clearTimeout(signOutPruneTimer);
      };
    }

    if (!setsHydrated || !deletionTombstonesHydrated) {
      return;
    }

    let active = true;

    const syncInitialAccountSets = async () => {
      setAccountSyncBusy(true);
      setAccountSetsHydrated(false);

      try {
        const localOwnedSetsForMerge = getInitialAccountMergeOwnedSets(accountUser.id);
        const remoteSymbolsPromise = fetchRemoteCustomSetSymbols(accountUser.id);
        const remoteSetsPromise = fetchRemoteCardSets(accountUser.id);
        const remoteTombstonesPromise = fetchRemoteDeletionTombstones(accountUser.id);
        const cachedSharedSets = await loadCachedCollaborationSets(accountUser.id);

        if (active && cachedSharedSets?.length) {
          const cachedMergedSets = normalizeCardSets([
            ...localOwnedSetsForMerge,
            ...cachedSharedSets,
          ]);

          if (!cardSetsEqual(cardSetsRef.current, cachedMergedSets)) {
            cardSetsRef.current = cachedMergedSets;
            setCardSets(cachedMergedSets);
            setSelectedSetId((current) =>
              cachedMergedSets.some((set) => set.id === current) ? current : cachedMergedSets[0].id,
            );
          }
        }

        const sharedSetFallback = getSharedAccountCardSets(cardSetsRef.current, accountUser.id);
        const [remoteSymbols, remoteSets, remoteTombstones, sharedSets] = await Promise.all([
          remoteSymbolsPromise,
          remoteSetsPromise,
          remoteTombstonesPromise,
          fetchSharedAccountCardSets(accountUser.id, sharedSetFallback),
        ]);

        if (!active) {
          return;
        }

        const mergedSymbols = mergeCustomSetSymbols(generatedSetSymbolsRef.current, remoteSymbols);

        if (!generatedSetSymbolEntriesEqual(generatedSetSymbolsRef.current, mergedSymbols)) {
          generatedSetSymbolsRef.current = mergedSymbols;
          setGeneratedSetSymbols(mergedSymbols);
        }

        const mergedTombstones = mergeDeletionTombstones(deletionTombstonesRef.current, remoteTombstones);

        if (!deletionTombstonesEqual(deletionTombstonesRef.current, mergedTombstones)) {
          deletionTombstonesRef.current = mergedTombstones;
          setDeletionTombstones(mergedTombstones);
          void storeDeletionTombstones(mergedTombstones);
        }

        const repairedRemoteSets = normalizeStoredCardSetsPayload(remoteSets);
        const validRemoteSets = applyDeletionTombstonesToSets(
          resolveSetSymbolReferences(repairedRemoteSets?.sets ?? [], mergedSymbols),
          mergedTombstones,
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
            mergeAccountCardSets(localOwnedSetsForMerge, validRemoteSets),
            mergedSymbols,
          ),
          mergedTombstones,
        );
        const resolvedSharedSets = resolveSetSymbolReferences(sharedSets, mergedSymbols);
        const mergedSets = normalizeCardSets([
          ...mergedOwnedSets,
          ...resolvedSharedSets,
        ]);

        if (!cardSetsEqual(cardSetsRef.current, mergedSets)) {
          cardSetsRef.current = mergedSets;
          setCardSets(mergedSets);
          setSelectedSetId((current) =>
            mergedSets.some((set) => set.id === current) ? current : mergedSets[0].id,
          );
        }

        restoreLatestAccountSavedCardIfFreshSession(mergedSets);

        void storeCachedCollaborationSets(accountUser.id, resolvedSharedSets);
        await upsertRemoteDeletionTombstones(accountUser.id, mergedTombstones);
        await replaceRemoteCustomSetSymbols(accountUser.id, toAccountCustomSetSymbolPayloads(mergedSymbols));
        await replaceRemoteCardSets(
          accountUser.id,
          await toRemotePersistableAccountCardSetPayloads(mergedOwnedSets, accountUser.id),
        );
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
  }, [accountAuthHydrated, accountUser, deletionTombstonesHydrated, generatedSetSymbolsHydrated, setsHydrated]);

  useEffect(() => {
    if (!accountUser || !setsHydrated || !generatedSetSymbolsHydrated || !deletionTombstonesHydrated || !accountSetsHydrated) {
      return;
    }

    const persistRemoteSets = setTimeout(() => {
      void upsertRemoteDeletionTombstones(accountUser.id, deletionTombstonesRef.current)
        .then(() => replaceRemoteCustomSetSymbols(accountUser.id, toAccountCustomSetSymbolPayloads(generatedSetSymbolsRef.current)))
        .then(async () => replaceRemoteCardSets(
          accountUser.id,
          await toRemotePersistableAccountCardSetPayloads(cardSetsRef.current, accountUser.id),
        ))
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

      setAccountUser(getVisibleAccountUser(data.session?.user));
      setAccountAuthHydrated(true);
    };

    void hydrateSession();

    const { data: subscription } = supabaseClient.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      setAccountUser(getVisibleAccountUser(session?.user));
      setAccountAuthHydrated(true);

      if (event === "PASSWORD_RECOVERY") {
        setAccountPasswordRecoveryMode(true);
        setAccountOpen(true);
      }

      if (event === "SIGNED_OUT") {
        setAccountPasswordRecoveryMode(false);
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash);
    const hasRecoveryRedirect =
      params.get("account") === "password-recovery" ||
      hashParams.get("type") === "recovery";

    if (hasRecoveryRedirect) {
      setAccountPasswordRecoveryMode(true);
      setAccountOpen(true);
    }
  }, []);

  const loadAccountNotifications = useCallback(async () => {
    if (!accountUser) {
      setCommunityNotifications([]);
      setCommunityNotificationsError(null);
      setCommunityNotificationsLoading(false);
      return;
    }

    setCommunityNotificationsLoading(true);
    setCommunityNotificationsError(null);

    try {
      const notifications = await fetchCommunityNotifications(40);
      setCommunityNotifications(notifications);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load community notifications.";
      setCommunityNotificationsError(message);
    } finally {
      setCommunityNotificationsLoading(false);
    }
  }, [accountUser]);

  const markAccountNotificationsRead = useCallback(async (notificationIds: string[]) => {
    const uniqueIds = Array.from(new Set(notificationIds));

    if (uniqueIds.length === 0) {
      return;
    }

    const readAt = new Date().toISOString();

    setCommunityNotifications((current) => current.map((notification) => (
      uniqueIds.includes(notification.id) ? { ...notification, readAt } : notification
    )));

    try {
      await markCommunityNotificationsRead(uniqueIds);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to mark notifications as read.";
      setCommunityNotificationsError(message);
      void loadAccountNotifications();
    }
  }, [loadAccountNotifications]);

  useEffect(() => {
    if (!accountUser) {
      setCommunityNotifications([]);
      setCommunityNotificationsError(null);
      setCommunityNotificationsLoading(false);
      return;
    }

    void loadAccountNotifications();
  }, [accountUser, loadAccountNotifications]);

  useEffect(() => {
    if (accountOpen && accountUser) {
      void loadAccountNotifications();
    }
  }, [accountOpen, accountUser, loadAccountNotifications]);

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

      void upsertRemoteDeletionTombstones(accountUser.id, deletionTombstonesRef.current)
        .then(() => replaceRemoteCustomSetSymbols(accountUser.id, toAccountCustomSetSymbolPayloads(generatedSetSymbolsRef.current)))
        .then(async () => replaceRemoteCardSets(
          accountUser.id,
          await toRemotePersistableAccountCardSetPayloads(normalizedSets, accountUser.id),
        ))
        .catch((error) => {
          console.warn("Unable to persist Supabase account sets immediately after local edit.", error);
        });
    },
    [accountSetsHydrated, accountUser],
  );

  const persistDeletionTombstonesNow = useCallback(
    (nextTombstones: DeletionTombstones) => {
      const normalizedTombstones = normalizeDeletionTombstones(nextTombstones);

      deletionTombstonesRef.current = normalizedTombstones;
      void storeDeletionTombstones(normalizedTombstones);

      if (!accountUser || !accountSetsHydrated) {
        return;
      }

      void upsertRemoteDeletionTombstones(accountUser.id, normalizedTombstones).catch((error) => {
        console.warn("Unable to persist Supabase deletion tombstones immediately after local edit.", error);
      });
    },
    [accountSetsHydrated, accountUser],
  );

  function attachRemoteSetCardSnapshot(
    setId: string,
    snapshot: SetCardSnapshot,
    patch: Pick<SetCardSnapshot, "remoteCardId" | "remoteImageOwnerUserId" | "authorName">,
  ) {
    const syncedSnapshot: SetCardSnapshot = {
      ...snapshot,
      ...patch,
    };
    const nextSets = normalizeCardSets(
      cardSetsRef.current.map((set) => {
        if (set.id !== setId) {
          return set;
        }

        return {
          ...set,
          cards: set.cards.map((setCard) =>
            setCard.id === snapshot.id && setCard.savedAt === snapshot.savedAt
              ? { ...setCard, ...patch }
              : setCard,
          ),
        };
      }),
    );

    cardSetsRef.current = nextSets;
    setCardSets(nextSets);

    if (accountUser) {
      void storeCachedCollaborationSets(accountUser.id, getSharedAccountCardSets(nextSets, accountUser.id));
    }

    return syncedSnapshot;
  }

  function persistSharedSetCardSnapshot(setId: string, snapshot: SetCardSnapshot) {
    if (!accountUser) {
      return;
    }

    const renderKey = getSavedSetCardImageRenderKey(accountUser.id, setId, snapshot);

    setSavedSetCardImageRenderStatus(renderKey, {
      phase: "persisting",
      label: "Saving shared card",
      detail: "Creating the collaboration card row before preview upload",
    });

    void materializeCardDraftForExport(snapshot.card, `shared-set-card-${setId}-${snapshot.id}`)
      .then((materializedCard) => {
        const materializedSnapshot: SetCardSnapshot = {
          ...snapshot,
          card: materializedCard,
        };

        return addCollaborationSetCard({
          setId,
          localSnapshotId: materializedSnapshot.id,
          card: materializedSnapshot.card,
        }).then((remoteCardId) => ({ remoteCardId, materializedSnapshot }));
      })
      .then(({ remoteCardId, materializedSnapshot }) => {
        const syncedSnapshot = attachRemoteSetCardSnapshot(setId, materializedSnapshot, {
          remoteCardId,
          remoteImageOwnerUserId: accountUser.id,
          authorName: accountFooterOwnerName,
        });

        queueSavedSetCardImageRender(setId, syncedSnapshot, accountUser, {
          remoteThumbnailsReady: true,
          remoteCardId,
          remoteImageOwnerUserId: accountUser.id,
          canPersistRemoteImage: true,
          allowBackgroundRender: true,
        });
      })
      .catch((error) => {
        setSavedSetCardImageRenderStatus(renderKey, {
          phase: "failed",
          label: "Shared save failed",
          detail: getSetCardImageRenderErrorDetail(error),
        });
        console.warn("Unable to persist shared set card before preview render.", error);
      });
  }

  const showLoginSuccessToast = useCallback(() => {
    setAccountPasswordRecoveryMode(false);
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

  const closeAccountModal = useCallback(() => {
    setAccountOpen(false);
    setAccountPasswordRecoveryMode(false);
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
        const sharedSetFallback = getSharedAccountCardSets(cardSetsRef.current, accountUser.id);
        const [remoteProgress, remoteSymbols, remoteSets, remoteTombstones, sharedSets] = await Promise.all([
          fetchRemoteUserProgress(accountUser.id),
          fetchRemoteCustomSetSymbols(accountUser.id),
          fetchRemoteCardSets(accountUser.id),
          fetchRemoteDeletionTombstones(accountUser.id),
          fetchSharedAccountCardSets(accountUser.id, sharedSetFallback),
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

        const mergedTombstones = mergeDeletionTombstones(deletionTombstonesRef.current, remoteTombstones);

        if (!deletionTombstonesEqual(deletionTombstonesRef.current, mergedTombstones)) {
          deletionTombstonesRef.current = mergedTombstones;
          setDeletionTombstones(mergedTombstones);
          void storeDeletionTombstones(mergedTombstones);
        }

        const repairedRemoteSets = normalizeStoredCardSetsPayload(remoteSets);
        const validRemoteSets = applyDeletionTombstonesToSets(
          resolveSetSymbolReferences(repairedRemoteSets?.sets ?? [], mergedSymbols),
          mergedTombstones,
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
          mergedTombstones,
        );
        const resolvedSharedSets = resolveSetSymbolReferences(sharedSets, mergedSymbols);
        const mergedSets = normalizeCardSets([
          ...mergedOwnedSets,
          ...resolvedSharedSets,
        ]);

        cardSetsRef.current = mergedSets;
        setCardSets(mergedSets);
        setSelectedSetId((current) =>
          mergedSets.some((set) => set.id === current) ? current : mergedSets[0].id,
        );
        void storeCachedCollaborationSets(accountUser.id, resolvedSharedSets);
        await upsertRemoteDeletionTombstones(accountUser.id, mergedTombstones);
        await replaceRemoteCustomSetSymbols(accountUser.id, toAccountCustomSetSymbolPayloads(mergedSymbols));
        await replaceRemoteCardSets(
          accountUser.id,
          await toRemotePersistableAccountCardSetPayloads(mergedOwnedSets, accountUser.id),
        );
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

  const dismissCollaborationInvitePrompt = useCallback(() => {
    void clearPendingCollaborationInviteCode();
    setPendingCollaborationInviteCode(null);
    setPendingCollaborationInvitePreview(null);
    setCollaborationInviteError(null);
    setCollaborationInvitePreviewLoading(false);
    setCollaborationInviteAccepting(false);
  }, []);

  const acceptCollaborationInvite = useCallback(async () => {
    if (!pendingCollaborationInviteCode || collaborationInviteRedemptionBusyRef.current) {
      return;
    }

    if (!accountUser) {
      setAccountPasswordRecoveryMode(false);
      setAccountOpen(true);
      setAuthToast({
        id: createUuid(),
        message: "Sign in or create an account to join this set.",
      });
      return;
    }

    collaborationInviteRedemptionBusyRef.current = true;
    setCollaborationInviteAccepting(true);
    setCollaborationInviteError(null);

    try {
      const redemption = await redeemCollaborationSetInviteCode(pendingCollaborationInviteCode);

      await clearPendingCollaborationInviteCode();
      setPendingCollaborationInviteCode(null);
      setPendingCollaborationInvitePreview(null);
      if (redemption.role === "viewer") {
        setInspectorTab("community");
      } else {
        await syncRemoteUserProgress();
        setInspectorTab("sets");
        setSelectedSetId(redemption.setId);
      }
      closeAccountModal();
      setAuthToast({
        id: createUuid(),
        message: redemption.role === "owner"
          ? `${redemption.setName} is already your set.`
          : redemption.role === "viewer"
            ? `Following ${redemption.setName}.`
            : `Joined ${redemption.setName}.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "CardMagic could not accept that set invite.";

      if (/not valid|expired/i.test(errorMessage)) {
        await clearPendingCollaborationInviteCode();
        setPendingCollaborationInviteCode(null);
        setPendingCollaborationInvitePreview(null);
      }

      setCollaborationInviteError(errorMessage);
    } finally {
      collaborationInviteRedemptionBusyRef.current = false;
      setCollaborationInviteAccepting(false);
    }
  }, [accountUser, closeAccountModal, pendingCollaborationInviteCode, syncRemoteUserProgress]);

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
    setAccountPasswordRecoveryMode(false);
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
      setAccountPasswordRecoveryMode(false);
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
      setAccountPasswordRecoveryMode(false);
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

    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const nextScrollWindow = {
      offsetY: Math.max(0, contentOffset.y),
      viewportHeight: Math.max(1, layoutMeasurement.height),
    };
    const previousScrollWindow = mainScrollWindowRef.current;

    if (
      !previousScrollWindow ||
      Math.abs(previousScrollWindow.offsetY - nextScrollWindow.offsetY) >= MAIN_SCROLL_WINDOW_UPDATE_THRESHOLD ||
      Math.abs(previousScrollWindow.viewportHeight - nextScrollWindow.viewportHeight) >= 24
    ) {
      mainScrollWindowRef.current = nextScrollWindow;
      setMainScrollWindow(nextScrollWindow);
    }

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
    dispatchCard({ type: "patch", patch });
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
        backArtSubjectMaskSections: undefined,
        backArtSubjectMaskFitMode: undefined,
        backArtTransform: { offsetX: 0, offsetY: 0, scale: 1 },
      });
      return;
    }

    updateCard({
      ...artistPatch,
      artUri,
      artSubjectMaskUri: undefined,
      artSubjectMaskComponents: undefined,
      artSubjectMaskSections: undefined,
      artSubjectMaskFitMode: undefined,
      artTransform: { offsetX: 0, offsetY: 0, scale: 1 },
    });
  };

  const addArtLibraryEntry = (source: ArtLibrarySource, uri: string, sourceCard: CardDraft = card) => {
    const now = new Date().toISOString();
    const sourceFaceCard = getEditableCardFace(sourceCard);
    const labelBase = sourceFaceCard.name.trim() || (source === "generated" ? "Generated art" : "Added art");
    const entry: ArtLibraryEntry = {
      id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      uri,
      source,
      colorIdentity: getCardArtLibraryColorIdentity(sourceCard),
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

      setArtImageLoadingUri(artUri);
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
    if (__DEV__ && message) {
      console.log(`[CardMagic subject mask] ${message}`);
    }
    setSubjectMaskStatus(message);
  };

  const pushSubjectMaskTrace = (
    message: string,
    tone: SubjectMaskTraceEntry["tone"] = "info",
  ) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
    const entry: SubjectMaskTraceEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      message: `${timestamp} - ${message}`,
      tone,
    };

    if (__DEV__) {
      console.log(`[CardMagic subject mask trace] ${message}`);
    }
    setSubjectMaskTrace((current) => [...current, entry].slice(-8));
  };

  const pushSubjectMaskDiagnosticsTrace = (diagnostics: SubjectMatteDiagnostics | null | undefined) => {
    if (!diagnostics) {
      return;
    }

    const attempts = diagnostics.attempts ?? [];
    pushSubjectMaskTrace(
      `Provider diagnostics: ${diagnostics.provider ?? "unknown provider"} target "${diagnostics.targetPrompt ?? "not provided"}"; ${attempts.length} attempt${attempts.length === 1 ? "" : "s"}.`,
      attempts.some((attempt) => attempt.status === "failed") ? "error" : "info",
    );

    attempts.slice(-3).forEach((attempt) => {
      pushSubjectMaskTrace(
        `${attempt.status === "success" ? "Success" : "Failure"}: ${attempt.endpointId}${attempt.error ? ` - ${attempt.error.slice(0, 140)}` : ""}`,
        attempt.status === "success" ? "success" : "error",
      );
    });
  };

  const generateSubjectMask = async (
    targetPrompt?: string,
    boxPrompt?: SubjectMaskBoxPrompt,
    pointPrompts?: SubjectMaskPointPrompt[],
    brushSamples?: SubjectMaskSelectionSample[],
    brushRadius?: number,
  ) => {
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
    const usingPaintedSelection = Boolean(boxPrompt);
    const usingRoughSelection = Boolean(pointPrompts?.length);
    const requestMode = usingPaintedSelection
      ? "painted selection"
      : usingRoughSelection
        ? "rough selection points"
        : providerTargetPrompt
          ? "text prompt"
          : "foreground removal";
    const foregroundPointCount = pointPrompts?.filter((point) => point.label === 1).length ?? 0;
    const backgroundPointCount = pointPrompts?.filter((point) => point.label === 0).length ?? 0;
    const brushSampleCount = brushSamples?.length ?? 0;
    const boxSummary = boxPrompt
      ? `${Math.max(0, boxPrompt.x_max - boxPrompt.x_min)}x${Math.max(0, boxPrompt.y_max - boxPrompt.y_min)} at ${boxPrompt.x_min},${boxPrompt.y_min}`
      : "none";

    setSubjectMaskBusy(true);
    setSubjectMaskError(null);
    setSubjectMaskComponents([]);
    setSubjectMaskTrace([]);
    pushSubjectMaskTrace(`Request mode: ${requestMode}.`, "info");
    pushSubjectMaskTrace(`Geometry: box ${boxSummary}; foreground points ${foregroundPointCount}; background points ${backgroundPointCount}; brush samples ${brushSampleCount}.`, "info");
    pushSubjectMaskTrace(`Prompt: ${providerTargetPrompt ? `"${providerTargetPrompt}"` : "none"}.`, "info");

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
            ? usingPaintedSelection
              ? "Snapping the painted selection to the subject… this can take up to two minutes"
              : usingRoughSelection
                ? "Snapping the painted subject selection… this can take up to two minutes"
                : "Removing the background from your art…"
            : concepts.length > 1
              ? `Segmenting ${concepts.length} subjects: ${concepts.join(", ")}…`
              : `Segmenting “${concepts[0] ?? normalizedTargetPrompt}”…`,
        );

        pushSubjectMaskTrace("Submitting image and prompts to the Supabase subject-mask Edge Function.", "info");
        const generatedMask = await generateSubjectMatteUri({
          imageUri: artUri,
          targetPrompt: providerTargetPrompt,
          boxPrompt,
          pointPrompts,
          brushSamples,
          brushRadius,
          onTrace: pushSubjectMaskTrace,
        });
        maskUri = generatedMask.uri;
        generatedMaskProgress = generatedMask.progress;
        pushSubjectMaskDiagnosticsTrace(generatedMask.diagnostics ?? null);
        pushSubjectMaskTrace(
          generatedMask.components?.length
            ? `Provider returned ${generatedMask.components.length} mask component${generatedMask.components.length === 1 ? "" : "s"}.`
            : "Provider returned a single foreground matte.",
          "success",
        );
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
      pushSubjectMaskTrace("Mask applied to the current card.", "success");
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
        pushSubjectMaskDiagnosticsTrace(error.diagnostics ?? null);
      }
      pushSubjectMaskTrace(error instanceof Error ? `Stopped: ${error.message}` : "Stopped: subject mask generation failed.", "error");
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
    pushSubjectMaskTrace(initialPhase, "info");
    const render = () => {
      const elapsed = Math.round((Date.now() - startedAt) / 1000);
      reportSubjectMaskStatus(`${phase} (${elapsed}s)`);
    };
    render();
    const intervalId = setInterval(render, 1000);
    return {
      setPhase: (next: string) => {
        phase = next;
        pushSubjectMaskTrace(next, "info");
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
    setSubjectMaskTrace([]);
    pushSubjectMaskTrace(`Adding subject "${trimmed}" to the existing mask.`, "info");
    const stopMaskTimer = startSubjectMaskTimer(`Adding “${trimmed}”…`);

    try {
      pushSubjectMaskTrace("Preparing source art for prompted subject segmentation.", "info");
      const requestImageUri = await downscaleImageForMaskRequest(sourceUri);
      pushSubjectMaskTrace("Submitting add-subject prompt to the Supabase subject-mask Edge Function.", "info");
      const matte = await generateSubjectMatteViaEdge({
        imageUri: requestImageUri,
        targetPrompt: getSubjectMaskPromptForProvider(trimmed),
      });
      const newMasks = (matte.subjectMasks ?? []).filter((mask) => mask && Boolean(mask.url));

      if (newMasks.length === 0) {
        throw new Error(`Couldn't find “${trimmed}” in your art.`);
      }

      pushSubjectMaskDiagnosticsTrace(matte.diagnostics ?? null);
      pushSubjectMaskTrace(`Provider returned ${newMasks.length} new mask component${newMasks.length === 1 ? "" : "s"}.`, "success");
      const additions = newMasks.map((mask) => ({ concept: mask.concept, cutoutUrl: mask.url, enabled: true }));
      const next = normalizeSubjectMaskComponentsField([...subjectMaskComponents, ...additions]) ?? [];
      setSubjectMaskComponents(next);

      stopMaskTimer.setPhase("Combining the masks…");
      const composed = await composeSubjectMaskFromComponents(next, sourceUri);
      updateCurrentFace({
        artSubjectMaskUri: composed ?? undefined,
        artSubjectMaskComponents: next.length > 0 ? next : undefined,
      });
      pushSubjectMaskTrace("Updated mask applied to the current card.", "success");
      if (!applyAuthoritativeAiProgress(matte.progress)) {
        recordSuccessfulCreditSpend("subjectMask");
      }
    } catch (error) {
      console.warn("Unable to add subject mask.", error);
      if (error instanceof SubjectMatteProviderError) {
        pushSubjectMaskDiagnosticsTrace(error.diagnostics ?? null);
      }
      pushSubjectMaskTrace(error instanceof Error ? `Stopped: ${error.message}` : "Stopped: add-subject masking failed.", "error");
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

  const commitSavedCardResult = (
    result: NonNullable<ReturnType<typeof saveCardDraftIntoSet>>,
    cardToSave: CardDraft,
    options?: {
      notify?: boolean;
      updateCurrentCard?: boolean;
      clearDirty?: boolean;
    },
  ) => {
    cardSetsRef.current = result.sets;
    setCardSets(result.sets);
    setSelectedSetId(result.setId);
    setActiveSetCardId(result.snapshot.id);
    setActiveSetCardSetId(result.setId);
    setPhysicalBackVisible(false);

    if (options?.updateCurrentCard !== false) {
      dispatchCard({ type: "replace", card: cloneCardDraft(result.snapshot.card) });
    } else if (cardToSave !== card) {
      dispatchCard({ type: "replace", card: cardToSave });
    }

    if (options?.clearDirty !== false) {
      setCardHasUnsavedEdits(false);
    }

    const savedSet = result.sets.find((set) => set.id === result.setId);
    const savedToSharedSet = Boolean(
      accountUser &&
      savedSet?.ownerUserId &&
      savedSet.ownerUserId !== accountUser.id,
    );

    if (savedToSharedSet) {
      persistSharedSetCardSnapshot(result.setId, result.snapshot);
    } else {
      queueSavedSetCardImageRender(result.setId, result.snapshot, accountUser, {
        remoteThumbnailsReady: !accountUser || accountSetsHydrated,
      });
    }

    recordProgressEvent("save-card");

    if (options?.notify) {
      Alert.alert("Card saved", `${result.snapshot.card.name || "Untitled Card"} was saved to ${result.setName}.`);
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
    const activeSnapshotId = targetSetId === activeSetCardSetId ? activeSetCardId : null;
    const cardToSave = withDefaultCardCredit(card, accountFooterOwnerName);
    const result = saveCardDraftIntoSet(cardSets, targetSetId, cardToSave, activeSnapshotId, {
      saveMode: options?.saveMode,
      overwriteSnapshotId: options?.overwriteSnapshotId,
    });

    if (!result) {
      return null;
    }

    commitSavedCardResult(result, cardToSave, options);

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
    const activeSnapshotId = targetSetId === activeSetCardSetId ? activeSetCardId : null;
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
    const targetSet =
      (activeSetCardSetId
        ? cardSetsRef.current.find((set) => set.id === activeSetCardSetId)
        : null) ??
      cardSetsRef.current.find((set) => set.id === selectedSetId) ??
      cardSetsRef.current[0];

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
      activeSetCardId: targetSet.id === activeSetCardSetId ? activeSetCardId : null,
      activeSetCardSetId: targetSet.id,
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

    dispatchCard({ type: "reset" });
    setActiveSetCardId(null);
    setActiveSetCardSetId(null);
    setCardHasUnsavedEdits(false);
    setActiveSection(null);
    setSheetSection(null);
    setPhysicalBackVisible(false);
    setEditMenuOpen(false);
    setCardActionMenuOpen(false);
    setShareMenuOpen(false);
    setPhysicalBackMenuOpen(false);
    setSaveDestinationPromptOpen(false);
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
    setSaveDestinationPromptOpen(false);
  };

  const performRandomizeCard = () => {
    dispatchCard({ type: "randomize" });
    setActiveSetCardId(null);
    setActiveSetCardSetId(null);
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

  const saveCurrentCardToSet = (targetSetId: string, options?: { notify?: boolean }) => {
    setShareMenuOpen(false);
    setSaveDestinationPromptOpen(false);

    const targetSet = cardSets.find((set) => set.id === targetSetId) ?? cardSets[0];

    if (!targetSet) {
      return;
    }

    const activeSnapshot =
      activeSetCardId &&
      activeSetCardSetId === targetSet.id &&
      targetSet.cards.some((snapshot) => snapshot.id === activeSetCardId)
        ? targetSet.cards.find((snapshot) => snapshot.id === activeSetCardId) ?? null
        : null;
    const namedSnapshot = findNamedSetCardSnapshot(targetSet, card, activeSnapshot?.id ?? null);
    const overwriteSnapshot = activeSnapshot ?? namedSnapshot;

    if (!overwriteSnapshot) {
      const result = saveCardToSet(targetSet.id, { notify: false, saveMode: "new" });

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

  const saveCurrentCardToNewSet = (name: string, options?: { notify?: boolean }) => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      console.warn("Unable to save card to a new set because the set name is empty.");
      return;
    }

    setShareMenuOpen(false);
    setSaveDestinationPromptOpen(false);

    const newSet = createDefaultCardSet(trimmedName, createUuid());
    const nextSets = normalizeCardSets([...cardSetsRef.current, newSet]);
    const cardToSave = withDefaultCardCredit(card, accountFooterOwnerName);
    const result = saveCardDraftIntoSet(nextSets, newSet.id, cardToSave, null, {
      saveMode: "new",
    });

    if (!result) {
      console.warn("Unable to save card to a new set after creating the destination set.", {
        setId: newSet.id,
        setName: trimmedName,
      });
      return;
    }

    commitSavedCardResult(result, cardToSave, { notify: false });
    recordProgressEvent("create-set");

    if (options?.notify) {
      confirmSavedCard(result);
    }
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
    setSaveDestinationPromptOpen(false);

    if (!accountUser) {
      Alert.alert("Sign in required", "Sign in before sharing a card to the community feed.");
      openAccount();
      return;
    }

    const communityCardId = activeSetCardId
      ? `community-${accountUser.id}-${activeSetCardId}`
      : `community-${accountUser.id}-${createUuid()}`;

    try {
      const communityCard = cloneCardDraft(withDefaultCardCredit(previewCard, accountFooterOwnerName));
      const imageUrl = await renderCardImageForUpload(
        communityCard,
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

  const renderCardImageForUpload = useCallback(async (
    communityCard: CardDraft,
    userId: string,
    communityCardId: string,
    options?: {
      renderWidth?: number;
      flattenMasksExport?: boolean;
      showBusyIndicator?: boolean;
    },
  ) => {
    const exportCard = await materializeCardDraftForExport(communityCard, `community-card-${userId}`);
    const flattenMasksExport = options?.flattenMasksExport ?? Platform.OS === "web";
    const exportTarget: FlatCardExportTarget = {
      kind: "card",
      card: exportCard,
      artImageAspectRatio: await getCardExportArtImageAspectRatio(exportCard),
      renderWidth: options?.renderWidth,
      flattenMasksExport,
    };

    if (options?.showBusyIndicator !== false) {
      setWebPhotoExportBusy(Platform.OS === "web");
    }
    try {
      await preloadCardDraftExportImages(exportCard);
      await applyExportRenderTargetUpdate(() => setSingleExportTarget(exportTarget));
      const exportPreview = await waitForExportPreviewRef(singleExportContainerRef, {
        nativeID: CARDMAGIC_SINGLE_EXPORT_PREVIEW_ID,
        timeoutMs: 8000,
        errorMessage: "CardMagic could not find the rendered card preview.",
      });
      if (Platform.OS === "web" && flattenMasksExport) {
        await waitForFlattenedFrameComposites();
      }
      await waitForExportPreviewImages(exportPreview);
      await waitForRenderFrame(160);
      const uploadImage = Platform.OS === "web"
        ? await createWebSetCardUploadImage(exportPreview)
        : await createNativeSetCardUploadImage(await captureCardMagicPng(exportPreview));

      assertSetCardImageUploadBodyWithinLimit(uploadImage.uploadBody);
      return await uploadCommunityCardImage(
        userId,
        communityCardId,
        uploadImage.uploadBody,
        uploadImage.uploadContentType,
      );
    } finally {
      if (options?.showBusyIndicator !== false) {
        setWebPhotoExportBusy(false);
      }
      setSingleExportTarget(null);
    }
  }, []);

  const renderSetCardImage = useCallback(async (
    savedCard: CardDraft,
    setId: string,
    snapshotId: string,
    onStatus?: (status: SetCardImageRenderStatusDraft) => void,
  ) => {
    const exportCard = await materializeCardDraftForExport(savedCard, `set-card-render-${setId}-${snapshotId}`);
    const exportTarget: FlatCardExportTarget = {
      kind: "card",
      card: exportCard,
      artImageAspectRatio: await getCardExportArtImageAspectRatio(exportCard),
      renderWidth: SET_CARD_RENDER_IMAGE_WIDTH,
      flattenMasksExport: Platform.OS === "web",
    };

    try {
      await preloadCardDraftExportImages(exportCard);
      onStatus?.({
        phase: "mounting",
        label: "Mounting render",
        detail: "Preparing hidden card renderer",
      });
      await applyExportRenderTargetUpdate(() => setSingleExportTarget(exportTarget));
      const exportPreview = await waitForExportPreviewRef(singleExportContainerRef, {
        nativeID: CARDMAGIC_SINGLE_EXPORT_PREVIEW_ID,
        timeoutMs: 8000,
        errorMessage: "CardMagic could not find the rendered set card preview.",
      });
      if (Platform.OS === "web") {
        await waitForFlattenedFrameComposites();
      }
      onStatus?.({
        phase: "loading-assets",
        label: "Loading assets",
        detail: "Waiting for frame and art images",
      });
      await waitForExportPreviewImages(exportPreview);
      await waitForRenderFrame(160);
      onStatus?.({
        phase: "capturing",
        label: "Capturing image",
        detail: "Rasterizing set image for local cache",
      });

      if (Platform.OS === "web") {
        const uploadImage = await createWebSetCardUploadImage(exportPreview, onStatus);
        onStatus?.({
          phase: "saving-local",
          label: "Saving local image",
          detail: "Caching compressed set image before upload",
        });
        const localImageUrl = uploadImage.localImageBlob
          ? await persistWebMediaBlob(
              uploadImage.localImageBlob,
              getSavedSetCardThumbnailUploadId(snapshotId),
              uploadImage.uploadContentType,
            )
          : await persistWebMediaUri(
              uploadImage.localImageUrl,
              getSavedSetCardThumbnailUploadId(snapshotId),
              uploadImage.uploadContentType,
            );

        return {
          localImageUrl,
          uploadBody: uploadImage.uploadBody,
          uploadContentType: uploadImage.uploadContentType,
        };
      }

      const renderedPng = await captureCardMagicPng(exportPreview);
      const uploadImage = await createNativeSetCardUploadImage(renderedPng, onStatus);
      assertSetCardImageUploadBodyWithinLimit(uploadImage.uploadBody);

      return uploadImage;
    } finally {
      setSingleExportTarget(null);
    }
  }, []);

  async function materializeSetCardSnapshotCard(snapshot: SetCardSnapshot, setId?: string) {
    let sourceCard = cloneCardDraft(snapshot.card);
    let remoteCardLoaded = false;
    let remoteCardHasUnresolvedMedia = false;

    if (snapshot.remoteCardId) {
      try {
        const remoteCard = await fetchRemoteCardDraftForEditing(snapshot.remoteCardId, {
          mediaMode: setId ? "signed-url" : "data-uri",
        });

        if (remoteCard) {
          sourceCard = remoteCard;
          remoteCardLoaded = true;
          remoteCardHasUnresolvedMedia = cardHasUnresolvedRemoteMedia(remoteCard);
        }
      } catch (error) {
        console.warn("Unable to fetch editable Supabase set card payload.", {
          cardId: snapshot.remoteCardId,
          error,
        });
      }

      if (setId && (!remoteCardLoaded || remoteCardHasUnresolvedMedia)) {
        try {
          const collaborationCard = await fetchCollaborationSetCardDraftForEditing(setId, snapshot.remoteCardId, {
            mediaMode: "signed-url",
          });

          if (collaborationCard) {
            sourceCard = collaborationCard;
            remoteCardLoaded = true;
            remoteCardHasUnresolvedMedia = cardHasUnresolvedRemoteMedia(collaborationCard);
          }
        } catch (error) {
          console.warn("Unable to fetch editable collaboration set card payload.", {
            setId,
            cardId: snapshot.remoteCardId,
            error,
          });
        }
      }
    }

    if (setId) {
      let editorCard = sourceCard;

      try {
        editorCard = await materializeRemoteCardDraftMedia(editorCard, { mode: "signed-url" });
      } catch (error) {
        console.warn("Unable to materialize Supabase media references for set card editing.", {
          setId,
          snapshotId: snapshot.id,
          remoteCardId: snapshot.remoteCardId,
          error,
        });
      }

      editorCard = await materializeCardDraftWebMediaReferences(
        editorCard,
        `set-card-editor-${setId}-${snapshot.id}`,
      );

      if (!shouldUseEditorReadySetCardDraft(editorCard)) {
        console.warn("Opening set card with unresolved private media references.", {
          setId,
          snapshotId: snapshot.id,
          remoteCardId: snapshot.remoteCardId,
        });
      }

      return editorCard;
    }

    return materializeCardDraftForExport(sourceCard, `set-card-snapshot-${snapshot.id}`);
  }

  async function materializeCardSetForExport(set: CardSet): Promise<CardSet> {
    const normalizedSet = normalizeCardSet(set);
    const cards: SetCardSnapshot[] = [];

    for (const snapshot of normalizedSet.cards) {
      const card = await materializeSetCardSnapshotCard(snapshot);
      cards.push({
        ...snapshot,
        card,
      });
    }

    return normalizeCardSet({
      ...normalizedSet,
      cards,
    });
  }

  function getSavedSetCardImageRenderKey(ownerKey: string, setId: string, snapshot: SetCardSnapshot) {
    return `${ownerKey}:${setId}:${snapshot.id}:${snapshot.savedAt}`;
  }

  function setSavedSetCardImageRenderStatus(renderKey: string, status: SetCardImageRenderStatusDraft) {
    setSavedSetImageRenderStatuses((current) => {
      const next: Record<string, SetCardImageRenderStatus> = {
        ...current,
        [renderKey]: {
          ...status,
          updatedAt: Date.now(),
        },
      };
      const keys = Object.keys(next);

      if (keys.length <= SET_CARD_RENDER_STATUS_MAX_ENTRIES) {
        return next;
      }

      keys
        .sort((left, right) => next[left].updatedAt - next[right].updatedAt)
        .slice(0, keys.length - SET_CARD_RENDER_STATUS_MAX_ENTRIES)
        .forEach((key) => {
          delete next[key];
        });

      return next;
    });
  }

  function queueSavedSetCardImageRender(
    setId: string,
    snapshot: SetCardSnapshot,
    user: SupabaseUser | null,
    options?: {
      remoteThumbnailsReady?: boolean;
      remoteCardId?: string;
      remoteImageOwnerUserId?: string;
      canPersistRemoteImage?: boolean;
      allowBackgroundRender?: boolean;
      forceRefresh?: boolean;
    },
  ) {
    const existingImageUrl = snapshot.renderedImageUrl;
    const ownerKey = user?.id ?? "local";
    const renderKey = getSavedSetCardImageRenderKey(ownerKey, setId, snapshot);
    const remoteThumbnailsReady = !user || options?.remoteThumbnailsReady === true;
    const remoteImageOwnerUserId = options?.remoteImageOwnerUserId ?? snapshot.remoteImageOwnerUserId ?? user?.id;
    const remoteCardId = options?.remoteCardId ?? snapshot.remoteCardId;
    const canPersistRemoteImage = Boolean(
      user &&
      options?.canPersistRemoteImage !== false &&
      (remoteImageOwnerUserId === user.id || remoteCardId)
    );
    const forceRefresh = options?.forceRefresh === true;
    const allowBackgroundRender = forceRefresh || options?.allowBackgroundRender !== false;

    if (!remoteThumbnailsReady) {
      setSavedSetCardImageRenderStatus(renderKey, {
        phase: "checking-remote",
        label: "Checking Supabase",
        detail: "Fast card-row lookup before full set hydration",
      });
    }

    if (!forceRefresh && (isPublicRenderedCardImageUrl(existingImageUrl) || (existingImageUrl && !user))) {
      return;
    }

    if (savedSetImageRenderKeysRef.current.has(renderKey)) {
      return;
    }

    savedSetImageRenderKeysRef.current.add(renderKey);

    if (existingImageUrl && user && !canPersistRemoteImage) {
      savedSetImageRenderKeysRef.current.delete(renderKey);
      return;
    }

    if (!forceRefresh && existingImageUrl && user && canPersistRemoteImage) {
      setSavedSetCardImageRenderStatus(renderKey, {
        phase: "checking-remote",
        label: "Checking Supabase",
        detail: "Looking for canonical Storage image",
        imageUrl: existingImageUrl,
      });
      const promotionSnapshot = {
        ...snapshot,
        card: cloneCardDraft(snapshot.card),
      };

      const request = {
        setId,
        snapshot: promotionSnapshot,
        remoteCardId,
        remoteImageOwnerUserId,
        canPersistRemoteImage,
        allowBackgroundRender,
      };

      void (async () => {
        let queuedRender = false;

        try {
          if (await attachExistingSavedSetCardSupabaseImage(request, user, renderKey, existingImageUrl)) {
            return;
          }

          if (!request.allowBackgroundRender) {
            setSavedSetCardImageRenderStatus(renderKey, {
              phase: "failed",
              label: "Render deferred",
              detail: "Open Refresh to replace this shared set preview",
              imageUrl: existingImageUrl,
            });
            return;
          }

          queuedRender = true;
          enqueueSavedSetCardImageCapture(request, user, renderKey);
        } finally {
          if (!queuedRender) {
            savedSetImageRenderKeysRef.current.delete(renderKey);
          }
        }
      })();
      return;
    }

    const renderSnapshot = {
      ...snapshot,
      card: cloneCardDraft(snapshot.card),
    };
    const request = {
      setId,
      snapshot: renderSnapshot,
      remoteCardId,
      remoteImageOwnerUserId,
      canPersistRemoteImage,
      allowBackgroundRender,
      forceRefresh,
    };

    if (user && !forceRefresh) {
      setSavedSetCardImageRenderStatus(renderKey, {
        phase: "checking-remote",
        label: "Checking Supabase",
        detail: "Looking for saved render URLs in parallel",
      });

      void (async () => {
        let queuedRender = false;

        try {
          if (await attachExistingSavedSetCardSupabaseImage(request, user, renderKey)) {
            return;
          }

          if (!request.allowBackgroundRender) {
            setSavedSetCardImageRenderStatus(renderKey, {
              phase: "failed",
              label: "Preview missing",
              detail: "Open Refresh to render this shared set preview",
            });
            return;
          }

          queuedRender = true;
          enqueueSavedSetCardImageCapture(
            request,
            canPersistRemoteImage ? user : null,
            renderKey,
          );
        } finally {
          if (!queuedRender) {
            savedSetImageRenderKeysRef.current.delete(renderKey);
          }
        }
      })();
      return;
    }

    enqueueSavedSetCardImageCapture(request, forceRefresh ? user : null, renderKey);
  }

  function enqueueSavedSetCardImageCapture(
    request: SavedSetCardImageRequest,
    user: SupabaseUser | null,
    renderKey: string,
  ) {
    setSavedSetCardImageRenderStatus(renderKey, {
      phase: "queued",
      label: request.forceRefresh ? "Refresh queued" : "Queued",
      detail: request.forceRefresh
        ? "Waiting to replace the saved set image"
        : user ? "Waiting for set image renderer" : "Waiting for local set image renderer",
    });
    savedSetImageRenderQueueRef.current = savedSetImageRenderQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 250));
          await renderSavedSetCardImage(request, user, renderKey);
        } finally {
          savedSetImageRenderKeysRef.current.delete(renderKey);
        }
      });
    void savedSetImageRenderQueueRef.current;
  }

  async function attachExistingSavedSetCardSupabaseImage(
    request: SavedSetCardImageRequest,
    user: SupabaseUser,
    renderKey: string,
    expectedCurrentImageUrl?: string,
  ) {
    try {
      setSavedSetCardImageRenderStatus(renderKey, {
        phase: "checking-remote",
        label: "Checking Supabase",
        detail: "Looking for saved card image_url",
        imageUrl: expectedCurrentImageUrl,
      });
      const remoteCardImage = request.remoteCardId
        ? await findRemoteCardRenderedImageById(request.remoteCardId)
        : request.remoteImageOwnerUserId
          ? await findRemoteCardRenderedImage(
              request.remoteImageOwnerUserId,
              getSavedSetCardRemoteLocalSnapshotId(request),
            )
          : null;

      if (
        remoteCardImage?.imageUrl &&
        isPublicRenderedCardImageUrl(remoteCardImage.imageUrl)
      ) {
        const remoteImageUrl = withSavedSetCardThumbnailVersion(
          remoteCardImage.imageUrl,
          remoteCardImage.updatedAt ?? request.snapshot.savedAt,
        );

        if (!isSavedSetCardImageRequestCurrent(request, expectedCurrentImageUrl)) {
          setSavedSetCardImageRenderStatus(renderKey, {
            phase: "failed",
            label: "Remote attach skipped",
            detail: "Saved-card snapshot changed before image_url attach",
            imageUrl: remoteImageUrl,
          });
          return true;
        }

        const attachedRemoteImage = attachSavedSetCardRenderedImage(
          request,
          remoteImageUrl,
          expectedCurrentImageUrl,
        );
        setSavedSetCardImageRenderStatus(renderKey, {
          phase: "ready-remote",
          label: "Supabase image ready",
          detail: attachedRemoteImage ? "Existing card image_url attached" : "Saved image_url found, but tile state did not match",
          imageUrl: remoteImageUrl,
        });
        return true;
      }

      setSavedSetCardImageRenderStatus(renderKey, {
        phase: "checking-remote",
        label: "Checking Supabase",
        detail: "Looking for canonical Storage image",
        imageUrl: expectedCurrentImageUrl,
      });
      const existingImage = await findExistingSavedSetCardSupabaseImage(request, user);

      if (!existingImage) {
        return false;
      }

      const remoteImageUrl = withSavedSetCardThumbnailVersion(
        existingImage.publicUrl,
        existingImage.lastModified ?? request.snapshot.savedAt,
      );

      if (!isSavedSetCardImageRequestCurrent(request, expectedCurrentImageUrl)) {
        setSavedSetCardImageRenderStatus(renderKey, {
          phase: "failed",
          label: "Remote attach skipped",
          detail: "Saved-card snapshot changed before Storage image attach",
          imageUrl: remoteImageUrl,
        });
        return true;
      }

      const attachedRemoteImage = attachSavedSetCardRenderedImage(
        request,
        remoteImageUrl,
        expectedCurrentImageUrl,
      );
      setSavedSetCardImageRenderStatus(renderKey, {
        phase: "persisting",
        label: "Repairing image URL",
        detail: "Writing existing Storage image URL to Supabase",
        imageUrl: remoteImageUrl,
      });
      if (request.canPersistRemoteImage) {
        await persistSavedSetCardRemoteImageUrl(request, user, remoteImageUrl);
      }
      setSavedSetCardImageRenderStatus(renderKey, {
        phase: "ready-remote",
        label: "Supabase image ready",
        detail: attachedRemoteImage
          ? request.canPersistRemoteImage
            ? "Existing Storage image attached"
            : "Existing shared Storage image attached"
          : "Storage URL found, but tile state did not match",
        imageUrl: remoteImageUrl,
      });
      return true;
    } catch (error) {
      setSavedSetCardImageRenderStatus(renderKey, {
        phase: "failed",
        label: "Storage check failed",
        detail: getSetCardImageRenderErrorDetail(error),
        imageUrl: expectedCurrentImageUrl,
      });
      console.warn("Unable to attach existing saved set card image from Supabase Storage.", error);
      return false;
    }
  }

  async function findExistingSavedSetCardSupabaseImage(
    request: SavedSetCardImageRequest,
    user?: SupabaseUser,
  ) {
    const canonicalStoragePath = getSavedSetCardCanonicalStoragePath(request);

    if (canonicalStoragePath) {
      const existingImage = await findExistingCommunityCardImageByPath(canonicalStoragePath);

      if (existingImage) {
        return existingImage;
      }
    }

    const lookupImageIds = getSavedSetCardThumbnailLookupSnapshotIds(request)
      .map(getSavedSetCardThumbnailUploadId);

    if (lookupImageIds.length === 0) {
      return null;
    }

    for (const userId of getSavedSetCardThumbnailLookupUserIds(request, user)) {
      const existingImages = await findExistingCommunityCardImages(userId, lookupImageIds);

      for (const imageId of lookupImageIds) {
        const existingImage = existingImages.get(imageId);

        if (existingImage) {
          return existingImage;
        }
      }
    }

    return null;
  }

  function getSavedSetCardThumbnailLookupSnapshotIds(request: SavedSetCardImageRequest) {
    return Array.from(new Set([
      getSavedSetCardRemoteLocalSnapshotId(request),
      request.snapshot.id,
      request.remoteCardId,
    ].filter((value): value is string => Boolean(value))));
  }

  function getSavedSetCardRemoteLocalSnapshotId(request: SavedSetCardImageRequest) {
    if (
      request.remoteCardId &&
      request.remoteImageOwnerUserId &&
      request.remoteCardId.startsWith(`${request.remoteImageOwnerUserId}:`)
    ) {
      return request.remoteCardId.slice(request.remoteImageOwnerUserId.length + 1);
    }

    return request.snapshot.id;
  }

  function getSavedSetCardThumbnailLookupUserIds(
    request: SavedSetCardImageRequest,
    user?: SupabaseUser,
  ) {
    return Array.from(new Set([
      request.remoteImageOwnerUserId,
      user?.id,
    ].filter((value): value is string => Boolean(value))));
  }

  function getSavedSetCardCanonicalStoragePath(request: SavedSetCardImageRequest) {
    if (!request.remoteCardId) {
      return null;
    }

    try {
      return getCommunitySetCardImageStoragePath(request.setId, request.remoteCardId);
    } catch {
      return null;
    }
  }

  async function renderSavedSetCardImage(
    request: SavedSetCardImageRequest,
    user: SupabaseUser | null,
    renderKey: string,
  ) {
    try {
      if (skipSavedSetCardImageRenderIfImageExists(request, user, renderKey)) {
        return;
      }

      if (user) {
        await waitForSavedSetCardImageUploadPayloadSlot(renderKey);

        if (skipSavedSetCardImageRenderIfImageExists(request, user, renderKey)) {
          return;
        }

        if (!isSavedSetCardImageRequestCurrent(request)) {
          setSavedSetCardImageRenderStatus(renderKey, {
            phase: "failed",
            label: "Render skipped",
            detail: "Saved-card snapshot changed before image capture",
          });
          return;
        }
      }

      const renderCard = await materializeSetCardSnapshotCard(request.snapshot);

      if (!isSavedSetCardImageRequestCurrent(request)) {
        setSavedSetCardImageRenderStatus(renderKey, {
          phase: "failed",
          label: "Render skipped",
          detail: "Saved-card snapshot changed before image capture",
        });
        return;
      }

      const { localImageUrl, uploadBody, uploadContentType } = await renderSetCardImage(
        renderCard,
        request.setId,
        request.snapshot.id,
        (status) => setSavedSetCardImageRenderStatus(renderKey, status),
      );

      const attachedLocalImage = attachSavedSetCardRenderedImage(request, localImageUrl);
      setSavedSetCardImageRenderStatus(renderKey, {
        phase: "ready-local",
        label: "Local image ready",
        detail: attachedLocalImage ? "Cached set image attached" : "Rendered, but tile state did not match",
        imageUrl: localImageUrl,
      });

      if (!user) {
        return;
      }

      enqueueSavedSetCardImageUpload({
        renderKey,
        request,
        user,
        localImageUrl,
        uploadBody,
        uploadContentType,
      });
    } catch (error) {
      setSavedSetCardImageRenderStatus(renderKey, {
        phase: "failed",
        label: "Render failed",
        detail: getSetCardImageRenderErrorDetail(error),
      });
      console.warn("Unable to render saved set card image.", error);
    }
  }

  function getCurrentSavedSetCardImageSnapshot(request: SavedSetCardImageRequest) {
    const currentSet = cardSetsRef.current.find((set) => set.id === request.setId);

    return currentSet?.cards.find((snapshot) =>
      snapshot.id === request.snapshot.id &&
      snapshot.savedAt === request.snapshot.savedAt
    );
  }

  function skipSavedSetCardImageRenderIfImageExists(
    request: SavedSetCardImageRequest,
    user: SupabaseUser | null,
    renderKey: string,
  ) {
    const currentSnapshot = getCurrentSavedSetCardImageSnapshot(request);

    if (!currentSnapshot) {
      setSavedSetCardImageRenderStatus(renderKey, {
        phase: "failed",
        label: "Render skipped",
        detail: "Saved-card snapshot changed before image capture",
      });
      return true;
    }

    const currentImageUrl = currentSnapshot.renderedImageUrl;

    if (request.forceRefresh) {
      return false;
    }

    if (!currentImageUrl || (user && !isPublicRenderedCardImageUrl(currentImageUrl))) {
      return false;
    }

    setSavedSetCardImageRenderStatus(renderKey, {
      phase: isPublicRenderedCardImageUrl(currentImageUrl) ? "ready-remote" : "ready-local",
      label: isPublicRenderedCardImageUrl(currentImageUrl) ? "Supabase image ready" : "Local image ready",
      detail: "Existing rendered image URL found before rerender",
      imageUrl: currentImageUrl,
    });
    return true;
  }

  function getSavedSetCardImageUploadPayloadCount() {
    return savedSetImageUploadActiveCountRef.current + savedSetImageUploadQueueRef.current.length;
  }

  async function waitForSavedSetCardImageUploadPayloadSlot(renderKey: string) {
    if (getSavedSetCardImageUploadPayloadCount() < SET_CARD_IMAGE_UPLOAD_PAYLOAD_LIMIT) {
      return;
    }

    setSavedSetCardImageRenderStatus(renderKey, {
      phase: "waiting-upload-slot",
      label: "Waiting upload slot",
      detail: "Three rendered image uploads are already active or queued",
    });

    while (getSavedSetCardImageUploadPayloadCount() >= SET_CARD_IMAGE_UPLOAD_PAYLOAD_LIMIT) {
      await new Promise<void>((resolve) => {
        savedSetImageUploadSlotWaitersRef.current.push(resolve);
      });
    }
  }

  function notifySavedSetCardImageUploadPayloadSlot() {
    if (getSavedSetCardImageUploadPayloadCount() >= SET_CARD_IMAGE_UPLOAD_PAYLOAD_LIMIT) {
      return;
    }

    const nextWaiter = savedSetImageUploadSlotWaitersRef.current.shift();
    nextWaiter?.();
  }

  function enqueueSavedSetCardImageUpload(uploadRequest: SavedSetCardImageUploadRequest) {
    if (savedSetImageUploadKeysRef.current.has(uploadRequest.renderKey)) {
      return;
    }

    savedSetImageUploadKeysRef.current.add(uploadRequest.renderKey);
    savedSetImageUploadQueueRef.current.push(uploadRequest);
    setSavedSetCardImageRenderStatus(uploadRequest.renderKey, {
      phase: "upload-queued",
      label: "Upload queued",
      detail: "Renderer is moving to the next card",
      imageUrl: uploadRequest.localImageUrl,
    });
    drainSavedSetCardImageUploadQueue();
  }

  function drainSavedSetCardImageUploadQueue() {
    while (
      savedSetImageUploadActiveCountRef.current < SET_CARD_IMAGE_UPLOAD_CONCURRENCY &&
      savedSetImageUploadQueueRef.current.length > 0
    ) {
      const uploadRequest = savedSetImageUploadQueueRef.current.shift();

      if (!uploadRequest) {
        return;
      }

      savedSetImageUploadActiveCountRef.current += 1;
      void persistSavedSetCardImageUpload(uploadRequest)
        .catch((error) => {
          setSavedSetCardImageRenderStatus(uploadRequest.renderKey, {
            phase: "failed",
            label: "Upload failed",
            detail: getSetCardImageRenderErrorDetail(error),
            imageUrl: uploadRequest.localImageUrl,
          });
          console.warn("Unable to upload saved set card image.", error);
        })
        .finally(() => {
          savedSetImageUploadActiveCountRef.current = Math.max(0, savedSetImageUploadActiveCountRef.current - 1);
          savedSetImageUploadKeysRef.current.delete(uploadRequest.renderKey);
          drainSavedSetCardImageUploadQueue();
          notifySavedSetCardImageUploadPayloadSlot();
        });
    }
  }

	  async function persistSavedSetCardImageUpload(uploadRequest: SavedSetCardImageUploadRequest) {
    if (!isSavedSetCardImageRequestCurrent(uploadRequest.request, uploadRequest.localImageUrl)) {
      setSavedSetCardImageRenderStatus(uploadRequest.renderKey, {
        phase: "failed",
        label: "Upload skipped",
        detail: "Saved-card snapshot changed before upload",
        imageUrl: uploadRequest.localImageUrl,
      });
      return;
    }

    assertSetCardImageUploadBodyWithinLimit(uploadRequest.uploadBody);
    setSavedSetCardImageRenderStatus(uploadRequest.renderKey, {
      phase: "uploading",
      label: "Uploading",
      detail: `Saving ${formatUploadByteLength(getImageUploadBodyByteLength(uploadRequest.uploadBody))} image to Supabase Storage`,
      imageUrl: uploadRequest.localImageUrl,
    });

    const canonicalStoragePath = getSavedSetCardCanonicalStoragePath(uploadRequest.request);
    const uploadedImageUrl = canonicalStoragePath
      ? await uploadCommunityCardImageToPath(
          canonicalStoragePath,
          uploadRequest.uploadBody,
          uploadRequest.uploadContentType,
        )
      : await uploadCommunityCardImage(
          uploadRequest.user.id,
          getSavedSetCardThumbnailUploadId(getSavedSetCardRemoteLocalSnapshotId(uploadRequest.request)),
          uploadRequest.uploadBody,
          uploadRequest.uploadContentType,
        );
    const uploadedAt = new Date().toISOString();
    const remoteImageUrl = withSavedSetCardThumbnailVersion(uploadedImageUrl, uploadedAt);

    if (!isSavedSetCardImageRequestCurrent(uploadRequest.request, uploadRequest.localImageUrl)) {
      setSavedSetCardImageRenderStatus(uploadRequest.renderKey, {
        phase: "failed",
        label: "Persist skipped",
        detail: "Saved-card snapshot changed after upload",
        imageUrl: uploadRequest.localImageUrl,
      });
      return;
    }

    setSavedSetCardImageRenderStatus(uploadRequest.renderKey, {
      phase: "persisting",
      label: "Persisting URL",
      detail: "Writing public image_url to Supabase",
      imageUrl: remoteImageUrl,
    });
    await persistSavedSetCardRemoteImageUrl(uploadRequest.request, uploadRequest.user, remoteImageUrl);

    const attachedRemoteImage = attachSavedSetCardRenderedImage(
      uploadRequest.request,
      remoteImageUrl,
      uploadRequest.localImageUrl,
    );
    setSavedSetCardImageRenderStatus(uploadRequest.renderKey, {
      phase: "ready-remote",
      label: "Supabase image ready",
      detail: attachedRemoteImage ? "Shared rendered image URL attached" : "Uploaded, but tile state did not match",
      imageUrl: remoteImageUrl,
    });
  }

  async function persistSavedSetCardRemoteImageUrl(
    request: SavedSetCardImageRequest,
    user: SupabaseUser,
    imageUrl: string,
  ) {
    if (request.remoteCardId) {
      await attachCollaborationSetCardImage({
        setId: request.setId,
        cardId: request.remoteCardId,
        imageUrl,
      });
      return;
    }

    await updateRemoteCardRenderedImage({
      userId: user.id,
      localSnapshotId: getSavedSetCardRemoteLocalSnapshotId(request),
      card: request.snapshot.card,
      imageUrl,
    });
  }

  function isSavedSetCardImageRequestCurrent(
    request: SavedSetCardImageRequest,
    expectedCurrentImageUrl?: string,
  ) {
    return cardSetsRef.current.some((set) => {
      if (set.id !== request.setId) {
        return false;
      }

      return set.cards.some((snapshot) => {
        if (snapshot.id !== request.snapshot.id || snapshot.savedAt !== request.snapshot.savedAt) {
          return false;
        }

        if (
          request.forceRefresh &&
          expectedCurrentImageUrl &&
          snapshot.renderedImageUrl === request.snapshot.renderedImageUrl
        ) {
          return true;
        }

        return !expectedCurrentImageUrl ||
          !snapshot.renderedImageUrl ||
          snapshot.renderedImageUrl === expectedCurrentImageUrl;
      });
    });
  }

  function attachSavedSetCardRenderedImage(
    request: SavedSetCardImageRequest,
    imageUrl: string,
    expectedCurrentImageUrl?: string,
  ) {
    const canAttach = isSavedSetCardImageRequestCurrent(request, expectedCurrentImageUrl);

    if (!canAttach) {
      return false;
    }

    setCardSets((current) => {
      let attached = false;
      const nextSets = normalizeCardSets(
        current.map((set) => {
          if (set.id !== request.setId) {
            return set;
          }

          const nextCards = set.cards.map((snapshot) => {
            if (snapshot.id !== request.snapshot.id || snapshot.savedAt !== request.snapshot.savedAt) {
              return snapshot;
            }

            if (
              expectedCurrentImageUrl !== undefined &&
              snapshot.renderedImageUrl &&
              snapshot.renderedImageUrl !== expectedCurrentImageUrl
            ) {
              return snapshot;
            }

            attached = true;
            return { ...snapshot, renderedImageUrl: imageUrl };
          });

          return normalizeCardSet({ ...set, cards: nextCards });
        }),
      );

      if (attached) {
        cardSetsRef.current = nextSets;
      }

      return attached ? nextSets : current;
    });

    return true;
  }

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

    const exportSet = await materializeCardSetForExport(selectedSet);

    await exportCardMagicJson(getExportFileName(exportSet.name, "set"), createSetExportPayload(exportSet));
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

    const setSnapshot = await materializeCardSetForExport(selectedSet);

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

    dispatchCard({ type: "nextBlank" });
    setActiveSetCardId(null);
    setActiveSetCardSetId(null);
    setCardHasUnsavedEdits(false);
    setActiveSection(null);
    setSheetSection(null);
    setPhysicalBackVisible(false);
    setEditMenuOpen(false);
    setCardActionMenuOpen(false);
    setShareMenuOpen(false);
    setSaveDestinationPromptOpen(false);
  };

  const addFlipSideToCard = (options?: { initialFace?: "front" | "back" }) => {
    if ((card.typeFrame ?? "standard") === "planeswalker") {
      setPhysicalBackMenuOpen(false);
      return;
    }

    setCardHasUnsavedEdits(true);
    const nextDfcFace = options?.initialFace ?? (physicalBackVisible ? "back" : "front");

    setSuppressPreviewFlipTransition(true);
    dispatchCard({ type: "convertToFlipSide", nextFace: nextDfcFace });
    setPhysicalBackVisible(false);
    setActiveSection("identity");
    setSheetSection(null);
    setEditMenuOpen(false);
    setCardActionMenuOpen(false);
    setShareMenuOpen(false);
    setPhysicalBackMenuOpen(false);
    setSaveDestinationPromptOpen(false);
  };

  const removeFlipSideFromCard = () => {
    setCardHasUnsavedEdits(true);
    dispatchCard({ type: "removeFlipSide" });
    setPreviewRotated(false);
    setPhysicalBackVisible(false);
    setActiveSection("frame");
    setSheetSection(null);
    setEditMenuOpen(false);
    setCardActionMenuOpen(false);
    setShareMenuOpen(false);
    setPhysicalBackMenuOpen(false);
    setSaveDestinationPromptOpen(false);
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

    dispatchCard({ type: "replace", card: nextCard });
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

  const createSet = (name: string) => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    const id = createUuid();

    autosaveCurrentCardIfEdited();
    setCardSets((current) => normalizeCardSets([...current, createDefaultCardSet(trimmedName, id)]));
    setSelectedSetId(id);
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
    dispatchCard({ type: "replace", card: cloneCardDraft(nextSnapshot.card) });
    setActiveSetCardId(nextSnapshot.id);
    setActiveSetCardSetId(setId);
    setCardHasUnsavedEdits(false);
    setActiveSection(null);
    setSheetSection(null);
    setPreviewRotated(false);
    setPhysicalBackVisible(false);
    setInspectorTab("edit");

    void materializeSetCardSnapshotCard(nextSnapshot, setId)
      .then((materializedCard) => {
        const currentSet = cardSetsRef.current.find((set) => set.id === setId);
        const currentSnapshot = currentSet?.cards.find((setCard) =>
          setCard.id === nextSnapshot.id &&
          setCard.savedAt === nextSnapshot.savedAt
        );

        if (!currentSnapshot) {
          return;
        }

        if (
          activeSetCardSetIdRef.current !== setId ||
          activeSetCardIdRef.current !== nextSnapshot.id ||
          cardHasUnsavedEditsRef.current
        ) {
          return;
        }

        dispatchCard({ type: "replace", card: materializedCard });
        setCardHasUnsavedEdits(false);
      })
      .catch((error) => {
        console.warn("Unable to materialize saved set card art for editing.", error);
      });
  };

  const removeCardFromSet = (setId: string, cardId: string) => {
    const targetSet = cardSetsRef.current.find((set) => set.id === setId);
    const targetIndex = targetSet?.cards.findIndex((snapshot) => snapshot.id === cardId) ?? -1;
    const targetSnapshot = targetSet && targetIndex >= 0 ? targetSet.cards[targetIndex] : null;

    if (!targetSet || !targetSnapshot) {
      return;
    }

    if (!canRemoveCardSetSnapshot(targetSet, targetSnapshot, accountUser?.id)) {
      Alert.alert(
        "Card removal unavailable",
        "Only the set creator or the card creator can remove this card from the set.",
      );
      return;
    }

    const shouldRemoveRemoteSharedCard = Boolean(
      accountUser &&
      targetSet.ownerUserId &&
      targetSet.ownerUserId !== accountUser.id &&
      targetSnapshot.remoteCardId &&
      isSetCardSnapshotCreator(targetSnapshot, accountUser.id),
    );

    if (activeSetCardId === cardId && activeSetCardSetId === setId) {
      setActiveSetCardId(null);
      setActiveSetCardSetId(null);
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
    if (shouldRemoveRemoteSharedCard && targetSnapshot.remoteCardId) {
      void removeCollaborationSetCard(setId, targetSnapshot.remoteCardId).catch((error) => {
        console.warn("Unable to remove shared set card from Supabase.", error);
        Alert.alert(
          "Shared card removal failed",
          error instanceof Error ? error.message : "CardMagic could not remove this card from the shared set.",
        );
      });
    }
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
      dispatchCard({ type: "mergeDefaults", patch: defaultPatch });
    }
  };

  const removeSet = (setId: string) => {
    const currentSets = cardSetsRef.current;
    const removedIndex = currentSets.findIndex((set) => set.id === setId);
    const removedSet = removedIndex >= 0 ? currentSets[removedIndex] : null;

    if (!removedSet) {
      return;
    }

    if (!canDeleteCardSetContent(removedSet, accountUser?.id)) {
      Alert.alert(
        "Only the set creator can delete this set",
        "Collaborators can edit shared sets, but only the set creator can delete the set.",
      );
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
    if (activeSetCardSetId === setId) {
      setActiveSetCardId(null);
      setActiveSetCardSetId(null);
    }
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

  const createSetInviteLink = useCallback(async (
    setId: string,
    role: CollaborationSetInviteLinkRole = "editor",
  ) => {
    if (!accountUser) {
      throw new Error("Sign in before creating collaboration invite links.");
    }

    const inviteLink = await createCollaborationSetInviteLink(setId, role);

    return createCollaborationInviteUrl(inviteLink.inviteCode);
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
      if (accountUser && accountSetsHydrated) {
        void removeRemoteDeletedCardTombstone(accountUser.id, undoState.setId, undoState.snapshot.id).catch((error) => {
          console.warn("Unable to remove Supabase card deletion tombstone during undo.", error);
        });
      }
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
    if (accountUser && accountSetsHydrated) {
      void removeRemoteDeletedSetTombstone(accountUser.id, undoState.set.id).catch((error) => {
        console.warn("Unable to remove Supabase set deletion tombstone during undo.", error);
      });
    }
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
  }, [accountSetsHydrated, accountUser, persistAccountSetsNow, persistDeletionTombstonesNow]);

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

  const refreshToLatestRelease = (deployment: CardMagicReleaseDeployment) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.replace(deployment.branchUrl);
      return;
    }

    void Linking.openURL(deployment.branchUrl);
  };

  const dismissRefreshPrompt = () => {
    if (refreshPromptDeployment) {
      dismissedRefreshPromptVersionRef.current = refreshPromptDeployment.version;
    }
    setRefreshPromptDeployment(null);
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
                      accessibilityLabel="Choose set to save card"
                      onPress={() => {
                        setEditMenuOpen(false);
                        setCardActionMenuOpen(false);
                        setShareMenuOpen(false);
                        setSaveDestinationPromptOpen(true);
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

                  {creatorToolsVisible ? (
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
                  ) : null}

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
                                artGenerating={artGeneratorBusy || artImageLoadingUri === faceCard.artUri}
                                onArtImageSettled={(uri) =>
                                  setArtImageLoadingUri((currentUri) => (currentUri === uri ? null : currentUri))
                                }
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
                    accountUserId={accountUser?.id}
                    scrollWindow={mainScrollWindow}
                    onSelectSet={selectSet}
                    onCreateSet={createSet}
                    onRenameSet={renameSet}
                    onChangeSetCode={updateSetCode}
                    onCreateCardInSet={createCardInSet}
                    onOpenCardFromSet={openCardFromSet}
                    onRemoveCardFromSet={removeCardFromSet}
                    onRemoveSet={removeSet}
                    onRefreshSetCardImages={(setId, snapshots) => {
                      const targetSet = cardSetsRef.current.find((set) => set.id === setId);

                      for (const snapshot of snapshots) {
                        const remoteImageOwnerUserId =
                          snapshot.remoteImageOwnerUserId ??
                          targetSet?.ownerUserId ??
                          accountUser?.id;
                        const canPersistRemoteImage = Boolean(
                          accountUser &&
                          (
                            remoteImageOwnerUserId === accountUser.id ||
                            snapshot.remoteCardId
                          ),
                        );

                        queueSavedSetCardImageRender(setId, snapshot, accountUser, {
                          remoteThumbnailsReady: true,
                          remoteCardId: snapshot.remoteCardId,
                          remoteImageOwnerUserId,
                          canPersistRemoteImage,
                          forceRefresh: true,
                        });
                      }
                    }}
                    onChangeSetCardBack={updateSetCardBack}
                    onChangeSetDefaultSymbol={(setId, patch) => {
                      updateSetSymbolDefaults(setId, patch);
                    }}
                    onPickSetSymbol={(setId) => void pickSetSymbol(setId)}
                    onGenerateSetSymbol={creatorToolsVisible ? (setId) => openSetSymbolGenerator(setId) : undefined}
                    customCardBacks={customCardBacks}
                    generatedSetSymbols={generatedSetSymbols}
                    canRefreshSets={Boolean(accountUser)}
                    setsRefreshing={accountSyncBusy}
                    setCardImageRemoteHydrated={!accountUser || accountSetsHydrated}
                    onRefreshSets={() => void syncRemoteUserProgress()}
                    canInviteSetCollaborators={Boolean(accountUser)}
                    onFetchSetCollaborators={fetchCollaborationSetMembers}
                    onFetchPendingInvites={fetchCollaborationSetPendingInvites}
                    onInviteSetCollaborator={inviteSetCollaborator}
                    onCreateSetInviteLink={createSetInviteLink}
                    getSetCardImageRenderStatus={(setId, snapshot) =>
                      savedSetImageRenderStatuses[
                        getSavedSetCardImageRenderKey(accountUser?.id ?? "local", setId, snapshot)
                      ]
                    }
                    onEnsureSetCardImage={(setId, snapshot) => {
                      const targetSet = cardSetsRef.current.find((set) => set.id === setId);
                      const remoteImageOwnerUserId =
                        snapshot.remoteImageOwnerUserId ??
                        targetSet?.ownerUserId ??
                        accountUser?.id;
                      const isSharedSetViewer = Boolean(
                        accountUser &&
                        targetSet?.ownerUserId &&
                        targetSet.ownerUserId !== accountUser.id,
                      );
                      const missingSharedPreviewCount = targetSet?.cards.filter((setCard) =>
                        !setCard.renderedImageUrl && !isPublicRenderedCardImageUrl(setCard.renderedImageUrl)
                      ).length ?? 0;
                      const allowSharedBackgroundRender =
                        !isSharedSetViewer ||
                        missingSharedPreviewCount <= SET_CARD_IMAGE_UPLOAD_CONCURRENCY;
                      const canPersistRemoteImage = Boolean(
                        accountUser &&
                        (
                          remoteImageOwnerUserId === accountUser.id ||
                          snapshot.remoteCardId
                        ),
                      );

                      queueSavedSetCardImageRender(setId, snapshot, accountUser, {
                        remoteThumbnailsReady: !accountUser || accountSetsHydrated,
                        remoteCardId: snapshot.remoteCardId,
                        remoteImageOwnerUserId,
                        canPersistRemoteImage,
                        allowBackgroundRender: allowSharedBackgroundRender,
                      });
                    }}
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
                  getSafeSetCardPreviewCard={getSafeSetCardPreviewCard}
                  normalizePickedImage={normalizePickedImage}
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
            selectedSetId={activeSetCardSetId ?? selectedSetId}
            onSaveToSet={saveCardToSetThenRandomize}
            onDiscard={performRandomizeCard}
            onClose={() => setRandomizeSavePromptOpen(false)}
          />
          <SaveDestinationSetModal
            visible={saveDestinationPromptOpen}
            cardName={faceCard.name || "Untitled Card"}
            sets={cardSets}
            selectedSetId={activeSetCardSetId ?? selectedSetId}
            onSaveToSet={(setId) => saveCurrentCardToSet(setId, { notify: true })}
            onCreateSetAndSave={(name) => saveCurrentCardToNewSet(name, { notify: true })}
            onClose={() => setSaveDestinationPromptOpen(false)}
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

        {creatorToolsVisible ? (
          <>
            <AchievementCompletionPopups
              popups={achievementPopups}
              onDismiss={dismissAchievementPopup}
              onOpenAchievements={openAchievements}
            />
            <LevelUpToasts
              toasts={levelUpToasts}
              onDismiss={dismissLevelUpToast}
            />
          </>
        ) : null}

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
          onGenerateSetSymbol={creatorToolsVisible ? () => openSetSymbolGenerator(selectedSet?.id) : undefined}
          onAddCardBack={
            canAddPhysicalCardBackFace ? () => addFlipSideToCard({ initialFace: "back" }) : undefined
          }
          onGenerateCardBack={creatorToolsVisible ? openCardBackGenerator : undefined}
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
          rulesTextAiFixer={creatorToolsVisible ? {
            busy: rulesTextFixerBusy,
            error: rulesTextFixerError,
            suggestion: rulesTextFixerSuggestion,
            onFixRulesText: fixRulesTextWithAi,
            onApplySuggestion: applyRulesTextFixerSuggestion,
            onDismissSuggestion: dismissRulesTextFixerSuggestion,
          } : undefined}
        />
        <ArtSourceModal
          getArtLibraryColorLabel={getArtLibraryColorLabel}
          sortArtLibraryEntries={sortArtLibraryEntries}
          visible={artSourceOpen}
          hasArt={Boolean(faceCard.artUri)}
          artLibraryEntries={artLibraryEntries}
          onPickPhoto={pickArt}
          onGenerateArt={creatorToolsVisible ? openArtGenerator : undefined}
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
          onGenerateArt={creatorToolsVisible ? () => {
            setArtAdjustOpen(false);
            setArtAdjustmentInitialMode("crop");
            openArtGenerator();
          } : undefined}
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
        <CollaborationInviteModal
          visible={Boolean(
            pendingCollaborationInviteCode ||
            pendingCollaborationInvitePreview ||
            collaborationInvitePreviewLoading ||
            collaborationInviteError,
          )}
          preview={pendingCollaborationInvitePreview}
          signedIn={Boolean(accountUser)}
          loading={collaborationInvitePreviewLoading}
          accepting={collaborationInviteAccepting}
          error={collaborationInviteError}
          onAccept={() => void acceptCollaborationInvite()}
          onSignIn={openAccount}
          onClose={dismissCollaborationInvitePrompt}
        />
        <AccountModal
          visible={accountOpen}
          user={accountUser}
          passwordRecoveryMode={accountPasswordRecoveryMode}
          onClose={closeAccountModal}
          onAuthSuccess={showLoginSuccessToast}
          onPasswordRecoveryComplete={() => setAccountPasswordRecoveryMode(false)}
          onProfileChange={setAccountProfile}
          notifications={communityNotifications}
          notificationsLoading={communityNotificationsLoading}
          notificationsError={communityNotificationsError}
          onRefreshNotifications={() => void loadAccountNotifications()}
          onMarkNotificationsRead={(notificationIds) => void markAccountNotificationsRead(notificationIds)}
          showCreatorTools={creatorToolsVisible}
          onChangeShowCreatorTools={setCreatorToolsVisible}
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
        <VersionRefreshPromptModal
          deployment={refreshPromptDeployment}
          currentVersion={CARDMAGIC_APP_VERSION}
          releaseBranch={CARDMAGIC_RELEASE_BRANCH}
          onRefresh={refreshToLatestRelease}
          onDismiss={dismissRefreshPrompt}
        />
      </GestureHandlerRootView>
    </HybridSymbolStyleProvider>
  );
}

function CollaborationInviteModal({
  visible,
  preview,
  signedIn,
  loading,
  accepting,
  error,
  onAccept,
  onSignIn,
  onClose,
}: {
  visible: boolean;
  preview: CollaborationSetInvitePreviewPayload | null;
  signedIn: boolean;
  loading: boolean;
  accepting: boolean;
  error: string | null;
  onAccept: () => void;
  onSignIn: () => void;
  onClose: () => void;
}) {
  if (!visible) {
    return null;
  }

  const inviteRoleLabel = preview?.role === "viewer" ? "viewer" : "editor";
  const inviteActionLabel = preview?.role === "viewer" ? "Follow set" : "Accept invite";
  const inviteActionBusyLabel = preview?.role === "viewer" ? "Following" : "Joining";
  const title = preview
    ? preview.role === "viewer"
      ? `View ${preview.setName}?`
      : `Join ${preview.setName}?`
    : "Set invite";
  const body = preview
    ? preview.role === "viewer"
      ? `${preview.ownerName} shared this set with you as a viewer. Viewer access follows the set for community updates.`
      : `${preview.ownerName} invited you to collaborate as an editor.`
    : error
      ? "CardMagic could not load this set invite."
      : "Loading this set invite.";

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={accepting ? undefined : onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(9, 12, 18, 0.52)",
          alignItems: "center",
          justifyContent: "center",
          padding: 18,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 430,
            borderRadius: 14,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: "#d8dbe2",
            backgroundColor: "#ffffff",
            padding: 16,
            gap: 12,
            shadowColor: "#000000",
            shadowOpacity: 0.18,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#e9fbfd",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserPlus size={18} color="#0b7180" strokeWidth={2.6} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text selectable={false} numberOfLines={2} style={{ color: "#151820", fontSize: 18, lineHeight: 22, fontWeight: "900" }}>
                {title}
              </Text>
              <Text selectable={false} numberOfLines={2} style={{ color: "#68707d", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
                Collaboration invite
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss set invite"
              disabled={accepting}
              onPress={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: "#fff2f2",
                alignItems: "center",
                justifyContent: "center",
                opacity: accepting ? 0.5 : 1,
              }}
            >
              <X size={18} color="#c52233" strokeWidth={2.7} />
            </Pressable>
          </View>

          <Text selectable style={{ color: "#3d4653", fontSize: 13, lineHeight: 19, fontWeight: "800" }}>
            {body}
          </Text>

          {loading ? (
            <View style={{ minHeight: 38, flexDirection: "row", alignItems: "center", gap: 9 }}>
              <ActivityIndicator color="#0b7180" size="small" />
              <Text selectable={false} style={{ color: "#68707d", fontSize: 12, fontWeight: "800" }}>
                Checking invite link
              </Text>
            </View>
          ) : error ? (
            <Text selectable style={{ color: "#a62231", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
              {error}
            </Text>
          ) : preview ? (
            <View
              style={{
                borderRadius: 10,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: "#d8dbe2",
                backgroundColor: "#f8fafc",
                padding: 10,
                gap: 5,
              }}
            >
              <Text selectable={false} style={{ color: "#151820", fontSize: 13, fontWeight: "900" }}>
                {preview.setName}
              </Text>
              <Text selectable={false} style={{ color: "#68707d", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
                Owner: {preview.ownerName}
              </Text>
              <Text selectable={false} style={{ color: "#68707d", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
                Access: {inviteRoleLabel}
              </Text>
            </View>
          ) : null}

          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel set invite"
              disabled={accepting}
              onPress={onClose}
              style={{
                minHeight: 40,
                borderRadius: 8,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: "#d8dbe2",
                backgroundColor: "#ffffff",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 14,
                opacity: accepting ? 0.5 : 1,
              }}
            >
              <Text selectable={false} style={{ color: "#151820", fontSize: 13, fontWeight: "900" }}>
                Cancel
              </Text>
            </Pressable>
            {signedIn ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Accept set invite"
                disabled={loading || accepting || !preview}
                onPress={onAccept}
                style={{
                  minHeight: 40,
                  borderRadius: 8,
                  borderCurve: "continuous",
                  backgroundColor: loading || accepting || !preview ? "#9aa1ad" : "#151820",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8,
                  paddingHorizontal: 14,
                }}
              >
                {accepting ? <ActivityIndicator color="#ffffff" size="small" /> : <Check size={16} color="#ffffff" strokeWidth={2.6} />}
                <Text selectable={false} style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>
                  {accepting ? inviteActionBusyLabel : inviteActionLabel}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign in to accept set invite"
                disabled={loading || !preview}
                onPress={onSignIn}
                style={{
                  minHeight: 40,
                  borderRadius: 8,
                  borderCurve: "continuous",
                  backgroundColor: loading || !preview ? "#9aa1ad" : "#151820",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 14,
                }}
              >
                <Text selectable={false} style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>
                  Sign in / create account
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function VersionRefreshPromptModal({
  deployment,
  currentVersion,
  releaseBranch,
  onRefresh,
  onDismiss,
}: {
  deployment: CardMagicReleaseDeployment | null;
  currentVersion: string;
  releaseBranch: CardMagicReleaseBranch;
  onRefresh: (deployment: CardMagicReleaseDeployment) => void;
  onDismiss: () => void;
}) {
  if (!deployment) {
    return null;
  }

  const branchLabel = releaseBranch === "main" ? "production" : "beta";

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onDismiss}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(9, 12, 18, 0.52)",
          alignItems: "center",
          justifyContent: "center",
          padding: 18,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 430,
            borderRadius: 14,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: "#d8dbe2",
            backgroundColor: "#ffffff",
            padding: 16,
            gap: 12,
            shadowColor: "#000000",
            shadowOpacity: 0.18,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#e9fbfd",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <RefreshCw size={18} color="#0b7180" strokeWidth={2.6} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text selectable={false} numberOfLines={2} style={{ color: "#151820", fontSize: 18, lineHeight: 22, fontWeight: "900" }}>
                Update available
              </Text>
              <Text selectable={false} numberOfLines={2} style={{ color: "#68707d", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
                New {branchLabel} build
              </Text>
            </View>
          </View>

          <Text selectable style={{ color: "#3d4653", fontSize: 13, lineHeight: 19, fontWeight: "800" }}>
            You are running v{currentVersion}. The current {branchLabel} build is v{deployment.version}. Refresh to load the latest CardMagic bundle.
          </Text>

          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss update prompt"
              onPress={onDismiss}
              style={{
                minHeight: 40,
                borderRadius: 8,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: "#d8dbe2",
                backgroundColor: "#ffffff",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 14,
              }}
            >
              <Text selectable={false} style={{ color: "#151820", fontSize: 13, fontWeight: "900" }}>
                Later
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Refresh to latest CardMagic version"
              onPress={() => onRefresh(deployment)}
              style={{
                minHeight: 40,
                borderRadius: 8,
                borderCurve: "continuous",
                backgroundColor: "#151820",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                paddingHorizontal: 14,
              }}
            >
              <RefreshCw size={16} color="#ffffff" strokeWidth={2.6} />
              <Text selectable={false} style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>
                Refresh now
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
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
  onGenerateSubjectMask: (
    targetPrompt?: string,
    boxPrompt?: SubjectMaskBoxPrompt,
    pointPrompts?: SubjectMaskPointPrompt[],
    brushSamples?: SubjectMaskSelectionSample[],
    brushRadius?: number,
  ) => void;
  subjectMaskBusy: boolean;
  subjectMaskStatus: string | null;
  subjectMaskError: string | null;
  subjectMaskComponents: SubjectMaskComponent[];
  subjectMaskToggleBusy: boolean;
  onToggleSubjectMaskComponent: (concept: string) => void;
  onAddSubjectMask: (concept: string) => void;
  onPickPhoto: () => void;
  onGenerateArt?: () => void;
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
  const hasSubjectMaskPreview = Boolean(maskPreviewUri);
  const [maskTargetPrompt, setMaskTargetPrompt] = useState("");
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [roughSelectionActive, setRoughSelectionActive] = useState(false);
  const [roughSelectionBrushSamples, setRoughSelectionBrushSamples] = useState<RoughSelectionBrushSample[]>([]);
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
  const maskPreviewUriRef = useRef(maskPreviewUri);
  const coordinateScaleRef = useRef(coordinateScale);
  const imageAspectRatioRef = useRef(imageAspectRatio);
  const maskEditLayoutRef = useRef<MaskEditDisplayLayout | null>(null);
  const roughSelectionBrushSamplesRef = useRef(roughSelectionBrushSamples);
  const roughSelectionStrokeIdRef = useRef(0);
  const roughSelectionBrushRadius = Math.max(34, cropWidth * 0.12);
  const showDesktopMaskZoomRail = Platform.OS === "web" && width >= 820 && adjustMode === "mask";
  const modalContentWidth = cropWidth + (showDesktopMaskZoomRail ? 72 : 0);
  const desktopMaskZoomMax = 2;
  const subjectMaskSectionRects = getSubjectMaskSectionRectsForCard(card);
  const activeSubjectMaskSections = resolveSubjectMaskSections(faceCard.artSubjectMaskSections);
  const activeSubjectMaskSectionSet = new Set(activeSubjectMaskSections);
  const subjectMaskFitMode = faceCard.artSubjectMaskFitMode ?? DEFAULT_SUBJECT_MASK_FIT_MODE;
  const sectionGuideRenderOrder: SubjectMaskSection[] = ["frame", "title", "typeLine", "text"];
  const sectionControlRenderOrder: SubjectMaskSection[] = ["title", "typeLine", "text", "frame"];
  const orderedSubjectMaskSectionRects = sectionGuideRenderOrder.flatMap((sectionId) =>
    subjectMaskSectionRects.filter((section) => section.id === sectionId),
  );
  const orderedSubjectMaskSectionControls = sectionControlRenderOrder.flatMap((sectionId) =>
    subjectMaskSectionRects.filter((section) => section.id === sectionId),
  );
  const orderedSubjectMaskSectionGuideRects = orderedSubjectMaskSectionRects.flatMap((section) =>
    section.guideRects.map((rect, rectIndex) => ({ section, rect, rectIndex })),
  );
  const subjectMaskGuideRects = [artRect, ...subjectMaskSectionRects.flatMap((section) => section.guideRects)];
  const subjectMaskGuideTop = Math.min(...subjectMaskGuideRects.map((rect) => rect.y));
  const subjectMaskGuideBottom = Math.max(...subjectMaskGuideRects.map((rect) => rect.y + rect.height));
  const maskGuideTopOverflow = Math.max(0, (artRect.y - subjectMaskGuideTop) * coordinateScale);
  const maskGuideBottomOverflow = Math.max(0, (subjectMaskGuideBottom - (artRect.y + artRect.height)) * coordinateScale);

  const getMaskGuideDisplayRect = (rect: { x: number; y: number; width: number; height: number }) => ({
    left: (rect.x - artRect.x) * coordinateScale,
    top: (rect.y - artRect.y) * coordinateScale,
    width: rect.width * coordinateScale,
    height: rect.height * coordinateScale,
  });

  const toggleSubjectMaskSection = (sectionId: SubjectMaskSection) => {
    const current = resolveSubjectMaskSections(faceCard.artSubjectMaskSections);
    const next = current.includes(sectionId)
      ? current.filter((currentSection) => currentSection !== sectionId)
      : [...current, sectionId];

    onChange(toDfcFacePatch(card, {
      artSubjectMaskSections: next,
    }));
  };

  const setSubjectMaskFitMode = (fitMode: "expanded" | "artOpening") => {
    onChange(toDfcFacePatch(card, {
      artSubjectMaskFitMode: fitMode,
    }));
  };

  const updateMaskZoomScale = (nextScale: number) => {
    const normalizedTransform = normalizeArtTransformForVisibleRect(
      {
        ...artTransformRef.current,
        scale: nextScale,
      },
      artRectRef.current,
      imageAspectRatioRef.current,
    );

    artTransformRef.current = normalizedTransform;
    onChange(toDfcFacePatch(cardRef.current, {
      artSubjectMaskFitMode: "artOpening",
      artTransform: normalizedTransform,
    }));
  };

  useEffect(() => {
    let cancelled = false;
    setImageAspectRatio(null);
    setImageSize(null);

    if (!artUri) {
      return;
    }

    Image.getSize(
      artUri,
      (imageWidth, imageHeight) => {
        if (!cancelled && imageWidth > 0 && imageHeight > 0) {
          setImageAspectRatio(imageWidth / imageHeight);
          setImageSize({ width: imageWidth, height: imageHeight });
        }
      },
      () => {
        if (!cancelled) {
          setImageAspectRatio(null);
          setImageSize(null);
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
    maskPreviewUriRef.current = maskPreviewUri;
    coordinateScaleRef.current = coordinateScale;
    imageAspectRatioRef.current = imageAspectRatio;
    roughSelectionBrushSamplesRef.current = roughSelectionBrushSamples;
    maskEditLayoutRef.current = {
      cropWidth,
      cropHeight,
      imageLeft: fittedImageLayout.left,
      imageTop: fittedImageLayout.top,
      imageWidth: fittedImageLayout.width,
      imageHeight: fittedImageLayout.height,
      offsetX: artTransform.offsetX,
      offsetY: artTransform.offsetY,
      scale: artTransform.scale,
      coordinateScale,
    };
  }, [artTransform, artRect, card, artUri, maskPreviewUri, coordinateScale, imageAspectRatio, roughSelectionBrushSamples, cropWidth, cropHeight, fittedImageLayout]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    panStartTransform.current = artTransform;
    pinchStartTransform.current = artTransform;
    setMaskPreviewUri(faceCard.artSubjectMaskUri ?? null);
    setAdjustMode(initialMode);
    setRoughSelectionActive(false);
    roughSelectionBrushSamplesRef.current = [];
    setRoughSelectionBrushSamples([]);
  }, [artUri, initialMode, visible]);

  useEffect(() => {
    if (visible) {
      setMaskPreviewUri(faceCard.artSubjectMaskUri ?? null);
    }
  }, [faceCard.artSubjectMaskUri, visible]);

  useEffect(() => {
    if (visible && showDesktopMaskZoomRail && subjectMaskFitMode !== "artOpening") {
      setSubjectMaskFitMode("artOpening");
    }
    if (visible && showDesktopMaskZoomRail && artTransform.scale > desktopMaskZoomMax) {
      updateMaskZoomScale(desktopMaskZoomMax);
    }
  }, [artTransform.scale, desktopMaskZoomMax, showDesktopMaskZoomRail, subjectMaskFitMode, visible]);

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

  const addRoughSelectionBrushSample = useCallback((event: GestureResponderEvent) => {
    const strokeId = roughSelectionStrokeIdRef.current;
    const nextSample = {
      x: clamp(event.nativeEvent.locationX, 0, cropWidth),
      y: clamp(event.nativeEvent.locationY, 0, cropHeight),
      strokeId,
    };

    setRoughSelectionBrushSamples((current) => {
      const lastSample = current[current.length - 1];

      if (lastSample && lastSample.strokeId === strokeId && Math.hypot(lastSample.x - nextSample.x, lastSample.y - nextSample.y) < 4) {
        return current;
      }

      const next = [...current, nextSample].slice(-480);
      roughSelectionBrushSamplesRef.current = next;
      return next;
    });
  }, [cropHeight, cropWidth]);

  const beginRoughSelectionStroke = useCallback((event: GestureResponderEvent) => {
    roughSelectionStrokeIdRef.current += 1;
    addRoughSelectionBrushSample(event);
  }, [addRoughSelectionBrushSample]);

  const undoLastRoughSelectionStroke = useCallback(() => {
    if (subjectMaskBusy) {
      return;
    }

    setRoughSelectionBrushSamples((current) => {
      const lastSample = current[current.length - 1];

      if (!lastSample) {
        return current;
      }

      const next = current.filter((sample) => sample.strokeId !== lastSample.strokeId);
      roughSelectionBrushSamplesRef.current = next;
      return next;
    });
  }, [subjectMaskBusy]);

  const getRoughSelectionSourcePoints = useCallback(() => {
    const layout = maskEditLayoutRef.current;

    if (!layout || !imageSize || roughSelectionBrushSamplesRef.current.length === 0) {
      return [];
    }

    return roughSelectionBrushSamplesRef.current.flatMap((sample) => {
      const sourcePoint = getMaskEditSourcePoint(sample, layout, imageSize.width, imageSize.height);
      return sourcePoint ? [sourcePoint] : [];
    });
  }, [imageSize]);

  const getRoughSelectionSourceBrushRadius = useCallback(() => {
    const layout = maskEditLayoutRef.current;

    if (!layout || !imageSize) {
      return undefined;
    }

    const sourceBrushDiameterX = (roughSelectionBrushRadius / Math.max(1, layout.scale) / Math.max(1, layout.imageWidth)) * imageSize.width;
    const sourceBrushDiameterY = (roughSelectionBrushRadius / Math.max(1, layout.scale) / Math.max(1, layout.imageHeight)) * imageSize.height;

    return Math.max(sourceBrushDiameterX, sourceBrushDiameterY) / 2;
  }, [imageSize, roughSelectionBrushRadius]);

  const getRoughSelectionSourceBrushSamples = useCallback((): SubjectMaskSelectionSample[] => {
    const layout = maskEditLayoutRef.current;

    if (!layout || !imageSize || roughSelectionBrushSamplesRef.current.length === 0) {
      return [];
    }

    return roughSelectionBrushSamplesRef.current.flatMap((sample) => {
      const sourcePoint = getMaskEditSourcePoint(sample, layout, imageSize.width, imageSize.height);
      return sourcePoint ? [{ ...sourcePoint, strokeId: sample.strokeId }] : [];
    });
  }, [imageSize]);

  const getRoughSelectionBoxPrompt = useCallback((): SubjectMaskBoxPrompt | undefined => {
    if (!imageSize) {
      return undefined;
    }

    const sourcePoints = getRoughSelectionSourcePoints();

    if (sourcePoints.length === 0) {
      return undefined;
    }

    const layout = maskEditLayoutRef.current;

    if (!layout) {
      return undefined;
    }

    const sourceBrushRadiusX = (roughSelectionBrushRadius / Math.max(1, layout.scale) / Math.max(1, layout.imageWidth)) * imageSize.width;
    const sourceBrushRadiusY = (roughSelectionBrushRadius / Math.max(1, layout.scale) / Math.max(1, layout.imageHeight)) * imageSize.height;
    const xValues = sourcePoints.map((point) => point.x);
    const yValues = sourcePoints.map((point) => point.y);

    return {
      x_min: Math.max(0, Math.round(Math.min(...xValues) - sourceBrushRadiusX / 2)),
      y_min: Math.max(0, Math.round(Math.min(...yValues) - sourceBrushRadiusY / 2)),
      x_max: Math.min(imageSize.width, Math.round(Math.max(...xValues) + sourceBrushRadiusX / 2)),
      y_max: Math.min(imageSize.height, Math.round(Math.max(...yValues) + sourceBrushRadiusY / 2)),
    };
  }, [getRoughSelectionSourcePoints, imageSize, roughSelectionBrushRadius]);

  const getRoughSelectionPointPrompts = useCallback((boxPrompt?: SubjectMaskBoxPrompt): SubjectMaskPointPrompt[] => {
    const layout = maskEditLayoutRef.current;

    if (!layout || !imageSize || roughSelectionBrushSamplesRef.current.length === 0) {
      return [];
    }

    const strokes = groupRoughSelectionBrushSamples(roughSelectionBrushSamplesRef.current);

    const prompts: SubjectMaskPointPrompt[] = [];
    const maxForegroundPrompts = 16;
    const maxPointsPerStroke = Math.max(1, Math.floor(maxForegroundPrompts / Math.max(1, strokes.length)));

    strokes.forEach(([, samples]) => {
      const sampleCount = Math.min(maxPointsPerStroke, samples.length);

      for (let index = 0; index < sampleCount; index += 1) {
        const sampleIndex = sampleCount === 1
          ? Math.floor(samples.length / 2)
          : Math.round((index / (sampleCount - 1)) * (samples.length - 1));
        const sourcePoint = getMaskEditSourcePoint(samples[sampleIndex], layout, imageSize.width, imageSize.height);

        if (sourcePoint) {
          prompts.push({
            x: sourcePoint.x,
            y: sourcePoint.y,
            label: 1,
            object_id: 1,
          });
        }
      }
    });

    if (boxPrompt) {
      const boxWidth = boxPrompt.x_max - boxPrompt.x_min;
      const boxHeight = boxPrompt.y_max - boxPrompt.y_min;
      const insetX = Math.max(8, boxWidth * 0.18);
      const insetY = Math.max(8, boxHeight * 0.18);
      const backgroundCandidates = [
        { x: boxPrompt.x_min - insetX, y: boxPrompt.y_min + boxHeight / 2 },
        { x: boxPrompt.x_max + insetX, y: boxPrompt.y_min + boxHeight / 2 },
        { x: boxPrompt.x_min + boxWidth / 2, y: boxPrompt.y_min - insetY },
        { x: boxPrompt.x_min + boxWidth / 2, y: boxPrompt.y_max + insetY },
      ];

      for (const point of backgroundCandidates) {
        if (point.x >= boxPrompt.x_min && point.x <= boxPrompt.x_max && point.y >= boxPrompt.y_min && point.y <= boxPrompt.y_max) {
          continue;
        }

        const x = Math.round(clamp(point.x, 0, imageSize.width));
        const y = Math.round(clamp(point.y, 0, imageSize.height));

        if (x < boxPrompt.x_min || x > boxPrompt.x_max || y < boxPrompt.y_min || y > boxPrompt.y_max) {
          prompts.push({ x, y, label: 0, object_id: 1 });
        }
      }
    }

    return prompts.slice(0, 24);
  }, [imageSize]);

  const submitRoughSelection = useCallback(() => {
    const boxPrompt = getRoughSelectionBoxPrompt();
    const pointPrompts = getRoughSelectionPointPrompts(boxPrompt);
    const brushSamples = getRoughSelectionSourceBrushSamples();
    const brushRadius = getRoughSelectionSourceBrushRadius();

    if (subjectMaskBusy || pointPrompts.length === 0) {
      return;
    }

    setRoughSelectionActive(false);
    roughSelectionBrushSamplesRef.current = [];
    setRoughSelectionBrushSamples([]);
    onGenerateSubjectMask(maskTargetPrompt, boxPrompt, pointPrompts, brushSamples, brushRadius);
  }, [
    getRoughSelectionBoxPrompt,
    getRoughSelectionPointPrompts,
    getRoughSelectionSourceBrushRadius,
    getRoughSelectionSourceBrushSamples,
    maskTargetPrompt,
    onGenerateSubjectMask,
    subjectMaskBusy,
  ]);

  const roughSelectionBrushStrokes = useMemo(
    () => groupRoughSelectionBrushSamples(roughSelectionBrushSamples),
    [roughSelectionBrushSamples],
  );
  const brushSelectionCapturesTouch = adjustMode === "mask" && roughSelectionActive && !subjectMaskBusy;
  const maskArtDragEnabled = adjustMode === "mask" && !roughSelectionActive;

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
            scrollEnabled={!brushSelectionCapturesTouch}
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
            <View style={{ width: modalContentWidth, maxWidth: width - 48, gap: 12, alignItems: "center" }}>
            <View
              style={{
                width: modalContentWidth,
                maxWidth: width - 48,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: showDesktopMaskZoomRail ? 14 : 0,
              }}
            >
            <View
              style={{
                width: cropWidth,
                height: cropHeight,
                marginTop: adjustMode === "mask" ? maskGuideTopOverflow : 0,
                marginBottom: adjustMode === "mask" ? maskGuideBottomOverflow : 0,
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
              {adjustMode === "mask" && maskOverlayVisible && maskPreviewUri ? (
                <>
                  {orderedSubjectMaskSectionGuideRects
                    .filter(({ section }) => activeSubjectMaskSectionSet.has(section.id))
                    .map(({ section, rect, rectIndex }) => {
                      const displayRect = getMaskGuideDisplayRect(rect);
                      const displayRadius = Math.max(2, (rect.radius ?? 4) * coordinateScale);

                      return (
                        <View
                          key={`mask-preview-section-${section.id}-${rectIndex}`}
                          pointerEvents="none"
                          style={{
                            position: "absolute",
                            ...displayRect,
                            overflow: "hidden",
                            borderRadius: displayRadius,
                            borderCurve: "continuous",
                          }}
                        >
                          <View
                            style={{
                              ...transformedImageLayerStyle,
                              left: fittedImageLayout.left - displayRect.left,
                              top: fittedImageLayout.top - displayRect.top,
                              opacity: 0.5,
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
                        </View>
                      );
                    })}
                </>
              ) : null}
              {adjustMode === "mask" ? (
                <View
                  pointerEvents={roughSelectionActive ? "none" : "box-none"}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: cropWidth,
                    height: cropHeight,
                    zIndex: 5,
                  }}
                >
                  {orderedSubjectMaskSectionRects.map((section) => {
                    const active = activeSubjectMaskSectionSet.has(section.id);
                    const displayRect = getMaskGuideDisplayRect(section.rect);

                    if (displayRect.width < 28 || displayRect.height < 18) {
                      return null;
                    }

                    return (
                      <Text
                        key={`mask-section-label-${section.id}`}
                        pointerEvents="none"
                        selectable={false}
                        numberOfLines={1}
                        style={{
                          position: "absolute",
                          left: displayRect.left + 5,
                          top: displayRect.top + 3,
                          maxWidth: Math.max(24, displayRect.width - 10),
                          zIndex: 6,
                          color: active ? "#b7f6ff" : "rgba(255, 255, 255, 0.72)",
                          fontSize: 10,
                          fontWeight: "900",
                          textTransform: "uppercase",
                        }}
                      >
                        {section.label}
                      </Text>
                    );
                  })}
                  {orderedSubjectMaskSectionGuideRects.map(({ section, rect, rectIndex }) => {
                    const active = activeSubjectMaskSectionSet.has(section.id);
                    const displayRect = getMaskGuideDisplayRect(rect);
                    const displayRadius = Math.max(2, (rect.radius ?? 4) * coordinateScale);

                    return (
                      <Pressable
                        key={`mask-section-${section.id}-${rectIndex}`}
                        accessibilityRole="button"
                        accessibilityLabel={`${active ? "Disable" : "Enable"} ${section.label} mask area`}
                        accessibilityState={{ selected: active }}
                        hitSlop={6}
                        onPress={() => toggleSubjectMaskSection(section.id)}
                        style={({ pressed }) => ({
                          position: "absolute",
                          ...displayRect,
                          borderRadius: displayRadius,
                          borderCurve: "continuous",
                          borderWidth: active ? 2 : 1.25,
                          borderStyle: section.id === "frame" ? "dashed" : "solid",
                          borderColor: active ? "rgba(85, 223, 245, 0.96)" : "rgba(255, 255, 255, 0.52)",
                          backgroundColor: active
                            ? pressed
                              ? "rgba(85, 223, 245, 0.18)"
                              : "rgba(85, 223, 245, 0.08)"
                            : pressed
                              ? "rgba(255, 255, 255, 0.12)"
                              : "rgba(12, 14, 18, 0.08)",
                        })}
                      />
                    );
                  })}
                </View>
              ) : null}
              {adjustMode === "crop" || maskArtDragEnabled ? (
                <GestureDetector gesture={artGesture}>
                  <View
                    collapsable={false}
                    style={{
                      width: cropWidth,
                      height: cropHeight,
                      borderRadius: ART_ADJUSTMENT_CROP_RADIUS,
                      borderCurve: "continuous",
                      borderWidth: 2,
                      borderColor:
                        adjustMode === "crop"
                          ? "#ffffff"
                          : maskOverlayVisible
                            ? "#55dff5"
                            : "rgba(255, 255, 255, 0.72)",
                      backgroundColor:
                        adjustMode === "mask" && maskOverlayVisible
                          ? "rgba(85, 223, 245, 0.08)"
                          : "transparent",
                      boxShadow: "0 18px 42px rgba(0, 0, 0, 0.36)",
                    }}
                  />
                </GestureDetector>
              ) : (
                <View
                  collapsable={false}
                  style={{
                    width: cropWidth,
                    height: cropHeight,
                    borderRadius: ART_ADJUSTMENT_CROP_RADIUS,
                    borderCurve: "continuous",
                    borderWidth: 2,
                    borderColor: maskOverlayVisible ? "#55dff5" : "rgba(255, 255, 255, 0.72)",
                    backgroundColor: maskOverlayVisible ? "rgba(85, 223, 245, 0.08)" : "transparent",
                    boxShadow: "0 18px 42px rgba(0, 0, 0, 0.36)",
                  }}
                />
              )}
              {adjustMode === "mask" ? (
                <View
                  onStartShouldSetResponder={() => brushSelectionCapturesTouch}
                  onMoveShouldSetResponder={() => brushSelectionCapturesTouch}
                  onResponderTerminationRequest={() => false}
                  onResponderGrant={(event) => {
                    beginRoughSelectionStroke(event);
                  }}
                  onResponderMove={(event) => {
                    addRoughSelectionBrushSample(event);
                  }}
                  pointerEvents={brushSelectionCapturesTouch ? "auto" : "none"}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: cropWidth,
                    height: cropHeight,
                    zIndex: 6,
                    borderRadius: ART_ADJUSTMENT_CROP_RADIUS,
                    borderCurve: "continuous",
                    overflow: "hidden",
                  }}
                >
                  {roughSelectionActive ? (
                    <View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: ART_ADJUSTMENT_CROP_RADIUS,
                        borderCurve: "continuous",
                        borderWidth: 1.5,
                        borderStyle: "dashed",
                        borderColor: "rgba(85, 223, 245, 0.84)",
                        backgroundColor: "rgba(85, 223, 245, 0.035)",
                      }}
                    />
                  ) : null}
                  {roughSelectionBrushSamples.length > 0 ? (
                    <Svg
                      pointerEvents="none"
                      width={cropWidth}
                      height={cropHeight}
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                      }}
                    >
                      {roughSelectionBrushStrokes.map(([strokeId, samples]) => {
                        const path = createRoughSelectionBrushPath(samples);

                        if (!path) {
                          return null;
                        }

                        return (
                          <Path
                            key={`selection-brush-${strokeId}`}
                            d={path}
                            fill="none"
                            stroke="rgba(85, 223, 245, 0.44)"
                            strokeWidth={roughSelectionBrushRadius}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        );
                      })}
                      {roughSelectionBrushStrokes.map(([strokeId, samples]) => {
                        const path = createRoughSelectionBrushPath(samples);

                        if (!path) {
                          return null;
                        }

                        return (
                          <Path
                            key={`selection-brush-edge-${strokeId}`}
                            d={path}
                            fill="none"
                            stroke="rgba(183, 246, 255, 0.86)"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        );
                      })}
                    </Svg>
                  ) : null}
                </View>
              ) : null}
            </View>
            {showDesktopMaskZoomRail ? (
              <DesktopMaskZoomSlider
                value={artTransform.scale}
                min={1}
                max={desktopMaskZoomMax}
                height={Math.max(180, cropHeight)}
                disabled={subjectMaskBusy}
                onChange={updateMaskZoomScale}
              />
            ) : null}
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
              <View
                style={{
                  width: cropWidth,
                  minHeight: 48,
                  borderRadius: 14,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.24)",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={subjectMaskBusy ? "Cropping mask" : "Crop mask"}
                    accessibilityState={{ busy: subjectMaskBusy }}
                    disabled={subjectMaskBusy}
                    onPress={() => {
                      if (roughSelectionBrushSamplesRef.current.length > 0) {
                        submitRoughSelection();
                      } else {
                        onGenerateSubjectMask(maskTargetPrompt);
                      }
                    }}
                    style={({ pressed }) => ({
                      flex: 1,
                      minWidth: 132,
                      minHeight: 36,
                      borderRadius: 999,
                      borderCurve: "continuous",
                      borderWidth: 1,
                      borderColor: subjectMaskBusy ? "rgba(85, 223, 245, 0.78)" : "rgba(85, 223, 245, 0.84)",
                      backgroundColor: subjectMaskBusy
                        ? "rgba(85, 223, 245, 0.2)"
                        : pressed
                          ? "rgba(85, 223, 245, 0.3)"
                          : "rgba(85, 223, 245, 0.22)",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 7,
                      paddingHorizontal: 12,
                      opacity: subjectMaskBusy ? 0.76 : 1,
                    })}
                  >
                    {subjectMaskBusy ? (
                      <ActivityIndicator color="#b7f6ff" />
                    ) : (
                      <Layers size={16} color="#b7f6ff" strokeWidth={2.7} />
                    )}
                    <Text selectable={false} style={{ color: "#e6f7fb", fontSize: 12, fontWeight: "900" }}>
                      {subjectMaskBusy ? "Cropping" : "Crop"}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={hasSubjectMaskPreview ? "Done editing mask" : "Cancel mask editing"}
                    disabled={subjectMaskBusy}
                    onPress={onClose}
                    style={({ pressed }) => ({
                      minHeight: 36,
                      borderRadius: 999,
                      borderCurve: "continuous",
                      borderWidth: 1,
                      borderColor: hasSubjectMaskPreview ? "rgba(255, 255, 255, 0.92)" : "rgba(255, 255, 255, 0.24)",
                      backgroundColor: hasSubjectMaskPreview
                        ? pressed
                          ? "rgba(255, 255, 255, 0.82)"
                          : "#ffffff"
                        : pressed
                          ? "rgba(255, 255, 255, 0.16)"
                          : "rgba(255, 255, 255, 0.06)",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 12,
                      opacity: subjectMaskBusy ? 0.48 : 1,
                    })}
                  >
                    <Text
                      selectable={false}
                      style={{
                        color: hasSubjectMaskPreview ? "#151820" : "rgba(255, 255, 255, 0.76)",
                        fontSize: 12,
                        fontWeight: "900",
                      }}
                    >
                      {hasSubjectMaskPreview ? "Done" : "Cancel"}
                    </Text>
                  </Pressable>
                </View>
                <View style={{ gap: 6 }}>
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
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: roughSelectionActive, disabled: subjectMaskBusy }}
                      accessibilityLabel={roughSelectionActive ? "Stop painting subject selection" : "Start painting subject selection"}
                      disabled={subjectMaskBusy}
                      onPress={() => setRoughSelectionActive((current) => !current)}
                      style={({ pressed }) => ({
                        minHeight: 36,
                        borderRadius: 999,
                        borderCurve: "continuous",
                        borderWidth: 1,
                        borderColor: roughSelectionActive ? "rgba(85, 223, 245, 0.84)" : "rgba(255, 255, 255, 0.28)",
                        backgroundColor: roughSelectionActive
                          ? "rgba(85, 223, 245, 0.22)"
                          : pressed
                            ? "rgba(255, 255, 255, 0.16)"
                            : "rgba(255, 255, 255, 0.08)",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 12,
                      })}
                    >
                      <Text selectable={false} style={{ color: "#e6f7fb", fontSize: 12, fontWeight: "900" }}>
                        {roughSelectionActive ? "Painting" : "Paint selection"}
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Undo last painted subject stroke"
                      disabled={subjectMaskBusy || roughSelectionBrushSamples.length === 0}
                      onPress={undoLastRoughSelectionStroke}
                      style={({ pressed }) => ({
                        minHeight: 36,
                        borderRadius: 999,
                        borderCurve: "continuous",
                        borderWidth: 1,
                        borderColor: "rgba(255, 255, 255, 0.24)",
                        backgroundColor: pressed ? "rgba(255, 255, 255, 0.16)" : "rgba(255, 255, 255, 0.06)",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        gap: 6,
                        paddingHorizontal: 12,
                        opacity: subjectMaskBusy || roughSelectionBrushSamples.length === 0 ? 0.46 : 1,
                      })}
                    >
                      <Undo2 size={14} color="rgba(255, 255, 255, 0.76)" strokeWidth={2.7} />
                      <Text selectable={false} style={{ color: "rgba(255, 255, 255, 0.76)", fontSize: 12, fontWeight: "900" }}>
                        Undo
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Clear painted subject selection"
                      disabled={subjectMaskBusy || roughSelectionBrushSamples.length === 0}
                      onPress={() => {
                        roughSelectionBrushSamplesRef.current = [];
                        setRoughSelectionBrushSamples([]);
                      }}
                      style={({ pressed }) => ({
                        minHeight: 36,
                        borderRadius: 999,
                        borderCurve: "continuous",
                        borderWidth: 1,
                        borderColor: "rgba(255, 255, 255, 0.24)",
                        backgroundColor: pressed ? "rgba(255, 255, 255, 0.16)" : "rgba(255, 255, 255, 0.06)",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 12,
                        opacity: subjectMaskBusy || roughSelectionBrushSamples.length === 0 ? 0.46 : 1,
                      })}
                    >
                      <Text selectable={false} style={{ color: "rgba(255, 255, 255, 0.76)", fontSize: 12, fontWeight: "900" }}>
                        Clear
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
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
                  gap: 10,
                }}
              >
                <View style={{ gap: 7 }}>
                  <Text selectable={false} style={{ color: "#d9eef4", fontSize: 11, fontWeight: "900" }}>
                    MASK AREAS
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {orderedSubjectMaskSectionControls.map((section) => {
                      const active = activeSubjectMaskSectionSet.has(section.id);

                      return (
                        <Pressable
                          key={`mask-section-button-${section.id}`}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          accessibilityLabel={`${active ? "Disable" : "Enable"} ${section.label} mask area`}
                          onPress={() => toggleSubjectMaskSection(section.id)}
                          style={({ pressed }) => ({
                            minHeight: 34,
                            borderRadius: 999,
                            borderCurve: "continuous",
                            borderWidth: 1,
                            borderColor: active ? "rgba(85, 223, 245, 0.84)" : "rgba(255, 255, 255, 0.24)",
                            backgroundColor: active
                              ? pressed
                                ? "rgba(85, 223, 245, 0.28)"
                                : "rgba(85, 223, 245, 0.18)"
                              : pressed
                                ? "rgba(255, 255, 255, 0.14)"
                                : "rgba(255, 255, 255, 0.06)",
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "row",
                            gap: 6,
                            paddingHorizontal: 11,
                          })}
                        >
                          {active ? (
                            <Check size={13} color="#b7f6ff" strokeWidth={3} />
                          ) : null}
                          <Text
                            selectable={false}
                            style={{
                              color: active ? "#e6f7fb" : "rgba(255, 255, 255, 0.7)",
                              fontSize: 12,
                              fontWeight: "900",
                            }}
                          >
                            {section.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
                {!showDesktopMaskZoomRail ? (
                <View style={{ gap: 7 }}>
                  <Text selectable={false} style={{ color: "#d9eef4", fontSize: 11, fontWeight: "900" }}>
                    MASK FIT
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignSelf: "flex-start",
                      gap: 6,
                      padding: 3,
                      borderRadius: 999,
                      borderCurve: "continuous",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    {([
                      ["expanded", "Expanded"],
                      ["artOpening", "Opening"],
                    ] as const).map(([fitMode, label]) => {
                      const active = subjectMaskFitMode === fitMode;

                      return (
                        <Pressable
                          key={fitMode}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          accessibilityLabel={`Use ${label.toLowerCase()} mask fit`}
                          onPress={() => setSubjectMaskFitMode(fitMode)}
                          style={({ pressed }) => ({
                            minHeight: 30,
                            borderRadius: 999,
                            borderCurve: "continuous",
                            backgroundColor: active
                              ? "#ffffff"
                              : pressed
                                ? "rgba(255, 255, 255, 0.14)"
                                : "transparent",
                            alignItems: "center",
                            justifyContent: "center",
                            paddingHorizontal: 12,
                          })}
                        >
                          <Text
                            selectable={false}
                            style={{
                              color: active ? "#151820" : "rgba(255, 255, 255, 0.72)",
                              fontSize: 12,
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
                ) : null}
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
                  {onGenerateArt ? (
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
                  ) : null}
                </>
              ) : null}
              {adjustMode !== "mask" ? (
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
              ) : null}
            </View>
            </View>
          </ScrollView>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function DesktopMaskZoomSlider({
  value,
  min,
  max,
  height,
  disabled,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  height: number;
  disabled?: boolean;
  onChange: (nextValue: number) => void;
}) {
  const trackHeight = Math.max(124, height - 116);
  const clampedValue = clamp(value, min, max);
  const valueRatio = max > min ? (clampedValue - min) / (max - min) : 0;
  const thumbTop = (1 - valueRatio) * trackHeight;
  const setValueFromTrackY = (locationY: number) => {
    if (disabled) {
      return;
    }

    const nextRatio = 1 - clamp(locationY, 0, trackHeight) / trackHeight;
    onChange(min + nextRatio * (max - min));
  };
  const step = 0.08;

  return (
    <View
      style={{
        width: 58,
        height,
        minHeight: 210,
        borderRadius: 18,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.22)",
        backgroundColor: "rgba(7, 11, 18, 0.68)",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        gap: 8,
        opacity: disabled ? 0.58 : 1,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Zoom mask image in"
        disabled={disabled}
        onPress={() => onChange(clamp(clampedValue + step, min, max))}
        style={({ pressed }) => ({
          width: 36,
          height: 36,
          borderRadius: 18,
          borderCurve: "continuous",
          backgroundColor: pressed ? "rgba(85, 223, 245, 0.24)" : "rgba(255, 255, 255, 0.1)",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <Plus size={16} color="#e6f7fb" strokeWidth={3} />
      </Pressable>
      <View
        onStartShouldSetResponder={() => !disabled}
        onMoveShouldSetResponder={() => !disabled}
        onResponderGrant={(event) => setValueFromTrackY(event.nativeEvent.locationY)}
        onResponderMove={(event) => setValueFromTrackY(event.nativeEvent.locationY)}
        style={{
          width: 34,
          height: trackHeight,
          borderRadius: 999,
          borderCurve: "continuous",
          backgroundColor: "rgba(255, 255, 255, 0.11)",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.2)",
          overflow: "hidden",
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: `${valueRatio * 100}%`,
            backgroundColor: "rgba(85, 223, 245, 0.34)",
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 5,
            top: clamp(thumbTop - 12, 4, trackHeight - 28),
            width: 22,
            height: 22,
            borderRadius: 11,
            borderCurve: "continuous",
            backgroundColor: "#e6f7fb",
            borderWidth: 2,
            borderColor: "#06232c",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.28)",
          }}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Zoom mask image out"
        disabled={disabled}
        onPress={() => onChange(clamp(clampedValue - step, min, max))}
        style={({ pressed }) => ({
          width: 36,
          height: 36,
          borderRadius: 18,
          borderCurve: "continuous",
          backgroundColor: pressed ? "rgba(85, 223, 245, 0.24)" : "rgba(255, 255, 255, 0.1)",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <Minus size={16} color="#e6f7fb" strokeWidth={3} />
      </Pressable>
      <Text selectable={false} style={{ color: "#e6f7fb", fontSize: 11, fontWeight: "900" }}>
        {Math.round(clampedValue * 100)}%
      </Text>
    </View>
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

  const renderWidth = target.kind === "card" ? target.renderWidth ?? 750 : 750;
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

function SaveDestinationSetModal({
  visible,
  cardName,
  sets,
  selectedSetId,
  onSaveToSet,
  onCreateSetAndSave,
  onClose,
}: {
  visible: boolean;
  cardName: string;
  sets: CardSet[];
  selectedSetId: string;
  onSaveToSet: (setId: string) => void;
  onCreateSetAndSave: (name: string) => void;
  onClose: () => void;
}) {
  const [newSetName, setNewSetName] = useState("");
  const trimmedNewSetName = newSetName.trim();

  useEffect(() => {
    if (!visible) {
      setNewSetName("");
    }
  }, [visible]);

  const submitNewSetSave = () => {
    if (!trimmedNewSetName) {
      console.warn("Unable to create a save destination set because the set name is empty.");
      return;
    }

    Keyboard.dismiss();
    onCreateSetAndSave(trimmedNewSetName);
    setNewSetName("");
  };

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
                Save to set
              </Text>
              <Text selectable style={{ color: "#5f6570", fontSize: 14, lineHeight: 19, fontWeight: "700" }}>
                Pick or create the destination set for {cardName || "this card"}.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel save"
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

          <View
            style={{
              borderRadius: 10,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: "#d8dbe2",
              backgroundColor: "#f8f9fb",
              padding: 10,
              gap: 8,
            }}
          >
            <Text
              selectable={false}
              style={{ color: "#5f6470", fontSize: 12, fontWeight: "900", textTransform: "uppercase" }}
            >
              New Set
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TextInput
                accessibilityLabel="New set name"
                value={newSetName}
                onChangeText={setNewSetName}
                onSubmitEditing={submitNewSetSave}
                returnKeyType="done"
                placeholder="Set name"
                placeholderTextColor="#8b92a0"
                style={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: 42,
                  borderRadius: 8,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: "#d7dbe3",
                  backgroundColor: "#ffffff",
                  color: "#151820",
                  fontSize: 15,
                  fontWeight: "800",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Create new set and save ${cardName || "card"}`}
                disabled={!trimmedNewSetName}
                onPress={submitNewSetSave}
                style={{
                  minHeight: 42,
                  borderRadius: 8,
                  borderCurve: "continuous",
                  backgroundColor: trimmedNewSetName ? "#151820" : "#c8ccd5",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 7,
                  paddingHorizontal: 12,
                  opacity: trimmedNewSetName ? 1 : 0.82,
                }}
              >
                <ListPlus size={17} color="#ffffff" strokeWidth={2.5} />
                <Text selectable={false} style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>
                  Save
                </Text>
              </Pressable>
            </View>
          </View>

          <ScrollView
            style={{ maxHeight: 320 }}
            contentContainerStyle={{ gap: 8 }}
            keyboardShouldPersistTaps="handled"
          >
            {sets.map((set) => {
              const selected = set.id === selectedSetId;

              return (
                <Pressable
                  key={set.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Save ${cardName || "card"} to ${set.name}`}
                  onPress={() => onSaveToSet(set.id)}
                  style={{
                    minHeight: 54,
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

type SetCardImageThumbnailProps = {
  card: CardDraft;
  width: number;
  cornerRadius: number;
  renderedImageUrl?: string;
  renderStatus?: SetCardImageRenderStatus;
  renderReadinessKey?: string;
  onRequestRender?: () => void;
};

const SetCardImageThumbnail = memo(function SetCardImageThumbnail({
  card,
  width,
  cornerRadius,
  renderedImageUrl,
  renderStatus,
  renderReadinessKey,
  onRequestRender,
}: SetCardImageThumbnailProps) {
  const nativeIdRef = useRef(`cardmagic-set-thumbnail-${Math.random().toString(36).slice(2, 10)}`);
  const height = width / CARD_BACK_PREVIEW_ASPECT_RATIO;
  const requestRenderRef = useRef(onRequestRender);
  const resolvedImageRevokeRef = useRef<(() => void) | null>(null);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [imageResolutionError, setImageResolutionError] = useState<string | null>(null);
  const effectiveRenderedImageUrl = renderedImageUrl ?? renderStatus?.imageUrl;
  const imageSource = useMemo(
    () => {
      if (!resolvedImageUrl || imageResolutionError) {
        return null;
      }

      return {
        uri: getResizedCommunityImageUrl(resolvedImageUrl, width) ?? resolvedImageUrl,
      };
    },
    [imageResolutionError, resolvedImageUrl, width],
  );
  const hasRenderFailure = isSetCardImageRenderFailure(renderStatus);
  const isResolvingImage = Boolean(effectiveRenderedImageUrl && !resolvedImageUrl && !imageResolutionError);
  const isRenderProgressing = isResolvingImage || isSetCardImageRenderProgress(renderStatus);
  const statusLabel = imageResolutionError ? "Image load failed" : hasRenderFailure ? renderStatus?.label : undefined;
  const statusDetail = imageResolutionError ?? (hasRenderFailure ? renderStatus?.detail : undefined);
  const showProgressOverlay = Boolean(
    imageSource &&
    !imageResolutionError &&
    isRenderProgressing,
  );
  const showFailureOverlay = Boolean(
    imageSource &&
    (imageResolutionError || hasRenderFailure),
  );

  useEffect(() => {
    requestRenderRef.current = onRequestRender;
  }, [onRequestRender]);

  useEffect(() => {
    let cancelled = false;
    const revokePreviousResolvedImage = () => {
      resolvedImageRevokeRef.current?.();
      resolvedImageRevokeRef.current = null;
    };

    if (!effectiveRenderedImageUrl) {
      revokePreviousResolvedImage();
      setResolvedImageUrl(null);
      setImageResolutionError(null);
      return () => {
        cancelled = true;
      };
    }

    if (!isWebMediaReference(effectiveRenderedImageUrl)) {
      revokePreviousResolvedImage();
      setImageResolutionError(null);
      setResolvedImageUrl(effectiveRenderedImageUrl);
      return () => {
        cancelled = true;
      };
    }

    setImageResolutionError(null);
    setResolvedImageUrl(null);
    void resolveWebMediaObjectUrl(effectiveRenderedImageUrl, "image/png")
      .then((resolvedImage) => {
        if (!cancelled) {
          revokePreviousResolvedImage();
          resolvedImageRevokeRef.current = resolvedImage.revoke ?? null;
          setImageResolutionError(null);
          setResolvedImageUrl(resolvedImage.uri);
          return;
        }

        resolvedImage.revoke?.();
      })
      .catch((error) => {
        if (!cancelled) {
          setImageResolutionError(getSetCardImageRenderErrorDetail(error));
        }
        console.warn("Unable to resolve saved set card thumbnail.", error);
      });

    return () => {
      cancelled = true;
      revokePreviousResolvedImage();
    };
  }, [effectiveRenderedImageUrl, renderReadinessKey]);

  useEffect(() => {
    if (Platform.OS === "web" || !resolvedImageUrl || !rememberPrefetchedSetThumbnailUrl(resolvedImageUrl)) {
      return;
    }

    void ExpoImage.prefetch(resolvedImageUrl, "memory-disk").catch((error) => {
      console.warn("Unable to prefetch saved set card thumbnail.", error);
    });
  }, [resolvedImageUrl]);

  useEffect(() => {
    if (effectiveRenderedImageUrl || !requestRenderRef.current) {
      return;
    }

    const requestTimer = setTimeout(() => requestRenderRef.current?.(), 200);

    return () => {
      clearTimeout(requestTimer);
    };
  }, [effectiveRenderedImageUrl, renderReadinessKey]);

  return (
    <View
      nativeID={nativeIdRef.current}
      style={{
        width,
        height,
        borderRadius: cornerRadius,
        borderCurve: "continuous",
        backgroundColor: "#f4f6f9",
        overflow: "hidden",
      }}
    >
      {imageSource ? (
        <>
          <ExpoImage
            source={imageSource}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            cachePolicy={Platform.OS === "web" ? "disk" : "memory-disk"}
            transition={0}
            onLoad={() => {
              setImageResolutionError(null);
            }}
            onError={() => {
              setResolvedImageUrl(null);
              setImageResolutionError("Image component could not load the thumbnail URL.");
            }}
          />
          {showProgressOverlay ? (
            <View
              style={{
                position: "absolute",
                left: 6,
                bottom: 6,
                width: Math.max(24, width * 0.16),
                height: Math.max(24, width * 0.16),
                borderRadius: 999,
                backgroundColor: "rgba(16, 24, 38, 0.72)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ActivityIndicator color="#ffffff" size="small" />
            </View>
          ) : null}
          {showFailureOverlay ? (
            <View
              style={{
                position: "absolute",
                left: 6,
                right: 6,
                bottom: 6,
                borderRadius: 6,
                backgroundColor: "rgba(16, 24, 38, 0.82)",
                paddingHorizontal: 7,
                paddingVertical: 5,
              }}
            >
              <Text selectable={false} numberOfLines={1} style={{ color: "#ffffff", fontSize: Math.max(7, width * 0.064), fontWeight: "900", textTransform: "uppercase" }}>
                {statusLabel}
              </Text>
              {statusDetail ? (
                <Text selectable={false} numberOfLines={1} style={{ color: "rgba(255, 255, 255, 0.78)", fontSize: Math.max(6, width * 0.052), fontWeight: "800" }}>
                  {statusDetail}
                </Text>
              ) : null}
            </View>
          ) : null}
        </>
      ) : (
        <CardThumbnailFallback
          card={card}
          width={width}
          cornerRadius={cornerRadius}
          statusLabel={statusLabel}
          statusDetail={statusDetail}
          loading={!statusLabel}
        />
      )}
    </View>
  );
});

function CardThumbnailFallback({
  card,
  width,
  cornerRadius,
  statusLabel = "Preview repaired",
  statusDetail,
  loading = false,
}: {
  card: CardDraft;
  width: number;
  cornerRadius: number;
  statusLabel?: string;
  statusDetail?: string;
  loading?: boolean;
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
      {loading ? (
        <View style={{ alignItems: "flex-start", justifyContent: "center", minHeight: Math.max(28, width * 0.16) }}>
          <ActivityIndicator color="#68707d" size="small" />
        </View>
      ) : (
        <View style={{ gap: 2 }}>
          <Text selectable={false} numberOfLines={1} style={{ color: "#8a93a3", fontSize: Math.max(6, width * 0.065), fontWeight: "900", textTransform: "uppercase" }}>
            {statusLabel}
          </Text>
          {statusDetail ? (
            <Text selectable={false} numberOfLines={2} style={{ color: "#747d8f", fontSize: Math.max(6, width * 0.052), lineHeight: Math.max(8, width * 0.068), fontWeight: "800" }}>
              {statusDetail}
            </Text>
          ) : null}
        </View>
      )}
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
  disabled = false,
  onPress,
}: {
  label: string;
  icon: ReactNode;
  selected?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        minHeight: 44,
        borderRadius: 9,
        borderCurve: "continuous",
        backgroundColor: selected ? "#151820" : destructive ? "#fff1f1" : "#f5f6f8",
        opacity: disabled ? 0.62 : 1,
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
          ["frame", "Frame"],
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

function SetCardsGrid({
  set,
  canRemoveCardSnapshot,
  visibleSetCards,
  hiddenCardCount,
  previewWidth,
  blankCardHeight,
  gridGap,
  gridColumns,
  isEditingSet,
  setCardImageRemoteHydrated,
  scrollWindow,
  onGridLayout,
  onCreateCardInSet,
  onOpenCardFromSet,
  onRemoveCardFromSet,
  onRefreshSetCardImages,
  getSetCardImageRenderStatus,
  onEnsureSetCardImage,
  confirmDelete,
  showMoreCards,
}: {
  set: CardSet;
  canRemoveCardSnapshot: (snapshot: SetCardSnapshot) => boolean;
  visibleSetCards: SetCardSnapshot[];
  hiddenCardCount: number;
  previewWidth: number;
  blankCardHeight: number;
  gridGap: number;
  gridColumns: number;
  isEditingSet: boolean;
  setCardImageRemoteHydrated: boolean;
  scrollWindow: MainScrollWindow | null;
  onGridLayout: (event: LayoutChangeEvent) => void;
  onCreateCardInSet: (setId: string) => void;
  onOpenCardFromSet: (setId: string, snapshot: SetCardSnapshot) => void;
  onRemoveCardFromSet: (setId: string, cardId: string) => void;
  onRefreshSetCardImages: (setId: string, snapshots: SetCardSnapshot[]) => void;
  getSetCardImageRenderStatus: (setId: string, snapshot: SetCardSnapshot) => SetCardImageRenderStatus | undefined;
  onEnsureSetCardImage: (setId: string, snapshot: SetCardSnapshot) => void;
  confirmDelete: (
    title: string,
    message: string,
    confirmLabel: string,
    onConfirm: () => void,
  ) => void;
  showMoreCards: (setId: string) => void;
}) {
  const gridRef = useRef<View>(null);
  const { height: viewportHeight } = useWindowDimensions();
  const [gridViewportY, setGridViewportY] = useState<number | null>(null);
  const safeGridColumns = Math.max(1, gridColumns);
  const rowStride = blankCardHeight + gridGap;
  const gridItemCount = 1 + visibleSetCards.length + (hiddenCardCount > 0 ? 1 : 0);
  const gridRowCount = Math.max(1, Math.ceil(gridItemCount / safeGridColumns));
  const compactVirtualization = Platform.OS === "web" && safeGridColumns <= 2;
  const initialMountRows = compactVirtualization
    ? SET_GRID_COMPACT_INITIAL_MOUNT_ROWS
    : SET_GRID_INITIAL_MOUNT_ROWS;
  const virtualOverscanPx = compactVirtualization
    ? SET_GRID_COMPACT_VIRTUAL_OVERSCAN_PX
    : SET_GRID_VIRTUAL_OVERSCAN_PX;

  const measureGridViewport = useCallback(() => {
    gridRef.current?.measureInWindow((_x, y) => {
      setGridViewportY((current) => (
        current === null || Math.abs(current - y) > 2 ? y : current
      ));
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(measureGridViewport, 0);

    return () => clearTimeout(timer);
  }, [
    measureGridViewport,
    previewWidth,
    visibleSetCards.length,
    hiddenCardCount,
    scrollWindow?.offsetY,
    scrollWindow?.viewportHeight,
  ]);

  const virtualRows = useMemo(() => {
    if (!Number.isFinite(rowStride) || rowStride <= 0) {
      return {
        startRow: 0,
        endRow: Math.min(gridRowCount, initialMountRows),
      };
    }

    if (gridViewportY === null) {
      return {
        startRow: 0,
        endRow: Math.min(gridRowCount, initialMountRows),
      };
    }

    const visibleViewportHeight = Math.max(1, scrollWindow?.viewportHeight ?? viewportHeight);
    const virtualTop = -gridViewportY - virtualOverscanPx;
    const virtualBottom = visibleViewportHeight - gridViewportY + virtualOverscanPx;
    const startRow = Math.max(0, Math.min(gridRowCount - 1, Math.floor(virtualTop / rowStride)));
    const endRow = Math.max(
      startRow + 1,
      Math.min(gridRowCount, Math.ceil(virtualBottom / rowStride)),
    );

    return { startRow, endRow };
  }, [gridRowCount, gridViewportY, initialMountRows, rowStride, scrollWindow?.viewportHeight, viewportHeight, virtualOverscanPx]);

  const shouldMountGridItem = useCallback((itemIndex: number) => {
    const rowIndex = Math.floor(itemIndex / safeGridColumns);

    return rowIndex >= virtualRows.startRow && rowIndex < virtualRows.endRow;
  }, [safeGridColumns, virtualRows.endRow, virtualRows.startRow]);

  const renderOffscreenPlaceholder = (key: string) => (
    <View
      key={key}
      pointerEvents="none"
      style={{
        width: previewWidth,
        height: blankCardHeight,
      }}
    />
  );

  return (
    <View
      ref={gridRef}
      collapsable={false}
      onLayout={(event) => {
        onGridLayout(event);
        measureGridViewport();
      }}
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: gridGap,
        alignItems: "flex-start",
      }}
    >
      {shouldMountGridItem(0) ? (
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
      ) : renderOffscreenPlaceholder("create-card-placeholder")}

      {visibleSetCards.map((snapshot, cardIndex) => {
        const itemIndex = cardIndex + 1;

        if (!shouldMountGridItem(itemIndex)) {
          return renderOffscreenPlaceholder(snapshot.id);
        }

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
              <SetCardImageThumbnail
                card={setCard}
                width={previewWidth}
                cornerRadius={SET_CARD_THUMBNAIL_RADIUS}
                renderedImageUrl={snapshot.renderedImageUrl}
                renderStatus={getSetCardImageRenderStatus(set.id, snapshot)}
                renderReadinessKey={setCardImageRemoteHydrated ? "remote-ready" : "remote-pending"}
                onRequestRender={compactVirtualization ? undefined : () => onEnsureSetCardImage(set.id, snapshot)}
              />
            </View>
            {isEditingSet ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Refresh rendered preview for ${setCard.name || "Untitled Card"}`}
                  hitSlop={8}
                  onPress={(event) => {
                    event.stopPropagation();
                    onRefreshSetCardImages(set.id, [snapshot]);
                  }}
                  style={{
                    position: "absolute",
                    top: 4,
                    left: 4,
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
                  <RefreshCw size={16} color="#ffffff" strokeWidth={2.7} />
                </Pressable>
                {canRemoveCardSnapshot(snapshot) ? (
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
                      borderColor: "rgba(185,28,28,0.32)",
                      backgroundColor: "rgba(255,255,255,0.94)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={17} color="#b91c1c" strokeWidth={3} />
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </Pressable>
        );
      })}

      {hiddenCardCount > 0 ? (
        shouldMountGridItem(visibleSetCards.length + 1) ? (
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
        ) : renderOffscreenPlaceholder("show-more-placeholder")
      ) : null}
    </View>
  );
}

function SetsPanel({
  sets,
  selectedSetId,
  accountUserId,
  scrollWindow,
  customCardBacks,
  generatedSetSymbols,
  canRefreshSets,
  setsRefreshing,
  setCardImageRemoteHydrated,
  canInviteSetCollaborators,
  onRefreshSets,
  onSelectSet,
  onCreateSet,
  onRenameSet,
  onChangeSetCode,
  onCreateCardInSet,
  onOpenCardFromSet,
  onRemoveCardFromSet,
  onRemoveSet,
  onRefreshSetCardImages,
  onChangeSetCardBack,
  onChangeSetDefaultSymbol,
  onPickSetSymbol,
  onGenerateSetSymbol,
  onFetchSetCollaborators,
  onFetchPendingInvites,
  onInviteSetCollaborator,
  onCreateSetInviteLink,
  getSetCardImageRenderStatus,
  onEnsureSetCardImage,
}: {
  sets: CardSet[];
  selectedSetId: string;
  accountUserId?: string;
  scrollWindow: MainScrollWindow | null;
  customCardBacks: CustomCardBackEntry[];
  generatedSetSymbols: GeneratedSetSymbolEntry[];
  canRefreshSets: boolean;
  setsRefreshing: boolean;
  setCardImageRemoteHydrated: boolean;
  canInviteSetCollaborators: boolean;
  onRefreshSets: () => void;
  onSelectSet: (setId: string) => void;
  onCreateSet: (name: string) => void;
  onRenameSet: (setId: string, name: string) => void;
  onChangeSetCode: (setId: string, code: string) => void;
  onCreateCardInSet: (setId: string) => void;
  onOpenCardFromSet: (setId: string, snapshot: SetCardSnapshot) => void;
  onRemoveCardFromSet: (setId: string, cardId: string) => void;
  onRemoveSet: (setId: string) => void;
  onRefreshSetCardImages: (setId: string, snapshots: SetCardSnapshot[]) => void;
  onChangeSetCardBack: (setId: string, cardBackId: CardBackId) => void;
  onChangeSetDefaultSymbol: (
    setId: string,
    patch: Pick<CardDraft, "setSymbolPreset" | "setSymbolId" | "setSymbolUri" | "setSymbolUsesRarityTreatment">,
  ) => void;
  onPickSetSymbol: (setId: string) => void;
  onGenerateSetSymbol?: (setId: string) => void;
  onFetchSetCollaborators: (setId: string) => Promise<CollaborationSetMemberPayload[]>;
  onFetchPendingInvites: (setId: string) => Promise<CollaborationPendingInvitePayload[]>;
  onInviteSetCollaborator: (setId: string, inviteIdentifier: string) => Promise<void>;
  onCreateSetInviteLink: (setId: string, role?: CollaborationSetInviteLinkRole) => Promise<string>;
  getSetCardImageRenderStatus: (setId: string, snapshot: SetCardSnapshot) => SetCardImageRenderStatus | undefined;
  onEnsureSetCardImage: (setId: string, snapshot: SetCardSnapshot) => void;
}) {
  const { width: viewportWidth } = useWindowDimensions();
  const [newSetName, setNewSetName] = useState("");
  const [expandedSetIds, setExpandedSetIds] = useState<Set<string>>(() => new Set([selectedSetId]));
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editingSetDefaultsPanel, setEditingSetDefaultsPanel] = useState<"cardBack" | "setSymbol" | null>(null);
  const [editingSetName, setEditingSetName] = useState("");
  const [editingSetCode, setEditingSetCode] = useState("");
  const [invitingSetId, setInvitingSetId] = useState<string | null>(null);
  const [inviteIdentifier, setInviteIdentifier] = useState("");
  const [inviteBusySetId, setInviteBusySetId] = useState<string | null>(null);
  const [inviteLinkBusyKey, setInviteLinkBusyKey] = useState<string | null>(null);
  const [inviteLinkByKey, setInviteLinkByKey] = useState<Record<string, string>>({});
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccessMessage, setInviteSuccessMessage] = useState<string | null>(null);
  const [inviteSuggestions, setInviteSuggestions] = useState<CollaborationInviteProfileSuggestion[]>([]);
  const [inviteSuggestionsLoading, setInviteSuggestionsLoading] = useState(false);
  const [inviteSuggestionsSuppressedFor, setInviteSuggestionsSuppressedFor] = useState<string | null>(null);
  const [inviteSendingSlow, setInviteSendingSlow] = useState(false);
  const [collaboratorsBySetId, setCollaboratorsBySetId] = useState<Record<string, CollaborationSetMemberPayload[]>>({});
  const [collaboratorsFetchedAtBySetId, setCollaboratorsFetchedAtBySetId] = useState<Record<string, number>>({});
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
  const compactSetGrid = Platform.OS === "web" && forceTwoColumnMobile;
  const initialVisibleCardLimit = compactSetGrid
    ? SET_GRID_COMPACT_INITIAL_CARD_LIMIT
    : SET_GRID_INITIAL_CARD_LIMIT;
  const visibleCardPageSize = compactSetGrid
    ? SET_GRID_COMPACT_PAGE_SIZE
    : SET_GRID_PAGE_SIZE;
  const minimumGridItemWidth = forceTwoColumnMobile ? 118 : 168;
  const gridColumns = forceTwoColumnMobile
    ? 2
    : Math.max(1, Math.floor((gridContentWidth + gridGap) / (minimumGridItemWidth + gridGap)));
  const gridItemWidth = Math.floor((gridContentWidth - gridGap * (gridColumns - 1)) / gridColumns);
  const previewWidth = Math.max(96, gridItemWidth);
  const blankCardHeight = previewWidth / CARD_BACK_PREVIEW_ASPECT_RATIO;
  const initialVisibleSetLimit = compactSetGrid ? SET_LIST_COMPACT_INITIAL_LIMIT : SET_LIST_INITIAL_LIMIT;
  const visibleSetPageSize = compactSetGrid ? SET_LIST_COMPACT_PAGE_SIZE : SET_LIST_PAGE_SIZE;
  const [visibleSetLimit, setVisibleSetLimit] = useState(initialVisibleSetLimit);
  const visibleSetCount = Math.min(sets.length, visibleSetLimit);
  const visibleSets = useMemo(() => sets.slice(0, visibleSetCount), [sets, visibleSetCount]);
  const hiddenSetCount = Math.max(0, sets.length - visibleSets.length);
  const setBarGradientsById = useMemo(() => {
    const gradients = new Map<string, SetBarGradient>();

    for (const set of sets) {
      gradients.set(set.id, getSetBarGradient(set));
    }

    return gradients;
  }, [sets]);

  const handleGridLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.floor(event.nativeEvent.layout.width);

    setMeasuredGridContentWidth((current) => (Math.abs(current - nextWidth) > 1 ? nextWidth : current));
  }, []);

  useEffect(() => {
    setVisibleSetLimit((current) => Math.max(current, initialVisibleSetLimit));
  }, [initialVisibleSetLimit]);

  useEffect(() => {
    const selectedIndex = sets.findIndex((set) => set.id === selectedSetId);

    if (selectedIndex < 0) {
      return;
    }

    setVisibleSetLimit((current) => Math.max(current, initialVisibleSetLimit, selectedIndex + 1));
  }, [initialVisibleSetLimit, selectedSetId, sets]);

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

      setCollaboratorsBySetId((current) => {
        const existingCollaborators = current[setId] ?? [];

        if (collaborators.length === 0 && existingCollaborators.length > 0) {
          return current;
        }

        return {
          ...current,
          [setId]: collaborators,
        };
      });
      setCollaboratorsFetchedAtBySetId((current) => ({
        ...current,
        [setId]: Date.now(),
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

  const openSetInvitePanel = useCallback((setId: string, canManageInvites: boolean) => {
    if (!canInviteSetCollaborators && canManageInvites) {
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
      if (canManageInvites) {
        void loadPendingInvites(setId);
      }
    }
  }, [canInviteSetCollaborators, invitingSetId, loadPendingInvites, loadSetCollaborators, onSelectSet]);

  useEffect(() => {
    const liveSetIds = new Set(sets.map((set) => set.id));

    setCollaboratorsBySetId((current) => {
      const next = Object.fromEntries(Object.entries(current).filter(([setId]) => liveSetIds.has(setId)));

      return Object.keys(next).length === Object.keys(current).length ? current : next;
    });
    setCollaboratorsFetchedAtBySetId((current) => {
      const next = Object.fromEntries(Object.entries(current).filter(([setId]) => liveSetIds.has(setId)));

      return Object.keys(next).length === Object.keys(current).length ? current : next;
    });
    setCollaboratorsErrorBySetId((current) => {
      const next = Object.fromEntries(Object.entries(current).filter(([setId]) => liveSetIds.has(setId)));

      return Object.keys(next).length === Object.keys(current).length ? current : next;
    });
    setPendingInvitesBySetId((current) => {
      const next = Object.fromEntries(Object.entries(current).filter(([setId]) => liveSetIds.has(setId)));

      return Object.keys(next).length === Object.keys(current).length ? current : next;
    });
    setPendingInvitesErrorBySetId((current) => {
      const next = Object.fromEntries(Object.entries(current).filter(([setId]) => liveSetIds.has(setId)));

      return Object.keys(next).length === Object.keys(current).length ? current : next;
    });
  }, [sets]);

  useEffect(() => {
    if (!invitingSetId) {
      return;
    }

    const set = sets.find((candidate) => candidate.id === invitingSetId);

    if (!set) {
      setInvitingSetId(null);
      return;
    }

    if (collaboratorsLoadingSetId === invitingSetId || pendingInvitesLoadingSetId === invitingSetId) {
      return;
    }

    const canManageInvites = canInviteSetCollaborators && canDeleteCardSetContent(set, accountUserId);
    const lastFetchedAt = collaboratorsFetchedAtBySetId[invitingSetId] ?? 0;

    if (Date.now() - lastFetchedAt <= COLLABORATION_ROSTER_STALE_MS) {
      return;
    }

    void loadSetCollaborators(invitingSetId);

    if (canManageInvites) {
      void loadPendingInvites(invitingSetId);
    }
  }, [
    accountUserId,
    canInviteSetCollaborators,
    collaboratorsFetchedAtBySetId,
    collaboratorsLoadingSetId,
    invitingSetId,
    loadPendingInvites,
    loadSetCollaborators,
    pendingInvitesLoadingSetId,
    sets,
  ]);

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

  const getInviteLinkKey = useCallback((setId: string, role: CollaborationSetInviteLinkRole) => `${setId}:${role}`, []);

  const createSetInviteLink = useCallback(async (
    setId: string,
    setName: string,
    role: CollaborationSetInviteLinkRole,
  ) => {
    const inviteLinkKey = getInviteLinkKey(setId, role);

    setInviteLinkBusyKey(inviteLinkKey);
    setInviteError(null);
    setInviteSuccessMessage(null);

    try {
      const inviteUrl = await onCreateSetInviteLink(setId, role);

      setInviteLinkByKey((current) => ({
        ...current,
        [inviteLinkKey]: inviteUrl,
      }));
      setInviteSuccessMessage(`${role === "viewer" ? "Viewer" : "Editor"} invite link created for ${setName}.`);
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : "CardMagic could not create that invite link.");
    } finally {
      setInviteLinkBusyKey(null);
    }
  }, [getInviteLinkKey, onCreateSetInviteLink]);

  const copyCreatedSetInviteLink = useCallback(async (
    setId: string,
    setName: string,
    role: CollaborationSetInviteLinkRole,
  ) => {
    const inviteLinkKey = getInviteLinkKey(setId, role);
    const inviteUrl = inviteLinkByKey[inviteLinkKey];

    if (!inviteUrl) {
      await createSetInviteLink(setId, setName, role);
      return;
    }

    setInviteLinkBusyKey(inviteLinkKey);
    setInviteError(null);
    setInviteSuccessMessage(null);

    try {
      await copyTextToClipboardOrShare(inviteUrl);
      setInviteSuccessMessage(`${role === "viewer" ? "Viewer" : "Editor"} invite link copied for ${setName}.`);
    } catch (error) {
      console.warn("Invite link copy/share unavailable.", error);
      setInviteError(error instanceof Error ? error.message : "CardMagic could not copy that invite link.");
    } finally {
      setInviteLinkBusyKey(null);
    }
  }, [createSetInviteLink, getInviteLinkKey, inviteLinkByKey]);

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
      [setId]: (current[setId] ?? initialVisibleCardLimit) + visibleCardPageSize,
    }));
  }, [initialVisibleCardLimit, visibleCardPageSize]);

  const confirmDelete = useCallback((
    title: string,
    message: string,
    confirmLabel: string,
    onConfirm: () => void,
  ) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      if (window.confirm(`${title}\n\n${message}`)) {
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
          onChangeText={setNewSetName}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create set"
          onPress={() => {
            const name = newSetName.trim();

            if (!name) {
              return;
            }

            onCreateSet(name);
            setNewSetName("");
          }}
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

        {visibleSets.map((set) => {
          const selected = set.id === selectedSetId;
          const expanded = expandedSetIds.has(set.id);
          const setCardBackId = set.cardBackId ?? DEFAULT_CARD_BACK_ID;
          const setCardBackOption = getCardBackOption(setCardBackId, customCardBacks);
          const setBarGradient = setBarGradientsById.get(set.id) ?? getSetBarGradient(set);
          const isEditingSet = editingSetId === set.id;
          const visibleCardLimit = visibleCardLimits[set.id] ?? initialVisibleCardLimit;
          const visibleSetCards = set.cards.slice(0, visibleCardLimit);
          const hiddenCardCount = Math.max(0, set.cards.length - visibleSetCards.length);
          const canDeleteSetContent = canDeleteCardSetContent(set, accountUserId);
          const canManageSetCollaborators = canInviteSetCollaborators && canDeleteSetContent;
          const canViewSetCollaborators = canManageSetCollaborators || Boolean(set.ownerUserId && accountUserId);
          const collaborators = collaboratorsBySetId[set.id] ?? [];
          const collaboratorsLoading = collaboratorsLoadingSetId === set.id;
          const collaboratorsError = collaboratorsErrorBySetId[set.id];
          const pendingInvites = canManageSetCollaborators ? pendingInvitesBySetId[set.id] ?? [] : [];
          const pendingInvitesLoading = canManageSetCollaborators && pendingInvitesLoadingSetId === set.id;
          const pendingInvitesError = canManageSetCollaborators ? pendingInvitesErrorBySetId[set.id] : undefined;
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
                {canManageSetCollaborators ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Invite collaborators to ${set.name}`}
                    accessibilityState={{ expanded: invitingSetId === set.id }}
                    hitSlop={6}
                    onPress={(event) => {
                      event.stopPropagation();
                      openSetInvitePanel(set.id, true);
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
                ) : canViewSetCollaborators ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`View collaborators for ${set.name}`}
                    accessibilityState={{ expanded: invitingSetId === set.id }}
                    hitSlop={6}
                    onPress={(event) => {
                      event.stopPropagation();
                      openSetInvitePanel(set.id, false);
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
                    <Users size={16} color="#ffffff" strokeWidth={2.35} />
                  </Pressable>
                ) : null}
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
                {canDeleteSetContent ? (
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
                ) : null}
              </View>

              {canViewSetCollaborators && invitingSetId === set.id ? (
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
                    {canManageSetCollaborators ? "Invite collaborator" : "Collaborators"}
                  </Text>
                  {canManageSetCollaborators ? (
                    <>
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
                      <View
                        style={{
                          flexDirection: "column",
                          alignItems: "stretch",
                          gap: 8,
                        }}
                      >
                        {(["editor", "viewer"] as const).map((inviteRole) => {
                          const inviteLinkKey = getInviteLinkKey(set.id, inviteRole);
                          const inviteLink = inviteLinkByKey[inviteLinkKey];
                          const inviteLinkBusy = inviteLinkBusyKey === inviteLinkKey;
                          const roleLabel = inviteRole === "viewer" ? "Viewer" : "Editor";

                          return (
                            <View
                              key={inviteRole}
                              style={{
                                flexDirection: viewportWidth >= 560 ? "row" : "column",
                                alignItems: viewportWidth >= 560 ? "center" : "stretch",
                                gap: 8,
                              }}
                            >
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={inviteLink
                                  ? `Copy ${set.name} ${inviteRole} invite link`
                                  : `Create ${set.name} ${inviteRole} invite link`}
                                disabled={inviteLinkBusy}
                                onPress={() => {
                                  if (inviteLink) {
                                    void copyCreatedSetInviteLink(set.id, set.name, inviteRole);
                                  } else {
                                    void createSetInviteLink(set.id, set.name, inviteRole);
                                  }
                                }}
                                style={({ pressed }) => ({
                                  minHeight: 38,
                                  borderRadius: 8,
                                  borderCurve: "continuous",
                                  borderWidth: 1,
                                  borderColor: inviteRole === "viewer" ? "#d8dbe2" : "#c8edf2",
                                  backgroundColor: inviteLinkBusy
                                    ? "#e7f4f6"
                                    : pressed
                                      ? inviteRole === "viewer" ? "#eef0f4" : "#dff7fa"
                                      : inviteRole === "viewer" ? "#ffffff" : "#f2fcfd",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexDirection: "row",
                                  gap: 8,
                                  paddingHorizontal: 12,
                                })}
                              >
                                {inviteLinkBusy ? (
                                  <ActivityIndicator color="#0b7180" size="small" />
                                ) : (
                                  <Share2 size={15} color="#0b7180" strokeWidth={2.5} />
                                )}
                                <Text selectable={false} style={{ color: "#0b7180", fontSize: 12, fontWeight: "900" }}>
                                  {inviteLink ? `Copy ${roleLabel} link` : `Create ${roleLabel} link`}
                                </Text>
                              </Pressable>
                              {inviteLink ? (
                                <TextInput
                                  accessibilityLabel={`${set.name} ${inviteRole} invite link`}
                                  value={inviteLink}
                                  editable={false}
                                  selectTextOnFocus
                                  autoCapitalize="none"
                                  autoCorrect={false}
                                  style={{
                                    flex: 1,
                                    minWidth: 0,
                                    minHeight: 38,
                                    borderRadius: 8,
                                    borderCurve: "continuous",
                                    borderWidth: 1,
                                    borderColor: "#d4d8e0",
                                    backgroundColor: "#ffffff",
                                    paddingHorizontal: 10,
                                    color: "#3c4656",
                                    fontSize: 12,
                                    fontWeight: "800",
                                  }}
                                />
                              ) : null}
                            </View>
                          );
                        })}
                      </View>
                    </>
                  ) : null}
                  {canManageSetCollaborators && (inviteSuggestionsLoading || inviteSuggestions.length > 0) ? (
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
                          if (canManageSetCollaborators) {
                            void loadPendingInvites(set.id);
                          }
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
                  {canManageSetCollaborators && inviteError ? (
                    <Text selectable style={{ color: "#a62231", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
                      {inviteError}
                    </Text>
                  ) : canManageSetCollaborators && inviteSuccessMessage ? (
                    <Text selectable={false} style={{ color: "#0b7180", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
                      {inviteSuccessMessage}
                    </Text>
                  ) : null}
                  {canManageSetCollaborators && inviteSendingSlow && inviteBusySetId === set.id ? (
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
                          {onGenerateSetSymbol ? (
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
                          ) : null}
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

                  <SetCardsGrid
                    set={set}
                    canRemoveCardSnapshot={(snapshot) => canRemoveCardSetSnapshot(set, snapshot, accountUserId)}
                    visibleSetCards={visibleSetCards}
                    hiddenCardCount={hiddenCardCount}
                    previewWidth={previewWidth}
                    blankCardHeight={blankCardHeight}
                    gridGap={gridGap}
                    gridColumns={gridColumns}
                    isEditingSet={isEditingSet}
                    setCardImageRemoteHydrated={setCardImageRemoteHydrated}
                    scrollWindow={scrollWindow}
                    onGridLayout={handleGridLayout}
                    onCreateCardInSet={onCreateCardInSet}
                    onOpenCardFromSet={onOpenCardFromSet}
                    onRemoveCardFromSet={onRemoveCardFromSet}
                    onRefreshSetCardImages={onRefreshSetCardImages}
                    getSetCardImageRenderStatus={getSetCardImageRenderStatus}
                    onEnsureSetCardImage={onEnsureSetCardImage}
                    confirmDelete={confirmDelete}
                    showMoreCards={showMoreCards}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
        {hiddenSetCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Load ${Math.min(visibleSetPageSize, hiddenSetCount)} more saved sets`}
            onPress={() => {
              setVisibleSetLimit((current) => Math.min(sets.length, current + visibleSetPageSize));
            }}
            style={{
              minHeight: 46,
              borderRadius: 10,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: "#d4d8e0",
              backgroundColor: "#ffffff",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              paddingHorizontal: 12,
            }}
          >
            <Plus size={17} color="#151820" strokeWidth={2.5} />
            <Text selectable={false} style={{ color: "#151820", fontSize: 14, fontWeight: "900" }}>
              Load {Math.min(visibleSetPageSize, hiddenSetCount)} more sets
            </Text>
          </Pressable>
        ) : null}
      </View>

    </View>
  );
}
