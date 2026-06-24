import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import type { CollaborationSetPayload } from "@/lib/account-sets";
import type { CardBackId, CardDraft } from "@/types/card";

// Core app-domain types shared between App.tsx and feature component modules
// (e.g. the community panel). Extracted from App.tsx so component clusters can
// import them without depending on the root entry file.

export type MainScrollBoundaryHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => void;

export type MainScrollWindow = {
  offsetY: number;
  viewportHeight: number;
};

export type SetCardSnapshot = {
  id: string;
  savedAt: string;
  renderedImageUrl?: string;
  remoteCardId?: string;
  remoteImageOwnerUserId?: string;
  authorName?: string;
  card: CardDraft;
};

export type CardSet = {
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

export type PreviewTypeFrame = NonNullable<CardDraft["typeFrame"]> | "standard";
