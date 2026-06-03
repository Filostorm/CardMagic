import { existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const duplicateSuffixPattern = / [2-9][0-9]*(?=\.|$)/;
const removals = [];

removeMatchingChildren(".expo", duplicateSuffixPattern);
removeMatchingChildren("dist", duplicateSuffixPattern, { filesOnly: true });
removeMatchingChildren(".git", /^index [2-9][0-9]*$/);

for (const path of removals) {
  rmSync(path, { recursive: true, force: true });
}

if (removals.length === 0) {
  console.log("Duplicate artifact guard: clean");
} else {
  console.log("Duplicate artifact guard removed:");
  for (const path of removals) {
    console.log(`- ${path}`);
  }
}

function removeMatchingChildren(directory, pattern, options = {}) {
  if (!existsSync(directory)) {
    return;
  }

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!pattern.test(entry.name)) {
      continue;
    }

    if (options.filesOnly && entry.isDirectory()) {
      continue;
    }

    removals.push(join(directory, entry.name));
  }
}
