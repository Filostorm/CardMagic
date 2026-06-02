import { rm } from "node:fs/promises";
import { basename, resolve } from "node:path";

const outputDirectory = process.env.CARDMAGIC_CLOUDFLARE_OUTPUT_DIR || "dist";
const resolvedOutputDirectory = resolve(outputDirectory);

if (basename(resolvedOutputDirectory) !== "dist") {
  throw new Error(`Refusing to remove unexpected Cloudflare output directory: ${resolvedOutputDirectory}`);
}

await rm(resolvedOutputDirectory, { recursive: true, force: true });

console.log(`Cloudflare output directory cleared: ${resolvedOutputDirectory}`);
