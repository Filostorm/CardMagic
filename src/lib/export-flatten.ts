// Option B export helpers (web-only).
//
// html2canvas cannot rasterize CSS/SVG masks, which is how the editor draws the
// borderless pinline and the rarity set symbol. These helpers flatten those
// masked layers into plain raster PNGs via an offscreen <canvas> so html2canvas
// can capture them faithfully — keeping html2canvas's clean font rendering while
// avoiding foreignObject quirks.

// Card art-space fallbacks if a mask image has no intrinsic size.
const FALLBACK_CARD_WIDTH = 375;
const FALLBACK_CARD_HEIGHT = 523;

// Count of in-flight composites. The export flow waits for this to reach 0
// before capturing, since the flattened <img> is produced asynchronously.
const FLATTEN_PENDING_KEY = "__cardMagicFlattenPending";

export function adjustFlattenPending(delta: number) {
  if (typeof window === "undefined") {
    return;
  }
  const store = window as unknown as Record<string, number>;
  store[FLATTEN_PENDING_KEY] = Math.max(0, (store[FLATTEN_PENDING_KEY] ?? 0) + delta);
}

// Resolves once all in-flight composites finish (or the timeout elapses).
export async function waitForFlattenedFrameComposites(timeoutMs = 4000): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }
  const store = window as unknown as Record<string, number>;
  // Let the layers' mount effects run and increment the counter before polling.
  await new Promise<void>((resolve) => setTimeout(resolve, 60));
  const startedAt = Date.now();
  while ((store[FLATTEN_PENDING_KEY] ?? 0) > 0 && Date.now() - startedAt < timeoutMs) {
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
  }
}

export function loadHtmlImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      let source = "image URI";

      if (uri.startsWith("data:")) {
        source = `data URI (${uri.length} chars)`;
      } else if (uri.startsWith("blob:")) {
        source = "browser blob URI";
      } else {
        try {
          source = new URL(uri).origin;
        } catch {
          source = uri.slice(0, 80);
        }
      }

      reject(new Error(`Image failed to load from ${source}. The URL may be expired, blocked by CORS, or unreachable.`));
    };
    img.src = uri;
  });
}

// Flatten a (optionally blended) frame image masked by a pinline-only mask.
export async function compositeFlattenedMaskedFrame({
  sourceUri,
  leftUri,
  rightUri,
  maskUri,
  mirrorX,
}: {
  sourceUri: string | null;
  leftUri: string | null;
  rightUri: string | null;
  maskUri: string;
  mirrorX: boolean;
}): Promise<string> {
  const mask = await loadHtmlImage(maskUri);
  const width = mask.naturalWidth || FALLBACK_CARD_WIDTH;
  const height = mask.naturalHeight || FALLBACK_CARD_HEIGHT;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("CardMagic could not acquire a 2D canvas context.");
  }

  const drawMirrored = (context: CanvasRenderingContext2D, img: CanvasImageSource) => {
    if (mirrorX) {
      context.save();
      context.translate(width, 0);
      context.scale(-1, 1);
      context.drawImage(img, 0, 0, width, height);
      context.restore();
    } else {
      context.drawImage(img, 0, 0, width, height);
    }
  };

  if (leftUri && rightUri) {
    // Replicate the left/right blend the SVG layer applies before masking.
    const [left, right] = await Promise.all([loadHtmlImage(leftUri), loadHtmlImage(rightUri)]);
    drawMirrored(ctx, left);

    const blend = document.createElement("canvas");
    blend.width = width;
    blend.height = height;
    const blendCtx = blend.getContext("2d");
    if (blendCtx) {
      drawMirrored(blendCtx, right);
      blendCtx.globalCompositeOperation = "destination-in";
      const gradient = blendCtx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(0.34, "rgba(0,0,0,0)");
      gradient.addColorStop(0.66, "rgba(0,0,0,1)");
      gradient.addColorStop(1, "rgba(0,0,0,1)");
      blendCtx.fillStyle = gradient;
      blendCtx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 0.96;
      ctx.drawImage(blend, 0, 0);
      ctx.globalAlpha = 1;
    }
  } else if (sourceUri) {
    const src = await loadHtmlImage(sourceUri);
    drawMirrored(ctx, src);
  } else {
    throw new Error("CardMagic had no frame source to flatten.");
  }

  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(mask, 0, 0, width, height);
  return canvas.toDataURL("image/png");
}

function drawLuminanceMask(
  ctx: CanvasRenderingContext2D,
  mask: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = FALLBACK_CARD_WIDTH;
  maskCanvas.height = FALLBACK_CARD_HEIGHT;
  const maskCtx = maskCanvas.getContext("2d");
  if (!maskCtx) {
    throw new Error("CardMagic could not acquire a mask canvas context.");
  }

  maskCtx.drawImage(mask, x, y, width, height);
  const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
  const { data } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    const luminance = Math.round((data[index] * 0.2126) + (data[index + 1] * 0.7152) + (data[index + 2] * 0.0722));
    data[index + 3] = Math.round((luminance * data[index + 3]) / 255);
    data[index] = 0;
    data[index + 1] = 0;
    data[index + 2] = 0;
  }

  maskCtx.putImageData(imageData, 0, 0);
  ctx.drawImage(maskCanvas, 0, 0);
}

export async function compositeFlattenedMaskedArt({
  artUri,
  maskUri,
  overlayUri,
  overlayOpacity,
  artRect,
  maskRect,
  artTransform,
  imageAspectRatio,
  grayscale,
}: {
  artUri: string | null;
  maskUri: string;
  overlayUri: string | null;
  overlayOpacity: number;
  artRect: { x: number; y: number; width: number; height: number };
  maskRect: { x: number; y: number; width: number; height: number };
  artTransform: { offsetX: number; offsetY: number; scale: number };
  imageAspectRatio?: number | null;
  grayscale: boolean;
}): Promise<string> {
  const [mask, art, overlay] = await Promise.all([
    loadHtmlImage(maskUri),
    artUri ? loadHtmlImage(artUri) : Promise.resolve(null),
    overlayUri ? loadHtmlImage(overlayUri) : Promise.resolve(null),
  ]);
  const canvas = document.createElement("canvas");
  canvas.width = FALLBACK_CARD_WIDTH;
  canvas.height = FALLBACK_CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("CardMagic could not acquire a 2D canvas context.");
  }

  const layer = document.createElement("canvas");
  layer.width = FALLBACK_CARD_WIDTH;
  layer.height = FALLBACK_CARD_HEIGHT;
  const layerCtx = layer.getContext("2d");
  if (!layerCtx) {
    throw new Error("CardMagic could not acquire an art canvas context.");
  }

  layerCtx.save();
  if (grayscale) {
    layerCtx.filter = "grayscale(1)";
  }

  if (art) {
    const viewportAspectRatio = artRect.width / artRect.height;
    const resolvedAspectRatio = imageAspectRatio || ((art.naturalWidth || artRect.width) / (art.naturalHeight || artRect.height));
    const drawWidth = resolvedAspectRatio > viewportAspectRatio ? artRect.height * resolvedAspectRatio : artRect.width;
    const drawHeight = resolvedAspectRatio < viewportAspectRatio ? artRect.width / resolvedAspectRatio : artRect.height;
    const drawX = artRect.x + (artRect.width - drawWidth) / 2;
    const drawY = artRect.y + (artRect.height - drawHeight) / 2;
    const centerX = artRect.x + artRect.width / 2;
    const centerY = artRect.y + artRect.height / 2;

    layerCtx.translate(artTransform.offsetX, artTransform.offsetY);
    layerCtx.translate(centerX, centerY);
    layerCtx.scale(artTransform.scale, artTransform.scale);
    layerCtx.translate(-centerX, -centerY);
    layerCtx.drawImage(art, drawX, drawY, drawWidth, drawHeight);
  } else {
    const gradient = layerCtx.createLinearGradient(0, artRect.y, 0, artRect.y + artRect.height);
    gradient.addColorStop(0, "#24332f");
    gradient.addColorStop(0.55, "#78915e");
    gradient.addColorStop(1, "#d4bf86");
    layerCtx.fillStyle = gradient;
    layerCtx.fillRect(artRect.x, artRect.y, artRect.width, artRect.height);
  }
  layerCtx.restore();

  if (overlay) {
    layerCtx.save();
    layerCtx.globalAlpha = overlayOpacity;
    layerCtx.drawImage(overlay, 0, 0, FALLBACK_CARD_WIDTH, FALLBACK_CARD_HEIGHT);
    layerCtx.restore();
  }

  ctx.drawImage(layer, 0, 0);
  ctx.globalCompositeOperation = "destination-in";
  drawLuminanceMask(ctx, mask, maskRect.x, maskRect.y, maskRect.width, maskRect.height);

  return canvas.toDataURL("image/png");
}

// Flatten the rarity set symbol — the editor's three CSS-masked layers (shadow,
// outline, metallic gradient fill) — into a single PNG. Mirrors the layout in
// SetSymbolMark's web mask path.
export async function compositeRaritySetSymbol({
  symbolUri,
  shadow,
  outline,
  high,
  fill,
  low,
  resolution = 256,
}: {
  symbolUri: string;
  shadow: string;
  outline: string;
  high: string;
  fill: string;
  low: string;
  resolution?: number;
}): Promise<string> {
  const symbol = await loadHtmlImage(symbolUri);
  const res = resolution;
  const out = document.createElement("canvas");
  out.width = res;
  out.height = res;
  const octx = out.getContext("2d");
  if (!octx) {
    throw new Error("CardMagic could not acquire a 2D canvas context.");
  }

  // "contain" fit of the symbol within the square box, centered.
  const symbolW = symbol.naturalWidth || res;
  const symbolH = symbol.naturalHeight || res;
  const fitScale = Math.min(res / symbolW, res / symbolH);
  const drawW = symbolW * fitScale;
  const drawH = symbolH * fitScale;
  const drawX = (res - drawW) / 2;
  const drawY = (res - drawH) / 2;

  const makeLayer = (
    paint: (ctx: CanvasRenderingContext2D) => void,
    transform?: { scale: number; tx: number; ty: number },
  ): HTMLCanvasElement => {
    const layer = document.createElement("canvas");
    layer.width = res;
    layer.height = res;
    const lctx = layer.getContext("2d");
    if (!lctx) {
      return layer;
    }
    paint(lctx);
    lctx.globalCompositeOperation = "destination-in";
    lctx.save();
    if (transform) {
      lctx.translate(res / 2, res / 2);
      lctx.scale(transform.scale, transform.scale);
      lctx.translate(transform.tx, transform.ty);
      lctx.translate(-res / 2, -res / 2);
    }
    lctx.drawImage(symbol, drawX, drawY, drawW, drawH);
    lctx.restore();
    return layer;
  };

  // Back to front: shadow, outline, gradient fill — matching the DOM order.
  octx.globalAlpha = 0.42;
  octx.drawImage(
    makeLayer(
      (c) => {
        c.fillStyle = shadow;
        c.fillRect(0, 0, res, res);
      },
      { scale: 1.05, tx: res * 0.018, ty: res * 0.026 },
    ),
    0,
    0,
  );
  octx.globalAlpha = 1;

  octx.drawImage(
    makeLayer(
      (c) => {
        c.fillStyle = outline;
        c.fillRect(0, 0, res, res);
      },
      { scale: 1.08, tx: 0, ty: 0 },
    ),
    0,
    0,
  );

  octx.drawImage(
    makeLayer((c) => {
      // 135deg gradient ≈ top-left → bottom-right.
      const gradient = c.createLinearGradient(0, 0, res, res);
      gradient.addColorStop(0, high);
      gradient.addColorStop(0.48, fill);
      gradient.addColorStop(1, low);
      c.fillStyle = gradient;
      c.fillRect(0, 0, res, res);
    }),
    0,
    0,
  );

  return out.toDataURL("image/png");
}
