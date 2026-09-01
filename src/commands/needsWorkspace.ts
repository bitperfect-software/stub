/**
 * Whether an invocation has to resolve a project before it can do anything useful. `stub guide` and the
 * built-in help are exactly the commands someone runs *before* creating a `.stub` directory, so they must
 * survive not finding one.
 */
export const needsWorkspace = (argv: Array<string>): boolean => {
    const args = argv.slice(2);

    if (args.length === 0) {
        return false;
    }

    if (args.some((arg) => arg === "-h" || arg === "--help" || arg === "-V" || arg === "--version")) {
        return false;
    }

    const command = args.find((arg) => !arg.startsWith("-"));

    return command !== "guide" && command !== "help";
};
