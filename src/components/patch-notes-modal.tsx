import { BookOpen, X } from "lucide-react-native";
import { Linking, Modal, Pressable, ScrollView, Text, View } from "react-native";

import type { CardMagicReleaseDeployment } from "@/lib/release-metadata";
import type { CardMagicReleaseBranch, PatchNoteBullet, PatchNoteEntry } from "@/lib/patch-notes";

function getPatchNoteBulletKey(bullet: PatchNoteBullet): string {
  return typeof bullet === "string" ? bullet : `${bullet.text}-${bullet.linkUrl}`;
}

export function PatchNotesModal({
  visible,
  appVersion,
  releaseBranch,
  betaReleaseDeployment,
  notes,
  onClose,
}: {
  visible: boolean;
  appVersion: string;
  releaseBranch: CardMagicReleaseBranch;
  betaReleaseDeployment: CardMagicReleaseDeployment | null;
  notes: PatchNoteEntry[];
  onClose: () => void;
}) {
  if (!visible) {
    return null;
  }

  const title = releaseBranch === "main" ? "Release Notes" : "Patch Notes";
  const subtitle =
    releaseBranch === "main"
      ? `Main release v${appVersion}`
      : `Current beta version v${appVersion}`;
  const visibleBetaDeployment =
    betaReleaseDeployment ??
    ({
      branch: "beta",
      version: appVersion,
      branchUrl: `https://beta.cardmagic-5dy.pages.dev/?v=${appVersion}`,
      deploymentUrl: "https://beta.cardmagic-5dy.pages.dev",
      deployedAt: "",
    } satisfies CardMagicReleaseDeployment);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(12, 15, 22, 0.48)",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss patch notes"
          onPress={onClose}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          }}
        />
        <View
          style={{
            width: "100%",
            maxWidth: 440,
            maxHeight: "82%",
            borderRadius: 18,
            borderCurve: "continuous",
            backgroundColor: "#ffffff",
            shadowColor: "#000000",
            shadowOpacity: 0.22,
            shadowRadius: 26,
            shadowOffset: { width: 0, height: 14 },
            elevation: 18,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: "#eceef2",
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 14,
            }}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: "#111827",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BookOpen size={22} color="#69d2df" strokeWidth={2.6} />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
              <Text selectable={false} style={{ color: "#11151c", fontSize: 22, fontWeight: "900" }}>
                {title}
              </Text>
              <Text selectable={false} style={{ color: "#5e6673", fontSize: 13, lineHeight: 18, fontWeight: "800" }}>
                {subtitle}
              </Text>
              {visibleBetaDeployment ? (
                <Text selectable={false} style={{ color: "#5e6673", fontSize: 13, lineHeight: 18, fontWeight: "800" }}>
                  {releaseBranch === "main" ? "Current beta" : "Beta branch"}:{" "}
                  <Text
                    accessibilityRole="link"
                    onPress={() => void Linking.openURL(visibleBetaDeployment.branchUrl)}
                    style={{
                      color: "#0b7180",
                      fontSize: 13,
                      lineHeight: 18,
                      fontWeight: "900",
                      textDecorationLine: "underline",
                    }}
                  >
                    v{visibleBetaDeployment.version}
                  </Text>
                </Text>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss patch notes"
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#eef0f4",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} color="#222733" strokeWidth={2.5} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            {notes.map((entry) => (
              <View
                key={entry.version}
                style={{
                  borderRadius: 14,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: "#e1e4eb",
                  backgroundColor: "#f8f9fb",
                  padding: 14,
                  gap: 10,
                }}
              >
                <View style={{ gap: 3 }}>
                  <Text selectable={false} style={{ color: "#11151c", fontSize: 16, fontWeight: "900" }}>
                    v{entry.version} · {entry.title}
                  </Text>
                  <Text selectable={false} style={{ color: "#68707d", fontSize: 12, fontWeight: "800" }}>
                    {entry.date}
                  </Text>
                </View>
                <View style={{ gap: 8 }}>
                  {entry.bullets.map((bullet, index) => (
                    <View
                      key={`${entry.version}-${index}-${getPatchNoteBulletKey(bullet)}`}
                      style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}
                    >
                      <Text selectable={false} style={{ color: "#0b7180", fontSize: 15, lineHeight: 19, fontWeight: "900" }}>
                        •
                      </Text>
                      <Text selectable={false} style={{ flex: 1, color: "#2a303a", fontSize: 13, lineHeight: 19, fontWeight: "700" }}>
                        {typeof bullet === "string" ? (
                          bullet
                        ) : (
                          <>
                            {bullet.text}{" "}
                            <Text
                              accessibilityRole="link"
                              onPress={() => void Linking.openURL(bullet.linkUrl)}
                              style={{
                                color: "#0b7180",
                                fontSize: 13,
                                lineHeight: 19,
                                fontWeight: "900",
                                textDecorationLine: "underline",
                              }}
                            >
                              {bullet.linkLabel}
                            </Text>
                          </>
                        )}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
