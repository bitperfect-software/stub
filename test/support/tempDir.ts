import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { onTestFinished } from "vitest";

/**
 * A fresh directory for one test, removed when it finishes — registered at creation, so a failing
 * assertion still cleans up.
 *
 * `realpathSync` is not optional: on macOS `os.tmpdir()` is a symlink and a spawned CLI reports the
 * resolved path as its cwd, which would fail every absolute-path assertion.
 */
export const tempDir = (): string => {
    const directory = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "stub-test-")));

    onTestFinished(() => {
        fs.rmSync(directory, { recursive: true, force: true });
    });

    return directory;
};
