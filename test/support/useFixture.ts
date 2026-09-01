import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { tempDir } from "test/support/tempDir.ts";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));

/**
 * A throwaway copy of one fixture. Nothing is ever run inside `test/fixtures/` itself, so a command
 * that writes cannot pollute the checked-in tree.
 */
export const useFixture = (name: string): string => {
    const projectRoot = tempDir();

    fs.cpSync(path.join(fixturesDir, name), projectRoot, { recursive: true });

    return projectRoot;
};
