import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Vitest config — kept separate from `vite.frontend.config.ts` because
 * Vitest only auto-discovers `vite.config.ts` / `vitest.config.ts`, not
 * our renamed Vite config. Mirrors the template's intended test setup
 * (jsdom + the Tauri/fetch mocks in `src/test/setup.ts`).
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
