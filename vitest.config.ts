import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["(src|test)/**/*.test.?(c|m)[jt]s?(x)"],
    watchExclude: ["**/node_modules/**", "**/dist/**", "**/fixtures/**"],
    maxConcurrency: 20,
  },
});
