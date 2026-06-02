import { useEffect, useState } from "react";
import { Text } from "react-native";

function useElapsedSeconds(active: boolean): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }

    const startedAt = Date.now();
    setElapsed(0);
    const intervalId = setInterval(() => {
      setElapsed(Math.max(0, Math.round((Date.now() - startedAt) / 1000)));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [active]);

  return elapsed;
}

function withElapsedLabel(label: string, elapsedSeconds: number, active: boolean): string {
  return active && elapsedSeconds > 0 ? `${label} (${elapsedSeconds}s)` : label;
}

export function GenerationButtonLabel({
  busy,
  idleLabel,
  busyLabel = "Generating",
}: {
  busy: boolean;
  idleLabel: string;
  busyLabel?: string;
}) {
  const elapsed = useElapsedSeconds(busy);

  return (
    <Text selectable={false} style={{ color: "#ffffff", fontSize: 14, fontWeight: "900" }}>
      {busy ? withElapsedLabel(busyLabel, elapsed, true) : idleLabel}
    </Text>
  );
}
