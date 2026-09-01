import { Command } from "commander";
import { describe, expect, it } from "vitest";
import { addGlobalOptions, readGlobalOptions } from "commands/globalOptions.ts";

const parsed = (...args: Array<string>) => {
    const program = addGlobalOptions(new Command().exitOverride());

    program.command("noop").action(() => undefined);
    program.parse(["node", "stub", ...args]);

    return readGlobalOptions(program);
};

describe("globalOptions", () => {
    it("declares --noRequires on the program", () => {
        expect(addGlobalOptions(new Command()).options.map(({ flags }) => flags)).toEqual(["--noRequires"]);
    });

    it("includes requires by default", () => {
        expect(parsed("noop").includeRequires).toBe(true);
    });

    it("excludes requires behind --noRequires", () => {
        expect(parsed("--noRequires", "noop").includeRequires).toBe(false);
    });
});
