import { DeviceMotion } from "expo-sensors";
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

function start() {
  if (subscription) {
    return;
  }

  try {
    DeviceMotion.setUpdateInterval(60);
    subscription = DeviceMotion.addListener((data) => {
      const rotation = data.rotation;

      if (!rotation) {
        return;
      }

      const tiltX = Math.max(-0.7, Math.min(0.7, rotation.gamma));
      const tiltY = Math.max(-0.7, Math.min(0.7, rotation.beta - 0.4));

      gyroX.value = 0.5 + (tiltX / 0.7) * 0.5;
      gyroY.value = 0.5 + (tiltY / 0.7) * 0.5;
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
}

export function useGyroLight(): { x: SharedValue<number>; y: SharedValue<number> } {
  useEffect(() => {
    subscriberCount += 1;

    if (subscriberCount === 1) {
      start();
    }

    return () => {
      subscriberCount = Math.max(0, subscriberCount - 1);

      if (subscriberCount === 0) {
        stop();
      }
    };
  }, []);

  return { x: gyroX, y: gyroY };
}
