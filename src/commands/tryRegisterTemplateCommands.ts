import type { Command } from "commander";
import { registerTemplateCommands } from "commands/registerTemplateCommands.ts";
import { isInternalError } from "errors/isInternalError.ts";
import type { Settings } from "settings/defaultSettings.ts";
import { loadWorkspace } from "workspace/loadWorkspace.ts";

/**
 * Builds the template commands, or reports why it could not.
 *
 * Assembling them fails in more ways than a manifest that will not parse: Commander itself throws when
 * two entries kebab-case to the same command name, and when a computed and a switch produce the same
 * flag. Those are problems in the user's manifest, so they must not take the CLI down before `guide`
 * and `--help` can be asked for. A defect in stub itself is rethrown instead — reporting it as a bad
 * manifest would send the user looking in the wrong place. A failure part way through leaves the
 * commands registered so far in place, which is fine: nothing has run yet.
 */
export const tryRegisterTemplateCommands = (
    program: Command,
    projectRoot: string,
    settings: Settings,
): string | null => {
    try {
        registerTemplateCommands(program, loadWorkspace(projectRoot, settings));

        return null;
    } catch (cause) {
        if (cause instanceof Error && isInternalError(cause)) {
            throw cause;
        }

        return cause instanceof Error ? cause.message : String(cause);
    }
};
