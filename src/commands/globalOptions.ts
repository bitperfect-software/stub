import type { Command } from "commander";

/** Program-level options, translated out of Commander's vocabulary and into the domain's. */
export interface GlobalOptions {
    readonly includeRequires: boolean;
}

/** Declared and read in one file, so the flag string cannot drift between the two. */
export const addGlobalOptions = (program: Command): Command =>
    program.option("--noRequires", "Skips the registered requires");

/**
 * Commander types `opts()` loosely, so this is the single typed boundary for the root flags.
 * Only meaningful after `program.parse()`, i.e. from inside a command action.
 */
export const readGlobalOptions = (program: Command): GlobalOptions => ({
    includeRequires: program.opts<{ noRequires?: boolean }>().noRequires !== true,
});
