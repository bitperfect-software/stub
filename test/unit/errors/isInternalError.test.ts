import { describe, expect, it } from "vitest";
import { isInternalError } from "errors/isInternalError.ts";

describe("isInternalError", () => {
    it("returns false for a plain Error, which is how this program reports user problems", () => {
        expect(isInternalError(new Error("Unknown template x"))).toBe(false);
    });

    it.each([
        ["TypeError", new TypeError("t")],
        ["RangeError", new RangeError("r")],
        ["ReferenceError", new ReferenceError("r")],
        ["SyntaxError", new SyntaxError("s")],
        ["EvalError", new EvalError("e")],
        ["URIError", new URIError("u")],
    ])("returns true for a %s", (_name, error) => {
        expect(isInternalError(error)).toBe(true);
    });

    it("returns false for a user-defined Error subclass", () => {
        class ManifestError extends Error {}

        expect(isInternalError(new ManifestError("m"))).toBe(false);
    });
});
