import { describe, expect, it } from "vitest";
import { formatFatalError } from "errors/formatFatalError.ts";
import { makeEngine } from "test/support/makeEngine.ts";

/** A real one, raised by liquidjs, rather than a hand-built stand-in. */
const liquidError = (): Error => {
    try {
        makeEngine().parseAndRenderSync("{% if x %}", {});
    } catch (error) {
        return error as Error;
    }

    throw new Error("expected liquidjs to throw");
};

describe("formatFatalError", () => {
    it("returns the message of a plain Error", () => {
        expect(formatFatalError(new Error("Unknown template x"), false)).toBe("Unknown template x");
    });

    // Liquid builds a file:line:col prefix into the message; it must reach the user intact.
    it("returns the message of a LiquidError unchanged", () => {
        const error = liquidError();

        expect(formatFatalError(error, false)).toBe(error.message);
        expect(formatFatalError(error, false)).toContain("line:1, col:1");
    });

    it("falls back to the message when an Error carries no stack", () => {
        const error = new Error("no stack here");

        delete error.stack;

        expect(formatFatalError(error, true)).toBe("no stack here");
    });

    it("stringifies a thrown non-Error", () => {
        expect(formatFatalError("just a string", false)).toBe("just a string");
    });

    it("flags a TypeError as an internal error and includes the stack", () => {
        const formatted = formatFatalError(new TypeError("cannot read x"), false);

        expect(formatted).toContain("This is a defect in stub");
        expect(formatted).toContain("cannot read x");
        expect(formatted).toContain("\n    at ");
    });

    it("flags a RangeError as an internal error", () => {
        expect(formatFatalError(new RangeError("out of range"), false)).toContain("This is a defect in stub");
    });

    it("includes the stack for any error when the debug flag is set", () => {
        expect(formatFatalError(new Error("Unknown template x"), true)).toContain("\n    at ");
    });

    // The whole point of the phase-02 handler: a user's typo must not print a V8 stack trace.
    it('never returns a multi-line "    at " frame for a plain Error', () => {
        expect(formatFatalError(new Error("Unknown template x"), false)).not.toContain("\n    at ");
    });
});
