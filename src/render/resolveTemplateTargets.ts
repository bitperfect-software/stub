import type { Liquid } from "liquidjs";
import type { Manifest, TemplateDefinition } from "manifest/manifestSchema.ts";
import { deriveTemplateScope } from "render/deriveTemplateScope.ts";
import type { ResolvedTarget } from "templates/ResolvedTarget.ts";
import { renderExpression, type RenderScope } from "templates/renderLiquid.ts";

/** The name a `reference` record may use for the format `{% reference %}` picks with no `as:`. */
const defaultReferenceName = "default";

const resolveTarget = (
    engine: Liquid,
    manifest: Manifest,
    definition: TemplateDefinition,
    input: RenderScope,
): ResolvedTarget => {
    const scope = deriveTemplateScope(engine, manifest, definition, input);
    const path = renderExpression(engine, definition.path, scope);
    // A format describes its target, so it sees the target's own scope, plus the path that produced.
    const renderFormat = (format: string): string => renderExpression(engine, format, { ...scope, targetPath: path });

    if (typeof manifest.reference === "string") {
        return { path, references: {}, defaultReference: renderFormat(manifest.reference) };
    }

    const references = Object.fromEntries(
        Object.entries(manifest.reference).map(([formatName, format]): [string, string] => [
            formatName,
            renderFormat(format),
        ]),
    );

    return { path, references, defaultReference: references[defaultReferenceName] ?? null };
};

/**
 * Every manifest entry's resolved output, keyed by template name: the values `{% path %}` and
 * `{% reference %}` read, and the paths the write plan writes to.
 *
 * Resolved for the whole manifest rather than for the chain, because a body may reference a sibling
 * this invocation does not write (`--noRequires`, or a template with no `requires` at all). Resolving
 * a target for an unrendered template is safe: Liquid is not strict here, so a variable this run
 * never asked for renders empty instead of throwing.
 *
 * None of these scopes contain the map, which is what makes `{% path %}` non-recursive by
 * construction: a `path` or `reference` expression cannot consult a target, so materialising the map
 * can never re-enter it.
 */
export const resolveTemplateTargets = (
    engine: Liquid,
    manifest: Manifest,
    input: RenderScope,
): Record<string, ResolvedTarget> =>
    Object.fromEntries(
        Object.entries(manifest.templates).map(([templateName, definition]): [string, ResolvedTarget] => [
            templateName,
            resolveTarget(engine, manifest, definition, input),
        ]),
    );
