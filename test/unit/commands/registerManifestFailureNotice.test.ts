import { Command } from "commander";
import { describe, expect, it } from "vitest";
import { registerManifestFailureNotice } from "commands/registerManifestFailureNotice.ts";
import { captureHelp } from "test/support/captureHelp.ts";

describe("registerManifestFailureNotice", () => {
    it("explains the failure after the help text", () => {
        const program = new Command();

        registerManifestFailureNotice(program, "Invalid JSON in file: /p/.stub/templates.json");

        const help = captureHelp(program);

        expect(help).toContain("No template commands are available:");
        expect(help).toContain("Invalid JSON in file: /p/.stub/templates.json");
    });
});
