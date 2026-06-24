import { Pressable, ScrollView, Text, View } from "react-native";
import { ImagePlus, Plus, Sparkles } from "lucide-react-native";
import { type ReactNode } from "react";

import { CardBackPreview } from "@/components/card-back-preview";
import { CustomCardBackEntry, getCardBackOption, getCardBackOptions } from "@/data/card-backs";
import { CardBackId } from "@/types/card";

type CardBackPickerProps = {
  value?: CardBackId;
  effectiveValue?: CardBackId;
  setDefaultValue?: CardBackId;
  customBacks?: CustomCardBackEntry[];
  includeSetDefault?: boolean;
  showSummary?: boolean;
  onChange: (cardBackId: CardBackId | undefined) => void;
  onChangeSetDefault?: (cardBackId: CardBackId) => void;
  onAddCardBack?: () => void;
  onGenerateCardBack?: () => void;
  onPickCustomCardBack?: () => void;
};

export function CardBackPicker({
  value,
  effectiveValue,
  setDefaultValue,
  customBacks = [],
  includeSetDefault = false,
  showSummary = false,
  onChange,
  onChangeSetDefault,
  onAddCardBack,
  onGenerateCardBack,
  onPickCustomCardBack,
}: CardBackPickerProps) {
  const resolvedValue = effectiveValue ?? value ?? setDefaultValue;
  const activeOption = getCardBackOption(resolvedValue, customBacks);
  const setDefaultOption = getCardBackOption(setDefaultValue, customBacks);
  const visibleOptions = getCardBackOptions(customBacks).filter(
    (option) => !(includeSetDefault && option.id === setDefaultValue),
  );
  const canApplyOverrideToSetDefault = includeSetDefault && value !== undefined && onChangeSetDefault;

  return (
    <View style={{ gap: 12 }}>
      {showSummary ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <CardBackPreview cardBackId={activeOption.id} customBacks={customBacks} width={54} />
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 12,
          paddingRight: 2,
        }}
      >
        {onAddCardBack ? (
          <AddCardBackChoice onPress={onAddCardBack} />
        ) : null}
        {includeSetDefault ? (
          <CardBackChoice
            label="Set default"
            selected={value === undefined}
            previewId={setDefaultOption.id}
            customBacks={customBacks}
            onPress={() => onChange(undefined)}
          />
        ) : null}
        {visibleOptions.map((option) => (
          <CardBackChoice
            key={option.id}
            label={option.label}
            selected={value === option.id}
            previewId={option.id}
            customBacks={customBacks}
            onPress={() => onChange(option.id)}
          />
        ))}
      </ScrollView>

      {onGenerateCardBack || onPickCustomCardBack ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {onGenerateCardBack ? (
            <CardBackActionButton
              label="Generate back"
              accessibilityLabel="Generate card back"
              variant="generate"
              onPress={onGenerateCardBack}
            >
              <Sparkles size={16} color="#ffffff" strokeWidth={2.5} />
            </CardBackActionButton>
          ) : null}
          {onPickCustomCardBack ? (
            <CardBackActionButton
              label="Upload back"
              accessibilityLabel="Upload custom card back"
              variant="upload"
              onPress={onPickCustomCardBack}
            >
              <ImagePlus size={16} color="#ffffff" strokeWidth={2.5} />
            </CardBackActionButton>
          ) : null}
        </View>
      ) : null}

      {canApplyOverrideToSetDefault ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Use selected card back as set default"
          onPress={() => {
            onChangeSetDefault(value);
            onChange(undefined);
          }}
          style={{
            minHeight: 40,
            borderRadius: 8,
            borderCurve: "continuous",
            backgroundColor: "#151820",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 14,
          }}
        >
          <Text selectable={false} style={{ color: "#ffffff", fontSize: 14, fontWeight: "900" }}>
            Use as set default
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function AddCardBackChoice({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add double-faced card"
      onPress={onPress}
      style={{
        width: 96,
        minHeight: 146,
        alignItems: "center",
        gap: 6,
      }}
    >
      <View
        style={{
          borderRadius: 8,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: "rgba(21, 24, 32, 0.22)",
          padding: 5,
        }}
      >
        <View
          style={{
            width: 78,
            aspectRatio: 375 / 523,
            borderRadius: 8,
            borderCurve: "continuous",
            backgroundColor: "#f7f8fa",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#151820",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={18} color="#ffffff" strokeWidth={2.8} />
          </View>
        </View>
      </View>
      <Text
        selectable={false}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        style={{
          color: "#1f2530",
          fontSize: 12,
          lineHeight: 14,
          fontWeight: "900",
          textAlign: "center",
        }}
      >
        Add DFC
      </Text>
    </Pressable>
  );
}

function CardBackChoice({
  label,
  selected,
  previewId,
  customBacks,
  onPress,
}: {
  label: string;
  selected: boolean;
  previewId: CardBackId;
  customBacks: CustomCardBackEntry[];
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Choose ${label} card back`}
      onPress={onPress}
      style={{
        width: 96,
        minHeight: 146,
        alignItems: "center",
        gap: 6,
      }}
    >
      <View
        style={{
          borderRadius: 8,
          borderCurve: "continuous",
          borderWidth: selected ? 2 : 0,
          borderColor: "#151820",
          padding: selected ? 3 : 5,
        }}
      >
        <CardBackPreview cardBackId={previewId} customBacks={customBacks} width={78} />
      </View>
      <Text
        selectable={false}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        style={{
          color: selected ? "#151820" : "#1f2530",
          fontSize: 12,
          lineHeight: 14,
          fontWeight: "900",
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function CardBackActionButton({
  accessibilityLabel,
  label,
  variant,
  children,
  onPress,
}: {
  accessibilityLabel: string;
  label: string;
  variant: "generate" | "upload";
  children: ReactNode;
  onPress: () => void;
}) {
  const backgroundColor = variant === "generate" ? "#0b7180" : "#151820";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={{
        minHeight: 36,
        borderRadius: 8,
        borderCurve: "continuous",
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 7,
        paddingHorizontal: 11,
      }}
    >
      {children}
      <Text
        selectable={false}
        numberOfLines={1}
        style={{
          color: "#ffffff",
          fontSize: 12,
          fontWeight: "900",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
