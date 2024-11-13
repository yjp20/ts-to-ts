import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["(src|test)/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    watchExclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**//**",
    ],
  },
});
