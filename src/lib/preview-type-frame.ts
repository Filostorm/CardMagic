import { isDfcBackFace } from "@/lib/dfc";
import type { PreviewTypeFrame } from "@/types/app-domain";
import type { CardDraft } from "@/types/card";

// Resolves the type frame to use when previewing a card, accounting for DFC
// back faces. Extracted from App.tsx for reuse by feature component modules.
export function getPreviewTypeFrame(card: CardDraft): PreviewTypeFrame {
  return isDfcBackFace(card) && (card.typeFrame === "battle" || card.typeFrame === "dfc")
    ? "standard"
    : card.typeFrame ?? "standard";
}
