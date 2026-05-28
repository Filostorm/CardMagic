const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;

function escapedPathPattern(relativePath) {
  return path
    .join(projectRoot, relativePath)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/[/\\]/g, "[/\\\\]");
}

const config = getDefaultConfig(projectRoot);

config.resolver.useWatchman = false;

const generatedDirectoryBlockList = [
  ".claude",
  ".expo",
  "dist",
  "ios",
  "node_modules/expo-file-system 2",
].map((relativePath) => new RegExp(`${escapedPathPattern(relativePath)}[/\\\\].*`));

config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : [config.resolver.blockList].filter(Boolean)),
  ...generatedDirectoryBlockList,
];

module.exports = config;
