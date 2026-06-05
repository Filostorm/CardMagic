import { supabase, supabaseUrl } from "@/lib/supabase";
import {
  materializeRemoteCardDraftMedia,
  materializeRemoteImageUri,
  persistRemoteCardDraftMedia,
  persistRemoteImageUri,
} from "@/lib/account-media";
import type { CardDraft } from "@/types/card";

export type AccountCardSetPayload = {
  id: string;
  name: string;
  code?: string;
  cardBackId?: string;
  setSymbolPreset?: string;
  setSymbolId?: string;
  setSymbolUri?: string;
  setSymbolUsesRarityTreatment?: boolean;
  cards: AccountCardSnapshotPayload[];
};

export type AccountCustomSetSymbolPayload = {
  id: string;
  label: string;
  uri: string;
  createdAt?: string;
};

export type AccountCardSnapshotPayload = {
  id: string;
  savedAt?: string;
  renderedImageUrl?: string;
  card: CardDraft;
};

export type CommunityCardPayload = {
  id: string;
  userId: string;
  authorName: string;
  authorLevel: number;
  name: string;
  typeLine: string;
  rarity?: string;
  colors: string[];
  frameTreatment?: string;
  imageUrl?: string;
  card: CardDraft;
  likeCount: number;
  commentCount: number;
  likedByViewer: boolean;
  followedByViewer: boolean;
  seenByViewer: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CommunityCardFeedSort = "newest" | "most_liked";

export type CommunityCardPagePayload = {
  cards: CommunityCardPayload[];
  hasMore: boolean;
  nextOffset: number;
};

export type CommunitySetPayload = {
  id: string;
  userId: string;
  authorName: string;
  authorLevel: number;
  name: string;
  code?: string;
  cardBackId?: string;
  setSymbolPreset?: string;
  setSymbolUri?: string;
  setSymbolUsesRarityTreatment?: boolean;
  cardCount: number;
  followerCount: number;
  followedByViewer: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CommunitySetCardPayload = CommunityCardPayload;

export type CommunityNotificationKind = "followed_set_card_added" | "set_followed" | "collaboration_set_joined";

export type CommunityNotificationPayload = {
  id: string;
  kind: CommunityNotificationKind;
  actorUserId?: string;
  actorName: string;
  setId?: string;
  setName: string;
  cardId?: string;
  cardName?: string;
  readAt?: string;
  createdAt: string;
};

export type CommunityCardCommentPayload = {
  id: string;
  cardId: string;
  userId: string;
  authorName: string;
  body: string;
  editableByViewer: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CommunityPollSelectionType = "single" | "multiple";
export type CommunityPollStatus = "open" | "closed";
export type CommunityFeedbackType = "feedback" | "bug";

export type CommunityFeedbackDeviceInfo = {
  platform: string;
  os?: string;
  userAgent?: string;
  language?: string;
  screen?: {
    width?: number;
    height?: number;
    pixelRatio?: number;
  };
};

export type CommunityPollOptionPayload = {
  id: string;
  label: string;
  position: number;
  voteCount: number;
  selectedByViewer: boolean;
};

export type CommunityPollPayload = {
  id: string;
  title: string;
  description?: string;
  selectionType: CommunityPollSelectionType;
  status: CommunityPollStatus;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  options: CommunityPollOptionPayload[];
};

export type CollaborationSetRole = "owner" | "editor";

export type CollaborationSetPayload = {
  id: string;
  ownerUserId: string;
  role: CollaborationSetRole;
  name: string;
  code?: string;
  cardBackId?: string;
  setSymbolPreset?: string;
  setSymbolUri?: string;
  setSymbolUsesRarityTreatment?: boolean;
  ownerName: string;
  memberCount: number;
  cardCount: number;
  commentCount: number;
  pollCount: number;
  openChecklistCount: number;
  updatedAt: string;
};

export type CollaborationSetCommentPayload = {
  id: string;
  setId: string;
  cardId?: string;
  userId: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type CollaborationSetChecklistItemPayload = {
  id: string;
  setId: string;
  userId: string;
  authorName: string;
  body: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CollaborationInviteProfileSuggestion = {
  userId: string;
  username: string;
  displayName?: string;
};

export type CollaborationPendingInvitePayload = {
  id: string;
  invitedEmail: string;
  role: CollaborationSetRole;
  createdAt: string;
};

export type CollaborationSetInviteLinkPayload = {
  inviteCode: string;
  setId: string;
  setName: string;
  role: Extract<CollaborationSetRole, "editor">;
  expiresAt?: string;
};

export type CollaborationSetInvitePreviewPayload = {
  setId: string;
  setName: string;
  ownerUserId: string;
  ownerName: string;
  role: Extract<CollaborationSetRole, "editor">;
  expiresAt?: string;
};

export type CollaborationSetInviteRedemptionPayload = {
  setId: string;
  setName: string;
  ownerUserId: string;
  role: CollaborationSetRole;
};

export type CollaborationSetMemberPayload = {
  id: string;
  userId: string;
  role: CollaborationSetRole;
  username?: string;
  displayName?: string;
  memberName: string;
  acceptedAt?: string;
  createdAt: string;
};

export type PublishCommunityCardPayload = {
  id: string;
  userId: string;
  localSnapshotId?: string;
  card: CardDraft;
  imageUrl?: string;
};

type CardSetRow = {
  id: string;
  name: string;
  set_code: string | null;
  card_back_id: string | null;
  set_symbol_preset: string | null;
  set_symbol_id: string | null;
  set_symbol_uri: string | null;
  set_symbol_uses_rarity_treatment: boolean | null;
};

type CustomSetSymbolRow = {
  id: string;
  label: string;
  uri: string;
  created_at: string;
};

type LegacyCardSetRow = {
  id: string;
  name: string;
  card_back_id: string | null;
  cards: unknown;
};

type CommunityCardRow = {
  id: string;
  user_id: string;
  author_name: string | null;
  author_level: number | null;
  name: string | null;
  type_line: string | null;
  rarity: string | null;
  colors: string[] | null;
  frame_treatment: string | null;
  image_url: string | null;
  card: unknown;
  like_count: number | string | null;
  comment_count: number | string | null;
  liked_by_viewer: boolean | null;
  followed_by_viewer: boolean | null;
  seen_by_viewer: boolean | null;
  created_at: string;
  updated_at: string;
};

type CommunitySetRow = {
  id: string;
  user_id: string;
  author_name: string | null;
  author_level: number | null;
  name: string;
  set_code: string | null;
  card_back_id: string | null;
  set_symbol_preset: string | null;
  set_symbol_uri: string | null;
  set_symbol_uses_rarity_treatment: boolean | null;
  card_count: number | string | null;
  follower_count: number | string | null;
  followed_by_viewer: boolean | null;
  created_at: string;
  updated_at: string;
};

type CommunityNotificationRow = {
  id: string;
  kind: string;
  actor_user_id: string | null;
  set_id: string | null;
  card_id: string | null;
  metadata: unknown;
  read_at: string | null;
  created_at: string;
};

type CommunityCardCommentRow = {
  id: string;
  card_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};

type CommunityPollRow = {
  poll_id: string;
  title: string;
  description: string | null;
  selection_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  option_id: string;
  option_label: string;
  option_position: number | string | null;
  vote_count: number | string | null;
  selected_by_viewer: boolean | null;
};

type CollaborationSetRow = {
  set_id: string;
  owner_user_id: string;
  role: string;
  set_name: string;
  set_code: string | null;
  card_back_id: string | null;
  set_symbol_preset: string | null;
  set_symbol_uri: string | null;
  set_symbol_uses_rarity_treatment: boolean | null;
  owner_name: string | null;
  member_count: number | string | null;
  card_count: number | string | null;
  comment_count: number | string | null;
  poll_count: number | string | null;
  open_checklist_count: number | string | null;
  updated_at: string;
};

type CollaborationSetCommentRow = {
  id: string;
  set_id: string;
  card_id: string | null;
  user_id: string;
  author_name: string | null;
  body: string;
  created_at: string;
  updated_at: string;
};

type CollaborationSetChecklistItemRow = {
  id: string;
  set_id: string;
  user_id: string;
  author_name: string | null;
  body: string;
  completed: boolean | null;
  created_at: string;
  updated_at: string;
};

type CollaborationInviteProfileSuggestionRow = {
  user_id: string;
  username: string | null;
  display_name: string | null;
};

type CollaborationPendingInviteRow = {
  id: string;
  invited_email: string | null;
  role: string | null;
  created_at: string;
};

type CollaborationSetInviteLinkRow = {
  invite_code: string | null;
  set_id: string;
  set_name: string | null;
  role: string | null;
  expires_at: string | null;
};

type CollaborationSetInvitePreviewRow = {
  set_id: string;
  set_name: string | null;
  owner_user_id: string;
  owner_name: string | null;
  role: string | null;
  expires_at: string | null;
};

type CollaborationSetInviteRedemptionRow = {
  set_id: string;
  set_name: string | null;
  owner_user_id: string;
  role: string | null;
};

type CollaborationSetMemberRow = {
  id: string;
  user_id: string;
  role: string | null;
  username: string | null;
  display_name: string | null;
  member_name: string | null;
  accepted_at: string | null;
  created_at: string;
};

type CardSetMembershipRow = {
  set_id: string;
  position: number | null;
  created_at: string | null;
  cards: {
    id: string;
    local_snapshot_id: string | null;
    image_url: string | null;
    updated_at: string;
    card: unknown;
  } | Array<{
    id: string;
    local_snapshot_id: string | null;
    image_url: string | null;
    updated_at: string;
    card: unknown;
  }> | null;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const candidate = error as {
      message?: unknown;
      error?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };
    const messageParts = [candidate.message, candidate.error, candidate.details, candidate.hint]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .map((value) => value.trim());

    if (messageParts.length > 0) {
      return messageParts.join(" ");
    }

    if (typeof candidate.code === "string" && candidate.code.trim().length > 0) {
      return candidate.code.trim();
    }

    try {
      return JSON.stringify(error);
    } catch {
      return "Unknown error";
    }
  }

  return String(error);
}

function getSupabaseErrorCode(error: unknown): string | undefined {
  return error && typeof error === "object" && "code" in error && typeof error.code === "string"
    ? error.code
    : undefined;
}

function getCommunityNotificationMetadata(metadata: unknown): { setName?: string; cardName?: string; actorName?: string } {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  const record = metadata as { setName?: unknown; cardName?: unknown; actorName?: unknown };
  const setName = typeof record.setName === "string" && record.setName.trim() ? record.setName.trim() : undefined;
  const cardName = typeof record.cardName === "string" && record.cardName.trim() ? record.cardName.trim() : undefined;
  const actorName = typeof record.actorName === "string" && record.actorName.trim() ? record.actorName.trim() : undefined;

  return { setName, cardName, actorName };
}

function isBrowserNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message === "load failed" ||
    message === "failed to fetch" ||
    message === "network request failed" ||
    message.includes("networkerror") ||
    message.includes("fetch failed")
  );
}

function createCommunityRequestError({
  action,
  rpc,
  params,
  error,
}: {
  action: string;
  rpc: string;
  params?: Record<string, unknown>;
  error: unknown;
}) {
  const message = getErrorMessage(error);
  const code = getSupabaseErrorCode(error);
  const networkFailure = isBrowserNetworkError(error);
  const detail = {
    action,
    rpc,
    supabaseUrl,
    params,
    code,
    networkFailure,
    error,
  };

  console.warn(`[CardMagic community] ${action} failed.`, detail);

  if (networkFailure) {
    return new Error(
      `${action} could not reach Supabase at ${supabaseUrl ?? "the configured project URL"}. ` +
      `The browser reported "${message}", which usually means the request failed before Supabase returned an RPC response. ` +
      `Check connectivity, CORS/preflight blocking, content blockers, or Supabase project availability.`,
    );
  }

  return new Error(code ? `${action} failed (${code}): ${message}` : `${action} failed: ${message}`);
}

export async function fetchRemoteCardSets(userId: string): Promise<AccountCardSetPayload[]> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("card_sets")
    .select("id, name, set_code, card_back_id, set_symbol_preset, set_symbol_id, set_symbol_uri, set_symbol_uses_rarity_treatment")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .returns<CardSetRow[]>();

  if (error) {
    if (isMissingCardSetSchemaColumnsError(error)) {
      return fetchLegacyRemoteCardSets(userId);
    }

    throw new Error(error.message);
  }

  const sets = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    code: row.set_code ?? undefined,
    cardBackId: row.card_back_id ?? undefined,
    setSymbolPreset: row.set_symbol_preset ?? undefined,
    setSymbolId: row.set_symbol_id ?? undefined,
    setSymbolUri: row.set_symbol_uri ?? undefined,
    setSymbolUsesRarityTreatment: row.set_symbol_uses_rarity_treatment ?? undefined,
    cards: [],
  }));

  if (sets.length === 0) {
    return sets;
  }

  return materializeRemoteCardSetPayloads(await hydrateRemoteSetCards(userId, sets));
}

async function fetchLegacyRemoteCardSets(userId: string): Promise<AccountCardSetPayload[]> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("card_sets")
    .select("id, name, card_back_id, cards")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .returns<LegacyCardSetRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return materializeRemoteCardSetPayloads((data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    cardBackId: row.card_back_id ?? undefined,
    cards: normalizeAccountCardSnapshots(row.cards),
  })));
}

export async function replaceRemoteCardSets(userId: string, sets: AccountCardSetPayload[]) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const remoteMediaSets = await persistRemoteCardSetPayloads(userId, sets);
  const normalizedSets = remoteMediaSets.map((set) => ({
    user_id: userId,
    id: set.id,
    name: set.name,
    set_code: set.code ?? null,
    card_back_id: set.cardBackId ?? null,
    set_symbol_preset: set.setSymbolPreset ?? null,
    set_symbol_id: set.setSymbolId ?? null,
    set_symbol_uri: set.setSymbolUri ?? null,
    set_symbol_uses_rarity_treatment: set.setSymbolUsesRarityTreatment ?? null,
  }));

  if (normalizedSets.length > 0) {
    const { error } = await supabase.from("card_sets").upsert(normalizedSets, {
      onConflict: "user_id,id",
    });

    if (error) {
      if (isMissingCardSetSchemaColumnsError(error)) {
        await replaceLegacyRemoteCardSets(userId, remoteMediaSets);
        return;
      }

      throw new Error(error.message);
    }
  }

  await replaceRemoteCards(userId, remoteMediaSets);
  await deleteStaleRemoteSets(userId, remoteMediaSets);
}

async function persistRemoteCardSetPayloads(
  userId: string,
  sets: AccountCardSetPayload[],
): Promise<AccountCardSetPayload[]> {
  return Promise.all(sets.map(async (set) => ({
    ...set,
    setSymbolUri: await persistRemoteImageUri(
      set.setSymbolUri,
      { kind: "account", userId },
      `set-${set.id}-default-symbol`,
    ),
    cards: await Promise.all(set.cards.map(async (snapshot) => ({
      ...snapshot,
      card: await persistRemoteCardDraftMedia(
        snapshot.card,
        { kind: "account", userId },
        `set-${set.id}-card-${snapshot.id}`,
      ),
    }))),
  })));
}

async function materializeRemoteCardSetPayloads(
  sets: AccountCardSetPayload[],
): Promise<AccountCardSetPayload[]> {
  return Promise.all(sets.map(async (set) => ({
    ...set,
    setSymbolUri: await materializeRemoteImageUriSafely(set.setSymbolUri, `set-${set.id}-default-symbol`),
    cards: await Promise.all(set.cards.map(async (snapshot) => ({
      ...snapshot,
      card: await materializeRemoteCardDraftMedia(snapshot.card),
    }))),
  })));
}

async function materializeRemoteImageUriSafely(uri: string | undefined, sourceLabel: string) {
  try {
    return await materializeRemoteImageUri(uri);
  } catch (error) {
    console.warn(`Unable to materialize Supabase media reference for ${sourceLabel}.`, error);
    return uri;
  }
}

// Inline base64 art/mask data URIs can be multiple MB each; storing them in the
// `cards.card` JSON bloats every feed query. The published rendered image is
// uploaded separately (image_url), so strip the heavy data: blobs before saving.
const COMPACTABLE_DATA_URI_KEYS = [
  "artUri",
  "artSubjectMaskUri",
  "backArtUri",
  "backArtSubjectMaskUri",
  "setSymbolUri",
  "watermarkUri",
] as const;

function compactCardForPublish(card: CardDraft): CardDraft {
  const next = { ...(card as Record<string, unknown>) };

  for (const key of COMPACTABLE_DATA_URI_KEYS) {
    const value = next[key];
    if (typeof value === "string" && value.startsWith("data:")) {
      delete next[key];
    }
  }

  return next as CardDraft;
}

export async function publishCommunityCard({
  id,
  userId,
  localSnapshotId,
  card,
  imageUrl,
}: PublishCommunityCardPayload): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const faceCard = getPrimaryFaceCard(card);

  const { error } = await supabase.from("cards").upsert({
    id,
    user_id: userId,
    local_snapshot_id: localSnapshotId ?? id,
    name: faceCard.name ?? "",
    type_line: faceCard.typeLine ?? "",
    rarity: card.rarity ?? null,
    colors: card.frameColors ?? [],
    frame_treatment: card.frameTreatment ?? null,
    image_url: imageUrl ?? null,
    card: compactCardForPublish(card),
    visibility: "public",
  }, {
    onConflict: "id",
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateRemoteCardRenderedImage({
  userId,
  localSnapshotId,
  card,
  imageUrl,
}: {
  userId: string;
  localSnapshotId: string;
  card: CardDraft;
  imageUrl: string;
}): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const publishableImageUrl = getPublishableRenderedImageUrl(imageUrl);

  if (!publishableImageUrl) {
    throw new Error("Only public HTTP(S) rendered card images can be saved to Supabase.");
  }

  const persistedCard = await persistRemoteCardDraftMedia(
    card,
    { kind: "account", userId },
    `set-card-${localSnapshotId}`,
  );
  const publishableCard = compactCardForPublish(persistedCard);
  const faceCard = getPrimaryFaceCard(persistedCard);
  const remoteCardId = getRemoteCardId(userId, localSnapshotId);
  const { data: updatedRows, error: updateError } = await supabase
    .from("cards")
    .update({
      name: faceCard.name ?? "",
      type_line: faceCard.typeLine ?? "",
      rarity: persistedCard.rarity ?? null,
      colors: persistedCard.frameColors ?? [],
      frame_treatment: persistedCard.frameTreatment ?? null,
      image_url: publishableImageUrl,
      card: publishableCard,
    })
    .eq("id", remoteCardId)
    .eq("user_id", userId)
    .select("id");

  if (updateError) {
    throw new Error(updateError.message);
  }

  if ((updatedRows ?? []).length > 0) {
    return;
  }

  const { error: upsertError } = await supabase.from("cards").upsert({
    id: remoteCardId,
    user_id: userId,
    local_snapshot_id: localSnapshotId,
    name: faceCard.name ?? "",
    type_line: faceCard.typeLine ?? "",
    rarity: persistedCard.rarity ?? null,
    colors: persistedCard.frameColors ?? [],
    frame_treatment: persistedCard.frameTreatment ?? null,
    image_url: publishableImageUrl,
    card: publishableCard,
    visibility: "public",
  }, {
    onConflict: "id",
  });

  if (upsertError) {
    throw new Error(upsertError.message);
  }
}

export async function attachCollaborationSetCardImage({
  setId,
  cardId,
  imageUrl,
}: {
  setId: string;
  cardId: string;
  imageUrl: string;
}): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const publishableImageUrl = getPublishableRenderedImageUrl(imageUrl);

  if (!publishableImageUrl) {
    throw new Error("Only public HTTP(S) rendered card images can be saved to Supabase.");
  }

  const { error } = await supabase.rpc("attach_collaboration_set_card_image", {
    p_set_id: setId,
    p_card_id: cardId,
    p_image_url: publishableImageUrl,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function uploadCommunityCardImage(
  userId: string,
  cardId: string,
  image: Blob | ArrayBuffer | Uint8Array,
  contentType = "image/jpeg",
): Promise<string> {
  return uploadCommunityCardImageToPath(
    getCommunityCardImageStoragePath(userId, cardId, `${Date.now()}`),
    image,
    contentType,
  );
}

export async function uploadCommunityCardImageToPath(
  path: string,
  image: Blob | ArrayBuffer | Uint8Array,
  contentType = "image/jpeg",
): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.storage
    .from("community-card-images")
    .upload(path, image, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from("community-card-images").getPublicUrl(path);
  return data.publicUrl || `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/community-card-images/${path}`;
}

export type ExistingCommunityCardImage = {
  publicUrl: string;
  lastModified?: string;
};

export type RemoteCardRenderedImage = {
  imageUrl: string;
  updatedAt?: string;
};

export async function fetchRemoteCardDraftForEditing(
  cardId: string,
  options: { mediaMode?: "data-uri" | "signed-url" } = {},
): Promise<CardDraft | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("cards")
    .select("card")
    .eq("id", cardId)
    .maybeSingle<{
      card: unknown;
    }>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || !isCardDraft(data.card)) {
    return null;
  }

  return materializeRemoteCardDraftMedia(data.card, { mode: options.mediaMode ?? "data-uri" });
}

export async function findRemoteCardRenderedImageById(
  cardId: string,
): Promise<RemoteCardRenderedImage | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("cards")
    .select("image_url, updated_at")
    .eq("id", cardId)
    .maybeSingle<{
      image_url: string | null;
      updated_at: string | null;
    }>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.image_url) {
    return null;
  }

  return {
    imageUrl: data.image_url,
    updatedAt: data.updated_at ?? undefined,
  };
}

export async function findRemoteCardRenderedImage(
  userId: string,
  localSnapshotId: string,
): Promise<RemoteCardRenderedImage | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("cards")
    .select("image_url, updated_at")
    .eq("id", getRemoteCardId(userId, localSnapshotId))
    .eq("user_id", userId)
    .maybeSingle<{
      image_url: string | null;
      updated_at: string | null;
    }>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.image_url) {
    return null;
  }

  return {
    imageUrl: data.image_url,
    updatedAt: data.updated_at ?? undefined,
  };
}

function getSafeCommunityCardImageId(cardId: string) {
  return cardId.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 160);
}

function getCommunityCardImageStoragePath(userId: string, cardId: string, fallbackCardId?: string) {
  const safeCardId = getSafeCommunityCardImageId(cardId) || fallbackCardId;

  if (!safeCardId) {
    throw new Error("Card image storage path requires a card id.");
  }

  return `${userId}/${safeCardId}.png`;
}

export function getCommunitySetCardImageStoragePath(setId: string, cardId: string) {
  const safeSetId = getSafeCommunityCardImageId(setId);
  const safeCardId = getSafeCommunityCardImageId(cardId);

  if (!safeSetId || !safeCardId) {
    throw new Error("Set card image storage path requires a set id and card id.");
  }

  return `sets/${safeSetId}/cards/${safeCardId}.png`;
}

export function getCommunityCardImagePublicUrl(userId: string, cardId: string): string | null {
  if (!supabase) {
    return null;
  }

  const path = getCommunityCardImageStoragePath(userId, cardId);
  return getCommunityCardImagePublicUrlForPath(path);
}

export function getCommunityCardImagePublicUrlForPath(path: string): string | null {
  if (!supabase) {
    return null;
  }

  const { data } = supabase.storage.from("community-card-images").getPublicUrl(path);

  return data.publicUrl || `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/community-card-images/${path}`;
}

type PublicImageProbeResult =
  | { kind: "exists"; lastModified?: string }
  | { kind: "missing" }
  | { kind: "unknown" };

export async function findExistingCommunityCardImage(
  userId: string,
  cardId: string,
): Promise<ExistingCommunityCardImage | null> {
  return findExistingCommunityCardImageByPath(getCommunityCardImageStoragePath(userId, cardId));
}

export async function findExistingCommunityCardImageByPath(
  path: string,
): Promise<ExistingCommunityCardImage | null> {
  const publicUrl = getCommunityCardImagePublicUrlForPath(path);

  if (!publicUrl) {
    return null;
  }

  const headProbe = await probePublicCommunityCardImage(publicUrl, "HEAD");

  if (headProbe.kind === "exists") {
    return {
      publicUrl,
      lastModified: headProbe.lastModified,
    };
  }

  if (headProbe.kind === "missing") {
    return null;
  }

  const getProbe = await probePublicCommunityCardImage(publicUrl, "GET");

  if (getProbe.kind !== "exists") {
    return null;
  }

  return {
    publicUrl,
    lastModified: getProbe.lastModified,
  };
}

export async function findExistingCommunityCardImages(
  userId: string,
  cardIds: string[],
  concurrency = 8,
): Promise<Map<string, ExistingCommunityCardImage>> {
  const uniqueCardIds = Array.from(new Set(cardIds.filter((cardId) => cardId.trim())));
  const results = new Map<string, ExistingCommunityCardImage>();
  let nextIndex = 0;

  async function probeNextImage() {
    while (nextIndex < uniqueCardIds.length) {
      const cardId = uniqueCardIds[nextIndex];
      nextIndex += 1;

      const existingImage = await findExistingCommunityCardImage(userId, cardId);

      if (existingImage) {
        results.set(cardId, existingImage);
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(Math.max(1, concurrency), uniqueCardIds.length) },
      () => probeNextImage(),
    ),
  );

  return results;
}

async function probePublicCommunityCardImage(
  publicUrl: string,
  method: "HEAD" | "GET",
): Promise<PublicImageProbeResult> {
  try {
    const response = await fetch(withCommunityCardImageCacheProbe(publicUrl), {
      method,
      cache: "no-store",
    });

    if (response.ok) {
      return {
        kind: "exists",
        lastModified: response.headers.get("last-modified") ?? undefined,
      };
    }

    if (response.status === 404) {
      return { kind: "missing" };
    }

    return method === "HEAD" ? { kind: "unknown" } : { kind: "missing" };
  } catch {
    return { kind: "unknown" };
  }
}

function withCommunityCardImageCacheProbe(publicUrl: string) {
  const separator = publicUrl.includes("?") ? "&" : "?";
  return `${publicUrl}${separator}cm_probe=${Date.now()}`;
}

async function replaceLegacyRemoteCardSets(userId: string, sets: AccountCardSetPayload[]) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const normalizedSets = sets.map((set) => ({
    user_id: userId,
    id: set.id,
    name: set.name,
    card_back_id: set.cardBackId ?? null,
    cards: set.cards,
  }));

  if (normalizedSets.length > 0) {
    const { error } = await supabase.from("card_sets").upsert(normalizedSets, {
      onConflict: "user_id,id",
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  await replaceRemoteCards(userId, sets);
  await deleteStaleRemoteSets(userId, sets);
}

async function hydrateRemoteSetCards(userId: string, sets: AccountCardSetPayload[]): Promise<AccountCardSetPayload[]> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("card_set_cards")
    .select("set_id, position, created_at, cards(id, local_snapshot_id, image_url, updated_at, card)")
    .eq("user_id", userId)
    .order("position", { ascending: true })
    .returns<CardSetMembershipRow[]>();

  if (error) {
    if (isMissingNormalizedSetMembershipError(error)) {
      return hydrateLegacyRemoteSetCards(userId, sets);
    }

    throw new Error(error.message);
  }

  const cardsBySetId = new Map<string, AccountCardSnapshotPayload[]>();

  for (const row of data ?? []) {
    const relatedCard = Array.isArray(row.cards) ? row.cards[0] : row.cards;

    if (!relatedCard || !isCardDraft(relatedCard.card)) {
      continue;
    }

    const snapshots = cardsBySetId.get(row.set_id) ?? [];
    snapshots.push({
      id: relatedCard.local_snapshot_id ?? relatedCard.id,
      savedAt: relatedCard.updated_at ?? row.created_at ?? undefined,
      renderedImageUrl: relatedCard.image_url ?? undefined,
      card: relatedCard.card,
    });
    cardsBySetId.set(row.set_id, snapshots);
  }

  return sets.map((set) => ({
    ...set,
    cards: cardsBySetId.get(set.id) ?? [],
  }));
}

async function hydrateLegacyRemoteSetCards(userId: string, sets: AccountCardSetPayload[]): Promise<AccountCardSetPayload[]> {
  const legacySets = await fetchLegacyRemoteCardSets(userId);
  const legacyCardsBySetId = new Map(legacySets.map((set) => [set.id, set.cards]));

  return sets.map((set) => ({
    ...set,
    cards: legacyCardsBySetId.get(set.id) ?? set.cards,
  }));
}

export async function fetchRemoteCustomSetSymbols(userId: string): Promise<AccountCustomSetSymbolPayload[]> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("custom_set_symbols")
    .select("id, label, uri, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<CustomSetSymbolRow[]>();

  if (error) {
    if (isMissingCustomSetSymbolsSchemaError(error)) {
      return [];
    }

    throw new Error(error.message);
  }

  return Promise.all((data ?? []).map(async (row) => ({
    id: row.id,
    label: row.label,
    uri: await materializeRemoteImageUriSafely(row.uri, `custom-set-symbol-${row.id}`) ?? row.uri,
    createdAt: row.created_at,
  })));
}

export async function replaceRemoteCustomSetSymbols(userId: string, symbols: AccountCustomSetSymbolPayload[]) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const remoteMediaSymbols = await Promise.all(symbols.map(async (symbol) => ({
    ...symbol,
    uri: await persistRemoteImageUri(symbol.uri, { kind: "account", userId }, `custom-set-symbol-${symbol.id}`) ?? symbol.uri,
  })));

  const normalizedSymbols = remoteMediaSymbols.map((symbol) => ({
    user_id: userId,
    id: symbol.id,
    label: symbol.label,
    uri: symbol.uri,
    created_at: symbol.createdAt ?? new Date().toISOString(),
  }));

  if (normalizedSymbols.length > 0) {
    const { error } = await supabase.from("custom_set_symbols").upsert(normalizedSymbols, {
      onConflict: "id",
    });

    if (error) {
      if (isMissingCustomSetSymbolsSchemaError(error)) {
        return;
      }

      throw new Error(error.message);
    }
  }

  const { data: remoteRows, error: fetchError } = await supabase
    .from("custom_set_symbols")
    .select("id")
    .eq("user_id", userId)
    .returns<Array<{ id: string }>>();

  if (fetchError) {
    if (isMissingCustomSetSymbolsSchemaError(fetchError)) {
      return;
    }

    throw new Error(fetchError.message);
  }

  const retainedIds = new Set(remoteMediaSymbols.map((symbol) => symbol.id));
  const staleIds = (remoteRows ?? []).map((row) => row.id).filter((id) => !retainedIds.has(id));

  if (staleIds.length > 0) {
    const { error } = await supabase.from("custom_set_symbols").delete().eq("user_id", userId).in("id", staleIds);

    if (error) {
      throw new Error(error.message);
    }
  }
}

async function deleteStaleRemoteSets(userId: string, sets: AccountCardSetPayload[]) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data: remoteRows, error: fetchError } = await supabase
    .from("card_sets")
    .select("id")
    .eq("user_id", userId)
    .returns<Array<{ id: string }>>();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const retainedIds = new Set(sets.map((set) => set.id));
  const staleIds = (remoteRows ?? []).map((row) => row.id).filter((id) => !retainedIds.has(id));

  for (const staleId of staleIds) {
    const { error } = await supabase.from("card_sets").delete().eq("user_id", userId).eq("id", staleId);

    if (error) {
      throw new Error(error.message);
    }
  }
}

function isMissingCardSetSchemaColumnsError(error: { code?: string; message?: string; details?: string | null }) {
  const message = `${error.code ?? ""} ${error.message ?? ""} ${error.details ?? ""}`;

  return (
    message.includes("set_code") ||
    message.includes("set_symbol_preset") ||
    message.includes("set_symbol_id") ||
    message.includes("set_symbol_uri") ||
    message.includes("set_symbol_uses_rarity_treatment")
  );
}

function isMissingCustomSetSymbolsSchemaError(error: { code?: string; message?: string; details?: string | null }) {
  const message = `${error.code ?? ""} ${error.message ?? ""} ${error.details ?? ""}`;

  return message.includes("custom_set_symbols") || message.includes("set_symbol_id");
}

function isMissingNormalizedSetMembershipError(error: { code?: string; message?: string; details?: string | null }) {
  const message = `${error.code ?? ""} ${error.message ?? ""} ${error.details ?? ""}`;

  return (
    message.includes("card_set_cards") ||
    message.includes("cards(") ||
    message.includes("set_id")
  );
}

export async function fetchCommunityCards(
  limit = 24,
  offset = 0,
  options: { sort?: CommunityCardFeedSort; hideSeen?: boolean } = {},
): Promise<CommunityCardPagePayload> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const pageSize = Math.max(1, Math.floor(limit));
  const start = Math.max(0, Math.floor(offset));
  const params = {
    p_limit: pageSize + 1,
    p_offset: start,
    p_sort: options.sort ?? "newest",
    p_hide_seen: Boolean(options.hideSeen),
  };

  let data: unknown;
  let error: unknown;

  try {
    const response = await supabase.rpc("community_card_feed", params);
    data = response.data;
    error = response.error;
  } catch (requestError) {
    throw createCommunityRequestError({
      action: "Community card feed",
      rpc: "community_card_feed",
      params,
      error: requestError,
    });
  }

  if (error) {
    throw createCommunityRequestError({
      action: "Community card feed",
      rpc: "community_card_feed",
      params,
      error,
    });
  }

  const rows = (data ?? []) as CommunityCardRow[];
  const pageRows = rows.slice(0, pageSize);
  const cards = await mapCommunityCardRows(pageRows);

  return {
    cards,
    hasMore: rows.length > pageSize,
    nextOffset: start + pageRows.length,
  };
}

export async function markCommunityCardsSeen(cardIds: string[]): Promise<void> {
  if (!supabase || cardIds.length === 0) {
    return;
  }

  const { error } = await supabase.rpc("mark_community_cards_seen", {
    p_card_ids: Array.from(new Set(cardIds)),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchCommunityFeaturedCard(): Promise<CommunityCardPayload | null> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  let data: unknown;
  let error: unknown;

  try {
    const response = await supabase.rpc("community_weekly_featured_card");
    data = response.data;
    error = response.error;
  } catch (requestError) {
    throw createCommunityRequestError({
      action: "Weekly featured card",
      rpc: "community_weekly_featured_card",
      error: requestError,
    });
  }

  if (error) {
    throw createCommunityRequestError({
      action: "Weekly featured card",
      rpc: "community_weekly_featured_card",
      error,
    });
  }

  return (await mapCommunityCardRows((data ?? []) as CommunityCardRow[]))[0] ?? null;
}

export async function fetchCommunitySets(limit = 24, offset = 0): Promise<CommunitySetPayload[]> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const params = {
    p_limit: Math.max(1, Math.floor(limit)),
    p_offset: Math.max(0, Math.floor(offset)),
  };
  let data: unknown;
  let error: unknown;

  try {
    const response = await supabase.rpc("community_set_directory", params);
    data = response.data;
    error = response.error;
  } catch (requestError) {
    throw createCommunityRequestError({
      action: "Community set directory",
      rpc: "community_set_directory",
      params,
      error: requestError,
    });
  }

  if (error) {
    throw createCommunityRequestError({
      action: "Community set directory",
      rpc: "community_set_directory",
      params,
      error,
    });
  }

  return ((data ?? []) as CommunitySetRow[]).map((row) => ({
    id: row.id,
    userId: row.user_id,
    authorName: row.author_name ?? getFallbackAuthorName(row.user_id),
    authorLevel: normalizePositiveInteger(row.author_level, 1),
    name: row.name,
    code: row.set_code ?? undefined,
    cardBackId: row.card_back_id ?? undefined,
    setSymbolPreset: row.set_symbol_preset ?? undefined,
    setSymbolUri: row.set_symbol_uri ?? undefined,
    setSymbolUsesRarityTreatment: row.set_symbol_uses_rarity_treatment ?? undefined,
    cardCount: normalizePositiveInteger(row.card_count, 0),
    followerCount: normalizePositiveInteger(row.follower_count, 0),
    followedByViewer: Boolean(row.followed_by_viewer),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function fetchCommunityNotifications(limit = 30): Promise<CommunityNotificationPayload[]> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("community_notifications")
    .select("id, kind, actor_user_id, set_id, card_id, metadata, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(Math.floor(limit), 80)));

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as CommunityNotificationRow[];
  const actorIds = Array.from(new Set(rows.flatMap((row) => row.actor_user_id ? [row.actor_user_id] : [])));
  const actorNamesById = new Map<string, string>();

  if (actorIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, display_name, username")
      .in("id", actorIds);

    if (profileError) {
      console.warn("Unable to hydrate community notification actors.", profileError);
    } else {
      for (const profile of profiles ?? []) {
        const row = profile as { id: string; display_name: string | null; username?: string | null };
        actorNamesById.set(row.id, row.username ? `@${row.username}` : row.display_name ?? getFallbackAuthorName(row.id));
      }
    }
  }

  return rows
    .filter((row): row is CommunityNotificationRow & { kind: CommunityNotificationKind } => (
      row.kind === "followed_set_card_added" ||
      row.kind === "set_followed" ||
      row.kind === "collaboration_set_joined"
    ))
    .map((row) => {
      const metadata = getCommunityNotificationMetadata(row.metadata);
      const actorName =
        metadata.actorName ??
        (row.actor_user_id ? actorNamesById.get(row.actor_user_id) ?? getFallbackAuthorName(row.actor_user_id) : "A viewer");

      return {
        id: row.id,
        kind: row.kind,
        actorUserId: row.actor_user_id ?? undefined,
        actorName,
        setId: row.set_id ?? undefined,
        setName: metadata.setName ?? "Untitled Set",
        cardId: row.card_id ?? undefined,
        cardName: metadata.cardName,
        readAt: row.read_at ?? undefined,
        createdAt: row.created_at,
      };
    });
}

export async function markCommunityNotificationsRead(notificationIds: string[]): Promise<void> {
  if (!supabase || notificationIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("community_notifications")
    .update({ read_at: new Date().toISOString() })
    .in("id", Array.from(new Set(notificationIds)));

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchCommunitySetCards(setId: string): Promise<CommunitySetCardPayload[]> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const params = {
    p_set_id: setId,
  };
  let data: unknown;
  let error: unknown;

  try {
    const response = await supabase.rpc("community_set_cards", params);
    data = response.data;
    error = response.error;
  } catch (requestError) {
    throw createCommunityRequestError({
      action: "Community set cards",
      rpc: "community_set_cards",
      params,
      error: requestError,
    });
  }

  if (error) {
    throw createCommunityRequestError({
      action: "Community set cards",
      rpc: "community_set_cards",
      params,
      error,
    });
  }

  return mapCommunityCardRows((data ?? []) as CommunityCardRow[]);
}

export async function fetchCollaborationSets(): Promise<CollaborationSetPayload[]> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error: acceptError } = await supabase.rpc("accept_collaboration_set_invites");

  if (acceptError) {
    throw new Error(acceptError.message);
  }

  const { data, error } = await supabase.rpc("collaboration_set_dashboard");

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CollaborationSetRow[]).map((row) => ({
    id: row.set_id,
    ownerUserId: row.owner_user_id,
    role: row.role === "owner" ? "owner" : "editor",
    name: row.set_name,
    code: row.set_code ?? undefined,
    cardBackId: row.card_back_id ?? undefined,
    setSymbolPreset: row.set_symbol_preset ?? undefined,
    setSymbolUri: row.set_symbol_uri ?? undefined,
    setSymbolUsesRarityTreatment: row.set_symbol_uses_rarity_treatment ?? undefined,
    ownerName: row.owner_name ?? getFallbackAuthorName(row.owner_user_id),
    memberCount: normalizePositiveInteger(row.member_count, 0),
    cardCount: normalizePositiveInteger(row.card_count, 0),
    commentCount: normalizePositiveInteger(row.comment_count, 0),
    pollCount: normalizePositiveInteger(row.poll_count, 0),
    openChecklistCount: normalizePositiveInteger(row.open_checklist_count, 0),
    updatedAt: row.updated_at,
  }));
}

export async function inviteCollaborationSetMember(setId: string, inviteIdentifier: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.rpc("invite_collaboration_set_member", {
    p_set_id: setId,
    p_invite_identifier: inviteIdentifier,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function createCollaborationSetInviteLink(setId: string): Promise<CollaborationSetInviteLinkPayload> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.rpc("create_collaboration_set_invite_link", {
    p_set_id: setId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = ((data ?? []) as CollaborationSetInviteLinkRow[])[0];

  if (!row?.invite_code) {
    throw new Error("Supabase did not return a collaboration invite code.");
  }

  return {
    inviteCode: row.invite_code,
    setId: row.set_id,
    setName: row.set_name ?? "Shared set",
    role: "editor",
    expiresAt: row.expires_at ?? undefined,
  };
}

export async function previewCollaborationSetInviteCode(
  inviteCode: string,
): Promise<CollaborationSetInvitePreviewPayload> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.rpc("preview_collaboration_set_invite_link", {
    p_invite_code: inviteCode,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = ((data ?? []) as CollaborationSetInvitePreviewRow[])[0];

  if (!row?.set_id) {
    throw new Error("Supabase did not return that collaboration invite.");
  }

  return {
    setId: row.set_id,
    setName: row.set_name ?? "Shared set",
    ownerUserId: row.owner_user_id,
    ownerName: row.owner_name ?? "another user",
    role: "editor",
    expiresAt: row.expires_at ?? undefined,
  };
}

export async function redeemCollaborationSetInviteCode(
  inviteCode: string,
): Promise<CollaborationSetInviteRedemptionPayload> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.rpc("redeem_collaboration_set_invite_link", {
    p_invite_code: inviteCode,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = ((data ?? []) as CollaborationSetInviteRedemptionRow[])[0];

  if (!row?.set_id) {
    throw new Error("Supabase did not return the redeemed collaboration set.");
  }

  return {
    setId: row.set_id,
    setName: row.set_name ?? "Shared set",
    ownerUserId: row.owner_user_id,
    role: row.role === "owner" ? "owner" : "editor",
  };
}

export async function searchCollaborationInviteProfiles(query: string): Promise<CollaborationInviteProfileSuggestion[]> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.rpc("search_collaboration_invite_profiles", {
    p_query: query,
    p_limit: 8,
  });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CollaborationInviteProfileSuggestionRow[])
    .filter((row) => row.username)
    .map((row) => ({
      userId: row.user_id,
      username: row.username ?? "",
      displayName: row.display_name ?? undefined,
    }));
}

export async function fetchCollaborationSetPendingInvites(setId: string): Promise<CollaborationPendingInvitePayload[]> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.rpc("collaboration_set_pending_invites", {
    p_set_id: setId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CollaborationPendingInviteRow[])
    .filter((row) => row.invited_email)
    .map((row) => ({
      id: row.id,
      invitedEmail: row.invited_email ?? "",
      role: row.role === "owner" ? "owner" : "editor",
      createdAt: row.created_at,
    }));
}

export async function fetchCollaborationSetMembers(setId: string): Promise<CollaborationSetMemberPayload[]> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.rpc("collaboration_set_member_list", {
    p_set_id: setId,
  });

  if (!error) {
    return ((data ?? []) as CollaborationSetMemberRow[])
      .filter((row) => row.user_id)
      .map((row) => ({
        id: row.id,
        userId: row.user_id,
        role: row.role === "owner" ? "owner" : "editor",
        username: row.username ?? undefined,
        displayName: row.display_name ?? undefined,
        memberName: row.username ? `@${row.username}` : row.display_name ?? row.member_name ?? getFallbackAuthorName(row.user_id),
        acceptedAt: row.accepted_at ?? undefined,
        createdAt: row.created_at,
      }));
  }

  const missingRpc =
    getSupabaseErrorCode(error) === "PGRST202" ||
    getSupabaseErrorCode(error) === "PGRST205" ||
    getErrorMessage(error).toLowerCase().includes("could not find the function");

  if (!missingRpc) {
    throw new Error(error.message);
  }

  const { data: fallbackData, error: fallbackError } = await supabase
    .from("collaboration_set_members")
    .select("id, user_id, role, accepted_at, created_at")
    .eq("set_id", setId)
    .eq("status", "accepted")
    .not("user_id", "is", null)
    .order("role", { ascending: false })
    .order("created_at", { ascending: true });

  if (fallbackError) {
    throw new Error(fallbackError.message);
  }

  return ((fallbackData ?? []) as Array<{
    id: string;
    user_id: string | null;
    role: string | null;
    accepted_at: string | null;
    created_at: string;
  }>)
    .filter((row): row is {
      id: string;
      user_id: string;
      role: string | null;
      accepted_at: string | null;
      created_at: string;
    } => Boolean(row.user_id))
    .map((row) => ({
      id: row.id,
      userId: row.user_id,
      role: row.role === "owner" ? "owner" : "editor",
      memberName: getFallbackAuthorName(row.user_id),
      acceptedAt: row.accepted_at ?? undefined,
      createdAt: row.created_at,
    }));
}

export async function fetchCollaborationSetCards(setId: string): Promise<CommunitySetCardPayload[]> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.rpc("collaboration_set_cards", {
    p_set_id: setId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return mapCommunityCardRows((data ?? []) as CommunityCardRow[]);
}

export async function fetchCollaborationSetCardDraftForEditing(
  setId: string,
  cardId: string,
  options: { mediaMode?: "data-uri" | "signed-url" } = {},
): Promise<CardDraft | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.rpc("collaboration_set_cards", {
    p_set_id: setId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = ((data ?? []) as CommunityCardRow[]).find((entry) => entry.id === cardId);

  if (!row || !isCardDraft(row.card)) {
    return null;
  }

  return materializeRemoteCardDraftMedia(row.card, { mode: options.mediaMode ?? "data-uri" });
}

export async function addCollaborationSetCard(payload: {
  setId: string;
  localSnapshotId: string;
  card: CardDraft;
}): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.rpc("add_collaboration_set_card", {
    p_set_id: payload.setId,
    p_local_snapshot_id: payload.localSnapshotId,
    p_card: compactCardForPublish(
      await persistRemoteCardDraftMedia(
        payload.card,
        { kind: "collaboration-set", setId: payload.setId },
        `collaboration-set-${payload.setId}-${payload.localSnapshotId}`,
      ),
    ),
  });

  if (error) {
    throw new Error(error.message);
  }

  return String(data);
}

export async function fetchCollaborationSetComments(setId: string): Promise<CollaborationSetCommentPayload[]> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.rpc("collaboration_set_comments", {
    p_set_id: setId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CollaborationSetCommentRow[]).map((row) => ({
    id: row.id,
    setId: row.set_id,
    cardId: row.card_id ?? undefined,
    userId: row.user_id,
    authorName: row.author_name ?? getFallbackAuthorName(row.user_id),
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function addCollaborationSetComment(setId: string, body: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.rpc("add_collaboration_set_comment", {
    p_set_id: setId,
    p_body: body,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchCollaborationSetPolls(setId: string): Promise<CommunityPollPayload[]> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.rpc("collaboration_set_poll_list", {
    p_set_id: setId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = ((data ?? []) as Omit<CommunityPollRow, "description">[]).map((row) => ({
    ...row,
    description: null,
  })) as CommunityPollRow[];

  return mapCommunityPollRows(rows);
}

export async function createCollaborationSetPoll(payload: {
  setId: string;
  title: string;
  selectionType: CommunityPollSelectionType;
  options: string[];
}): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.rpc("create_collaboration_set_poll", {
    p_set_id: payload.setId,
    p_title: payload.title,
    p_selection_type: payload.selectionType,
    p_options: payload.options,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function submitCollaborationSetPollVote(pollId: string, optionIds: string[]): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.rpc("submit_collaboration_set_poll_vote", {
    p_poll_id: pollId,
    p_option_ids: optionIds,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchCollaborationSetChecklist(
  setId: string,
): Promise<CollaborationSetChecklistItemPayload[]> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.rpc("collaboration_set_checklist", {
    p_set_id: setId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CollaborationSetChecklistItemRow[]).map((row) => ({
    id: row.id,
    setId: row.set_id,
    userId: row.user_id,
    authorName: row.author_name ?? getFallbackAuthorName(row.user_id),
    body: row.body,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function addCollaborationSetChecklistItem(setId: string, body: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.rpc("add_collaboration_set_checklist_item", {
    p_set_id: setId,
    p_body: body,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function setCollaborationSetChecklistItemCompleted(
  itemId: string,
  completed: boolean,
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.rpc("set_collaboration_set_checklist_item_completed", {
    p_item_id: itemId,
    p_completed: completed,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function toggleCommunityCardLike(cardId: string, liked: boolean): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  const userId = authData.user?.id;

  if (!userId) {
    throw new Error("Sign in to like community cards.");
  }

  if (liked) {
    const { error } = await supabase
      .from("community_card_likes")
      .upsert({ card_id: cardId, user_id: userId }, { onConflict: "card_id,user_id" });

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabase
    .from("community_card_likes")
    .delete()
    .eq("card_id", cardId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function toggleCommunitySetFollow(setId: string, followed: boolean): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  const viewerUserId = authData.user?.id;

  if (!viewerUserId) {
    throw new Error("Sign in to follow community sets.");
  }

  if (followed) {
    const { error } = await supabase
      .from("community_set_follows")
      .upsert(
        { set_id: setId, viewer_user_id: viewerUserId },
        { onConflict: "set_id,viewer_user_id" },
      );

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabase
    .from("community_set_follows")
    .delete()
    .eq("set_id", setId)
    .eq("viewer_user_id", viewerUserId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function addCommunityCardComment(cardId: string, body: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  const userId = authData.user?.id;

  if (!userId) {
    throw new Error("Sign in to comment on community cards.");
  }

  const { error } = await supabase
    .from("community_card_comments")
    .insert({ card_id: cardId, user_id: userId, body: body.trim().slice(0, 500) });

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchCommunityCardComments(cardId: string): Promise<CommunityCardCommentPayload[]> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data: authData } = await supabase.auth.getUser();
  const viewerId = authData.user?.id ?? null;
  const { data, error } = await supabase
    .from("community_card_comments")
    .select("id, card_id, user_id, body, created_at, updated_at")
    .eq("card_id", cardId)
    .order("created_at", { ascending: true })
    .returns<CommunityCardCommentRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapCommunityCommentRow(row, viewerId));
}

export async function saveCommunityCardComment(
  cardId: string,
  body: string,
  commentId?: string,
): Promise<CommunityCardCommentPayload> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const trimmedBody = body.trim().slice(0, 500);

  if (!trimmedBody) {
    throw new Error("Comment cannot be empty.");
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  const userId = authData.user?.id;

  if (!userId) {
    throw new Error("Sign in to comment on community cards.");
  }

  const query = commentId
    ? supabase
        .from("community_card_comments")
        .update({ body: trimmedBody })
        .eq("id", commentId)
        .eq("user_id", userId)
        .select("id, card_id, user_id, body, created_at, updated_at")
        .single()
    : supabase
        .from("community_card_comments")
        .insert({ card_id: cardId, user_id: userId, body: trimmedBody })
        .select("id, card_id, user_id, body, created_at, updated_at")
        .single();

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return mapCommunityCommentRow(data as CommunityCardCommentRow, userId);
}

export async function updateCommunityDisplayName(displayName: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.rpc("set_profile_display_name", {
    p_display_name: displayName.trim().slice(0, 60),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchCommunityPolls(): Promise<CommunityPollPayload[]> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.rpc("community_poll_list");

  if (error) {
    throw new Error(error.message);
  }

  return mapCommunityPollRows((data ?? []) as CommunityPollRow[]);
}

export async function createCommunityPoll(payload: {
  title: string;
  description?: string;
  selectionType: CommunityPollSelectionType;
  options: string[];
}): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.rpc("create_community_poll", {
    p_title: payload.title,
    p_description: payload.description ?? "",
    p_selection_type: payload.selectionType,
    p_options: payload.options,
  });

  if (error) {
    throw new Error(error.message);
  }

  return String(data);
}

export async function setCommunityPollStatus(
  pollId: string,
  status: CommunityPollStatus,
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.rpc("set_community_poll_status", {
    p_poll_id: pollId,
    p_status: status,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function submitCommunityPollVote(pollId: string, optionIds: string[]): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.rpc("submit_community_poll_vote", {
    p_poll_id: pollId,
    p_option_ids: optionIds,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function uploadCommunityFeedbackScreenshot(
  userId: string,
  uri: string,
  index: number,
): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error("CardMagic could not read that screenshot.");
  }

  const blob = await response.blob();
  const mimeType = normalizeFeedbackScreenshotMimeType(blob.type, uri);
  const extension = getFeedbackScreenshotExtension(mimeType, uri);
  const path = `${userId}/${Date.now()}-${Math.max(0, index)}.${extension}`;
  const { error } = await supabase.storage
    .from("community-feedback")
    .upload(path, blob, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}

export async function submitCommunityFeedback(payload: {
  feedbackType: CommunityFeedbackType;
  body: string;
  appVersion: string;
  deviceInfo: CommunityFeedbackDeviceInfo;
  screenshotPaths: string[];
}): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const trimmedBody = payload.body.trim();

  if (trimmedBody.length < 4) {
    throw new Error("Add a little more detail before submitting feedback.");
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  const userId = authData.user?.id;

  if (!userId) {
    throw new Error("Sign in to send feedback.");
  }

  const { error } = await supabase.from("community_feedback").insert({
    user_id: userId,
    feedback_type: payload.feedbackType,
    body: trimmedBody.slice(0, 4000),
    app_version: payload.appVersion,
    device_info: payload.deviceInfo,
    screenshot_paths: payload.screenshotPaths,
  });

  if (error) {
    throw new Error(error.message);
  }
}

function normalizeFeedbackScreenshotMimeType(mimeType: string | undefined, uri: string) {
  const normalizedMimeType = mimeType?.toLowerCase();

  if (
    normalizedMimeType === "image/png" ||
    normalizedMimeType === "image/jpeg" ||
    normalizedMimeType === "image/webp" ||
    normalizedMimeType === "image/heic" ||
    normalizedMimeType === "image/heif"
  ) {
    return normalizedMimeType;
  }

  const extension = uri.split("?")[0]?.split(".").pop()?.toLowerCase();

  if (extension === "png") {
    return "image/png";
  }

  if (extension === "webp") {
    return "image/webp";
  }

  if (extension === "heic") {
    return "image/heic";
  }

  if (extension === "heif") {
    return "image/heif";
  }

  return "image/jpeg";
}

function getFeedbackScreenshotExtension(mimeType: string, uri: string) {
  const extension = uri.split("?")[0]?.split(".").pop()?.toLowerCase();

  if (extension === "png" || extension === "webp" || extension === "heic" || extension === "heif") {
    return extension;
  }

  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  if (mimeType === "image/heic") {
    return "heic";
  }

  if (mimeType === "image/heif") {
    return "heif";
  }

  return "jpg";
}

type CommunityCardRowMapOptions = {
  materializeCardMedia?: boolean;
};

async function mapCommunityCardRows(
  rows: CommunityCardRow[],
  options: CommunityCardRowMapOptions = {},
): Promise<CommunityCardPayload[]> {
  const mappedRows = await Promise.all(rows.map((row) => mapCommunityCardRow(row, options)));

  return mappedRows.flat();
}

async function mapCommunityCardRow(
  row: CommunityCardRow,
  options: CommunityCardRowMapOptions,
): Promise<CommunityCardPayload[]> {
  if (!isCardDraft(row.card)) {
    return [];
  }

  const imageUrl = row.image_url ?? undefined;
  const card = options.materializeCardMedia || !imageUrl
    ? await materializeRemoteCardDraftMedia(row.card)
    : compactCardForPublish(row.card);

  return [{
    id: row.id,
    userId: row.user_id,
    authorName: row.author_name ?? getFallbackAuthorName(row.user_id),
    authorLevel: normalizePositiveInteger(row.author_level, 1),
    name: row.name ?? card.name ?? "",
    typeLine: row.type_line ?? card.typeLine ?? "",
    rarity: row.rarity ?? undefined,
    colors: Array.isArray(row.colors) ? row.colors : [],
    frameTreatment: row.frame_treatment ?? undefined,
    imageUrl,
    card,
    likeCount: normalizePositiveInteger(row.like_count, 0),
    commentCount: normalizePositiveInteger(row.comment_count, 0),
    likedByViewer: Boolean(row.liked_by_viewer),
    followedByViewer: Boolean(row.followed_by_viewer),
    seenByViewer: Boolean(row.seen_by_viewer),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }];
}

function mapCommunityCommentRow(row: CommunityCardCommentRow, viewerId: string | null): CommunityCardCommentPayload {
  const editableByViewer = Boolean(viewerId && row.user_id === viewerId);

  return {
    id: row.id,
    cardId: row.card_id,
    userId: row.user_id,
    authorName: editableByViewer ? "You" : getFallbackAuthorName(row.user_id),
    body: row.body,
    editableByViewer,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCommunityPollRows(rows: CommunityPollRow[]): CommunityPollPayload[] {
  const polls = new Map<string, CommunityPollPayload>();

  rows.forEach((row) => {
    const poll = polls.get(row.poll_id) ?? {
      id: row.poll_id,
      title: row.title,
      description: row.description ?? undefined,
      selectionType: row.selection_type === "multiple" ? "multiple" : "single",
      status: row.status === "closed" ? "closed" : "open",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      closedAt: row.closed_at ?? undefined,
      options: [],
    };

    poll.options.push({
      id: row.option_id,
      label: row.option_label,
      position: normalizePositiveInteger(row.option_position, 0),
      voteCount: normalizePositiveInteger(row.vote_count, 0),
      selectedByViewer: Boolean(row.selected_by_viewer),
    });
    polls.set(row.poll_id, poll);
  });

  return Array.from(polls.values()).map((poll) => ({
    ...poll,
    options: [...poll.options].sort((left, right) => left.position - right.position),
  }));
}

function normalizePositiveInteger(value: unknown, fallback: number) {
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : NaN;
  return Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : fallback;
}

function getFallbackAuthorName(userId: string) {
  return `Creator ${userId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

async function replaceRemoteCards(userId: string, sets: AccountCardSetPayload[]) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const cardInputs = sets.flatMap((set) =>
    set.cards.map((snapshot) => ({
      snapshot,
      remoteCardId: getRemoteCardId(userId, snapshot.id),
    })),
  );
  const existingImageUrlsByCardId = await fetchExistingRemoteCardImageUrls(
    userId,
    cardInputs.map((input) => input.remoteCardId),
  );

  const cardRows = cardInputs.map(({ snapshot, remoteCardId }) => {
    const card = snapshot.card;
    const faceCard = getPrimaryFaceCard(card);
    const renderedImageUrl = getPublishableRenderedImageUrl(snapshot.renderedImageUrl);
    const persistedImageUrl = renderedImageUrl ?? existingImageUrlsByCardId.get(remoteCardId) ?? null;

    return {
      id: remoteCardId,
      user_id: userId,
      local_snapshot_id: snapshot.id,
      name: faceCard.name ?? "",
      type_line: faceCard.typeLine ?? "",
      rarity: card.rarity ?? null,
      colors: card.frameColors ?? [],
      frame_treatment: card.frameTreatment ?? null,
      image_url: persistedImageUrl,
      card: persistedImageUrl ? compactCardForPublish(card) : card,
      visibility: "public",
    };
  });

  if (cardRows.length > 0) {
    const { error } = await supabase.from("cards").upsert(cardRows, {
      onConflict: "id",
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  const joinRows = sets.flatMap((set) =>
    set.cards.map((snapshot, index) => ({
      user_id: userId,
      set_id: set.id,
      card_id: getRemoteCardId(userId, snapshot.id),
      position: index,
    })),
  );

  if (joinRows.length > 0) {
    const { error } = await supabase.from("card_set_cards").upsert(joinRows, {
      onConflict: "user_id,set_id,card_id",
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  await deleteStaleRemoteCardSetMemberships(
    userId,
    new Set(joinRows.map((row) => getRemoteCardSetMembershipKey(row.set_id, row.card_id))),
  );

  const retainedCardIds = new Set(cardRows.map((row) => row.id));
  const { data: remoteCardRows, error: fetchCardsError } = await supabase
    .from("cards")
    .select("id")
    .eq("user_id", userId)
    .returns<Array<{ id: string }>>();

  if (fetchCardsError) {
    throw new Error(fetchCardsError.message);
  }

  const staleCardIds = (remoteCardRows ?? []).map((row) => row.id).filter((id) => !retainedCardIds.has(id));

  if (staleCardIds.length > 0) {
    const { error } = await supabase.from("cards").delete().eq("user_id", userId).in("id", staleCardIds);

    if (error) {
      throw new Error(error.message);
    }
  }
}

async function fetchExistingRemoteCardImageUrls(userId: string, remoteCardIds: string[]) {
  if (!supabase || remoteCardIds.length === 0) {
    return new Map<string, string>();
  }

  const uniqueRemoteCardIds = Array.from(new Set(remoteCardIds));
  const imageUrlsByCardId = new Map<string, string>();

  for (const idChunk of chunkArray(uniqueRemoteCardIds, 200)) {
    const { data, error } = await supabase
      .from("cards")
      .select("id, image_url")
      .eq("user_id", userId)
      .in("id", idChunk)
      .returns<Array<{ id: string; image_url: string | null }>>();

    if (error) {
      throw new Error(error.message);
    }

    for (const row of data ?? []) {
      if (row.image_url) {
        imageUrlsByCardId.set(row.id, row.image_url);
      }
    }
  }

  return imageUrlsByCardId;
}

async function deleteStaleRemoteCardSetMemberships(userId: string, retainedMembershipKeys: Set<string>) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("card_set_cards")
    .select("set_id, card_id")
    .eq("user_id", userId)
    .returns<Array<{ set_id: string; card_id: string }>>();

  if (error) {
    throw new Error(error.message);
  }

  const staleCardIdsBySetId = new Map<string, string[]>();

  for (const row of data ?? []) {
    if (retainedMembershipKeys.has(getRemoteCardSetMembershipKey(row.set_id, row.card_id))) {
      continue;
    }

    const staleCardIds = staleCardIdsBySetId.get(row.set_id) ?? [];
    staleCardIds.push(row.card_id);
    staleCardIdsBySetId.set(row.set_id, staleCardIds);
  }

  for (const [setId, staleCardIds] of staleCardIdsBySetId) {
    for (const chunk of chunkArray(staleCardIds, 100)) {
      const { error: deleteError } = await supabase
        .from("card_set_cards")
        .delete()
        .eq("user_id", userId)
        .eq("set_id", setId)
        .in("card_id", chunk);

      if (deleteError) {
        throw new Error(deleteError.message);
      }
    }
  }
}

function getRemoteCardSetMembershipKey(setId: string, cardId: string) {
  return `${setId}:${cardId}`;
}

function chunkArray<T>(values: T[], chunkSize: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }

  return chunks;
}

function normalizeAccountCardSnapshots(value: unknown): AccountCardSnapshotPayload[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") {
      return [];
    }

    const record = candidate as Partial<AccountCardSnapshotPayload>;

    if (typeof record.id !== "string" || !isCardDraft(record.card)) {
      return [];
    }

    return [{
      id: record.id,
      savedAt: typeof record.savedAt === "string" ? record.savedAt : undefined,
      renderedImageUrl: typeof record.renderedImageUrl === "string" ? record.renderedImageUrl : undefined,
      card: record.card,
    }];
  });
}

function getRemoteCardId(userId: string, localSnapshotId: string) {
  return `${userId}:${localSnapshotId}`;
}

function getPublishableRenderedImageUrl(imageUrl: string | undefined) {
  return typeof imageUrl === "string" && /^https?:\/\//i.test(imageUrl) ? imageUrl : null;
}

function getPrimaryFaceCard(card: CardDraft) {
  return card.dfcFace === "back"
    ? {
        name: card.backName ?? card.name,
        typeLine: card.backTypeLine ?? card.typeLine,
      }
    : card;
}

function isCardDraft(value: unknown): value is CardDraft {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CardDraft>;

  return (
    typeof candidate.name === "string" &&
    typeof candidate.typeLine === "string" &&
    typeof candidate.rulesText === "string" &&
    typeof candidate.rarity === "string"
  );
}
