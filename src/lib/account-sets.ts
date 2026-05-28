import { supabase } from "@/lib/supabase";
import type { CardDraft } from "@/types/card";

export type AccountCardSetPayload = {
  id: string;
  name: string;
  code?: string;
  cardBackId?: string;
  setSymbolPreset?: string;
  setSymbolUri?: string;
  setSymbolUsesRarityTreatment?: boolean;
  cards: AccountCardSnapshotPayload[];
};

export type AccountCardSnapshotPayload = {
  id: string;
  savedAt?: string;
  card: CardDraft;
};

export type CommunityCardPayload = {
  id: string;
  userId: string;
  name: string;
  typeLine: string;
  rarity?: string;
  colors: string[];
  frameTreatment?: string;
  card: CardDraft;
  createdAt: string;
  updatedAt: string;
};

type CardSetRow = {
  id: string;
  name: string;
  set_code: string | null;
  card_back_id: string | null;
  set_symbol_preset: string | null;
  set_symbol_uri: string | null;
  set_symbol_uses_rarity_treatment: boolean | null;
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
  name: string | null;
  type_line: string | null;
  rarity: string | null;
  colors: string[] | null;
  frame_treatment: string | null;
  card: unknown;
  created_at: string;
  updated_at: string;
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
    .select("id, name, set_code, card_back_id, set_symbol_preset, set_symbol_uri, set_symbol_uses_rarity_treatment")
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
    message.includes("set_symbol_uri") ||
    message.includes("set_symbol_uses_rarity_treatment")
  );
}

function isMissingNormalizedSetMembershipError(error: { code?: string; message?: string; details?: string | null }) {
  const message = `${error.code ?? ""} ${error.message ?? ""} ${error.details ?? ""}`;

  return (
    message.includes("card_set_cards") ||
    message.includes("cards(") ||
    message.includes("set_id")
  );
}

export async function fetchCommunityCards(limit = 24): Promise<CommunityCardPayload[]> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("cards")
    .select("id, user_id, name, type_line, rarity, colors, frame_treatment, card, created_at, updated_at")
    .eq("visibility", "public")
    .order("updated_at", { ascending: false })
    .limit(limit)
    .returns<CommunityCardRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).flatMap((row) => {
    if (!isCardDraft(row.card)) {
      return [];
    }

    return [{
      id: row.id,
      userId: row.user_id,
      name: row.name ?? row.card.name ?? "",
      typeLine: row.type_line ?? row.card.typeLine ?? "",
      rarity: row.rarity ?? undefined,
      colors: Array.isArray(row.colors) ? row.colors : [],
      frameTreatment: row.frame_treatment ?? undefined,
      card: row.card,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }];
  });
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
