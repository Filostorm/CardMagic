import { describe, expect, it } from "vitest";

import {
  createRoughSelectionBrushPath,
  getPaddedSubjectMaskCropRegion,
  getRectDistance,
  groupRoughSelectionBrushSamples,
  scaleSubjectMaskBoxPromptForRequest,
  scaleSubjectMaskPointPromptsForRequest,
} from "@/lib/subject-mask";

describe("scaleSubjectMaskBoxPromptForRequest", () => {
  it("scales box coords by requestMaxDimension / sourceWidth", () => {
    expect(
      scaleSubjectMaskBoxPromptForRequest(
        { x_min: 100, y_min: 50, x_max: 300, y_max: 250 },
        { width: 1000, height: 800 },
        500,
      ),
    ).toEqual({ x_min: 50, y_min: 25, x_max: 150, y_max: 125 });
  });

  it("clamps negative results to 0", () => {
    const out = scaleSubjectMaskBoxPromptForRequest(
      { x_min: -10, y_min: 1, x_max: 3, y_max: 7 },
      { width: 100, height: 100 },
      100, // scale = 1
    );
    expect(out.x_min).toBe(0);
  });
});

describe("scaleSubjectMaskPointPromptsForRequest", () => {
  it("returns undefined for empty or missing input", () => {
    expect(scaleSubjectMaskPointPromptsForRequest(undefined, { width: 100, height: 100 })).toBeUndefined();
    expect(scaleSubjectMaskPointPromptsForRequest([], { width: 100, height: 100 })).toBeUndefined();
  });

  it("scales coordinates while preserving the label", () => {
    expect(
      scaleSubjectMaskPointPromptsForRequest(
        [{ x: 200, y: 100, label: 1 }],
        { width: 1000, height: 800 },
        500,
      ),
    ).toEqual([{ x: 100, y: 50, label: 1 }]);
  });
});

describe("getRectDistance", () => {
  it("is 0 for overlapping rects", () => {
    expect(
      getRectDistance({ minX: 0, minY: 0, maxX: 10, maxY: 10 }, { minX: 5, minY: 5, maxX: 15, maxY: 15 }),
    ).toBe(0);
  });

  it("returns the hypotenuse of the x/y gaps for separated rects", () => {
    // horizontal gap 3, vertical gap 4 -> hypot(3, 4) = 5
    expect(
      getRectDistance({ minX: 0, minY: 0, maxX: 10, maxY: 10 }, { minX: 13, minY: 14, maxX: 20, maxY: 20 }),
    ).toBe(5);
  });
});

describe("getPaddedSubjectMaskCropRegion", () => {
  it("pads the box and stays within source bounds", () => {
    const region = getPaddedSubjectMaskCropRegion(
      { x_min: 100, y_min: 100, x_max: 200, y_max: 200 },
      { width: 1000, height: 1000 },
    );
    expect(region.sourceWidth).toBe(1000);
    expect(region.sourceHeight).toBe(1000);
    expect(region.width).toBeGreaterThan(100); // padded beyond the 100px box
    expect(region.x).toBeGreaterThanOrEqual(0);
    expect(region.y).toBeGreaterThanOrEqual(0);
    expect(region.x + region.width).toBeLessThanOrEqual(1000);
    expect(region.y + region.height).toBeLessThanOrEqual(1000);
  });
});

describe("groupRoughSelectionBrushSamples", () => {
  it("groups samples by strokeId", () => {
    const groups = groupRoughSelectionBrushSamples([
      { x: 1, y: 1, strokeId: 0 },
      { x: 2, y: 2, strokeId: 1 },
      { x: 3, y: 3, strokeId: 0 },
    ]);
    expect(groups.length).toBe(2);
    expect(groups.find(([id]) => id === 0)?.[1].length).toBe(2);
    expect(groups.find(([id]) => id === 1)?.[1].length).toBe(1);
  });
});

describe("createRoughSelectionBrushPath", () => {
  it("returns an empty string for no samples", () => {
    expect(createRoughSelectionBrushPath([])).toBe("");
  });

  it("returns a dot path for a single sample", () => {
    expect(createRoughSelectionBrushPath([{ x: 5, y: 6, strokeId: 0 }])).toBe("M 5.0 6.0 h 0.1");
  });

  it("starts a multi-point path with a move command", () => {
    const path = createRoughSelectionBrushPath([
      { x: 1, y: 2, strokeId: 0 },
      { x: 3, y: 4, strokeId: 0 },
    ]);
    expect(path.startsWith("M 1.0 2.0")).toBe(true);
  });
});
