import {GenerationButtonLabel} from "@/components/generation-button-label";
import {type SubjectMaskBoxPrompt, type SubjectMaskPointPrompt} from "@/lib/ai-edge";
import {ART_GENERATOR_STYLE_OPTIONS, type ArtGeneratorStyleId} from "@/lib/ai-prompts";
import {ART_IMAGE_QUALITY_OPTIONS, ART_LIBRARY_VISIBLE_THUMBNAIL_LIMIT, type ArtImageQuality} from "@/lib/art-image-quality";
import {type SubjectMaskSelectionSample} from "@/lib/subject-mask";
import {type ArtLibraryEntry, type ArtLibrarySource, type CardBackGeneratorMode} from "@/types/art";
import {Layers, Palette, SlidersHorizontal, Sparkles, Upload} from "lucide-react-native";
import {type ReactNode, useMemo, useState} from "react";
import {ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions} from "react-native";

// CardMagic art-source and AI-generation modals, extracted from App.tsx.
// Self-contained: imports nothing from App.tsx. The two art-library helpers
// (getArtLibraryColorLabel, sortArtLibraryEntries) are passed in as props.

export function ArtSourceModal({
  getArtLibraryColorLabel,
  sortArtLibraryEntries,
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
  getArtLibraryColorLabel: (colorIdentity: string) => string;
  sortArtLibraryEntries: (entries: ArtLibraryEntry[]) => ArtLibraryEntry[];
  visible: boolean;
  hasArt: boolean;
  artLibraryEntries: ArtLibraryEntry[];
  onPickPhoto: () => void;
  onGenerateArt?: () => void;
  onGenerateSubjectMask: (
    targetPrompt?: string,
    boxPrompt?: SubjectMaskBoxPrompt,
    pointPrompts?: SubjectMaskPointPrompt[],
    brushSamples?: SubjectMaskSelectionSample[],
    brushRadius?: number,
  ) => void;
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
              {onGenerateArt ? (
                <ArtSourceMenuItem
                  label="Generate art"
                  detail="Use a locally composed prompt for OpenAI image generation."
                  icon={<Palette size={20} color="#151820" strokeWidth={2.5} />}
                  onPress={onGenerateArt}
                />
              ) : null}
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
                label={subjectMaskBusy ? "Cropping" : "Crop"}
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
                        getArtLibraryColorLabel={getArtLibraryColorLabel}
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
  getArtLibraryColorLabel,
}: {
  entry: ArtLibraryEntry;
  onPress: () => void;
  getArtLibraryColorLabel: (colorIdentity: string) => string;
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

export function ArtGeneratorModal({
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
  const selectedStyleOption =
    ART_GENERATOR_STYLE_OPTIONS.find((option) => option.id === styleId) ?? ART_GENERATOR_STYLE_OPTIONS[0];

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
            <Text
              selectable={false}
              style={{ color: "#68707d", fontSize: 12, lineHeight: 17, fontWeight: "700" }}
            >
              {selectedStyleOption.description}
            </Text>
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

export function SetSymbolGeneratorModal({
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

export function CardBackGeneratorModal({
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
