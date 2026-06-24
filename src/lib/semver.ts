// Minimal semantic-version helpers for comparing release versions. Extracted
// from App.tsx so they can be unit-tested and reused without the entry file.

export function parseSemanticVersion(version: string) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version.trim());

  if (!match) {
    return null;
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])] as const;
}

export function compareSemanticVersions(left: string, right: string) {
  const leftParts = parseSemanticVersion(left);
  const rightParts = parseSemanticVersion(right);

  if (!leftParts || !rightParts) {
    return left.localeCompare(right);
  }

  for (let index = 0; index < leftParts.length; index += 1) {
    const delta = leftParts[index] - rightParts[index];

    if (delta !== 0) {
      return delta;
    }
  }

  return 0;
}

export function isReleaseVersionNewer(latestVersion: string | undefined, currentVersion: string) {
  return typeof latestVersion === "string" && compareSemanticVersions(latestVersion, currentVersion) > 0;
}
