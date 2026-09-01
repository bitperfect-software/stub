import * as path from "node:path";
import { getTemplate } from "manifest/getTemplate.ts";
import { resolveTemplateChain } from "manifest/resolveTemplateChain.ts";
import { deriveTemplateScope } from "render/deriveTemplateScope.ts";
import { resolveTemplateTargets } from "render/resolveTemplateTargets.ts";
import { renderTemplateFile, type RenderScope } from "templates/renderLiquid.ts";
import type { PlannedWrite } from "render/PlannedWrite.ts";
import type { Workspace } from "workspace/Workspace.ts";

export interface RenderRequest {
    readonly templateName: string;
    /** Raw CLI input: the positional variables plus the options the user actually passed. */
    readonly input: RenderScope;
    readonly includeRequires: boolean;
}

/** manifest + CLI input -> the complete list of files this run would write. Writes nothing. */
export const planTemplateWrites = (
    { manifest, engine, projectRoot }: Workspace,
    { templateName, input, includeRequires }: RenderRequest,
): Array<PlannedWrite> => {
    const templateNames = includeRequires ? resolveTemplateChain(manifest, templateName) : [templateName];

    // Resolved once for the whole manifest, before anything renders: what a body reads through
    // `{% path %}` is then the very value written below, not a second rendering that has to agree.
    const targets = resolveTemplateTargets(engine, manifest, input);

    return templateNames.map((currentName) => {
        const definition = getTemplate(manifest, currentName);
        const target = targets[currentName];

        // Unreachable: `getTemplate` has already rejected names the manifest lacks, and every name it
        // accepts has a target.
        if (target === undefined) throw new Error(`Unknown template ${currentName}`);

        // Every template derives its own computed values from the raw input, never from a parent's scope.
        const scope = deriveTemplateScope(engine, manifest, definition, input);

        return {
            templateName: currentName,
            targetPath: path.join(projectRoot, target.path),
            contents: renderTemplateFile(engine, currentName, scope, targets),
        };
    });
};
