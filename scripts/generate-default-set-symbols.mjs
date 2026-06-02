import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PNG } from "pngjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const OUTPUT_DIR = path.join(ROOT, "assets", "card-assets", "set-symbols", "generated-defaults");
const ENV_PATH = path.join(ROOT, ".env.local");
const OPTIONS = { size: "1024x1024", quality: "medium" };

const SYMBOLS = [
  ["spire", "Spire"],
  ["crownfall", "Crown"],
  ["starforge", "Forge"],
  ["rift", "Rift"],
  ["mask", "Mask"],
  ["citadel", "Citadel"],
  ["helix", "Helix"],
  ["ember", "Ember"],
  ["grove", "Grove"],
  ["tideglass", "Tide"],
  ["moonblade", "Moon"],
  ["sunlance", "Sun"],
  ["ironroot", "Root"],
  ["vault", "Vault"],
  ["eye", "Eye"],
  ["banner", "Banner"],
  ["scarab", "Scarab"],
  ["comet", "Comet"],
  ["obelisk", "Obelisk"],
  ["sigil", "Sigil"],
  ["maw", "Maw"],
  ["keystone", "Key"],
  ["anvil", "Anvil"],
  ["portal", "Portal"],
];

function parseEnv(source) {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
        return [key, value];
      }),
  );
}

function buildGeneratedSetSymbolPrompt(request) {
  return [
    "Create one production-ready expansion set symbol as a transparent PNG alpha mask.",
    "",
    `Symbol concept: ${request}.`,
    "",
    "Primary goal:",
    "- Make a small, flat, iconic set mark, not an illustration.",
    "- The app will recolor this mask for common black, uncommon silver, rare gold, and mythic orange rarity treatments.",
    "- The generated PNG itself must not contain rarity color, metallic color, gold, silver, orange, tan, gradients, or colored pixels.",
    "- Optimize for legibility at 16-24 px tall on a trading-card type line.",
    "",
    "Canvas and mask requirements:",
    "- 1024 x 1024 transparent canvas.",
    "- Alpha outside the glyph must be fully transparent.",
    "- Glyph pixels must be solid black (#000000) only, with hard, clean edges.",
    "- Use alpha shape information only: black opaque glyph, transparent outside. No baked-in color styling.",
    "- Center the glyph and make the opaque silhouette fill about 88% of the canvas with tight optical padding.",
    "- Use a filled vector-logo silhouette, not thin line art.",
    "- Prefer one contiguous emblem; use no more than three filled shapes.",
    "- Use no more than two transparent internal cutouts.",
    "- Use thick readable forms and avoid hairline strokes.",
    "",
    "Style target:",
    "- Similar complexity to a Magic-style expansion symbol: compact, collectible, stamp-like, and readable when tiny.",
    "- A simple outer contour with one memorable internal notch, gap, or cutout is ideal.",
    "- If the concept is an object, reduce it to its most recognizable silhouette.",
    "- Make a fresh symbol for this request; do not repeat a generic star, shield, crest, or previous composition.",
    "",
    "Reference example from this app, for style only. Do not copy this geometry:",
    "- Existing preset: Rift.",
    "- Outer silhouette SVG path: M18 23 77 9 56 42 84 45 21 91 43 55 15 53 18 23Z",
    "- Detail path: M30 30 67 20 48 48 66 49 33 75 47 52 27 50 30 30Z",
    "- Match its production qualities: compact black vector-mask silhouette, sharp readable contour, low detail count, large clear negative space, and strong visibility at tiny size.",
    "",
    "Do not include:",
    "- No background color, border box, circle badge, card frame, paper texture, or scene.",
    "- No colored symbol. Do not render the symbol as gold, bronze, silver, orange, yellow, red, blue, green, or multicolor.",
    "- No gradients, shadows, bevels, highlights, metallic rendering, brush texture, or 3D depth.",
    "- No text, letters, numbers, mana symbols, official game logos, trademarks, or copied iconography.",
    "- No extra variants, no multiple icons, no mockup sheet, no labels.",
    "",
    "Return only the final single centered black transparent-background glyph.",
  ].join("\n");
}

async function generateSymbol({ supabaseUrl, anonKey, concept }) {
  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/functions/v1/openai-generate-image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
    },
    body: JSON.stringify({
      prompt: buildGeneratedSetSymbolPrompt(concept),
      options: OPTIONS,
    }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.error) {
    throw new Error(payload.error || payload.message || `Generation failed with HTTP ${response.status}.`);
  }

  if (payload.b64Json) {
    return Buffer.from(payload.b64Json, "base64");
  }

  if (payload.url) {
    const imageResponse = await fetch(payload.url);
    if (!imageResponse.ok) {
      throw new Error(`Generated image download failed with HTTP ${imageResponse.status}.`);
    }
    return Buffer.from(await imageResponse.arrayBuffer());
  }

  throw new Error("Image generation did not return image bytes.");
}

function normalizeAlphaMask(buffer) {
  const png = PNG.sync.read(buffer);
  const transparentThreshold = 18;

  for (let index = 0; index < png.data.length; index += 4) {
    const red = png.data[index];
    const green = png.data[index + 1];
    const blue = png.data[index + 2];
    const sourceAlpha = png.data[index + 3];
    const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    const darknessAlpha = Math.round(255 - luminance);
    const alpha = sourceAlpha < 250 ? sourceAlpha : darknessAlpha;
    const normalizedAlpha = alpha < transparentThreshold ? 0 : alpha;

    png.data[index] = 0;
    png.data[index + 1] = 0;
    png.data[index + 2] = 0;
    png.data[index + 3] = normalizedAlpha;
  }

  return PNG.sync.write(cropAlphaBounds(png), { colorType: 6 });
}

function cropAlphaBounds(png, padding = 2) {
  let minX = png.width;
  let minY = png.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const alpha = png.data[((y * png.width + x) * 4) + 3];

      if (alpha === 0) {
        continue;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) {
    return png;
  }

  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(png.width - 1, maxX + padding);
  maxY = Math.min(png.height - 1, maxY + padding);

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const cropped = new PNG({ width, height });

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceIndex = (((minY + y) * png.width + (minX + x)) * 4);
      const targetIndex = ((y * width + x) * 4);

      cropped.data[targetIndex] = png.data[sourceIndex];
      cropped.data[targetIndex + 1] = png.data[sourceIndex + 1];
      cropped.data[targetIndex + 2] = png.data[sourceIndex + 2];
      cropped.data[targetIndex + 3] = png.data[sourceIndex + 3];
    }
  }

  return cropped;
}

async function main() {
  const env = parseEnv(await readFile(ENV_PATH, "utf8"));
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local.");
  }

  await mkdir(OUTPUT_DIR, { recursive: true });

  for (const [id, label] of SYMBOLS) {
    const outputPath = path.join(OUTPUT_DIR, `${id}.png`);
    process.stdout.write(`Generating ${label} (${id})... `);
    const generated = await generateSymbol({ supabaseUrl, anonKey, concept: label });
    await writeFile(outputPath, normalizeAlphaMask(generated));
    process.stdout.write(`wrote ${path.relative(ROOT, outputPath)}\n`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
