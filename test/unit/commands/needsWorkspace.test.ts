import { describe, expect, it } from "vitest";
import { needsWorkspace } from "commands/needsWorkspace.ts";

/** The real argv shape: node, script, then the user's arguments. */
const argv = (...args: Array<string>): Array<string> => ["node", "stub", ...args];

describe("needsWorkspace", () => {
    it("returns false for no arguments", () => {
        expect(needsWorkspace(argv())).toBe(false);
    });

    it("returns false for --help and -h", () => {
        expect(needsWorkspace(argv("--help"))).toBe(false);
        expect(needsWorkspace(argv("-h"))).toBe(false);
    });

    it("returns false for --version and -V", () => {
        expect(needsWorkspace(argv("--version"))).toBe(false);
        expect(needsWorkspace(argv("-V"))).toBe(false);
    });

    it("returns false for guide", () => {
        expect(needsWorkspace(argv("guide"))).toBe(false);
    });

    it("returns false for help", () => {
        expect(needsWorkspace(argv("help"))).toBe(false);
    });

    it("returns false for guide with trailing flags", () => {
        expect(needsWorkspace(argv("guide", "--noRequires"))).toBe(false);
    });

    it("returns true for a template command", () => {
        expect(needsWorkspace(argv("page", "Product"))).toBe(true);
    });

    it("returns true for a template command behind --noRequires", () => {
        expect(needsWorkspace(argv("--noRequires", "page", "Product"))).toBe(true);
    });

    // Documents current behaviour: the scan covers all arguments, so `stub component --help`
    // prints root help rather than complaining about a missing .stub.
    it("returns false when --help appears after a command name", () => {
        expect(needsWorkspace(argv("component", "--help"))).toBe(false);
    });

    it("returns true for an unrecognised command", () => {
        expect(needsWorkspace(argv("nonsense"))).toBe(true);
    });
});
