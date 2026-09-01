import type { Command } from "commander";

/**
 * The help a user actually sees. `helpInformation()` renders only the built-in sections — the
 * `addHelpText("after", …)` footers are emitted by `outputHelp`.
 */
export const captureHelp = (command: Command): string => {
    let captured = "";

    command.configureOutput({ writeOut: (text) => (captured += text), writeErr: (text) => (captured += text) });
    command.outputHelp();

    return captured;
};
