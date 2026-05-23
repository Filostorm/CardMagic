import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { CardSurfaceEffectsLayer } from "@/components/card-surface-effects-layer";
import { useGyroLight } from "@/components/use-gyro-light";
import type { CardSurfaceEffects } from "@/lib/card-surface-effects";

type CardTransformSurfaceProps = {
  width: number;
  aspectRatio: number;
  children: ReactNode;
  flipKey?: string | number | boolean;
  animateFlipTransition?: boolean;
  interactive?: boolean;
  rotationDegrees?: number;
  slowPivot?: boolean;
  effects?: CardSurfaceEffects;
};

type FlipTransition = {
  id: number;
  from: ReactNode;
};

export function CardTransformSurface({
  width,
  aspectRatio,
  children,
  flipKey = "front",
  animateFlipTransition = true,
  interactive = true,
  rotationDegrees = 0,
  slowPivot = true,
  effects,
}: CardTransformSurfaceProps) {
  const height = width / aspectRatio;
  const normalizedRotation = ((rotationDegrees % 360) + 360) % 360;
  const quarterTurn = normalizedRotation === 90 || normalizedRotation === 270;
  const outerWidth = quarterTurn ? height : width;
  const outerHeight = quarterTurn ? width : height;
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const flip = useSharedValue(1);
  const rotation = useSharedValue(rotationDegrees);
  const idlePivot = useSharedValue(0);
  const gyro = useGyroLight();
  const previousChildren = useRef(children);
  const previousFlipKey = useRef(flipKey);
  const transitionId = useRef(0);
  const [transition, setTransition] = useState<FlipTransition | null>(null);
  const clearTransition = useCallback((id: number) => {
    setTransition((current) => (current?.id === id ? null : current));
  }, []);

  useEffect(() => {
    if (!slowPivot) {
      idlePivot.value = withTiming(0, { duration: 220 });
      return () => cancelAnimation(idlePivot);
    }

    idlePivot.value = withRepeat(
      withTiming(1, { duration: 9000, easing: Easing.linear }),
      -1,
      false,
    );

    return () => cancelAnimation(idlePivot);
  }, [idlePivot, slowPivot]);

  useEffect(() => {
    rotation.value = withTiming(rotationDegrees, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [rotation, rotationDegrees]);

  useEffect(() => {
    if (previousFlipKey.current === flipKey) {
      previousChildren.current = children;
      return;
    }

    if (!animateFlipTransition) {
      cancelAnimation(flip);
      flip.value = 1;
      setTransition(null);
      previousFlipKey.current = flipKey;
      previousChildren.current = children;
      return;
    }

    transitionId.current += 1;
    const id = transitionId.current;

    setTransition({
      id,
      from: previousChildren.current,
    });

    flip.value = 0;
    flip.value = withSequence(
      withTiming(0.5, { duration: 160, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished) {
          runOnJS(clearTransition)(id);
        }
      }),
    );

    previousFlipKey.current = flipKey;
    previousChildren.current = children;
  }, [animateFlipTransition, children, clearTransition, flip, flipKey]);

  const tiltX = useDerivedValue(() => {
    const dragTilt = Math.max(-1, Math.min(1, dragX.value / 150));
    const gyroTilt = (gyro.x.value - 0.5) * 2;
    const t = idlePivot.value * Math.PI * 2;
    const pivotTilt = slowPivot
      ? Math.sin(t) * 0.14 + Math.sin(t * 1.618) * 0.06
      : 0;

    return Math.max(-1, Math.min(1, dragTilt + gyroTilt * 0.45 + pivotTilt));
  });

  const tiltY = useDerivedValue(() => {
    const dragTilt = Math.max(-1, Math.min(1, dragY.value / 210));
    const gyroTilt = (gyro.y.value - 0.5) * 2;
    const t = idlePivot.value * Math.PI * 2;
    const pivotTilt = slowPivot
      ? Math.cos(t) * 0.1 + Math.cos(t * 1.618) * 0.04
      : 0;

    return Math.max(-1, Math.min(1, dragTilt + gyroTilt * 0.45 + pivotTilt));
  });

  const pan = Gesture.Pan()
    .enabled(interactive)
    .activeOffsetX([-6, 6])
    .activeOffsetY([-6, 6])
    .onUpdate((event) => {
      dragX.value = event.translationX;
      dragY.value = event.translationY;
    })
    .onEnd(() => {
      dragX.value = withSpring(0, { damping: 15, stiffness: 120 });
      dragY.value = withSpring(0, { damping: 15, stiffness: 120 });
    })
    .onFinalize(() => {
      dragX.value = withSpring(0, { damping: 15, stiffness: 120 });
      dragY.value = withSpring(0, { damping: 15, stiffness: 120 });
    });

  const cardStyle = useAnimatedStyle(() => ({
    left: (outerWidth - width) / 2,
    top: (outerHeight - height) / 2,
    transform: [
      { perspective: 1100 },
      { translateX: dragX.value * 0.08 },
      { translateY: dragY.value * 0.04 },
      { rotate: `${rotation.value}deg` },
      { rotateY: `${tiltX.value * 26}deg` },
      { rotateX: `${-tiltY.value * 22}deg` },
    ],
  }), [height, outerHeight, outerWidth, rotation, width]);

  const frontStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flip.value, [0.44, 0.5, 0.56], [0.02, 1, 1]),
    zIndex: flip.value >= 0.5 ? 2 : 1,
    transform: [
      { perspective: 1200 },
      { rotateY: `${176 - flip.value * 176}deg` },
    ],
  }));

  const backStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flip.value, [0.44, 0.5, 0.56], [1, 1, 0.02]),
    zIndex: flip.value < 0.5 ? 2 : 1,
    transform: [
      { perspective: 1200 },
      { rotateY: `${-flip.value * 176}deg` },
    ],
  }));

  const content = (
    <Animated.View style={[styles.surface, { width, height }, cardStyle]}>
      {transition ? (
        <Animated.View
          pointerEvents="none"
          collapsable={false}
          style={[styles.face, { width, height }, backStyle]}
        >
          {transition.from}
        </Animated.View>
      ) : null}
      <Animated.View
        collapsable={false}
        style={[styles.face, { width, height }, transition ? frontStyle : styles.faceReady]}
      >
        {children}
      </Animated.View>
      <CardSurfaceEffectsLayer
        width={width}
        height={height}
        effects={effects}
        tiltX={tiltX}
        tiltY={tiltY}
      />
    </Animated.View>
  );

  return (
    <View style={{ width: outerWidth, height: outerHeight }}>
      {interactive ? <GestureDetector gesture={pan}>{content}</GestureDetector> : content}
    </View>
  );
}

const styles = StyleSheet.create({
  face: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  faceReady: {
    opacity: 1,
    zIndex: 1,
  },
  surface: {
    position: "absolute",
    overflow: "visible",
  },
});
