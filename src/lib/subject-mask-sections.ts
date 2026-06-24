import type { SubjectMaskFitMode, SubjectMaskSection } from "@/types/card";

export const SUBJECT_MASK_SECTION_OPTIONS: readonly SubjectMaskSection[] = [
  "title",
  "typeLine",
  "text",
  "frame",
];

export const DEFAULT_SUBJECT_MASK_SECTIONS: readonly SubjectMaskSection[] = [
  "title",
  "typeLine",
  "frame",
];

export const SUBJECT_MASK_FIT_MODE_OPTIONS: readonly SubjectMaskFitMode[] = [
  "expanded",
  "artOpening",
];

export const DEFAULT_SUBJECT_MASK_FIT_MODE: SubjectMaskFitMode = "expanded";

export function normalizeSubjectMaskSections(value: unknown): SubjectMaskSection[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const sections = value.filter((section): section is SubjectMaskSection =>
    SUBJECT_MASK_SECTION_OPTIONS.includes(section as SubjectMaskSection),
  );

  return Array.from(new Set(sections));
}

export function resolveSubjectMaskSections(value: unknown): SubjectMaskSection[] {
  return normalizeSubjectMaskSections(value) ?? [...DEFAULT_SUBJECT_MASK_SECTIONS];
}

export function normalizeSubjectMaskFitMode(value: unknown): SubjectMaskFitMode | undefined {
  return SUBJECT_MASK_FIT_MODE_OPTIONS.includes(value as SubjectMaskFitMode)
    ? value as SubjectMaskFitMode
    : undefined;
}
