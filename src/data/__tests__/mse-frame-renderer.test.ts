import { describe, expect, it } from "vitest";

import { getMseM15LegendaryCrownFamily } from "@/data/mse-frame-crowns";

describe("getMseM15LegendaryCrownFamily", () => {
  it("keeps normal borderless legendary cards on the borderless crown", () => {
    expect(getMseM15LegendaryCrownFamily("borderless", false)).toBe("borderless");
  });

  it("uses the dedicated borderless Godzilla overlay when the alias-name box is visible", () => {
    expect(getMseM15LegendaryCrownFamily("borderless", false, { usesGodzillaAlias: true })).toBe(
      "borderlessGodzillaLegendary",
    );
  });

  it("preserves the nyx crown for non-borderless nyx legendary cards", () => {
    expect(getMseM15LegendaryCrownFamily("standard", true)).toBe("nyx");
  });
});
