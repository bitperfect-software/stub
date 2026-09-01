import { Command } from "commander";
import { describe, expect, it, vi } from "vitest";
import { tryRegisterTemplateCommands } from "commands/tryRegisterTemplateCommands.ts";
import * as registerTemplateCommandsModule from "commands/registerTemplateCommands.ts";
import { resolveSettings } from "settings/resolveSettings.ts";
import { writeStubDirectory } from "test/support/makeWorkspace.ts";
import { tempDir } from "test/support/tempDir.ts";

const settings = resolveSettings();

const attempt = (manifest: unknown): { program: Command; failure: string | null } => {
    const projectRoot = tempDir();

    writeStubDirectory(projectRoot, { manifest });

    const program = new Command();

    return { program, failure: tryRegisterTemplateCommands(program, projectRoot, settings) };
};

describe("tryRegisterTemplateCommands", () => {
    it("returns null and registers one command per entry on success", () => {
        const { program, failure } = attempt({ templates: { model: { path: "a.ts" }, page: { path: "b.tsx" } } });

        expect(failure).toBeNull();
        expect(program.commands.map((command) => command.name())).toEqual(["model", "page"]);
    });

    it("returns the reason for unparseable JSON", () => {
        expect(attempt("{").failure).toContain("Invalid JSON in file");
    });

    it("returns the reason for a schema-invalid manifest", () => {
        expect(attempt({ templates: { model: {} } }).failure).toContain("Invalid manifest");
    });

    // Commander throws while the commands are being built, long after the manifest parsed fine.
    it("returns the reason when two keys kebab-case to the same command name", () => {
        const failure = attempt({
            templates: { useColumnsHook: { path: "a.ts" }, use_columns_hook: { path: "b.ts" } },
        }).failure;

        expect(failure).toContain("cannot add command 'use-columns-hook'");
    });

    it("returns the reason when a computed and a switch produce the same flag", () => {
        const failure = attempt({
            computed: [{ name: "force", description: "d", value: "x" }],
            switches: [{ name: "force", description: "d" }],
            templates: { model: { path: "a.ts" } },
        }).failure;

        expect(failure).toContain("conflicting flag '--force'");
    });

    // A defect in stub must not be reported as a bad manifest: that sends the user to the wrong place.
    it("rethrows an internal error instead of reporting it as a manifest problem", () => {
        const projectRoot = tempDir();

        writeStubDirectory(projectRoot, { manifest: { templates: {} } });

        const spy = vi.spyOn(registerTemplateCommandsModule, "registerTemplateCommands").mockImplementation(() => {
            throw new TypeError("cannot read properties of undefined");
        });

        expect(() => tryRegisterTemplateCommands(new Command(), projectRoot, settings)).toThrow(TypeError);

        spy.mockRestore();
    });

    it("stringifies a thrown non-Error", () => {
        const projectRoot = tempDir();

        writeStubDirectory(projectRoot, { manifest: { templates: {} } });

        const spy = vi.spyOn(registerTemplateCommandsModule, "registerTemplateCommands").mockImplementation(() => {
            // Throwing a non-Error is exactly the case under test.
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw "just a string";
        });

        expect(tryRegisterTemplateCommands(new Command(), projectRoot, settings)).toBe("just a string");

        spy.mockRestore();
    });
});
