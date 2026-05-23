import { Image, ImageSourcePropType, Text, View } from "react-native";

import { useHybridSymbolStyle } from "@/components/hybrid-symbol-style-context";
import {
  FULL_MAGIC_PACK,
  isHybridManaAssetKey,
  isManaAssetKey,
  ManaAssetKey,
} from "@/data/full-magic-pack";

const SYMBOL_COLORS: Record<string, { fill: string; ink: string; border: string }> = {
  W: { fill: "#f6edcf", ink: "#2f2a22", border: "#c9b875" },
  U: { fill: "#bee1f0", ink: "#15313d", border: "#6297ad" },
  B: { fill: "#3d3b3b", ink: "#f2ece2", border: "#1d1c1c" },
  R: { fill: "#e89a62", ink: "#32160f", border: "#9f4429" },
  G: { fill: "#bdd797", ink: "#1a2f17", border: "#64894e" },
  C: { fill: "#d9d9d4", ink: "#222522", border: "#898f88" },
  X: { fill: "#e2ded4", ink: "#28241f", border: "#918979" },
};

const HYBRID_PAIR_KEYS: Record<string, ManaAssetKey> = {
  WU: "WU",
  UW: "WU",
  WB: "WB",
  BW: "WB",
  UB: "UB",
  BU: "UB",
  UR: "UR",
  RU: "UR",
  BR: "BR",
  RB: "BR",
  BG: "BG",
  GB: "BG",
  RG: "RG",
  GR: "RG",
  RW: "RW",
  WR: "RW",
  GW: "GW",
  WG: "GW",
  GU: "GU",
  UG: "GU",
};

const MONO_HYBRID_KEYS: Record<string, ManaAssetKey> = {
  W: "2W",
  U: "2U",
  B: "2B",
  R: "2R",
  G: "2G",
};

const PHYREXIAN_KEYS: Record<string, ManaAssetKey> = {
  W: "WP",
  U: "UP",
  B: "BP",
  R: "RP",
  G: "GP",
};

type ManaSymbolProps = {
  value: string;
  size?: number;
  variant?: "modern" | "retro";
};

export function ManaSymbol({ value, size = 22, variant = "modern" }: ManaSymbolProps) {
  const { hybridSymbolStyle } = useHybridSymbolStyle();
  const normalized = value.toUpperCase();
  const assetKey = getManaAssetKey(normalized);
  const retroSymbols: Record<string, ImageSourcePropType> = FULL_MAGIC_PACK.retroSymbols;
  const retroAssetSource = variant === "retro" ? retroSymbols[assetKey] : null;
  const assetSource = retroAssetSource ??
    (hybridSymbolStyle === "guild" && isHybridManaAssetKey(assetKey)
      ? FULL_MAGIC_PACK.guildHybridSymbols[assetKey]
      : isManaAssetKey(assetKey)
        ? FULL_MAGIC_PACK.symbols[assetKey]
        : null);
  const palette = SYMBOL_COLORS[normalized] ?? {
    fill: "#e9e1d2",
    ink: "#241f18",
    border: "#978b75",
  };
  const label = normalized.replace("/", "");
  const shouldUseGenericManaPlate = /^\d+$/.test(normalized) || ["X", "Y", "Z"].includes(normalized);

  if (assetSource) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        source={assetSource}
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
    );
  }

  if (shouldUseGenericManaPlate) {
    return (
      <View
        style={{
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          accessibilityIgnoresInvertColors
          source={FULL_MAGIC_PACK.genericManaSymbol}
          resizeMode="contain"
          style={{
            position: "absolute",
            width: size,
            height: size,
          }}
        />
        <Text
          selectable={false}
          adjustsFontSizeToFit
          numberOfLines={1}
          minimumFontScale={0.55}
          style={{
            color: "#111111",
            fontSize: clamp(size * (label.length > 1 ? 0.42 : 0.52), 6.5, 13),
            fontWeight: "900",
            lineHeight: size * 0.72,
          }}
        >
          {label}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.fill,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        selectable={false}
        adjustsFontSizeToFit
        numberOfLines={1}
        minimumFontScale={0.55}
        style={{
          color: palette.ink,
          fontSize: clamp(size * 0.48, 6.5, 12),
          fontWeight: "800",
          lineHeight: size * 0.72,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function getManaAssetKey(value: string): string {
  if (value === "COLORLESS" || value === "DIAMOND" || value === "◇") {
    return "C";
  }

  if (value === "TAP") {
    return "T";
  }

  if (value === "UNTAP") {
    return "Q";
  }

  if (isManaAssetKey(value)) {
    return value;
  }

  const parts = value.split("/").map((part) => part.trim()).filter(Boolean);

  if (parts.length === 0) {
    return value;
  }

  const colors = parts.filter((part) => ["W", "U", "B", "R", "G"].includes(part));

  if (parts.includes("2") && colors.length === 1) {
    return MONO_HYBRID_KEYS[colors[0]] ?? value;
  }

  if (parts.includes("P")) {
    return colors.length === 1 ? PHYREXIAN_KEYS[colors[0]] ?? value : value;
  }

  if (colors.length === 2) {
    const pairKey = HYBRID_PAIR_KEYS[colors.join("")];

    return pairKey ?? value;
  }

  return value;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
