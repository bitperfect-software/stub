import type { Command } from "commander";
import { guideText } from "commands/guideText.ts";

/**
 * Registered after the template commands, so a manifest that happens to declare a `guide` entry still
 * wins the dispatch — Commander resolves to the first command whose name matches.
 */
export const registerGuideCommand = (program: Command) => {
    program
        .command("guide")
        .description("Explain the manifest format, the filters and the template tags")
        .action(() => {
            console.log(guideText);
        });
};
