import { findTemplate } from "manifest/findTemplate.ts";
import { resolveTemplateChain } from "manifest/resolveTemplateChain.ts";
import type {
    ComputedDefinition,
    Manifest,
    SwitchDefinition,
    TemplateDefinition,
    VariableDefinition,
} from "manifest/manifestSchema.ts";

/** Everything a template needs from the user, and therefore everything its command must expose. */
export interface InputDefinitions {
    readonly variables: Array<VariableDefinition>;
    readonly computed: Array<ComputedDefinition>;
    readonly switches: Array<SwitchDefinition>;
}

const dedupeByName = <T extends { name: string }>(items: Array<T>): Array<T> =>
    items.filter((item, index) => items.findIndex((other) => other.name === item.name) === index);

/**
 * The manifest globals plus the template's own declarations plus those of everything it requires,
 * deduped by name. The first declaration of a name wins, so a global beats a template-local one.
 */
export const collectInputDefinitions = (manifest: Manifest, templateName: string): InputDefinitions => {
    const declaringTemplates = resolveTemplateChain(manifest, templateName)
        .map((name) => findTemplate(manifest, name))
        .filter((definition): definition is TemplateDefinition => definition !== undefined);

    const collect = <T extends { name: string }>(
        globals: Array<T>,
        select: (definition: TemplateDefinition) => Array<T>,
    ): Array<T> => dedupeByName([...globals, ...declaringTemplates.flatMap(select)]);

    return {
        variables: collect(manifest.variables, (definition) => definition.variables),
        computed: collect(manifest.computed, (definition) => definition.computed),
        switches: collect(manifest.switches, (definition) => definition.switches),
    };
};
