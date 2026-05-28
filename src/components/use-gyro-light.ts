import { useEffect } from "react";
import { makeMutable, type SharedValue } from "react-native-reanimated";

/**
 * Module-level shared values for a tilt-driven light vector.
 * One sensor subscription updates the values; card surfaces read them from worklets.
 * The normalized range is 0..1, with 0.5/0.5 as the neutral device posture.
 */
export const gyroX: SharedValue<number> = makeMutable(0.5);
export const gyroY: SharedValue<number> = makeMutable(0.5);

let subscriberCount = 0;
let subscription: { remove: () => void } | null = null;
let gravityCenterX: number | null = null;
let gravityCenterY: number | null = null;

const TILT_RANGE_RADIANS = 0.7;
const GRAVITY_RECENTER_RATE = 0.018;

function clampTilt(value: number) {
  return Math.max(-TILT_RANGE_RADIANS, Math.min(TILT_RANGE_RADIANS, value));
}

function normalizeTilt(delta: number) {
  return 0.5 + (clampTilt(delta) / TILT_RANGE_RADIANS) * 0.5;
}

async function start() {
  if (subscription) {
    return;
  }

  try {
    const { DeviceMotion } = await import("expo-sensors");

    DeviceMotion.setUpdateInterval(60);
    subscription = DeviceMotion.addListener((data) => {
      const rotation = data.rotation;

      if (!rotation) {
        return;
      }

      const sampleX = rotation.gamma;
      const sampleY = rotation.beta;

      if (gravityCenterX === null || gravityCenterY === null) {
        gravityCenterX = sampleX;
        gravityCenterY = sampleY;
      }

      gravityCenterX += (sampleX - gravityCenterX) * GRAVITY_RECENTER_RATE;
      gravityCenterY += (sampleY - gravityCenterY) * GRAVITY_RECENTER_RATE;

      gyroX.value = normalizeTilt(sampleX - gravityCenterX);
      gyroY.value = normalizeTilt(sampleY - gravityCenterY);
    });
  } catch {
    subscription = null;
  }
}

function stop() {
  if (!subscription) {
    return;
  }

  subscription.remove();
  subscription = null;
  gravityCenterX = null;
  gravityCenterY = null;
  gyroX.value = 0.5;
  gyroY.value = 0.5;
}

export function useGyroLight(enabled = true): { x: SharedValue<number>; y: SharedValue<number> } {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    subscriberCount += 1;

    if (subscriberCount === 1) {
      void start();
    }

    return () => {
      subscriberCount = Math.max(0, subscriberCount - 1);

      if (subscriberCount === 0) {
        stop();
      }
    };
  }, [enabled]);

  return { x: gyroX, y: gyroY };
}
