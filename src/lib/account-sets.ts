import { supabase, supabaseUrl } from "@/lib/supabase";
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
  createdAt: string;
  updatedAt: string;
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
  created_at: string;
  updated_at: string;
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

type CardSetMembershipRow = {
  set_id: string;
  position: number | null;
  created_at: string | null;
  cards: {
    id: string;
    local_snapshot_id: string | null;
    card: unknown;
  } | Array<{
    id: string;
    local_snapshot_id: string | null;
    card: unknown;
  }> | null;
};

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

  return hydrateRemoteSetCards(userId, sets);
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

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    cardBackId: row.card_back_id ?? undefined,
    cards: normalizeAccountCardSnapshots(row.cards),
  }));
}

export async function replaceRemoteCardSets(userId: string, sets: AccountCardSetPayload[]) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const normalizedSets = sets.map((set) => ({
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
        await replaceLegacyRemoteCardSets(userId, sets);
        return;
      }

      throw new Error(error.message);
    }
  }

  await replaceRemoteCards(userId, sets);
  await deleteStaleRemoteSets(userId, sets);
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
    card,
    visibility: "public",
  }, {
    onConflict: "id",
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function uploadCommunityCardImage(
  userId: string,
  cardId: string,
  image: Blob | ArrayBuffer | Uint8Array,
): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const safeCardId = cardId.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 160);
  const path = `${userId}/${safeCardId || Date.now()}.png`;
  const { error } = await supabase.storage
    .from("community-card-images")
    .upload(path, image, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from("community-card-images").getPublicUrl(path);
  return data.publicUrl || `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/community-card-images/${path}`;
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
    .select("set_id, position, created_at, cards(id, local_snapshot_id, card)")
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
      savedAt: row.created_at ?? undefined,
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

  return (data ?? []).map((row) => ({
    id: row.id,
    label: row.label,
    uri: row.uri,
    createdAt: row.created_at,
  }));
}

export async function replaceRemoteCustomSetSymbols(userId: string, symbols: AccountCustomSetSymbolPayload[]) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const normalizedSymbols = symbols.map((symbol) => ({
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

  const retainedIds = new Set(symbols.map((symbol) => symbol.id));
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

  const { data, error } = await supabase
    .rpc("community_card_feed", {
      p_limit: pageSize + 1,
      p_offset: start,
      p_sort: options.sort ?? "newest",
      p_hide_seen: Boolean(options.hideSeen),
    });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as CommunityCardRow[];
  const pageRows = rows.slice(0, pageSize);
  const cards = pageRows.flatMap(mapCommunityCardRow);

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

  const { data, error } = await supabase
    .rpc("community_weekly_featured_card");

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CommunityCardRow[]).flatMap(mapCommunityCardRow)[0] ?? null;
}

export async function fetchCommunitySets(limit = 24, offset = 0): Promise<CommunitySetPayload[]> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .rpc("community_set_directory", {
      p_limit: Math.max(1, Math.floor(limit)),
      p_offset: Math.max(0, Math.floor(offset)),
    });

  if (error) {
    throw new Error(error.message);
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
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

export async function toggleCommunityUserFollow(userId: string, followed: boolean): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  const followerUserId = authData.user?.id;

  if (!followerUserId) {
    throw new Error("Sign in to follow community creators.");
  }

  if (followerUserId === userId) {
    throw new Error("You cannot follow your own account.");
  }

  if (followed) {
    const { error } = await supabase
      .from("community_user_follows")
      .upsert(
        { follower_user_id: followerUserId, followed_user_id: userId },
        { onConflict: "follower_user_id,followed_user_id" },
      );

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabase
    .from("community_user_follows")
    .delete()
    .eq("follower_user_id", followerUserId)
    .eq("followed_user_id", userId);

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

function mapCommunityCardRow(row: CommunityCardRow): CommunityCardPayload[] {
  if (!isCardDraft(row.card)) {
    return [];
  }

  return [{
    id: row.id,
    userId: row.user_id,
    authorName: row.author_name ?? getFallbackAuthorName(row.user_id),
    authorLevel: normalizePositiveInteger(row.author_level, 1),
    name: row.name ?? row.card.name ?? "",
    typeLine: row.type_line ?? row.card.typeLine ?? "",
    rarity: row.rarity ?? undefined,
    colors: Array.isArray(row.colors) ? row.colors : [],
    frameTreatment: row.frame_treatment ?? undefined,
    imageUrl: row.image_url ?? undefined,
    card: row.card,
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

  const cardRows = sets.flatMap((set) =>
    set.cards.map((snapshot) => {
      const card = snapshot.card;
      const faceCard = getPrimaryFaceCard(card);

      return {
        id: getRemoteCardId(userId, snapshot.id),
        user_id: userId,
        local_snapshot_id: snapshot.id,
        name: faceCard.name ?? "",
        type_line: faceCard.typeLine ?? "",
        rarity: card.rarity ?? null,
        colors: card.frameColors ?? [],
        frame_treatment: card.frameTreatment ?? null,
        image_url: null,
        card,
        visibility: "public",
      };
    }),
  );

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

  const { error: deleteJoinError } = await supabase.from("card_set_cards").delete().eq("user_id", userId);

  if (deleteJoinError) {
    throw new Error(deleteJoinError.message);
  }

  if (joinRows.length > 0) {
    const { error } = await supabase.from("card_set_cards").upsert(joinRows, {
      onConflict: "user_id,set_id,card_id",
    });

    if (error) {
      throw new Error(error.message);
    }
  }

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
      card: record.card,
    }];
  });
}

function getRemoteCardId(userId: string, localSnapshotId: string) {
  return `${userId}:${localSnapshotId}`;
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
