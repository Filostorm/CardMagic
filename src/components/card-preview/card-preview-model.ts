import { getTypeFrameSpec } from "@/data/full-magic-pack";
import { DEFAULT_SHOWCASE_FRAME, getShowcaseFrameSpec } from "@/data/showcase-frames";
import { getMseM15ColorBlend, type MseM15ColorBlend } from "@/data/mse-frame-blends";
import {
  FRAME_STYLES,
  getFrameColors,
  getManaColors,
  getManualFrameColors,
  inferFrameIdentity,
  inferFrameStyle,
  parseManaCost,
} from "@/lib/card-style";
import {
  getDfcMode,
  getEditableCardFace,
  isDfcBackFace,
  shouldShowDfcFaceManaCost,
} from "@/lib/dfc";
import type { CardDraft, FrameTreatment, ManaColor, TypeFrame } from "@/types/card";

export function shouldDrawSubjectArtOverFrame(treatment: FrameTreatment, faceCard: CardDraft): boolean {
  return (
    supportsSubjectMaskArtExpansion(treatment) &&
    Boolean(faceCard.artUri) &&
    Boolean(faceCard.artSubjectMaskUri) &&
    faceCard.artSubjectMaskDisabled !== true
  );
}

export function supportsFrameEffectOverlays(typeFrame: TypeFrame): boolean {
  return (
    typeFrame === "standard" ||
    typeFrame === "token" ||
    typeFrame === "dfc" ||
    typeFrame === "adventure"
  );
}

export function shouldUseMseM15ColorBlend(card: CardDraft, frameColors: ManaColor[]): boolean {
  if (getManualFrameColors(card).length > 0) {
    return frameColors.length > 1;
  }

  return (!card.frameSelection || card.frameSelection === "auto") && frameColors.length > 1;
}

export function shouldShowDfcColorIndicator(typeFrame: TypeFrame, card: CardDraft): boolean {
  return typeFrame === "dfc" && isDfcBackFace(card) && getDfcMode(card) !== "modal";
}

export function shouldRenderDfcFrontWithStandardTreatmentGeometry(treatment: FrameTreatment): boolean {
  return treatment === "borderless";
}

export function createCardPreviewFrameModel(card: CardDraft) {
  const faceCard = getEditableCardFace(card);
  const frameIdentity = inferFrameIdentity(faceCard);
  const frameStyle = inferFrameStyle(faceCard);
  const selectedTypeFrame = card.typeFrame ?? "standard";
  const isBattleBackFace = selectedTypeFrame === "battle" && isDfcBackFace(card);
  const isBattleFrontFace = selectedTypeFrame === "battle" && !isBattleBackFace;
  const isDfcCardFace = selectedTypeFrame === "dfc";
  const isDfcBack = isDfcCardFace && isDfcBackFace(card);
  const frameTreatment = isDfcBack ? card.backFrameTreatment ?? "standard" : card.frameTreatment ?? "standard";
  const renderDfcFrontWithStandardTreatmentGeometry =
    isDfcCardFace && !isDfcBack && shouldRenderDfcFrontWithStandardTreatmentGeometry(frameTreatment);
  const showcaseFrame = isDfcBack
    ? card.backShowcaseFrame ?? DEFAULT_SHOWCASE_FRAME
    : card.showcaseFrame ?? DEFAULT_SHOWCASE_FRAME;
  const typeFrame =
    isBattleBackFace || isDfcBack || renderDfcFrontWithStandardTreatmentGeometry
      ? "standard"
      : selectedTypeFrame;
  const showcaseSpec =
    typeFrame === "standard" && frameTreatment === "showcase"
      ? getShowcaseFrameSpec(showcaseFrame)
      : null;
  const typeFrameSpec = getTypeFrameSpec(typeFrame);
  const showManaCost = shouldShowDfcFaceManaCost(card);
  const manaSymbols = showManaCost ? parseManaCost(faceCard.manaCost) : [];
  const manaColors = getManaColors(faceCard.manaCost);
  const frameColors = getFrameColors(faceCard);
  const manualFrameColors = getManualFrameColors(faceCard);
  const resolvedMseColorBlend: MseM15ColorBlend | null = shouldUseMseM15ColorBlend(faceCard, frameColors)
    ? getMseM15ColorBlend(frameColors, manualFrameColors.length > 0 ? "" : faceCard.manaCost)
    : null;
  const usesArtifactBaseFrame = frameIdentity === "artifact";
  const shouldUseSubjectMaskAsPrimaryArt =
    typeFrame === "standard" && shouldDrawSubjectArtOverFrame(frameTreatment, faceCard);
  const mseColorBlend = usesArtifactBaseFrame ? null : resolvedMseColorBlend;
  const mseAccentColorBlend = resolvedMseColorBlend;
  const useGoldRegularFrame =
    typeFrame === "standard" &&
    (frameTreatment === "standard" || frameTreatment === "borderless") &&
    frameColors.length > 2;
  const regularFrameIdentity = useGoldRegularFrame ? "gold" : frameIdentity;
  const regularMseColorBlend = useGoldRegularFrame ? null : mseColorBlend;
  const regularFrameStyle = useGoldRegularFrame ? FRAME_STYLES.gold : frameStyle;

  return {
    faceCard,
    frameIdentity,
    frameStyle,
    selectedTypeFrame,
    isBattleBackFace,
    isBattleFrontFace,
    isDfcBack,
    frameTreatment,
    showcaseFrame,
    typeFrame,
    showcaseSpec,
    typeFrameSpec,
    showManaCost,
    manaSymbols,
    manaColors,
    frameColors,
    manualFrameColors,
    resolvedMseColorBlend,
    usesArtifactBaseFrame,
    shouldUseSubjectMaskAsPrimaryArt,
    mseColorBlend,
    mseAccentColorBlend,
    useGoldRegularFrame,
    regularFrameIdentity,
    regularMseColorBlend,
    regularFrameStyle,
  };
}

function supportsSubjectMaskArtExpansion(_treatment: FrameTreatment): boolean {
  return true;
}
