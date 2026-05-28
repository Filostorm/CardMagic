import { useState } from "react";
import { Platform, Text, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";

type EditorFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  multiline?: boolean;
  compact?: boolean;
  autoCapitalize?: TextInputProps["autoCapitalize"];
};

export function EditorField({
  label,
  value,
  onChangeText,
  onBlur,
  multiline = false,
  compact = false,
  autoCapitalize,
}: EditorFieldProps) {
  const [contentHeight, setContentHeight] = useState(0);
  const multilineMinHeight = 108;
  const multilineLineHeight = 21;
  const multilineVerticalPadding = 22;
  const shouldMeasureContentHeight = multiline && Platform.OS !== "web";
  const explicitLineHeight = getExplicitLineCount(value) * multilineLineHeight + multilineVerticalPadding;
  const measuredMultilineHeight =
    contentHeight > 0 ? contentHeight + multilineVerticalPadding : multilineMinHeight;
  const multilineHeight = Math.max(
    multilineMinHeight,
    explicitLineHeight,
    shouldMeasureContentHeight ? measuredMultilineHeight : 0,
  );

  return (
    <View style={{ gap: 6, flex: compact ? 1 : undefined }}>
      <Text
        selectable
        style={{
          color: "#5f6470",
          fontSize: 12,
          fontWeight: "800",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        scrollEnabled={multiline ? false : undefined}
        blurOnSubmit={multiline ? false : undefined}
        submitBehavior={multiline ? "newline" : undefined}
        onContentSizeChange={
          shouldMeasureContentHeight
            ? (event) => {
                const nextHeight = Math.ceil(event.nativeEvent.contentSize.height);

                setContentHeight((currentHeight) =>
                  currentHeight === nextHeight ? currentHeight : nextHeight,
                );
              }
            : undefined
        }
        textAlignVertical={multiline ? "top" : "center"}
        style={{
          minHeight: multiline ? multilineMinHeight : 44,
          height: multiline ? multilineHeight : undefined,
          borderRadius: 8,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: "#d8dbe2",
          backgroundColor: "#ffffff",
          color: "#151820",
          fontSize: 16,
          lineHeight: multiline ? multilineLineHeight : undefined,
          overflow: multiline ? "hidden" : undefined,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 11 : 8,
        }}
      />
    </View>
  );
}

function getExplicitLineCount(value: string): number {
  return Math.max(1, value.replace(/\r\n?/g, "\n").split("\n").length);
}
