import { useState } from "react";
import { Sparkles, X } from "lucide-react-native";
import { Alert, Modal, Platform, Pressable, Text, View } from "react-native";

async function copyTextToClipboard(text: string) {
  if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  if (Platform.OS === "web" && typeof document !== "undefined") {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      return document.execCommand("copy");
    } finally {
      document.body.removeChild(textArea);
    }
  }

  return false;
}

export function EarlyAccessCodeModal({
  visible,
  code,
  onClose,
}: {
  visible: boolean;
  code: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!visible) {
    return null;
  }

  const copyCode = async () => {
    const ok = await copyTextToClipboard(code);
    setCopied(ok);

    if (!ok) {
      Alert.alert("Copy code", code);
    }
  };

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
          accessibilityLabel="Dismiss early access code"
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
            maxWidth: 392,
            borderRadius: 18,
            borderCurve: "continuous",
            backgroundColor: "#ffffff",
            padding: 20,
            gap: 16,
            shadowColor: "#000000",
            shadowOpacity: 0.22,
            shadowRadius: 26,
            shadowOffset: { width: 0, height: 14 },
            elevation: 18,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "#111827",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={23} color="#69d2df" strokeWidth={2.6} />
            </View>
            <View style={{ flex: 1, gap: 5 }}>
              <Text selectable={false} style={{ color: "#11151c", fontSize: 22, fontWeight: "900" }}>
                Early Access Code
              </Text>
              <Text selectable={false} style={{ color: "#5e6673", fontSize: 14, lineHeight: 20, fontWeight: "700" }}>
                Use this launch code in the credit store to add a one-time account credit grant.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss early access code"
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

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Copy early access credit code"
            onPress={() => void copyCode()}
            style={{
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#dbe1ea",
              backgroundColor: "#f7f9fc",
              paddingHorizontal: 16,
              paddingVertical: 14,
              gap: 2,
            }}
          >
            <Text selectable={false} style={{ color: "#111827", fontSize: 30, letterSpacing: 0, fontWeight: "900" }}>
              {code}
            </Text>
            <Text selectable={false} style={{ color: "#697280", fontSize: 13, lineHeight: 18, fontWeight: "800" }}>
              {copied ? "Copied to clipboard." : "Tap the code to copy it."}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss early access code"
            onPress={onClose}
            style={{
              minHeight: 52,
              borderRadius: 26,
              backgroundColor: "#111827",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 9,
              paddingHorizontal: 18,
            }}
          >
            <Sparkles size={18} color="#ffffff" strokeWidth={2.6} />
            <Text selectable={false} style={{ color: "#ffffff", fontSize: 16, fontWeight: "900" }}>
              Got it
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
