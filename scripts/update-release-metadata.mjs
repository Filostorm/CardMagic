import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const RELEASE_TARGETS = {
  beta: "https://beta.cardmagic-5dy.pages.dev",
  main: "https://cardmagic.craftsmannsoftware.com",
};

const branch = process.argv[2] ?? process.env.EXPO_PUBLIC_CARDMAGIC_RELEASE_BRANCH ?? "beta";
const deploymentUrl = RELEASE_TARGETS[branch];

if (!deploymentUrl) {
  fail(`Unknown release branch "${branch}". Expected beta or main.`);
}

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const appJson = JSON.parse(await readFile("app.json", "utf8"));
const version = packageJson.version;

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  fail(`package.json version "${version}" is not a semantic version.`);
}

if (version !== appJson.expo?.version) {
  fail(`Version mismatch: package.json is ${version}, app.json is ${appJson.expo?.version}.`);
}

const branchUrl = `${deploymentUrl}/?v=${version}`;
const sql = `
insert into public.cardmagic_release_deployments (
  branch,
  version,
  branch_url,
  deployment_url,
  deployed_at,
  updated_at
)
values (
  '${escapeSqlLiteral(branch)}',
  '${escapeSqlLiteral(version)}',
  '${escapeSqlLiteral(branchUrl)}',
  '${escapeSqlLiteral(deploymentUrl)}',
  now(),
  now()
)
on conflict (branch) do update set
  version = excluded.version,
  branch_url = excluded.branch_url,
  deployment_url = excluded.deployment_url,
  deployed_at = excluded.deployed_at,
  updated_at = now();
`;

const result = spawnSync("npx", ["supabase", "db", "query", "--linked", sql], {
  stdio: "inherit",
});

if (result.status !== 0) {
  fail(`Supabase release metadata update failed for ${branch}.`);
}

console.log(`Release metadata updated for ${branch} v${version}: ${branchUrl}`);

function escapeSqlLiteral(value) {
  return String(value).replaceAll("'", "''");
}

function fail(message) {
  console.error(`Release metadata update failed: ${message}`);
  process.exit(1);
}
