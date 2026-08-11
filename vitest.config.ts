import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // A handful of tests use vi.resetModules() + a fresh dynamic import to exercise different
    // AUTH_PROVIDERS configurations; the first cold re-transform of the whole module graph after
    // a reset can be slow, well past Vitest's 5s default.
    testTimeout: 15000,
    env: {
      NODE_ENV: "test",
      // Both providers on by default so most test files don't need to fiddle with env config;
      // auth-config.test.ts overrides this per-test via vi.stubEnv + vi.resetModules to exercise
      // specific/restricted provider sets and disabled-provider rejection.
      AUTH_PROVIDERS: "GOOGLE,SMS",
    },
  },
});
