// Shared art-related domain types, extracted from App.tsx so the art/generator
// component modules can import them without depending on the root entry file.

export type ArtLibrarySource = "generated" | "added";

export type ArtLibraryEntry = {
  id: string;
  uri: string;
  source: ArtLibrarySource;
  colorIdentity: string;
  label: string;
  createdAt: string;
};

export type CardBackGeneratorMode = "reskin" | "custom";

export type SubjectMaskTraceEntry = {
  id: string;
  message: string;
  tone: "info" | "success" | "error";
};
