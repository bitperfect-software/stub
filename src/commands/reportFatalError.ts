import { formatFatalError } from "errors/formatFatalError.ts";

/** The one place a fatal error becomes output, because `commands/` is the only layer that prints. */
export const reportFatalError = (error: unknown): never => {
    console.error(formatFatalError(error, process.env.STUB_DEBUG === "1"));

    process.exit(1);
};
