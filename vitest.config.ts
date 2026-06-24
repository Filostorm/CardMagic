import path from "node:path";

import { defineConfig } from "vitest/config";

// Stubs static asset imports (the PNG/JPG/font `require(...)`s used by the
// frame/data modules) so logic modules that transitively pull them can be
// imported in a plain node test environment without a Metro asset pipeline.
const ASSET_REQUIRE = /require\(\s*["'][^"']+\.(?:png|jpe?g|gif|webp|svg|ttf|otf|bmp)["']\s*\)/gi;
const ASSET_IMPORT_ID = /\.(?:png|jpe?g|gif|webp|svg|ttf|otf|bmp)(\?.*)?$/i;

const assetStubPlugin = {
  name: "cardmagic-asset-stub",
  enforce: "pre" as const,
  // ESM `import x from "...png"` -> stub module.
  resolveId(id: string) {
    if (ASSET_IMPORT_ID.test(id)) {
      return "\0cardmagic-asset-stub";
    }
    return null;
  },
  load(id: string) {
    if (id === "\0cardmagic-asset-stub") {
      return "export default 1;";
    }
    return null;
  },
  // CommonJS `require("...png")` (used by the frame/data modules) -> literal,
  // so vite never tries to parse the binary asset as a module.
  transform(code: string, id: string) {
    if (!/\.[cm]?tsx?$/.test(id) || !ASSET_REQUIRE.test(code)) {
      return null;
    }
    return { code: code.replace(ASSET_REQUIRE, "1"), map: null };
  },
};

// Unit-test config for pure logic modules. Runs in a node environment (no
// Metro/React Native) and resolves the "@/..." path alias the same way the app
// does. Test files live in `src/**/__tests__/*.test.ts`.
export default defineConfig({
  plugins: [assetStubPlugin],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
