import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const outputDirectory = process.env.CARDMAGIC_CLOUDFLARE_OUTPUT_DIR || "dist";
const releaseBranch = process.env.EXPO_PUBLIC_CARDMAGIC_RELEASE_BRANCH === "main" ? "main" : "beta";
const productionMountPath = "/cardmagic";

await mkdir(outputDirectory, { recursive: true });

await writeFile(
  join(outputDirectory, "_headers"),
  [
    "/*",
    "  X-Content-Type-Options: nosniff",
    "  Referrer-Policy: strict-origin-when-cross-origin",
    "",
    "/",
    "  Cache-Control: no-store",
    "",
    "/index.html",
    "  Cache-Control: no-store",
    "",
    "/_expo/static/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
    "/assets/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
  ].join("\n"),
);

await writeFile(
  join(outputDirectory, "_redirects"),
  [
    "/* /index.html 200",
    "",
  ].join("\n"),
);

if (releaseBranch === "main") {
  await rewriteProductionMountedAssetUrls(outputDirectory);
}

await writeLegalPage({
  slug: "terms",
  title: "CardMagic Terms of Service",
  updated: "May 27, 2026",
  sections: [
    ["Use of CardMagic", "CardMagic is provided for creating, editing, saving, and exporting user-generated card designs. You are responsible for the prompts, images, text, and other content you submit or save."],
    ["Accounts and Credits", "Accounts, saved sets, purchases, and credit balances may sync through Supabase. Promotional codes and purchased credits are intended for CardMagic features and may be limited, revoked, or adjusted if abused or issued in error."],
    ["Purchases", "Payments are processed by Stripe or the applicable app-store provider. Prices, credit quantities, and subscription terms are shown before checkout. Completed purchases are applied to the signed-in account associated with the checkout session."],
    ["AI Features", "AI generation can produce unexpected or inaccurate output. You are responsible for reviewing generated content before using or sharing it."],
    ["Contact", "Questions about these terms can be sent to support@craftsmannsoftware.com."],
  ],
});

await writeLegalPage({
  slug: "eula",
  title: "CardMagic End User License Agreement",
  updated: "May 27, 2026",
  sections: [
    ["License", "Craftsmann Software grants you a limited, non-exclusive, non-transferable license to use CardMagic for personal or authorized creative workflows, subject to these terms."],
    ["Restrictions", "You may not reverse engineer, resell, sublicense, abuse, disrupt, or use CardMagic to violate another party's rights or applicable law."],
    ["Generated and User Content", "You retain responsibility for content you create, upload, generate, save, or export. CardMagic does not guarantee that generated content is unique, error-free, or suitable for a specific purpose."],
    ["Service Availability", "Cloud services, account sync, AI generation, purchases, and third-party providers may be unavailable or modified from time to time."],
    ["Contact", "Questions about this EULA can be sent to support@craftsmannsoftware.com."],
  ],
});

async function writeLegalPage({ slug, title, updated, sections }) {
  const directory = join(outputDirectory, slug);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "index.html"), renderLegalPage({ title, updated, sections }));
}

function renderLegalPage({ title, updated, sections }) {
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `  <title>${escapeHtml(title)}</title>`,
    "  <style>",
    "    body{margin:0;background:#f5f7f9;color:#121820;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;line-height:1.55}",
    "    main{max-width:760px;margin:0 auto;padding:48px 20px 64px}",
    "    a{color:#0b7180;font-weight:800}",
    "    h1{font-size:34px;line-height:1.1;margin:0 0 8px;font-weight:900}",
    "    h2{font-size:18px;margin:28px 0 8px;font-weight:900}",
    "    p{margin:0;color:#4d5865;font-size:15px}",
    "    .meta{font-size:13px;color:#7a8491;margin-bottom:26px;font-weight:800}",
    "    .panel{background:#fff;border:1px solid #dfe4eb;border-radius:16px;padding:24px;box-shadow:0 16px 34px rgba(13,18,28,.08)}",
    "  </style>",
    "</head>",
    "<body>",
    "  <main>",
    '    <div class="panel">',
    `      <h1>${escapeHtml(title)}</h1>`,
    `      <p class="meta">Last updated ${escapeHtml(updated)}</p>`,
    ...sections.flatMap(([heading, body]) => [
      `      <h2>${escapeHtml(heading)}</h2>`,
      `      <p>${escapeHtml(body)}</p>`,
    ]),
    '      <h2>Back to CardMagic</h2>',
    '      <p><a href="/">Return to the app</a></p>',
    "    </div>",
    "  </main>",
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function rewriteProductionMountedAssetUrls(directory) {
  const files = await listFiles(directory);
  const rewriteableFiles = files.filter((file) => /\.(?:html|js|css)$/i.test(file));
  let rewriteCount = 0;

  for (const file of rewriteableFiles) {
    const source = await readFile(file, "utf8");
    const nextSource = source
      .replaceAll('"/assets/assets/', `"${productionMountPath}/assets/assets/`)
      .replaceAll("'/assets/assets/", `'${productionMountPath}/assets/assets/`)
      .replaceAll("(/assets/assets/", `(${productionMountPath}/assets/assets/`)
      .replaceAll('"/_expo/static/', `"${productionMountPath}/_expo/static/`)
      .replaceAll("'/_expo/static/", `'${productionMountPath}/_expo/static/`)
      .replaceAll("(/_expo/static/", `(${productionMountPath}/_expo/static/`);

    if (nextSource === source) {
      continue;
    }

    rewriteCount += 1;
    await writeFile(file, nextSource);
  }

  if (rewriteCount === 0) {
    console.warn("Production asset mount rewrite did not update any exported files.");
    return;
  }

  console.log(`Production asset mount rewrite updated ${rewriteCount} exported file(s).`);
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await listFiles(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}
