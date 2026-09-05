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

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "lucide-react-native") {
    const filePath = path.join(projectRoot, ".generated", "lucide-icons.cjs");
    if (!require("node:fs").existsSync(filePath)) {
      throw new Error("Run npm run build:web-icons before building or starting CardMagic web.");
    }
    return {type: "sourceFile", filePath};
  }
  return originalResolveRequest
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

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
