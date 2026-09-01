import { isInternalError } from "errors/isInternalError.ts";

const issuesUrl = "https://github.com/bitperfect-software/stub/issues";

/**
 * Whatever reached the top level, as the text the user sees.
 *
 * Messages this program raises are written for the person running the command — including Liquid's
 * `file:line:col` and Zod's multi-line output — so they are printed verbatim and a stack frame would
 * only be noise. A defect here is the opposite case: saying so, with the stack, is the only useful
 * thing to print. `withStack` forces the stack for anything, which is what `STUB_DEBUG=1` buys.
 */
export const formatFatalError = (error: unknown, withStack: boolean): string => {
    if (!(error instanceof Error)) return String(error);

    const stack = error.stack ?? error.message;

    if (isInternalError(error)) return `This is a defect in stub. Please report it at ${issuesUrl}\n${stack}`;

    return withStack ? stack : error.message;
};
