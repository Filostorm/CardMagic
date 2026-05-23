import { ReactNode, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";

import { HybridSymbolStyleToggle } from "@/components/hybrid-symbol-style-toggle";
import { ManaSymbol } from "@/components/mana-symbol";
import { formatManaCost, formatManaSymbols, parseManaCost } from "@/lib/card-style";

const QUICK_SYMBOLS = ["W", "U", "B", "R", "G", "C", "1", "X"];
const NORMAL_HYBRID_SYMBOLS = ["W/U", "W/B", "U/B", "U/R", "B/R", "B/G", "R/G", "R/W", "G/W", "G/U"];
const MONO_HYBRID_SYMBOLS = ["2/W", "2/U", "2/B", "2/R", "2/G"];
const PHYREXIAN_SYMBOLS = ["W/P", "U/P", "B/P", "R/P", "G/P"];

type ManaCostControlProps = {
  value: string;
  onChange: (value: string) => void;
};

type ManaPickerMode = "normal" | "guildHybrid";

export function ManaCostControl({ value, onChange }: ManaCostControlProps) {
  const rawSymbols = parseManaCost(value);
  const [autoFormatSymbols, setAutoFormatSymbols] = useState(true);
  const [pickerMode, setPickerMode] = useState<ManaPickerMode>("normal");
  const symbols = autoFormatSymbols ? formatManaSymbols(rawSymbols) : rawSymbols;

  const appendSymbol = (symbol: string) => {
    const baseValue = autoFormatSymbols ? formatManaCost(value) : value;
    const nextValue = `${baseValue}${baseValue.includes("{") || !baseValue ? "" : " "}{${symbol}}`;

    onChange(autoFormatSymbols ? formatManaCost(nextValue) : nextValue);
  };

  const removeSymbolAt = (symbolIndex: number) => {
    const next = symbols
      .filter((_, index) => index !== symbolIndex)
      .map((symbol) => `{${symbol}}`)
      .join("");

    onChange(autoFormatSymbols ? formatManaCost(next) : next);
  };

  const updateAutoFormatSymbols = (enabled: boolean) => {
    setAutoFormatSymbols(enabled);

    if (enabled) {
      onChange(formatManaCost(value));
    }
  };

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {symbols.length > 0 ? (
          symbols.map((symbol, index) => (
            <Pressable
              key={`${symbol}-${index}`}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${symbol} from mana cost`}
              onPress={() => removeSymbolAt(index)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ManaSymbol value={symbol} size={28} />
            </Pressable>
          ))
        ) : (
          <Text selectable style={{ color: "#737987", fontSize: 14 }}>
            No cost
          </Text>
        )}
      </View>

      <View style={{ gap: 10 }}>
        <AutoFormatToggle enabled={autoFormatSymbols} onChange={updateAutoFormatSymbols} />
        <PickerModeToggle value={pickerMode} onChange={setPickerMode} />

        {pickerMode === "normal" ? (
          <SymbolButtonRow symbols={QUICK_SYMBOLS} onAppend={appendSymbol} />
        ) : (
          <>
            <SymbolButtonRow
              label="Normal hybrid"
              symbols={NORMAL_HYBRID_SYMBOLS}
              onAppend={appendSymbol}
              headerAccessory={<HybridSymbolStyleToggle compact label="Hybrid symbol art" />}
            />
            <SymbolButtonRow
              label="Two-mana hybrid"
              symbols={MONO_HYBRID_SYMBOLS}
              onAppend={appendSymbol}
            />
            <SymbolButtonRow
              label="Phyrexian"
              symbols={PHYREXIAN_SYMBOLS}
              onAppend={appendSymbol}
            />
          </>
        )}
      </View>
    </View>
  );
}

function AutoFormatToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <View
      style={{
        minHeight: 42,
        borderRadius: 9,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: "#d4d8e0",
        backgroundColor: "#ffffff",
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        paddingHorizontal: 12,
      }}
    >
      <Text selectable={false} style={{ color: "#222733", fontSize: 13, fontWeight: "900" }}>
        Auto format
      </Text>
      <Switch
        accessibilityLabel="Auto format mana symbols"
        value={enabled}
        onValueChange={onChange}
        trackColor={{ false: "#cfd4dd", true: "#a8d4be" }}
        thumbColor={enabled ? "#17633e" : "#ffffff"}
      />
    </View>
  );
}

function PickerModeToggle({
  value,
  onChange,
}: {
  value: ManaPickerMode;
  onChange: (value: ManaPickerMode) => void;
}) {
  const options: Array<[ManaPickerMode, string]> = [
    ["normal", "Normal"],
    ["guildHybrid", "Hybrid"],
  ];

  return (
    <View
      style={{
        minHeight: 38,
        borderRadius: 9,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: "#d4d8e0",
        backgroundColor: "#e9ecf2",
        flexDirection: "row",
        padding: 3,
        gap: 3,
      }}
    >
      {options.map(([mode, label]) => {
        const selected = value === mode;

        return (
          <Pressable
            key={mode}
            accessibilityRole="button"
            accessibilityLabel={`Use ${label} mana picker`}
            onPress={() => onChange(mode)}
            style={{
              flex: 1,
              minHeight: 30,
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
  );
}

function SymbolButtonRow({
  label,
  symbols,
  onAppend,
  headerAccessory,
}: {
  label?: string;
  symbols: string[];
  onAppend: (symbol: string) => void;
  headerAccessory?: ReactNode;
}) {
  return (
    <View style={{ gap: 6 }}>
      {label || headerAccessory ? (
        <View
          style={{
            minHeight: 34,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          {label ? (
            <Text
              selectable
              style={{
                color: "#697182",
                fontSize: 12,
                fontWeight: "800",
                textTransform: "uppercase",
              }}
            >
              {label}
            </Text>
          ) : null}
          {headerAccessory}
        </View>
      ) : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {symbols.map((symbol) => (
          <Pressable
            key={symbol}
            accessibilityRole="button"
            accessibilityLabel={`Add ${symbol}`}
            onPress={() => onAppend(symbol)}
            style={{
              height: 38,
              minWidth: 42,
              borderRadius: 8,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: "#d4d8e0",
              backgroundColor: "#f7f8fb",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 8,
            }}
          >
            <ManaSymbol value={symbol} size={22} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
