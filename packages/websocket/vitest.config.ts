import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@nodetool-ai/atlascloud-nodes/cost": fileURLToPath(
        new URL("../atlascloud-nodes/src/atlascloud-cost.ts", import.meta.url)
      )
    }
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 30000
  }
});
