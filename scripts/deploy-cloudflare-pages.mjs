import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const target = process.argv[2];
const releaseBranch = target === "production" || target === "main" ? "main" : target === "beta" ? "beta" : null;

if (!releaseBranch) {
  throw new Error("Usage: node scripts/deploy-cloudflare-pages.mjs <beta|production>");
}

const outputDirectory = await mkdtemp(join(tmpdir(), `cardmagic-cloudflare-${releaseBranch}-`));
const projectName = "cardmagic";

try {
  run("npm", ["run", "release:verify", "--", releaseBranch]);
  run("npm", ["run", "export:cloudflare"], {
    EXPO_PUBLIC_CARDMAGIC_RELEASE_BRANCH: releaseBranch,
    CARDMAGIC_CLOUDFLARE_OUTPUT_DIR: outputDirectory,
  });

  const deployArgs = [
    "--yes",
    "wrangler",
    "pages",
    "deploy",
    outputDirectory,
    "--project-name",
    projectName,
    "--commit-dirty=true",
  ];

  if (releaseBranch === "beta") {
    deployArgs.push("--branch", "beta");
  }

  run("npx", deployArgs);
  run("npm", ["run", "release:metadata", "--", releaseBranch]);
} finally {
  await rm(outputDirectory, { recursive: true, force: true });
}

function run(command, args, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...extraEnv,
    },
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with status ${result.status ?? "unknown"}.`);
  }
}
