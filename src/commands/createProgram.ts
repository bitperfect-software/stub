import { Command } from "commander";
import { addGlobalOptions } from "commands/globalOptions.ts";
import { helpOverview } from "commands/helpOverview.ts";
import { readPackageVersion } from "commands/readPackageVersion.ts";

/**
 * The root program: identity, the options that apply to every subcommand, and the overview footer.
 * `addHelpText("after", …)` is the root command's own help only, so subcommand help stays as narrow as it is.
 */
export const createProgram = (): Command =>
    addGlobalOptions(
        new Command()
            .name("stub")
            .description("Generate project files from your own Liquid stubs")
            .version(readPackageVersion()),
    ).addHelpText("after", helpOverview);
