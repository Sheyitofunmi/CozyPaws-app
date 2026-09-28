import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname),
      // Server modules import "server-only" as a guard; in unit tests we ARE the server.
      "server-only": path.resolve(import.meta.dirname, "node_modules/server-only/empty.js"),
    },
  },
  test: { include: ["tests/unit/**/*.test.ts"], environment: "node" },
});
