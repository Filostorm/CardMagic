import { existsSync } from "node:fs";
import { mkdir, rename, rm } from "node:fs/promises";
import { basename, resolve } from "node:path";

const outputDirectory = process.env.CARDMAGIC_CLOUDFLARE_OUTPUT_DIR || "dist";
const resolvedOutputDirectory = resolve(outputDirectory);
const outputDirectoryName = basename(resolvedOutputDirectory);

if (outputDirectoryName !== "dist" && !outputDirectoryName.startsWith("cardmagic-cloudflare-")) {
  throw new Error(`Refusing to remove unexpected Cloudflare output directory: ${resolvedOutputDirectory}`);
}

if (existsSync(resolvedOutputDirectory)) {
  if (outputDirectoryName === "dist") {
    const quarantinedOutputDirectory = `${resolvedOutputDirectory}-stuck-${Date.now()}`;

    try {
      await rename(resolvedOutputDirectory, quarantinedOutputDirectory);
      console.log(`Cloudflare output directory moved aside: ${quarantinedOutputDirectory}`);
    } catch {
      await rm(resolvedOutputDirectory, { recursive: true, force: true });
    }
  } else {
    await rm(resolvedOutputDirectory, { recursive: true, force: true });
  }
}

await mkdir(resolvedOutputDirectory, { recursive: true });

console.log(`Cloudflare output directory cleared: ${resolvedOutputDirectory}`);
