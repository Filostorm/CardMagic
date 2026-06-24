import type { SubjectMaskBoxPrompt, SubjectMaskPointPrompt } from "@/lib/ai-edge";

// Pure subject-mask computer-vision helpers extracted from App.tsx: request
// geometry scaling, connected-component subject extraction, selection-
// constrained masking, and brush/selection sample utilities. These operate only
// on raw pixel/alpha buffers and plain geometry — no app state, no canvas, no
// native modules — so they live here as a standalone, unit-testable module.

// Private copy of the generic numeric clamp (App keeps its own); duplicated here
// to keep this module free of any import back into App.tsx.
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export const SUBJECT_MASK_REQUEST_MAX_DIMENSION = 640;
export const SUBJECT_MASK_GEOMETRY_REQUEST_MAX_DIMENSION = 448;
export const SUBJECT_MASK_PAINTED_CROP_MAX_DIMENSION = 512;

export type MaskEditDisplayLayout = {
  cropWidth: number;
  cropHeight: number;
  imageLeft: number;
  imageTop: number;
  imageWidth: number;
  imageHeight: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  coordinateScale: number;
};
export type RoughSelectionBrushSample = {
  x: number;
  y: number;
  strokeId: number;
};
export type SubjectMaskSelectionSample = {
  x: number;
  y: number;
  strokeId?: number;
};
export type SubjectMaskCropRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
};
export type SubjectMaskCropRequest = {
  uri: string;
  cropRegion: SubjectMaskCropRegion;
  width: number;
  height: number;
};

export function scaleSubjectMaskBoxPromptForRequest(
  boxPrompt: SubjectMaskBoxPrompt,
  sourceDimensions: { width: number; height: number },
  requestMaxDimension = SUBJECT_MASK_REQUEST_MAX_DIMENSION,
): SubjectMaskBoxPrompt {
  const scale = requestMaxDimension / sourceDimensions.width;

  return {
    x_min: Math.max(0, Math.round(boxPrompt.x_min * scale)),
    y_min: Math.max(0, Math.round(boxPrompt.y_min * scale)),
    x_max: Math.max(0, Math.round(boxPrompt.x_max * scale)),
    y_max: Math.max(0, Math.round(boxPrompt.y_max * scale)),
  };
}
export function scaleSubjectMaskPointPromptsForRequest(
  pointPrompts: SubjectMaskPointPrompt[] | undefined,
  sourceDimensions: { width: number; height: number },
  requestMaxDimension = SUBJECT_MASK_REQUEST_MAX_DIMENSION,
): SubjectMaskPointPrompt[] | undefined {
  if (!pointPrompts?.length) {
    return undefined;
  }

  const scale = requestMaxDimension / sourceDimensions.width;

  return pointPrompts.map((pointPrompt) => ({
    ...pointPrompt,
    x: Math.max(0, Math.round(pointPrompt.x * scale)),
    y: Math.max(0, Math.round(pointPrompt.y * scale)),
  }));
}
export function getPaddedSubjectMaskCropRegion(
  boxPrompt: SubjectMaskBoxPrompt,
  sourceDimensions: { width: number; height: number },
): SubjectMaskCropRegion {
  const boxWidth = Math.max(1, boxPrompt.x_max - boxPrompt.x_min);
  const boxHeight = Math.max(1, boxPrompt.y_max - boxPrompt.y_min);
  const paddingX = Math.max(18, Math.min(boxWidth * 0.16, sourceDimensions.width * 0.08));
  const paddingY = Math.max(18, Math.min(boxHeight * 0.16, sourceDimensions.height * 0.08));
  const cropWidth = Math.min(sourceDimensions.width, Math.ceil(boxWidth + paddingX * 2));
  const cropHeight = Math.min(sourceDimensions.height, Math.ceil(boxHeight + paddingY * 2));
  const centerX = boxPrompt.x_min + boxWidth / 2;
  const centerY = boxPrompt.y_min + boxHeight / 2;
  const x = Math.round(clamp(centerX - cropWidth / 2, 0, Math.max(0, sourceDimensions.width - cropWidth)));
  const y = Math.round(clamp(centerY - cropHeight / 2, 0, Math.max(0, sourceDimensions.height - cropHeight)));

  return {
    x,
    y,
    width: Math.round(cropWidth),
    height: Math.round(cropHeight),
    sourceWidth: sourceDimensions.width,
    sourceHeight: sourceDimensions.height,
  };
}
export function getPrimarySubjectComponentMask(alpha: Uint8ClampedArray, width: number, height: number) {
  const pixelCount = width * height;
  const componentLabels = new Int32Array(pixelCount);
  componentLabels.fill(-1);

  const seedThreshold = 84;
  const softThreshold = 28;
  const stack = new Int32Array(pixelCount);
  const componentStats: Array<{
    count: number;
    alphaSum: number;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  }> = [];
  let bestLabel = -1;
  let bestScore = 0;
  let currentLabel = 0;

  for (let start = 0; start < pixelCount; start += 1) {
    if (alpha[start] < seedThreshold || componentLabels[start] !== -1) {
      continue;
    }

    let stackLength = 0;
    let count = 0;
    let alphaSum = 0;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;

    stack[stackLength] = start;
    stackLength += 1;
    componentLabels[start] = currentLabel;

    while (stackLength > 0) {
      stackLength -= 1;
      const pixelIndex = stack[stackLength];
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);
      count += 1;
      alphaSum += alpha[pixelIndex];
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);

      for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
        for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
          if (xOffset === 0 && yOffset === 0) {
            continue;
          }

          const nextX = x + xOffset;
          const nextY = y + yOffset;

          if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
            continue;
          }

          const nextIndex = nextY * width + nextX;

          if (componentLabels[nextIndex] === -1 && alpha[nextIndex] >= seedThreshold) {
            componentLabels[nextIndex] = currentLabel;
            stack[stackLength] = nextIndex;
            stackLength += 1;
          }
        }
      }
    }

    const componentArea = Math.max(1, (maxX - minX + 1) * (maxY - minY + 1));
    const fillRatio = count / componentArea;
    const averageAlpha = alphaSum / Math.max(1, count);
    const minUsefulPixels = Math.max(96, pixelCount * 0.004);
    const score = count >= minUsefulPixels ? count * (0.75 + fillRatio) * (averageAlpha / 255) : 0;
    componentStats[currentLabel] = { count, alphaSum, minX, minY, maxX, maxY };

    if (score > bestScore) {
      bestScore = score;
      bestLabel = currentLabel;
    }

    currentLabel += 1;
  }

  const keepMask = new Uint8Array(pixelCount);

  if (bestLabel < 0) {
    for (let index = 0; index < pixelCount; index += 1) {
      keepMask[index] = alpha[index] >= seedThreshold ? 1 : 0;
    }

    return keepMask;
  }

  const primary = componentStats[bestLabel];
  const accessoryDistance = Math.max(16, Math.round(Math.min(width, height) * 0.13));
  const primaryAccessoryBounds = {
    minX: Math.max(0, primary.minX - accessoryDistance),
    minY: Math.max(0, primary.minY - accessoryDistance * 1.45),
    maxX: Math.min(width - 1, primary.maxX + accessoryDistance),
    maxY: Math.min(height - 1, primary.maxY + accessoryDistance * 0.48),
  };
  const keptLabels = new Set<number>([bestLabel]);

  componentStats.forEach((stats, label) => {
    if (label === bestLabel || !stats) {
      return;
    }

    const countRatio = stats.count / Math.max(1, primary.count);
    const averageAlpha = stats.alphaSum / Math.max(1, stats.count);
    const overlapsAccessoryBounds =
      stats.maxX >= primaryAccessoryBounds.minX &&
      stats.minX <= primaryAccessoryBounds.maxX &&
      stats.maxY >= primaryAccessoryBounds.minY &&
      stats.minY <= primaryAccessoryBounds.maxY;
    const closeEnough =
      getRectDistance(stats, primary) <= accessoryDistance ||
      overlapsAccessoryBounds;
    const likelyAccessory =
      stats.count >= Math.max(24, pixelCount * 0.00018) &&
      countRatio <= 0.42 &&
      averageAlpha >= 72 &&
      closeEnough;

    if (likelyAccessory) {
      keptLabels.add(label);
    }
  });

  for (let index = 0; index < pixelCount; index += 1) {
    if (keptLabels.has(componentLabels[index])) {
      keepMask[index] = 1;
    }
  }

  const featherMask = new Uint8Array(pixelCount);

  for (let index = 0; index < pixelCount; index += 1) {
    if (alpha[index] < softThreshold) {
      continue;
    }

    const x = index % width;
    const y = Math.floor(index / width);
    let nearPrimarySubject = false;

    for (let yOffset = -2; yOffset <= 2 && !nearPrimarySubject; yOffset += 1) {
      for (let xOffset = -2; xOffset <= 2; xOffset += 1) {
        const nextX = x + xOffset;
        const nextY = y + yOffset;

        if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
          continue;
        }

        if (keepMask[nextY * width + nextX]) {
          nearPrimarySubject = true;
          break;
        }
      }
    }

    featherMask[index] = nearPrimarySubject ? 1 : 0;
  }

  return featherMask;
}
export function getSelectionConstrainedSubjectComponentMask(
  alpha: Uint8ClampedArray,
  width: number,
  height: number,
  selection: {
    boxPrompt?: SubjectMaskBoxPrompt;
    pointPrompts?: SubjectMaskPointPrompt[];
    brushSamples?: SubjectMaskSelectionSample[];
    brushRadius?: number;
  },
) {
  const pixelCount = width * height;
  const foregroundPoints = (selection.pointPrompts ?? [])
    .filter((pointPrompt) => pointPrompt.label === 1)
    .map((pointPrompt) => ({
      x: Math.round(clamp(pointPrompt.x, 0, width - 1)),
      y: Math.round(clamp(pointPrompt.y, 0, height - 1)),
    }));
  const backgroundPoints = (selection.pointPrompts ?? [])
    .filter((pointPrompt) => pointPrompt.label === 0)
    .map((pointPrompt) => ({
      x: Math.round(clamp(pointPrompt.x, 0, width - 1)),
      y: Math.round(clamp(pointPrompt.y, 0, height - 1)),
    }));
  const brushSamples = (selection.brushSamples ?? [])
    .map((sample) => ({
      x: Math.round(clamp(sample.x, 0, width - 1)),
      y: Math.round(clamp(sample.y, 0, height - 1)),
      strokeId: sample.strokeId,
    }));
  const positiveSamples = brushSamples.length > 0 ? brushSamples : foregroundPoints;

  let pointBox: { minX: number; minY: number; maxX: number; maxY: number } | null = null;

  if (positiveSamples.length > 0) {
    pointBox = {
      minX: Math.min(...positiveSamples.map((point) => point.x)),
      minY: Math.min(...positiveSamples.map((point) => point.y)),
      maxX: Math.max(...positiveSamples.map((point) => point.x)),
      maxY: Math.max(...positiveSamples.map((point) => point.y)),
    };
  }

  const promptBox = selection.boxPrompt
    ? {
      minX: Math.round(clamp(selection.boxPrompt.x_min, 0, width - 1)),
      minY: Math.round(clamp(selection.boxPrompt.y_min, 0, height - 1)),
      maxX: Math.round(clamp(selection.boxPrompt.x_max, 0, width - 1)),
      maxY: Math.round(clamp(selection.boxPrompt.y_max, 0, height - 1)),
    }
    : null;
  const sourceBox = promptBox && pointBox
    ? {
      minX: Math.min(promptBox.minX, pointBox.minX),
      minY: Math.min(promptBox.minY, pointBox.minY),
      maxX: Math.max(promptBox.maxX, pointBox.maxX),
      maxY: Math.max(promptBox.maxY, pointBox.maxY),
    }
    : promptBox ?? pointBox;

  if (!sourceBox) {
    return null;
  }

  const boxWidth = Math.max(1, sourceBox.maxX - sourceBox.minX);
  const boxHeight = Math.max(1, sourceBox.maxY - sourceBox.minY);
  const normalizedBrushRadius = selection.brushRadius && selection.brushRadius > 0
    ? Math.round(clamp(selection.brushRadius, 8, Math.min(116, Math.min(width, height) * 0.16)))
    : null;
  const seedRadius = normalizedBrushRadius
    ? Math.round(clamp(normalizedBrushRadius * 0.38, 7, Math.min(32, Math.min(width, height) * 0.045)))
    : Math.round(clamp(Math.min(boxWidth, boxHeight) * 0.1, 10, Math.min(46, Math.min(width, height) * 0.055)));
  const corridorRadius = positiveSamples.length > 0
    ? Math.round(clamp(Math.min(Math.max(8, Math.min(boxWidth, boxHeight) * 0.045), seedRadius), 8, Math.min(28, Math.min(width, height) * 0.035)))
    : seedRadius;
  const expansionRadiusMax = normalizedBrushRadius
    ? Math.min(132, Math.max(normalizedBrushRadius + 8, Math.min(width, height) * 0.18))
    : Math.min(104, Math.max(corridorRadius + 8, Math.min(width, height) * 0.12));
  const expansionRadius = positiveSamples.length > 1
    ? normalizedBrushRadius
      ? Math.round(clamp(normalizedBrushRadius * 1.16, normalizedBrushRadius, expansionRadiusMax))
      : Math.round(clamp(Math.max(corridorRadius * 3.25, Math.min(boxWidth, boxHeight) * 0.38), corridorRadius + 8, expansionRadiusMax))
    : corridorRadius;
  const paddingX = Math.max(12, Math.min(expansionRadius * 0.72, Math.max(20, boxWidth * 0.09), width * 0.05));
  const paddingY = Math.max(12, Math.min(expansionRadius * 0.72, Math.max(20, boxHeight * 0.09), height * 0.05));
  const clipBounds = {
    minX: Math.round(clamp(sourceBox.minX - paddingX, 0, width - 1)),
    minY: Math.round(clamp(sourceBox.minY - paddingY, 0, height - 1)),
    maxX: Math.round(clamp(sourceBox.maxX + paddingX, 0, width - 1)),
    maxY: Math.round(clamp(sourceBox.maxY + paddingY, 0, height - 1)),
  };
  const seedThreshold = 84;
  const softThreshold = 28;
  const seedMask = new Uint8Array(pixelCount);
  const expansionMask = positiveSamples.length > 1 ? new Uint8Array(pixelCount) : null;
  const exclusionMask = backgroundPoints.length > 0 ? new Uint8Array(pixelCount) : null;
  const seedPoints = positiveSamples.length > 0
    ? positiveSamples
    : [{ x: Math.round((sourceBox.minX + sourceBox.maxX) / 2), y: Math.round((sourceBox.minY + sourceBox.maxY) / 2) }];

  for (const point of seedPoints) {
    paintPointRadiusMask(seedMask, width, height, point, corridorRadius);

    if (expansionMask) {
      paintPointRadiusMask(expansionMask, width, height, point, expansionRadius);
    }
  }

  if (brushSamples.length > 1) {
    const strokes = groupSubjectMaskSelectionSamples(brushSamples);

    for (const [, samples] of strokes) {
      for (let index = 1; index < samples.length; index += 1) {
        paintStrokeCorridorMask(seedMask, width, height, samples[index - 1], samples[index], corridorRadius);

        if (expansionMask) {
          paintStrokeCorridorMask(expansionMask, width, height, samples[index - 1], samples[index], expansionRadius);
        }
      }
    }
  } else if (positiveSamples.length > 1) {
    for (let index = 1; index < positiveSamples.length; index += 1) {
      paintStrokeCorridorMask(seedMask, width, height, positiveSamples[index - 1], positiveSamples[index], corridorRadius);

      if (expansionMask) {
        paintStrokeCorridorMask(expansionMask, width, height, positiveSamples[index - 1], positiveSamples[index], expansionRadius);
      }
    }
  }

  if (exclusionMask) {
    const exclusionRadius = Math.round(clamp((normalizedBrushRadius ?? expansionRadius) * 0.82, 14, Math.min(72, Math.min(width, height) * 0.1)));

    for (const point of backgroundPoints) {
      paintPointRadiusMask(exclusionMask, width, height, point, exclusionRadius);
    }
  }

  const componentLabels = new Int32Array(pixelCount);
  componentLabels.fill(-1);
  const stack = new Int32Array(pixelCount);
  const componentStats: Array<{
    count: number;
    seedOverlap: number;
    exclusionOverlap: number;
    alphaSum: number;
  }> = [];
  let currentLabel = 0;
  let bestLabel = -1;
  let bestScore = 0;

  for (let start = 0; start < pixelCount; start += 1) {
    if (alpha[start] < seedThreshold || componentLabels[start] !== -1) {
      continue;
    }

    let stackLength = 0;
    let count = 0;
    let seedOverlap = 0;
    let exclusionOverlap = 0;
    let alphaSum = 0;

    stack[stackLength] = start;
    stackLength += 1;
    componentLabels[start] = currentLabel;

    while (stackLength > 0) {
      stackLength -= 1;
      const pixelIndex = stack[stackLength];
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);
      count += 1;
      alphaSum += alpha[pixelIndex];

      if (seedMask[pixelIndex]) {
        seedOverlap += 1;
      }

      if (exclusionMask?.[pixelIndex]) {
        exclusionOverlap += 1;
      }

      for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
        for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
          if (xOffset === 0 && yOffset === 0) {
            continue;
          }

          const nextX = x + xOffset;
          const nextY = y + yOffset;

          if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
            continue;
          }

          const nextIndex = nextY * width + nextX;

          if (componentLabels[nextIndex] === -1 && alpha[nextIndex] >= seedThreshold) {
            componentLabels[nextIndex] = currentLabel;
            stack[stackLength] = nextIndex;
            stackLength += 1;
          }
        }
      }
    }

    const averageAlpha = alphaSum / Math.max(1, count);
    const exclusionPenalty = 1 + exclusionOverlap * 0.85;
    const score = seedOverlap > 0 ? (seedOverlap * averageAlpha) / (Math.sqrt(Math.max(1, count)) * exclusionPenalty) : 0;
    componentStats[currentLabel] = { count, seedOverlap, exclusionOverlap, alphaSum };

    if (score > bestScore) {
      bestScore = score;
      bestLabel = currentLabel;
    }

    currentLabel += 1;
  }

  const keepMask = new Uint8Array(pixelCount);

  if (bestLabel < 0) {
    for (let y = clipBounds.minY; y <= clipBounds.maxY; y += 1) {
      for (let x = clipBounds.minX; x <= clipBounds.maxX; x += 1) {
        const pixelIndex = y * width + x;
        const insideSelectionEnvelope = expansionMask ? expansionMask[pixelIndex] : seedMask[pixelIndex];
        keepMask[pixelIndex] = alpha[pixelIndex] >= seedThreshold && insideSelectionEnvelope ? 1 : 0;
      }
    }

    return keepMask;
  }

  const bestSeedOverlap = Math.max(1, componentStats[bestLabel]?.seedOverlap ?? 1);
  const keptLabels = new Set<number>([bestLabel]);

  componentStats.forEach((stats, label) => {
    if (label === bestLabel || !stats) {
      return;
    }

    const seedOverlapEnough = stats.seedOverlap >= Math.max(4, bestSeedOverlap * 0.32);
    const exclusionRatio = stats.exclusionOverlap / Math.max(1, stats.seedOverlap);

    if (seedOverlapEnough && exclusionRatio < 0.42) {
      keptLabels.add(label);
    }
  });

  for (let y = clipBounds.minY; y <= clipBounds.maxY; y += 1) {
    for (let x = clipBounds.minX; x <= clipBounds.maxX; x += 1) {
      const pixelIndex = y * width + x;
      const insideSelectionEnvelope = !expansionMask || expansionMask[pixelIndex];

      if (insideSelectionEnvelope && !exclusionMask?.[pixelIndex] && keptLabels.has(componentLabels[pixelIndex])) {
        keepMask[pixelIndex] = 1;
      }
    }
  }

  const featherMask = new Uint8Array(pixelCount);

  for (let y = clipBounds.minY; y <= clipBounds.maxY; y += 1) {
    for (let x = clipBounds.minX; x <= clipBounds.maxX; x += 1) {
      const pixelIndex = y * width + x;

      if (alpha[pixelIndex] < softThreshold) {
        continue;
      }

      if (exclusionMask?.[pixelIndex]) {
        continue;
      }

      let nearSelectedSubject = false;

      for (let yOffset = -2; yOffset <= 2 && !nearSelectedSubject; yOffset += 1) {
        for (let xOffset = -2; xOffset <= 2; xOffset += 1) {
          const nextX = x + xOffset;
          const nextY = y + yOffset;

          if (nextX < clipBounds.minX || nextX > clipBounds.maxX || nextY < clipBounds.minY || nextY > clipBounds.maxY) {
            continue;
          }

          if (keepMask[nextY * width + nextX]) {
            nearSelectedSubject = true;
            break;
          }
        }
      }

      featherMask[pixelIndex] = nearSelectedSubject ? 1 : 0;
    }
  }

  return featherMask;
}
export function groupSubjectMaskSelectionSamples(
  samples: SubjectMaskSelectionSample[],
): Array<[number, SubjectMaskSelectionSample[]]> {
  const strokes = new Map<number, SubjectMaskSelectionSample[]>();

  samples.forEach((sample, index) => {
    const strokeId = sample.strokeId ?? index;
    const stroke = strokes.get(strokeId) ?? [];
    stroke.push(sample);
    strokes.set(strokeId, stroke);
  });

  return Array.from(strokes.entries());
}
export function paintPointRadiusMask(
  mask: Uint8Array,
  width: number,
  height: number,
  point: { x: number; y: number },
  radius: number,
) {
  const radiusSquared = radius * radius;
  const minX = Math.max(0, Math.floor(point.x - radius));
  const maxX = Math.min(width - 1, Math.ceil(point.x + radius));
  const minY = Math.max(0, Math.floor(point.y - radius));
  const maxY = Math.min(height - 1, Math.ceil(point.y + radius));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const distanceSquared = (x - point.x) ** 2 + (y - point.y) ** 2;

      if (distanceSquared <= radiusSquared) {
        mask[y * width + x] = 1;
      }
    }
  }
}
export function paintStrokeCorridorMask(
  mask: Uint8Array,
  width: number,
  height: number,
  start: { x: number; y: number },
  end: { x: number; y: number },
  radius: number,
) {
  const radiusSquared = radius * radius;
  const minX = Math.max(0, Math.floor(Math.min(start.x, end.x) - radius));
  const maxX = Math.min(width - 1, Math.ceil(Math.max(start.x, end.x) + radius));
  const minY = Math.max(0, Math.floor(Math.min(start.y, end.y) - radius));
  const maxY = Math.min(height - 1, Math.ceil(Math.max(start.y, end.y) + radius));
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const projection = lengthSquared > 0
        ? clamp(((x - start.x) * deltaX + (y - start.y) * deltaY) / lengthSquared, 0, 1)
        : 0;
      const closestX = start.x + deltaX * projection;
      const closestY = start.y + deltaY * projection;
      const distanceSquared = (x - closestX) ** 2 + (y - closestY) ** 2;

      if (distanceSquared <= radiusSquared) {
        mask[y * width + x] = 1;
      }
    }
  }
}
export function getRectDistance(
  first: { minX: number; minY: number; maxX: number; maxY: number },
  second: { minX: number; minY: number; maxX: number; maxY: number },
) {
  const xGap = first.maxX < second.minX
    ? second.minX - first.maxX
    : second.maxX < first.minX
      ? first.minX - second.maxX
      : 0;
  const yGap = first.maxY < second.minY
    ? second.minY - first.maxY
    : second.maxY < first.minY
      ? first.minY - second.maxY
      : 0;

  return Math.hypot(xGap, yGap);
}
export function getMaskEditSourcePoint(
  point: { x: number; y: number },
  layout: MaskEditDisplayLayout,
  sourceWidth: number,
  sourceHeight: number,
) {
  const imageCenterX = layout.imageLeft + layout.imageWidth / 2 + layout.offsetX * layout.coordinateScale;
  const imageCenterY = layout.imageTop + layout.imageHeight / 2 + layout.offsetY * layout.coordinateScale;
  const localX = (point.x - imageCenterX) / layout.scale + layout.imageWidth / 2;
  const localY = (point.y - imageCenterY) / layout.scale + layout.imageHeight / 2;

  if (localX < 0 || localX > layout.imageWidth || localY < 0 || localY > layout.imageHeight) {
    return null;
  }

  return {
    x: Math.round((localX / layout.imageWidth) * sourceWidth),
    y: Math.round((localY / layout.imageHeight) * sourceHeight),
  };
}
export function groupRoughSelectionBrushSamples(
  samples: RoughSelectionBrushSample[],
): Array<[number, RoughSelectionBrushSample[]]> {
  const strokes = new Map<number, RoughSelectionBrushSample[]>();

  for (const sample of samples) {
    const stroke = strokes.get(sample.strokeId) ?? [];
    stroke.push(sample);
    strokes.set(sample.strokeId, stroke);
  }

  return Array.from(strokes.entries());
}
export function createRoughSelectionBrushPath(samples: RoughSelectionBrushSample[]) {
  if (samples.length === 0) {
    return "";
  }

  if (samples.length === 1) {
    const sample = samples[0];
    return `M ${sample.x.toFixed(1)} ${sample.y.toFixed(1)} h 0.1`;
  }

  const [firstSample, ...nextSamples] = samples;
  return [
    `M ${firstSample.x.toFixed(1)} ${firstSample.y.toFixed(1)}`,
    ...nextSamples.map((sample) => `L ${sample.x.toFixed(1)} ${sample.y.toFixed(1)}`),
  ].join(" ");
}
