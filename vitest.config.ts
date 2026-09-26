import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/*/test/**/*.test.ts", "app/test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["packages/core/src/**/*.ts", "app/src/lib/**/*.ts"],
      thresholds: { lines: 95, statements: 95, functions: 100, branches: 95 },
      reporter: ["text", "json-summary"],
    },
  },
});
