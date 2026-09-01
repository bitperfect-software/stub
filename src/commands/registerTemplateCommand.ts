import type { Command } from "commander";
import { kebabCase } from "change-case";
import { readGlobalOptions } from "commands/globalOptions.ts";
import { runTemplateCommand } from "commands/runTemplateCommand.ts";
import { collectInputDefinitions } from "manifest/collectInputDefinitions.ts";
import type { TemplateDefinition } from "manifest/manifestSchema.ts";
import type { RenderScope } from "templates/renderLiquid.ts";
import type { Workspace } from "workspace/Workspace.ts";

/**
 * Maps one manifest entry onto Commander: variables become positional `<args>`, computed become
 * `--name <value>` overrides, and switches become boolean flags.
 */
export const registerTemplateCommand = (
    program: Command,
    workspace: Workspace,
    templateName: string,
    definition: TemplateDefinition,
) => {
    const { variables, computed, switches } = collectInputDefinitions(workspace.manifest, templateName);

    const command = program
        .command(kebabCase(templateName))
        .description(definition.description ?? `Create a new ${templateName}`);

    variables.forEach(({ name, description }) => {
        command.argument(`<${name}>`, description);
    });

    // No Commander default: an unset option stays absent from opts(), so `deriveScope` can tell an
    // explicit override from a value it still has to derive. The expression goes in the description
    // because Commander only prints a default when defaultValue !== undefined.
    computed.forEach(({ name, description, value }) => {
        command.option(`--${name} <value>`, `${description} (default: ${value})`);
    });

    switches.forEach(({ name, description }) => {
        command.option(`--${name}`, description);
    });

    // Commander passes one argument per declared positional, then the parsed options object.
    command.action((...commanderArgs: Array<unknown>) => {
        runTemplateCommand(workspace, {
            templateName,
            input: {
                ...Object.fromEntries(variables.map(({ name }, index) => [name, commanderArgs[index]])),
                ...(commanderArgs[variables.length] as RenderScope),
            },
            ...readGlobalOptions(program),
        });
    });
};
