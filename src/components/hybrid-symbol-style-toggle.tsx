import { Pressable, Text, View } from "react-native";

import { HybridSymbolStyle, useHybridSymbolStyle } from "@/components/hybrid-symbol-style-context";

const OPTIONS: Array<[HybridSymbolStyle, string]> = [
  ["normal", "Normal"],
  ["guild", "Guild"],
];

export function HybridSymbolStyleToggle({
  label = "Mana cost hybrid symbols",
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  const { hybridSymbolStyle, setHybridSymbolStyle } = useHybridSymbolStyle();

  if (compact) {
    return (
      <View
        style={{
          minHeight: 34,
          borderRadius: 8,
          borderCurve: "continuous",
          backgroundColor: "#e9ecf2",
          flexDirection: "row",
          padding: 3,
          gap: 3,
        }}
      >
        {OPTIONS.map(([style, label]) => {
          const selected = hybridSymbolStyle === style;

          return (
            <Pressable
              key={style}
              accessibilityRole="button"
              accessibilityLabel={`Use ${label} hybrid mana symbols`}
              onPress={() => setHybridSymbolStyle(style)}
              style={{
                minWidth: 70,
                minHeight: 28,
                borderRadius: 7,
                borderCurve: "continuous",
                backgroundColor: selected ? "#ffffff" : "transparent",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: selected ? 1 : 0,
                borderColor: "#cfd4dd",
                paddingHorizontal: 10,
              }}
            >
              <Text
                selectable={false}
                style={{
                  color: selected ? "#171b22" : "#657082",
                  fontSize: 12,
                  fontWeight: "900",
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View
      style={{
        minHeight: 48,
        borderRadius: 10,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: "#d8dbe2",
        backgroundColor: "#ffffff",
        padding: 8,
        gap: 8,
      }}
    >
      <Text selectable={false} style={{ color: "#222733", fontSize: 13, fontWeight: "900" }}>
        {label}
      </Text>
      <View
        style={{
          minHeight: 34,
          borderRadius: 8,
          borderCurve: "continuous",
          backgroundColor: "#e9ecf2",
          flexDirection: "row",
          padding: 3,
          gap: 3,
        }}
      >
        {OPTIONS.map(([style, label]) => {
          const selected = hybridSymbolStyle === style;

          return (
            <Pressable
              key={style}
              accessibilityRole="button"
              accessibilityLabel={`Use ${label} hybrid mana symbols`}
              onPress={() => setHybridSymbolStyle(style)}
              style={{
                flex: 1,
                minHeight: 28,
                borderRadius: 7,
                borderCurve: "continuous",
                backgroundColor: selected ? "#ffffff" : "transparent",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: selected ? 1 : 0,
                borderColor: "#cfd4dd",
              }}
            >
              <Text
                selectable={false}
                style={{
                  color: selected ? "#171b22" : "#657082",
                  fontSize: 13,
                  fontWeight: "900",
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
