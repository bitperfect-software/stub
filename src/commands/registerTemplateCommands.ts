import type { Command } from "commander";
import { registerTemplateCommand } from "commands/registerTemplateCommand.ts";
import type { Workspace } from "workspace/Workspace.ts";

/** One subcommand per manifest template, in manifest order. */
export const registerTemplateCommands = (program: Command, workspace: Workspace) => {
    Object.entries(workspace.manifest.templates).forEach(([templateName, definition]) => {
        registerTemplateCommand(program, workspace, templateName, definition);
    });
};
