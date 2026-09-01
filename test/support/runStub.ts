import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/** The published artefact, not the sources: the shebang, the module format and the deps are part of what is tested. */
export const cliPath = fileURLToPath(new URL("../../dist/index.js", import.meta.url));

export interface StubResult {
    readonly status: number;
    readonly stdout: string;
    readonly stderr: string;
}

/**
 * `spawnSync` rather than `execFileSync`: it returns a non-zero status instead of throwing, which is
 * what half of these tests assert on. `process.execPath` keeps the child on the same runtime.
 */
export const runStub = (cwd: string, args: Array<string>, env: NodeJS.ProcessEnv = {}): StubResult => {
    const result = spawnSync(process.execPath, [cliPath, ...args], {
        cwd,
        encoding: "utf-8",
        env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0", STUB_DEBUG: "", ...env },
    });

    return { status: result.status ?? -1, stdout: result.stdout, stderr: result.stderr };
};

/** The same invocation through the shebang, to prove it and the executable bit survive the build. */
export const runStubDirectly = (cwd: string, args: Array<string>): StubResult => {
    const result = spawnSync(cliPath, args, {
        cwd,
        encoding: "utf-8",
        env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0", STUB_DEBUG: "" },
    });

    return { status: result.status ?? -1, stdout: result.stdout, stderr: result.stderr };
};
