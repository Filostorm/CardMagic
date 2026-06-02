import { readFile } from "node:fs/promises";

const VALID_BRANCHES = new Set(["beta", "main"]);
const branch = process.argv[2] ?? process.env.EXPO_PUBLIC_CARDMAGIC_RELEASE_BRANCH ?? "beta";

if (!VALID_BRANCHES.has(branch)) {
  fail(`Unknown release branch "${branch}". Expected beta or main.`);
}

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const appJson = JSON.parse(await readFile("app.json", "utf8"));
const packageVersion = packageJson.version;
const appVersion = appJson.expo?.version;

if (!isSemver(packageVersion)) {
  fail(`package.json version "${packageVersion}" is not a semantic version.`);
}

if (packageVersion !== appVersion) {
  fail(`Version mismatch: package.json is ${packageVersion}, app.json is ${appVersion}.`);
}

const patchNotesSource = await readFile("src/lib/patch-notes.ts", "utf8");
const entries = parsePatchNoteEntries(patchNotesSource);
const matchingEntries = entries.filter((entry) => entry.version === packageVersion);

if (matchingEntries.length === 0) {
  fail(`CARDMAGIC_PATCH_NOTES has no entry for v${packageVersion}.`);
}

const visibleEntry = matchingEntries.find((entry) => entry.branches.includes(branch));

if (!visibleEntry) {
  const scopedBranches = matchingEntries
    .map((entry) => entry.branches.join(", "))
    .join("; ");
  fail(
    `CARDMAGIC_PATCH_NOTES has v${packageVersion}, but it is not visible on ${branch}. ` +
      `Existing branch scopes: ${scopedBranches || "none"}. ` +
      `Unscoped entries are beta-only; production entries must include branches: ["main"] or ["beta", "main"].`,
  );
}

if (!visibleEntry.hasTitle || !visibleEntry.hasBullets) {
  fail(`CARDMAGIC_PATCH_NOTES entry for v${packageVersion} is missing a title or bullets array.`);
}

console.log(
  `Release verification passed for ${branch} v${packageVersion}: ${visibleEntry.title ?? "patch-note entry"}`,
);

function parsePatchNoteEntries(source) {
  const entries = [];
  const entryPattern = /\{\s*version:\s*"([^"]+)"([\s\S]*?)(?=\n\s*\{\s*version:|\n\];)/g;
  let match;

  while ((match = entryPattern.exec(source))) {
    const [, version, body] = match;
    const branchMatch = body.match(/branches:\s*\[([^\]]*)\]/);
    const branches = branchMatch
      ? [...branchMatch[1].matchAll(/"([^"]+)"/g)].map((branchMatch) => branchMatch[1])
      : ["beta"];
    const titleMatch = body.match(/title:\s*"([^"]+)"/);

    entries.push({
      version,
      title: titleMatch?.[1],
      branches,
      hasTitle: Boolean(titleMatch),
      hasBullets: /bullets:\s*\[/.test(body),
    });
  }

  return entries;
}

function isSemver(version) {
  return typeof version === "string" && /^\d+\.\d+\.\d+$/.test(version);
}

function fail(message) {
  console.error(`Release verification failed: ${message}`);
  process.exit(1);
}
