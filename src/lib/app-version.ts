const packageMetadata = require("../../package.json") as { version: string };

// The running CardMagic app version, sourced from package.json. Extracted from
// App.tsx so feature modules can read it without importing the entry file.
export const CARDMAGIC_APP_VERSION = packageMetadata.version;
