import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const srcDir = fileURLToPath(new URL("./src/", import.meta.url));
const testDir = fileURLToPath(new URL("./test/", import.meta.url));

/**
 * Vite does not honour tsconfig `paths`. The src folders are listed literally rather than matched
 * loosely, so adding one fails here instead of silently resolving to nothing. Declared per project:
 * an entry under `projects` is its own config and does not inherit the root's `resolve`.
 */
const resolve = {
    alias: [
        { find: /^(commands|errors|io|manifest|render|settings|templates|workspace)\//, replacement: `${srcDir}$1/` },
        { find: /^test\//, replacement: testDir },
    ],
};

export default defineConfig({
    resolve,
    test: {
        projects: [
            { resolve, test: { name: "unit", include: ["test/unit/**/*.test.ts", "test/docs/**/*.test.ts"] } },
            {
                resolve,
                test: {
                    name: "e2e",
                    include: ["test/e2e/**/*.e2e.test.ts"],
                    globalSetup: ["test/support/buildCli.ts"],
                    testTimeout: 20_000,
                },
            },
        ],
        coverage: {
            provider: "v8",
            reporter: ["text", "lcov"],
            include: ["src/**/*.ts"],
            // index.ts runs at import time; the other two are prose constants.
            exclude: ["src/index.ts", "src/commands/guideText.ts", "src/commands/helpOverview.ts"],
            thresholds: { lines: 90, functions: 95, branches: 85, statements: 90 },
        },
    },
});
