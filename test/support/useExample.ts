import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { tempDir } from "test/support/tempDir.ts";

const examplesDir = fileURLToPath(new URL("../../examples/", import.meta.url));

/** Directories an example writes when it is run by hand. They are gitignored, never part of an example. */
const generated = new Set(["out", "src", "tests"]);

/**
 * A throwaway copy of one shipped example — the counterpart to `useFixture`, which serves
 * `test/fixtures/` and its pathological cases.
 *
 * Output left behind by a manual run is filtered out rather than copied, so a developer who forgot to
 * clean up cannot turn a tree assertion into a false pass.
 */
export const useExample = (name: string): string => {
    const projectRoot = tempDir();

    fs.cpSync(path.join(examplesDir, name), projectRoot, {
        recursive: true,
        filter: (source) => !generated.has(path.relative(path.join(examplesDir, name), source)),
    });

    return projectRoot;
};
