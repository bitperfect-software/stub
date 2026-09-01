import { describe, expect, it } from "vitest";
import { createProgram } from "commands/createProgram.ts";
import { helpOverview } from "commands/helpOverview.ts";
import { readPackageVersion } from "commands/readPackageVersion.ts";
import { captureHelp } from "test/support/captureHelp.ts";

describe("createProgram", () => {
    it("names the program stub", () => {
        expect(createProgram().name()).toBe("stub");
    });

    it("reports the package version", () => {
        expect(createProgram().version()).toBe(readPackageVersion());
    });

    it("declares the global options", () => {
        expect(createProgram().options.map(({ flags }) => flags)).toContain("--noRequires");
    });

    // "after" on the root command only, so subcommand help stays as narrow as it is.
    it("appends the overview to the root help but not to a subcommand's", () => {
        const program = createProgram();
        const subcommand = program.command("thing");

        const firstLine = helpOverview.trim().split("\n")[0] ?? "";

        expect(captureHelp(program)).toContain(firstLine);
        expect(captureHelp(subcommand)).not.toContain(firstLine);
    });
});
