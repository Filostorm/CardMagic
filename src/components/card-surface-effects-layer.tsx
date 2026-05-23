import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import Animated, {
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import {
  hasCardSurfaceEffects,
  type CardSurfaceEffects,
} from "@/lib/card-surface-effects";

type CardSurfaceEffectsLayerProps = {
  width: number;
  height: number;
  effects?: CardSurfaceEffects;
  tiltX: SharedValue<number>;
  tiltY: SharedValue<number>;
};

export function CardSurfaceEffectsLayer({
  width,
  height,
  effects,
  tiltX,
  tiltY,
}: CardSurfaceEffectsLayerProps) {
  const foilOpacity = Math.max(0, Math.min(1, effects?.foil?.opacity ?? 0));
  const foilIntensity = Math.max(0, Math.min(1, effects?.foil?.intensity ?? 0));
  const gradientColors: [string, string, string, string] = [
    `rgba(255, 255, 255, ${0.04 + foilIntensity * 0.08})`,
    `rgba(94, 222, 255, ${0.05 + foilIntensity * 0.12})`,
    `rgba(255, 112, 225, ${0.04 + foilIntensity * 0.1})`,
    `rgba(255, 255, 255, ${0.03 + foilIntensity * 0.07})`,
  ];

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: foilOpacity,
    transform: [
      { translateX: tiltX.value * width * 0.035 },
      { translateY: tiltY.value * height * 0.02 },
      { rotate: `${tiltX.value * 5}deg` },
    ],
  }));

  if (!hasCardSurfaceEffects(effects)) {
    return null;
  }

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, animatedStyle]}>
      {/* Effect slot mirrors CashGrab's shader/mask boundary; replace with Skia when foil compositing lands. */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.92, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}
