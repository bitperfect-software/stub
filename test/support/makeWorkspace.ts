import * as fs from "node:fs";
import * as path from "node:path";
import { resolveSettings } from "settings/resolveSettings.ts";
import { loadWorkspace } from "workspace/loadWorkspace.ts";
import type { Workspace } from "workspace/Workspace.ts";

export interface StubDirectory {
    /** Written verbatim as `templates.json`; an object is stringified first. */
    readonly manifest: unknown;
    /** Template name -> body. `.liquid` is appended. */
    readonly bodies?: Record<string, string>;
}

/** Writes a `.stub` directory into `projectRoot` and returns its path. */
export const writeStubDirectory = (projectRoot: string, { manifest, bodies = {} }: StubDirectory): string => {
    const stubDir = path.join(projectRoot, ".stub");

    fs.mkdirSync(stubDir, { recursive: true });
    fs.writeFileSync(
        path.join(stubDir, "templates.json"),
        typeof manifest === "string" ? manifest : JSON.stringify(manifest, null, 4),
        "utf-8",
    );

    Object.entries(bodies).forEach(([templateName, body]) => {
        fs.writeFileSync(path.join(stubDir, `${templateName}.liquid`), body, "utf-8");
    });

    return stubDir;
};

/** A real workspace over a real `.stub` directory, built the way the CLI builds one. */
export const makeWorkspace = (projectRoot: string, contents: StubDirectory): Workspace => {
    writeStubDirectory(projectRoot, contents);

    return loadWorkspace(projectRoot, resolveSettings());
};
