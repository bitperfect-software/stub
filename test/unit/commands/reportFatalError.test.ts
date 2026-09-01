import { describe, expect, it, vi } from "vitest";
import { reportFatalError } from "commands/reportFatalError.ts";

/** `process.exit` and `console.error` are the two effects; both are stubbed so the worker survives. */
const report = (error: unknown, debug?: string) => {
    const previous = process.env.STUB_DEBUG;

    if (debug !== undefined) process.env.STUB_DEBUG = debug;

    const printed = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const exit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    reportFatalError(error);

    const result = { message: String(printed.mock.calls[0]?.[0]), exitCode: exit.mock.calls[0]?.[0] };

    printed.mockRestore();
    exit.mockRestore();
    process.env.STUB_DEBUG = previous;

    return result;
};

describe("reportFatalError", () => {
    it("prints the message and exits 1", () => {
        expect(report(new Error("Unknown template x"))).toEqual({ message: "Unknown template x", exitCode: 1 });
    });

    it("prints no stack frame for a user problem", () => {
        expect(report(new Error("Unknown template x")).message).not.toContain("\n    at ");
    });

    it("prints the stack when STUB_DEBUG is 1", () => {
        expect(report(new Error("Unknown template x"), "1").message).toContain("\n    at ");
    });
});
