import type { Liquid } from "liquidjs";
import type { ResolvedTarget } from "templates/ResolvedTarget.ts";
import { templateTargetsScopeKey } from "templates/templateTargetsScopeKey.ts";

/** Variables handed to Liquid: the raw CLI input plus every derived (computed) value. */
export type RenderScope = Record<string, unknown>;

/**
 * Renders an inline Liquid expression from the manifest — a `computed.value`, a `path` or a
 * `reference` format. Deliberately passes no targets: that is what keeps `{% path %}` out of the
 * expressions the targets are built from, and therefore out of a cycle.
 */
export const renderExpression = (engine: Liquid, source: string, scope: RenderScope): string =>
    String(engine.parseAndRenderSync(source, scope));

/**
 * Renders `<stubDir>/<templateName><templateExtension>`; the engine resolves root and extension.
 *
 * `targets` reaches `{% path %}` and `{% reference %}` as Liquid globals rather than as scope, so no
 * manifest name can shadow it and `{% render %}` partials still see it. It is a required parameter
 * because a caller that omitted it would leave those tags failing at render time.
 */
export const renderTemplateFile = (
    engine: Liquid,
    templateName: string,
    scope: RenderScope,
    targets: Record<string, ResolvedTarget>,
): string => String(engine.renderFileSync(templateName, scope, { globals: { [templateTargetsScopeKey]: targets } }));
