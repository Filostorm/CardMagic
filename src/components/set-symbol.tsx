import { useEffect, useState } from "react";
import { Asset } from "expo-asset";
import { Image, Platform, View, type ImageSourcePropType } from "react-native";
import Svg, { Defs, G, LinearGradient, Path, Stop } from "react-native-svg";

import { getMseWatermarkPreset } from "@/data/mse-watermarks";
import { RARITY_ACCENTS } from "@/lib/card-style";
import { adjustFlattenPending, compositeRaritySetSymbol } from "@/lib/export-flatten";
import { CardRarity } from "@/types/card";

export type SetSymbolPreset = {
  id: string;
  label: string;
  source?: ImageSourcePropType;
  paths: string[];
  details?: string[];
  cutouts?: string[];
};

const DEFAULT_PRESET_SET_SYMBOL_VISUAL_SCALE = 1.08;

const DEFAULT_SET_SYMBOL_SOURCES: Record<string, ImageSourcePropType> = {
  spire: require("../../assets/card-assets/set-symbols/generated-defaults/spire.png"),
  crownfall: require("../../assets/card-assets/set-symbols/generated-defaults/crownfall.png"),
  starforge: require("../../assets/card-assets/set-symbols/generated-defaults/starforge.png"),
  rift: require("../../assets/card-assets/set-symbols/generated-defaults/rift.png"),
  mask: require("../../assets/card-assets/set-symbols/generated-defaults/mask.png"),
  citadel: require("../../assets/card-assets/set-symbols/generated-defaults/citadel.png"),
  helix: require("../../assets/card-assets/set-symbols/generated-defaults/helix.png"),
  ember: require("../../assets/card-assets/set-symbols/generated-defaults/ember.png"),
  grove: require("../../assets/card-assets/set-symbols/generated-defaults/grove.png"),
  tideglass: require("../../assets/card-assets/set-symbols/generated-defaults/tideglass.png"),
  moonblade: require("../../assets/card-assets/set-symbols/generated-defaults/moonblade.png"),
  sunlance: require("../../assets/card-assets/set-symbols/generated-defaults/sunlance.png"),
  ironroot: require("../../assets/card-assets/set-symbols/generated-defaults/ironroot.png"),
  vault: require("../../assets/card-assets/set-symbols/generated-defaults/vault.png"),
  eye: require("../../assets/card-assets/set-symbols/generated-defaults/eye.png"),
  banner: require("../../assets/card-assets/set-symbols/generated-defaults/banner.png"),
  scarab: require("../../assets/card-assets/set-symbols/generated-defaults/scarab.png"),
  comet: require("../../assets/card-assets/set-symbols/generated-defaults/comet.png"),
  obelisk: require("../../assets/card-assets/set-symbols/generated-defaults/obelisk.png"),
  sigil: require("../../assets/card-assets/set-symbols/generated-defaults/sigil.png"),
  maw: require("../../assets/card-assets/set-symbols/generated-defaults/maw.png"),
  keystone: require("../../assets/card-assets/set-symbols/generated-defaults/keystone.png"),
  anvil: require("../../assets/card-assets/set-symbols/generated-defaults/anvil.png"),
  portal: require("../../assets/card-assets/set-symbols/generated-defaults/portal.png"),
};
const RARITY_TREATMENTS: Record<
  CardRarity,
  { fill: string; high: string; low: string; outline: string; shadow: string }
> = {
  common: {
    fill: "#242424",
    high: "#8a8a8a",
    low: "#050505",
    outline: "#050505",
    shadow: "#000000",
  },
  uncommon: {
    fill: RARITY_ACCENTS.uncommon,
    high: "#f1f4f3",
    low: "#52595d",
    outline: "#171717",
    shadow: "#0b0d0f",
  },
  rare: {
    fill: RARITY_ACCENTS.rare,
    high: "#ffe8a0",
    low: "#80551a",
    outline: "#17120a",
    shadow: "#050403",
  },
  mythic: {
    fill: RARITY_ACCENTS.mythic,
    high: "#ffbe63",
    low: "#8e2e12",
    outline: "#1b0d07",
    shadow: "#050201",
  },
};

const SET_SYMBOL_PRESET_DEFINITIONS: Omit<SetSymbolPreset, "source">[] = [
  {
    id: "spire",
    label: "Spire",
    paths: ["M50 6 86 86H14L50 6Z", "M50 20 65 77H35L50 20Z"],
    details: ["M50 14 58 77H43L50 14Z"],
    cutouts: ["M50 42 58 74H42L50 42Z"],
  },
  {
    id: "crownfall",
    label: "Crown",
    paths: ["M13 73 21 30 39 54 50 20 61 54 79 30 87 73 78 82H22L13 73Z"],
    details: ["M25 68 34 56H66L75 68H25Z", "M44 55 50 31 56 55H44Z"],
  },
  {
    id: "starforge",
    label: "Forge",
    paths: ["M50 5 61 34 92 31 68 51 78 81 50 64 22 81 32 51 8 31 39 34 50 5Z"],
    details: ["M50 19 56 43 80 41 60 55 67 73 50 61 33 73 40 55 20 41 44 43 50 19Z"],
    cutouts: ["M50 35 56 49 50 61 44 49 50 35Z"],
  },
  {
    id: "rift",
    label: "Rift",
    paths: ["M18 23 77 9 56 42 84 45 21 91 43 55 15 53 18 23Z"],
    details: ["M30 30 67 20 48 48 66 49 33 75 47 52 27 50 30 30Z"],
  },
  {
    id: "mask",
    label: "Mask",
    paths: ["M18 20 50 10 82 20 75 68 50 90 25 68 18 20Z"],
    details: ["M30 30 45 36 38 47 27 43 30 30Z", "M70 30 55 36 62 47 73 43 70 30Z", "M39 66H61L50 78 39 66Z"],
  },
  {
    id: "citadel",
    label: "Citadel",
    paths: ["M18 82V33L30 25 42 33 50 18 58 33 70 25 82 33V82H18Z"],
    details: ["M30 82V49L41 42 50 52 59 42 70 49V82H30Z", "M44 82V62H56V82H44Z"],
  },
  {
    id: "helix",
    label: "Helix",
    paths: ["M49 7C72 16 82 30 78 47 73 67 51 76 20 78 44 67 61 57 64 43 67 28 58 18 49 7Z", "M51 93C28 84 18 70 22 53 27 33 49 24 80 22 56 33 39 43 36 57 33 72 42 82 51 93Z"],
    details: ["M34 45 66 34 61 48 29 61 34 45Z"],
  },
  {
    id: "ember",
    label: "Ember",
    paths: ["M52 6C72 29 82 43 74 66 68 84 53 92 37 87 20 82 13 64 25 46 28 61 39 62 42 50 45 37 37 27 52 6Z"],
    details: ["M51 39C62 52 63 64 55 73 49 80 37 78 34 69 44 70 49 61 51 39Z"],
  },
  {
    id: "grove",
    label: "Grove",
    paths: ["M50 8C76 12 91 30 89 52 64 54 51 71 50 91 49 71 36 54 11 52 9 30 24 12 50 8Z"],
    details: ["M50 16V83", "M23 44C38 46 47 55 50 70", "M77 44C62 46 53 55 50 70"],
  },
  {
    id: "tideglass",
    label: "Tide",
    paths: ["M22 13H78L59 49 78 87H22L41 49 22 13Z"],
    details: ["M35 24H65L54 45H46L35 24Z", "M35 77 46 56H54L65 77H35Z"],
    cutouts: ["M42 48H58L50 60 42 48Z"],
  },
  {
    id: "moonblade",
    label: "Moon",
    paths: ["M72 12C52 20 40 37 42 55 44 73 59 83 78 83 65 93 44 91 29 78 11 62 10 37 27 21 39 10 57 7 72 12Z", "M71 25 88 51 69 76 75 53 71 25Z"],
    details: ["M64 27C52 34 48 47 52 60 55 70 64 75 76 76 60 82 45 75 38 63 30 47 39 31 64 27Z"],
  },
  {
    id: "sunlance",
    label: "Sun",
    paths: ["M50 5 58 29 82 18 71 42 95 50 71 58 82 82 58 71 50 95 42 71 18 82 29 58 5 50 29 42 18 18 42 29 50 5Z"],
    details: ["M50 31 64 50 50 69 36 50 50 31Z"],
  },
  {
    id: "ironroot",
    label: "Root",
    paths: ["M50 8 76 22 71 52 92 69 67 79 50 94 33 79 8 69 29 52 24 22 50 8Z"],
    details: ["M50 18V86", "M27 62 50 74 73 62", "M32 31 50 44 68 31"],
  },
  {
    id: "vault",
    label: "Vault",
    paths: ["M50 6 87 28V72L50 94 13 72V28L50 6Z"],
    details: ["M50 18 75 33V67L50 82 25 67V33L50 18Z", "M43 43H57V57H43V43Z"],
    cutouts: ["M50 33 66 43V57L50 67 34 57V43L50 33Z"],
  },
  {
    id: "eye",
    label: "Eye",
    paths: ["M7 50C20 28 35 18 50 18S80 28 93 50C80 72 65 82 50 82S20 72 7 50Z"],
    details: ["M50 30 66 50 50 70 34 50 50 30Z", "M50 41 58 50 50 59 42 50 50 41Z"],
  },
  {
    id: "banner",
    label: "Banner",
    paths: ["M20 12H80L72 48 80 86H20L28 48 20 12Z"],
    details: ["M34 23H66L61 48 66 77H34L39 48 34 23Z"],
    cutouts: ["M42 36H58L54 48 58 64H42L46 48 42 36Z"],
  },
  {
    id: "scarab",
    label: "Scarab",
    paths: ["M50 11 75 28 67 76 50 91 33 76 25 28 50 11Z", "M17 39 34 48 29 65 10 60 17 39Z", "M83 39 66 48 71 65 90 60 83 39Z"],
    details: ["M50 21V84", "M35 41H65", "M34 61H66"],
  },
  {
    id: "comet",
    label: "Comet",
    paths: ["M78 16 66 46 94 57 62 61 58 92 43 65 12 73 34 50 18 22 47 35 78 16Z"],
    details: ["M58 29 52 49 70 55 50 57 47 76 38 59 20 63 34 49 25 34 43 42 58 29Z"],
  },
  {
    id: "obelisk",
    label: "Obelisk",
    paths: ["M50 5 70 30 63 88 50 96 37 88 30 30 50 5Z"],
    details: ["M50 17 58 34 55 80 50 85 45 80 42 34 50 17Z"],
  },
  {
    id: "sigil",
    label: "Sigil",
    paths: ["M50 8 90 50 50 92 10 50 50 8Z", "M50 24 75 50 50 76 25 50 50 24Z"],
    details: ["M50 16V84", "M16 50H84"],
    cutouts: ["M50 37 63 50 50 63 37 50 50 37Z"],
  },
  {
    id: "maw",
    label: "Maw",
    paths: ["M15 28 50 9 85 28 76 76 50 91 24 76 15 28Z"],
    details: ["M31 35 43 45 33 56 25 43 31 35Z", "M69 35 57 45 67 56 75 43 69 35Z", "M32 68 50 57 68 68 50 79 32 68Z"],
  },
  {
    id: "keystone",
    label: "Key",
    paths: ["M49 10 80 29 80 61 62 61 62 78 49 91 36 78 36 61 20 61 20 29 49 10Z"],
    details: ["M49 24 65 34V50H55V70L49 76 43 70V50H35V34L49 24Z"],
  },
  {
    id: "anvil",
    label: "Anvil",
    paths: ["M18 33H82L72 51H58V68H74L84 84H16L26 68H42V51H28L18 33Z"],
    details: ["M31 42H69L64 49H36L31 42Z", "M36 75H64L69 82H31L36 75Z"],
  },
  {
    id: "portal",
    label: "Portal",
    paths: ["M50 7 83 26 83 74 50 93 17 74 17 26 50 7Z", "M50 22 70 36 70 64 50 78 30 64 30 36 50 22Z"],
    details: ["M50 33 62 42 58 59 42 59 38 42 50 33Z"],
  },
];

export const SET_SYMBOL_PRESETS: SetSymbolPreset[] = SET_SYMBOL_PRESET_DEFINITIONS.map((preset) => ({
  ...preset,
  source: DEFAULT_SET_SYMBOL_SOURCES[preset.id],
}));

export function SetSymbolMark({
  presetId,
  imageUri,
  usesRarityTreatment = false,
  rarity,
  size,
  exportMode = false,
  exportFlattenMasks = false,
  visualScale = 1,
}: {
  presetId?: string;
  imageUri?: string;
  usesRarityTreatment?: boolean;
  rarity: CardRarity;
  size: number;
  exportMode?: boolean;
  // Pre-flatten the masked metallic symbol into a plain raster image so the
  // html2canvas export renders it faithfully. Web-only.
  exportFlattenMasks?: boolean;
  visualScale?: number;
}) {
  const visualSize = size * visualScale;

  if (imageUri) {
    if (usesRarityTreatment) {
      const treatment = RARITY_TREATMENTS[rarity];
      const fill = rarity === "common" ? treatment.fill : treatment.high;

      if (Platform.OS === "web" && exportFlattenMasks) {
        return <FlattenedRaritySetSymbol symbolUri={imageUri} treatment={treatment} size={size} visualScale={visualScale} />;
      }

      if (Platform.OS === "web" && !exportMode) {
        const createMaskStyle = (background: string) => ({
          background,
          WebkitMaskImage: `url("${imageUri}")`,
          maskImage: `url("${imageUri}")`,
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        });
        const fillBackground =
          rarity === "common"
            ? `linear-gradient(135deg, ${treatment.high} 0%, ${treatment.fill} 48%, ${treatment.low} 100%)`
            : `linear-gradient(135deg, ${treatment.high} 0%, ${treatment.fill} 48%, ${treatment.low} 100%)`;

        return (
          <View
            style={{
              width: size,
              height: size,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={[
                {
                  position: "absolute",
                  width: visualSize,
                  height: visualSize,
                  opacity: 0.42,
                  transform: [{ scale: 1.05 }, { translateX: visualSize * 0.018 }, { translateY: visualSize * 0.026 }],
                },
                createMaskStyle(treatment.shadow),
              ] as any}
            />
            <View
              style={[
                {
                  position: "absolute",
                  width: visualSize,
                  height: visualSize,
                  opacity: 1,
                  transform: [{ scale: 1.08 }],
                },
                createMaskStyle(treatment.outline),
              ] as any}
            />
            <View
              style={[
                {
                  width: visualSize,
                  height: visualSize,
                },
                createMaskStyle(fillBackground),
              ] as any}
            />
          </View>
        );
      }

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
            source={{ uri: imageUri }}
            resizeMode="contain"
            style={{
              position: "absolute",
              width: visualSize,
              height: visualSize,
              tintColor: treatment.outline,
              opacity: exportMode ? 0.58 : 0.42,
              transform: [{ scale: 1.05 }, { translateX: visualSize * 0.018 }, { translateY: visualSize * 0.026 }],
            }}
          />
          <Image
            accessibilityIgnoresInvertColors
            source={{ uri: imageUri }}
            resizeMode="contain"
            style={{
              width: visualSize,
              height: visualSize,
              tintColor: fill,
            }}
          />
        </View>
      );
    }

    return (
      <Image
        accessibilityIgnoresInvertColors
        source={{ uri: imageUri }}
        resizeMode="contain"
        style={{ width: visualSize, height: visualSize }}
      />
    );
  }

  const preset = getSetSymbolPreset(presetId);
  const presetImageUri = resolveSetSymbolSourceUri(preset.source);

  if (presetImageUri) {
    return (
      <SetSymbolMark
        imageUri={presetImageUri}
        usesRarityTreatment
        rarity={rarity}
        size={size}
        exportMode={exportMode}
        exportFlattenMasks={exportFlattenMasks}
        visualScale={DEFAULT_PRESET_SET_SYMBOL_VISUAL_SCALE}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <PresetSetSymbol preset={preset} rarity={rarity} size={size} />
    </View>
  );
}

function resolveSetSymbolSourceUri(source?: ImageSourcePropType) {
  if (!source) {
    return undefined;
  }

  if (typeof source === "object" && "uri" in source && typeof source.uri === "string") {
    return source.uri;
  }

  const resolveAssetSource = (Image as typeof Image & {
    resolveAssetSource?: (source: ImageSourcePropType) => { uri?: string } | null;
  }).resolveAssetSource;

  const reactNativeUri = resolveAssetSource?.(source)?.uri;
  if (reactNativeUri) {
    return reactNativeUri;
  }

  try {
    return Asset.fromModule(source as number).uri;
  } catch {
    return undefined;
  }
}

// Option B: composite the editor's three masked metallic layers (shadow,
// outline, gradient fill) into one flat PNG so html2canvas can capture it.
function FlattenedRaritySetSymbol({
  symbolUri,
  treatment,
  size,
  visualScale,
}: {
  symbolUri: string;
  treatment: { fill: string; high: string; low: string; outline: string; shadow: string };
  size: number;
  visualScale: number;
}) {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      return;
    }
    let cancelled = false;
    let settled = false;
    adjustFlattenPending(1);
    const release = () => {
      if (!settled) {
        settled = true;
        adjustFlattenPending(-1);
      }
    };
    compositeRaritySetSymbol({
      symbolUri,
      shadow: treatment.shadow,
      outline: treatment.outline,
      high: treatment.high,
      fill: treatment.fill,
      low: treatment.low,
    })
      .then((result) => {
        if (!cancelled) {
          setUri(result);
        }
      })
      .catch((error) => {
        console.warn("[CardMagic export] set-symbol flatten failed.", error);
      })
      .finally(release);
    return () => {
      cancelled = true;
      release();
    };
  }, [symbolUri, treatment.shadow, treatment.outline, treatment.high, treatment.fill, treatment.low]);

  const visualSize = size * visualScale;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {uri ? (
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri }}
          resizeMode="contain"
          style={{ width: visualSize, height: visualSize }}
        />
      ) : null}
    </View>
  );
}

export function WatermarkSymbolMark({
  presetId,
  color = "#1b1b18",
  size,
}: {
  presetId?: string;
  color?: string;
  size: number;
}) {
  const msePreset = getMseWatermarkPreset(presetId);

  if (msePreset) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        source={msePreset.source}
        resizeMode="contain"
        style={{
          width: size,
          height: size,
          tintColor: color,
        }}
      />
    );
  }

  const preset = getSetSymbolPreset(presetId);
  const strokeWidth = Math.max(1.8, 86 / size);
  const detailStrokeWidth = Math.max(1.3, 58 / size);

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <G>
          {preset.paths.map((path) => (
            <Path
              key={`watermark-fill-${path}`}
              d={path}
              fill={color}
              stroke={color}
              strokeLinejoin="miter"
              strokeWidth={strokeWidth}
            />
          ))}
          {preset.cutouts?.map((path) => (
            <Path
              key={`watermark-cutout-${path}`}
              d={path}
              fill="#ffffff"
              opacity={0.58}
            />
          ))}
          {preset.details?.map((path) => (
            <Path
              key={`watermark-detail-${path}`}
              d={path}
              fill="none"
              stroke="#ffffff"
              strokeLinecap="butt"
              strokeLinejoin="miter"
              strokeWidth={detailStrokeWidth}
              opacity={0.46}
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}

function PresetSetSymbol({
  preset,
  rarity,
  size,
}: {
  preset: SetSymbolPreset;
  rarity: CardRarity;
  size: number;
}) {
  const treatment = RARITY_TREATMENTS[rarity];
  const gradientId = `set-symbol-${preset.id}-${rarity}`;
  const strokeWidth = Math.max(3, 100 / size);
  const detailStrokeWidth = Math.max(2.2, 78 / size);

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id={gradientId} x1="22" y1="8" x2="78" y2="94" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={treatment.high} />
          <Stop offset="0.48" stopColor={treatment.fill} />
          <Stop offset="1" stopColor={treatment.low} />
        </LinearGradient>
      </Defs>
      <G>
        {preset.paths.map((path) => (
          <Path
            key={`shadow-${path}`}
            d={path}
            fill={treatment.shadow}
            opacity={0.35}
            transform="translate(2.4 3.2)"
          />
        ))}
        {preset.paths.map((path) => (
          <Path
            key={`outline-${path}`}
            d={path}
            fill={treatment.outline}
            stroke={treatment.outline}
            strokeLinejoin="miter"
            strokeWidth={strokeWidth}
          />
        ))}
        {preset.paths.map((path) => (
          <Path
            key={`main-${path}`}
            d={path}
            fill={`url(#${gradientId})`}
            stroke={rarity === "common" ? "#050505" : treatment.low}
            strokeLinejoin="miter"
            strokeWidth={1.6}
          />
        ))}
        {preset.cutouts?.map((path) => (
          <Path
            key={`cutout-${path}`}
            d={path}
            fill={rarity === "common" ? "#d7d7d7" : "#121212"}
            opacity={rarity === "common" ? 0.18 : 0.5}
          />
        ))}
        {preset.details?.map((path) => (
          <Path
            key={`detail-${path}`}
            d={path}
            fill="none"
            stroke={treatment.high}
            strokeLinecap="butt"
            strokeLinejoin="miter"
            strokeWidth={detailStrokeWidth}
            opacity={rarity === "common" ? 0.62 : 0.48}
          />
        ))}
      </G>
    </Svg>
  );
}

export function getSetSymbolPreset(id?: string): SetSymbolPreset {
  return SET_SYMBOL_PRESETS.find((preset) => preset.id === id) ?? SET_SYMBOL_PRESETS[0];
}
