#!/usr/bin/env node
import { createProgram } from "commands/createProgram.ts";
import { needsWorkspace } from "commands/needsWorkspace.ts";
import { registerGuideCommand } from "commands/registerGuideCommand.ts";
import { registerManifestFailureNotice } from "commands/registerManifestFailureNotice.ts";
import { reportFatalError } from "commands/reportFatalError.ts";
import { tryRegisterTemplateCommands } from "commands/tryRegisterTemplateCommands.ts";
import { resolveSettings } from "settings/resolveSettings.ts";
import { findProjectRoot } from "workspace/findProjectRoot.ts";

/**
 * Composition root. Its one rule: `guide`, `--help` and `--version` are what someone runs *before*
 * there is a project, or when the one they have is broken, so nothing on the way to them may depend
 * on a readable manifest.
 */
const run = () => {
    const settings = resolveSettings();
    const projectRoot = findProjectRoot(process.cwd(), settings.stubDirName);
    const workspaceRequired = needsWorkspace(process.argv);

    if (projectRoot === null && workspaceRequired) {
        console.error(`Could not find a ${settings.stubDirName} directory in ${process.cwd()} or any parent directory`);
        console.error("Run `stub guide` to see how to set one up");
        process.exit(1);
    }

    const program = createProgram();

    // A manifest that will not parse, two entries that kebab-case to the same command name, a computed
    // and a switch that produce the same flag: all of them throw while the commands are being built.
    const failure = projectRoot === null ? null : tryRegisterTemplateCommands(program, projectRoot, settings);

    // Registered after the template commands, so a manifest that declares a `guide` entry still wins
    // the dispatch — Commander resolves to the first command whose name matches.
    registerGuideCommand(program);

    if (failure !== null) {
        // An invocation that actually asked for a template command deserves the reason, not
        // Commander's "unknown command". One that did not gets on with its life.
        if (workspaceRequired) throw new Error(failure);

        registerManifestFailureNotice(program, failure);
    }

    program.parse();
};

try {
    run();
} catch (error) {
    reportFatalError(error);
}
