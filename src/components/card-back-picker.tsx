import { Pressable, Text, View } from "react-native";

import { CardBackPreview } from "@/components/card-back-preview";
import { CARD_BACK_OPTIONS, getCardBackOption } from "@/data/card-backs";
import { CardBackId } from "@/types/card";

type CardBackPickerProps = {
  value?: CardBackId;
  effectiveValue?: CardBackId;
  setDefaultValue?: CardBackId;
  includeSetDefault?: boolean;
  showSummary?: boolean;
  onChange: (cardBackId: CardBackId | undefined) => void;
};

export function CardBackPicker({
  value,
  effectiveValue,
  setDefaultValue,
  includeSetDefault = false,
  showSummary = true,
  onChange,
}: CardBackPickerProps) {
  const resolvedValue = effectiveValue ?? value ?? setDefaultValue;
  const activeOption = getCardBackOption(resolvedValue);
  const setDefaultOption = getCardBackOption(setDefaultValue);

  return (
    <View style={{ gap: 12 }}>
      {showSummary ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <CardBackPreview cardBackId={activeOption.id} width={54} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              selectable
              style={{
                color: "#5f6470",
                fontSize: 12,
                fontWeight: "800",
                textTransform: "uppercase",
              }}
            >
              Card Back
            </Text>
            <Text selectable style={{ color: "#151820", fontSize: 15, fontWeight: "900" }}>
              {includeSetDefault && value === undefined
                ? `Set default: ${setDefaultOption.label}`
                : activeOption.label}
            </Text>
            <Text selectable style={{ color: "#68707d", fontSize: 12, lineHeight: 15, fontWeight: "700" }}>
              {activeOption.description}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {includeSetDefault ? (
          <CardBackChoice
            label="Set default"
            selected={value === undefined}
            previewId={setDefaultOption.id}
            onPress={() => onChange(undefined)}
          />
        ) : null}
        {CARD_BACK_OPTIONS.map((option) => (
          <CardBackChoice
            key={option.id}
            label={option.label}
            selected={value === option.id}
            previewId={option.id}
            onPress={() => onChange(option.id)}
          />
        ))}
      </View>
    </View>
  );
}

function CardBackChoice({
  label,
  selected,
  previewId,
  onPress,
}: {
  label: string;
  selected: boolean;
  previewId: CardBackId;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Choose ${label} card back`}
      onPress={onPress}
      style={{
        width: 92,
        minHeight: 142,
        borderRadius: 10,
        borderCurve: "continuous",
        borderWidth: 1.5,
        borderColor: selected ? "#151820" : "#d4d8e0",
        backgroundColor: selected ? "#151820" : "#ffffff",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        padding: 8,
      }}
    >
      <CardBackPreview cardBackId={previewId} width={58} />
      <Text
        selectable={false}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        style={{
          color: selected ? "#ffffff" : "#1f2530",
          fontSize: 11,
          lineHeight: 13,
          fontWeight: "900",
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
