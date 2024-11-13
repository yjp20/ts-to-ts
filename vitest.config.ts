import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    threads: true,
    include: ["(src|test)/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    watchExclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**//**",
    ],
  },
});
