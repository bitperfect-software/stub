/**
 * Whether an error is a defect in stub rather than a problem with the user's project. Every message
 * this program raises deliberately is an `Error`; a built-in subclass can only mean a bug here, so
 * reporting it as a manifest problem would send the user looking in the wrong place.
 */
export const isInternalError = (error: Error): boolean =>
    error instanceof TypeError ||
    error instanceof RangeError ||
    error instanceof ReferenceError ||
    error instanceof SyntaxError ||
    error instanceof EvalError ||
    error instanceof URIError;
