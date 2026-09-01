import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveSettings } from "settings/resolveSettings.ts";
import { loadWorkspace } from "workspace/loadWorkspace.ts";
import { writeStubDirectory } from "test/support/makeWorkspace.ts";
import { tempDir } from "test/support/tempDir.ts";

const settings = resolveSettings();

describe("loadWorkspace", () => {
    it("resolves the stub directory under the project root", () => {
        const root = tempDir();

        writeStubDirectory(root, { manifest: { templates: {} } });

        expect(loadWorkspace(root, settings).stubDir).toBe(path.join(root, ".stub"));
    });

    it("parses the manifest and builds an engine rooted at the stub directory", () => {
        const root = tempDir();

        writeStubDirectory(root, {
            manifest: { templates: { model: { path: "a.ts" } } },
            bodies: { model: "hello {{ who }}" },
        });

        const workspace = loadWorkspace(root, settings);

        expect(workspace.manifest.templates.model?.path).toBe("a.ts");
        expect(String(workspace.engine.renderFileSync("model", { who: "world" }))).toBe("hello world");
    });

    it("throws File not found when there is no templates.json", () => {
        const root = tempDir();

        writeStubDirectory(root, { manifest: { templates: {} } });
        // Remove the manifest the helper just wrote, leaving an empty .stub directory.
        fs.rmSync(path.join(root, ".stub", "templates.json"));

        expect(() => loadWorkspace(root, settings)).toThrow("File not found");
    });
});
