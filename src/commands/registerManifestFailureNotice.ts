import type { Command } from "commander";

/**
 * Explains a .stub directory too broken to build commands from, at the moment the user is already
 * looking: after the help text. An invocation that actually asked for a template command never gets
 * here — it is handed the failure directly, because "unknown command" would be the wrong answer.
 */
export const registerManifestFailureNotice = (program: Command, failure: string) => {
    program.addHelpText("after", `\nNo template commands are available:\n${failure}\n`);
};
